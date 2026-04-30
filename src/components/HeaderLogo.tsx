"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Variant = "home" | "compact";

/**
 * 左上のサイトロゴ。
 *
 * variant:
 *   home    - トップページ用 (mobile やや大きめ: text-lg / text-[8px])
 *   compact - 詳細・お気に入り等 (mobile 控えめ: text-base / text-[7px])
 *
 * 既にトップページにいる場合はスムーズに最上部までスクロール、
 * 別ページからは通常通りナビゲートする。
 */
export default function HeaderLogo({ variant = "home" }: { variant?: Variant }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const jaSize =
    variant === "home"
      ? "text-lg sm:text-2xl md:text-3xl"
      : "text-base sm:text-2xl md:text-3xl";
  const enSize =
    variant === "home"
      ? "text-[8px] sm:text-base md:text-xl"
      : "text-[7px] sm:text-base md:text-xl";

  return (
    <Link
      href="/"
      onClick={(e) => {
        if (isHome) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      className="flex items-baseline gap-1.5 sm:gap-3 min-w-0"
    >
      <span
        className={`font-serif ${jaSize} text-[var(--color-navy)] whitespace-nowrap`}
        style={{ fontWeight: 700, letterSpacing: "0.04em" }}
      >
        シン・ゴルフサーチ
      </span>
      <span
        className={`font-display ${enSize} text-[var(--color-navy)] uppercase tracking-[0.05em] sm:tracking-[0.2em] whitespace-nowrap`}
        style={{ fontWeight: 500 }}
      >
        ーSHIN・GOLF SEARCHー
      </span>
    </Link>
  );
}
