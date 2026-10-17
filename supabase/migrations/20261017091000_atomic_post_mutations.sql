-- 앱 배포 전에 적용한다. ADMIN_EMAIL(src/lib/auth.ts)과 같은 관리자만 허용한다.
-- 기존 profiles.role 값이나 사용자 수정 가능한 JWT user_metadata를 신뢰하지 않는다.
create or replace function public.is_blog_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from auth.users u
    where u.id = auth.uid() and u.email = 'yoo32767@gmail.com'
  );
$$;
revoke all on function public.is_blog_admin() from public, anon;
grant execute on function public.is_blog_admin() to authenticated;

create or replace function public.save_post_with_tags(
  target_post_id uuid,
  post_data jsonb,
  tag_ids uuid[]
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  saved_id uuid;
  old_post public.posts%rowtype;
  desired_slug text := post_data ->> 'slug';
  desired_status text := post_data ->> 'status';
begin
  if not public.is_blog_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;
  if desired_slug is null or length(desired_slug) > 100
     or desired_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     or nullif(btrim(post_data ->> 'title'), '') is null
     or nullif(btrim(post_data ->> 'content'), '') is null
     or desired_status is null or desired_status not in ('draft', 'published') then
    raise exception '잘못된 글 입력입니다.' using errcode = '22023';
  end if;

  if target_post_id is null then
    insert into public.posts (
      author_id, slug, title, content, excerpt, cover_image,
      status, featured, read_time, published_at
    ) values (
      auth.uid(), desired_slug, btrim(post_data ->> 'title'), btrim(post_data ->> 'content'),
      nullif(btrim(post_data ->> 'excerpt'), ''), nullif(post_data ->> 'cover_image', ''),
      desired_status, coalesce((post_data ->> 'featured')::boolean, false), post_data ->> 'read_time',
      case when desired_status = 'published' then now() else null end
    ) returning id into saved_id;
  else
    -- 동시 수정도 글 행 잠금으로 직렬화한다. 발행 시각 결정도 같은 트랜잭션이다.
    select * into old_post from public.posts where id = target_post_id for update;
    if not found then
      raise exception '수정할 글이 없습니다.' using errcode = 'P0002';
    end if;
    update public.posts set
      slug = desired_slug,
      title = btrim(post_data ->> 'title'),
      content = btrim(post_data ->> 'content'),
      excerpt = nullif(btrim(post_data ->> 'excerpt'), ''),
      cover_image = nullif(post_data ->> 'cover_image', ''),
      status = desired_status,
      featured = coalesce((post_data ->> 'featured')::boolean, false),
      read_time = post_data ->> 'read_time',
      published_at = case
        when desired_status = 'published' and old_post.status <> 'published' then now()
        else old_post.published_at
      end
    where id = target_post_id;
    saved_id := target_post_id;
    delete from public.post_tags where post_id = saved_id;
  end if;

  -- FK 검사 실패(다른 화면에서 삭제된 태그 등)는 글 쓰기·기존 태그 삭제까지 모두 롤백한다.
  insert into public.post_tags(post_id, tag_id)
    select saved_id, selected_tag from unnest(coalesce(tag_ids, '{}'::uuid[])) selected_tag
    group by selected_tag;
  return jsonb_build_object('id', saved_id, 'slug', desired_slug, 'previous_slug', old_post.slug);
end;
$$;
revoke all on function public.save_post_with_tags(uuid, jsonb, uuid[]) from public, anon;
grant execute on function public.save_post_with_tags(uuid, jsonb, uuid[]) to authenticated;

-- Storage는 DB 트랜잭션에 참여하지 않는다. 삭제 원본은 DB와 함께 커밋하고 이후 재시도한다.
create table public.post_image_cleanup_jobs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique,
  content text,
  cover_image text,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);
alter table public.post_image_cleanup_jobs enable row level security;
revoke all on public.post_image_cleanup_jobs from public, anon, authenticated;
grant select, delete on public.post_image_cleanup_jobs to authenticated;
grant update(attempts, last_error) on public.post_image_cleanup_jobs to authenticated;
create policy cleanup_admin_select on public.post_image_cleanup_jobs for select to authenticated
  using (public.is_blog_admin());
create policy cleanup_admin_update on public.post_image_cleanup_jobs for update to authenticated
  using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy cleanup_admin_delete on public.post_image_cleanup_jobs for delete to authenticated
  using (public.is_blog_admin());

create or replace function public.enqueue_deleted_post_images()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.post_image_cleanup_jobs(post_id, content, cover_image)
    values (old.id, old.content, old.cover_image);
  return old;
end;
$$;
revoke all on function public.enqueue_deleted_post_images() from public, anon, authenticated;
create trigger posts_enqueue_image_cleanup after delete on public.posts
  for each row execute function public.enqueue_deleted_post_images();

create or replace function public.delete_post_with_cleanup(target_post_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare deleted_slug text;
begin
  if not public.is_blog_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;
  -- FK cascade와 정리 큐 INSERT가 모두 성공해야 삭제가 커밋된다.
  delete from public.posts where id = target_post_id returning slug into deleted_slug;
  if not found then
    raise exception '삭제할 글이 없습니다.' using errcode = 'P0002';
  end if;
  return jsonb_build_object('slug', deleted_slug);
end;
$$;
revoke all on function public.delete_post_with_cleanup(uuid) from public, anon;
grant execute on function public.delete_post_with_cleanup(uuid) to authenticated;

-- RLS에 숨겨진 다른 작성자 초안도 공유 이미지 참조 검사에 포함한다.
create or replace function public.get_post_image_references()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_blog_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;
  -- 단일 JSON 값이므로 PostgREST의 기본 최대 행 수에 잘려 참조를 놓치지 않는다.
  return (select coalesce(jsonb_agg(jsonb_build_object('content', p.content, 'cover_image', p.cover_image)), '[]'::jsonb)
    from public.posts p);
end;
$$;
revoke all on function public.get_post_image_references() from public, anon;
grant execute on function public.get_post_image_references() to authenticated;
