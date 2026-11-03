import test from 'node:test';
import assert from 'node:assert/strict';
import { gstShieldView as v } from '../src/utils/gstShieldView.js';

test('unregistered: threshold gauge, alert, no tax figures', () => {
  const r = v({ registered: false, fy_turnover: '3300000.00', registration_threshold: '4000000.00',
    alert_text: 'Approaching the registration threshold. You must register within 30 days of crossing it.',
    compulsory_registration_interstate: true, output_tax: '999' });
  assert.equal(r.showTaxFigures, false);
  assert.equal(r.gauge.level, 'warning');
  assert.equal(r.gauge.label, '82.5%');
  assert.match(r.alertText, /register within 30 days/);
  assert.match(r.interstateWarning, /compulsory/);
});
test('unregistered conservative default threshold when missing', () => {
  assert.equal(v({ registered: false, fy_turnover: '0' }).threshold, 2000000);
});
test('registered: prior FY checks, HSN, e-invoice warning, net credit', () => {
  const r = v({ registered: true, prior_fy_turnover: '60000000.00', prior_fy_label: 'FY 2025-26',
    composition_limit: '15000000.00', composition_eligible: false, qrmp_limit: '50000000.00', qrmp_eligible: false,
    hsn_digits: 6, e_invoice_warning: 'Turnover exceeds ₹5 Cr: e-invoicing applies. Cenvora does not support e-invoicing.',
    output_tax: '4400', itc: '16200', net_payable: '-11800', paid_available: false });
  assert.equal(r.showTaxFigures, true);
  assert.equal(r.hsnDigits, 6);
  assert.deepEqual(r.checks.map((c) => c.ok), [false, false]);
  assert.match(r.eInvoiceWarning, /does not support e-invoicing/);
  assert.equal(r.netLabel, 'Net credit');
  assert.equal(r.showPaid, false);
});
const reg = (o, i) => v({ registered: true, output_tax: o, itc: i, net_payable: 'ignored' });
test('net payable', () => { const r = reg('5200', '1200'); assert.equal(r.net, 4000); assert.equal(r.netLabel, 'Net payable'); });
test('net credit = collected − ITC (live bug: 5.2K vs 16.2K → −11.0K)', () => {
  const r = reg('5200', '16200'); assert.equal(r.net, -11000); assert.equal(r.netLabel, 'Net credit'); assert.equal(r.collectedNote, null);
});
test('net zero', () => { const r = reg('1000.00', '1000.00'); assert.equal(r.net, 0); assert.equal(r.netLabel, 'Net'); });
test('negative collected keeps sign and explains', () => {
  const r = reg('-5200', '16200'); assert.equal(r.outputTax, -5200); assert.equal(r.net, -21400); assert.match(r.collectedNote, /credit notes/);
});
