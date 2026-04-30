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
    "difficulty": 0,                    // 難易度: 0=易, 1=普通, 2=難
    "fairwayWidth": 0,                  // フェアウェイ広さ: 0=狭, 1=普通, 2=広
    "flatness": 0,                      // フラット度: 0=起伏, 1=普通, 2=平坦
    "mealQuality": 0,                   // ご飯: 0=並, 1=普通, 2=こだわり
    "mannerStrictness": 0,              // マナー厳格さ: 0=緩, 1=普通, 2=厳
    "practiceRange": 0,                 // 練習場: 0=簡素, 1=普通, 2=充実
    "onsen": 0,                         // 0=なし, 1=大浴場, 2=温泉
    "summerCool": 0,                    // 夏の涼しさ: 0=暑, 1=普通, 2=涼
    "winterWarm": 0,                    // 冬の温かさ: 0=寒, 1=普通, 2=温
    "windShelter": 0,                   // 風影響: 0=大, 1=普通, 2=小
    "scenicView": 0,                    // 絶景度: 0=並, 1=良, 2=絶景
    "womenFriendly": 0,                 // 女性向け: 0=並, 1=普通, 2=配慮あり
    "seniorFriendly": 0                 // シニア向け: 0=並, 1=普通, 2=配慮あり
  },
  "tags": ["タグ1", "タグ2", ...],       // ~6個。例: "高速IC近", "東京湾眺望", "練習場充実", "27H"
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

#### 体感スコアの推定方針

- **自信がある時のみ 0 か 2** を付ける。不明なら 1 (普通)。
- 公式サイトの記述・口コミ・Wikipedia の本文から判断:
  - 「7000ヤード超」「チャンピオンコース」→ difficulty: 2
  - 「初心者歓迎」「フラットなコース」→ difficulty: 0
  - 「フェアウェイは比較的広く」→ fairwayWidth: 2
  - 「メンバーシップコース」「ジャケット必須」→ mannerStrictness: 2
  - 「温泉源泉かけ流し」→ onsen: 2
  - 「大浴場あり」のみ → onsen: 1
  - 「絶景の富士山ビュー」「海越え」「山岳パノラマ」→ scenicView: 2
  - 不明な要素はすべて 1
- 軽井沢/那須/榛名など **標高高い** ところは summerCool: 2 / winterWarm: 0 寄り
- **海岸沿い・河川敷・高原** は風の影響が出やすい → windShelter: 0
- **練習場の打席数 50以上** や ショートゲーム場ありなら practiceRange: 2

#### customImagePrompt の書き方

英語で写実的なゴルフ場画像生成プロンプト。

**【厳守ルール】**
- **最低 200文字 (英語) 以上**。短い汎用文 (例: "scenic fairway, championship quality course") は **絶対 NG**
- 必ず **そのコース固有の名物ホール / シグネチャ景観 を 1つ特定して描写**:
  公式サイトや楽天GORA・GDO のコース紹介を読み、特徴的なホール (例: 池越えの par-3、急峻な打ち下ろし par-4 等) を1つ選ぶ
- 含めるべき要素: ホールタイプ (par-N) + 地形 (打ち下ろし/打ち上げ/フラット) + 障害物 (池/バンカー/谷) + 周辺植生 (松林/雑木林/竹林) + 遠景 (山名・湖名・橋名など) + ライティング (morning dew / golden hour / soft mist 等)
- **テキスト・人物・看板は含めない** (BASE_STYLE が後ろに付くので不要)

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

```
東京駅: lat=35.6812, lng=139.7671
haversine 距離 (km) → ×1.4 (道路係数) → ÷60 (km/h) → ×60 (分) → 整数丸め
```

`node -e` で haversine を計算する例:
```bash
node -e "
const R=6371,toRad=d=>d*Math.PI/180;
const a={lat:35.6812,lng:139.7671},b={lat:LAT,lng:LNG};
const dlat=toRad(b.lat-a.lat),dlng=toRad(b.lng-a.lng);
const h=Math.sin(dlat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dlng/2)**2;
const km=2*R*Math.asin(Math.sqrt(h));
console.log(Math.round(km*1.4/60*60));
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

```bash
node scripts/fix-missing-images.mjs
```

これで `imageUrl` 空欄のコースに画像が生成される。
2-3分程度かかる。失敗したコースは `imageUrl` が空のまま残るが、それは許容 (次回の routine で再試行)。

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
