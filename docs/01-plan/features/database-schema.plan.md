# Plan: Database Schema

> Supabase 테이블 설계 — Spectra 테크 블로그의 데이터 모델

## 1. 개요

현재 `src/lib/data.ts`에 하드코딩된 mock 데이터를 Supabase PostgreSQL로 마이그레이션하기 위한 데이터베이스 스키마를 설계한다. 인증(Supabase Auth), 블로그 포스트, 태그, 사용자 프로필, 북마크 기능을 포함한다.

## 2. 현재 상태

- **데이터**: `Post`, `Tag` 인터페이스가 `data.ts`에 정의, 배열로 하드코딩
- **인증**: Supabase Auth 클라이언트 설정 완료, `auth-store.ts` (zustand) 준비됨
- **UI**: 헤더에 Sign in/Sign up 버튼, UserAvatar(Profile, Bookmarks, Settings 메뉴) 구현

## 3. 요구사항

### 핵심 기능 (Must Have)

| ID | 기능 | 설명 |
|----|------|------|
| R1 | 사용자 프로필 | Supabase Auth 연동, 표시 이름/아바타/소개 |
| R2 | 포스트 CRUD | 제목, 슬러그, 본문(Markdown), 발행 상태, 대표 이미지 |
| R3 | 태그 시스템 | 태그 관리, 포스트-태그 다대다 관계 |
| R4 | 북마크 | 사용자별 포스트 북마크 저장/삭제 |

### 추가 기능 (Nice to Have)

| ID | 기능 | 설명 |
|----|------|------|
| R5 | 포스트 조회수 | 포스트별 조회 카운트 |
| R6 | 좋아요 | 사용자별 포스트 좋아요 |

## 4. 테이블 설계

### 4.1 profiles

Supabase Auth `auth.users`와 1:1 연결. 트리거로 자동 생성.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | uuid | PK, FK → auth.users(id) | 사용자 ID |
| username | text | UNIQUE, NOT NULL | 고유 사용자명 |
| display_name | text | | 표시 이름 |
| avatar_url | text | | 프로필 이미지 URL |
| bio | text | | 소개글 |
| role | text | DEFAULT 'user' | 역할 (admin, author, user) |
| created_at | timestamptz | DEFAULT now() | 생성일 |
| updated_at | timestamptz | DEFAULT now() | 수정일 |

### 4.2 posts

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 포스트 ID |
| author_id | uuid | FK → profiles(id), NOT NULL | 작성자 |
| slug | text | UNIQUE, NOT NULL | URL 슬러그 |
| title | text | NOT NULL | 제목 |
| excerpt | text | | 요약 |
| content | text | | 본문 (Markdown) |
| cover_image | text | | 대표 이미지 URL |
| cover_gradient | text | | 그라디언트 CSS 클래스 |
| status | text | DEFAULT 'draft' | 상태 (draft, published) |
| featured | boolean | DEFAULT false | 추천 여부 |
| read_time | text | | 예상 읽기 시간 |
| view_count | integer | DEFAULT 0 | 조회수 |
| published_at | timestamptz | | 발행일 |
| created_at | timestamptz | DEFAULT now() | 생성일 |
| updated_at | timestamptz | DEFAULT now() | 수정일 |

### 4.3 tags

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 태그 ID |
| slug | text | UNIQUE, NOT NULL | URL 슬러그 |
| name | text | NOT NULL | 태그명 |
| description | text | | 설명 |
| created_at | timestamptz | DEFAULT now() | 생성일 |

### 4.4 post_tags (다대다 조인 테이블)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| post_id | uuid | FK → posts(id) ON DELETE CASCADE | 포스트 |
| tag_id | uuid | FK → tags(id) ON DELETE CASCADE | 태그 |
| | | PK (post_id, tag_id) | 복합 기본키 |

### 4.5 bookmarks

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| user_id | uuid | FK → profiles(id) ON DELETE CASCADE | 사용자 |
| post_id | uuid | FK → posts(id) ON DELETE CASCADE | 포스트 |
| created_at | timestamptz | DEFAULT now() | 생성일 |
| | | PK (user_id, post_id) | 복합 기본키 |

### 4.6 post_likes

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| user_id | uuid | FK → profiles(id) ON DELETE CASCADE | 사용자 |
| post_id | uuid | FK → posts(id) ON DELETE CASCADE | 포스트 |
| created_at | timestamptz | DEFAULT now() | 생성일 |
| | | PK (user_id, post_id) | 복합 기본키 |

## 5. RLS (Row Level Security) 정책

| 테이블 | 정책 | 규칙 |
|--------|------|------|
| profiles | 읽기 | 모든 사용자 (public) |
| profiles | 수정 | 본인만 (auth.uid() = id) |
| posts | 읽기 | published 상태는 public, draft는 작성자만 |
| posts | CUD | author_id = auth.uid() 또는 role = 'admin' |
| tags | 읽기 | 모든 사용자 (public) |
| tags | CUD | role = 'admin' 또는 'author' |
| post_tags | 읽기 | 모든 사용자 (public) |
| post_tags | CUD | 포스트 작성자 또는 admin |
| bookmarks | 전체 | 본인만 (auth.uid() = user_id) |
| post_likes | 읽기 | 모든 사용자 (public) |
| post_likes | CUD | 본인만 (auth.uid() = user_id) |

## 6. 인덱스

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| posts | idx_posts_slug | 슬러그 조회 |
| posts | idx_posts_status_published_at | 발행 포스트 목록 정렬 |
| posts | idx_posts_author_id | 작성자별 포스트 조회 |
| tags | idx_tags_slug | 태그 슬러그 조회 |
| post_tags | idx_post_tags_tag_id | 태그별 포스트 조회 |
| bookmarks | idx_bookmarks_user_id | 사용자별 북마크 목록 |
| post_likes | idx_post_likes_post_id | 포스트별 좋아요 수 집계 |

## 7. Database Functions & Triggers

| 이름 | 타입 | 설명 |
|------|------|------|
| handle_new_user() | Trigger Function | Auth 가입 시 profiles 자동 생성 |
| update_updated_at() | Trigger Function | 레코드 수정 시 updated_at 자동 갱신 |
| get_post_tag_count(tag_slug) | Function | 태그별 발행 포스트 수 조회 (post_count 대체) |

## 8. ER 다이어그램

```
auth.users ──1:1── profiles
                      │
                      │ 1:N
                      ▼
                    posts ──N:M── tags
                      │          (post_tags)
                      │
              ┌───────┼───────┐
              │               │
          bookmarks      post_likes
          (user:post)    (user:post)
```

## 9. 구현 순서

1. **Phase 1**: SQL 마이그레이션 파일 작성 (테이블, RLS, 인덱스, 트리거)
2. **Phase 2**: Supabase Dashboard에서 실행 또는 CLI로 적용
3. **Phase 3**: TypeScript 타입 생성 (supabase gen types)
4. **Phase 4**: 기존 mock 데이터 시드(seed) 스크립트 작성

## 10. 리스크 및 고려사항

- **post_count 동기화**: tags 테이블에 post_count 컬럼 대신 쿼리 시점에 COUNT 집계 사용 (정합성 보장)
- **Markdown 저장**: content 컬럼에 raw Markdown 저장, 렌더링은 프론트에서 처리
- **슬러그 충돌**: posts.slug, tags.slug에 UNIQUE 제약으로 보장
- **소프트 삭제**: 현재 범위에서 제외, 필요 시 `deleted_at` 컬럼 추가
