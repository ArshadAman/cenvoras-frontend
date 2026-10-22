import test from 'node:test';
import assert from 'node:assert/strict';
import { indianStates, getGSTStateCode } from '../src/utils/indiaData.js';
import { resolveCompanyWorkStateFromProfile as r } from '../src/utils/companyState.js';

const run = (p) => r(p, indianStates, getGSTStateCode);

test('company GSTIN prefix 29 gives Karnataka even if the user profile says Odisha', () => {
  assert.equal(run({ profile: { state: 'Odisha' }, billing_profile: { gstin: '29ABCDE1234F1Z5', state: '' } }), 'Karnataka');
});
test('company GSTIN beats a stale company state field', () => {
  assert.equal(run({ billing_profile: { gstin: '29ABCDE1234F1Z5', state: 'Odisha' } }), 'Karnataka');
});
test('company state used when there is no GSTIN', () => {
  assert.equal(run({ billing_profile: { state: 'Maharashtra' } }), 'Maharashtra');
  assert.equal(run({ billing_profile: { state: 'KA' } }), 'Karnataka');
});
test('falls back to Karnataka when nothing is known', () => {
  assert.equal(run({}), 'Karnataka');
});
