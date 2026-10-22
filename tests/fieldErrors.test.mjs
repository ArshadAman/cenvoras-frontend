import test from 'node:test';
import assert from 'node:assert/strict';
import { extractFieldErrors } from '../src/utils/fieldErrors.js';

const msg = 'A vendor with GSTIN 27AAPFU0939F1ZV already exists for this business.';
test('plain DRF field error', () => {
  assert.deepEqual(extractFieldErrors({ response: { data: { gstin: [msg] } } }), { gstin: msg });
});
test('wrapped details error', () => {
  assert.deepEqual(extractFieldErrors({ response: { data: { error: 'Validation failed', details: { gstin: [msg] } } } }), { gstin: msg });
});
test('no response', () => {
  assert.deepEqual(extractFieldErrors(new Error('x')), {});
});
