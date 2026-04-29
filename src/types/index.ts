/**
 * ゴルフ場の構造化データ型定義
 *
 * 主観スコアは Claude Code 経由で公式サイト + ブログ言及から
 * 軸別に推定 (0〜2 の3段階) する。
 */

export type Course = {
  /** 一意ID (例: course_chiba_001 や 国土数値情報のID) */
  id: string;
  /** 正式名称 */
  name: string;
  /** ふりがな (任意) */
  nameKana?: string;
  /** 都道府県 */
  prefecture: string;
  /** 市区町村 */
  city?: string;
  /** 住所 */
  address?: string;
  /** 緯度 */
  lat?: number;
  /** 経度 */
  lng?: number;
  /** ホール数 (18 / 27 / 36) */
  holeCount?: number;
  /** 全長ヤード */
  totalYardage?: number;
  /** par */
  par?: number;
  /** 設計者 */
  designer?: string;
  /** 開業年 */
  openedYear?: number;
  /** 公式サイトURL */
  officialUrl?: string;
  /** 東京駅から車での所要時間 (分) */
  travelMinutesFromTokyo?: number;
  /** 軸別主観スコア (0〜2: 0=低い/該当なし, 1=普通, 2=高い/該当する) */
  scores?: CourseScores;
  /** 主観スコアの推定根拠 (要約・出典URL) */
  scoresEvidence?: ScoreEvidence[];
  /** タグ (温泉あり, 練習場充実, 27Hなど自由形式) */
  tags?: string[];
  /** データソース (国土数値情報 / OSM / Wikipedia / 公式サイト 等) */
  sources?: string[];
  /** 最後にデータ更新した日時 */
  updatedAt?: string;
};

export type CourseScores = {
  /** 難易度 (0=易しい, 2=難しい) — スライダー対応のため 0-10 にしても良い */
  difficulty?: number;
  /** フェアウェイの広さ (0=狭い, 2=広い) */
  fairwayWidth?: number;
  /** アップダウンの少なさ (0=激しい, 2=フラット) */
  flatness?: number;
  /** メシ評価 (0=普通以下, 2=こだわりあり) */
  mealQuality?: number;
  /** マナー厳格さ (0=緩い・初心者歓迎, 2=厳しい・本格派) */
  mannerStrictness?: number;
  /** 練習場の充実度 (0=なし, 2=充実) */
  practiceRange?: number;
  /** 温泉の有無・質 (0=なし, 2=温泉あり) */
  onsen?: number;
  /** 夏でも涼しい (0=暑い, 2=涼しい・高原系) */
  summerCool?: number;
  /** 風の影響を受けにくい (0=風強い, 2=風影響少ない) */
  windShelter?: number;
  /** 女性に優しい (0=不明, 2=パウダールーム充実等) */
  womenFriendly?: number;
  /** シニアに優しい (0=不明, 2=歩きやすい等) */
  seniorFriendly?: number;
};

export type ScoreEvidence = {
  /** どのスコア軸についての根拠か */
  axis: keyof CourseScores;
  /** 推定スコア (0-2) */
  score: number;
  /** 根拠の要約 (1〜2文) */
  summary: string;
  /** 出典URL */
  sourceUrl?: string;
};

export type CoursesData = {
  /** 最終更新時刻 (ISO 8601) */
  updatedAt: string;
  /** コースのリスト */
  courses: Course[];
};

export type Municipality = {
  prefecture: string;
  name: string;
  lat: number;
  lng: number;
};

export type MunicipalitiesData = {
  note?: string;
  municipalities: Municipality[];
};
