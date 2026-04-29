"use client";

import { useMemo, useState } from "react";
import type {
  Course,
  CourseScores,
  Municipality,
  MunicipalitiesData,
} from "@/types";
import municipalitiesData from "@/data/municipalities.json";
import { estimateDriveMinutes } from "@/lib/distance";

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
      <aside className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 h-fit lg:sticky lg:top-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">こだわり検索</h2>
          <button
            onClick={reset}
            className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          >
            条件をクリア
          </button>
        </div>

        <fieldset className="mb-5 pb-5 border-b border-neutral-200 dark:border-neutral-800">
          <legend className="text-sm font-medium mb-2">
            🏠 自宅エリア
          </legend>
          <div className="space-y-2">
            <select
              value={prefecture}
              onChange={(e) => {
                setPrefecture(e.target.value);
                setMunicipalityName("");
              }}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-emerald-500"
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
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:opacity-40"
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
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
              ✓ {home.prefecture}{home.name} を起点に距離計算
            </p>
          )}
        </fieldset>

        <fieldset className="mb-5">
          <legend className="text-sm font-medium mb-2">キーワード</legend>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="コース名・地域・タグ"
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </fieldset>

        <fieldset className="mb-5">
          <legend className="text-sm font-medium mb-2">
            自宅から車で
            {!home && (
              <span className="text-xs text-neutral-500 ml-2">
                (自宅エリアを選択すると有効)
              </span>
            )}
          </legend>
          <div className={"space-y-1.5 " + (home ? "" : "opacity-40 pointer-events-none")}>
            {TRAVEL_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="radio"
                  name="travelMax"
                  checked={travelMax === opt.value}
                  onChange={() => setTravelMax(opt.value)}
                  className="accent-emerald-600"
                />
                {opt.label}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm cursor-pointer text-neutral-500">
              <input
                type="radio"
                name="travelMax"
                checked={travelMax === null}
                onChange={() => setTravelMax(null)}
                className="accent-emerald-600"
              />
              指定なし
            </label>
          </div>
        </fieldset>

        <fieldset className="mb-5">
          <legend className="text-sm font-medium mb-2">
            難易度: {difficulty === 0 ? "指定なし" : difficulty}
          </legend>
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="w-full accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-neutral-500 mt-1">
            <span>指定なし</span>
            <span>普通以上</span>
            <span>本格派</span>
          </div>
        </fieldset>

        <fieldset className="mb-5">
          <legend className="text-sm font-medium mb-2">マナー厳格さ</legend>
          <div className="space-y-1.5">
            {MANNER_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="radio"
                  name="manner"
                  checked={mannerLevel === opt.value}
                  onChange={() => setMannerLevel(opt.value)}
                  className="accent-emerald-600"
                />
                {opt.label}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm cursor-pointer text-neutral-500">
              <input
                type="radio"
                name="manner"
                checked={mannerLevel === null}
                onChange={() => setMannerLevel(null)}
                className="accent-emerald-600"
              />
              指定なし
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium mb-2">こだわり条件</legend>
          <div className="space-y-1.5">
            {FEATURE_FILTERS.map((f) => (
              <label
                key={f.key}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={featureKeys.has(f.key as string)}
                  onChange={() => toggleFeature(f.key as string)}
                  className="accent-emerald-600 size-4"
                />
                {f.label}
              </label>
            ))}
          </div>
        </fieldset>
      </aside>

      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {sorted.length} 件 / 全 {courses.length} コース
            {home && " ・ 近い順"}
          </p>
        </div>

        <div className="grid gap-4">
          {sorted.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center text-sm text-neutral-500">
              条件に該当するコースがありません。条件をゆるめてみてください。
            </div>
          )}

          {sorted.map((c) => (
            <CourseCard key={c.id} course={c} hasHome={!!home} />
          ))}
        </div>

        {home && (
          <p className="text-xs text-neutral-400 mt-6">
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
    <article className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{course.name}</h3>
          <p className="text-sm text-neutral-500 mt-1">
            {course.prefecture}
            {course.city ? ` / ${course.city}` : ""}
            {hasHome && course.travelMinutesFromHome != null
              ? ` ・ 自宅から約 ${course.travelMinutesFromHome} 分`
              : ""}
          </p>
        </div>
        <div className="text-right text-xs text-neutral-500 shrink-0">
          {course.holeCount && <div>{course.holeCount}H</div>}
          {course.totalYardage && <div>{course.totalYardage}yd</div>}
          {course.par && <div>par {course.par}</div>}
        </div>
      </div>

      {course.tags && course.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {course.tags.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 text-xs"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {course.scores && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 text-xs text-neutral-600 dark:text-neutral-400">
          <ScoreLine label="難易度" value={course.scores.difficulty} />
          <ScoreLine label="フェアウェイ" value={course.scores.fairwayWidth} highIs="広い" />
          <ScoreLine label="フラット度" value={course.scores.flatness} highIs="フラット" />
          <ScoreLine label="メシ" value={course.scores.mealQuality} highIs="◎" />
          <ScoreLine label="マナー" value={course.scores.mannerStrictness} highIs="厳" />
          <ScoreLine label="練習場" value={course.scores.practiceRange} highIs="◎" />
        </div>
      )}
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
    <span>
      {label}: <span className="font-mono text-emerald-700 dark:text-emerald-300">{dots}</span>
      {highIs && value === 2 ? (
        <span className="text-emerald-700 dark:text-emerald-300 ml-1">{highIs}</span>
      ) : null}
    </span>
  );
}
