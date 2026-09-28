import { ImageResponse } from "next/og";

// URL 공유 시 미리보기(카카오톡, 슬랙, X 등)에 쓰이는 썸네일. 루트에 두어 모든 페이지에 적용된다.
// Header.tsx의 로고(인디고 라운드 박스 + MessageCircle 아이콘 + "MODOO" 워드마크)를 그대로 그린다.
export const alt = "MODOO - 모두의 이야기";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// lucide-react MessageCircle 아이콘 path (Header 로고와 동일한 아이콘)
const MESSAGE_CIRCLE_PATH =
  "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719";

// next/og에는 Geist Regular만 내장되어 있어, 헤더와 같은 굵기(extrabold)를 위해 "MODOO" 글자만 받아온다.
// 네트워크 실패 시에는 내장 폰트로 그려서 빌드가 깨지지 않게 한다.
async function loadWordmarkFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Geist:wght@800&text=MODOO"
    ).then((res) => res.text());
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Image() {
  const fontData = await loadWordmarkFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
          background: "linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)",
        }}
      >
        <div
          style={{
            width: 200,
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 56,
            background: "#4f46e5",
            boxShadow: "0 24px 48px rgba(79, 70, 229, 0.25)",
          }}
        >
          <svg width="104" height="104" viewBox="0 0 24 24" fill="#ffffff">
            <path d={MESSAGE_CIRCLE_PATH} />
          </svg>
        </div>
        <div
          style={{
            fontSize: 168,
            fontWeight: 800,
            letterSpacing: -4,
            color: "#4f46e5",
            fontFamily: fontData ? "Geist" : undefined,
          }}
        >
          MODOO
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData ? [{ name: "Geist", data: fontData, weight: 800, style: "normal" }] : undefined,
    }
  );
}
