-- =============================================================
-- 1. post_views 테이블: 조회 이력 추적 (로그인 사용자 식별)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX idx_post_views_user_id ON public.post_views(user_id);

-- RLS
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_views_select_admin" ON public.post_views
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "post_views_insert_all" ON public.post_views
  FOR INSERT WITH CHECK (true);

-- =============================================================
-- 2. increment_post_view_count 업데이트: post_views 테이블에 기록
-- =============================================================

CREATE OR REPLACE FUNCTION increment_post_view_count(post_slug text, viewer_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  target_post_id uuid;
  new_count integer;
BEGIN
  SELECT id INTO target_post_id FROM public.posts WHERE slug = post_slug;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- 조회 이력 기록
  INSERT INTO public.post_views (post_id, user_id) VALUES (target_post_id, viewer_id);

  -- view_count 증가
  UPDATE public.posts SET view_count = view_count + 1 WHERE id = target_post_id
  RETURNING view_count INTO new_count;

  RETURN new_count;
END;
$fn$;

-- =============================================================
-- 3. toggle_post_like 업데이트: post_likes 테이블 사용 (인증 필수)
-- =============================================================

CREATE OR REPLACE FUNCTION toggle_post_like(post_slug text, liker_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  target_post_id uuid;
  already_liked boolean;
  new_count integer;
BEGIN
  SELECT id INTO target_post_id FROM public.posts WHERE slug = post_slug;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- 기존 좋아요 여부 확인
  SELECT EXISTS(
    SELECT 1 FROM public.post_likes WHERE post_id = target_post_id AND user_id = liker_id
  ) INTO already_liked;

  IF already_liked THEN
    -- 좋아요 취소
    DELETE FROM public.post_likes WHERE post_id = target_post_id AND user_id = liker_id;
    UPDATE public.posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = target_post_id
    RETURNING like_count INTO new_count;
    RETURN json_build_object('liked', false, 'likeCount', new_count);
  ELSE
    -- 좋아요 추가
    INSERT INTO public.post_likes (post_id, user_id) VALUES (target_post_id, liker_id);
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = target_post_id
    RETURNING like_count INTO new_count;
    RETURN json_build_object('liked', true, 'likeCount', new_count);
  END IF;
END;
$fn$;
