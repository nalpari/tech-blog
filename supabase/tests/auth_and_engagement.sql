-- 후속 마이그레이션을 적용한 로컬/테스트 DB에서 DB 소유자로 실행한다.
-- psql -v ON_ERROR_STOP=1 "$LOCAL_DATABASE_URL" -f supabase/tests/auth_and_engagement.sql
-- 운영 DB에서는 실행하지 않는다. 모든 테스트 데이터는 마지막에 ROLLBACK한다.
BEGIN;

CREATE FUNCTION pg_temp.assert_true(actual boolean, message text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF actual IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Assertion failed: %', message;
  END IF;
END;
$$;

CREATE FUNCTION pg_temp.assert_denied(statement text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE statement;
  EXCEPTION WHEN insufficient_privilege THEN
    RETURN;
  END;
  RAISE EXCEPTION 'Expected insufficient_privilege: %', statement;
END;
$$;

SELECT pg_temp.assert_true(to_regprocedure('public.toggle_post_like(text,boolean)') IS NULL, 'legacy like overload removed');
SELECT pg_temp.assert_true(to_regprocedure('public.increment_post_view_count(text)') IS NULL, 'legacy view overload removed');
SELECT pg_temp.assert_true(NOT has_function_privilege('anon', 'public.toggle_post_like(text,uuid)', 'EXECUTE'), 'anonymous like denied');
SELECT pg_temp.assert_true(has_function_privilege('anon', 'public.increment_post_view_count(text,uuid)', 'EXECUTE'), 'anonymous view allowed');
SELECT pg_temp.assert_true(NOT has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE'), 'role column protected');

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-a000-000000000001', 'same-name@regression.invalid', '{"username":"duplicate","role":"admin"}');
-- UUID로 만든 기본 이름도 기존 사용자와 충돌할 때 가입이 성공해야 한다.
UPDATE public.profiles SET username = 'user_0000000000004000a000000000000002'
WHERE id = '00000000-0000-4000-a000-000000000001';
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-a000-000000000002', 'same-name@other-regression.invalid', '{"username":"duplicate","role":"admin"}');
SELECT pg_temp.assert_true(
  (SELECT count(*) = 2 AND count(DISTINCT username) = 2 AND bool_and(role = 'user')
   FROM public.profiles WHERE id IN ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000002')),
  'same email prefix / metadata username / reserved generated username do not break signup or grant admin'
);

INSERT INTO public.posts (id, author_id, slug, title, status) VALUES
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000001', 'regression-published', 'Published test', 'published'),
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000001', 'regression-draft', 'Draft test', 'draft');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-a000-000000000001', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000001","role":"authenticated"}', true);
SELECT pg_temp.assert_denied($sql$UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid()$sql$);
SELECT pg_temp.assert_denied($sql$UPDATE public.profiles SET id = '00000000-0000-4000-a000-000000000003' WHERE id = auth.uid()$sql$);
UPDATE public.profiles SET display_name = 'Allowed edit' WHERE id = auth.uid();
SELECT pg_temp.assert_true((SELECT display_name = 'Allowed edit' FROM public.profiles WHERE id = auth.uid()), 'own display name remains editable');
UPDATE public.profiles SET display_name = 'Forbidden edit' WHERE id = '00000000-0000-4000-a000-000000000002';
SELECT pg_temp.assert_true((SELECT display_name = 'duplicate' FROM public.profiles WHERE id = '00000000-0000-4000-a000-000000000002'), 'other profile remains protected by RLS');

SELECT pg_temp.assert_denied($sql$SELECT public.toggle_post_like('regression-published', '00000000-0000-4000-a000-000000000002')$sql$);
SELECT pg_temp.assert_denied($sql$SELECT public.toggle_post_like('regression-published', NULL)$sql$);
SELECT pg_temp.assert_denied($sql$SELECT public.increment_post_view_count('regression-published', '00000000-0000-4000-a000-000000000002')$sql$);
SELECT pg_temp.assert_denied($sql$INSERT INTO public.post_views (post_id, user_id) VALUES ('00000000-0000-4000-b000-000000000001', auth.uid())$sql$);
SELECT pg_temp.assert_denied($sql$INSERT INTO public.post_likes (post_id, user_id) VALUES ('00000000-0000-4000-b000-000000000001', auth.uid())$sql$);
SELECT pg_temp.assert_denied($sql$DELETE FROM public.post_likes WHERE user_id = auth.uid()$sql$);
SELECT pg_temp.assert_true(public.toggle_post_like('regression-draft', auth.uid()) IS NULL, 'draft like refused even for author');
SELECT pg_temp.assert_true(public.increment_post_view_count('regression-draft', NULL) IS NULL, 'draft view refused even for author');
SELECT pg_temp.assert_true(public.toggle_post_like('missing-regression-post', auth.uid()) IS NULL, 'missing like returns null');
SELECT pg_temp.assert_true(public.increment_post_view_count('missing-regression-post', NULL) IS NULL, 'missing view returns null');
SELECT pg_temp.assert_true(public.toggle_post_like('regression-published', auth.uid())::jsonb = '{"liked":true,"likeCount":1}'::jsonb, 'first toggle inserts one like');
SELECT pg_temp.assert_true(public.toggle_post_like('regression-published', auth.uid())::jsonb = '{"liked":false,"likeCount":0}'::jsonb, 'second toggle removes one like');
SELECT pg_temp.assert_true(public.toggle_post_like('regression-published', auth.uid())::jsonb = '{"liked":true,"likeCount":1}'::jsonb, 'third toggle inserts one like');
SELECT pg_temp.assert_true(public.increment_post_view_count('regression-published') = 1, 'omitted viewer uses JWT');
SELECT pg_temp.assert_true(public.increment_post_view_count('regression-published', NULL) = 2, 'null viewer uses JWT');

RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
SELECT pg_temp.assert_denied($sql$SELECT public.toggle_post_like('regression-published', '00000000-0000-4000-a000-000000000001')$sql$);
SELECT pg_temp.assert_denied($sql$SELECT public.increment_post_view_count('regression-published', '00000000-0000-4000-a000-000000000001')$sql$);
SELECT pg_temp.assert_denied($sql$INSERT INTO public.post_views (post_id) VALUES ('00000000-0000-4000-b000-000000000001')$sql$);
SELECT pg_temp.assert_true(public.increment_post_view_count('regression-draft') IS NULL, 'anonymous draft view refused');
SELECT pg_temp.assert_true(public.increment_post_view_count('regression-published') = 3, 'anonymous public view allowed');

RESET ROLE;
SELECT pg_temp.assert_true(
  (SELECT count(*) = 3 AND count(user_id) = 2 AND bool_and(user_id IS NULL OR user_id = '00000000-0000-4000-a000-000000000001')
   FROM public.post_views WHERE post_id = '00000000-0000-4000-b000-000000000001'),
  'view identities originate only from JWT, with null anonymous identity'
);
SELECT pg_temp.assert_true(
  (SELECT like_count = (SELECT count(*) FROM public.post_likes WHERE post_id = p.id)
   FROM public.posts p WHERE id = '00000000-0000-4000-b000-000000000001'),
  'like count matches relation rows'
);
SELECT pg_temp.assert_true(
  (SELECT like_count = 0 AND view_count = 0 FROM public.posts WHERE id = '00000000-0000-4000-b000-000000000002'),
  'draft counters remain unchanged'
);

ROLLBACK;
