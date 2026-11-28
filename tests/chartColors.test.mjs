import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHART_PALETTE,
  FINANCIAL_SERIES_COLORS,
  getChartColor,
  getContrastRatio,
  meetsWcagAA,
} from '../src/utils/chartColors.js';

describe('chartColors', () => {
  it('exposes 7 distinct CSS variable chart tokens', () => {
    assert.equal(CHART_PALETTE.length, 7);
    assert.equal(new Set(CHART_PALETTE).size, 7);
  });

  it('wraps safely for any index in getChartColor', () => {
    assert.equal(getChartColor(0), 'var(--chart-1)');
    assert.equal(getChartColor(7), 'var(--chart-1)');
    assert.equal(getChartColor(-2), 'var(--chart-3)');
    assert.equal(getChartColor(undefined), 'var(--chart-1)');
  });

  it('assigns distinct colors to Sales and Purchases series', () => {
    assert.notEqual(FINANCIAL_SERIES_COLORS.sales, FINANCIAL_SERIES_COLORS.purchases);
    assert.notEqual(FINANCIAL_SERIES_COLORS.inflow, FINANCIAL_SERIES_COLORS.outflow);
  });

  it('verifies Precision Obsidian dark mode tokens meet WCAG AA', () => {
    const obsidianSurfaces = ['#090A0F', '#0F172A', '#1E293B'];
    const darkForegrounds = [
      '#F1F5F9',
      '#CBD5E1',
      '#94A3B8',
      '#60A5FA',
      '#34D399',
      '#FBBF24',
      '#FB7185',
      '#818CF8',
      '#38BDF8',
    ];

    for (const bg of obsidianSurfaces) {
      for (const fg of darkForegrounds) {
        assert.equal(meetsWcagAA(fg, bg), true, `${fg} on ${bg} failed WCAG AA`);
      }
    }
    assert.ok(getContrastRatio('#FFFFFF', '#2563EB') >= 4.5);
    assert.ok(getContrastRatio('#FFFFFF', '#E11D48') >= 4.5);
    assert.ok(getContrastRatio('#FFFFFF', '#047857') >= 4.5);
  });

  it('verifies Light Mode tokens meet WCAG AA on canvas and card surfaces', () => {
    const lightSurfaces = ['#F2F5F9', '#E7EDF5'];
    const lightForegrounds = [
      '#0F172A',
      '#334155',
      '#475569',
      '#1D4ED8',
      '#176B45',
      '#92400E',
      '#BE123C',
      '#4338CA',
      '#0369A1',
    ];

    for (const bg of lightSurfaces) {
      for (const fg of lightForegrounds) {
        assert.equal(meetsWcagAA(fg, bg), true, `${fg} on ${bg} failed WCAG AA`);
      }
    }
  });
});
