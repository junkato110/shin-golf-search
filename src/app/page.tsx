import CourseSearch from "@/components/CourseSearch";
import { getAllCourses } from "@/lib/getCourses";

export default function Home() {
  const courses = getAllCourses();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <h1 className="text-2xl font-bold tracking-tight">
            🏌️ ゴルフ場検索
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            既存サイトでは見つからない「かゆいところに手が届く」検索 — 東京駅から車で3時間圏内
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <CourseSearch courses={courses} />
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-12 text-xs text-neutral-500">
        <p>
          現在 {courses.length} コースの仮データを表示中。今後 Claude Code で順次データを蓄積予定。
        </p>
      </footer>
    </div>
  );
}
