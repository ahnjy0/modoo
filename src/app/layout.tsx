import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SHARE_TITLE = "MODOO-모두의 이야기";
const SHARE_DESCRIPTION = "모두의 디자인 커뮤니티";

export const metadata: Metadata = {
  // og:image 등 URL 기반 메타데이터를 절대경로로 만들기 위한 기준 주소(없으면 공유 미리보기 이미지가 깨진다).
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://modoocommunity.vercel.app"),
  title: "MODOO",
  description: SHARE_DESCRIPTION,
  // 썸네일 이미지는 src/app/opengraph-image.tsx가 자동으로 og:image / twitter:image에 연결된다.
  openGraph: {
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    siteName: "MODOO",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
