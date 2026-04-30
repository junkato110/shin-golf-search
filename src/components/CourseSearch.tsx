"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type {
  Course,
  CourseScores,
  Municipality,
  MunicipalitiesData,
} from "@/types";
import municipalitiesData from "@/data/municipalities.json";
import { estimateDriveMinutes, formatTravelTime } from "@/lib/distance";
import FavoriteButton from "./FavoriteButton";

const TRAVEL_OPTIONS = [
  { label: "30分以内", value: 30 },
  { label: "1時間以内", value: 60 },
  { label: "1時間半以内", value: 90 },
  { label: "2時間以内", value: 120 },
  { label: "3時間以内", value: 180 },
];

const MANNER_OPTIONS = [
  { label: "緩い (初心者歓迎)", value: 0 },
  { label: "普通", value: 1 },
  { label: "厳しい (本格派)", value: 2 },
];

const DIFFICULTY_OPTIONS = [
  { label: "易しい", value: 1 },
  { label: "普通以上", value: 2 },
  { label: "難しい", value: 3 },
];

type ScoreFilter = {
  key: keyof CourseScores;
  label: string;
  /** 「この値以上」を満たす条件にする */
  minScore: number;
};

// カード表示用の体感スコア軸 (6軸を 2列×3行 で表示・両端ラベル付き)
const CARD_SCORE_AXES: Array<{
  key: keyof CourseScores;
  label: string;
  low: string;
  high: string;
}> = [
  { key: "difficulty", label: "難易度", low: "易しい", high: "難しい" },
  { key: "fairwayWidth", label: "フェアウェイ", low: "狭い", high: "広い" },
  { key: "mannerStrictness", label: "マナー", low: "緩い", high: "厳しい" },
  { key: "mealQuality", label: "ご飯", low: "並", high: "こだわり" },
  { key: "practiceRange", label: "練習場", low: "簡素", high: "充実" },
  { key: "scenicView", label: "絶景度", low: "並", high: "絶景あり" },
];

const FEATURE_FILTERS: ScoreFilter[] = [
  { key: "fairwayWidth", label: "フェアウェイが広い", minScore: 2 },
  { key: "flatness", label: "アップダウンが激しくない", minScore: 1 },
  { key: "mealQuality", label: "ご飯にこだわりあり", minScore: 2 },
  { key: "practiceRange", label: "練習場が充実", minScore: 2 },
  { key: "onsen", label: "お風呂あり", minScore: 1 },
  { key: "summerCool", label: "夏でも涼しい", minScore: 2 },
  { key: "winterWarm", label: "冬でも温かい", minScore: 2 },
  { key: "windShelter", label: "風の影響を受けにくい", minScore: 2 },
  { key: "scenicView", label: "絶景コースあり", minScore: 2 },
  { key: "womenFriendly", label: "女性に優しい", minScore: 2 },
  { key: "seniorFriendly", label: "シニアに優しい", minScore: 2 },
];

const ALL_MUNICIPALITIES = (municipalitiesData as MunicipalitiesData)
  .municipalities;
const PREFECTURES = Array.from(
  new Set(ALL_MUNICIPALITIES.map((m) => m.prefecture))
);

const SELECT_CLASS =
  "w-full rounded-md border border-[var(--color-line-strong)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)] focus:ring-1 focus:ring-[var(--color-navy)] disabled:opacity-40";

const FIELD_LABEL_CLASS =
  "block text-xs sm:text-sm font-bold tracking-wider text-[var(--color-navy)] mb-2 sm:mb-3";

export default function CourseSearch({ courses }: { courses: Course[] }) {
  // 自宅選択
  const [prefecture, setPrefecture] = useState<string>("");
  const [municipalityName, setMunicipalityName] = useState<string>("");

  const homeCandidates = useMemo<Municipality[]>(
    () =>
      prefecture
        ? ALL_MUNICIPALITIES.filter((m) => m.prefecture === prefecture)
        : [],
    [prefecture]
  );

  const home = useMemo<Municipality | null>(() => {
    if (!prefecture || !municipalityName) return null;
    return (
      ALL_MUNICIPALITIES.find(
        (m) => m.prefecture === prefecture && m.name === municipalityName
      ) ?? null
    );
  }, [prefecture, municipalityName]);

  // 各コースに自宅からの所要時間を付与
  const coursesWithTravel = useMemo(() => {
    return courses.map((c) => {
      if (home && c.lat != null && c.lng != null) {
        const minutes = estimateDriveMinutes(home, { lat: c.lat, lng: c.lng });
        return { ...c, travelMinutesFromHome: minutes };
      }
      return { ...c, travelMinutesFromHome: undefined };
    });
  }, [courses, home]);

  // フィルタ条件
  const [travelMax, setTravelMax] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<number>(0);
  const [mannerLevel, setMannerLevel] = useState<number | null>(null);
  const [featureKeys, setFeatureKeys] = useState<Set<string>>(new Set());

  // 並び順
  type SortKey = "home" | "diff_asc" | "diff_desc" | "manner_easy";
  const [sortKey, setSortKey] = useState<SortKey>("home");

  const filtered = useMemo(() => {
    return coursesWithTravel.filter((c) => {
      if (travelMax !== null) {
        if (c.travelMinutesFromHome == null) return false;
        if (c.travelMinutesFromHome > travelMax) return false;
      }
      if (difficulty > 0) {
        const d = c.scores?.difficulty ?? 0;
        // 1=易しい (d<=0), 2=普通以上 (d>=1), 3=本格派 (d>=2)
        if (difficulty === 1 && d > 0) return false;
        if (difficulty === 2 && d < 1) return false;
        if (difficulty === 3 && d < 2) return false;
      }
      if (mannerLevel !== null) {
        if (c.scores?.mannerStrictness !== mannerLevel) return false;
      }
      for (const key of featureKeys) {
        const ff = FEATURE_FILTERS.find((f) => f.key === key);
        if (!ff) continue;
        const value = c.scores?.[ff.key as keyof CourseScores] ?? 0;
        if (value < ff.minScore) return false;
      }
      return true;
    });
  }, [coursesWithTravel, travelMax, difficulty, mannerLevel, featureKeys]);

  // 並び順
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortKey === "home" && home) {
      arr.sort(
        (a, b) =>
          (a.travelMinutesFromHome ?? Infinity) -
          (b.travelMinutesFromHome ?? Infinity)
      );
    } else if (sortKey === "diff_asc") {
      arr.sort(
        (a, b) =>
          (a.scores?.difficulty ?? Infinity) -
          (b.scores?.difficulty ?? Infinity)
      );
    } else if (sortKey === "diff_desc") {
      arr.sort(
        (a, b) =>
          (b.scores?.difficulty ?? -1) - (a.scores?.difficulty ?? -1)
      );
    } else if (sortKey === "manner_easy") {
      arr.sort(
        (a, b) =>
          (a.scores?.mannerStrictness ?? Infinity) -
          (b.scores?.mannerStrictness ?? Infinity)
      );
    }
    return arr;
  }, [filtered, sortKey, home]);

  function toggleFeature(key: string) {
    setFeatureKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function reset() {
    setTravelMax(null);
    setDifficulty(0);
    setMannerLevel(null);
    setFeatureKeys(new Set());
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <aside className="space-y-4 h-fit lg:sticky lg:top-24 lg:max-h-[calc(100vh-6.5rem)] lg:overflow-y-auto lg:pr-2 lg:pb-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[var(--color-line-strong)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        <div className="bg-white border border-[var(--color-line)] p-4 sm:p-6">
          <div className="flex items-baseline justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-[var(--color-line)]">
            <h2 className="font-serif text-sm sm:text-base text-[var(--color-navy)]" style={{ fontWeight: 400, letterSpacing: "0.12em" }}>
              基本検索条件
            </h2>
            <button
              onClick={reset}
              className="text-[11px] text-[var(--color-ink-subtle)] hover:text-[var(--color-navy)] underline-offset-2 hover:underline tracking-wide"
            >
              条件をクリア
            </button>
          </div>

        <fieldset className="mb-6 pb-6 border-b border-[var(--color-line)]">
          <legend className={FIELD_LABEL_CLASS}>自宅エリア</legend>
          <div className="space-y-2">
            <select
              value={prefecture}
              onChange={(e) => {
                setPrefecture(e.target.value);
                setMunicipalityName("");
              }}
              className={SELECT_CLASS}
            >
              <option value="">都道府県を選択</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={municipalityName}
              onChange={(e) => setMunicipalityName(e.target.value)}
              disabled={!prefecture}
              className={SELECT_CLASS}
            >
              <option value="">市区町村を選択</option>
              {homeCandidates.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          {home && (
            <p className="text-xs text-[var(--color-navy)] mt-3 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
              {home.prefecture}{home.name} を起点に距離計算
            </p>
          )}
        </fieldset>

        <fieldset className="mb-6">
          <legend className={FIELD_LABEL_CLASS}>
            自宅から車で
            {!home && (
              <span className="ml-2 normal-case tracking-normal text-[var(--color-ink-subtle)] font-normal">
                (要・自宅選択)
              </span>
            )}
          </legend>
          <div className={"space-y-2 " + (home ? "" : "opacity-40 pointer-events-none")}>
            {TRAVEL_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2.5 text-sm cursor-pointer text-[var(--color-ink)]"
              >
                <input
                  type="radio"
                  name="travelMax"
                  checked={travelMax === opt.value}
                  onChange={() => setTravelMax(opt.value)}
                />
                {opt.label}
              </label>
            ))}
            <label className="flex items-center gap-2.5 text-sm cursor-pointer text-[var(--color-ink-subtle)]">
              <input
                type="radio"
                name="travelMax"
                checked={travelMax === null}
                onChange={() => setTravelMax(null)}
              />
              指定なし
            </label>
          </div>
        </fieldset>

        <fieldset className="mb-6">
          <legend className={FIELD_LABEL_CLASS}>難易度</legend>
          <div className="space-y-2">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2.5 text-sm cursor-pointer text-[var(--color-ink)]"
              >
                <input
                  type="radio"
                  name="difficulty"
                  checked={difficulty === opt.value}
                  onChange={() => setDifficulty(opt.value)}
                />
                {opt.label}
              </label>
            ))}
            <label className="flex items-center gap-2.5 text-sm cursor-pointer text-[var(--color-ink-subtle)]">
              <input
                type="radio"
                name="difficulty"
                checked={difficulty === 0}
                onChange={() => setDifficulty(0)}
              />
              指定なし
            </label>
          </div>
        </fieldset>

        <fieldset className="mb-6">
          <legend className={FIELD_LABEL_CLASS}>マナー厳格さ</legend>
          <div className="space-y-2">
            {MANNER_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2.5 text-sm cursor-pointer text-[var(--color-ink)]"
              >
                <input
                  type="radio"
                  name="manner"
                  checked={mannerLevel === opt.value}
                  onChange={() => setMannerLevel(opt.value)}
                />
                {opt.label}
              </label>
            ))}
            <label className="flex items-center gap-2.5 text-sm cursor-pointer text-[var(--color-ink-subtle)]">
              <input
                type="radio"
                name="manner"
                checked={mannerLevel === null}
                onChange={() => setMannerLevel(null)}
              />
              指定なし
            </label>
          </div>
        </fieldset>

        </div>

        <div className="bg-white border border-[var(--color-line)] p-4 sm:p-6">
          <div className="mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-[var(--color-line)]">
            <h2 className="font-serif text-sm sm:text-base text-[var(--color-navy)]" style={{ fontWeight: 400, letterSpacing: "0.12em" }}>
              こだわり条件
            </h2>
          </div>
          <p className="text-[11px] text-[var(--color-ink-subtle)] mb-4 leading-relaxed">
            「かゆいところに手が届く」体感軸でさらに絞り込み
          </p>
          <fieldset>
            <div className="space-y-2">
              {FEATURE_FILTERS.map((f) => (
                <label
                  key={f.key}
                  className="flex items-center gap-2.5 text-sm cursor-pointer text-[var(--color-ink)]"
                >
                  <input
                    type="checkbox"
                    checked={featureKeys.has(f.key as string)}
                    onChange={() => toggleFeature(f.key as string)}
                    className="size-4"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </aside>

      <section>
        <div className="flex items-end justify-between mb-6 pb-3 border-b border-[var(--color-line)] gap-4">
          <p className="text-sm text-[var(--color-navy)]" style={{ fontWeight: 600 }}>
            検索結果
            <span
              className="font-display text-2xl mx-2 align-baseline text-[var(--color-navy)]"
              style={{ fontWeight: 500 }}
            >
              {sorted.length}
            </span>
            件
            <span className="text-xs text-[var(--color-ink-muted)] ml-2 font-normal">
              （全 {courses.length} 件）
            </span>
          </p>
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="sort-key" className="text-[var(--color-ink-muted)] tracking-wide">
              並び順
            </label>
            <select
              id="sort-key"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-md border border-[var(--color-line-strong)] bg-white px-2.5 py-1.5 text-[var(--color-navy)] outline-none focus:border-[var(--color-navy)] focus:ring-1 focus:ring-[var(--color-navy)]"
            >
              <option value="home" disabled={!home}>
                自宅から近い順{!home ? " (自宅未選択)" : ""}
              </option>
              <option value="diff_asc">難易度が易しい順</option>
              <option value="diff_desc">難易度が難しい順</option>
              <option value="manner_easy">マナーに易しい順</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {sorted.length === 0 && (
            <div className="bg-white border border-dashed border-[var(--color-line-strong)] p-12 text-center text-sm text-[var(--color-ink-subtle)]">
              条件に該当するコースがありません。条件をゆるめてみてください。
            </div>
          )}

          {sorted.map((c) => (
            <CourseCard key={c.id} course={c} hasHome={!!home} />
          ))}
        </div>

        {home && (
          <p className="text-xs text-[var(--color-ink-subtle)] mt-6">
            ※ 所要時間は直線距離 ×1.4 ÷ 平均60km/h での概算値です。実際は道路状況や時間帯で変動します。
          </p>
        )}
      </section>
    </div>
  );
}

type CourseWithTravel = Course & { travelMinutesFromHome?: number };

function CourseCard({
  course,
  hasHome,
}: {
  course: CourseWithTravel;
  hasHome: boolean;
}) {
  // 詳細ページの基本情報と整合する最小スペック
  const specs: Array<{ label: string; value: string }> = [];
  if (hasHome && course.travelMinutesFromHome != null) {
    specs.push({ label: "自宅から", value: formatTravelTime(course.travelMinutesFromHome).replace("目安 ", "") });
  } else if (course.travelMinutesFromTokyo != null) {
    specs.push({ label: "東京駅から車で", value: formatTravelTime(course.travelMinutesFromTokyo).replace("目安 ", "") });
  }
  if (course.courseLayout) specs.push({ label: "コース形態", value: course.courseLayout });
  if (course.totalYardage) specs.push({ label: "距離", value: `${course.totalYardage} yd` });

  return (
    <div className="relative">
      <Link
      href={`/courses/${course.id}`}
      className="block bg-white border border-[var(--color-line)] overflow-hidden hover:shadow-md hover:border-[var(--color-line-strong)] transition-all"
    >
      {course.imageUrl && (
        <div className="aspect-[16/5] bg-neutral-100 overflow-hidden border-b border-[var(--color-line)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3
            className="font-serif text-base sm:text-lg text-[var(--color-navy)] leading-snug"
            style={{ fontWeight: 600, letterSpacing: "0.04em" }}
          >
            {course.name}
          </h3>
          <p className="hidden sm:inline text-[11px] sm:text-xs text-[var(--color-ink-muted)] tracking-wide">
            {course.prefecture}
            {course.city ? ` · ${course.city}` : ""}
          </p>
        </div>

        {/* 主要スペック (詳細ページと整合) */}
        {specs.length > 0 && (
          <dl className="mt-4 grid grid-cols-3 gap-x-3 gap-y-1 pt-4 border-t border-[var(--color-line)]">
            {specs.map((s) => (
              <div key={s.label}>
                <dt className="text-[10px] text-[var(--color-ink-subtle)] tracking-wide mb-0.5">
                  {s.label}
                </dt>
                <dd
                  className="font-serif text-sm text-[var(--color-navy)]"
                  style={{ fontWeight: 600 }}
                >
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* 体感スコア (6軸を 2列×3行 で表示・両端ラベル付き) */}
        {course.scores && (
          <div className="mt-4 pt-4 border-t border-[var(--color-line)] grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {CARD_SCORE_AXES.map((axis, idx) => {
              const value = course.scores?.[axis.key];
              if (value == null) return null;
              const filled = value * 2 + 1;
              const isMax = value === 2;
              const fillColor = isMax ? "var(--color-accent)" : "var(--color-navy)";
              // モバイルでは練習場 (idx=4) と絶景度 (idx=5) を非表示
              const hideOnMobile = idx >= 4;
              return (
                <div key={axis.key} className={hideOnMobile ? "hidden sm:block" : ""}>
                  <p className="text-[10px] text-[var(--color-ink-muted)] mb-1 tracking-wide font-medium">
                    {axis.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-[var(--color-ink-subtle)] shrink-0 w-12 text-center tracking-tight leading-tight">
                      {axis.low}
                    </span>
                    <div className="flex gap-0.5 flex-1 min-w-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className="h-1 flex-1 rounded-sm"
                          style={{
                            backgroundColor:
                              i < filled ? fillColor : "rgba(1, 50, 32, 0.1)",
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-[9px] shrink-0 w-12 text-center tracking-tight leading-tight ${
                        isMax
                          ? "text-[var(--color-accent)] font-semibold"
                          : "text-[var(--color-ink-subtle)]"
                      }`}
                    >
                      {axis.high}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 特徴タグ (最大4個) */}
        {course.tags && course.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {course.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="px-2.5 py-0.5 border border-[var(--color-navy)]/25 bg-white text-[var(--color-navy)] text-[11px] tracking-wider"
                style={{ fontWeight: 500 }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      </Link>
      <div className="absolute top-3 right-3">
        <FavoriteButton courseId={course.id} variant="overlay" size="md" />
      </div>
    </div>
  );
}
