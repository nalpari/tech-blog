import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

// 실제 TSX의 이벤트 핸들러와 함수형 상태 갱신을 실행한다. DOM 동작 자체
// (네이티브 dialog의 포커스 가두기 등)는 실제 브라우저에서 별도로 확인한다.
const requireModule = createRequire(import.meta.url);
const deferred = () => {
  let resolvePromise;
  const promise = new Promise((resolve) => { resolvePromise = resolve; });
  return { promise, resolve: resolvePromise };
};
const settle = () => new Promise((resolve) => setImmediate(resolve));

function mockGlobal(t, name, value) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, name, previous);
    else delete globalThis[name];
  });
}

function walk(node, predicate) {
  if (Array.isArray(node)) return node.flatMap((child) => walk(child, predicate));
  if (!node || typeof node !== "object") return [];
  return [...(predicate(node) ? [node] : []), ...walk(node.props?.children, predicate)];
}

function textOf(node) {
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node == null || typeof node === "boolean") return "";
  return typeof node === "object" ? textOf(node.props?.children) : String(node);
}

function harness(file, exportName, props, mocks = {}) {
  const slots = [];
  let cursor = 0;
  let effects = [];
  let tree;
  let unmounted = false;
  let lateStateWrites = 0;
  const sameDeps = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const hooks = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
      return [slots[i], (value) => {
        if (unmounted) lateStateWrites++;
        slots[i] = typeof value === "function" ? value(slots[i]) : value;
      }];
    },
    useRef(initial) {
      const i = cursor++;
      return slots[i] ??= { current: initial };
    },
    useCallback(callback, deps) {
      const i = cursor++;
      if (!sameDeps(slots[i]?.deps, deps)) slots[i] = { callback, deps };
      return slots[i].callback;
    },
    useEffect(callback, deps) {
      const i = cursor++;
      if (!sameDeps(slots[i]?.deps, deps)) {
        const previous = slots[i];
        slots[i] = { deps, callback };
        effects.push(() => {
          previous?.cleanup?.();
          slots[i].cleanup = callback();
        });
      }
    },
    useActionState: (_action, initial) => [initial, () => {}, false],
    useId: () => "test-search-label",
  };
  const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
  const defaults = {
    react: hooks,
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: Symbol.for("test.fragment") },
    "next/image": { default: () => null },
    "next/link": { default: () => null },
    "next/navigation": { useRouter: () => ({ refresh() {}, push() {} }) },
    "react-markdown": { default: () => null },
    "remark-gfm": { default: () => null },
    "@/app/posts/new/actions": { createPost() {} },
    "@/lib/post-actions": { updatePost() {} },
    "@/lib/slug": { generateSlug: (title) => title.toLowerCase() },
    "@/lib/format": { kstYmd: (date) => date.slice(0, 10).replaceAll("-", ".") },
    "@/components/post-card": { PostCard: () => null },
    "@/lib/data": { formatDate: (date) => date },
  };
  const dependencies = { ...defaults, ...mocks };
  const source = readFileSync(resolve(file), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (id) => id in dependencies ? dependencies[id] : requireModule(id), compiledModule, compiledModule.exports,
  );
  let component = compiledModule.exports[exportName];
  const api = {
    render(nextProps = props) {
      props = nextProps;
      cursor = 0;
      effects = [];
      tree = component(props);
      for (const node of walk(tree, (node) => typeof node.type === "string" && node.props.ref)) {
        const ref = node.props.ref;
        ref.current ??= new FakeElement();
        if ("value" in node.props) ref.current.value = node.props.value;
      }
      effects.forEach((effect) => effect());
      return tree;
    },
    find: (predicate) => walk(tree, predicate),
    text: () => textOf(tree),
    unmount() { unmounted = true; slots.forEach((slot) => slot?.cleanup?.()); },
    lateStateWrites: () => lateStateWrites,
    replayEffects() {
      for (const slot of slots) {
        if (slot && typeof slot === "object" && "cleanup" in slot) {
          slot.cleanup?.();
          slot.cleanup = slot.callback();
        }
      }
    },
    descend() { component = tree.type; props = tree.props; return api.render(); },
  };
  api.render();
  return api;
}

class FakeElement {
  isConnected = true;
  selectionStart = 0;
  selectionEnd = 0;
  focus() { if (globalThis.document) globalThis.document.activeElement = this; }
  setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; }
  showModal() { this.open = true; }
  close() { this.open = false; }
  querySelectorAll() { return []; }
}

test("이미지 업로드 완료 시 최신 본문과 현재 선택 영역을 보존한다", async (t) => {
  mockGlobal(t, "requestAnimationFrame", (callback) => callback());
  const upload = deferred();
  const ui = harness("src/components/post-editor.tsx", "PostEditor", { tags: [] }, {
    "@/lib/upload-image": { uploadImage: () => upload.promise },
  });
  const body = () => ui.find((node) => node.type === "textarea" && node.props.name === "content")[0];
  body().props.onChange({ target: { value: "기존 본문" } });
  ui.render();
  const uploadInput = ui.find((node) => node.type === "input" && node.props.accept?.startsWith("image/jpeg"))[0];
  const input = { files: [{ name: "test-image.png" }], value: "test-image.png" };
  const pending = uploadInput.props.onChange({ currentTarget: input });
  await settle();
  body().props.onChange({ target: { value: "업로드 중 추가한 최신 본문" } });
  ui.render();
  body().props.ref.current.setSelectionRange(5, 5);
  upload.resolve({ url: "https://example.com/image.png" });
  await pending;
  ui.render();
  assert.equal(body().props.value, "업로드 중\n![test image](https://example.com/image.png)\n 추가한 최신 본문");
  assert.equal(input.value, "");
  ui.unmount();
});

const post = (slug) => ({
  id: slug, slug, title: slug, excerpt: null, date: "2026-10-17T00:00:00Z",
  readTime: null, tags: [], featured: false, coverImage: null, coverGradient: null,
  authorId: "author", viewCount: 0, likeCount: 0, liked: false,
});

test("목록 실패는 자동 재요청을 멈추고 수동 재시도에서 같은 offset으로 복구한다", async (t) => {
  const observers = [];
  mockGlobal(t, "IntersectionObserver", class {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  });
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    requests.push(url);
    if (requests.length === 1) return { ok: false };
    return { ok: true, json: async () => ({ posts: [post("second")], hasMore: false }) };
  });
  const ui = harness("src/components/post-grid.tsx", "PostGrid", {
    initialPosts: [post("first")], initialHasMore: true, pageSize: 1,
  });
  observers[0].callback([{ isIntersecting: true }]);
  await settle();
  // 이미 큐에 들어간 observer 콜백도 오류 직후에는 자동 재시도하지 않는다.
  observers[0].callback([{ isIntersecting: true }]);
  ui.render();
  assert.equal(requests.length, 1);
  assert.match(ui.text(), /다시 시도/);
  ui.find((node) => node.type === "button")[0].props.onClick();
  await settle();
  ui.render();
  assert.deepEqual(requests, ["/api/posts?offset=1&limit=1", "/api/posts?offset=1&limit=1"]);
  assert.equal(ui.find((node) => node.props.post?.slug === "second").length, 1);
  assert.doesNotMatch(ui.text(), /다시 시도/);
  ui.unmount();
});

test("잘못된 JSON·목록 구조·행·진행 없는 페이지는 재시도 가능한 오류로 처리한다", async (t) => {
  let observer;
  mockGlobal(t, "IntersectionObserver", class {
    constructor(callback) { observer = callback; }
    observe() {}
    disconnect() {}
  });
  const invalidResponses = [
    () => { throw new SyntaxError("invalid JSON"); },
    () => ({ posts: "invalid", hasMore: false }),
    () => ({ posts: [{ slug: "broken" }], hasMore: false }),
    () => ({ posts: [], hasMore: true }),
  ];
  for (const json of invalidResponses) {
    t.mock.method(globalThis, "fetch", async () => ({ ok: true, json }));
    const ui = harness("src/components/post-grid.tsx", "PostGrid", {
      initialPosts: [post("first")], initialHasMore: true, pageSize: 1,
    });
    observer([{ isIntersecting: true }]);
    await settle();
    ui.render();
    assert.match(ui.text(), /다시 시도/);
    ui.unmount();
  }
});

test("태그 목록은 생성·수정·삭제 후 전달된 서버 props를 바로 반영한다", () => {
  const tag = { id: "1", name: "기존", slug: "old", description: null, created_at: "2026-10-17" };
  const ui = harness("src/app/admin/tags/tag-manager.tsx", "TagManager", { initialTags: [tag] }, {
    "./actions": { createTag() {}, updateTag() {}, deleteTag() {} },
  });
  ui.render({ initialTags: [tag, { ...tag, id: "2", name: "생성", slug: "new" }] });
  assert.match(ui.text(), /생성/);
  ui.render({ initialTags: [{ ...tag, name: "수정", slug: "updated" }] });
  assert.match(ui.text(), /수정/);
  assert.match(ui.text(), /updated/);
  assert.doesNotMatch(ui.text(), /기존/);
  ui.render({ initialTags: [] });
  assert.match(ui.text(), /등록된 태그가 없습니다/);
  ui.unmount();
});

test("검색 역순 응답·검색어 삭제·닫기 후 응답을 무시하고 스크롤과 포커스를 복원한다", async (t) => {
  const trigger = new FakeElement();
  mockGlobal(t, "HTMLElement", FakeElement);
  mockGlobal(t, "document", { activeElement: trigger, body: { style: { overflow: "clip" } } });
  const timers = new Map();
  let timerId = 0;
  t.mock.method(globalThis, "setTimeout", (callback) => { timers.set(++timerId, callback); return timerId; });
  t.mock.method(globalThis, "clearTimeout", (id) => timers.delete(id));
  const runDebounce = () => { for (const [id, callback] of timers) { timers.delete(id); callback(); } };
  const requests = [];
  const client = { from() {
    const request = deferred();
    const chain = {
      select() { return chain; }, eq() { return chain; }, ilike() { return chain; },
      order() { return chain; }, limit() { return chain; },
      abortSignal(signal) { requests.push({ ...request, signal }); return request.promise; },
    };
    return chain;
  } };
  let closes = 0;
  const ui = harness("src/components/search-modal.tsx", "SearchModal", { open: true, onClose: () => { closes++; } }, {
    "@/lib/supabase/client": { createClient: () => client },
  });
  ui.descend();
  ui.replayEffects();
  assert.equal(document.body.style.overflow, "hidden");
  assert.equal(ui.find((node) => node.type === "dialog")[0].props.ref.current.open, true);
  const input = () => ui.find((node) => node.type === "input")[0];
  const change = (value) => { input().props.onChange({ target: { value } }); ui.render(); runDebounce(); };
  const respond = (index, title) => requests[index].resolve({ data: [{ slug: title, title, excerpt: null, content: "", published_at: null }], error: null });
  change("검색A");
  change("검색B");
  assert.equal(requests[0].signal.aborted, true);
  respond(2, "최신 결과"); respond(3, "최신 결과");
  await settle(); ui.render();
  respond(0, "이전 결과"); respond(1, "이전 결과");
  await settle(); ui.render();
  assert.match(ui.text(), /최신 결과/);
  assert.doesNotMatch(ui.text(), /이전 결과/);
  change("삭제할 검색");
  change("");
  respond(4, "삭제 후 결과"); respond(5, "삭제 후 결과");
  await settle(); ui.render();
  assert.doesNotMatch(ui.text(), /삭제 후 결과/);
  change("닫을 검색");
  ui.find((node) => node.props["aria-label"] === "검색 닫기")[0].props.onClick();
  assert.equal(requests[6].signal.aborted, true);
  assert.equal(closes, 1);
  ui.unmount();
  respond(6, "닫힌 후 결과"); respond(7, "닫힌 후 결과");
  await settle();
  assert.equal(ui.lateStateWrites(), 0);
  assert.equal(document.body.style.overflow, "clip");
  assert.equal(document.activeElement, trigger);
});
