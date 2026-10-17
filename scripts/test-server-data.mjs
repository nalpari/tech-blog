// 추가 테스트 의존성 없이 실행: node --test scripts/test-server-data.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function load(relative, mocks = {}) {
  const filename = path.resolve(root, relative);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiled = { exports: {} };
  const resolve = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`, mocks);
    if (name.startsWith(".")) return load(path.relative(root, path.resolve(path.dirname(filename), `${name}.ts`)), mocks);
    return require(name);
  };
  new Function("require", "module", "exports", "console", code)(resolve, compiled, compiled.exports, { error() {} });
  return compiled.exports;
}

const storageUrl = "https://test.supabase.co";
const imageUrl = `${storageUrl}/storage/v1/object/public/post-images/shared.png`;
const { isValidPostSlug, generateSlug } = load("src/lib/slug.ts");

test("저장과 API의 slug 계약 및 빈 자동 slug", () => {
  for (const slug of ["react-19", "a", "0", "a".repeat(100)]) assert.equal(isValidPostSlug(slug), true);
  for (const slug of ["", "React_19", "개발-기록", "../test", "a--b", "a-", "a".repeat(101)]) assert.equal(isValidPostSlug(slug), false);
  assert.equal(generateSlug("React 19: Compiler"), "react-19-compiler");
  assert.equal(isValidPostSlug(generateSlug("한글 제목")), false);
  assert.equal(isValidPostSlug(generateSlug(`${"a".repeat(99)} b`)), true);
});

test("이미지 경로는 같은 프로젝트·버킷만 허용하고 중복·쿼리를 제거", () => {
  const { postImagePaths } = load("src/lib/post-images.ts");
  assert.deepEqual(postImagePaths([
    `![a](${imageUrl}?download=1)`, `<img src="${imageUrl}">`,
    `${storageUrl}/storage/v1/render/image/public/post-images/folder/a%20b.png?width=100`,
    `${storageUrl}/storage/v1/object/sign/post-images/signed.png?token=secret`,
    "https://evil.invalid/storage/v1/object/public/post-images/shared.png",
    `${storageUrl}/storage/v1/object/public/other-bucket/no.png`,
    `${storageUrl}/storage/v1/object/public/post-images/folder/%2e%2e%2fno.png`,
  ].join("\n"), storageUrl), ["shared.png", "folder/a b.png", "signed.png"]);
});

test("getPosts는 DB 실패를 빈 마지막 페이지로 바꾸지 않는다", async () => {
  const query = {};
  for (const method of ["select", "eq", "order"]) query[method] = () => query;
  query.range = async () => ({ data: null, error: { message: "injected DB error" } });
  const { getPosts } = load("src/lib/queries.ts", {
    react: { cache: (fn) => fn },
    "next/cache": { unstable_cache: (fn) => fn },
    "@/lib/auth": { getCurrentUser: async () => null },
    "@/lib/supabase/server": { createClient: async () => ({ from: () => query }) },
    "@/lib/supabase/public": {},
    "@/lib/data": {},
  });
  await assert.rejects(getPosts(), /injected DB error/);
  query.range = async () => ({ data: [], error: null });
  assert.deepEqual(await getPosts(), []);
});

test("목록 API는 정상 빈 결과 200과 일시 실패 503을 구분", async () => {
  let failed = true;
  const { GET } = load("src/app/api/posts/route.ts", {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/queries": { POSTS_PER_PAGE: 6, getPosts: async () => {
      if (failed) throw new Error("injected DB failure");
      return [];
    } },
  });
  const request = { nextUrl: new URL("https://blog.invalid/api/posts?offset=6") };
  const failure = await GET(request);
  assert.equal(failure.status, 503);
  assert.equal(failure.headers.get("Cache-Control"), "no-store");
  assert.equal(Object.hasOwn(await failure.json(), "hasMore"), false);
  failed = false;
  const empty = await GET(request);
  assert.equal(empty.status, 200);
  assert.deepEqual(await empty.json(), { posts: [], hasMore: false });
  assert.equal((await GET({ nextUrl: new URL("https://blog.invalid/api/posts?offset=Infinity") })).status, 400);
});

for (const endpoint of ["like", "view"]) {
  test(`${endpoint} API도 공통 slug 규칙을 사용`, async () => {
    let called = 0;
    const { POST } = load(`src/app/api/posts/[slug]/${endpoint}/route.ts`, {
      "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
      "@/lib/supabase/server": { createClient: async () => {
        called++;
        return {
          auth: { getUser: async () => ({ data: { user: { id: "test-user" } } }) },
          rpc: async () => ({ data: endpoint === "view" ? 1 : { liked: true, likeCount: 1 }, error: null }),
        };
      } },
    });
    assert.equal((await POST(new Request("https://blog.invalid"), { params: Promise.resolve({ slug: "React_19" }) })).status, 400);
    assert.equal(called, 0);
    assert.equal((await POST(new Request("https://blog.invalid"), { params: Promise.resolve({ slug: generateSlug("React 19") }) })).status, 200);
  });
}

function cleanupClient({ referenced = false, storageFailure = false, referenceFailure = false } = {}) {
  const calls = { removed: [], deleted: [], updates: [] };
  const job = { id: "job", content: `![shared](${imageUrl})`, cover_image: null, attempts: 0 };
  const client = {
    from: () => ({
      select: () => {
        const query = { order: () => query, limit: async () => ({ data: [job], error: null }) };
        return query;
      },
      delete: () => ({ eq: async (_, id) => { calls.deleted.push(id); return { error: null }; } }),
      update: (values) => ({ eq: async () => { calls.updates.push(values); return { error: null }; } }),
    }),
    rpc: async () => ({
      data: referenced ? [{ content: null, cover_image: `${imageUrl}?width=200` }] : [],
      error: referenceFailure ? { message: "reference query failed" } : null,
    }),
    storage: { from: () => ({ remove: async (paths) => {
      calls.removed.push(paths);
      return { error: storageFailure ? { message: "storage unavailable" } : null };
    } }) },
  };
  return { client, calls };
}

test("공유 이미지는 보존하고 마지막 참조가 사라지면 재시도로 정리", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = storageUrl;
  const { processPostImageCleanup } = load("src/lib/post-image-cleanup.ts");
  const shared = cleanupClient({ referenced: true });
  await processPostImageCleanup(shared.client);
  assert.deepEqual(shared.calls.removed, []);
  assert.deepEqual(shared.calls.deleted, []);
  assert.equal(shared.calls.updates[0].attempts, 1);
  assert.match(shared.calls.updates[0].last_error, /다른 글/);
  const unreferenced = cleanupClient();
  await processPostImageCleanup(unreferenced.client);
  assert.deepEqual(unreferenced.calls.removed, [["shared.png"]]);
  assert.deepEqual(unreferenced.calls.deleted, ["job"]);
});

test("Storage 실패는 큐를 유지하고 참조 조회 실패는 Storage를 건드리지 않는다", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = storageUrl;
  const { processPostImageCleanup } = load("src/lib/post-image-cleanup.ts");
  const failingStorage = cleanupClient({ storageFailure: true });
  await processPostImageCleanup(failingStorage.client);
  assert.deepEqual(failingStorage.calls.deleted, []);
  assert.match(failingStorage.calls.updates[0].last_error, /Storage/);
  const failingReferences = cleanupClient({ referenceFailure: true });
  await assert.rejects(processPostImageCleanup(failingReferences.client), /참조/);
  assert.deepEqual(failingReferences.calls.removed, []);
  assert.deepEqual(failingReferences.calls.deleted, []);
});

test("DB 삭제 실패에는 이미지 정리·캐시 무효화를 수행하지 않는다", async () => {
  const events = [];
  let dbFails = true;
  const { deletePostAndQueueImages } = load("src/lib/delete-post.ts", {
    "next/cache": { updateTag: () => events.push("cache"), revalidatePath() {} },
    "@/lib/queries": { POST_CACHE_TAG: (slug) => slug },
    "@/lib/post-image-cleanup": { processPostImageCleanup: async () => {
      events.push("cleanup");
      throw new Error("injected Storage failure");
    } },
  });
  const client = { rpc: async () => {
    events.push("delete");
    return { data: dbFails ? null : { slug: "post" }, error: dbFails ? { message: "delete failed" } : null };
  } };
  assert.ok((await deletePostAndQueueImages(client, "id")).error);
  assert.deepEqual(events, ["delete"]);
  dbFails = false;
  assert.equal((await deletePostAndQueueImages(client, "id")).success, true);
  assert.deepEqual(events, ["delete", "delete", "cache", "cleanup"]);
});
