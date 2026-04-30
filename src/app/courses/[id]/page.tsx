import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCourseById, getAllCourses } from "@/lib/getCourses";
import { getReservationLinks } from "@/lib/reservationLinks";
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
  { key: "windShelter", label: "風の影響", low: "風強い", high: "影響少" },
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
          <Link
            href="/"
            className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-navy)] tracking-wider"
          >
            ← 検索に戻る
          </Link>
        </div>
      </header>

      {course.imageUrl && (
        <div className="w-full bg-neutral-100 aspect-[16/6] relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="mb-8 pb-6 border-b border-[var(--color-line)]">
          <p className="font-display text-xs text-[var(--color-accent)] tracking-[0.3em] uppercase mb-2">
            Course Detail
          </p>
          <h1
            className="font-serif text-2xl sm:text-3xl text-[var(--color-navy)] leading-snug"
            style={{ fontWeight: 700, letterSpacing: "0.04em" }}
          >
            {course.name}
          </h1>
          {course.nameKana && (
            <p className="text-xs text-[var(--color-ink-subtle)] mt-2 tracking-wide">
              {course.nameKana}
            </p>
          )}
          <p className="text-sm text-[var(--color-ink-muted)] mt-4">
            {course.prefecture}
            {course.city ? ` · ${course.city}` : ""}
            {course.address ? ` · ${course.address}` : ""}
          </p>
        </div>

        {/* 基本情報 */}
        <section className="mb-10">
          <div className="flex items-baseline gap-3 mb-5">
            <h2
              className="font-serif text-base text-[var(--color-navy)]"
              style={{ fontWeight: 700, letterSpacing: "0.08em" }}
            >
              基本情報
            </h2>
            <span className="font-display text-[10px] text-[var(--color-accent)] uppercase tracking-[0.3em]">
              Overview
            </span>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-6">
            <Stat label="ホール数" value={course.holeCount ? `${course.holeCount}H` : "—"} />
            <Stat label="距離" value={course.totalYardage ? `${course.totalYardage} yd` : "—"} />
            <Stat label="par" value={course.par ? String(course.par) : "—"} />
            <Stat label="開業" value={course.openedYear ? `${course.openedYear}年` : "—"} />
            <Stat label="お風呂" value={course.hasBath ? "あり" : "なし"} />
            {course.designer && (
              <Stat label="設計" value={course.designer} className="col-span-2" />
            )}
          </dl>
        </section>

        {/* 体感スコア */}
        {course.scores && (
          <section className="mb-10">
            <div className="flex items-baseline gap-3 mb-5">
              <h2
                className="font-serif text-base text-[var(--color-navy)]"
                style={{ fontWeight: 700, letterSpacing: "0.08em" }}
              >
                体感スコア
              </h2>
              <span className="font-display text-[10px] text-[var(--color-accent)] uppercase tracking-[0.3em]">
                Vibe
              </span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
              {SCORE_AXES.map((axis) => {
                const value = course.scores?.[axis.key];
                if (value == null) return null;
                return <ScoreRow key={axis.key} axis={axis} value={value} />;
              })}
            </ul>
          </section>
        )}

        {/* タグ */}
        {course.tags && course.tags.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline gap-3 mb-4">
              <h2
                className="font-serif text-base text-[var(--color-navy)]"
                style={{ fontWeight: 700, letterSpacing: "0.08em" }}
              >
                特徴
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {course.tags.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 border border-[var(--color-line-strong)] bg-[var(--color-bg-soft)] text-[var(--color-ink-muted)] text-xs tracking-wider"
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
              className="font-serif text-base text-[var(--color-navy)]"
              style={{ fontWeight: 700, letterSpacing: "0.08em" }}
            >
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
            {course.lat != null && course.lng != null && (
              <a
                href={`https://www.google.com/maps?q=${course.lat},${course.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-navy)] hover:text-[var(--color-accent)] underline"
              >
                Google マップ →
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
    <li className="border-b border-dashed border-[var(--color-line)] pb-3">
      <p className="text-xs text-[var(--color-ink-muted)] mb-2 tracking-wide font-medium">
        {axis.label}
      </p>
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] text-[var(--color-ink-subtle)] w-24 text-center shrink-0 tracking-wide leading-tight">
          {renderAxisLabel(axis.low)}
        </span>
        <div className="flex gap-1 flex-1 min-w-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="h-2 flex-1 rounded-sm"
              style={{
                backgroundColor: i < filled ? fillColor : "rgba(1, 50, 32, 0.12)",
              }}
            />
          ))}
        </div>
        <span
          className={`text-[10px] w-24 text-center shrink-0 tracking-wide leading-tight ${
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
      <dt className="font-display text-[10px] text-[var(--color-accent)] tracking-[0.3em] uppercase mb-1">
        {label}
      </dt>
      <dd
        className="font-serif text-lg text-[var(--color-navy)]"
        style={{ fontWeight: 600 }}
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
