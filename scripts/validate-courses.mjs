/**
 * src/data/courses.json の各コースが必須ルールを満たしているか検証する。
 * デイリーパイプラインの commit 前に実行する想定。
 *
 * ルール違反は標準出力にレポートして exit code 1 で終了。
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const COURSES_PATH = join(ROOT, "src/data/courses.json");

const data = JSON.parse(readFileSync(COURSES_PATH, "utf-8"));

const errors = []; // 致命的: 修正必須 (exit 1)
const warnings = []; // 改善推奨 (exit 0、ログのみ)

for (const c of data.courses ?? []) {
  const id = c.id ?? "(no id)";
  const ctx = `${id} ${c.name ?? ""}`;

  // === 致命的 ===
  if (c.lat == null || c.lng == null) {
    errors.push(`${ctx}: lat/lng が null`);
  }
  if (typeof c.travelMinutesFromTokyo !== "number" || c.travelMinutesFromTokyo <= 0) {
    errors.push(
      `${ctx}: travelMinutesFromTokyo が 0 以下 → ${c.travelMinutesFromTokyo}`
    );
  }
  const onsen = c.scores?.onsen ?? 0;
  if (onsen >= 1 && c.hasBath === false) {
    errors.push(`${ctx}: onsen=${onsen} なのに hasBath=false (整合性ルール違反)`);
  }
  for (const k of [
    "name",
    "prefecture",
    "address",
    "holeCount",
    "par",
    "courseLayout",
    "scores",
    "tags",
  ]) {
    if (c[k] === undefined || c[k] === null || c[k] === "") {
      errors.push(`${ctx}: ${k} が未設定`);
    }
  }

  // === 改善推奨 (warning) ===
  const prompt = c.customImagePrompt ?? "";
  if (prompt.length < 200) {
    warnings.push(`${ctx}: customImagePrompt が短い (${prompt.length}字、推奨200字+)`);
  }
  const generic =
    /scenic fairway|championship quality course|professional golf course landscape/i;
  if (generic.test(prompt) && prompt.length < 300) {
    warnings.push(`${ctx}: customImagePrompt が汎用文に近い`);
  }
  for (let i = 0; i < (c.additionalImages ?? []).length; i++) {
    const ad = c.additionalImages[i];
    if ((ad.prompt ?? "").length < 150) {
      warnings.push(
        `${ctx}: additionalImages[${i}].prompt が短い (${(ad.prompt ?? "").length}字、推奨150字+)`
      );
    }
  }
}

if (warnings.length > 0) {
  console.log(`⚠️  warnings ${warnings.length}件 (改善推奨、commit はブロックしない):\n`);
  for (const m of warnings) console.log(`  - ${m}`);
  console.log();
}
if (errors.length > 0) {
  console.log(`❌ errors ${errors.length}件 (修正必須):\n`);
  for (const m of errors) console.log(`  - ${m}`);
  process.exit(1);
}
console.log(`✅ 検証 OK (${data.courses.length}件)`);
