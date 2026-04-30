import Link from "next/link";
import CourseSearch from "@/components/CourseSearch";
import FeedbackForm from "@/components/FeedbackForm";
import HeaderFavoritesLink from "@/components/HeaderFavoritesLink";
import { getAllCourses } from "@/lib/getCourses";

export default function Home() {
  const courses = getAllCourses();
  const heroImage = "/images/hero-bg.jpg";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      {/* 上部ヘッダー (固定/白基調) */}
      <header className="border-b border-[var(--color-line)] bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="font-serif text-2xl sm:text-3xl text-[var(--color-navy)]" style={{ fontWeight: 700, letterSpacing: "0.08em" }}>
              シン・ゴルフサーチ
            </span>
            <span className="font-display text-lg sm:text-xl text-[var(--color-navy)] uppercase tracking-[0.2em]" style={{ fontWeight: 500 }}>
              ーSHIN・GOLF SEARCHー
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-xs tracking-wider text-[var(--color-ink-muted)]">
            <HeaderFavoritesLink />
          </nav>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="relative bg-[var(--color-navy)] text-white overflow-hidden">
        {heroImage && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt=""
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-navy)] via-[var(--color-navy)]/70 to-transparent" />
          </div>
        )}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <h1 className="font-serif text-2xl sm:text-3xl leading-snug max-w-4xl" style={{ fontWeight: 700, letterSpacing: "0.06em" }}>
            都心から車で3時間以内特化
            <br />
            <span className="text-[var(--color-accent)]">&ldquo;かゆいところに手が届く&rdquo;</span>{" "}
            「新時代のゴルフ場検索サイト」
          </h1>
          <p className="text-sm text-white/75 mt-4 leading-relaxed whitespace-nowrap overflow-x-auto">
            マナーの厳格さ、難易度、フェアウェイの広さ、ご飯の美味しさ etc…
            <br />
            今までの予約サイトでは絞れなかった「体感スコア」で、あなたの本当に探しているベストコースを探せます
          </p>
        </div>
      </section>

      <main id="search" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="section-title">
          <span className="ja">コース検索</span>
        </div>
        <CourseSearch courses={courses} />
      </main>

      <FeedbackForm />

      <footer className="border-t border-[var(--color-line)] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 grid sm:grid-cols-2 gap-6 text-xs text-[var(--color-ink-muted)]">
          <div>
            <p className="font-serif text-base text-[var(--color-navy)] mb-2" style={{ fontWeight: 400 }}>
              シン・ゴルフサーチ
              <span className="font-display text-xs text-[var(--color-accent)] ml-2">
                ーSHIN・GOLF SEARCHー
              </span>
            </p>
            <p>都心から3時間以内特化。「かゆいところに手が届く」新時代のゴルフ場検索サイト。</p>
          </div>
          <div className="sm:text-right">
            <p>データソース: 国土数値情報 / OpenStreetMap / Wikipedia 他</p>
            <p>画像: AI 生成 (Pollinations.ai)</p>
            <p className="mt-2 font-display tracking-[0.2em] text-[var(--color-ink-subtle)]">
              © 2026 SHIN GOLF SEARCH
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
