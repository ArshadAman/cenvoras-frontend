import { describe, it, expect } from 'vitest';
import { getGstFilingCadence } from './complianceCadence';

describe('getGstFilingCadence', () => {
  it('returns null for invalid dates', () => {
    expect(getGstFilingCadence('')).toBeNull();
    expect(getGstFilingCadence(null)).toBeNull();
    expect(getGstFilingCadence('invalid')).toBeNull();
  });

  it('surfaces GSTR-1 phase before and on the 11th', () => {
    const early = getGstFilingCadence('2026-11-05');
    expect(early.phase).toBe('gstr1');
    expect(early.title).toContain('6d');
    expect(early.tone).toBe('info');

    const dueToday = getGstFilingCadence('2026-11-11');
    expect(dueToday.phase).toBe('gstr1');
    expect(dueToday.title).toContain('due today');
    expect(dueToday.tone).toBe('warning');
  });

  it('surfaces GSTR-3B & 2B reconciliation window between 12th and 20th', () => {
    const pre2B = getGstFilingCadence('2026-11-12');
    expect(pre2B.phase).toBe('gstr3b');
    expect(pre2B.route).toBe('/reports/gstr-3b');
    expect(pre2B.tone).toBe('info');

    const window2B = getGstFilingCadence('2026-11-18');
    expect(window2B.phase).toBe('gstr3b');
    expect(window2B.route).toBe('/reports/gst-shield');
    expect(window2B.actionLabel).toBe('Reconcile 2B');
    expect(window2B.tone).toBe('warning');
  });

  it('surfaces settled bookkeeping phase after the 20th', () => {
    const settled = getGstFilingCadence('2026-11-25');
    expect(settled.phase).toBe('bookkeeping');
    expect(settled.tone).toBe('success');
  });
});
