import test from 'node:test';
import assert from 'node:assert/strict';
import { cash40A3Warning } from '../src/utils/s40a3.js';

const cash = { code: '1001', name: 'Cash' };
const bank = { code: '1002', name: 'Bank' };

test('cash over ₹10,000 warns (R13-P0-IGST ₹11,800)', () => {
  assert.match(cash40A3Warning(cash, '11800.00'), /40A\(3\)/);
});
test('cash at ₹10,000 or below does not warn', () => {
  assert.equal(cash40A3Warning(cash, 10000), '');
});
test('bank never warns', () => {
  assert.equal(cash40A3Warning(bank, 50000), '');
});
