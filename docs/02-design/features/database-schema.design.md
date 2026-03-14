# Design: Database Schema

> Plan 문서 기반 Supabase 스키마 상세 설계 — SQL 마이그레이션, RLS, 시드 데이터

## 1. 참조 문서

- Plan: `docs/01-plan/features/database-schema.plan.md`

## 2. 파일 구조

```
supabase/
├── migrations/
│   └── 00001_initial_schema.sql    # 테이블, 인덱스, RLS, 트리거
└── seed.sql                        # 초기 데이터 (기존 mock → SQL)
```

## 3. 마이그레이션: 00001_initial_schema.sql

### 3.1 profiles 테이블

```sql
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
```

### 3.2 posts 테이블

```sql
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
```

### 3.3 tags 테이블

```sql
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

comment on table public.tags is '태그 마스터';
```

### 3.4 post_tags 조인 테이블

```sql
create table public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

comment on table public.post_tags is '포스트-태그 다대다 관계';
```

### 3.5 bookmarks 테이블

```sql
create table public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

comment on table public.bookmarks is '사용자 북마크';
```

### 3.6 post_likes 테이블

```sql
create table public.post_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

comment on table public.post_likes is '포스트 좋아요';
```

### 3.7 인덱스

```sql
create index idx_posts_slug on public.posts(slug);
create index idx_posts_status_published_at on public.posts(status, published_at desc);
create index idx_posts_author_id on public.posts(author_id);
create index idx_tags_slug on public.tags(slug);
create index idx_post_tags_tag_id on public.post_tags(tag_id);
create index idx_bookmarks_user_id on public.bookmarks(user_id);
create index idx_post_likes_post_id on public.post_likes(post_id);
```

### 3.8 Functions & Triggers

```sql
-- 신규 가입 시 profiles 자동 생성
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

-- updated_at 자동 갱신
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
```

### 3.9 RLS 정책

```sql
-- Enable RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.tags enable row level security;
alter table public.post_tags enable row level security;
alter table public.bookmarks enable row level security;
alter table public.post_likes enable row level security;

-- Helper: 현재 사용자 role 조회
create or replace function public.get_user_role()
returns text
language sql
stable security definer set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- profiles
create policy "profiles_select" on public.profiles
  for select using (true);

create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- posts
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

-- tags
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

-- post_tags
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

-- bookmarks
create policy "bookmarks_all" on public.bookmarks
  for all using (auth.uid() = user_id);

-- post_likes
create policy "post_likes_select" on public.post_likes
  for select using (true);

create policy "post_likes_insert" on public.post_likes
  for insert with check (auth.uid() = user_id);

create policy "post_likes_delete" on public.post_likes
  for delete using (auth.uid() = user_id);
```

## 4. 시드 데이터: seed.sql

기존 `data.ts`의 mock 데이터를 SQL INSERT로 변환한다. author는 시드 전용 프로필을 사용한다.

```sql
-- 시드용 프로필 (auth.users 없이 직접 삽입 — 개발 환경 전용)
-- 실제 운영에서는 Supabase Auth로 가입 후 role을 수동 변경

-- Tags
insert into public.tags (slug, name, description) values
  ('systems-design', 'Systems Design', 'Architectural patterns, distributed systems, and the art of designing software that scales.'),
  ('react', 'React', 'Modern React patterns, server components, and building exceptional user interfaces.'),
  ('typescript', 'TypeScript', 'Type-level programming, advanced patterns, and making JavaScript safer.'),
  ('performance', 'Performance', 'Optimization techniques, profiling strategies, and delivering fast experiences.'),
  ('devops', 'DevOps', 'CI/CD pipelines, infrastructure as code, and the bridge between development and operations.'),
  ('ai-ml', 'AI & ML', 'Machine learning in production, LLM integrations, and the future of intelligent software.'),
  ('rust', 'Rust', 'Memory safety, zero-cost abstractions, and systems programming for the modern era.'),
  ('databases', 'Databases', 'Query optimization, data modeling, and choosing the right storage for your workload.');

-- Posts (author_id는 실제 가입 후 대입해야 함 — 플레이스홀더)
-- 실행 시 author_id를 실제 프로필 UUID로 교체
-- insert into public.posts (author_id, slug, title, excerpt, ...) values (...);
```

## 5. TypeScript 타입 생성

Supabase CLI를 사용해 DB 스키마에서 자동 생성:

```bash
pnpm dlx supabase gen types typescript --project-id stcwgfbjyvlyshdvojgn > src/lib/supabase/database.types.ts
```

생성된 타입은 `createClient<Database>()`로 사용.

## 6. 구현 체크리스트

- [ ] `supabase/migrations/00001_initial_schema.sql` 작성
- [ ] `supabase/seed.sql` 작성
- [ ] Supabase Dashboard SQL Editor에서 마이그레이션 실행
- [ ] 시드 데이터 실행
- [ ] `database.types.ts` 생성
- [ ] `data.ts` mock 함수를 Supabase 쿼리로 교체 (별도 feature)
