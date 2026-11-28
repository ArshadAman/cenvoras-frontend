import { describe, it, expect } from 'vitest';
import {
  CHART_PALETTE,
  FINANCIAL_SERIES_COLORS,
  getChartColor,
  getContrastRatio,
  meetsWcagAA,
} from './chartColors';

describe('chartColors', () => {
  it('exposes 7 distinct CSS variable chart tokens', () => {
    expect(CHART_PALETTE).toHaveLength(7);
    expect(new Set(CHART_PALETTE).size).toBe(7);
  });

  it('wraps safely for any index in getChartColor', () => {
    expect(getChartColor(0)).toBe('var(--chart-1)');
    expect(getChartColor(7)).toBe('var(--chart-1)');
    expect(getChartColor(-2)).toBe('var(--chart-3)');
    expect(getChartColor(undefined)).toBe('var(--chart-1)');
  });

  it('assigns distinct colors to Sales and Purchases series', () => {
    expect(FINANCIAL_SERIES_COLORS.sales).not.toBe(FINANCIAL_SERIES_COLORS.purchases);
    expect(FINANCIAL_SERIES_COLORS.inflow).not.toBe(FINANCIAL_SERIES_COLORS.outflow);
  });

  it('verifies Precision Obsidian dark mode tokens meet WCAG AA', () => {
    const obsidianSurfaces = ['#090A0F', '#0F172A', '#1E293B'];
    const darkForegrounds = [
      '#F1F5F9', // text-primary
      '#CBD5E1', // text-secondary
      '#94A3B8', // text-muted
      '#60A5FA', // accent-primary
      '#34D399', // status-success
      '#FBBF24', // status-warning
      '#FB7185', // status-danger
      '#818CF8', // status-converted
      '#38BDF8', // status-info
    ];

    for (const bg of obsidianSurfaces) {
      for (const fg of darkForegrounds) {
        expect(meetsWcagAA(fg, bg)).toBe(true);
      }
    }
    expect(getContrastRatio('#FFFFFF', '#2563EB')).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio('#FFFFFF', '#E11D48')).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio('#FFFFFF', '#047857')).toBeGreaterThanOrEqual(4.5);
  });

  it('verifies Light Mode tokens meet WCAG AA on canvas and card surfaces', () => {
    const lightSurfaces = ['#F2F5F9', '#E7EDF5'];
    const lightForegrounds = [
      '#0F172A', // text-primary
      '#334155', // text-secondary
      '#475569', // text-muted
      '#1D4ED8', // accent-primary
      '#176B45', // status-success
      '#92400E', // status-warning
      '#BE123C', // status-danger
      '#4338CA', // status-converted
      '#0369A1', // status-info
    ];

    for (const bg of lightSurfaces) {
      for (const fg of lightForegrounds) {
        expect(meetsWcagAA(fg, bg)).toBe(true);
      }
    }
  });
});
