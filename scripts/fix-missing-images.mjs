/**
 * 画像なしコースの AI 画像を自動生成するスクリプト
 *
 * src/data/courses.json の imageUrl が空のコースを検出し、
 * Pollinations.ai で画像を生成して public/images/ に保存し JSON を更新する。
 *
 * 使い方:
 *   node scripts/fix-missing-images.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const COURSES_PATH = join(ROOT, "src/data/courses.json");
const IMAGES_DIR = join(ROOT, "public/images");

const BASE_STYLE =
  "warm watercolor illustration, soft natural colors, editorial magazine quality, no text no letters no words no signage";

/**
 * customImagePrompt があればそれを使い、なければタグから簡易プロンプトを構築。
 */
function buildPrompt(course) {
  if (course.customImagePrompt && course.customImagePrompt.trim()) {
    return `${course.customImagePrompt.trim()}, ${BASE_STYLE}`;
  }
  // フォールバック: 名前 + 都道府県 + タグから生成
  const tagText = (course.tags || []).slice(0, 3).join(", ");
  return `Japanese golf course in ${course.prefecture}, fairway and green visible, ${tagText}, ${BASE_STYLE}`;
}

async function downloadImage(prompt, filename, seed) {
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?seed=${seed}&width=1280&height=720&nologo=true`;
  const outPath = join(IMAGES_DIR, filename);
  try {
    execSync(`curl -sL --max-time 90 -o "${outPath}" "${url}"`, { stdio: "pipe" });
    if (existsSync(outPath)) {
      const size = statSync(outPath).size;
      if (size > 5000) {
        console.log(`  成功: ${(size / 1024).toFixed(0)}KB`);
        return true;
      }
      console.error(`  失敗: ファイルサイズ異常 (${size}B)`);
    } else {
      console.error("  失敗: ファイルなし");
    }
  } catch (e) {
    console.error(`  失敗: ${e.message}`);
  }
  return false;
}

async function main() {
  mkdirSync(IMAGES_DIR, { recursive: true });

  const data = JSON.parse(readFileSync(COURSES_PATH, "utf-8"));
  const missing = data.courses.filter((c) => !c.imageUrl || c.imageUrl === "");

  if (missing.length === 0) {
    console.log("画像なしのコースはありません");
    return;
  }

  console.log(`${missing.length}件の画像なしコースを検出\n`);

  for (const course of missing) {
    console.log(`📷 ${course.name}`);
    const prompt = buildPrompt(course);
    const filename = `${course.id}.jpg`;
    const seed = Math.floor(Math.random() * 9000) + 1000;
    console.log(`  ダウンロード中 (seed=${seed})...`);

    const ok = await downloadImage(prompt, filename, seed);
    if (ok) {
      course.imageUrl = `/images/${filename}`;
    }
  }

  data.updatedAt = new Date().toISOString();
  writeFileSync(COURSES_PATH, JSON.stringify(data, null, 2) + "\n");

  const succeeded = missing.filter((c) => c.imageUrl).length;
  console.log(`\n${succeeded}/${missing.length}件の画像を生成・JSONを更新しました`);
}

main();
