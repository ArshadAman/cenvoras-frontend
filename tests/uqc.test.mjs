import test from 'node:test';
import assert from 'node:assert/strict';
import { quantityError, isMeasuredUnit, toUqc } from '../src/utils/uqc.js';

test('count units take whole numbers and are not rounded', () => {
  assert.match(quantityError('1.5', 'pcs'), /whole number/);
  assert.equal(quantityError('2', 'PCS'), '');
  assert.match(quantityError('1.5', 'pack'), /whole number/);
});

test('measured units take up to 3 decimals', () => {
  assert.equal(isMeasuredUnit('kg'), true);
  assert.equal(toUqc('ltr'), 'LTR');
  assert.equal(quantityError('1.255', 'kg'), '');
  assert.match(quantityError('1.2555', 'kg'), /3 decimals/);
  assert.match(quantityError('1.5', 'kg', { stockReturn: true }), /whole/);
});
