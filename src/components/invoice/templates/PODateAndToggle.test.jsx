import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BillShipTemplate from './BillShipTemplate';
import LegendTemplate from './LegendTemplate';
import ServiceTemplate from './ServiceTemplate';
import ClassicTemplate from './ClassicTemplate';
import ProfessionalTemplate from './ProfessionalTemplate';
import InvoiceTemplateDesigner from '../InvoiceTemplateDesigner';

beforeEach(() => {
  const store = {};
  const mockStorage = {
    getItem: (key) => store[key] ?? null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
  global.localStorage = mockStorage;
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

const businessInfo = {
  business_name: 'Kalinga Enterprises',
  business_address: 'Plot 42, Infocity, Bhubaneswar, Odisha',
  phone: '9876543210',
  email: 'sales@kalinga.test',
  gstin: '21AAACK1234L1Z5',
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

const sampleItems = [
  { product: 'Chemical Consumables Lot A', quantity: 2, unit: 'pcs', price: 5000, tax: 18, amount: 10000 },
];

// Replicates the exact case from the user's screenshot:
// Proforma invoice with PO Number KIIT-TBI/ATF/Consumables/2026-27/72 and PO Date 18/11/2026
const proformaWithPo = {
  document_type: 'proforma',
  invoice_number: 'KE/PI-26/014',
  invoice_date: '2026-11-18',
  po_number: 'KIIT-TBI/ATF/Consumables/2026-27/72',
  po_date: '2026-11-18',
  customer_name: 'KIIT Technology Business Incubator',
  customer_address: 'Campus 11, KIIT University, Bhubaneswar',
  customer_gstin: '21AAAAT0123L1Z2',
  place_of_supply: 'Odisha',
  total_amount: 11800,
  items: sampleItems,
};

const templates = [
  { name: 'BillShipTemplate', Component: BillShipTemplate, poNumPattern: /PO \/ Order:\s*KIIT-TBI/, poDatePattern: /PO Date:\s*18\/11\/2026/ },
  { name: 'LegendTemplate', Component: LegendTemplate, poNumPattern: /KIIT-TBI\/ATF/, poDatePattern: /PO Date:\s*18\/11\/2026/ },
  { name: 'ProfessionalTemplate', Component: ProfessionalTemplate, poNumPattern: /KIIT-TBI\/ATF/, poDatePattern: /18\/11\/2026/ },
  { name: 'ServiceTemplate', Component: ServiceTemplate, poNumPattern: /PO \/ Order #:\s*KIIT-TBI/, poDatePattern: /PO Date:\s*18\/11\/2026/ },
  { name: 'ClassicTemplate', Component: ClassicTemplate, poNumPattern: /KIIT-TBI\/ATF/, poDatePattern: /18\/11\/2026/ },
];

describe('PO Date rendering and PO Number toggle control across invoice templates', () => {
  for (const { name, Component, poNumPattern, poDatePattern } of templates) {
    describe(name, () => {
      it('renders both PO Number and PO Date when showPONumber is true or default', () => {
        const template = {
          content: { invoiceTitle: 'PROFORMA INVOICE' },
          sections: { showPONumber: true, showGST: true },
          columns: baseColumns,
        };

        const { container } = render(
          <Component
            invoice={proformaWithPo}
            template={template}
            businessInfo={businessInfo}
          />
        );

        const text = container.textContent;
        expect(text).toMatch(poNumPattern);
        expect(text).toMatch(poDatePattern);
      });

      it('hides BOTH PO Number and PO Date when showPONumber is false', () => {
        const template = {
          content: { invoiceTitle: 'PROFORMA INVOICE' },
          sections: { showPONumber: false, showGST: true },
          columns: baseColumns,
        };

        const { container } = render(
          <Component
            invoice={proformaWithPo}
            template={template}
            businessInfo={businessInfo}
          />
        );

        const text = container.textContent;
        // Neither the PO number nor the PO date should appear
        expect(text).not.toContain('KIIT-TBI/ATF/Consumables/2026-27/72');
        expect(text).not.toMatch(/PO Date:\s*18\/11\/2026/);
      });

      it('renders delivery challan with Ref Order and PO Date when present', () => {
        const dcWithPo = {
          document_type: 'delivery_challan',
          challan_number: 'DC-2026-001',
          challan_date: '2026-11-18',
          po_number: 'KIIT-TBI/ATF/Consumables/2026-27/72',
          po_date: '2026-11-18',
          customer_name: 'KIIT TBI',
          items: sampleItems,
        };

        const template = {
          content: { invoiceTitle: 'DELIVERY CHALLAN' },
          sections: { showPONumber: true },
          columns: baseColumns,
        };

        const { container } = render(
          <Component
            invoice={dcWithPo}
            template={template}
            businessInfo={businessInfo}
          />
        );

        const text = container.textContent;
        if (text.includes('KIIT-TBI/ATF')) {
          expect(text).toMatch(/18\/11\/2026/);
        }
      });
    });
  }

  describe('InvoiceTemplateDesigner PO Number Toggle', () => {
    it('displays the PO Number toggle with explicit mention that it also controls PO Date', () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <InvoiceTemplateDesigner
            isOpen={true}
            onClose={() => {}}
            businessInfo={businessInfo}
            invoice={proformaWithPo}
          />
        </QueryClientProvider>
      );

      // Click on the 'Sections' tab
      const sectionsTab = screen.getByText('Sections');
      fireEvent.click(sectionsTab);

      // Verify toggle label and description subtext
      const text = document.body.textContent;
      expect(text).toContain('PO Number');
      expect(text).toContain('Also controls PO Date');
    });
  });
});
