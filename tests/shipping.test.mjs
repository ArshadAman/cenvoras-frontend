import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAddressText,
  hasShippingBillingDifference,
  shouldAutoSelectBillToShipToOnInit,
  isGstinStateMatch,
} from '../src/utils/shipping.js';

test('normalizeAddressText trims, lowercases, and collapses whitespace', () => {
  assert.equal(normalizeAddressText('  Plot 12,\n  Bhubaneswar   751024 '), 'plot 12, bhubaneswar 751024');
  assert.equal(normalizeAddressText(null), '');
  assert.equal(normalizeAddressText(undefined), '');
});

test('hasShippingBillingDifference is true only when shipping is non-empty and differs from billing', () => {
  assert.equal(hasShippingBillingDifference('123 Main St', ''), false);
  assert.equal(hasShippingBillingDifference('', '123 Main St'), true);
  assert.equal(hasShippingBillingDifference('123  Main\nSt', ' 123 main st '), false);
  assert.equal(
    hasShippingBillingDifference(
      'Plot 45, Industrial Estate, Bhubaneswar',
      'C.V. Raman Global University, Mahura, Janla, Bhubaneswar'
    ),
    true
  );
});

test('shouldAutoSelectBillToShipToOnInit respects direct inter-state goods override on edit', () => {
  assert.equal(
    shouldAutoSelectBillToShipToOnInit({
      billingAddress: 'Addr A',
      deliveryAddress: 'Addr B',
      placeOfSupply: '21',
      defaultPos: '21',
    }),
    true
  );
  // Pre-existing document saved with POS != customer state represents direct s.10(1)(a) ship-to (not bill-to-ship-to)
  assert.equal(
    shouldAutoSelectBillToShipToOnInit({
      billingAddress: 'Addr A, Odisha',
      deliveryAddress: 'Addr B, Karnataka',
      placeOfSupply: '29',
      defaultPos: '21',
    }),
    false
  );
  // Normalizes full state names, numeric GST codes and 2-letter codes
  assert.equal(
    shouldAutoSelectBillToShipToOnInit({
      billingAddress: 'Bengaluru, KA',
      deliveryAddress: 'Paradip, Odisha',
      placeOfSupply: 'Odisha',
      defaultPos: 'KA',
    }),
    false
  );
  assert.equal(
    shouldAutoSelectBillToShipToOnInit({
      billingAddress: 'Bengaluru, KA',
      deliveryAddress: 'Paradip, Odisha',
      placeOfSupply: 'OR',
      defaultPos: 'Karnataka',
    }),
    false
  );
  assert.equal(
    shouldAutoSelectBillToShipToOnInit({
      billingAddress: 'Bengaluru, KA',
      deliveryAddress: 'Paradip, Odisha',
      placeOfSupply: 'Karnataka',
      defaultPos: 'KA',
    }),
    true
  );
  // Same address does not auto-select
  assert.equal(
    shouldAutoSelectBillToShipToOnInit({
      billingAddress: 'Addr A',
      deliveryAddress: 'Addr A',
      placeOfSupply: '21',
      defaultPos: '21',
    }),
    false
  );
});

test('isGstinStateMatch accurately matches POS with GSTIN state code', () => {
  assert.equal(isGstinStateMatch('OR', '21AABCU9603R1ZM'), true);
  assert.equal(isGstinStateMatch('Odisha', '21AABCU9603R1ZM'), true);
  assert.equal(isGstinStateMatch('21', '21AABCU9603R1ZM'), true);
  // Karnataka customer with Odisha POS should NOT match
  assert.equal(isGstinStateMatch('OR', '29AAKCG6382L1ZU'), false);
  assert.equal(isGstinStateMatch('Odisha', '29AAKCG6382L1ZU'), false);
  assert.equal(isGstinStateMatch('KA', '29AAKCG6382L1ZU'), true);
  assert.equal(isGstinStateMatch('Karnataka', '29AAKCG6382L1ZU'), true);
  assert.equal(isGstinStateMatch('', '29AAKCG6382L1ZU'), false);
  assert.equal(isGstinStateMatch('KA', ''), false);
  assert.equal(isGstinStateMatch(null, null), false);
});
