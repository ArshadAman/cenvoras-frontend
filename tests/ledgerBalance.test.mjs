import test from 'node:test';
import assert from 'node:assert/strict';
import { typeSignedNet, typeSignedNetLabel } from '../src/utils/ledgerBalance.js';

test('unpaid salaries payable nets as Cr', () => {
  const net = typeSignedNet(0, 45000, 'liability');
  assert.equal(net, 45000);
  assert.equal(typeSignedNetLabel(net, 'liability'), 'Cr');
});

test('paid salaries payable nets to zero Cr', () => {
  const net = typeSignedNet(45000, 45000, 'liability');
  assert.equal(net, 0);
  assert.equal(typeSignedNetLabel(net, 'liability'), 'Cr');
});

test('asset cash nets as Dr', () => {
  const net = typeSignedNet(1000, 200, 'asset');
  assert.equal(net, 800);
  assert.equal(typeSignedNetLabel(net, 'asset'), 'Dr');
});
