"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/useFavorites";

export default function HeaderFavoritesLink() {
  const { count, loaded } = useFavorites();

  return (
    <Link
      href="/favorites"
      className="inline-flex items-center gap-1.5 text-xs tracking-wider text-[var(--color-ink-muted)] hover:text-[var(--color-navy)] transition-colors"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      お気に入り
      {loaded && count > 0 && (
        <span className="font-display text-[var(--color-accent)]" aria-label={`${count}件`}>
          {count}
        </span>
      )}
    </Link>
  );
}
