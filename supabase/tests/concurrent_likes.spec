# 실제 PostgreSQL의 src/test/isolation/isolationtester로 실행할 다중 연결 검증.
# isolationtester "$LOCAL_DATABASE_URL" < supabase/tests/concurrent_likes.spec
# 후속 migration을 적용한 전용 테스트 DB에서만 실행한다. 운영 DB 사용 금지.
# 시작 상태가 좋아요 없음/있음일 때 모두 두 토글 후 카운트와 실제 행이 일치해야 한다.
setup
{
  INSERT INTO auth.users (id, email) VALUES
    ('00000000-0000-4000-d000-000000000001', 'concurrency@regression.invalid');
  INSERT INTO public.posts (id, author_id, slug, title, status) VALUES
    ('00000000-0000-4000-d000-000000000002', '00000000-0000-4000-d000-000000000001', 'concurrency-regression', 'Concurrency test', 'published');
}

teardown
{
  DELETE FROM auth.users WHERE id = '00000000-0000-4000-d000-000000000001';
}

session "first"
setup
{
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-d000-000000000001', false);
  SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-000000000001","role":"authenticated"}', false);
}
step "seed" { SELECT public.toggle_post_like('concurrency-regression', auth.uid()); }
step "first_begin" { BEGIN; }
step "first_toggle" { SELECT public.toggle_post_like('concurrency-regression', auth.uid()); }
step "first_commit" { COMMIT; }

session "second"
setup
{
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-d000-000000000001', false);
  SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-000000000001","role":"authenticated"}', false);
}
step "second_begin" { BEGIN; }
step "second_toggle" { SELECT public.toggle_post_like('concurrency-regression', auth.uid()); }
step "second_commit" { COMMIT; }

session "check"
step "check_zero"
{
  DO $$ BEGIN
    IF (SELECT like_count FROM public.posts WHERE slug = 'concurrency-regression') <> 0
      OR EXISTS (SELECT 1 FROM public.post_likes WHERE post_id = '00000000-0000-4000-d000-000000000002') THEN
      RAISE EXCEPTION 'Two concurrent toggles from unliked must finish unliked with count zero';
    END IF;
  END $$;
}
step "check_one"
{
  DO $$ BEGIN
    IF (SELECT like_count FROM public.posts WHERE slug = 'concurrency-regression') <> 1
      OR (SELECT count(*) FROM public.post_likes WHERE post_id = '00000000-0000-4000-d000-000000000002') <> 1 THEN
      RAISE EXCEPTION 'Two concurrent toggles from liked must finish liked with count one';
    END IF;
  END $$;
}

permutation "first_begin" "second_begin" "first_toggle" "second_toggle" "first_commit" "second_commit" "check_zero"
permutation "seed" "first_begin" "second_begin" "first_toggle" "second_toggle" "first_commit" "second_commit" "check_one"
