"use client";

import { useMemo, useState } from "react";
import type {
  Course,
  CourseScores,
  Municipality,
  MunicipalitiesData,
} from "@/types";
import municipalitiesData from "@/data/municipalities.json";
import { estimateDriveMinutes, formatTravelTime } from "@/lib/distance";

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

type ScoreFilter = {
  key: keyof CourseScores;
  label: string;
  /** 「この値以上」を満たす条件にする */
  minScore: number;
};

const FEATURE_FILTERS: ScoreFilter[] = [
  { key: "fairwayWidth", label: "フェアウェイが広い", minScore: 2 },
  { key: "flatness", label: "アップダウンが激しくない", minScore: 1 },
  { key: "mealQuality", label: "ご飯にこだわりあり", minScore: 2 },
  { key: "practiceRange", label: "練習場が充実", minScore: 2 },
  { key: "onsen", label: "温泉あり", minScore: 1 },
  { key: "summerCool", label: "夏でも涼しい", minScore: 2 },
  { key: "windShelter", label: "風の影響を受けにくい", minScore: 2 },
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
  "text-xs font-semibold tracking-wider uppercase text-[var(--color-ink-muted)] mb-2";

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
  const [keyword, setKeyword] = useState<string>("");

  const filtered = useMemo(() => {
    return coursesWithTravel.filter((c) => {
      if (travelMax !== null) {
        if (c.travelMinutesFromHome == null) return false;
        if (c.travelMinutesFromHome > travelMax) return false;
      }
      if (difficulty > 0) {
        const d = c.scores?.difficulty ?? 0;
        if (d < difficulty) return false;
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
      if (keyword.trim()) {
        const k = keyword.trim().toLowerCase();
        const haystack = [
          c.name,
          c.nameKana ?? "",
          c.prefecture,
          c.city ?? "",
          (c.tags ?? []).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(k)) return false;
      }
      return true;
    });
  }, [coursesWithTravel, travelMax, difficulty, mannerLevel, featureKeys, keyword]);

  // 距離フィルタが有効なら、近い順にソート
  const sorted = useMemo(() => {
    if (!home) return filtered;
    return [...filtered].sort((a, b) => {
      const at = a.travelMinutesFromHome ?? Infinity;
      const bt = b.travelMinutesFromHome ?? Infinity;
      return at - bt;
    });
  }, [filtered, home]);

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
    setKeyword("");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <aside className="bg-white border border-[var(--color-line)] p-6 h-fit lg:sticky lg:top-20">
        <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-[var(--color-line)]">
          <div className="flex items-baseline gap-2">
            <h2 className="font-serif text-lg font-semibold text-[var(--color-navy)] tracking-wide">
              こだわり検索
            </h2>
            <span className="font-display text-[10px] text-[var(--color-accent)] tracking-[0.25em] uppercase">
              Refine
            </span>
          </div>
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
          <legend className={FIELD_LABEL_CLASS}>キーワード</legend>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="コース名・地域・タグ"
            className={SELECT_CLASS}
          />
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
          <legend className={FIELD_LABEL_CLASS}>
            難易度{" "}
            <span className="ml-1 normal-case tracking-normal text-[var(--color-ink)] font-medium">
              {difficulty === 0
                ? "指定なし"
                : difficulty === 1
                ? "普通以上"
                : "本格派"}
            </span>
          </legend>
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-[var(--color-ink-subtle)] mt-1.5">
            <span>—</span>
            <span>普通以上</span>
            <span>本格派</span>
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

        <fieldset>
          <legend className={FIELD_LABEL_CLASS}>こだわり条件</legend>
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
      </aside>

      <section>
        <div className="flex items-baseline justify-between mb-6 pb-3 border-b border-[var(--color-line)]">
          <div className="flex items-baseline gap-3">
            <p className="font-display text-2xl text-[var(--color-navy)] tracking-wide">
              {String(sorted.length).padStart(2, "0")}
            </p>
            <p className="text-xs text-[var(--color-ink-muted)] tracking-wider">
              <span className="font-display text-[var(--color-accent)] uppercase tracking-[0.25em] mr-2">
                Results
              </span>
              全 {courses.length} コース
              {home && (
                <span className="ml-2 text-[var(--color-accent)]">· 自宅から近い順</span>
              )}
            </p>
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
  return (
    <article className="bg-white border border-[var(--color-line)] overflow-hidden hover:shadow-md hover:border-[var(--color-line-strong)] transition-all">
      {course.imageUrl && (
        <div className="aspect-[16/7] bg-neutral-100 overflow-hidden border-b border-[var(--color-line)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-xl font-semibold text-[var(--color-navy)] leading-snug">
              {course.name}
            </h3>
            <p className="text-xs text-[var(--color-ink-muted)] mt-2 tracking-wide">
              <span>
                {course.prefecture}
                {course.city ? ` · ${course.city}` : ""}
              </span>
              {hasHome && course.travelMinutesFromHome != null && (
                <span className="ml-2 text-[var(--color-accent)]">
                  · 自宅から {formatTravelTime(course.travelMinutesFromHome)}
                </span>
              )}
            </p>
          </div>
          <div className="text-right text-[10px] text-[var(--color-ink-subtle)] shrink-0 tracking-wider uppercase">
            {course.holeCount && <div>{course.holeCount}H</div>}
            {course.totalYardage && <div>{course.totalYardage}yd</div>}
            {course.par && <div>par {course.par}</div>}
          </div>
        </div>

        {course.tags && course.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {course.tags.map((t) => (
              <span
                key={t}
                className="px-2.5 py-0.5 border border-[var(--color-line-strong)] bg-[var(--color-bg)] text-[var(--color-ink-muted)] text-[11px] tracking-wider"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {course.scores && (
          <div className="mt-4 pt-4 border-t border-[var(--color-line)] grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs text-[var(--color-ink-muted)]">
            <ScoreLine label="難易度" value={course.scores.difficulty} />
            <ScoreLine label="フェアウェイ" value={course.scores.fairwayWidth} highIs="広い" />
            <ScoreLine label="フラット度" value={course.scores.flatness} highIs="フラット" />
            <ScoreLine label="メシ" value={course.scores.mealQuality} highIs="◎" />
            <ScoreLine label="マナー" value={course.scores.mannerStrictness} highIs="厳" />
            <ScoreLine label="練習場" value={course.scores.practiceRange} highIs="◎" />
          </div>
        )}
      </div>
    </article>
  );
}

function ScoreLine({
  label,
  value,
  highIs,
}: {
  label: string;
  value?: number;
  highIs?: string;
}) {
  if (value == null) return null;
  const dots = "●".repeat(value) + "○".repeat(2 - value);
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[var(--color-ink-subtle)]">{label}</span>
      <span className="font-mono text-[var(--color-navy)] text-[10px]">{dots}</span>
      {highIs && value === 2 && (
        <span className="text-[var(--color-accent)] font-medium ml-0.5">{highIs}</span>
      )}
    </span>
  );
}
