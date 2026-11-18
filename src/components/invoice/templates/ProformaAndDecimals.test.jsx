import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import BillShipTemplate from './BillShipTemplate';
import LegendTemplate from './LegendTemplate';
import ServiceTemplate from './ServiceTemplate';
import ClassicTemplate from './ClassicTemplate';
import ProfessionalTemplate from './ProfessionalTemplate';

afterEach(cleanup);

const businessInfo = {
  business_name: 'Cenvora Scientific',
  business_address: 'Plot 1, Industrial Area, Odisha',
  phone: '9876543210',
  email: 'ops@cenvora.test',
  gstin: '21AAKCG6382L1ZU',
  state: 'Odisha',
};

const baseColumns = [
  { id: 'serial', label: 'Sl.', show: true },
  { id: 'description', label: 'Description', show: true },
  { id: 'quantity', label: 'QTY', show: true },
  { id: 'unit', label: 'Unit', show: true },
  { id: 'price', label: 'UNIT PRICE', show: true },
  { id: 'discount', label: 'Disc.', show: true },
  { id: 'tax', label: 'TAX', show: true },
  { id: 'amount', label: 'AMOUNT', show: true },
];

// Exact items producing 3-decimal intermediates (Cyanide = 6936.082, subtotal = 95273.012, tax/2 = 6274.255)
const screenshotItems = [
  { product: 'Buffer solution pH 10.00', quantity: 1, unit: 'pcs', price: 2750.0, discount: 3, tax: 5 },
  { product: 'Cyanide', quantity: 1, unit: 'pcs', price: 7150.6, discount: 3, tax: 18 },
  { product: 'Nitrite (NO2-) AAS standard', quantity: 2, unit: 'pcs', price: 3487.5, discount: 3, tax: 5 },
  { product: 'Sulfate (SO42-) 1000 ppm', quantity: 1, unit: 'pcs', price: 7750.0, discount: 3, tax: 5 },
  { product: 'Turbidity standard solution 10 NTU', quantity: 1, unit: 'pcs', price: 7659.0, discount: 3, tax: 5 },
  { product: 'Potassium Chloride Reference Standard', quantity: 1, unit: 'pcs', price: 6075.0, discount: 3, tax: 18 },
  { product: 'Holmium(III) oxide CRM', quantity: 2, unit: 'pcs', price: 24255.0, discount: 3, tax: 18 },
  { product: 'Phenol', quantity: 1, unit: 'pcs', price: 11350.0, discount: 3, tax: 5 },
];

const proformaInvoice = {
  document_type: 'proforma',
  invoice_number: 'SO-014',
  invoice_date: '2026-11-18',
  customer_name: 'Acme Lab',
  customer_address: 'Bhubaneswar, Odisha',
  customer_gstin: '21BBKCG6382L1Z1',
  place_of_supply: 'Odisha',
  round_off: 0.47,
  total_amount: 107822.01,
  items: screenshotItems,
};

const quotationDoc = {
  ...proformaInvoice,
  document_type: 'quotation',
  invoice_number: 'QT-009',
};

const regularInvoice = {
  ...proformaInvoice,
  document_type: 'invoice',
  invoice_number: 'INV-001',
};

const makeTemplate = (title) => ({
  content: { invoiceTitle: title },
  sections: { showGST: true, showBankDetails: false },
  columns: baseColumns,
});

const templates = [
  { name: 'BillShipTemplate', Component: BillShipTemplate, usesLocaleCommas: true },
  { name: 'LegendTemplate', Component: LegendTemplate, usesLocaleCommas: true },
  { name: 'ServiceTemplate', Component: ServiceTemplate, usesLocaleCommas: true },
  { name: 'ClassicTemplate', Component: ClassicTemplate, usesLocaleCommas: false },
  { name: 'ProfessionalTemplate', Component: ProfessionalTemplate, usesLocaleCommas: false },
];

describe('Proforma Invoice & Quotation labels and 2-decimal currency formatting', () => {
  for (const { name, Component, usesLocaleCommas } of templates) {
    describe(name, () => {
      it('renders Proforma Invoice # and Proforma Invoice Date for proforma invoices', () => {
        const { container } = render(
          <Component
            invoice={proformaInvoice}
            template={makeTemplate('PROFORMA INVOICE')}
            businessInfo={businessInfo}
          />
        );
        const text = container.textContent;
        expect(text).toContain('PROFORMA INVOICE');
        expect(text).toContain('Proforma Invoice #');
        expect(text).toContain('Proforma Invoice Date');
        expect(text).toContain('SO-014');
        expect(text).not.toMatch(/(?<!Proforma )Invoice #/);
        expect(text).not.toMatch(/(?<!Proforma )Invoice Date/);
      });

      it('formats amount column, Taxable Amount, CGST, and SGST to exactly 2 decimal digits', () => {
        const { container } = render(
          <Component
            invoice={proformaInvoice}
            template={makeTemplate('PROFORMA INVOICE')}
            businessInfo={businessInfo}
          />
        );
        const text = container.textContent;

        // Ensure 3-decimal artifacts from the screenshot never appear
        expect(text).not.toContain('6,936.082');
        expect(text).not.toContain('6936.082');
        expect(text).not.toContain('95,273.012');
        expect(text).not.toContain('95273.012');
        expect(text).not.toContain('6,274.255');
        expect(text).not.toContain('6274.255');

        if (usesLocaleCommas) {
          expect(text).toContain('6,936.08');
          expect(text).toContain('95,273.01');
          expect(text).toContain('6,274.25');
        } else {
          expect(text).toContain('6936.08');
          expect(text).toContain('95273.01');
          expect(text).toContain('6274.25');
        }
      });

      it('renders Quotation # and Quotation Date for quotations', () => {
        const { container } = render(
          <Component
            invoice={quotationDoc}
            template={makeTemplate('QUOTATION')}
            businessInfo={businessInfo}
          />
        );
        const text = container.textContent;
        expect(text).toContain('QUOTATION');
        expect(text).toContain('Quotation #');
        expect(text).toContain('Quotation Date');
        expect(text).toContain('QT-009');
      });

      it('preserves regular Invoice label for tax invoices', () => {
        const { container } = render(
          <Component
            invoice={regularInvoice}
            template={makeTemplate('TAX INVOICE')}
            businessInfo={businessInfo}
          />
        );
        const text = container.textContent;
        expect(text).toContain('INV-001');
        expect(text).not.toContain('Proforma Invoice #');
        expect(text).not.toContain('Quotation #');
      });
    });
  }
});
