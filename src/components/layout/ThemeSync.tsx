"use client";

import { useLayoutEffect } from "react";
import { applyTheme, readStoredTheme } from "@/lib/theme";

// 개발 모드의 Strict Mode 리마운트는 <html> 속성을 JSX 기준으로 되돌려서 인라인 스크립트가 붙인
// data-theme를 지워버린다. 그걸 페인트 전에 다시 적용한다. 프로덕션에서는 사실상 no-op.
export function ThemeSync() {
  useLayoutEffect(() => {
    applyTheme(readStoredTheme());
  }, []);

  return null;
}
