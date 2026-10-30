import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import ClassicTemplate from './ClassicTemplate';
import { serializeInvoiceHtml } from '../../../utils/htmlInvoiceSerializer';

afterEach(cleanup);

const challan = {
  document_type: 'delivery_challan',
  is_delivery_challan: true,
  challan_number: 'DC-001',
  challan_date: '2026-10-27',
  customer_name: 'Acme Corporation',
  customer_address: '123 Business Park',
  items: [{ product: 'Industrial Valve', quantity: 2, price: 100, tax: 18 }],
};

const businessInfo = {
  business_name: 'Cenvora Traders',
  business_address: 'Plot 1, Industrial Area',
  phone: '9876543210',
  email: 'ops@cenvora.test',
  gstin: '29AAKCG6382L1ZU',
  pan_number: 'AAKCG6382L',
};

const template = {
  layout: { layoutType: 'classic' },
  typography: { companyNameSize: 24, smallSize: 9 },
  sections: { showGST: true, showGEMID: false },
  columns: [
    { id: 'serial', label: 'S. No', show: true },
    { id: 'description', label: 'Description', show: true },
    { id: 'quantity', label: 'QTY', show: true },
  ],
};

describe('Classic delivery challan letterhead', () => {
  it('shows the thead letterhead on screen with print geometry and no duplicate header', () => {
    const { container } = render(
      <ClassicTemplate invoice={challan} template={template} businessInfo={businessInfo} />
    );

    expect(container.querySelector('.invoice-first-page-header')).toBeNull();

    const row = container.querySelector('.invoice-continuation-header');
    expect(row).toBeTruthy();
    expect(row.style.display).toBe('table-row');
    expect(container.querySelector('[data-print-theme="classic"]')).toBeTruthy();
    expect(container.querySelector('.invoice-continuation-letterhead-classic')).toBeTruthy();

    const sheet = container.querySelector('.invoice-sheet');
    expect(sheet.style.paddingBottom).toMatch(/10mm/);
    expect(sheet.style.paddingLeft === '0px' || sheet.style.paddingLeft === '0').toBe(true);
    const bodyCell = container.querySelector('.invoice-print-shell-row > td');
    expect(bodyCell.style.padding).toMatch(/7mm/);
    const thead = container.querySelector('.invoice-print-shell > thead');
    expect(thead.style.display).toBe('table-header-group');

    expect(container.textContent).toContain('Cenvora Traders');
    expect(container.textContent).toContain('DELIVERY CHALLAN');
    expect(container.textContent).toContain('DC-001');
    expect(container.textContent).toContain('GSTIN: 29AAKCG6382L1ZU');
  });

  it('keeps the Classic letterhead visible when serialized for print/PDF', () => {
    const { container } = render(
      <ClassicTemplate invoice={challan} template={template} businessInfo={businessInfo} />
    );
    const html = serializeInvoiceHtml(container.querySelector('.invoice-sheet'));

    expect(html).toContain('invoice-continuation-letterhead-classic');
    expect(html).toContain('Cenvora Traders');
    expect(html).toContain('data-print-theme="classic"');
    expect(html).not.toContain('invoice-first-page-header');
    expect(html).toContain('.invoice-print-shell:not([data-print-theme="classic"]) .invoice-first-page-header');
  });
});

describe('Classic invoice note rows', () => {
  it('does not consume a serial number and uses px-2 padding', () => {
    const invoice = {
      invoice_number: 'INV-001',
      invoice_date: '2026-10-30',
      customer_name: 'Acme Corporation',
      items: [
        { row_type: 'note', description: '5/5' },
        { product: 'Pasteur Pipette PP', quantity: 1, price: 140, tax: 18, discount: 20, unit: 'pack' },
        { product: 'Cellulase', quantity: 1, price: 7170.6, tax: 18, discount: 5, unit: 'pcs' },
      ],
    };

    const { container } = render(
      <ClassicTemplate invoice={invoice} template={template} businessInfo={businessInfo} />
    );

    const noteCell = [...container.querySelectorAll('td')].find((td) =>
      td.textContent.includes('Note: 5/5')
    );
    expect(noteCell).toBeTruthy();
    expect(noteCell.className).toMatch(/\bpx-2\b/);
    expect(noteCell.className).not.toMatch(/\bpx-3\b/);

    const itemTable = [...container.querySelectorAll('table')].find((table) =>
      table.className.includes('border-collapse') && table.textContent.includes('Pasteur Pipette PP')
    );
    const bodyRows = [...itemTable.querySelectorAll(':scope > tbody > tr')];
    expect(bodyRows[0].textContent).toContain('Note: 5/5');
    expect(bodyRows[1].querySelector('td').textContent.trim()).toBe('1');
    expect(bodyRows[2].querySelector('td').textContent.trim()).toBe('2');
  });
});

