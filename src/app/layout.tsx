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

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const SITE_NAME = "シン・ゴルフサーチ";
const SITE_TITLE = `${SITE_NAME} — 都心から3時間以内特化のゴルフ場検索`;
const SITE_DESCRIPTION =
  "都心から3時間以内特化。マナー・難易度・フェアウェイの広さ・ご飯の美味しさなど、今までの予約サイトでは絞れなかった「体感スコア」で本当に探しているベストコースを探せる新時代のゴルフ場検索サイト。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "ja_JP",
    url: SITE_URL,
    images: [
      {
        url: "/images/hero-bg.jpg",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/images/hero-bg.jpg"],
  },
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
