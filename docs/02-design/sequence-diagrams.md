# Spectra 시퀀스 다이어그램

사용자 인터랙션별 시퀀스 다이어그램을 정리한다.

---

## 1. 홈페이지 접속

```mermaid
sequenceDiagram
    actor User as 사용자
    participant Browser as 브라우저
    participant MW as middleware.ts
    participant Page as Home (page.tsx)
    participant Queries as lib/queries.ts
    participant Supabase as Supabase (Server)
    participant AuthProv as AuthProvider
    participant ZStore as Zustand Store

    User->>Browser: / 접속
    Browser->>MW: GET /
    MW->>Supabase: updateSession() → getUser()
    Supabase-->>MW: 세션 쿠키 갱신
    MW->>Page: 요청 전달

    par 서버 데이터 페칭
        Page->>Queries: getFeaturedPosts()
        Queries->>Supabase: posts.select().eq(featured, true)
        Supabase-->>Queries: featured posts rows
        Queries-->>Page: Post[] (Featured)
    and
        Page->>Queries: getPosts()
        Queries->>Supabase: posts.select().eq(status, published)
        Supabase-->>Queries: all posts rows
        Queries-->>Page: Post[] (All)
    end

    Page-->>Browser: HTML (Server Rendered)

    Note over Browser: Hydration 시작

    Browser->>AuthProv: 마운트
    AuthProv->>Supabase: supabase.auth.getUser()
    Supabase-->>AuthProv: User | null
    AuthProv->>ZStore: setUser(user)
    AuthProv->>Supabase: onAuthStateChange 구독

    Note over Browser: Header가 Zustand 상태로 인증 UI 렌더링
```

---

## 2. 게시글 상세 조회

```mermaid
sequenceDiagram
    actor User as 사용자
    participant Browser as 브라우저
    participant MW as middleware.ts
    participant Page as PostDetail (page.tsx)
    participant Queries as lib/queries.ts
    participant Supabase as Supabase (Server)
    participant MD as MarkdownContent

    User->>Browser: /posts/my-first-post 클릭
    Browser->>MW: GET /posts/my-first-post
    MW->>Supabase: updateSession()
    Supabase-->>MW: 세션 갱신
    MW->>Page: 요청 전달

    Page->>Queries: getPostBySlug("my-first-post")
    Queries->>Supabase: posts.select().eq(slug).single()
    Supabase-->>Queries: post row + tag slugs
    Queries->>Queries: mapPost(row, tagSlugs)
    Queries-->>Page: Post

    alt 게시글 없음
        Page-->>Browser: notFound() → 404
    else 게시글 존재
        Page->>Queries: getPosts() (관련 게시글용)
        Queries->>Supabase: 전체 게시글 조회
        Supabase-->>Queries: Post[]
        Queries-->>Page: 관련 게시글

        Page-->>Browser: HTML (제목, 메타, 본문, 태그, 관련글)
    end

    Note over Browser: Hydration
    Browser->>MD: Markdown → HTML 렌더링
    MD->>MD: react-markdown + remark-gfm 처리
    MD-->>Browser: 렌더링된 본문
```

---

## 3. Ctrl+K 검색

```mermaid
sequenceDiagram
    actor User as 사용자
    participant Browser as 브라우저
    participant Header as Header (Client)
    participant Modal as SearchModal (Client)
    participant Supabase as Supabase (Browser Client)
    participant DB as PostgreSQL

    User->>Browser: Ctrl+K 입력
    Browser->>Header: keydown 이벤트
    Header->>Header: e.key === "k" && (ctrlKey || metaKey)
    Header->>Modal: setIsSearchOpen(true)

    Note over Modal: 모달 열림, input 포커스

    User->>Modal: "React" 입력
    Modal->>Modal: debounce(300ms)

    par 타이틀 검색
        Modal->>Supabase: posts.select().ilike("title", "%React%").limit(5)
        Supabase->>DB: SQL ILIKE 쿼리
        DB-->>Supabase: 타이틀 매칭 결과
        Supabase-->>Modal: titleResults[]
    and 본문 검색
        Modal->>Supabase: posts.select().ilike("content", "%React%").limit(5)
        Supabase->>DB: SQL ILIKE 쿼리
        DB-->>Supabase: 본문 매칭 결과
        Supabase-->>Modal: contentResults[]
    end

    Modal->>Modal: 중복 제거 (타이틀에 이미 있는 건 본문에서 제외)
    Modal->>Modal: 본문 스니펫 추출 + 검색어 하이라이트
    Modal-->>Browser: 검색 결과 렌더링

    Note over Modal: "타이틀 검색 결과" / "본문 검색 결과" 섹션 분리

    User->>Modal: ↑↓ 키로 탐색
    Modal->>Modal: selectedIndex 업데이트

    User->>Modal: Enter 키
    Modal->>Browser: router.push(/posts/{slug})
    Modal->>Modal: 모달 닫기
```

---

## 4. OAuth 로그인 (GitHub/Google)

```mermaid
sequenceDiagram
    actor User as 사용자
    participant Browser as 브라우저
    participant SignIn as SignInForm (Client)
    participant Supabase as Supabase (Browser)
    participant OAuth as GitHub/Google
    participant Callback as auth/callback (Route Handler)
    participant SupaServer as Supabase (Server)
    participant AuthProv as AuthProvider
    participant ZStore as Zustand Store

    User->>SignIn: "GitHub으로 로그인" 클릭
    SignIn->>Supabase: signInWithOAuth({ provider: "github", redirectTo: "/auth/callback" })
    Supabase-->>Browser: OAuth 인증 URL로 리다이렉트

    Browser->>OAuth: GitHub 인증 페이지
    User->>OAuth: 계정 선택 및 권한 승인
    OAuth-->>Browser: /auth/callback?code=xxx 리다이렉트

    Browser->>Callback: GET /auth/callback?code=xxx
    Callback->>Callback: URL에서 code 파라미터 추출
    Callback->>SupaServer: exchangeCodeForSession(code)
    SupaServer-->>Callback: 세션 생성 + 쿠키 설정

    alt 성공
        Callback-->>Browser: redirect("/")
    else 실패
        Callback-->>Browser: redirect("/sign-in") + 에러 파라미터
    end

    Note over Browser: 홈페이지 로드

    Browser->>AuthProv: onAuthStateChange 이벤트 발생
    AuthProv->>ZStore: setUser(authenticatedUser)
    ZStore-->>Browser: Header UI 업데이트 (UserAvatar 표시)
```

---

## 5. 이메일 로그인

```mermaid
sequenceDiagram
    actor User as 사용자
    participant SignIn as SignInForm (Client)
    participant Supabase as Supabase (Browser)
    participant AuthProv as AuthProvider
    participant ZStore as Zustand Store
    participant Browser as 브라우저

    User->>SignIn: 이메일 + 비밀번호 입력
    User->>SignIn: "로그인" 버튼 클릭
    SignIn->>SignIn: setIsLoading(true)

    SignIn->>Supabase: signInWithPassword({ email, password })

    alt 인증 성공
        Supabase-->>SignIn: { data: { user }, error: null }
        SignIn->>Browser: router.push("/")

        Browser->>AuthProv: onAuthStateChange 발생
        AuthProv->>ZStore: setUser(user)
        ZStore-->>Browser: UI 업데이트
    else 인증 실패
        Supabase-->>SignIn: { data: null, error: AuthError }
        SignIn->>SignIn: setError("로그인 정보를 확인해주세요")
        SignIn-->>User: 오류 메시지 표시
    end

    SignIn->>SignIn: setIsLoading(false)
```

---

## 6. 게시글 작성 (관리자)

```mermaid
sequenceDiagram
    actor Admin as 관리자
    participant Browser as 브라우저
    participant Page as NewPost (page.tsx, Server)
    participant Supabase as Supabase (Server)
    participant Editor as PostEditor (Client)
    participant Upload as upload-image.ts
    participant Storage as Supabase Storage
    participant Action as createPost (Server Action)
    participant DB as PostgreSQL

    Admin->>Browser: /posts/new 접속
    Browser->>Page: GET /posts/new

    Page->>Supabase: auth.getUser()
    Supabase-->>Page: user

    alt 미인증
        Page-->>Browser: redirect("/sign-in")
    else 인증됨
        Page->>Supabase: getTags()
        Supabase-->>Page: Tag[]
        Page-->>Browser: PostEditor 렌더 (태그 목록 포함)
    end

    Note over Editor: 관리자가 게시글 작성

    Admin->>Editor: 제목, 내용, 태그 입력
    Admin->>Editor: 커버 이미지 첨부

    opt 이미지 업로드
        Editor->>Upload: uploadImage(file)
        Upload->>Storage: storage.upload(path, file)
        Storage-->>Upload: 업로드 URL
        Upload->>Storage: storage.getPublicUrl(path)
        Storage-->>Upload: 공개 URL
        Upload-->>Editor: imageUrl
    end

    Admin->>Editor: "게시" 버튼 클릭
    Editor->>Action: formData (title, content, tags, coverImage, ...)

    Action->>Action: 유효성 검증 (제목, 내용 필수)
    Action->>Action: 슬러그 생성 (generateSlug)
    Action->>Action: 읽기 시간 계산 (words / 200)

    Action->>Supabase: posts.insert({ title, slug, content, ... })
    Supabase->>DB: INSERT INTO posts
    DB-->>Supabase: 생성된 post

    loop 각 태그에 대해
        Action->>Supabase: post_tags.insert({ post_id, tag_id })
        Supabase->>DB: INSERT INTO post_tags
    end

    Action-->>Browser: redirect("/posts/{slug}")
```

---

## 7. 게시글 수정

```mermaid
sequenceDiagram
    actor Admin as 관리자
    participant Browser as 브라우저
    participant Page as EditPost (page.tsx, Server)
    participant Supabase as Supabase (Server)
    participant Editor as PostEditor (Client)
    participant Action as updatePost (Server Action)
    participant DB as PostgreSQL

    Admin->>Browser: /posts/my-post/edit 접속
    Browser->>Page: GET /posts/my-post/edit

    Page->>Supabase: auth.getUser()
    Supabase-->>Page: user

    par 데이터 병렬 로드
        Page->>Supabase: getPostBySlug("my-post")
        Supabase-->>Page: Post (기존 데이터)
    and
        Page->>Supabase: getTags()
        Supabase-->>Page: Tag[]
    end

    Page-->>Browser: PostEditor (기존 데이터 프리필)

    Admin->>Editor: 제목/내용/태그 수정
    Admin->>Editor: "수정" 버튼 클릭
    Editor->>Action: formData (postId, title, content, tags, ...)

    Action->>Action: 슬러그 유일성 검증 (자기 자신 제외)
    Action->>Action: 발행 상태 전환 확인

    Action->>Supabase: posts.update({ ... }).eq(id, postId)
    Supabase->>DB: UPDATE posts SET ...
    DB-->>Supabase: 업데이트 결과

    Action->>Supabase: post_tags.delete().eq(post_id, postId)
    Supabase->>DB: DELETE FROM post_tags WHERE post_id = ...

    loop 새 태그 연결
        Action->>Supabase: post_tags.insert({ post_id, tag_id })
        Supabase->>DB: INSERT INTO post_tags
    end

    Action-->>Browser: redirect("/posts/{slug}")
```

---

## 8. 게시글 삭제

```mermaid
sequenceDiagram
    actor Admin as 관리자
    participant DeleteBtn as DeletePostButton (Client)
    participant Browser as 브라우저
    participant Action as deletePost (Server Action)
    participant Supabase as Supabase (Server)
    participant DB as PostgreSQL

    Admin->>DeleteBtn: "삭제" 버튼 클릭
    DeleteBtn->>DeleteBtn: confirm("정말 삭제하시겠습니까?")

    alt 취소
        DeleteBtn-->>Admin: 아무 동작 없음
    else 확인
        DeleteBtn->>Action: deletePost(postId)
        Action->>Supabase: auth.getUser()
        Supabase-->>Action: user (관리자 확인)

        Action->>Supabase: posts.delete().eq(id, postId)
        Supabase->>DB: DELETE FROM posts WHERE id = ...
        DB-->>Supabase: 삭제 완료

        Note over DB: post_tags는 CASCADE로 자동 삭제

        Action-->>Browser: redirect("/")
    end
```

---

## 9. 태그 관리 (관리자)

```mermaid
sequenceDiagram
    actor Admin as 관리자
    participant Browser as 브라우저
    participant Page as AdminTags (page.tsx)
    participant Manager as TagManager (Client)
    participant Action as Tag Server Actions
    participant Supabase as Supabase (Server)
    participant DB as PostgreSQL

    Admin->>Browser: /admin/tags 접속
    Browser->>Page: GET /admin/tags

    Page->>Supabase: getTags()
    Supabase-->>Page: Tag[]
    Page-->>Browser: TagManager 렌더

    Note over Manager: 태그 목록 표시

    rect rgb(40, 40, 60)
        Note right of Admin: 태그 생성
        Admin->>Manager: 이름, 슬러그, 설명 입력
        Admin->>Manager: "추가" 클릭
        Manager->>Action: createTag(formData)
        Action->>Supabase: tags.insert({ name, slug, description })
        Supabase->>DB: INSERT INTO tags
        DB-->>Supabase: 생성 완료
        Action-->>Browser: revalidatePath("/admin/tags")
    end

    rect rgb(40, 60, 40)
        Note right of Admin: 태그 수정
        Admin->>Manager: 기존 태그 수정
        Manager->>Action: updateTag(formData)
        Action->>Supabase: tags.update({ ... }).eq(id, tagId)
        Supabase->>DB: UPDATE tags SET ...
        Action-->>Browser: revalidatePath
    end

    rect rgb(60, 40, 40)
        Note right of Admin: 태그 삭제
        Admin->>Manager: "삭제" 클릭
        Manager->>Action: deleteTag(tagId)
        Action->>Supabase: tags.delete().eq(id, tagId)
        Supabase->>DB: DELETE FROM tags
        Action-->>Browser: revalidatePath
    end
```

---

## 10. 회원가입

```mermaid
sequenceDiagram
    actor User as 사용자
    participant SignUp as SignUpForm (Client)
    participant Supabase as Supabase (Browser)
    participant Auth as Supabase Auth
    participant Browser as 브라우저

    User->>SignUp: 이메일 + 비밀번호 입력
    User->>SignUp: "회원가입" 버튼 클릭
    SignUp->>SignUp: setIsLoading(true)

    SignUp->>Supabase: signUp({ email, password })
    Supabase->>Auth: 사용자 계정 생성

    alt 성공
        Auth-->>Supabase: { user, session }
        Supabase-->>SignUp: 성공 응답
        SignUp->>Browser: router.push("/")
    else 이미 존재하는 이메일
        Auth-->>Supabase: error
        Supabase-->>SignUp: 에러 응답
        SignUp->>SignUp: setError("이미 사용 중인 이메일입니다")
        SignUp-->>User: 오류 메시지 표시
    end

    SignUp->>SignUp: setIsLoading(false)
```

---

## 11. 태그별 게시글 필터링

```mermaid
sequenceDiagram
    actor User as 사용자
    participant Browser as 브라우저
    participant MW as middleware.ts
    participant Page as TagDetail (page.tsx)
    participant Queries as lib/queries.ts
    participant Supabase as Supabase (Server)
    participant DB as PostgreSQL

    User->>Browser: /tags/react 클릭 (태그 뱃지)
    Browser->>MW: GET /tags/react
    MW->>Supabase: updateSession()
    MW->>Page: 요청 전달

    par 태그 정보 조회
        Page->>Queries: getTagBySlug("react")
        Queries->>Supabase: tags.select().eq(slug, "react").single()
        Supabase->>DB: SELECT * FROM tags WHERE slug = 'react'
        DB-->>Supabase: tag row
        Supabase-->>Queries: tag data
        Queries-->>Page: Tag
    and 태그별 게시글 조회
        Page->>Queries: getPostsByTag("react")
        Queries->>Supabase: tags.select(id).eq(slug, "react")
        Supabase->>DB: SELECT id FROM tags WHERE slug = 'react'
        DB-->>Supabase: tag_id

        Queries->>Supabase: post_tags.select(post_id).eq(tag_id, ...)
        Supabase->>DB: SELECT post_id FROM post_tags WHERE tag_id = ...
        DB-->>Supabase: post_id[]

        Queries->>Supabase: posts.select().in(id, post_ids).eq(status, published)
        Supabase->>DB: SELECT * FROM posts WHERE id IN (...) AND status = 'published'
        DB-->>Supabase: post rows
        Supabase-->>Queries: posts data
        Queries-->>Page: Post[]
    end

    alt 태그 없음
        Page-->>Browser: notFound() → 404
    else 태그 존재
        Page-->>Browser: HTML (태그 정보 + 게시글 그리드)
    end
```

---

## 12. 미들웨어 세션 갱신 (모든 요청)

```mermaid
sequenceDiagram
    participant Browser as 브라우저
    participant MW as src/middleware.ts
    participant UpdateSess as lib/supabase/middleware.ts
    participant Supabase as Supabase Auth

    Browser->>MW: 모든 HTTP 요청 (정적 파일 제외)
    MW->>UpdateSess: updateSession(request)

    UpdateSess->>UpdateSess: NextResponse.next({ request }) 생성
    UpdateSess->>UpdateSess: createServerClient(URL, KEY, cookies)

    UpdateSess->>Supabase: supabase.auth.getUser()

    alt 유효한 세션
        Supabase-->>UpdateSess: user 정보 + 갱신된 토큰
        UpdateSess->>UpdateSess: 갱신된 쿠키를 응답에 설정
    else 세션 없음 / 만료
        Supabase-->>UpdateSess: null
        Note over UpdateSess: 쿠키 변경 없이 통과
    end

    UpdateSess-->>MW: supabaseResponse (쿠키 포함)
    MW-->>Browser: 응답 전달 (+ 갱신된 세션 쿠키)
```
