"use client";

import { useEffect, useState } from "react";

type Props = {
  /** シェア時のタイトル/本文に使うコース名 */
  courseName: string;
};

export default function ShareButtons({ courseName }: Props) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // クライアントマウント時にのみ取得 (SSR では window が無い)
    /* eslint-disable react-hooks/set-state-in-effect */
    setUrl(window.location.href);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const text = `${courseName} | シン・ゴルフサーチ`;

  async function copyLink() {
    const target = url || (typeof window !== "undefined" ? window.location.href : "");
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("リンクをコピーしてください", target);
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
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 border border-[var(--color-navy)] text-[11px] sm:text-sm text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white transition-colors whitespace-nowrap"
          style={{ fontWeight: 500 }}
        >
          <IconLink />
          {copied ? "コピーしました" : "URLコピー"}
        </button>

        <ShareLink href={xHref} label="X" icon={<IconX />} />
        <ShareLink href={lineHref} label="LINE" icon={<IconLine />} />
        <ShareLink href={fbHref} label="Facebook" icon={<IconFacebook />} />
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
      aria-label={label}
      className="inline-flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 border border-[var(--color-navy)] text-[11px] sm:text-sm text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white transition-colors whitespace-nowrap"
      style={{ fontWeight: 500 }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
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

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconLine() {
  // 簡略化したチャットバブルアイコン (LINE 風)
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden>
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.45 1.4 4.65 3.6 6.11-.18.74-.65 2.61-.74 3.01-.11.5.18.49.39.36.16-.1 2.55-1.74 3.58-2.45.99.18 2.04.28 3.17.28 5.52 0 10-3.58 10-8s-4.48-7.31-10-7.31zM7.7 12.71H6.4v-3.1c0-.16-.13-.29-.29-.29-.16 0-.29.13-.29.29v3.39c0 .16.13.29.29.29H7.7c.16 0 .29-.13.29-.29 0-.16-.13-.29-.29-.29zm2.1-3.39c0-.16-.13-.29-.29-.29-.16 0-.29.13-.29.29v3.39c0 .16.13.29.29.29.16 0 .29-.13.29-.29V9.32zm4.18 3.39c0 .12-.08.23-.19.27-.04.01-.07.02-.1.02-.09 0-.18-.04-.23-.12l-1.43-1.95v1.78c0 .16-.13.29-.29.29-.16 0-.29-.13-.29-.29V9.32c0-.12.08-.23.19-.27.04-.01.07-.02.1-.02.09 0 .18.04.23.12l1.43 1.95V9.32c0-.16.13-.29.29-.29.16 0 .29.13.29.29v3.39zm3.04-1.99c.16 0 .29.13.29.29 0 .16-.13.29-.29.29h-1.05v.83h1.05c.16 0 .29.13.29.29s-.13.29-.29.29h-1.34c-.16 0-.29-.13-.29-.29V9.32c0-.16.13-.29.29-.29h1.34c.16 0 .29.13.29.29s-.13.29-.29.29h-1.05v.83h1.05z" />
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
