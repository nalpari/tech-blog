# 코드베이스 전체 리뷰 — 2026-10-17

## 수정 후 상태

**15개 항목의 저장소 코드 수정을 완료했다. 운영 DB 적용은 별도다.** 아래 1~15번과 기존 검증 결과는 최초 리뷰 당시의 기록이며, 현재 수정 결과는 이 절을 기준으로 한다.

- DB 보안·정합성(1·2·4·5·6): GPT-6-Astra가 `20261017090000_harden_auth_and_engagement.sql`에 역할 수정 제한, 신원·공개 상태 검증, 구형 RPC 제거, 좋아요 잠금·카운터 보정, 가입 username 충돌 방지를 구현했다.
- 서버 저장·복구(7·8·9·10): GPT-6.1-Sol이 원자적인 글·태그 저장, 글 삭제 후 이미지 정리 대기열·관리자 재시도, 공통 slug 검증, DB 실패 시 API 503 응답을 구현했다. 신규 계약은 `20261017091000_atomic_post_mutations.sql`에 있다.
- 화면·상태(3·11·12·13·14): GPT-6.1-Sol이 업로드 중 본문 보존, 목록 오류 중단·재시도, 서버 태그 props 반영, 검색 취소·응답 세대 검사, 네이티브 dialog를 구현했다.
- 개발 설정(15): `.kilo/**`를 ESLint 검사에서 제외했다. README·AGENTS 및 관련 다이어그램도 수정된 계약에 맞췄다.

통합 검증 결과:

- 전체 ESLint 오류·경고 0건, 프로덕션 빌드와 타입 검사 성공. pnpm의 실행 전 의존성 검사 문제를 피하기 위해 `--config.verify-deps-before-run=false`를 사용했다.
- `node --test scripts/test-client-state.mjs scripts/test-server-data.mjs`: 14건 통과.
- 외부 임시 설치 PGlite에서 마이그레이션 8개와 SQL 회귀 테스트 2개 통과. 기존 의존성·lockfile은 변경하지 않았다.
- 실제 로컬 브라우저에서 모달 배경 포커스 차단, Escape 후 포커스·스크롤 복원, 목록 503 실패 1회 후 자동 요청 중단, 수동 재시도 후 6→12개 글 로딩을 확인했다. T3 snapshot 타임아웃 2회 후 agent-browser로 검증했다.

배포·검증 한계:

- 앱 배포 전에 `my-notion-blog-comments`에 신규 마이그레이션 2개를 순서대로 적용해야 한다. 각 파일은 한 트랜잭션으로 적용하며, 기존 admin/author 역할의 정당성과 비정상 slug를 먼저 점검한다. 카운터 보정 중에는 글·좋아요 쓰기가 잠시 잠긴다.
- 운영 DB 및 실제 Storage 서비스의 변경·삭제는 실행하지 않았다. Storage 실패·공유 참조·재시도는 회귀 테스트의 mock으로 확인했다.
- PGlite는 단일 연결이다. 실제 다중 세션 좋아요 경합은 `supabase/tests/concurrent_likes.spec`을 PostgreSQL isolationtester에서 별도 검증해야 한다.
- 이미지 참조 조회와 Storage 삭제는 서로 다른 시스템의 작업이다. 참조 확인 직후 다른 요청이 같은 이미지를 새 글에 연결하는 극단적 경합까지 원자적으로 보장하지는 않는다.

## 최초 리뷰 기록

기준 커밋: `e010713`. 새 자식 에이전트 3명이 인증·보안·DB, 서버 데이터·캐시·CRUD, 프런트엔드·상태·접근성을 분담했고, 주 에이전트가 핵심 코드 근거와 중복 항목을 확인했다. 애플리케이션 코드와 DB는 수정하지 않았다.

검토 대상은 `src` 전체, Supabase 마이그레이션 전체, 루트 빌드·타입·린트 설정과 제품·개발 문서다. Graft 그래프로 구조와 호출 관계를 확인한 뒤 관련 정의를 읽었다. 담당 에이전트는 Next.js/React 관련 스킬과 설치된 Next.js 문서를 참고했다.

**수정 권고 15건: P1 3건, P2 11건, P3 1건.** P1은 우선 처리할 보안·작성 내용 유실 문제이며, P2는 기능 오류·데이터 정합성·복구·접근성 문제다. P3는 개발 검증 설정 문제다. 아래 재현 조건은 정적 코드 분석으로 도출했으며 운영 환경에서 공격이나 데이터 변경을 실행하지 않았다.

## 우선 처리 — P1

### 1. 일반 계정이 자신의 DB 역할을 admin으로 변경할 수 있음

- 근거: [초기 마이그레이션](../../supabase/migrations/20260315061031_initial_schema.sql#L166), `profiles_update` 및 `get_user_role`.
- 발생 조건: 일반 로그인 사용자가 Supabase REST API로 자신의 profiles 행에 `role: "admin"`을 PATCH한다. 정책은 행의 소유자만 검사하고 role 변경을 막지 않는다.
- 영향: DB 정책상 다른 작성자의 글 수정·삭제, 초안 및 조회 이력 열람, 태그 관리가 가능해진다. 앱의 이메일 기반 관리자 화면·Server Action 검사는 별도지만 직접 DB API 호출은 그 검사를 거치지 않는다.
- 수정: 프로필 수정 가능 컬럼을 제한하고 role 변경을 DB에서 차단한다. 기존 role 값도 점검한다. 정책만 추가하기보다 실제 컬럼 권한과 트리거 우회 여부까지 확인한다.
- 확인 범위: 저장소 마이그레이션 기준. 운영 DB의 현재 정책·컬럼 권한은 미확인이다.

### 2. DB RPC가 전달된 사용자 ID를 신뢰해 타인의 활동 위조를 허용함

- 근거: [좋아요 RPC](../../supabase/migrations/20260315150000_auth_likes_and_post_views.sql#L58), [조회 RPC](../../supabase/migrations/20260315150000_auth_likes_and_post_views.sql#L28), 같은 파일의 `post_views_insert_all` 정책.
- 발생 조건: 직접 RPC 호출로 타인의 UUID를 liker_id/viewer_id에 전달한다. 함수는 SECURITY DEFINER이지만 `auth.uid()` 일치나 대상 글의 published 상태를 검사하지 않는다. 저장소에 함수 실행 권한 REVOKE도 없다.
- 영향: 기본 실행 권한이 유지된 배포에서는 익명 호출자가 타인의 좋아요 추가·취소, 조회 이력 위조, 알려진 초안 slug의 카운터 변경을 할 수 있다. profiles는 공개 SELECT이므로 사용자 UUID도 조회 가능하다.
- 수정: DB 내부에서 신원을 결정한다. 좋아요는 인증 및 함수 실행 권한을 제한하고, 조회는 익명 정책에 맞춰 사용자 ID를 내부 생성한다. 공개 글 여부를 검사하고 post_views의 무조건 INSERT 정책도 제한한다.
- 확인 범위: 운영 RPC 실행 권한은 미확인이다. 앱 Route Handler의 인증은 직접 Supabase RPC 호출을 막지 못한다.

### 3. 본문 이미지 업로드 중 작성한 내용이 업로드 완료 시 유실됨

- 근거: [본문 삽입](../../src/components/post-editor.tsx#L159), [이미지 업로드](../../src/components/post-editor.tsx#L180).
- 발생 조건: 본문 이미지를 업로드하고, 업로드가 끝나기 전에 본문을 더 입력한다. await 이전 렌더의 insertAtCursor가 이전 content를 사용해 `setContent(before + text + after)`를 실행한다.
- 영향: 업로드 중 추가·수정한 작성 내용이 이전 본문으로 덮어써진다. 현재 커서 위치와 과거 본문을 섞어 삽입 위치도 어긋날 수 있다.
- 수정: 최신 본문을 기준으로 함수형 상태 갱신을 하고, 비동기 작업의 삽입 위치 정책을 명시한다. 느린 업로드 중 입력하는 시나리오로 검증한다.

## 기능·데이터 정합성 — P2

### 4. 구형 좋아요 RPC가 남아 카운터 직접 조작 경로를 제공함

- 근거: [구형 함수](../../supabase/migrations/20260315120000_add_post_like_count.sql#L5), [신규 함수](../../supabase/migrations/20260315150000_auth_likes_and_post_views.sql#L58).
- 발생 조건: 기존 `toggle_post_like(text, boolean)`에 should_like=true를 반복 전달한다. 신규 함수의 인자 타입은 uuid이므로 CREATE OR REPLACE가 기존 boolean overload를 제거하지 않는다.
- 영향: 기본 실행 권한이 유지되면 로그인·좋아요 행 생성 없이 like_count만 늘릴 수 있다. 2번의 신규 함수만 고쳐도 이 경로는 남는다.
- 수정: 후속 마이그레이션에서 `DROP FUNCTION public.toggle_post_like(text, boolean)`을 명시하고 실제 좋아요 행 수와 카운터를 맞춘다.
- 참고: [PostgreSQL 함수 생성·overload 규칙](https://www.postgresql.org/docs/current/sql-createfunction.html), [Supabase 함수 실행 권한](https://supabase.com/docs/guides/database/functions).

### 5. 같은 사용자의 동시 좋아요 취소가 카운터를 중복 감소시킴

- 근거: [존재 확인·삭제·카운트 감소](../../supabase/migrations/20260315150000_auth_likes_and_post_views.sql#L75).
- 발생 조건: 두 탭에서 동시에 취소해 두 트랜잭션이 이미 좋아요 상태라고 읽는다. 실제 DELETE는 합쳐 1행이어도 카운터 UPDATE는 두 번 실행된다.
- 영향: 좋아요 10개가 실제로 9개가 됐는데 카운터는 8로 표시되는 식의 영구 불일치가 생긴다. 동시 추가는 UNIQUE 충돌도 발생할 수 있다.
- 수정: 조회·분기 전에 글 행을 잠가 직렬화하거나, 원하는 좋아요 상태를 받는 멱등 API와 실제 INSERT/DELETE 행 수 기반 카운터 갱신을 사용한다. 두 연결의 동시 요청으로 검증한다.

### 6. 이메일 앞부분이 같은 다른 사용자의 가입이 실패함

- 근거: [username UNIQUE](../../supabase/migrations/20260315061031_initial_schema.sql#L12), [가입 트리거](../../supabase/migrations/20260315061031_initial_schema.sql#L107).
- 발생 조건: alice@gmail.com 가입 후 alice@company.com이 가입한다. 기본 username은 둘 다 alice이며 이메일 가입 폼은 별도 username을 전달하지 않는다.
- 영향: 프로필 INSERT의 UNIQUE 위반이 Auth 가입 트랜잭션을 실패시킨다. OAuth 메타데이터의 username 충돌도 같은 문제가 있다.
- 수정: UUID 등을 사용하는 충돌 없는 기본 username을 생성하고 표시 이름과 분리한다.

### 7. 글 수정의 태그 교체 실패가 기존 태그를 영구 삭제함

- 근거: [글 UPDATE](../../src/lib/post-actions.ts#L96), [태그 DELETE·INSERT](../../src/lib/post-actions.ts#L132).
- 발생 조건: 글 UPDATE와 기존 post_tags DELETE는 성공했지만 신규 태그 INSERT가 실패한다. 예를 들어 편집 중 선택한 태그가 다른 화면에서 삭제되거나 요청이 실패할 때 발생한다.
- 영향: UI는 저장 실패를 안내하지만 본문은 이미 변경됐고 기존 태그는 사라진다. 캐시 무효화는 이미 올바르게 수행되지만 데이터 원자성은 보장하지 않는다.
- 수정: 글과 태그 변경을 한 DB 트랜잭션/RPC로 처리한다. 실패 주입 시 본문과 태그가 함께 롤백되는지 검증한다.

### 8. 글 삭제보다 이미지 삭제가 먼저 실행돼 실패 시 이미지만 유실됨

- 근거: [이미지 삭제](../../src/app/posts/[slug]/actions.ts#L55), [글 삭제](../../src/app/posts/[slug]/actions.ts#L60).
- 발생 조건: storage.remove는 성공하고 뒤이은 posts DELETE가 실패한다.
- 영향: 글은 남아 있는데 본문·커버 이미지 파일은 삭제된 상태가 된다. 공유 이미지라면 다른 글에도 영향을 줄 수 있다.
- 수정: 글 삭제 성공 후 파일 정리를 실행하고 실패한 파일 정리는 재시도 가능하게 한다. 다른 글에서 같은 파일을 참조하는지도 고려한다.

### 9. 저장 가능한 slug와 라우트·활동 API의 slug 규칙이 다름

- 근거: [slug 생성](../../src/lib/slug.ts#L1), [새 글 slug 결정](../../src/app/posts/new/actions.ts#L58), [수정 slug 결정](../../src/lib/post-actions.ts#L94), [좋아요 검증](../../src/app/api/posts/[slug]/like/route.ts#L4), [조회 검증](../../src/app/api/posts/[slug]/view/route.ts#L4).
- 발생 조건: 한글로만 된 제목에서 자동 slug가 빈 문자열이 되거나, 수동 slug로 React_19 또는 개발-기록을 입력한다. 서버 액션은 공통 형식 검증 없이 저장한다.
- 영향: 빈 slug는 상세 경로를 만들 수 없고, API 정규식에 맞지 않는 slug는 글을 읽어도 좋아요·조회 요청이 항상 400이 된다.
- 수정: 생성·수정·API가 공유하는 slug 검증 규칙을 둔다. 빈 자동 slug에는 필드 오류 또는 유효한 고유 fallback을 제공한다. 기존 비정상 slug도 점검한다.

### 10. DB 조회 오류를 마지막 페이지로 처리해 목록 로딩이 종료됨

- 근거: [목록 쿼리](../../src/lib/queries.ts#L77), [목록 API](../../src/app/api/posts/route.ts#L9).
- 발생 조건: getPosts의 DB 요청이 실패해 data가 null이 되면 error를 확인하지 않고 빈 배열을 반환한다.
- 영향: API는 200과 hasMore=false를 반환한다. 무한 스크롤은 아직 남은 글이 있어도 완료로 판단해 재시도하지 않고, 첫 페이지에서는 글이 없는 블로그처럼 보인다.
- 수정: 쿼리 오류를 전파해 실패 응답과 정상 빈 결과를 구분하고, 클라이언트가 재시도 상태를 유지하도록 한다.

### 11. 무한 스크롤의 네트워크·응답 오류가 즉시 반복 요청으로 이어짐

- 근거: [loadMore 및 observer](../../src/components/post-grid.tsx#L32).
- 발생 조건: fetch 또는 JSON 파싱이 실패하거나 응답 형태가 예상과 다르다. catch 없이 finally에서 loading=false를 실행한다.
- 영향: 화면 안의 sentinel에 observer가 다시 붙으며 같은 요청을 반복한다. 사용자 오류 안내나 재시도 제어가 없고 요청·콘솔 오류가 계속 발생한다. 10번의 DB 오류 은폐와는 별도 실패 경로다.
- 수정: res.ok와 응답을 검사하고 오류 상태를 둔다. 자동 반복을 멈추고 수동 재시도나 제한된 backoff를 제공한다.

### 12. 태그 생성·수정 성공 후 관리 목록이 이전 값을 유지함

- 근거: [초기 상태와 생성·수정 처리](../../src/app/admin/tags/tag-manager.tsx#L21).
- 발생 조건: 태그 생성·수정 후 router.refresh로 새 initialTags를 받아도 useState(initialTags)는 다시 초기화되지 않는다.
- 영향: 새 태그가 목록에 나타나지 않고 수정한 태그 이름·slug도 이전 값으로 남는다. 다시 편집하면 이전 값이 폼에 들어간다.
- 수정: 서버 props를 목록의 기준으로 사용하거나 mutation 성공 결과로 로컬 목록을 갱신한다. 삭제를 포함한 목록 상태의 소유권을 일관되게 만든다.

### 13. 이전 검색 응답이 최신 검색 결과를 덮어씀

- 근거: [검색 결과 반영 및 debounce](../../src/components/search-modal.tsx#L117).
- 발생 조건: 검색 A 후 B를 입력하고 B 응답이 먼저 도착한 다음 A 응답이 도착한다. debounce는 시작 전 타이머만 취소하고 이미 진행 중인 요청은 무효화하지 않는다.
- 영향: 입력창에는 B가 있는데 A 결과가 표시된다. 검색어 삭제나 모달 재오픈 후에도 이전 결과가 나타날 수 있다.
- 수정: 요청 세대 식별자 또는 AbortController를 사용해 최신 검색만 반영하고, 닫기·검색어 초기화 시 이전 요청도 무효화한다.

### 14. 검색 모달이 키보드 포커스를 가두거나 복원하지 않음

- 근거: [검색 모달 루트](../../src/components/search-modal.tsx#L191), 같은 파일의 열기·닫기 effect.
- 발생 조건: 모달을 열고 Tab/Shift+Tab으로 이동한다.
- 영향: 포커스가 가려진 배경의 헤더·링크로 빠져 배경 페이지를 조작할 수 있다. dialog/aria-modal 의미도 없어 보조기술 사용자가 대화상자 경계를 파악하기 어렵고, 닫은 뒤 실행 버튼으로 돌아가지 않는다.
- 수정: 접근성 요구를 충족하는 dialog primitive 또는 네이티브 dialog를 사용해 이름·모달 의미·focus trap·닫은 뒤 포커스 복원을 제공한다. 키보드와 스크린리더로 검증한다.

## 개발 검증 설정 — P3

### 15. 전체 린트가 로컬 중첩 worktree의 보조 스크립트까지 검사함

- 근거: [ESLint 제외 설정](../../eslint.config.mjs#L10), 실제 전체 린트 실행 결과.
- 발생 조건: 현재 환경의 `.kilo/worktrees/odd-toy/.claude/helpers/`에 있는 `graft-hooks.cjs`, `graft-statusline.cjs`까지 전체 ESLint 대상에 들어간다. 루트의 `.claude/**` 제외는 이 중첩 경로를 제외하지 않는다.
- 영향: 앱 소스와 무관한 require 사용 오류 8건으로 `pnpm lint`가 실패한다. `.kilo/**`를 제외한 실행은 통과한다. 해당 로컬 폴더가 없는 환경에는 발생하지 않을 수 있다.
- 수정: 로컬 worktree 루트를 globalIgnores에 명시하거나 실제 검사할 소스 범위를 제한한다. 요청은 리뷰·보고이므로 설정 변경 대신 수정 권고로 남긴다.

## 권장 수정 순서

1. DB 권한 경계: 1·2·4번을 함께 수정하고 기존 역할·카운터 정합성을 점검한다.
2. 작성 내용 보호: 3·7·8번을 수정한다.
3. 활동·가입·URL 정합성: 5·6·9번을 수정한다.
4. 목록 복구와 관리·검색 UX: 10~14번을 수정한다.
5. 기본 검증 명령 정리: 15번을 수정한다.

## 검증 결과와 한계

- 자식 에이전트가 린트·타입·프로덕션 빌드를 실행했다. 기본 pnpm 스크립트는 실행 전 의존성 검사에서 `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`로 중단되어 설치·설정 변경 없이 `--config.verify-deps-before-run=false`를 적용했다.
- `pnpm --config.verify-deps-before-run=false build`: 성공, 종료 0.
- `pnpm --config.verify-deps-before-run=false exec tsc --noEmit`: 성공, 종료 0. 빌드 전후 확인했다.
- `pnpm --config.verify-deps-before-run=false lint`: 실패, 종료 1. 15번의 로컬 보조 스크립트 오류 8건, 경고 0건.
- `pnpm --config.verify-deps-before-run=false lint --ignore-pattern '.kilo/**'`: 성공, 종료 0. 전체 린트 통과와 구분해야 한다.
- Supabase 운영 프로젝트 `my-notion-blog-comments`에 연결해 정책·함수 권한을 조회하지 않았다. 위 보안 항목은 마이그레이션을 순서대로 적용하고 기본 함수 권한이 유지된 상태를 전제로 한다. 운영 DB에서 이미 보완했는지 확인이 필요하다.
- Storage 버킷과 정책은 저장소 마이그레이션에 없어 서버 측 업로드 권한·파일 제약을 확정할 수 없다.
- 실제 브라우저 상호작용, 운영 가입·쓰기, 공격 요청, 두 DB 연결을 통한 경쟁 상태 재현은 실행하지 않았다. 빌드 성공이 위 런타임·권한 결함의 부재를 의미하지 않는다.
- 의도된 최대 60초 카운터 캐시 지연, 단순 스타일 취향, 관리자 이메일 상수 중복만으로 생기는 유지보수 부담은 신규 결함 수에 포함하지 않았다. RLS DELETE가 0행을 반환하는 것만으로 관리자 삭제 실패라고 판단한 후보도 제외했다.
- 기능·계약 변경은 없으므로 AGENTS.md와 README.md의 갱신은 필요하지 않다.
