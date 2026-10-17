export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "techlog-theme";
const THEME_CHANGE_EVENT = "techlog-theme-change";
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  root.dataset.themePreference = preference;
  root.dataset.theme = preference === "system"
    ? window.matchMedia(DARK_MEDIA_QUERY).matches ? "dark" : "light"
    : preference;
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function getThemePreference(): ThemePreference {
  const preference = document.documentElement.dataset.themePreference;
  return isThemePreference(preference) ? preference : "system";
}

export function getServerThemePreference(): ThemePreference {
  return "system";
}

export function setThemePreference(preference: ThemePreference) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // 저장소가 차단돼도 현재 페이지의 테마 변경은 허용한다.
  }
  applyTheme(preference);
}

export function subscribeToTheme(onChange: () => void) {
  const media = window.matchMedia(DARK_MEDIA_QUERY);
  const onSystemChange = () => {
    if (getThemePreference() === "system") applyTheme("system");
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      applyTheme(isThemePreference(event.newValue) ? event.newValue : "system");
    }
  };

  // 초기 스크립트 이후 OS 설정이 바뀌었어도 현재 선택에 맞춰 보정한다.
  applyTheme(getThemePreference());
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  media.addEventListener("change", onSystemChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
    media.removeEventListener("change", onSystemChange);
  };
}

// 첫 페인트 전에 실행한다. 사용자 입력을 삽입하지 않는 고정 스크립트다.
// html 속성만 바꾸므로 layout의 suppressHydrationWarning도 html에만 둔다.
export const THEME_INIT_SCRIPT = `(()=>{let p="system";try{const v=localStorage.getItem("${THEME_STORAGE_KEY}");if(v==="light"||v==="dark")p=v}catch{}const r=document.documentElement;r.dataset.themePreference=p;r.dataset.theme=p==="system"?(matchMedia("${DARK_MEDIA_QUERY}").matches?"dark":"light"):p})()`;
