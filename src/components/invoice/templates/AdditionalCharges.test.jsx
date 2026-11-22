import { describe, it, expect } from 'vitest';
import { calculateInvoiceTotals, calculateChargesBreakup } from '../../../utils/lineAmount';

describe('Additional Charges / Miscellaneous Expenses calculations', () => {
  it('calculates charges breakdown without GST (0% / exempt)', () => {
    const charges = [
      { name: 'Freight & Shipping', amount: 500, tax_rate: 0 },
      { name: 'Packaging & Forwarding', amount: 150, tax_rate: 0 },
    ];
    const breakup = calculateChargesBreakup(charges);
    expect(breakup.chargesTaxablePaise).toBe(65000);
    expect(breakup.chargesTaxPaise).toBe(0);
    expect(breakup.sanitizedCharges).toHaveLength(2);
    expect(breakup.sanitizedCharges[0].total).toBe(500);
    expect(breakup.sanitizedCharges[1].total).toBe(150);
  });

  it('calculates charges breakdown with revised GST rates (3%, 5%, 18%, 28%, 40%)', () => {
    const charges = [
      { name: 'Freight & Shipping', amount: 1000, tax_rate: 18 },
      { name: 'Loading Charges', amount: 200, tax_rate: 5 },
      { name: 'Special Packaging', amount: 100, tax_rate: 40 },
    ];
    const breakup = calculateChargesBreakup(charges);
    // 1000 + 200 + 100 = 1300 taxable = 130000 paise
    expect(breakup.chargesTaxablePaise).toBe(130000);
    // Tax: 18% of 1000 = 180 (18000 paise) + 5% of 200 = 10 (1000 paise) + 40% of 100 = 40 (4000 paise)
    // Total tax = 230 = 23000 paise
    expect(breakup.chargesTaxPaise).toBe(23000);
  });

  it('forces 0% GST when company tax is locked (composition / unregistered)', () => {
    const charges = [
      { name: 'Freight & Shipping', amount: 500, tax_rate: 18 },
    ];
    const breakup = calculateChargesBreakup(charges, true);
    expect(breakup.chargesTaxablePaise).toBe(50000);
    expect(breakup.chargesTaxPaise).toBe(0);
    expect(breakup.sanitizedCharges[0].tax_rate).toBe(0);
    expect(breakup.sanitizedCharges[0].tax_amount).toBe(0);
    expect(breakup.sanitizedCharges[0].total).toBe(500);
  });

  it('combines items and additional charges in calculateInvoiceTotals', () => {
    const items = [
      { quantity: 2, price: 500, discount: 0, tax: 18 }, // Taxable = 1000, Tax = 180, Total = 1180
    ];
    const invoice = {
      additional_charges: [
        { name: 'Freight & Shipping', amount: 200, tax_rate: 18 }, // Taxable = 200, Tax = 36, Total = 236
        { name: 'Packaging', amount: 50, tax_rate: 0 },            // Taxable = 50, Tax = 0, Total = 50
      ],
      round_off: 0,
    };

    const totals = calculateInvoiceTotals(items, invoice);
    expect(totals.itemsSubtotal).toBe(1000);
    expect(totals.chargesSubtotal).toBe(250);
    expect(totals.subtotal).toBe(1250);
    // Total Tax = 180 (items) + 36 (freight) = 216
    expect(totals.taxTotal).toBe(216);
    expect(totals.cgst).toBe(108);
    expect(totals.sgst).toBe(108);
    // Grand Total = 1250 + 216 = 1466
    expect(totals.finalTotal).toBe(1466);
    expect(totals.charges).toHaveLength(2);
  });

  it('correctly handles round-off with additional charges', () => {
    const items = [
      { quantity: 1, price: 100.50, discount: 0, tax: 5 }, // Taxable = 100.50, Tax = 5.03, Total = 105.53
    ];
    const invoice = {
      additional_charges: [
        { name: 'Loading', amount: 50.25, tax_rate: 18 }, // Taxable = 50.25, Tax = 9.05, Total = 59.30
      ],
      apply_round_off: true,
    };

    // Unrounded: (100.50 + 50.25) + (5.03 + 9.05) = 150.75 + 14.08 = 164.83
    // Rounded: 165.00, roundOff = +0.17
    const totals = calculateInvoiceTotals(items, invoice);
    expect(totals.unroundedTotal).toBe(164.83);
    expect(totals.finalTotal).toBe(165);
    expect(totals.roundOff).toBe(0.17);
  });
});
