/**
 * GST Shield turnover gauge. percent = turnover / limit × 100 (unclamped, for the text);
 * width is clamped to 0–100 for the bar, with a small visible sliver only when > 0.
 * Invalid / negative input never yields a negative or NaN CSS width (a negative width is
 * invalid CSS, so the browser dropped it and the bar rendered 100% full).
 */
export const MIN_SLIVER_PCT = 1;

const num = (v) => {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : NaN;
};

export function turnoverGauge(turnover, limit = 4000000) {
  const t = num(turnover);
  const l = num(limit);
  const percent = Number.isFinite(t) && Number.isFinite(l) && l > 0 ? (t / l) * 100 : 0;
  const positive = percent > 0 ? percent : 0;
  const clamped = Math.min(100, positive);
  const width = clamped > 0 ? Math.max(MIN_SLIVER_PCT, clamped) : 0;
  let label;
  if (positive === 0) label = '0%';
  else if (positive < 0.1) label = '<0.1%';
  else label = `${positive.toFixed(1)}%`;
  const level = positive >= 100 ? 'danger' : positive >= 80 ? 'warning' : 'success';
  return { percent, width, label, level, isNegative: Number.isFinite(t) && t < 0 };
}
