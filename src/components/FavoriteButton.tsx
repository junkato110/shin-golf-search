"use client";

import { useFavorites } from "@/lib/useFavorites";

type Variant = "overlay" | "inline";
type Size = "sm" | "md" | "lg";

const SIZE_CLASS: Record<Size, string> = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const ICON_CLASS: Record<Size, string> = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

/**
 * お気に入りトグルボタン (ハート)。
 *
 * variant:
 *   overlay - カードの画像上に重ねる用 (白背景の丸ボタン、shadow付)
 *   inline  - 詳細ページのタイトル横用 (背景なし、ボーダーのみ)
 */
export default function FavoriteButton({
  courseId,
  size = "md",
  variant = "overlay",
}: {
  courseId: string;
  size?: Size;
  variant?: Variant;
}) {
  const { isFavorite, toggle, loaded } = useFavorites();
  const fav = loaded && isFavorite(courseId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(courseId);
  };

  const baseClass =
    variant === "overlay"
      ? "rounded-full bg-white/95 backdrop-blur border border-[var(--color-line)] shadow-sm hover:bg-white"
      : "rounded-full border border-[var(--color-line-strong)] bg-white hover:border-[var(--color-navy)]";

  return (
    <button
      type="button"
      aria-label={fav ? "お気に入りから外す" : "お気に入りに追加"}
      aria-pressed={fav}
      onClick={handleClick}
      className={`${SIZE_CLASS[size]} ${baseClass} transition-colors flex items-center justify-center`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`${ICON_CLASS[size]} transition-colors`}
        fill={fav ? "var(--color-accent)" : "none"}
        stroke={fav ? "var(--color-accent)" : "var(--color-navy)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
