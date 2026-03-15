# Spectra 아키텍처 정의서

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | Spectra |
| 설명 | 다크 테마 기반 기술 블로그 |
| 프레임워크 | Next.js 16.1.6 (App Router) |
| 언어 | TypeScript 5 (strict mode) |
| UI | React 19 + Tailwind CSS v4 |
| 백엔드 | Supabase (PostgreSQL + Auth + Storage) |
| 패키지 매니저 | pnpm |

---

## 2. 기술 스택

### 2.1 프론트엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 16.1.6 | App Router, SSR/SSG, React Compiler |
| React | 19.2.3 | UI 렌더링 |
| TypeScript | 5.x | 타입 안전성 |
| Tailwind CSS | v4 | `@theme inline` 방식, `@tailwindcss/postcss` |
| Zustand | 5.0.11 | 클라이언트 인증 상태 관리 |
| TanStack React Query | 5.90.21 | 서버 상태 캐싱 (staleTime: 60s) |
| react-markdown | 10.1.0 | Markdown 렌더링 (remark-gfm) |
| clsx + tailwind-merge | - | 유틸리티 클래스 병합 |

### 2.2 백엔드 (Supabase BaaS)

| 기술 | 버전 | 용도 |
|------|------|------|
| @supabase/supabase-js | 2.99.1 | DB 클라이언트 (PostgreSQL) |
| @supabase/ssr | 0.9.0 | 서버 컴포넌트 세션 관리 |

### 2.3 빌드 & 개발

| 기술 | 용도 |
|------|------|
| Turbopack | 개발 서버 (pnpm dev) |
| React Compiler | 자동 메모이제이션 |
| ESLint 9 | 코드 린트 |
| PostCSS | Tailwind v4 처리 |

---

## 3. 디렉토리 구조

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 루트 레이아웃 (폰트, Provider 래핑)
│   ├── page.tsx                  # 홈페이지 (히어로 + 게시글 그리드)
│   ├── globals.css               # 디자인 토큰, 애니메이션, 커스텀 스타일
│   ├── (auth)/                   # 인증 라우트 그룹
│   │   ├── sign-in/              # 로그인 페이지 + 폼
│   │   └── sign-up/              # 회원가입 페이지 + 폼
│   ├── auth/callback/route.ts    # OAuth 콜백 핸들러
│   ├── posts/
│   │   ├── [slug]/               # 게시글 상세
│   │   │   ├── page.tsx          # 게시글 뷰
│   │   │   ├── actions.ts        # 삭제 서버 액션
│   │   │   └── edit/             # 게시글 수정
│   │   └── new/                  # 게시글 작성 (관리자)
│   ├── tags/
│   │   ├── page.tsx              # 태그 디렉토리
│   │   └── [slug]/page.tsx       # 태그별 게시글 목록
│   ├── admin/tags/               # 태그 관리 (관리자)
│   └── about/page.tsx            # 소개 페이지
│
├── components/                   # 재사용 UI 컴포넌트
│   ├── header.tsx                # 네비게이션 바 (Client)
│   ├── footer.tsx                # 푸터 (Server)
│   ├── search-modal.tsx          # Ctrl+K 검색 모달 (Client)
│   ├── post-card.tsx             # 게시글 카드 (Client)
│   ├── post-editor.tsx           # 게시글 에디터 (Client)
│   ├── markdown-content.tsx      # Markdown 렌더러 (Client)
│   ├── tag-badge.tsx             # 태그 뱃지 (Client)
│   ├── user-avatar.tsx           # 사용자 아바타 + 드롭다운 (Client)
│   ├── auth-buttons.tsx          # 로그인/회원가입 버튼 (Client)
│   ├── delete-post-button.tsx    # 삭제 확인 버튼 (Client)
│   ├── loading.tsx               # 로딩 스피너 (Client)
│   └── query-loading-indicator.tsx # React Query 로딩 바 (Client)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # 브라우저 Supabase 클라이언트
│   │   ├── server.ts             # 서버 Supabase 클라이언트
│   │   ├── middleware.ts         # 세션 갱신 로직
│   │   └── database.types.ts     # DB 스키마 타입 (자동 생성)
│   ├── queries.ts                # 데이터 페칭 함수
│   ├── data.ts                   # 타입 정의, 매퍼, 유틸리티
│   ├── post-actions.ts           # 게시글 수정 서버 액션
│   ├── slug.ts                   # 슬러그 생성 유틸리티
│   ├── upload-image.ts           # 이미지 업로드 (Supabase Storage)
│   └── utils.ts                  # cn() 유틸리티
│
├── providers/
│   ├── auth-provider.tsx         # Zustand 인증 상태 초기화
│   └── query-provider.tsx        # React Query Provider (staleTime: 60s)
│
├── stores/
│   └── auth-store.ts             # Zustand 인증 스토어
│
└── middleware.ts                  # Next.js 미들웨어 (세션 토큰 갱신)
```

---

## 4. 아키텍처 계층

### 4.1 계층 구조

```
┌─────────────────────────────────────────────────┐
│                  Presentation Layer              │
│  (Server Components + Client Components)        │
├─────────────────────────────────────────────────┤
│                  State Layer                     │
│  Zustand (Auth) + React Query (Server State)    │
├─────────────────────────────────────────────────┤
│                  Data Access Layer               │
│  lib/queries.ts + Server Actions                │
├─────────────────────────────────────────────────┤
│                  Supabase Client Layer           │
│  Browser Client | Server Client | Middleware     │
├─────────────────────────────────────────────────┤
│                  Supabase Backend                │
│  PostgreSQL | Auth | Storage                     │
└─────────────────────────────────────────────────┘
```

### 4.2 Presentation Layer

서버 컴포넌트가 기본이며, 사용자 인터랙션이 필요한 부분만 클라이언트 컴포넌트로 분리한다.

| 구분 | 컴포넌트 | 이유 |
|------|----------|------|
| Server | 페이지 (page.tsx), footer | 데이터 페칭, SEO, 초기 렌더링 |
| Client | header, search-modal, post-editor | `usePathname`, 이벤트 리스너, 폼 상태 |
| Client | user-avatar, auth-buttons | Zustand 인증 상태 구독 |
| Client | post-card, tag-badge, markdown-content | 인터랙션, 동적 렌더링 |

### 4.3 State Layer

| 스토어 | 라이브러리 | 범위 | 용도 |
|--------|-----------|------|------|
| Auth Store | Zustand | 클라이언트 전역 | `user`, `isLoading` 상태 |
| Server State | React Query | 요청 캐시 | API 응답 캐싱 (60s stale) |

### 4.4 Data Access Layer

모든 데이터 페칭은 `lib/queries.ts`의 비동기 함수를 통해 이루어진다. 서버 컴포넌트에서 직접 호출하며 Supabase Server Client를 사용한다.

| 함수 | 반환 | 용도 |
|------|------|------|
| `getPosts()` | `Post[]` | 전체 발행 게시글 |
| `getFeaturedPosts()` | `Post[]` | 추천 게시글 |
| `getPostBySlug(slug)` | `Post \| null` | 단건 게시글 |
| `getPostsByTag(tagSlug)` | `Post[]` | 태그별 게시글 |
| `getTags()` | `Tag[]` | 전체 태그 (게시글 수 포함) |
| `getTagBySlug(slug)` | `Tag \| null` | 단건 태그 |

### 4.5 Server Actions

데이터 변경(CUD)은 Next.js Server Actions를 통해 처리한다.

| 액션 | 위치 | 용도 |
|------|------|------|
| `createPost` | `posts/new/actions.ts` | 게시글 생성 |
| `updatePost` | `lib/post-actions.ts` | 게시글 수정 |
| `deletePost` | `posts/[slug]/actions.ts` | 게시글 삭제 |
| `createTag` / `updateTag` / `deleteTag` | `admin/tags/actions.ts` | 태그 CRUD |

---

## 5. 데이터베이스 스키마

### 5.1 테이블 관계

```
profiles ──1:N──► posts ──N:M──► tags
                    │               │
                    │          post_tags (조인)
                    │
                    ├──1:N──► comments
                    └──1:N──► bookmarks
```

### 5.2 테이블 정의

**posts**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 게시글 ID |
| slug | text (UNIQUE) | URL 슬러그 |
| title | text | 제목 |
| content | text | Markdown 본문 |
| excerpt | text | 요약 |
| status | text | `draft` / `published` |
| featured | boolean | 추천 여부 |
| cover_image | text | 커버 이미지 URL |
| cover_gradient | text | 커버 그라디언트 CSS |
| author_id | uuid (FK → profiles) | 작성자 |
| read_time | int | 예상 읽기 시간 (분) |
| view_count | int | 조회수 |
| published_at | timestamptz | 발행일 |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

**tags**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 태그 ID |
| slug | text (UNIQUE) | URL 슬러그 |
| name | text | 태그명 |
| description | text | 태그 설명 |
| created_at | timestamptz | 생성일 |

**post_tags** (조인 테이블)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| post_id | uuid (FK → posts) | 게시글 |
| tag_id | uuid (FK → tags) | 태그 |

**comments**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 댓글 ID |
| post_slug | text | 게시글 슬러그 |
| content | text | 댓글 내용 |
| user_id | uuid (FK → profiles) | 작성자 |
| parent_id | uuid (FK → comments) | 상위 댓글 (대댓글) |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

**bookmarks**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 북마크 ID |
| user_id | uuid (FK → profiles) | 사용자 |
| post_id | uuid (FK → posts) | 게시글 |
| created_at | timestamptz | 생성일 |

**profiles**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | Supabase Auth User ID |
| email | text | 이메일 |
| full_name | text | 이름 |
| avatar_url | text | 프로필 이미지 |

---

## 6. 라우팅 맵

| 경로 | 렌더링 | 데이터 소스 | 설명 |
|------|--------|------------|------|
| `/` | Server (Dynamic) | `getPosts()`, `getFeaturedPosts()` | 홈 (히어로 + 그리드) |
| `/posts/[slug]` | Server (SSG) | `getPostBySlug()` | 게시글 상세 |
| `/posts/[slug]/edit` | Server | `getPostBySlug()`, `getTags()` | 게시글 수정 (관리자) |
| `/posts/new` | Server | `getTags()` | 게시글 작성 (관리자) |
| `/tags` | Server | `getTags()` | 태그 디렉토리 |
| `/tags/[slug]` | Server (SSG) | `getTagBySlug()`, `getPostsByTag()` | 태그별 게시글 |
| `/about` | Server (Static) | 없음 | 소개 페이지 |
| `/sign-in` | Client | 없음 | 로그인 |
| `/sign-up` | Client | 없음 | 회원가입 |
| `/auth/callback` | Route Handler | Supabase Auth | OAuth 콜백 |
| `/admin/tags` | Server | `getTags()` | 태그 관리 (관리자) |

---

## 7. 인증 아키텍처

### 7.1 인증 수단

| 방식 | 제공자 | 구현 위치 |
|------|--------|----------|
| OAuth | GitHub, Google | `sign-in-form.tsx`, `sign-up-form.tsx` |
| Email/Password | Supabase Auth | `sign-in-form.tsx`, `sign-up-form.tsx` |

### 7.2 세션 관리

```
[요청] → middleware.ts → updateSession()
                            ├── Supabase Server Client 생성
                            ├── supabase.auth.getUser() (토큰 갱신)
                            └── 응답 쿠키에 갱신된 세션 설정
```

### 7.3 인증 상태 흐름

```
App Mount
  └── AuthProvider (Client)
        ├── supabase.auth.getUser() → Zustand store 초기화
        └── onAuthStateChange 구독
              └── 상태 변경 시 Zustand store 업데이트

Header (Client)
  └── useAuthStore() 구독
        ├── user === null → AuthButtons 렌더
        └── user !== null → UserAvatar 렌더
              └── isAdmin 체크 (email === "yoo32767@gmail.com")
```

### 7.4 관리자 권한

하드코딩된 이메일 비교 방식으로 관리자를 판별한다:

```typescript
const isAdmin = user?.email === "yoo32767@gmail.com"
```

관리자 전용 기능: 게시글 작성/수정/삭제, 태그 관리

---

## 8. 스타일링 시스템

### 8.1 디자인 토큰

| 토큰 | 값 | 용도 |
|------|----|------|
| `--background` | `#0a0a0a` | 페이지 배경 |
| `--foreground` | `#fafafa` | 기본 텍스트 |
| `--card` | `#0f0f0f` | 카드 배경 |
| `--border` | `#2a2a2a` | 테두리 |
| `--accent` | `#10b981` | 주 강조색 (Emerald) |
| `--accent-cyan` | `#06b6d4` | 보조 강조색 (Cyan) |
| `--accent-amber` | `#f59e0b` | 보조 강조색 (Amber) |
| `--muted` | `#6b7280` | 비활성 텍스트 |

### 8.2 타이포그래피

| 용도 | 폰트 | 로드 방식 |
|------|------|----------|
| 본문 (Sans) | IBM Plex Mono | `next/font/google` |
| 코드 (Mono) | JetBrains Mono | `next/font/google` |
| 산문 (Prose) | Pretendard Variable | 외부 CDN |

### 8.3 애니메이션

| 클래스 | 효과 |
|--------|------|
| `.animate-fade-in-up` | 아래→위 페이드인 |
| `.stagger-children` | 자식 요소 60ms 간격 순차 등장 |
| 커스텀 스크롤바 | 얇은 다크 테마 스크롤바 |

---

## 9. 주요 기능 요약

| 기능 | 설명 | 핵심 컴포넌트 |
|------|------|--------------|
| Ctrl+K 검색 | 타이틀/본문 분리 검색, 디바운스, 키보드 네비게이션 | `search-modal.tsx` |
| 게시글 CRUD | Markdown 에디터, 이미지 업로드, 태그 연결 | `post-editor.tsx`, Server Actions |
| OAuth 인증 | GitHub/Google 소셜 로그인 | `sign-in-form.tsx`, `auth/callback` |
| 태그 시스템 | 태그 CRUD, 태그별 게시글 필터링 | `admin/tags/`, `tags/[slug]` |
| 반응형 디자인 | 모바일 퍼스트, 다크 테마 | `globals.css`, Tailwind v4 |
