export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "techlog-theme";
const THEME_CHANGE_EVENT = "techlog-theme-change";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function getTheme(): Theme {
  const theme = document.documentElement.dataset.theme;
  return isTheme(theme) ? theme : "light";
}

export function getServerTheme(): Theme {
  return "light";
}

export function setTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // 저장소가 차단돼도 현재 페이지의 테마 변경은 허용한다.
  }
  applyTheme(theme);
}

export function subscribeToTheme(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      applyTheme(isTheme(event.newValue) ? event.newValue : "light");
    }
  };

  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

// 첫 페인트 전에 실행한다. 사용자 입력을 삽입하지 않는 고정 스크립트다.
// html 속성만 바꾸므로 layout의 suppressHydrationWarning도 html에만 둔다.
export const THEME_INIT_SCRIPT = `(()=>{let t="light";try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark")t="dark"}catch{}document.documentElement.dataset.theme=t})()`;
