import type { Metadata } from "next";
import { Geist_Mono, Noto_Serif_JP, Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";

// Proxima Nova の代替として Montserrat を採用
const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600"],
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
      className={`${montserrat.variable} ${geistMono.variable} ${notoSerifJP.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
