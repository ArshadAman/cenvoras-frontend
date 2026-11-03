import test from 'node:test';
import assert from 'node:assert/strict';
import { documentTitle, documentDeclaration, taxLocked, gstReturnsAvailable, COMPOSITION_DECLARATION } from '../src/utils/gstStatus.js';

test('regular / unset keep the custom title and nothing locked', () => {
  assert.equal(documentTitle('', { gst_status_set: true, gst_status: 'regular' }), 'TAX INVOICE');
  assert.equal(documentTitle('MY TITLE', {}), 'MY TITLE');
  assert.equal(taxLocked({ gst_status: 'unregistered', gst_status_set: false }), false);
  assert.equal(gstReturnsAvailable({}), true);
});

test('composition: bill of supply + declaration, tax locked, returns hidden', () => {
  const p = { gst_status_set: true, gst_status: 'composition' };
  assert.equal(documentTitle('TAX INVOICE', p), 'BILL OF SUPPLY');
  assert.equal(documentDeclaration(p), COMPOSITION_DECLARATION);
  assert.equal(taxLocked(p), true);
  assert.equal(gstReturnsAvailable(p), false);
});

test('not registered: never "Tax Invoice"', () => {
  const p = { gst_status_set: true, gst_status: 'unregistered' };
  assert.equal(documentTitle('TAX INVOICE', p), 'INVOICE');
  assert.equal(documentDeclaration(p), null);
  assert.equal(taxLocked(p), true);
  assert.equal(gstReturnsAvailable(p), false);
});

test('other documents keep their titles', () => {
  const p = { gst_status_set: true, gst_status: 'unregistered' };
  assert.equal(documentTitle('QUOTATION', p), 'QUOTATION');
  assert.equal(documentTitle('PROFORMA INVOICE', { ...p, gst_status: 'composition' }), 'PROFORMA INVOICE');
  assert.equal(documentTitle('Tax Invoice / Original', p), 'INVOICE');
});
