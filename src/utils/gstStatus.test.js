import { describe, it, expect } from 'vitest';
import { salesFormDocName, taxLocked, documentTitle } from './gstStatus';

describe('sales form document name by GST status', () => {
  it('composition -> Bill of Supply, tax locked', () => {
    const p = { gst_status: 'composition', gst_status_set: true };
    expect(salesFormDocName(p)).toBe('Bill of Supply');
    expect(taxLocked(p)).toBe(true);
    expect(documentTitle('', p)).toBe('BILL OF SUPPLY');
  });
  it('not registered -> Invoice, tax locked', () => {
    const p = { gst_status: 'unregistered', gst_status_set: true };
    expect(salesFormDocName(p)).toBe('Invoice');
    expect(taxLocked(p)).toBe(true);
  });
  it('regular or unset -> Sales Invoice', () => {
    expect(salesFormDocName({ gst_status: 'regular', gst_status_set: true })).toBe('Sales Invoice');
    expect(salesFormDocName({ gst_status: 'composition', gst_status_set: false })).toBe('Sales Invoice');
    expect(salesFormDocName(null)).toBe('Sales Invoice');
  });
  it('draft invoice -> DRAFT INVOICE', () => {
    expect(documentTitle('', {}, 'draft')).toBe('DRAFT INVOICE');
    expect(documentTitle('TAX INVOICE', {}, { status: 'draft' })).toBe('DRAFT INVOICE');
    expect(documentTitle('', {}, { invoice_number: 'DFT-001' })).toBe('DRAFT INVOICE');
  });
});
