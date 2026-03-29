-- posts 테이블에 like_count 컬럼 추가
ALTER TABLE posts ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0;

-- 좋아요 토글 RPC 함수 생성
CREATE OR REPLACE FUNCTION toggle_post_like(post_slug text, should_like boolean)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  current_count integer;
BEGIN
  IF should_like THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE slug = post_slug
    RETURNING like_count INTO current_count;
  ELSE
    UPDATE public.posts SET like_count = GREATEST(like_count - 1, 0) WHERE slug = post_slug
    RETURNING like_count INTO current_count;
  END IF;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  RETURN current_count;
END;
$fn$;
