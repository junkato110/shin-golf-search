import CourseSearch from "@/components/CourseSearch";
import { getAllCourses } from "@/lib/getCourses";

export default function Home() {
  const courses = getAllCourses();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[var(--color-navy)] text-white">
        <div className="max-w-6xl mx-auto px-6 py-10 sm:py-14">
          <p className="text-xs tracking-[0.4em] text-[var(--color-accent)] uppercase font-semibold">
            Tokyo · 3 hours by car
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-wide mt-3 leading-tight">
            本格派が、本気で選ぶ
            <br className="sm:hidden" />
            <span className="text-[var(--color-accent)]"> ゴルフ場検索</span>
          </h1>
          <p className="text-sm text-white/70 mt-4 max-w-xl leading-relaxed">
            既存の予約サイトでは届かない「かゆいところ」へ。
            <br className="hidden sm:inline" />
            フェアウェイの広さ、メシのこだわり、マナーの厳格さ — 体感で絞り込める検索体験を。
          </p>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-6 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
              {courses.length} コース掲載中
            </span>
            <span>無料・登録不要</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <CourseSearch courses={courses} />
      </main>

      <footer className="border-t border-[var(--color-line)] bg-white/40">
        <div className="max-w-6xl mx-auto px-6 py-8 text-xs text-[var(--color-ink-subtle)] flex flex-col sm:flex-row sm:justify-between gap-2">
          <p>© 2026 ゴルフ場検索</p>
          <p>
            データソース: 国土数値情報 / OpenStreetMap / Wikipedia 他 ・ 画像: AI生成
          </p>
        </div>
      </footer>
    </div>
  );
}
