import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCourseById, getAllCourses } from "@/lib/getCourses";
import { getReservationLinks } from "@/lib/reservationLinks";
import { formatTravelTime } from "@/lib/distance";
import FavoriteButton from "@/components/FavoriteButton";
import HeaderFavoritesLink from "@/components/HeaderFavoritesLink";
import ShareButtons from "@/components/ShareButtons";
import type { CourseScores } from "@/types";

export async function generateStaticParams() {
  return getAllCourses().map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = getCourseById(id);
  if (!c) return { title: "コースが見つかりません" };
  return {
    title: `${c.name} — シン・ゴルフサーチ`,
    description: `${c.prefecture}${c.city ?? ""} のゴルフ場「${c.name}」の基本情報。`,
  };
}

type ScoreAxisDef = {
  key: keyof CourseScores;
  label: string;
  /** バー左端の補足ラベル (低スコア側) */
  low: string;
  /** バー右端の補足ラベル (高スコア側) */
  high: string;
};

const SCORE_AXES: ScoreAxisDef[] = [
  { key: "difficulty", label: "難易度", low: "易しい", high: "難しい" },
  { key: "fairwayWidth", label: "フェアウェイ", low: "狭い", high: "広い" },
  { key: "flatness", label: "フラット度", low: "起伏あり", high: "フラット" },
  { key: "mealQuality", label: "ご飯", low: "並", high: "こだわりあり" },
  { key: "mannerStrictness", label: "マナー", low: "緩い (初心者歓迎)", high: "厳しい (名門寄り)" },
  { key: "practiceRange", label: "練習場", low: "簡素", high: "充実" },
  { key: "summerCool", label: "夏の涼しさ", low: "暑い", high: "涼しい" },
  { key: "winterWarm", label: "冬の温かさ", low: "寒い", high: "温かい" },
  { key: "windShelter", label: "風の影響", low: "影響大", high: "影響少" },
  { key: "scenicView", label: "絶景度", low: "並", high: "絶景コースあり" },
  { key: "womenFriendly", label: "女性向け", low: "並", high: "こだわりあり" },
  { key: "seniorFriendly", label: "シニア向け", low: "並", high: "歩きやすい" },
];

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = getCourseById(id);
  if (!course) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-line)] bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-baseline gap-1.5 sm:gap-3 min-w-0">
            <span
              className="font-serif text-base sm:text-2xl md:text-3xl text-[var(--color-navy)] whitespace-nowrap"
              style={{ fontWeight: 700, letterSpacing: "0.04em" }}
            >
              シン・ゴルフサーチ
            </span>
            <span
              className="font-display text-[7px] sm:text-base md:text-xl text-[var(--color-navy)] uppercase tracking-[0.05em] sm:tracking-[0.2em] whitespace-nowrap"
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

      {course.imageUrl && (
        <div className="w-full bg-neutral-100 grid grid-cols-1 md:grid-cols-2 gap-1 md:h-[220px] lg:h-[260px]">
          {/* メイン: 名物ホール (モバイルではこの1枚のみ表示) */}
          <div className="relative overflow-hidden aspect-[16/6] sm:aspect-[16/7] md:aspect-auto md:h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={course.imageUrl}
              alt={`${course.name} 名物ホール`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
            <span className="absolute bottom-2 left-3 sm:bottom-3 sm:left-4 text-[10px] sm:text-[11px] tracking-[0.2em] text-white font-medium font-display uppercase">
              Signature Hole
            </span>
          </div>
          {/* サブ: クラブハウス外観 (md 以上で表示) */}
          {course.additionalImages?.[0] && (
            <div className="hidden md:block relative overflow-hidden md:h-full">
              {course.additionalImages[0].url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={course.additionalImages[0].url}
                  alt={`${course.name} ${course.additionalImages[0].label}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-200" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              <span className="absolute bottom-3 left-4 text-[11px] tracking-[0.2em] text-white font-medium font-display uppercase">
                Club House
              </span>
            </div>
          )}
        </div>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-[var(--color-line)]">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <h1
              className="font-serif text-lg sm:text-2xl md:text-3xl text-[var(--color-navy)] leading-snug"
              style={{ fontWeight: 700, letterSpacing: "0.04em" }}
            >
              {course.name}
            </h1>
            <div className="shrink-0">
              <FavoriteButton courseId={course.id} variant="inline" size="md" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] mt-3 sm:mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span>
              {course.address ?? `${course.prefecture}${course.city ?? ""}`}
            </span>
            <a
              href={`https://www.google.com/maps?q=${encodeURIComponent(
                // コース名 + 住所 (郵便番号は除去) で確実に対象施設に辿り着けるようにする
                `${course.name} ${(course.address ?? "").replace(/〒\d{3}-\d{4}\s*/, "")}`.trim()
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-navy)] border border-[var(--color-line-strong)] px-2.5 py-1 hover:bg-[var(--color-navy)] hover:text-white transition-colors tracking-wide"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-4 h-4 shrink-0"
                aria-hidden
              >
                {/* Google Maps 風の赤ピン (色はホバーに依らず固定) */}
                <path
                  fill="#EA4335"
                  d="M12 2C7.58 2 4 5.58 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8z"
                />
                <circle fill="#FFFFFF" cx="12" cy="10" r="2.5" />
              </svg>
              Google Maps
            </a>
          </p>
        </div>

        {/* 基本情報 */}
        <section className="mb-10">
          <div className="bg-[var(--color-bg-soft)] border border-[var(--color-line)] p-4 sm:p-8">
            <div className="flex items-baseline gap-3 mb-6 pb-4 border-b border-[var(--color-line)]">
              <h2
                className="font-serif text-sm sm:text-lg text-[var(--color-navy)]"
                style={{ fontWeight: 700, letterSpacing: "0.08em" }}
              >
                基本情報
              </h2>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-6">
            <Stat label="距離" value={course.totalYardage ? `${course.totalYardage} yd` : "—"} />
            <Stat
              label="東京駅から車で"
              value={
                course.travelMinutesFromTokyo != null
                  ? formatTravelTime(course.travelMinutesFromTokyo).replace("目安 ", "")
                  : "—"
              }
            />
            <Stat
              label="カート乗入"
              value={
                course.cartFairwayIn == null
                  ? "—"
                  : course.cartFairwayIn
                  ? "フェアウェイ可"
                  : "カート道のみ"
              }
            />
            <Stat
              label="お風呂"
              value={
                !course.hasBath
                  ? "なし"
                  : (course.scores?.onsen ?? 0) >= 1
                  ? "温泉あり"
                  : "大浴場あり"
              }
            />
            <Stat label="キャディ" value={course.caddyType ?? "—"} />
            <Stat label="コース形態" value={course.courseLayout ?? "—"} />
            <Stat label="ドレスコード" value={course.dressCode ?? "—"} />
            <Stat
              label="スループレー"
              value={
                course.throughPlay == null
                  ? "—"
                  : course.throughPlay
                  ? "対応"
                  : "非対応"
              }
            />
            {course.designer && (
              <Stat label="設計" value={course.designer} className="col-span-2" />
            )}
          </dl>
          </div>
        </section>

        {/* 体感スコア */}
        {course.scores && (
          <section className="mb-10">
            <div className="bg-[var(--color-bg-soft)] border border-[var(--color-line)] p-4 sm:p-8">
              <div className="flex items-baseline gap-3 mb-6 pb-4 border-b border-[var(--color-line)]">
                <h2
                  className="font-serif text-sm sm:text-lg text-[var(--color-navy)]"
                  style={{ fontWeight: 700, letterSpacing: "0.08em" }}
                >
                  体感スコア
                </h2>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                {SCORE_AXES.map((axis) => {
                  const value = course.scores?.[axis.key];
                  if (value == null) return null;
                  return <ScoreRow key={axis.key} axis={axis} value={value} />;
                })}
              </ul>
            </div>
          </section>
        )}

        {/* タグ */}
        {course.tags && course.tags.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline gap-3 mb-4">
              <h2
                className="font-serif text-lg text-[var(--color-navy)] flex items-center gap-3"
                style={{ fontWeight: 700, letterSpacing: "0.08em" }}
              >
                <span className="inline-block w-1 h-5 bg-[var(--color-accent)]" />
                特徴
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {course.tags.slice(0, 6).map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 border border-[var(--color-navy)]/30 bg-white text-[var(--color-navy)] text-xs sm:text-sm tracking-wide"
                  style={{ fontWeight: 600 }}
                >
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 予約サイトで探す */}
        <section className="mb-10">
          <div className="flex items-baseline gap-3 mb-4">
            <h2
              className="font-serif text-sm sm:text-lg text-[var(--color-navy)] flex items-center gap-3"
              style={{ fontWeight: 700, letterSpacing: "0.08em" }}
            >
              <span className="inline-block w-1 h-5 bg-[var(--color-accent)]" />
              予約・空き確認はコチラから
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {getReservationLinks().map((l) => (
              <ExternalButton
                key={l.label}
                label={l.label}
                href={l.href}
                iconPath={l.iconPath}
                isAffiliate={l.isAffiliate}
              />
            ))}
          </div>
          {getReservationLinks().some((l) => l.isAffiliate) && (
            <p className="text-[10px] text-[var(--color-ink-subtle)] mt-3 tracking-wider">
              ※ 一部リンクは提携サイトの広告 (PR) を含みます
            </p>
          )}
        </section>

        <ShareButtons courseName={course.name} />

        {/* 補足リンク */}
        <section className="mb-10 pt-6 border-t border-[var(--color-line)] flex flex-col sm:flex-row gap-4 justify-between text-xs text-[var(--color-ink-subtle)]">
          <div className="flex flex-wrap gap-4">
            {course.officialUrl && (
              <a
                href={course.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-navy)] hover:text-[var(--color-accent)] underline"
              >
                公式サイト →
              </a>
            )}
          </div>
          <span>データ: {(course.sources ?? []).join(" / ") || "—"}</span>
        </section>

        <div className="text-center pt-6">
          <Link
            href="/"
            className="inline-block font-display tracking-[0.25em] uppercase text-xs px-6 py-3 border border-[var(--color-navy)] text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white transition-colors"
          >
            ← Back to search
          </Link>
        </div>
      </main>

      <footer className="border-t border-[var(--color-line)] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 text-xs text-[var(--color-ink-muted)] text-center">
          <p className="font-display tracking-[0.2em] text-[var(--color-ink-subtle)]">
            © 2026 SHIN GOLF SEARCH
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * 「緩い (初心者歓迎)」のような括弧付きラベルを、括弧の手前で改行して2行にする。
 */
function renderAxisLabel(text: string) {
  const idx = text.search(/[(（]/);
  if (idx > 0) {
    return (
      <>
        {text.slice(0, idx).trim()}
        <br />
        {text.slice(idx).trim()}
      </>
    );
  }
  return text;
}

/**
 * 体感スコアの1行 (5段階バー + 両端ラベル)
 *
 * 内部スコアは 0/1/2 の3段階だが、視認性を上げるため5セグメントにマップ:
 *   value=0 → 1セグメント点灯 (低)
 *   value=1 → 3セグメント点灯 (中)
 *   value=2 → 5セグメント点灯 (高、ゴールド色で強調)
 */
function ScoreRow({ axis, value }: { axis: ScoreAxisDef; value: number }) {
  const filled = value * 2 + 1; // 1, 3, or 5
  const isMax = value === 2;
  const fillColor = isMax ? "var(--color-accent)" : "var(--color-navy)";
  return (
    <li className="border-b border-dashed border-[var(--color-line)] pb-3 sm:pb-4">
      <p
        className="text-xs sm:text-sm text-[var(--color-navy)] mb-2 sm:mb-2.5 tracking-wide"
        style={{ fontWeight: 700 }}
      >
        {axis.label}
      </p>
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-[10px] sm:text-[11px] text-[var(--color-ink-subtle)] w-16 sm:w-24 text-center shrink-0 tracking-wide leading-tight">
          {renderAxisLabel(axis.low)}
        </span>
        <div className="flex gap-1 flex-1 min-w-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="h-2 sm:h-3 flex-1 rounded-sm"
              style={{
                backgroundColor: i < filled ? fillColor : "rgba(1, 50, 32, 0.1)",
              }}
            />
          ))}
        </div>
        <span
          className={`text-[10px] sm:text-[11px] w-16 sm:w-24 text-center shrink-0 tracking-wide leading-tight ${
            isMax
              ? "text-[var(--color-accent)] font-semibold"
              : "text-[var(--color-ink-subtle)]"
          }`}
        >
          {renderAxisLabel(axis.high)}
        </span>
      </div>
    </li>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[10px] text-[var(--color-ink-muted)] tracking-wider mb-1 sm:mb-1.5 font-medium">
        {label}
      </dt>
      <dd
        className="font-serif text-sm sm:text-xl text-[var(--color-navy)] leading-tight"
        style={{ fontWeight: 700, letterSpacing: "0.02em" }}
      >
        {value}
      </dd>
    </div>
  );
}

function ExternalButton({
  label,
  href,
  iconPath,
  isAffiliate,
}: {
  label: string;
  href: string;
  iconPath: string;
  isAffiliate?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel={isAffiliate ? "sponsored noopener noreferrer" : "noopener noreferrer"}
      className="group relative flex items-center gap-3 border border-[var(--color-navy)] px-4 py-3 text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white transition-colors"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={iconPath}
        alt={`${label} ロゴ`}
        className="w-7 h-7 rounded-sm object-contain bg-white border border-[var(--color-line)] shrink-0"
      />
      <span className="flex flex-col items-start min-w-0">
        <span className="font-serif text-sm leading-tight" style={{ fontWeight: 600 }}>
          {label}
        </span>
        <span className="text-[10px] opacity-70 tracking-wider">で探す →</span>
      </span>
      {isAffiliate && (
        <span className="absolute top-1 right-2 font-display text-[9px] tracking-wider text-[var(--color-accent)]">
          PR
        </span>
      )}
    </a>
  );
}
