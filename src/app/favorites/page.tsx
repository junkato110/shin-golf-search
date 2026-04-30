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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-baseline gap-3 min-w-0">
            <span
              className="font-serif text-xl sm:text-2xl md:text-3xl text-[var(--color-navy)] whitespace-nowrap"
              style={{ fontWeight: 700, letterSpacing: "0.06em" }}
            >
              シン・ゴルフサーチ
            </span>
            <span
              className="hidden md:inline font-display text-lg md:text-xl text-[var(--color-navy)] uppercase tracking-[0.2em] whitespace-nowrap"
              style={{ fontWeight: 500 }}
            >
              ーSHIN・GOLF SEARCHー
            </span>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6 text-xs tracking-wider text-[var(--color-ink-muted)] shrink-0">
            <Link href="/" className="hover:text-[var(--color-navy)] whitespace-nowrap">
              <span className="hidden sm:inline">← 検索に戻る</span>
              <span className="sm:hidden">← 戻る</span>
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
