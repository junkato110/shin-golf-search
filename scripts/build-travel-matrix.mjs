/**
 * 自宅エリア → 各コースの実ルート所要時間を OSRM で計算し、
 * src/data/travel-matrix.json にマトリクス保存する。
 *
 * - 起点: 関東1都6県の各市区町村 (municipalities.json)
 * - 終点: 全コース (courses.json)
 * - ルート: 高速利用前提 (OSRM driving プロファイル = fastest route)
 * - 渋滞は考慮しない (OSRM は静的な free-flow time)
 *
 * 1 home から 35 courses を 1 つの table API call で取得するので、
 * 約 354 calls × 1.1 sec = 6-7 分で完了。
 *
 * 使い方:
 *   node scripts/build-travel-matrix.mjs            # 全件再計算
 *   node scripts/build-travel-matrix.mjs --append   # 既存にない home / course だけ追加
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const COURSES_PATH = join(ROOT, "src/data/courses.json");
const MUNI_PATH = join(ROOT, "src/data/municipalities.json");
const OUT_PATH = join(ROOT, "src/data/travel-matrix.json");

const TOKYO = { name: "東京駅", lat: 35.6812, lng: 139.7671 };
const OSRM = "https://router.project-osrm.org/table/v1/driving";
const RATE_LIMIT_MS = 1100;
const TIMEOUT_MS = 30000;

const isAppend = process.argv.includes("--append");

function homeKey(pref, name) {
  return `${pref}|${name}`;
}

async function fetchTable(homeLat, homeLng, courseCoords) {
  // sources=0 (home), destinations=1..N (courses)
  const coords = [
    `${homeLng},${homeLat}`,
    ...courseCoords.map((c) => `${c.lng},${c.lat}`),
  ].join(";");
  const dests = courseCoords.map((_, i) => i + 1).join(";");
  const url = `${OSRM}/${coords}?sources=0&destinations=${dests}&annotations=duration`;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "shin-golf-search/2.0 (jun.kato110@gmail.com)" },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    if (data.code !== "Ok") throw new Error(`OSRM ${data.code}`);
    const durations = data.durations[0]; // sources=0 なので 1行のみ
    // 秒 → 分 (整数)、null は null のまま
    return durations.map((d) => (d == null ? null : Math.round(d / 60)));
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const courses = JSON.parse(readFileSync(COURSES_PATH, "utf-8")).courses ?? [];
  const munis = JSON.parse(readFileSync(MUNI_PATH, "utf-8")).municipalities ?? [];

  const courseList = courses
    .filter((c) => c.lat != null && c.lng != null)
    .map((c) => ({ id: c.id, lat: c.lat, lng: c.lng }));
  const courseIds = courseList.map((c) => c.id);

  console.log(`総コース数: ${courseList.length}`);
  console.log(`総ホーム数: ${munis.length} + 1 (東京駅)`);

  // 既存ファイル読み込み (append mode 用)
  let existing = null;
  if (isAppend) {
    try {
      existing = JSON.parse(readFileSync(OUT_PATH, "utf-8"));
    } catch {
      existing = null;
    }
  }

  const matrix = existing?.matrix ?? {};

  // homes は東京駅 + 各市区町村
  const homes = [
    { key: "__TOKYO__", lat: TOKYO.lat, lng: TOKYO.lng, label: "東京駅" },
    ...munis.map((m) => ({
      key: homeKey(m.prefecture, m.name),
      lat: m.lat,
      lng: m.lng,
      label: `${m.prefecture}${m.name}`,
    })),
  ];

  const startTime = Date.now();
  let done = 0;
  let failed = 0;

  for (const h of homes) {
    // append モードで既存があり、かつ全コース揃っているならスキップ
    if (
      isAppend &&
      matrix[h.key] &&
      courseIds.every((cid) => matrix[h.key][cid] != null)
    ) {
      done++;
      continue;
    }
    try {
      const durations = await fetchTable(h.lat, h.lng, courseList);
      const obj = matrix[h.key] ?? {};
      for (let i = 0; i < courseIds.length; i++) {
        obj[courseIds[i]] = durations[i];
      }
      matrix[h.key] = obj;
    } catch (e) {
      failed++;
      console.error(`  err ${h.label}: ${e.message}`);
    }
    done++;
    if (done % 20 === 0 || done === homes.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`  ${done}/${homes.length} (${elapsed}s, fail ${failed})`);
    }
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  const out = {
    note: "自宅 (key=`<都道府県>|<市区町村>` または `__TOKYO__`) → 各コースID への所要時間 (分)。OSRM table API、driving プロファイル、free-flow time。",
    computedAt: new Date().toISOString(),
    courseIds,
    matrix,
  };
  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(
    `\n完了: ${done}/${homes.length} ホーム (失敗 ${failed}件) → ${OUT_PATH}`
  );
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
