/**
 * 関東+周辺のゴルフ場候補リストを Wikipedia と OpenStreetMap から取得し
 * scripts/candidates.json に保存する。
 *
 * 一回だけ実行する想定。デイリーパイプラインはここから未処理を選ぶ。
 *
 * 使い方:
 *   node scripts/seed-candidates.mjs
 */

import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "scripts/candidates.json");

const PREFECTURES = [
  "東京都",
  "神奈川県",
  "埼玉県",
  "千葉県",
  "茨城県",
  "栃木県",
  "群馬県",
  "山梨県",
  "静岡県",
  "長野県",
  "福島県",
];

const UA = "shin-golf-search/1.0";

function normalize(name) {
  return (name || "")
    .replace(/\s+/g, "")
    .replace(/[　]+/g, "")
    .toLowerCase();
}

// ===== Wikipedia =====
async function fetchWikipediaCategory(pref) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    list: "categorymembers",
    cmtitle: `Category:${pref}のゴルフ場`,
    cmlimit: "500",
    cmtype: "page",
  });
  const res = await fetch(`https://ja.wikipedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.query?.categorymembers ?? [])
    .map((m) => m.title)
    .filter((t) => !t.startsWith("Category:"))
    .filter((t) => !/一覧|事件|事故|訴訟|問題|裁判|疑惑/.test(t));
}

// ===== Overpass (OSM) =====
async function fetchOSM(pref) {
  const query = `
[out:json][timeout:90];
area["name:ja"="${pref}"]["admin_level"="4"]->.a;
(
  way["leisure"="golf_course"](area.a);
  relation["leisure"="golf_course"](area.a);
);
out center tags;
`.trim();
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
    },
    body: new URLSearchParams({ data: query }),
  });
  if (!res.ok) {
    console.error(`  OSM HTTP ${res.status} for ${pref}`);
    return [];
  }
  const data = await res.json();
  return (data.elements ?? [])
    .map((e) => {
      const tags = e.tags ?? {};
      const name = tags.name || tags["name:ja"];
      if (!name) return null;
      // 「打ちっぱなし」「ドライビングレンジ」等を除外
      if (/打ちっぱなし|練習場|ドライビングレンジ|driving range/i.test(name)) {
        return null;
      }
      const lat = e.center?.lat ?? e.lat;
      const lng = e.center?.lon ?? e.lon;
      if (lat == null || lng == null) return null;
      return { name, lat, lng };
    })
    .filter(Boolean);
}

const merged = new Map(); // key: pref|normalizedName

for (const pref of PREFECTURES) {
  console.log(`\n=== ${pref} ===`);

  const wiki = await fetchWikipediaCategory(pref);
  console.log(`  Wikipedia: ${wiki.length}件`);

  const osm = await fetchOSM(pref);
  console.log(`  OSM: ${osm.length}件`);

  // Wikipedia の名前を正規化して set にしておき、OSM とマッチさせる
  const wikiByNorm = new Map(wiki.map((n) => [normalize(n), n]));

  for (const o of osm) {
    const key = `${pref}|${normalize(o.name)}`;
    if (merged.has(key)) continue;
    const wikiTitle = wikiByNorm.get(normalize(o.name));
    merged.set(key, {
      prefecture: pref,
      name: o.name,
      lat: o.lat,
      lng: o.lng,
      wikipediaTitle: wikiTitle ?? null,
      sources: wikiTitle ? ["osm", "wikipedia"] : ["osm"],
      status: "pending",
    });
  }

  // OSM にない Wikipedia 記事は座標なしで追加
  for (const w of wiki) {
    const key = `${pref}|${normalize(w)}`;
    if (merged.has(key)) continue;
    merged.set(key, {
      prefecture: pref,
      name: w,
      lat: null,
      lng: null,
      wikipediaTitle: w,
      sources: ["wikipedia"],
      status: "pending",
    });
  }

  // rate limiting
  await new Promise((r) => setTimeout(r, 800));
}

// 東京駅から車3時間以内 (推定 180分以内) でフィルタ
// 道路係数 1.4 + 平均60km/h → 直線約 130km 以内
const TOKYO = { lat: 35.6812, lng: 139.7671 };
const MAX_MINUTES = 180;
function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function estimateMinutes(a, b) {
  return Math.round(((haversineKm(a, b) * 1.4) / 60) * 60);
}

const all = Array.from(merged.values());
const inRange = [];
const outOfRange = [];
const noCoords = [];
for (const c of all) {
  if (c.lat == null || c.lng == null) {
    noCoords.push(c);
    continue;
  }
  const min = estimateMinutes(TOKYO, { lat: c.lat, lng: c.lng });
  c.travelMinutesFromTokyo = min;
  if (min <= MAX_MINUTES) inRange.push(c);
  else outOfRange.push(c);
}

const candidates = [...inRange, ...noCoords].sort((a, b) =>
  a.prefecture === b.prefecture
    ? a.name.localeCompare(b.name, "ja")
    : a.prefecture.localeCompare(b.prefecture, "ja")
);

console.log(`\n=== フィルタ ===`);
console.log(`  3時間圏内: ${inRange.length}件`);
console.log(`  3時間圏外 (除外): ${outOfRange.length}件`);
console.log(`  座標なし (Wikipedia 由来のみ・暫定で残す): ${noCoords.length}件`);

const result = {
  note: "OSM (leisure=golf_course) + Wikipedia カテゴリ から取得したゴルフ場候補。デイリーパイプラインの seed として使用。",
  generatedAt: new Date().toISOString(),
  totalByPrefecture: Object.fromEntries(
    PREFECTURES.map((p) => [p, candidates.filter((c) => c.prefecture === p).length])
  ),
  candidates,
};

writeFileSync(OUT, JSON.stringify(result, null, 2));

console.log("\n=== 集計 ===");
for (const [p, n] of Object.entries(result.totalByPrefecture)) {
  console.log(`  ${p}: ${n}件`);
}
console.log(`\n合計: ${candidates.length}件 → ${OUT}`);
