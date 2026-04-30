/**
 * 画像なしコースの AI 画像を自動生成するスクリプト
 *
 * src/data/courses.json の imageUrl が空のコースを検出し、
 * Pollinations.ai で画像を生成して public/images/ に保存し JSON を更新する。
 *
 * 使い方:
 *   node scripts/fix-missing-images.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const COURSES_PATH = join(ROOT, "src/data/courses.json");
const IMAGES_DIR = join(ROOT, "public/images");

const BASE_STYLE =
  "professional landscape photography, golden hour natural lighting, photorealistic, high detail, sharp focus, vibrant natural colors, editorial magazine quality, shot on full-frame DSLR, no text no letters no words no signage no people";

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

/**
 * 画像生成 URL を構築。
 *
 * 環境変数 IMAGE_API_BASE が設定されていれば Vercel proxy 経由 (cloud routine 用)。
 * 未設定ならローカル (Pollinations 直接)。
 */
function buildImageUrl(prompt, seed) {
  const proxyBase = process.env.IMAGE_API_BASE;
  if (proxyBase) {
    return `${proxyBase}?prompt=${encodeURIComponent(prompt)}&seed=${seed}&w=1280&h=720`;
  }
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=1280&height=720&nologo=true`;
}

async function downloadImage(prompt, filename, seed, attempt = 1) {
  const MAX_ATTEMPTS = 3;
  const url = buildImageUrl(prompt, seed);
  const outPath = join(IMAGES_DIR, filename);
  try {
    execSync(`curl -sL --max-time 240 -o "${outPath}" "${url}"`, { stdio: "pipe" });
    if (existsSync(outPath)) {
      const size = statSync(outPath).size;
      // JPEG / PNG のマジックバイトを検査 (テキストエラー応答を除外)
      const head = readFileSync(outPath, { encoding: null }).slice(0, 4);
      const isJpeg = head[0] === 0xff && head[1] === 0xd8;
      const isPng =
        head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
      if (size > 5000 && (isJpeg || isPng)) {
        console.log(`  成功: ${(size / 1024).toFixed(0)}KB`);
        return true;
      }
      // 不正レスポンスは即削除して残骸を残さない
      try {
        unlinkSync(outPath);
      } catch {
        /* ignore */
      }
      const reason = !(isJpeg || isPng)
        ? `画像形式でない (先頭: ${head.toString("hex")})`
        : `ファイルサイズ異常 (${size}B)`;
      console.error(`  失敗 (試行${attempt}): ${reason}`);
    } else {
      console.error(`  失敗 (試行${attempt}): ファイルなし`);
    }
  } catch (e) {
    console.error(`  失敗 (試行${attempt}): ${(e.message || "").slice(0, 80)}`);
  }
  if (attempt < MAX_ATTEMPTS) {
    console.log(`  リトライ中 (${attempt + 1}/${MAX_ATTEMPTS})...`);
    return downloadImage(prompt, filename, seed + 1, attempt + 1);
  }
  return false;
}

/**
 * imageUrl が指す public/images/ 内のファイルが実在するか判定。
 * URL が空、もしくはファイルが存在しなければ生成対象とする。
 */
function imageFileExists(urlPath) {
  if (!urlPath) return false;
  // 例: "/images/course_001.jpg" → public/images/course_001.jpg
  const rel = urlPath.replace(/^\/+/, "");
  const abs = join(ROOT, "public", rel);
  return existsSync(abs) && statSync(abs).size > 5000;
}

async function main() {
  mkdirSync(IMAGES_DIR, { recursive: true });

  const data = JSON.parse(readFileSync(COURSES_PATH, "utf-8"));

  // 不足画像のリスト化 (メイン imageUrl + additionalImages)
  const tasks = [];
  for (const course of data.courses) {
    const expectedMain = course.imageUrl || `/images/${course.id}.jpg`;
    if (!imageFileExists(expectedMain)) {
      tasks.push({
        course,
        kind: "main",
        prompt: buildPrompt(course),
        filename: `${course.id}.jpg`,
        urlField: "imageUrl",
      });
    }
    const additionals = course.additionalImages ?? [];
    for (let i = 0; i < additionals.length; i++) {
      const item = additionals[i];
      if (!imageFileExists(item.url)) {
        const filename = item.url
          ? item.url.replace(/^\/+/, "").replace(/^images\//, "")
          : `${course.id}_extra_${i}.jpg`;
        tasks.push({
          course,
          kind: "additional",
          index: i,
          prompt: `${item.prompt}, ${BASE_STYLE}`,
          filename,
        });
      }
    }
  }

  if (tasks.length === 0) {
    console.log("画像なしのコースはありません");
    return;
  }

  console.log(`${tasks.length}件の画像生成を実行\n`);

  let succeeded = 0;
  for (const t of tasks) {
    console.log(`📷 ${t.course.name} [${t.kind}${t.kind === "additional" ? `:${t.index}` : ""}] → ${t.filename}`);
    const seed = Math.floor(Math.random() * 9000) + 1000;
    const ok = await downloadImage(t.prompt, t.filename, seed);
    if (ok) {
      succeeded++;
      if (t.kind === "main") {
        t.course.imageUrl = `/images/${t.filename}`;
      } else if (t.kind === "additional") {
        t.course.additionalImages[t.index].url = `/images/${t.filename}`;
      }
    }
  }

  data.updatedAt = new Date().toISOString();
  writeFileSync(COURSES_PATH, JSON.stringify(data, null, 2) + "\n");

  console.log(`\n${succeeded}/${tasks.length}件の画像を生成・JSONを更新しました`);
}

main();
