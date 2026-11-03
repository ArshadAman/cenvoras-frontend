import { describe, it, expect } from 'vitest';
import { dojHistoryLines } from './dojHistory';

describe('DOJ correction history', () => {
  it('shows the previous amount, target month, who and why, newest first', () => {
    const lines = dojHistoryLines({ history: [
      { action: 'recompute', at: '2026-11-03T04:30:00Z', by_email: 'a@x.in', reason: 'fix', old: { amount: '0.00', target_month: 12, target_year: 2026 } },
      { action: 'edit', at: '2026-11-03T05:30:00Z', by_email: 'b@x.in', reason: 'adj', old: { amount: '166667.00', target_month: 11, target_year: 2026 } },
    ] });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/Edited .*b@x\.in: was ₹1,66,667\.00 in Nov 2026\. Reason: adj/);
    expect(lines[1]).toMatch(/Recomputed .*a@x\.in: was ₹0\.00 in Dec 2026\. Reason: fix/);
  });
  it('is empty without history', () => { expect(dojHistoryLines({})).toEqual([]); });
});
