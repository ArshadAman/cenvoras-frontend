import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import ClassicTemplate from './ClassicTemplate';
import BillShipTemplate from './BillShipTemplate';
import LegendTemplate from './LegendTemplate';
import ProfessionalTemplate from './ProfessionalTemplate';
import ServiceTemplate from './ServiceTemplate';

afterEach(cleanup);

const sampleInvoice = {
  invoice_number: 'INV-101',
  invoice_date: '2026-11-20',
  customer_name: 'Acme Corp',
  customer_address: '123 Business Way, Mumbai',
  items: [
    {
      product_name: 'Hydroquinone AR, 99%',
      hsn_sac_code: '29072200',
      quantity: 1,
      unit: 'pcs',
      price: 1500,
      discount: 32,
      tax: 18,
    },
  ],
};

const sampleBusiness = {
  business_name: 'Cenvora Traders',
  business_address: 'Plot 1, Industrial Area',
  gstin: '27AAKCG6382L1ZU',
};

const makeTemplate = (layoutType, tableHeaderSize, tableBodySize) => ({
  layout: { layoutType },
  typography: {
    tableHeaderSize,
    tableBodySize,
  },
  columns: [
    { id: 'serial', label: 'Sl.', show: true },
    { id: 'description', label: 'Description', show: true },
    { id: 'hsn', label: 'HSN', show: true },
    { id: 'quantity', label: 'Qty', show: true },
    { id: 'price', label: 'Price', show: true },
    { id: 'amount', label: 'Amount', show: true },
  ],
});

const templates = [
  { name: 'ClassicTemplate', Component: ClassicTemplate, layout: 'classic' },
  { name: 'BillShipTemplate', Component: BillShipTemplate, layout: 'billship' },
  { name: 'LegendTemplate', Component: LegendTemplate, layout: 'legend' },
  { name: 'ProfessionalTemplate', Component: ProfessionalTemplate, layout: 'professional' },
  { name: 'ServiceTemplate', Component: ServiceTemplate, layout: 'service' },
];

describe('Table Typography Controls (tableHeaderSize & tableBodySize)', () => {
  templates.forEach(({ name, Component, layout }) => {
    describe(name, () => {
      it('applies tableHeaderSize to items table header th and tr', () => {
        const { container } = render(
          <Component
            invoice={sampleInvoice}
            businessInfo={sampleBusiness}
            template={makeTemplate(layout, 15, 11)}
          />
        );

        const itemsTable = Array.from(container.querySelectorAll('table')).find(
          (t) => !t.classList.contains('invoice-print-shell')
        );
        expect(itemsTable).toBeDefined();

        const thList = itemsTable.querySelectorAll('thead th');
        expect(thList.length).toBeGreaterThan(0);
        thList.forEach((th) => {
          expect(th.style.fontSize).toBe('15px');
        });

        const headerTr = itemsTable.querySelector('thead tr');
        expect(headerTr.style.fontSize).toBe('15px');
      });

      it('applies tableBodySize to all items table body td cells and row', () => {
        const { container } = render(
          <Component
            invoice={sampleInvoice}
            businessInfo={sampleBusiness}
            template={makeTemplate(layout, 11, 14)}
          />
        );

        const itemsTable = Array.from(container.querySelectorAll('table')).find(
          (t) => !t.classList.contains('invoice-print-shell')
        );
        expect(itemsTable).toBeDefined();

        const tbody = itemsTable.querySelector('tbody');
        const bodyTr = tbody.querySelector('tr');
        expect(bodyTr.style.fontSize).toBe('14px');

        const tdList = bodyTr.querySelectorAll('td');
        expect(tdList.length).toBeGreaterThan(0);
        tdList.forEach((td) => {
          expect(td.style.fontSize).toBe('14px');
        });
      });
    });
  });
});
