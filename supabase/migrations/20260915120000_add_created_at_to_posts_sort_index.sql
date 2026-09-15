-- 일괄 발행으로 sort_date(published_at)가 같은 포스트가 다수 존재한다.
-- 2차 키가 uuid인 id뿐이면 작성 순서와 무관하게 섞이므로
-- queries.ts의 정렬 (sort_date desc, created_at desc, id desc)에 맞춰 인덱스를 교체한다.

DROP INDEX IF EXISTS public.posts_published_sort_idx;

-- 메인 피드 / 태그 페이지용
CREATE INDEX IF NOT EXISTS posts_published_sort_idx
  ON public.posts (sort_date DESC, created_at DESC, id DESC)
  WHERE status = 'published';
