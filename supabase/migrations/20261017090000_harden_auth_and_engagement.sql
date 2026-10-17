-- 사용자 신원·역할과 활동 카운터를 DB 권한 경계에서 보호한다.
-- 전체 파일을 하나의 트랜잭션으로 적용해야 권한 변경과 카운트 보정이 원자적이다.
-- 기존 admin/author 역할은 자동 강등하지 않는다. 배포 전 정당한 계정인지 별도 감사한다.

-- 테이블 UPDATE 권한이 남아 있으면 컬럼 단위 REVOKE만으로 role을 보호할 수 없다.
-- 기존 컬럼 권한도 함께 회수한 뒤 사용자 편집용 컬럼만 다시 허용한다.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (username, display_name, avatar_url, bio) ON public.profiles TO authenticated;

-- 직접 쓰기는 카운트 갱신과 published/auth.uid() 검사를 우회하므로 RPC로 한정한다.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.post_likes FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.post_views FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS post_likes_insert ON public.post_likes;
DROP POLICY IF EXISTS post_likes_delete ON public.post_likes;
DROP POLICY IF EXISTS post_views_insert_all ON public.post_views;

-- 인자 타입/개수가 다른 CREATE OR REPLACE는 구형 함수를 제거하지 않는다.
DROP FUNCTION IF EXISTS public.toggle_post_like(text, boolean);
DROP FUNCTION IF EXISTS public.increment_post_view_count(text);

CREATE OR REPLACE FUNCTION public.toggle_post_like(post_slug text, liker_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  actor_id uuid := auth.uid();
  target_post_id uuid;
  removed_count integer;
  new_count integer;
  is_liked boolean;
BEGIN
  IF actor_id IS NULL OR liker_id IS DISTINCT FROM actor_id THEN
    RAISE EXCEPTION 'Authenticated user must match liker_id' USING ERRCODE = '42501';
  END IF;

  -- 상태 판정 전에 잠가 같은 글의 모든 토글을 직렬화한다.
  -- 공개 취소/삭제와도 경합하므로 잠금을 얻은 뒤 published 조건이 다시 검사된다.
  SELECT id INTO target_post_id
  FROM public.posts
  WHERE slug = post_slug AND status = 'published'
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  DELETE FROM public.post_likes
  WHERE post_id = target_post_id AND user_id = actor_id;
  GET DIAGNOSTICS removed_count = ROW_COUNT;

  IF removed_count = 0 THEN
    INSERT INTO public.post_likes (post_id, user_id) VALUES (target_post_id, actor_id);
    is_liked := true;
  ELSE
    is_liked := false;
  END IF;

  UPDATE public.posts
  SET like_count = GREATEST(like_count + CASE WHEN is_liked THEN 1 ELSE -1 END, 0)
  WHERE id = target_post_id
  RETURNING like_count INTO new_count;

  RETURN json_build_object('liked', is_liked, 'likeCount', new_count);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.increment_post_view_count(post_slug text, viewer_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  actor_id uuid := auth.uid();
  target_post_id uuid;
  new_count integer;
BEGIN
  -- 기존 API의 선택 인자는 유지하되 신원은 JWT에서만 결정한다.
  -- 로그인 사용자가 NULL을 전달해도 자신의 조회로 기록된다.
  IF viewer_id IS NOT NULL AND viewer_id IS DISTINCT FROM actor_id THEN
    RAISE EXCEPTION 'Authenticated user must match viewer_id' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO target_post_id
  FROM public.posts
  WHERE slug = post_slug AND status = 'published'
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.post_views (post_id, user_id) VALUES (target_post_id, actor_id);
  UPDATE public.posts SET view_count = view_count + 1 WHERE id = target_post_id
  RETURNING view_count INTO new_count;
  RETURN new_count;
END;
$fn$;

-- CREATE OR REPLACE는 기존 ACL을 보존하므로 PUBLIC과 anon 권한을 명시적으로 회수한다.
REVOKE ALL ON FUNCTION public.toggle_post_like(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_post_like(text, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.increment_post_view_count(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_post_view_count(text, uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  candidate_username text := 'user_' || replace(new.id::text, '-', '');
BEGIN
  LOOP
    INSERT INTO public.profiles (id, username, display_name, avatar_url, role)
    VALUES (
      new.id,
      candidate_username,
      coalesce(
        nullif(new.raw_user_meta_data ->> 'display_name', ''),
        nullif(new.raw_user_meta_data ->> 'username', ''),
        nullif(split_part(new.email, '@', 1), ''),
        '사용자'
      ),
      new.raw_user_meta_data ->> 'avatar_url',
      'user'
    )
    ON CONFLICT (username) DO NOTHING;
    EXIT WHEN FOUND;

    -- 기존 사용자가 UUID 기반 이름을 선점했거나 동시에 변경해도 가입을 실패시키지 않는다.
    candidate_username := 'user_' || replace(gen_random_uuid()::text, '-', '');
  END LOOP;
  RETURN new;
END;
$fn$;

-- 구형 RPC/직접 쓰기로 어긋났을 수 있는 카운터를 실제 좋아요 행 수에 맞춘다.
-- 보정 도중 새 활동이 들어오지 않도록 두 테이블의 쓰기를 막는다.
LOCK TABLE public.posts, public.post_likes IN SHARE ROW EXCLUSIVE MODE;
UPDATE public.posts AS p
SET like_count = counts.actual_count
FROM (
  SELECT p2.id, count(l.user_id)::integer AS actual_count
  FROM public.posts AS p2
  LEFT JOIN public.post_likes AS l ON l.post_id = p2.id
  GROUP BY p2.id
) AS counts
WHERE p.id = counts.id AND p.like_count IS DISTINCT FROM counts.actual_count;
