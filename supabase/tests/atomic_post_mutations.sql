-- 로컬 전용. 실제 RPC에 실패를 주입하고 변경 전체가 롤백되는지 검증한다.
BEGIN;
CREATE FUNCTION pg_temp.assert_true(actual boolean, message text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF actual IS DISTINCT FROM true THEN RAISE EXCEPTION 'Assertion failed: %', message; END IF;
END;
$$;
CREATE FUNCTION pg_temp.assert_denied(statement text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  BEGIN EXECUTE statement;
  EXCEPTION WHEN insufficient_privilege THEN RETURN;
  END;
  RAISE EXCEPTION 'Expected insufficient_privilege: %', statement;
END;
$$;

INSERT INTO auth.users(id, email) VALUES
  ('10000000-0000-4000-a000-000000000001', 'yoo32767@gmail.com'),
  ('10000000-0000-4000-a000-000000000002', 'atomic-reader@regression.invalid');
INSERT INTO public.tags(id, slug, name) VALUES
  ('10000000-0000-4000-c000-000000000001', 'atomic-original', 'Original'),
  ('10000000-0000-4000-c000-000000000002', 'atomic-replacement', 'Replacement');

SELECT pg_temp.assert_true(NOT has_function_privilege('anon', 'public.save_post_with_tags(uuid,jsonb,uuid[])', 'EXECUTE'), 'anonymous save denied');
SELECT pg_temp.assert_true(NOT has_function_privilege('anon', 'public.delete_post_with_cleanup(uuid)', 'EXECUTE'), 'anonymous delete denied');
SELECT pg_temp.assert_true(NOT has_function_privilege('anon', 'public.get_post_image_references()', 'EXECUTE'), 'anonymous private reference read denied');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-4000-a000-000000000002', true);
SELECT pg_temp.assert_denied($sql$SELECT public.save_post_with_tags(NULL, '{"slug":"forged-save","title":"Denied","content":"Denied","status":"draft"}', '{}')$sql$);
SELECT pg_temp.assert_denied($sql$SELECT public.delete_post_with_cleanup('10000000-0000-4000-b000-000000000001')$sql$);
SELECT pg_temp.assert_denied($sql$SELECT public.get_post_image_references()$sql$);
SELECT pg_temp.assert_true((SELECT count(*) = 0 FROM public.post_image_cleanup_jobs), 'non-admin cannot see cleanup queue');

SELECT set_config('request.jwt.claim.sub', '10000000-0000-4000-a000-000000000001', true);
DO $$
DECLARE
  result jsonb;
  saved_post_id uuid;
  initial_published_at timestamptz;
BEGIN
  result := public.save_post_with_tags(NULL,
    '{"slug":"atomic-original","title":"Original","content":"Original body","status":"published","cover_image":"https://example.invalid/image.png"}',
    ARRAY['10000000-0000-4000-c000-000000000001']::uuid[]);
  saved_post_id := (result ->> 'id')::uuid;
  SELECT published_at INTO initial_published_at FROM public.posts WHERE id = saved_post_id;
  PERFORM pg_temp.assert_true(initial_published_at IS NOT NULL, 'first publication is timestamped');

  BEGIN
    PERFORM public.save_post_with_tags(saved_post_id,
      '{"slug":"atomic-changed","title":"Changed","content":"Changed body","status":"draft"}',
      ARRAY['10000000-0000-4000-c000-000000000099']::uuid[]);
    RAISE EXCEPTION 'Expected tag FK failure';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  PERFORM pg_temp.assert_true((SELECT title = 'Original' AND content = 'Original body' AND slug = 'atomic-original' AND status = 'published' FROM public.posts WHERE id = saved_post_id), 'failed replacement rolls back full post');
  PERFORM pg_temp.assert_true((SELECT count(*) = 1 AND min(tag_id::text) = '10000000-0000-4000-c000-000000000001' FROM public.post_tags WHERE post_tags.post_id = saved_post_id), 'failed replacement preserves original tags');

  BEGIN
    PERFORM public.save_post_with_tags(NULL,
      '{"slug":"atomic-orphan","title":"Orphan","content":"Orphan body","status":"draft"}',
      ARRAY['10000000-0000-4000-c000-000000000099']::uuid[]);
    RAISE EXCEPTION 'Expected create tag FK failure';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  PERFORM pg_temp.assert_true(NOT EXISTS(SELECT 1 FROM public.posts WHERE slug = 'atomic-orphan'), 'failed create leaves no orphan post');
  PERFORM pg_temp.assert_true(NOT EXISTS(SELECT 1 FROM public.post_image_cleanup_jobs), 'rolled-back create never enqueues cleanup');

  result := public.save_post_with_tags(saved_post_id,
    '{"slug":"atomic-changed","title":"Changed","content":"Changed body","status":"published","cover_image":"https://example.invalid/image.png"}',
    ARRAY['10000000-0000-4000-c000-000000000002', '10000000-0000-4000-c000-000000000002']::uuid[]);
  PERFORM pg_temp.assert_true(result ->> 'previous_slug' = 'atomic-original', 'old slug is returned from locked row');
  PERFORM pg_temp.assert_true((SELECT published_at = initial_published_at FROM public.posts WHERE id = saved_post_id), 'published edit preserves original publication time');
  PERFORM pg_temp.assert_true((SELECT count(*) = 1 AND min(tag_id::text) = '10000000-0000-4000-c000-000000000002' FROM public.post_tags WHERE post_tags.post_id = saved_post_id), 'successful save replaces and deduplicates tags');

  BEGIN
    PERFORM public.save_post_with_tags(saved_post_id,
      '{"slug":"React_19","title":"Invalid","content":"Invalid body","status":"published"}', '{}');
    RAISE EXCEPTION 'Expected slug rejection';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
END;
$$;

RESET ROLE;
CREATE FUNCTION pg_temp.reject_cleanup_enqueue() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Injected queue failure'; END;
$$;
CREATE TRIGGER regression_cleanup_failure BEFORE INSERT ON public.post_image_cleanup_jobs
FOR EACH ROW EXECUTE FUNCTION pg_temp.reject_cleanup_enqueue();
SET LOCAL ROLE authenticated;
DO $$
DECLARE target_id uuid;
BEGIN
  SELECT id INTO target_id FROM public.posts WHERE slug = 'atomic-changed';
  BEGIN
    PERFORM public.delete_post_with_cleanup(target_id);
    RAISE EXCEPTION 'Expected queue failure';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Injected queue failure' THEN RAISE; END IF;
  END;
  PERFORM pg_temp.assert_true(EXISTS(SELECT 1 FROM public.posts WHERE id = target_id), 'queue failure rolls back post deletion');
  PERFORM pg_temp.assert_true(EXISTS(SELECT 1 FROM public.post_tags WHERE post_id = target_id), 'queue failure rolls back cascade deletion');
  PERFORM pg_temp.assert_true(NOT EXISTS(SELECT 1 FROM public.post_image_cleanup_jobs), 'failed delete has no committed cleanup job');
END;
$$;
RESET ROLE;
DROP TRIGGER regression_cleanup_failure ON public.post_image_cleanup_jobs;
SET LOCAL ROLE authenticated;
SELECT public.delete_post_with_cleanup((SELECT id FROM public.posts WHERE slug = 'atomic-changed'));
SELECT pg_temp.assert_true(NOT EXISTS(SELECT 1 FROM public.posts WHERE slug = 'atomic-changed'), 'successful delete removes post');
SELECT pg_temp.assert_true((SELECT count(*) = 1 AND bool_and(content = 'Changed body' AND cover_image = 'https://example.invalid/image.png') FROM public.post_image_cleanup_jobs), 'successful delete preserves image snapshot for retry');
RESET ROLE;
ROLLBACK;
