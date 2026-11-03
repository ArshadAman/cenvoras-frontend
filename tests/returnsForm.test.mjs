import test from 'node:test';
import assert from 'node:assert/strict';
import { extractServerMessage, exceedsRemainingQty, lineProductId, remainingQtyFor } from '../src/utils/fieldErrors.js';

test('bill line product id prefers product_detail.id over the name', () => {
  assert.equal(lineProductId({ product: 'R17 Part', product_detail: { id: 'b38e42b3-0000' } }), 'b38e42b3-0000');
});
test('nested DRF item error is surfaced', () => {
  const err = { message: 'Request failed with status code 400', response: { data: { items: ['Return quantity exceeds remaining quantity on the original bill (8).'] } } };
  assert.equal(extractServerMessage(err), 'Return quantity exceeds remaining quantity on the original bill (8).');
  const nested = { response: { data: { items: [{ product: ['"X" is not a valid UUID.'] }] } } };
  assert.equal(extractServerMessage(nested), '"X" is not a valid UUID.');
});
test('falls back to err.message', () => {
  assert.equal(extractServerMessage({ message: 'boom' }), 'boom');
});
test('remaining qty caps at server remaining', () => {
  assert.equal(remainingQtyFor('p1', 2, { p1: '1.00' }), 1);
  assert.equal(remainingQtyFor('p1', 10, null), 10);
  assert.equal(remainingQtyFor('p2', 10, { p1: '1' }), 10);
  assert.equal(remainingQtyFor('p1', 2, { p1: '-1' }), 0);
});
test('submit rejects qty above remaining', () => {
  assert.equal(exceedsRemainingQty(6, 1.5), true);
  assert.equal(exceedsRemainingQty(1.5, 1.5), false);
  assert.equal(exceedsRemainingQty(1, 1.5), false);
});

import { portalGSTR1 } from '../src/utils/gstr1.js';
test('portalGSTR1 strips Cenvora metadata keys', () => {
  assert.deepEqual(portalGSTR1({ gstin: 'X', b2b: [], _cenvora: { advances_note: 'n' } }), { gstin: 'X', b2b: [] });
});
