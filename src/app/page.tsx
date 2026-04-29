import Link from "next/link";
import CourseSearch from "@/components/CourseSearch";
import { getAllCourses } from "@/lib/getCourses";

export default function Home() {
  const courses = getAllCourses();
  // ヒーロー用に画像を持つ最初のコースを使う
  const heroImage =
    courses.find((c) => c.imageUrl)?.imageUrl ?? "";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      {/* 上部ヘッダー (固定/白基調) */}
      <header className="border-b border-[var(--color-line)] bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="font-serif text-lg text-[var(--color-navy)]" style={{ fontWeight: 400, letterSpacing: "0.12em" }}>
              シン・ゴルフサーチ
            </span>
            <span className="font-display text-xs text-[var(--color-accent)] uppercase">
              Shin Golf Search
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-xs tracking-wider text-[var(--color-ink-muted)]">
            <a href="#search" className="hover:text-[var(--color-navy)]">
              検索 <span className="font-display text-[var(--color-accent)]">Search</span>
            </a>
            <a href="#about" className="hover:text-[var(--color-navy)]">
              本サービス <span className="font-display text-[var(--color-accent)]">About</span>
            </a>
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
          <p className="font-display text-xs sm:text-sm text-[var(--color-accent)] tracking-[0.4em] uppercase mb-3">
            Tokyo · within 3 hours by car
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl leading-snug max-w-3xl" style={{ fontWeight: 300, letterSpacing: "0.1em" }}>
            都心から車で3時間以内特化
            <br />
            <span className="text-[var(--color-accent)]">&ldquo;かゆいところに手が届く&rdquo;</span>
            <br />
            「新時代のゴルフ場検索サイト」
          </h1>
          <p className="text-sm text-white/70 mt-4 max-w-xl leading-relaxed">
            フェアウェイの広さ、メシのこだわり、マナーの厳格さ —
            既存の予約サイトでは絞れなかった「体感」で、あなたに合う一コースを探せます。
          </p>
          <div className="mt-5 flex items-center gap-3 text-[10px] sm:text-xs text-white/60 font-display tracking-[0.25em] uppercase">
            <span className="inline-block w-8 border-t border-[var(--color-accent)]" />
            {courses.length} courses listed · free
          </div>
        </div>
      </section>

      <main id="search" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="section-title">
          <span className="ja">コース検索</span>
          <span className="en">Search</span>
        </div>
        <CourseSearch courses={courses} />
      </main>

      <footer className="border-t border-[var(--color-line)] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 grid sm:grid-cols-2 gap-6 text-xs text-[var(--color-ink-muted)]">
          <div>
            <p className="font-serif text-base text-[var(--color-navy)] mb-2" style={{ fontWeight: 400 }}>
              シン・ゴルフサーチ
              <span className="font-display text-xs text-[var(--color-accent)] ml-2">
                Shin Golf Search
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
