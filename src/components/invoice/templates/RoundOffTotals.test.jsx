import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import BillShipTemplate from './BillShipTemplate';
import ClassicTemplate from './ClassicTemplate';
import LegendTemplate from './LegendTemplate';
import ProfessionalTemplate from './ProfessionalTemplate';
import ServiceTemplate from './ServiceTemplate';
import {
  calculateInvoiceTotals,
  computeRoundedTotal,
  splitIntraStateTax,
} from '../../../utils/lineAmount';

afterEach(cleanup);

const businessInfo = {
  business_name: 'Cenvora Traders',
  business_address: 'Plot 1, Industrial Area',
  state: 'Karnataka',
  gstin: '29AAKCG6382L1ZU',
};

const baseTemplate = {
  sections: { showGST: true, showAmountInWords: true },
  columns: [
    { id: 'serial', label: 'S. No', show: true },
    { id: 'description', label: 'Description', show: true },
    { id: 'quantity', label: 'QTY', show: true },
    { id: 'price', label: 'Rate', show: true },
    { id: 'amount', label: 'Amount', show: true },
  ],
};

// Reproduces the reported scenario:
// Items that sum to Taxable = 95,273.01, Tax = 12,548.51 (CGST 6,274.25 + SGST 6,274.26),
// Unrounded total = 107,821.52, while a drifted DB record had total_amount = 107822.01 and round_off = 0.47.
const driftedInvoice = {
  invoice_number: 'INV-100',
  invoice_date: '2026-11-18',
  customer_name: 'Acme Buyer',
  place_of_supply: 'Karnataka',
  round_off: '0.47',
  total_amount: '107822.01',
  items: [
    // 1 * 98219.60 with 3% discount -> taxable = 95273.012 -> line rounded = 95273.01
    // Tax @ 13.1711% -> 12548.51 (odd paise: CGST 6274.25, SGST 6274.26)
    {
      product: 'Precision Lab Kit',
      quantity: 1,
      price: 98219.6,
      discount: 3,
      tax: 13.1711048,
      unit: 'pcs',
    },
  ],
};

describe('lineAmount round-off helpers', () => {
  it('rounds half up to whole rupees without float drift', () => {
    expect(computeRoundedTotal(107821.52)).toBe(107822);
    expect(computeRoundedTotal(1157.5)).toBe(1158);
    expect(computeRoundedTotal(1157.49)).toBe(1157);
  });

  it('splits odd-paise intra-state GST into whole paise summing to total tax', () => {
    const { cgst, sgst } = splitIntraStateTax(12548.51);
    expect(cgst).toBe(6274.25);
    expect(sgst).toBe(6274.26);
    expect(Number((cgst + sgst).toFixed(2))).toBe(12548.51);
  });

  it('reconciles drifted total_amount when round-off is applied so finalTotal ends in .00', () => {
    const totals = calculateInvoiceTotals(driftedInvoice.items, driftedInvoice);
    expect(totals.subtotal).toBe(95273.01);
    expect(totals.taxTotal).toBe(12548.51);
    expect(totals.cgst).toBe(6274.25);
    expect(totals.sgst).toBe(6274.26);
    expect(totals.roundOff).toBe(0.48);
    expect(totals.finalTotal).toBe(107822);
    expect(Number((totals.subtotal + totals.cgst + totals.sgst + totals.roundOff).toFixed(2))).toBe(107822);
  });

  it('preserves unrounded paise when round-off is not applied', () => {
    const unroundedInvoice = {
      ...driftedInvoice,
      round_off: '0.00',
      total_amount: '107821.52',
    };
    const totals = calculateInvoiceTotals(unroundedInvoice.items, unroundedInvoice);
    expect(totals.roundOff).toBe(0);
    expect(totals.finalTotal).toBe(107821.52);
  });

  it('handles negative round-off cleanly', () => {
    const negRoundInvoice = {
      round_off: '-0.49',
      total_amount: '1157.01', // drifted by 0.01
      items: [{ product: 'Item', quantity: 1, price: 1157.49, discount: 0, tax: 0 }],
    };
    const totals = calculateInvoiceTotals(negRoundInvoice.items, negRoundInvoice);
    expect(totals.finalTotal).toBe(1157);
    expect(totals.roundOff).toBe(-0.49);
  });
});

describe('Invoice templates eliminate 0.01 denomination after round-off and 3-decimal amounts', () => {
  const indianFormattedTemplates = [
    ['BillShipTemplate', BillShipTemplate],
    ['LegendTemplate', LegendTemplate],
    ['ServiceTemplate', ServiceTemplate],
  ];

  for (const [name, Component] of indianFormattedTemplates) {
    it(`${name} renders whole-rupee Grand Total (.00) and 2-decimal CGST/SGST`, () => {
      const { container } = render(
        <Component
          invoice={driftedInvoice}
          template={baseTemplate}
          businessInfo={businessInfo}
        />
      );
      const text = container.textContent;
      expect(text).toContain('95,273.01');
      expect(text).not.toContain('95,273.012');
      expect(text).toContain('6,274.25');
      expect(text).toContain('6,274.26');
      expect(text).not.toContain('6,274.255');
      expect(text).toContain('+₹0.48');
      expect(text).toContain('1,07,822.00');
      expect(text).not.toContain('1,07,822.01');
    });
  }

  const fixedFormattedTemplates = [
    ['ClassicTemplate', ClassicTemplate],
    ['ProfessionalTemplate', ProfessionalTemplate],
  ];

  for (const [name, Component] of fixedFormattedTemplates) {
    it(`${name} renders whole-rupee Grand Total (.00) and 2-decimal CGST/SGST`, () => {
      const { container } = render(
        <Component
          invoice={driftedInvoice}
          template={baseTemplate}
          businessInfo={businessInfo}
        />
      );
      const text = container.textContent;
      expect(text).toContain('95273.01');
      expect(text).not.toContain('95273.012');
      expect(text).toContain('6274.25');
      expect(text).toContain('6274.26');
      expect(text).not.toContain('6274.255');
      expect(text).toContain('+₹0.48');
      expect(text).toContain('107822.00');
      expect(text).not.toContain('107822.01');
    });
  }

  it('BillShipTemplate formats negative round-off as -₹0.49 rather than ₹-0.49', () => {
    const negInvoice = {
      ...driftedInvoice,
      round_off: '-0.49',
      total_amount: '1157.00',
      items: [{ product: 'Item', quantity: 1, price: 1157.49, discount: 0, tax: 0 }],
    };
    const { container } = render(
      <BillShipTemplate
        invoice={negInvoice}
        template={baseTemplate}
        businessInfo={businessInfo}
      />
    );
    expect(container.textContent).toContain('-₹0.49');
    expect(container.textContent).not.toContain('₹-0.49');
    expect(container.textContent).toContain('1,157.00');
  });
});
