import test from 'node:test';
import assert from 'node:assert/strict';
import { isInvoiceOverdue, isBillOverdue } from '../src/utils/date.js';

test('isInvoiceOverdue: unpaid invoice past due date is overdue', () => {
  const inv = {
    status: 'final',
    payment_status: 'pending',
    total_amount: '1500.00',
    amount_paid: '0.00',
    due_date: '2026-11-15',
  };
  assert.equal(isInvoiceOverdue(inv, '2026-11-22'), true);
});

test('isInvoiceOverdue: partially paid invoice past due date is overdue', () => {
  const inv = {
    status: 'final',
    payment_status: 'partial_paid',
    total_amount: '2000.00',
    amount_paid: '500.00',
    due_date: '2026-11-10',
  };
  assert.equal(isInvoiceOverdue(inv, '2026-11-22'), true);
});

test('isInvoiceOverdue: fully paid invoice past due date is NOT overdue', () => {
  const inv = {
    status: 'final',
    payment_status: 'paid',
    total_amount: '2000.00',
    amount_paid: '2000.00',
    due_date: '2026-11-01',
  };
  assert.equal(isInvoiceOverdue(inv, '2026-11-22'), false);
});

test('isInvoiceOverdue: invoice with amount_paid >= total_amount is NOT overdue', () => {
  const inv = {
    status: 'final',
    payment_status: 'pending',
    total_amount: '1000.00',
    amount_paid: '1000.00',
    due_date: '2026-11-01',
  };
  assert.equal(isInvoiceOverdue(inv, '2026-11-22'), false);
});

test('isInvoiceOverdue: draft invoice is NOT overdue', () => {
  const inv = {
    status: 'draft',
    payment_status: 'pending',
    total_amount: '1000.00',
    amount_paid: '0.00',
    due_date: '2026-11-01',
  };
  assert.equal(isInvoiceOverdue(inv, '2026-11-22'), false);

  const inv2 = {
    invoice_number: 'DFT-001',
    status: 'final',
    payment_status: 'pending',
    total_amount: '1000.00',
    amount_paid: '0.00',
    due_date: '2026-11-01',
  };
  assert.equal(isInvoiceOverdue(inv2, '2026-11-22'), false);
});

test('isInvoiceOverdue: invoice due today is NOT overdue yet', () => {
  const inv = {
    status: 'final',
    payment_status: 'pending',
    total_amount: '1000.00',
    amount_paid: '0.00',
    due_date: '2026-11-22',
  };
  assert.equal(isInvoiceOverdue(inv, '2026-11-22'), false);
});

test('isInvoiceOverdue: invoice due in future is NOT overdue', () => {
  const inv = {
    status: 'final',
    payment_status: 'pending',
    total_amount: '1000.00',
    amount_paid: '0.00',
    due_date: '2026-11-30',
  };
  assert.equal(isInvoiceOverdue(inv, '2026-11-22'), false);
});

test('isInvoiceOverdue: falls back to invoice_date if due_date is null', () => {
  const inv = {
    status: 'final',
    payment_status: 'pending',
    total_amount: '1000.00',
    amount_paid: '0.00',
    due_date: null,
    invoice_date: '2026-11-10',
  };
  assert.equal(isInvoiceOverdue(inv, '2026-11-22'), true);
});

test('isBillOverdue: unpaid bill past due date is overdue', () => {
  const bill = {
    status: 'final',
    payment_status: 'pending',
    total_amount: '5000.00',
    amount_paid: '0.00',
    due_date: '2026-11-15',
  };
  assert.equal(isBillOverdue(bill, '2026-11-22'), true);
});

test('isBillOverdue: paid bill past due date is NOT overdue', () => {
  const bill = {
    status: 'final',
    payment_status: 'paid',
    total_amount: '5000.00',
    amount_paid: '5000.00',
    due_date: '2026-11-15',
  };
  assert.equal(isBillOverdue(bill, '2026-11-22'), false);
});

test('isBillOverdue: bill due today or future is NOT overdue', () => {
  const billToday = {
    status: 'final',
    payment_status: 'pending',
    total_amount: '5000.00',
    amount_paid: '0.00',
    due_date: '2026-11-22',
  };
  assert.equal(isBillOverdue(billToday, '2026-11-22'), false);

  const billFuture = {
    status: 'final',
    payment_status: 'pending',
    total_amount: '5000.00',
    amount_paid: '0.00',
    due_date: '2026-12-01',
  };
  assert.equal(isBillOverdue(billFuture, '2026-11-22'), false);
});
