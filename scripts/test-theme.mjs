import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/theme.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function setup({ stored = null, blocked = false } = {}) {
  const root = { dataset: {} };
  const storage = new Map(stored === null ? [] : [["techlog-theme", stored]]);
  const window = Object.assign(new EventTarget(), {
    localStorage: {
      getItem(key) { if (blocked) throw Error("blocked"); return storage.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw Error("blocked"); storage.set(key, value); },
    },
  });
  const context = vm.createContext({
    exports: {}, Event, window, document: { documentElement: root },
    localStorage: window.localStorage,
  });
  vm.runInContext(code, context);
  const theme = context.exports;
  vm.runInContext(theme.THEME_INIT_SCRIPT, context);
  return {
    theme, root, storage,
    externalTheme(value, key = "techlog-theme") {
      const event = Object.assign(new Event("storage"), { key, newValue: value });
      window.dispatchEvent(event);
    },
  };
}

test("첫 페인트 전 저장된 다크 설정을 적용한다", () => {
  const { root } = setup({ stored: "dark" });
  assert.equal(root.dataset.theme, "dark");
});

test("설정이 없거나 잘못됐거나 이전 system 값이거나 저장소가 차단되면 라이트가 기본이다", () => {
  for (const config of [{}, { stored: "invalid" }, { stored: "system" }, { stored: "light" }, { blocked: true }]) {
    const { root } = setup(config);
    assert.equal(root.dataset.theme, "light");
  }
});

test("구독 해제 후에는 다른 탭의 변경을 반영하지 않는다", () => {
  const app = setup();
  let notifications = 0;
  const unsubscribe = app.theme.subscribeToTheme(() => notifications++);
  app.theme.setTheme("dark");
  assert.equal(app.root.dataset.theme, "dark");
  assert.equal(notifications, 1);
  unsubscribe();
  app.externalTheme("light");
  assert.equal(app.root.dataset.theme, "dark");
  assert.equal(notifications, 1);
});

test("사용자 선택은 저장되고 저장 불가 시에도 현재 페이지에는 적용한다", () => {
  for (const blocked of [false, true]) {
    const app = setup({ blocked });
    app.theme.setTheme("dark");
    assert.equal(app.theme.getTheme(), "dark");
    assert.equal(app.root.dataset.theme, "dark");
    if (!blocked) assert.equal(app.storage.get("techlog-theme"), "dark");
  }
});

test("다른 탭의 변경과 설정 삭제를 반영하고 다른 키 변경은 무시한다", () => {
  const app = setup();
  const unsubscribe = app.theme.subscribeToTheme(() => {});
  app.externalTheme("dark");
  assert.equal(app.root.dataset.theme, "dark");
  app.externalTheme("light", "another-key");
  assert.equal(app.root.dataset.theme, "dark");
  app.externalTheme(null);
  assert.equal(app.theme.getTheme(), "light");
  assert.equal(app.root.dataset.theme, "light");
  unsubscribe();
});

test("SSR 스냅샷은 DOM 없이도 라이트를 기본으로 제공한다", () => {
  const context = vm.createContext({ exports: {} });
  vm.runInContext(code, context);
  assert.equal(context.exports.getServerTheme(), "light");
});
