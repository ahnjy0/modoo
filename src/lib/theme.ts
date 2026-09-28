export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

// 루트 레이아웃 <head>에서 HTML 파싱 중 동기 실행되어, 첫 페인트 전에 저장된 테마를 적용한다.
// (useEffect로 적용하면 새로고침할 때마다 라이트 화면이 잠깐 번쩍인다.)
export const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}})()`;

const listeners = new Set<() => void>();

export function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  listeners.forEach((listener) => listener());
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // 저장소를 못 쓰는 환경(시크릿 모드 등)에서는 이번 세션에만 적용된다.
  }
  applyTheme(theme);
}

// useSyncExternalStore용: 현재 <html>에 적용된 테마를 기준으로 삼는다.
export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getThemeSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function getServerThemeSnapshot(): Theme {
  return "light";
}
