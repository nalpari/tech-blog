-- 앱 배포 전에 적용한다. 관리자 글 목록의 발행/초안 전환을 RPC 한 곳으로 옮긴다.
-- 발행 시각 규칙(처음 발행될 때만 now(), 그 외에는 유지)은 save_post_with_tags와 같다.
create or replace function public.toggle_post_status(target_post_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  old_post public.posts%rowtype;
  new_status text;
begin
  if not public.is_blog_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;
  -- 동시 저장·전환과 같은 행 잠금으로 직렬화한다.
  select * into old_post from public.posts where id = target_post_id for update;
  if not found then
    raise exception '전환할 글이 없습니다.' using errcode = 'P0002';
  end if;

  new_status := case when old_post.status = 'published' then 'draft' else 'published' end;
  update public.posts set
    status = new_status,
    published_at = case
      when new_status = 'published' and old_post.status <> 'published' then now()
      else old_post.published_at
    end
  where id = target_post_id;
  return jsonb_build_object('slug', old_post.slug, 'status', new_status);
end;
$$;
revoke all on function public.toggle_post_status(uuid) from public, anon;
grant execute on function public.toggle_post_status(uuid) to authenticated;
