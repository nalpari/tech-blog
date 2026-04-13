-- posts 테이블에 정렬용 generated column 추가.
-- 카드 UI가 표시하는 날짜(published_at ?? created_at)와
-- 목록 정렬 기준을 일치시키기 위함.
-- 쓰기는 불가 (GENERATED ALWAYS). Supabase .order() DSL 호환을 위해 STORED.

ALTER TABLE public.posts
  ADD COLUMN sort_date timestamptz
  GENERATED ALWAYS AS (COALESCE(published_at, created_at)) STORED;

CREATE INDEX IF NOT EXISTS posts_sort_date_desc_idx
  ON public.posts (sort_date DESC);
