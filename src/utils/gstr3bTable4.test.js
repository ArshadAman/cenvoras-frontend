import { describe, it, expect } from 'vitest';
import { table4Rows } from './gstr3bTable4';

describe('GSTR-3B table 4 rows', () => {
  it('lists every row, including 4A(3) and 4B(1), and no 17(5) row in 4D', () => {
    const t4 = {
      itc_available: { inward_reverse_charge: { iamt: 360 }, all_other_itc: { iamt: 180 } },
      itc_reversed: { as_per_rules: { iamt: 180 }, others: { iamt: 0 } },
      net_itc_available: { iamt: 360 },
      ineligible_itc: { itc_reclaimed: { iamt: 0 }, others: { iamt: 0 } },
    };
    const rows = table4Rows(t4).filter((r) => !r.header);
    expect(rows.map((r) => r.key)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'C', 'D1', 'D2']);
    const v = Object.fromEntries(rows.map((r) => [r.key, r.v?.iamt || 0]));
    expect(v.A3).toBe(360); expect(v.A5).toBe(180); expect(v.B1).toBe(180);
    expect(v.C).toBe(v.A1 + v.A2 + v.A3 + v.A4 + v.A5 - v.B1 - v.B2);
    expect(table4Rows(t4).some((r) => /17\(5\)/.test(r.label) && r.key.startsWith('D'))).toBe(false);
  });
});
