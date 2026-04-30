/**
 * 各コースのメイン画像を sources にある公式・予約サイトから og:image スクレイピングする。
 *
 * 優先順位:
 *   1. 公式サイト (sources の最初の URL) の og:image
 *   2. 楽天GORA, GDO, ALBA, jalan, homemate-golf, shotnavi の og:image
 *   3. 上記に画像系の <meta> がない場合は HTML 内の最初の <img> (course-related な URL)
 *
 * 取得した画像の最小サイズ: 600x300 px
 * (ファビコン・ロゴサムネイルを除外)
 *
 * 使い方:
 *   node scripts/scrape-course-images.mjs              # 全コース対象
 *   node scripts/scrape-course-images.mjs course_001   # 1 件だけ
 *   node scripts/scrape-course-images.mjs --force      # 既存画像も上書き
 */

import { readFileSync, writeFileSync, statSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const COURSES_PATH = join(ROOT, "src/data/courses.json");
const IMAGES_DIR = join(ROOT, "public/images");

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const TARGET_IDS = args.filter((a) => a.startsWith("course_"));

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function fetchHtml(url) {
  try {
    const out = execSync(
      `curl -sL --max-time 20 -A "${UA}" "${url}"`,
      { stdio: "pipe", maxBuffer: 8 * 1024 * 1024 }
    ).toString("utf-8");
    return out;
  } catch {
    return null;
  }
}

function extractOgImage(html, baseUrl) {
  if (!html) return null;
  // og:image
  const og = /<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html);
  if (og?.[1]) return absoluteUrl(og[1], baseUrl);
  // og:image:secure_url
  const ogs = /<meta[^>]+(?:property|name)=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i.exec(html);
  if (ogs?.[1]) return absoluteUrl(ogs[1], baseUrl);
  // twitter:image
  const tw = /<meta[^>]+(?:property|name)=["']twitter:image["'][^>]+content=["']([^"']+)["']/i.exec(html);
  if (tw?.[1]) return absoluteUrl(tw[1], baseUrl);
  // <link rel="image_src">
  const ls = /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i.exec(html);
  if (ls?.[1]) return absoluteUrl(ls[1], baseUrl);
  return null;
}

function absoluteUrl(url, base) {
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

/**
 * JPEG/PNG ファイルから画像の (width, height) を抽出。
 * SOF0/SOF2 marker を探して読み取る。
 */
function readImageDimensions(buf) {
  // PNG: bytes 16-23 が IHDR の width/height (BE 32bit)
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    return { width: w, height: h };
  }
  // JPEG: SOFn (0xC0..0xC3, 0xC5..0xC7, 0xC9..0xCB, 0xCD..0xCF) を探す
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        // SOFn: skip length(2) + precision(1), then height(2), width(2)
        const h = buf.readUInt16BE(i + 5);
        const w = buf.readUInt16BE(i + 7);
        return { width: w, height: h };
      }
      // skip this segment
      const segLen = buf.readUInt16BE(i + 2);
      i += 2 + segLen;
    }
  }
  // WebP (VP8/VP8L/VP8X)
  if (buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP") {
    const fourcc = buf.slice(12, 16).toString("ascii");
    if (fourcc === "VP8 ") {
      // VP8: width/height at offset 26 (LE 14bit each)
      const w = buf.readUInt16LE(26) & 0x3fff;
      const h = buf.readUInt16LE(28) & 0x3fff;
      return { width: w, height: h };
    } else if (fourcc === "VP8L") {
      const sig = buf.readUInt32LE(21);
      const w = (sig & 0x3fff) + 1;
      const h = ((sig >> 14) & 0x3fff) + 1;
      return { width: w, height: h };
    } else if (fourcc === "VP8X") {
      const w = (buf.readUInt32LE(24) & 0xffffff) + 1;
      const h = (buf.readUInt32LE(27) & 0xffffff) + 1;
      return { width: w, height: h };
    }
  }
  return null;
}

// しきい値はモード切替: strict (600x300+) と lenient (400x300+)
let MIN_WIDTH = 600;
let MIN_HEIGHT = 300;
let MIN_BYTES = 15000;

function downloadImage(url, outPath) {
  try {
    execSync(
      `curl -sL --max-time 30 -A "${UA}" -o "${outPath}" "${url}"`,
      { stdio: "pipe" }
    );
    if (!existsSync(outPath)) return { ok: false, reason: "no file" };
    const buf = readFileSync(outPath);
    const size = buf.length;
    // JPEG / PNG / WebP マジックバイト
    const head = buf.slice(0, 12);
    const isJpeg = head[0] === 0xff && head[1] === 0xd8;
    const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    const isWebp =
      head.slice(0, 4).toString("ascii") === "RIFF" &&
      head.slice(8, 12).toString("ascii") === "WEBP";
    if (!isJpeg && !isPng && !isWebp) {
      try { unlinkSync(outPath); } catch {}
      return { ok: false, reason: `not image (${head.toString("hex")})` };
    }
    if (size < MIN_BYTES) {
      try { unlinkSync(outPath); } catch {}
      return { ok: false, reason: `too small bytes (${size}B)` };
    }
    const dim = readImageDimensions(buf);
    if (dim && (dim.width < MIN_WIDTH || dim.height < MIN_HEIGHT)) {
      try { unlinkSync(outPath); } catch {}
      return { ok: false, reason: `too small dim (${dim.width}x${dim.height})` };
    }
    return {
      ok: true,
      size,
      format: isJpeg ? "jpeg" : isPng ? "png" : "webp",
      width: dim?.width,
      height: dim?.height,
    };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

function isLikelyLogo(url) {
  if (!url) return false;
  const s = url.toLowerCase();
  return /logo|favicon|sprite|avatar|social|icon\b/i.test(s);
}

async function processCourse(course) {
  const sources = course.sources ?? [];
  if (sources.length === 0) {
    console.log(`  ! ${course.id} sources なし`);
    return null;
  }

  const tmpPath = join(IMAGES_DIR, `${course.id}_tmp.bin`);

  for (const src of sources) {
    process.stdout.write(`  src: ${src.slice(0, 60)}... `);
    const html = fetchHtml(src);
    if (!html) {
      console.log("HTML 取得失敗");
      continue;
    }
    const ogUrl = extractOgImage(html, src);
    if (!ogUrl) {
      console.log("og:image なし");
      continue;
    }
    if (isLikelyLogo(ogUrl)) {
      console.log(`logo っぽい (${ogUrl.slice(0, 80)})`);
      continue;
    }

    const dl = downloadImage(ogUrl, tmpPath);
    if (!dl.ok) {
      console.log(`DL 失敗: ${dl.reason}`);
      continue;
    }
    // 採用
    const ext = dl.format === "png" ? "png" : dl.format === "webp" ? "webp" : "jpg";
    const finalName = `${course.id}.${ext}`;
    const finalPath = join(IMAGES_DIR, finalName);
    // 旧 jpg を削除
    for (const e of ["jpg", "png", "webp"]) {
      const p = join(IMAGES_DIR, `${course.id}.${e}`);
      if (existsSync(p) && p !== finalPath) {
        try { unlinkSync(p); } catch {}
      }
    }
    execSync(`mv "${tmpPath}" "${finalPath}"`);
    const dimStr = dl.width ? `${dl.width}x${dl.height}` : "?";
    console.log(`✓ 採用 (${dimStr}, ${(dl.size / 1024).toFixed(0)}KB ${dl.format})`);
    return {
      imageUrl: `/images/${finalName}`,
      imageSourceUrl: ogUrl,
      imageSourcePage: src,
    };
  }

  // tmpPath 残骸の削除
  try { unlinkSync(tmpPath); } catch {}
  return null;
}

async function main() {
  mkdirSync(IMAGES_DIR, { recursive: true });
  const data = JSON.parse(readFileSync(COURSES_PATH, "utf-8"));
  const courses = data.courses ?? [];
  const targets = TARGET_IDS.length
    ? courses.filter((c) => TARGET_IDS.includes(c.id))
    : courses;

  let success = 0;
  let skipped = 0;
  const failed = [];
  for (const c of targets) {
    console.log(`\n[${c.id}] ${c.name}`);
    // 既存画像が JPEG マジック OK で 5KB+ ならスキップ (--force で上書き)
    if (!FORCE) {
      const main = c.imageUrl ? join(ROOT, "public", c.imageUrl.replace(/^\/+/, "")) : null;
      if (main && existsSync(main) && statSync(main).size > 5000) {
        const head = readFileSync(main).slice(0, 4);
        if (head[0] === 0xff && head[1] === 0xd8) {
          console.log("  既に有効な画像あり → skip");
          skipped++;
          continue;
        }
      }
    }
    const res = await processCourse(c);
    if (res) {
      c.imageUrl = res.imageUrl;
      c.imageSourceUrl = res.imageSourceUrl;
      c.imageSourcePage = res.imageSourcePage;
      success++;
    } else {
      failed.push(c);
    }
  }

  // 2パス目: 失敗分を緩めしきい値で再試行
  if (failed.length > 0) {
    console.log(`\n=== 2パス目 (緩めしきい値 400x300) ===`);
    MIN_WIDTH = 400;
    MIN_HEIGHT = 300;
    MIN_BYTES = 8000;
    for (const c of failed.slice()) {
      console.log(`\n[${c.id}] ${c.name} (lenient)`);
      const res = await processCourse(c);
      if (res) {
        c.imageUrl = res.imageUrl;
        c.imageSourceUrl = res.imageSourceUrl;
        c.imageSourcePage = res.imageSourcePage;
        success++;
        const i = failed.indexOf(c);
        if (i >= 0) failed.splice(i, 1);
      }
    }
  }

  data.updatedAt = new Date().toISOString();
  writeFileSync(COURSES_PATH, JSON.stringify(data, null, 2));
  console.log(`\n=== 完了: ${success} 成功 / ${skipped} skip / ${failed.length} 失敗 (target ${targets.length}件) ===`);
  if (failed.length > 0) {
    console.log("失敗:");
    for (const c of failed) console.log(`  - ${c.id} ${c.name}`);
  }
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
