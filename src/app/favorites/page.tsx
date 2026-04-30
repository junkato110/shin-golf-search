import Link from "next/link";
import { getAllCourses } from "@/lib/getCourses";
import HeaderFavoritesLink from "@/components/HeaderFavoritesLink";
import FavoritesList from "./FavoritesList";

export const metadata = {
  title: "お気に入り — シン・ゴルフサーチ",
  description: "登録したお気に入りゴルフ場を一覧で確認できます。",
};

export default function FavoritesPage() {
  const courses = getAllCourses();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-line)] bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-3">
            <span
              className="font-serif text-2xl sm:text-3xl text-[var(--color-navy)]"
              style={{ fontWeight: 700, letterSpacing: "0.08em" }}
            >
              シン・ゴルフサーチ
            </span>
            <span
              className="font-display text-lg sm:text-xl text-[var(--color-navy)] uppercase tracking-[0.2em]"
              style={{ fontWeight: 500 }}
            >
              Shin Golf Search
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-xs tracking-wider text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-navy)]">
              ← 検索に戻る
            </Link>
            <HeaderFavoritesLink />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="section-title">
          <span className="ja">お気に入り</span>
        </div>
        <FavoritesList allCourses={courses} />
      </main>

      <footer className="border-t border-[var(--color-line)] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-xs">
          <p className="font-display tracking-[0.2em] text-[var(--color-ink-subtle)]">
            © 2026 SHIN GOLF SEARCH
          </p>
        </div>
      </footer>
    </div>
  );
}
