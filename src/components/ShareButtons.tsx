"use client";

import { useEffect, useState } from "react";

type Props = {
  /** シェア時のタイトル/本文に使うコース名 */
  courseName: string;
};

export default function ShareButtons({ courseName }: Props) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    // クライアントマウント時のみ取得 (SSR では window が無い)
    /* eslint-disable react-hooks/set-state-in-effect */
    setUrl(window.location.href);
    setHasNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const text = `${courseName} | シン・ゴルフサーチ`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボード API が使えない環境向けフォールバック
      prompt("リンクをコピーしてください", url);
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title: text, url });
    } catch {
      /* ユーザーがキャンセルした場合などは無視 */
    }
  }

  const xHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  const lineHref = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <section className="mb-8 sm:mb-10">
      <div className="flex items-baseline gap-3 mb-3 sm:mb-4">
        <h2
          className="font-serif text-sm sm:text-lg text-[var(--color-navy)] flex items-center gap-3"
          style={{ fontWeight: 700, letterSpacing: "0.08em" }}
        >
          <span className="inline-block w-1 h-5 bg-[var(--color-accent)]" />
          シェア
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-navy)] text-xs sm:text-sm text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white transition-colors"
          style={{ fontWeight: 500 }}
        >
          <IconLink />
          {copied ? "コピーしました" : "リンクをコピー"}
        </button>

        {hasNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-navy)] text-xs sm:text-sm text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white transition-colors"
            style={{ fontWeight: 500 }}
          >
            <IconShare />
            その他のアプリ
          </button>
        )}

        {url && (
          <>
            <ShareLink href={xHref} label="X (Twitter)" icon={<IconX />} />
            <ShareLink href={lineHref} label="LINE" icon={<IconLine />} />
            <ShareLink href={fbHref} label="Facebook" icon={<IconFacebook />} />
          </>
        )}
      </div>
    </section>
  );
}

function ShareLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-navy)] text-xs sm:text-sm text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white transition-colors"
      style={{ fontWeight: 500 }}
    >
      {icon}
      {label}
    </a>
  );
}

const ICON_CLASS = "w-3.5 h-3.5 sm:w-4 sm:h-4";

function IconLink() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={ICON_CLASS} aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={ICON_CLASS} aria-hidden>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconLine() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden>
      <path d="M19.365 9.89c.50 0 .906.41.906.91s-.406.913-.906.913h-1.265v.812h1.265c.5 0 .906.41.906.913 0 .5-.406.91-.906.91h-2.175c-.5 0-.906-.41-.906-.91v-4.35c0-.5.406-.91.906-.91h2.175c.5 0 .906.41.906.91 0 .502-.406.912-.906.912H18.1v.812h1.265zM15.55 13.435c0 .5-.406.91-.906.91-.286 0-.547-.13-.717-.36L11.7 11.18v2.255c0 .5-.406.91-.906.91-.5 0-.906-.41-.906-.91v-4.35c0-.5.406-.91.906-.91.286 0 .547.13.717.36l2.227 2.81V9.084c0-.5.406-.913.906-.913.5 0 .906.413.906.913zm-6.66 0c0 .5-.406.91-.906.91s-.906-.41-.906-.91v-4.35c0-.5.406-.913.906-.913s.906.413.906.913zM6.45 14.345H4.275c-.5 0-.906-.41-.906-.91v-4.35c0-.5.406-.913.906-.913s.906.413.906.913v3.435h1.27c.5 0 .906.41.906.913 0 .5-.41.912-.91.912zM24 10.314C24 4.943 18.616.6 12 .6S0 4.943 0 10.314c0 4.81 4.27 8.84 10.035 9.605.39.084.923.258 1.058.59.122.302.08.776.04 1.082l-.171 1.027c-.053.302-.242 1.187 1.04.647 1.281-.54 6.91-4.07 9.43-6.97C23.156 14.39 24 12.46 24 10.314" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073" />
    </svg>
  );
}
