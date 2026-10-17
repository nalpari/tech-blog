import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/theme.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function setup({ stored = null, dark = false, blocked = false } = {}) {
  const root = { dataset: {} };
  const storage = new Map(stored === null ? [] : [["techlog-theme", stored]]);
  const media = Object.assign(new EventTarget(), { matches: dark });
  const window = Object.assign(new EventTarget(), {
    localStorage: {
      getItem(key) { if (blocked) throw Error("blocked"); return storage.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw Error("blocked"); storage.set(key, value); },
    },
    matchMedia: () => media,
  });
  const context = vm.createContext({
    exports: {}, Event, window, document: { documentElement: root },
    localStorage: window.localStorage, matchMedia: window.matchMedia,
  });
  vm.runInContext(code, context);
  const theme = context.exports;
  vm.runInContext(theme.THEME_INIT_SCRIPT, context);
  return {
    theme, root, storage,
    setSystem(dark) { media.matches = dark; media.dispatchEvent(new Event("change")); },
    externalPreference(value, key = "techlog-theme") {
      const event = Object.assign(new Event("storage"), { key, newValue: value });
      window.dispatchEvent(event);
    },
  };
}

test("첫 페인트 전 저장된 다크 설정은 시스템 라이트보다 우선한다", () => {
  const { root } = setup({ stored: "dark" });
  assert.equal(root.dataset.theme, "dark");
  assert.equal(root.dataset.themePreference, "dark");
});

test("저장된 라이트 설정은 시스템 다크보다 우선한다", () => {
  const { root } = setup({ stored: "light", dark: true });
  assert.equal(root.dataset.theme, "light");
});

test("설정이 없거나 잘못됐거나 저장소가 차단되면 시스템 설정을 따른다", () => {
  for (const config of [{}, { stored: "invalid" }, { blocked: true }]) {
    const { root } = setup({ ...config, dark: true });
    assert.equal(root.dataset.themePreference, "system");
    assert.equal(root.dataset.theme, "dark");
  }
});

test("시스템 테마 변경은 시스템 선택에만 반영되며 구독 해제 후에는 중단한다", () => {
  const app = setup();
  let notifications = 0;
  const unsubscribe = app.theme.subscribeToTheme(() => notifications++);
  app.setSystem(true);
  assert.equal(app.root.dataset.theme, "dark");
  app.theme.setThemePreference("light");
  app.setSystem(false);
  app.setSystem(true);
  assert.equal(app.root.dataset.theme, "light");
  assert.equal(notifications, 2);
  unsubscribe();
  app.externalPreference("dark");
  assert.equal(app.root.dataset.theme, "light");
});

test("사용자 선택은 저장되고 저장 불가 시에도 현재 페이지에는 적용한다", () => {
  for (const blocked of [false, true]) {
    const app = setup({ blocked });
    app.theme.setThemePreference("dark");
    assert.equal(app.theme.getThemePreference(), "dark");
    assert.equal(app.root.dataset.theme, "dark");
    if (!blocked) assert.equal(app.storage.get("techlog-theme"), "dark");
  }
});

test("다른 탭의 변경과 설정 삭제를 반영하고 다른 키 변경은 무시한다", () => {
  const app = setup();
  const unsubscribe = app.theme.subscribeToTheme(() => {});
  app.externalPreference("dark");
  assert.equal(app.root.dataset.theme, "dark");
  app.externalPreference("light", "another-key");
  assert.equal(app.root.dataset.theme, "dark");
  app.externalPreference(null);
  assert.equal(app.theme.getThemePreference(), "system");
  assert.equal(app.root.dataset.theme, "light");
  unsubscribe();
});

test("SSR 스냅샷은 DOM 없이도 일관된 기본 선택을 제공한다", () => {
  const context = vm.createContext({ exports: {} });
  vm.runInContext(code, context);
  assert.equal(context.exports.getServerThemePreference(), "system");
});
