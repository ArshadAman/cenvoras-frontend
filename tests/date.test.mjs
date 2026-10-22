// Run: TZ=America/New_York node --test tests/   (also passes in Asia/Kolkata)
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDateOnly, getTodayKolkata } from '../src/utils/date.js';

test('date-only API values keep their calendar day in any browser timezone', () => {
  const d = parseDateOnly('2026-10-22');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 9);
  assert.equal(d.getDate(), 22);
});

test('native Date parsing is the bug being fixed (UTC midnight)', { skip: new Date().getTimezoneOffset() <= 0 }, () => {
  assert.equal(new Date('2026-10-22').getDate(), 21);
});

test('today for a new document is the IST date, not the browser-local date', () => {
  // 22 Oct 2026 08:30 IST = 21 Oct 2026 22:30 in New York
  assert.equal(getTodayKolkata(new Date('2026-10-22T03:00:00Z')), '2026-10-22');
});
