/**
 * Centralized, theme-aware, CVD-safe chart & financial series color tokens.
 * Backed by CSS custom properties in src/index.css so Light & Precision Obsidian
 * Dark modes maintain WCAG AA/AAA perceptual separation.
 */

export const CHART_PALETTE = [
  'var(--chart-1)', // Technical Cobalt
  'var(--chart-2)', // Clean Emerald
  'var(--chart-3)', // Crisp Amber
  'var(--chart-4)', // Technical Indigo
  'var(--chart-5)', // Precision Ruby
  'var(--chart-6)', // Deep Sky
  'var(--chart-7)', // Slate Neutral
];

export const FINANCIAL_SERIES_COLORS = {
  inflow: 'var(--status-success)',
  outflow: 'var(--status-danger)',
  pending: 'var(--status-warning)',
  converted: 'var(--status-converted)',
  sales: 'var(--chart-1)',
  purchases: 'var(--chart-3)',
  forecast: 'var(--chart-1)',
  baseline: 'var(--border-default)',
};

export function getChartColor(index) {
  const safeIndex = Math.abs(Math.trunc(Number(index) || 0));
  return CHART_PALETTE[safeIndex % CHART_PALETTE.length];
}

function linearizeChannel(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(hex) {
  const clean = String(hex).replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`Invalid 6-digit hex color: ${hex}`);
  }
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (
    0.2126 * linearizeChannel(r) +
    0.7152 * linearizeChannel(g) +
    0.0722 * linearizeChannel(b)
  );
}

export function getContrastRatio(hexA, hexB) {
  const lumA = getRelativeLuminance(hexA);
  const lumB = getRelativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWcagAA(hexA, hexB, isLargeText = false) {
  return getContrastRatio(hexA, hexB) >= (isLargeText ? 3.0 : 4.5);
}
