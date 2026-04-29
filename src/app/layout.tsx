import type { Metadata } from "next";
import { Geist_Mono, Barlow_Condensed, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

// テラスハウス風: Proxima Nova Condensed Thin の代替として Barlow Condensed
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  weight: ["100", "200", "300", "400", "500"],
  subsets: ["latin"],
});

// 小塚ゴシックの代替として Noto Sans JP (Light weight)
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "シン・ゴルフサーチ — 都心から3時間以内特化のゴルフ場検索",
  description:
    "都心から3時間以内特化。「かゆいところに手が届く」新時代のゴルフ場検索サイト。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${barlowCondensed.variable} ${notoSansJP.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
