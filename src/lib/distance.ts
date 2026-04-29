/**
 * 直線距離 (Haversine) を計算 (km)
 */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371; // 地球半径 km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * 直線距離から車での所要時間を概算する。
 *
 * - 道路係数 1.4 (実際の道路は直線距離より約4割長い)
 * - 平均車速 60 km/h (高速道路+一般道のミックス想定)
 *
 * 厳密な計算ではなく、検索時のフィルタ用途に十分な近似値。
 */
export function estimateDriveMinutes(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const km = haversineKm(from, to) * 1.4;
  const minutes = (km / 60) * 60; // = km / 60 * 60
  return Math.round(minutes);
}

/**
 * 所要時間を 15分単位 (60分以上は 30分単位) で丸めた表示文字列にする。
 * 一桁台のような細かい数値は出さず、目安表示に統一する。
 *
 * 例: 7  → "目安 15分程度"
 *     47 → "目安 45分程度"
 *     65 → "目安 60分程度"
 *     112 → "目安 120分程度"
 */
export function formatTravelTime(minutes: number): string {
  const bucket =
    minutes < 60
      ? Math.max(15, Math.round(minutes / 15) * 15)
      : Math.round(minutes / 30) * 30;
  return `目安 ${bucket}分程度`;
}
