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
            <span className="font-serif text-lg font-semibold text-[var(--color-navy)] tracking-wide">
              ゴルフ場検索
            </span>
            <span className="font-display text-xs text-[var(--color-accent)] tracking-[0.3em] uppercase">
              Golf Course Finder
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
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <p className="font-display text-sm text-[var(--color-accent)] tracking-[0.4em] uppercase mb-4">
            Tokyo · 3 hours by car
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold leading-tight tracking-wider">
            本格派が、本気で選ぶ。
          </h1>
          <p className="text-sm sm:text-base text-white/75 mt-6 max-w-xl leading-relaxed">
            既存の予約サイトでは届かない「かゆいところ」へ。
            <br />
            フェアウェイの広さ、メシのこだわり、マナーの厳格さ —
            <br className="hidden sm:inline" />
            あなたの体感で、ゴルフ場を絞り込む。
          </p>
          <div className="mt-10 flex items-center gap-3 text-xs text-white/60 font-display tracking-[0.2em] uppercase">
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
            <p className="font-serif text-base text-[var(--color-navy)] mb-2">
              ゴルフ場検索 <span className="font-display text-xs text-[var(--color-accent)] ml-2 tracking-[0.2em]">Golf Course Finder</span>
            </p>
            <p>東京駅から車で3時間圏内のゴルフ場を、体感軸で検索。</p>
          </div>
          <div className="sm:text-right">
            <p>データソース: 国土数値情報 / OpenStreetMap / Wikipedia 他</p>
            <p>画像: AI 生成 (Pollinations.ai)</p>
            <p className="mt-2 font-display tracking-[0.2em] text-[var(--color-ink-subtle)]">
              © 2026 GOLF COURSE FINDER
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
