-- 정렬 인덱스를 실제 쿼리 패턴에 맞게 교체.
--
-- 이전의 posts_sort_date_desc_idx는 단일 컬럼이라
-- status='published' 필터가 인덱스에서 해결되지 않았다.
-- (published 비율이 낮을수록 draft 튜플까지 읽고 버려야 함.)
--
-- 또한 sort_date 동률 시 페이지네이션 중복/누락 방지를 위해
-- 2차 키(id)를 인덱스에 포함하여 .order("id") tie-breaker와 맞춘다.

DROP INDEX IF EXISTS public.posts_sort_date_desc_idx;

-- 메인 피드 / 태그 페이지용
CREATE INDEX IF NOT EXISTS posts_published_sort_idx
  ON public.posts (sort_date DESC, id DESC)
  WHERE status = 'published';

-- Featured 섹션 전용 (featured=true는 selectivity가 높음)
CREATE INDEX IF NOT EXISTS posts_featured_sort_idx
  ON public.posts (sort_date DESC)
  WHERE status = 'published' AND featured = true;
