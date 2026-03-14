-- =============================================================
-- Spectra Tech Blog — Initial Schema Migration
-- =============================================================

-- -------------------------------------------------------------
-- 1. Tables
-- -------------------------------------------------------------

-- 1.1 profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  role text not null default 'user' check (role in ('admin', 'author', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is '사용자 프로필 (auth.users 1:1)';

-- 1.2 posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  slug text unique not null,
  title text not null,
  excerpt text,
  content text,
  cover_image text,
  cover_gradient text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  read_time text,
  view_count integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.posts is '블로그 포스트';

-- 1.3 tags
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

comment on table public.tags is '태그 마스터';

-- 1.4 post_tags (M:N join)
create table public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

comment on table public.post_tags is '포스트-태그 다대다 관계';

-- 1.5 bookmarks
create table public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

comment on table public.bookmarks is '사용자 북마크';

-- 1.6 post_likes
create table public.post_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

comment on table public.post_likes is '포스트 좋아요';

-- -------------------------------------------------------------
-- 2. Indexes
-- -------------------------------------------------------------

create index idx_posts_slug on public.posts(slug);
create index idx_posts_status_published_at on public.posts(status, published_at desc);
create index idx_posts_author_id on public.posts(author_id);
create index idx_tags_slug on public.tags(slug);
create index idx_post_tags_tag_id on public.post_tags(tag_id);
create index idx_bookmarks_user_id on public.bookmarks(user_id);
create index idx_post_likes_post_id on public.post_likes(post_id);

-- -------------------------------------------------------------
-- 3. Functions & Triggers
-- -------------------------------------------------------------

-- 3.1 Auto-create profile on auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3.2 Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger set_posts_updated_at
  before update on public.posts
  for each row execute function public.update_updated_at();

-- -------------------------------------------------------------
-- 4. Row Level Security
-- -------------------------------------------------------------

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.tags enable row level security;
alter table public.post_tags enable row level security;
alter table public.bookmarks enable row level security;
alter table public.post_likes enable row level security;

-- Helper: get current user's role
create or replace function public.get_user_role()
returns text
language sql
stable security definer set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 4.1 profiles policies
create policy "profiles_select" on public.profiles
  for select using (true);

create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- 4.2 posts policies
create policy "posts_select" on public.posts
  for select using (
    status = 'published'
    or author_id = auth.uid()
    or public.get_user_role() = 'admin'
  );

create policy "posts_insert" on public.posts
  for insert with check (
    author_id = auth.uid()
    and public.get_user_role() in ('admin', 'author')
  );

create policy "posts_update" on public.posts
  for update using (
    author_id = auth.uid()
    or public.get_user_role() = 'admin'
  );

create policy "posts_delete" on public.posts
  for delete using (
    author_id = auth.uid()
    or public.get_user_role() = 'admin'
  );

-- 4.3 tags policies
create policy "tags_select" on public.tags
  for select using (true);

create policy "tags_insert" on public.tags
  for insert with check (
    public.get_user_role() in ('admin', 'author')
  );

create policy "tags_update" on public.tags
  for update using (
    public.get_user_role() in ('admin', 'author')
  );

create policy "tags_delete" on public.tags
  for delete using (
    public.get_user_role() = 'admin'
  );

-- 4.4 post_tags policies
create policy "post_tags_select" on public.post_tags
  for select using (true);

create policy "post_tags_insert" on public.post_tags
  for insert with check (
    exists (
      select 1 from public.posts
      where id = post_id and (author_id = auth.uid() or public.get_user_role() = 'admin')
    )
  );

create policy "post_tags_delete" on public.post_tags
  for delete using (
    exists (
      select 1 from public.posts
      where id = post_id and (author_id = auth.uid() or public.get_user_role() = 'admin')
    )
  );

-- 4.5 bookmarks policies
create policy "bookmarks_all" on public.bookmarks
  for all using (auth.uid() = user_id);

-- 4.6 post_likes policies
create policy "post_likes_select" on public.post_likes
  for select using (true);

create policy "post_likes_insert" on public.post_likes
  for insert with check (auth.uid() = user_id);

create policy "post_likes_delete" on public.post_likes
  for delete using (auth.uid() = user_id);
