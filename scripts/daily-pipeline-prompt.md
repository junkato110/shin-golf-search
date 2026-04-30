# シン・ゴルフサーチ デイリーパイプライン

あなたはシン・ゴルフサーチのデイリーパイプラインを担当する Claude エージェントです。
このリポジトリ (`junkato110/shin-golf-search`) は既に clone 済み。`main` ブランチにいる前提。

## 今日のタスク

`scripts/candidates.json` の `candidates` 配列から `status: "pending"` のものを **先頭から 20件** 取り出し、各コースについて Web 調査 → 体感スコア13軸を推定 → 基本情報を集約して `src/data/courses.json` の `courses` 配列に追加する。最後に画像を生成して commit & push。

## 手順

### 1. 状態確認

```bash
cat scripts/candidates.json | jq '.candidates | map(select(.status == "pending")) | length'
cat src/data/courses.json | jq '.courses | length'
```

### 2. 候補20件を選ぶ

`status: "pending"` のうち先頭20件を対象にする。
courses.json に既に同名のコースがあればスキップ (status を "added" に変更)。

### 3. 各コースの情報収集 (1件ずつ)

候補に既にある情報:
- `name`, `prefecture`, `lat`, `lng` (OSM 由来), `wikipediaTitle` (あれば), `travelMinutesFromTokyo`

これに加えて以下を **WebFetch / WebSearch で調査** して埋める:

#### 必須フィールド (courses.json 用)

```json
{
  "id": "course_NNN",                  // 既存の最大IDの次番号でゼロパディング (例: course_006)
  "name": "正式名称",                   // 候補の name を使うが、公式サイトで確認
  "nameKana": "ふりがな",                // 公式サイト or 推定
  "prefecture": "千葉県",
  "city": "袖ケ浦市",                    // 住所から抽出
  "address": "〒XXX-XXXX 千葉県XXX",     // 公式サイトから
  "lat": 35.4156,                       // 【必須】候補の lat をそのまま継承。null になってはいけない
  "lng": 139.9889,                      // 【必須】候補の lng をそのまま継承。null になってはいけない
  "holeCount": 18,                      // 公式サイト
  "par": 72,                            // 公式サイト
  "totalYardage": 7080,                 // 公式サイト
  "openedYear": 1972,                   // 公式 or Wikipedia
  "courseLayout": "丘陵",                // "林間"|"高原"|"河川敷"|"海浜"|"丘陵" のいずれか
  "scores": {
    "difficulty": 2,                    // 難易度: 0=超易, 1=易, 2=普通, 3=難, 4=超難
    "fairwayWidth": 2,                  // フェアウェイ広さ: 0=極狭, 1=狭, 2=普通, 3=広, 4=極広
    "flatness": 2,                      // フラット度: 0=起伏激, 1=やや起伏, 2=普通, 3=フラット寄り, 4=完全フラット
    "mealQuality": 2,                   // ご飯: 0=お粗末, 1=普通以下, 2=普通, 3=こだわり, 4=名物クラス
    "mannerStrictness": 2,              // マナー厳格さ: 0=極緩, 1=緩, 2=普通, 3=厳しい, 4=超厳格 (名門)
    "practiceRange": 2,                 // 練習場: 0=なし, 1=簡素, 2=普通, 3=充実, 4=超充実 (アプ・バンカー有)
    "onsen": 0,                         // 0=なし, 1=シャワーのみ, 2=大浴場, 3=温泉, 4=源泉かけ流し
    "summerCool": 2,                    // 夏の涼しさ: 0=蒸暑, 1=暑, 2=普通, 3=涼, 4=高原で快適
    "winterWarm": 2,                    // 冬の温かさ: 0=極寒, 1=寒, 2=普通, 3=温, 4=温暖 (海沿い等)
    "windShelter": 2,                   // 風影響: 0=超強風, 1=やや影響, 2=普通, 3=守られ気味, 4=ほぼ無風
    "scenicView": 2,                    // 絶景度: 0=殺風景, 1=並, 2=普通, 3=良景, 4=絶景 (富士山・海等)
    "womenFriendly": 2,                 // 女性向け: 0=配慮なし, 1=並, 2=普通, 3=配慮あり, 4=完全配慮 (パウダールーム充実等)
    "seniorFriendly": 2                 // シニア向け: 0=配慮なし, 1=並, 2=普通, 3=配慮あり, 4=完全配慮 (シニアtee等)
  },
  "tags": ["タグ1", "タグ2", ...],       // 6個目安 (頻度分析、下記参照)
  "imageUrl": "/images/course_NNN.jpg",  // ID と一致させる。fix-missing-images.mjs が後で生成する
  "customImagePrompt": "...",            // 英語で名物ホールを描写 (下記参照)
  "additionalImages": [
    {
      "label": "クラブハウス外観",
      "url": "/images/course_NNN_clubhouse.jpg",
      "prompt": "..."                    // 英語でクラブハウスの描写
    }
  ],
  "hasBath": true,                       // 【ルール】scores.onsen >= 1 なら必ず true。0 のときは公式サイト記述に従う
  "cartFairwayIn": false,
  "caddyType": "必須",                   // "必須"|"選択"|"セルフのみ"
  "dressCode": "襟付き必須",              // "普段着OK"|"襟付き必須"|"ジャケット推奨"
  "throughPlay": false,
  "travelMinutesFromTokyo": 50,          // 【必須】候補の値を使う。候補にない場合は haversine 計算で導出 (下記式参照)
  "sources": ["https://...", "..."],     // 調査に使った URL
  "updatedAt": "2026-04-30T..."          // ISO 8601, UTC
}
```

#### 体感スコアの推定方針 (5段階 0-4 / **複数ソース必須**)

**基本姿勢: 1コース最低 3 つの独立ソースを横断的に確認** してから判断する。
独立ソース例: 公式サイト + 楽天GORA + GDO + Wikipedia + ゴルフ場ブログレビュー (`{コース名} 評判`/`難易度`/`感想` 等で WebSearch)

**スコア決定ルール (0-4):**
- 公式・複数ソースで明示的なキーワード一致が **2件以上** → 2/3 ではなく **3 か 4** を付ける勇気を持つ
- 公式の控えめな表現 1件のみ or キーワード弱い → **2** (普通) のまま
- 反対方向のキーワードが複数 → **0 か 1**
- どちらのソースもないなら **2** (中央値)

**例 (新スケール):**
- 「7,200ヤード超」+ 「チャンピオンコース」+ 「丘陵」全部 → difficulty: 4
- 「7,000ヤード」のみ → difficulty: 3
- 「6,500-6,800ヤード」「中級者向け」 → difficulty: 2
- 「フラット」+ 「初心者歓迎」 → difficulty: 1, flatness: 4
- 「源泉かけ流し」 → onsen: 4 / 「天然温泉」→ 3 / 「大浴場」→ 2 / 「シャワーのみ」→ 1 / 「なし」→ 0
- 「メンバー優先」「ジャケット必須」「コンペ少なめ」全部 → mannerStrictness: 4
- 「ジャケット推奨」のみ → mannerStrictness: 3
- 「カジュアル」「ビジター歓迎」 → mannerStrictness: 1
- 「全打席屋根付」+「アプローチ・バンカー練習場」 → practiceRange: 4
- 「打席20席」のみ → 2
- 「富士山が見える」+「複数ホールで眺望」+「絶景」記載多数 → scenicView: 4
- 「展望良好」程度 → 3

**地理由来の補正:**
- 軽井沢/那須/榛名/箱根の標高 800m+ → summerCool: 4, winterWarm: 0
- 標高 300-600m → summerCool: 3, winterWarm: 1
- 海岸沿い → winterWarm: 3, windShelter: 0
- 林間の谷あい → windShelter: 4
- 河川敷 → windShelter: 1, scenicView: 1

#### tags の決め方 (6個目安、頻度分析)

複数ソース (公式・楽天GORA・GDO・Wikipedia・口コミブログ 3-5件) を横断し、**頻出するキーワードを抽出**して 6個程度に絞る:

1. WebSearch を `<コース名> 特徴`, `<コース名> 評判`, `<コース名> ホール紹介` などで実行
2. ヒットしたページタイトル / 紹介文に出現する **形容句・特徴語** を集める
3. **2件以上で言及されたものを採用**。1件のみのものは省く
4. 重複排除して上位 6個

良いタグの例: `高速IC近`, `東京湾眺望`, `7,000Y超`, `練習場充実`, `27H`, `名物14番par-3`, `フラット`, `富士山ビュー`, `戦略的`, `バンカー多め`, `ベント1グリーン`, `女子プロトーナメント開催`, `名匠設計`, `林間`

避けるべきタグ: 「ゴルフ場」「カントリークラブ」 (自明), 「楽しい」「綺麗」 (汎用すぎ), 「OK」「あり」 (情報少ない)

#### courseLayout の決め方 (複数ソース横断)

`courseLayout` は `"林間" | "高原" | "河川敷" | "海浜" | "丘陵"` から1つ。

- **2件以上の独立ソース** (公式 + GORA や GDO + Wikipedia など) で同じ表現が出ているものを採用
- 公式と他ソースで食い違ったら公式優先
- 例:
  - 公式が「林間コース」+ GORA も「林間」 → "林間"
  - 公式が「丘陵地に展開」+ Wikipedia「丘陵」 → "丘陵"
  - 公式に明記なし、GORAが「高原リゾート」 → "高原"
  - 標高 800m+ で記載なし → "高原"
  - 標高低め+起伏あり、明確な「林間」の表現がない → "丘陵"
  - 河川敷の名前 (「○○リバーサイド」「江戸川○○」等) → "河川敷"

#### customImagePrompt の書き方 — **実物写真ベース**

「想像で書く」のではなく、**実際にそのコースの写真を観察してから書く**。

**手順 (必須):**

1. `WebSearch` で `<コース名> 名物ホール` `<コース名> コースガイド` `<コース名> クラブハウス 外観` などのクエリで画像を含むページを探す
2. 楽天GORA・GDO・公式サイトの「コース紹介」「コースガイド」ページを `WebFetch` で取得 (画像 URL や写真ありのページを含むもの)
3. 可能なら直接の画像 URL を `WebFetch` する (画像はマルチモーダルで認識可能)
4. 観察できた特徴 — 例: 「フェアウェイ右に池あり」「グリーン手前にクロスバンカー2つ」「クラブハウスは2階建て白壁の和洋折衷」 — を**忠実に**英語で描写

**【厳守ルール】**
- **最低 200文字 (英語) 以上**
- **観察できなかった要素は書かない** (想像で松林とか盛らない)
- ホールタイプ (par-N) + 地形 + 障害物 + 周辺植生 + 遠景 + ライティング — 観察できた範囲で
- **テキスト・人物・看板は含めない** (BASE_STYLE が後ろに付くので不要)
- 写真が見つからない場合は `customImagePrompt` を **短い汎用文に逃げず**、公式説明から推測した最低限の描写 + ライティングだけ書く

良い例 (約 350 文字):

```
aerial-style landscape photo of a championship golf course in Chiba, signature long par-5 18th hole with wide sweeping fairway curving leftward toward an elevated green guarded by deep cross bunkers and a small pond on the right approach, mature Japanese black pine trees lining both sides of the fairway, faint distant silhouette of the Tokyo Bay Aqualine bridge across the water on the horizon, freshly manicured striped fairway glistening with morning dew, soft warm dawn light casting long shadows from the trees, calm clear blue sky
```

悪い例 (汎用すぎ・即修正):
- "Professional golf course landscape, scenic fairway, championship quality course"
- "Beautiful Japanese golf course in Ibaraki"

クラブハウスの prompt も同様に **最低 150文字、コース固有の建築様式 (RC造/木造/和風数寄屋風 等) や立地 (高台/林の中/開けた前庭) を含める**。

### 座標 (lat/lng) と 距離 (travelMinutesFromTokyo)

**座標の優先順位** (この順で採用、見つかったら以降スキップ):

1. **候補 (candidates.json) の lat/lng** をそのまま使う ← 第一候補
2. 候補に座標がない or 候補が見つからない場合:
   - **`src/data/municipalities.json` から `(prefecture, city)` で引いて市区町村重心を使う** ← 第二候補
   - city は住所から抽出 (例: 「茨城県稲敷市東大沼402」→ city="稲敷市")
3. それでもダメなら status="error", errorReason="座標が取得できない" でスキップ

**距離計算 (travelMinutesFromTokyo)**:

「ほぼ渋滞しない時間帯」のベストケース見積り。

```
東京駅: lat=35.6812, lng=139.7671
haversine 距離 (km) → ×1.2 (道路係数) → ÷80 (km/h) → ×60 (分) → 整数丸め
```

`node -e` で haversine を計算する例:
```bash
node -e "
const R=6371,toRad=d=>d*Math.PI/180;
const a={lat:35.6812,lng:139.7671},b={lat:LAT,lng:LNG};
const dlat=toRad(b.lat-a.lat),dlng=toRad(b.lng-a.lng);
const h=Math.sin(dlat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dlng/2)**2;
const km=2*R*Math.asin(Math.sqrt(h));
console.log(Math.round(km*1.2/80*60));
"
```

**travelMinutesFromTokyo が 0 はあり得ない**。0 になるのは座標 null の証拠。座標を必ず設定すること。

### 4. courses.json への追加

`src/data/courses.json` を Read → `courses` 配列に新規エントリを append → Write。
ID は連番。例: 既存の最大が `course_005` なら `course_006` から開始。

### 5. candidates.json の status 更新

処理済みのエントリの `status` を `"added"` または `"error"` に変更。
エラー時は `errorReason` フィールドも追加。

```json
{ "name": "...", "status": "added" }
{ "name": "...", "status": "error", "errorReason": "公式サイトが見つからない" }
```

### 6. 画像生成

**Anthropic Cloud から実行する場合は必ず IMAGE_API_BASE を指定する** (Pollinations が cloud IP をブロックするため、Vercel proxy 経由にする):

```bash
IMAGE_API_BASE=https://shin-golf-search.vercel.app/api/gen-image node scripts/fix-missing-images.mjs
```

ローカル実行時は環境変数なしで OK (Pollinations 直アクセス):

```bash
node scripts/fix-missing-images.mjs
```

これで `imageUrl` で参照されるが実体ファイルが存在しない/壊れているコースの画像が生成される。
1コース 2枚 (名物ホール + クラブハウス) で、合計 ~30秒〜2分。
script は JPEG/PNG マジックバイトを検査するため、エラー応答ファイル (例: "Host not in allowlist") が混入することはない。
失敗したコースは `imageUrl` が空のまま残るが、それは許容 (次回の routine で再試行)。

### 7. 検証

```bash
node scripts/validate-courses.mjs
```

検証エラーが出たら修正してから次へ進む。座標 null・travelMinutes=0・hasBath/onsen 不整合・customImagePrompt が短い等は **このステップで確実に検出される**。

### 8. lint

```bash
npm run lint
```

エラーが出たら修正してから次へ。

### 9. commit & push

```bash
git add -A
git commit -m "デイリーパイプライン: $(date +%Y-%m-%d) 追加 NN件"
git push origin main
```

## 制約

- **失敗してもパイプラインを止めない**。エラーは記録して次へ。
- **公式サイトが見つからないコースは status="error"** にして飛ばす (後日手動で対応)
- **同名コースが既に courses.json にある場合**は重複追加しない (status を "added" に変えるだけ)
- **WebFetch は 1コース 3-5 回まで** (公式サイト + Wikipedia + 必要なら口コミサイト1-2件)
- **token 節約のため、不要な長文出力は避ける**。Markdown で要点だけ抽出。

## 開始

それでは Step 1 から始めてください。まず candidates.json と courses.json の状態を確認することから。
