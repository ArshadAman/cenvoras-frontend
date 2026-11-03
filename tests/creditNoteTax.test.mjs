import test from 'node:test';
import assert from 'node:assert/strict';
import { creditNoteTaxView, originalInvoiceLabel } from '../src/utils/creditNoteTax.js';

const intra = {
  original_invoice: 'uuid-1', original_invoice_number: 'INV-007',
  tax_breakup: { is_interstate: false, lines: [{ id: 'a', taxable: '1000.00', rate: '18.00', cgst: '90.00', sgst: '90.00', igst: '0.00' }],
    totals: { taxable: '1000.00', cgst: '90.00', sgst: '90.00', igst: '0.00', total: '1180.00' } },
};
const inter = {
  original_invoice: null,
  tax_breakup: { is_interstate: true, lines: [{ id: 'b', taxable: '1000.00', rate: '18.00', cgst: '0.00', sgst: '0.00', igst: '180.00' }],
    totals: { taxable: '1000.00', cgst: '0.00', sgst: '0.00', igst: '180.00', total: '1180.00' } },
};

test('intra-state: CGST 9% ₹90 + SGST 9% ₹90 per line and totals', () => {
  const v = creditNoteTaxView(intra);
  assert.deepEqual(v.lineTax('a').parts, [{ label: 'CGST 9%', amount: '90.00' }, { label: 'SGST 9%', amount: '90.00' }]);
  assert.deepEqual(v.totals, [['Taxable value', '1000.00'], ['CGST', '90.00'], ['SGST', '90.00'], ['Total', '1180.00']]);
});
test('inter-state: IGST 18% ₹180', () => {
  const v = creditNoteTaxView(inter);
  assert.deepEqual(v.lineTax('b').parts, [{ label: 'IGST 18%', amount: '180.00' }]);
  assert.deepEqual(v.totals, [['Taxable value', '1000.00'], ['IGST', '180.00'], ['Total', '1180.00']]);
});
test('original invoice shows number, never the UUID', () => {
  assert.equal(originalInvoiceLabel(intra), 'INV-007');
  assert.equal(originalInvoiceLabel(inter), '—');
  assert.equal(originalInvoiceLabel({ original_invoice: 'uuid-x' }), '—');
});
