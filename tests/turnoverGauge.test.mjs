import test from 'node:test';
import assert from 'node:assert/strict';
import { turnoverGauge as g } from '../src/utils/turnoverGauge.js';

test('zero', () => assert.deepEqual([g(0).width, g(0).label, g(0).level], [0, '0%', 'success']));
test('tiny: ₹1,600 of ₹40L = 0.04% → <0.1%, sliver', () => {
  const r = g(1600);
  assert.equal(r.label, '<0.1%');
  assert.equal(r.width, 1);
  assert.ok(Math.abs(r.percent - 0.04) < 1e-9);
});
test('₹16,000 of ₹40L = 0.4%', () => assert.equal(g(16000).label, '0.4%'));
test('50%', () => assert.deepEqual([g(2000000).width, g(2000000).label, g(2000000).level], [50, '50.0%', 'success']));
test('80% is amber', () => assert.equal(g(3200000).level, 'warning'));
test('100% is red, full bar', () => assert.deepEqual([g(4000000).width, g(4000000).level], [100, 'danger']));
test('>100% clamps bar, keeps text', () => {
  const r = g(6000000);
  assert.equal(r.width, 100);
  assert.equal(r.label, '150.0%');
  assert.equal(r.level, 'danger');
});
test('negative turnover (credit notes > invoices) → empty bar, never negative width', () => {
  const r = g(-16000);
  assert.equal(r.width, 0);
  assert.equal(r.label, '0%');
  assert.equal(r.isNegative, true);
});
test('NaN / garbage / zero limit', () => {
  for (const [t, l] of [[NaN, 4000000], ['abc', 4000000], [undefined, 4000000], [1000, 0], [1000, null]]) {
    const r = g(t, l);
    assert.equal(r.width, 0);
    assert.equal(r.label, '0%');
  }
});
test('string inputs from the API', () => assert.equal(g('2000000', '4000000').width, 50));
