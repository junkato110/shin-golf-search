/**
 * 予約サイトへの遷移リンクを生成する。
 *
 * 環境変数でアフィリエイト情報が設定されていればアフィリエイトURLを返し、
 * 未設定なら通常の遷移URLにフォールバックする。
 *
 * 環境変数:
 *   RAKUTEN_AFFILIATE_ID  楽天アフィリエイトID ("20000000.xxxxxxxx" 形式)
 *   GDO_AFFILIATE_URL     ASP 経由で発行された完全な GDO 遷移URL
 *   YAHOO_AFFILIATE_URL   バリューコマース等で発行された Yahoo!ゴルフ 遷移URL
 *
 * Server Component でのみ呼び出すこと (process.env を参照するため)。
 */

export type ReservationLink = {
  /** 表示ラベル */
  label: string;
  /** 遷移先 URL */
  href: string;
  /** ロゴ画像のパス (public/icons/ 内) */
  iconPath: string;
  /** アフィリエイト計測中かどうか (UI に "PR" 等を出すかの判断に使える) */
  isAffiliate: boolean;
};

/**
 * 楽天GORA 検索ページへのアフィリエイトラップURL。
 * RAKUTEN_AFFILIATE_ID が空なら直接遷移URL。
 */
function rakutenLink(): ReservationLink {
  const directUrl = "https://gora.golf.rakuten.co.jp/search/";
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID?.trim();
  const base: Omit<ReservationLink, "href" | "isAffiliate"> = {
    label: "楽天GORA",
    iconPath: "/icons/rakuten-gora.png",
  };
  if (!affiliateId) {
    return { ...base, href: directUrl, isAffiliate: false };
  }
  // 楽天アフィリエイトのリンク形式: hb.afl.rakuten.co.jp/hgc/{ID}/?pc={URL}
  const wrapped = `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${encodeURIComponent(directUrl)}&m=${encodeURIComponent(directUrl)}`;
  return { ...base, href: wrapped, isAffiliate: true };
}

function gdoLink(): ReservationLink {
  const directUrl = "https://reserve.golfdigest.co.jp/";
  const affUrl = process.env.GDO_AFFILIATE_URL?.trim();
  const base: Omit<ReservationLink, "href" | "isAffiliate"> = {
    label: "GDO",
    iconPath: "/icons/gdo.png",
  };
  if (affUrl) {
    return { ...base, href: affUrl, isAffiliate: true };
  }
  return { ...base, href: directUrl, isAffiliate: false };
}

function yahooLink(): ReservationLink {
  const directUrl = "https://golf.yahoo.co.jp/";
  const affUrl = process.env.YAHOO_AFFILIATE_URL?.trim();
  const base: Omit<ReservationLink, "href" | "isAffiliate"> = {
    label: "Yahoo!ゴルフ",
    iconPath: "/icons/yahoo.png",
  };
  if (affUrl) {
    return { ...base, href: affUrl, isAffiliate: true };
  }
  return { ...base, href: directUrl, isAffiliate: false };
}

/**
 * コース詳細ページに表示する予約サイト遷移ボタン群を返す。
 * 引数: なし (将来的にコース別パラメータを追加してディープリンクに対応可)
 */
export function getReservationLinks(): ReservationLink[] {
  return [rakutenLink(), gdoLink(), yahooLink()];
}
