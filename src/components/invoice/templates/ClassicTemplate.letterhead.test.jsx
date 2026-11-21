import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import ClassicTemplate from './ClassicTemplate';
import { serializeInvoiceHtml } from '../../../utils/htmlInvoiceSerializer';
import { resolveTypography } from '../../../utils/invoiceSettings';

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
    expect(container.textContent).toContain('Customer Address');
    expect(container.textContent).not.toContain('Billing Address');
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
    expect(html).toContain('.invoice-print-shell[data-print-theme="classic"] .invoice-continuation-header');
    expect(html).not.toContain('.invoice-print-shell:not([data-print-theme="classic"]) .invoice-first-page-header');
    expect(html).toContain('invoice-print-shell-footer-spacer');
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

    const noteCell = [...container.querySelectorAll('table:not(.invoice-print-shell) td')].find((td) =>
      td.textContent.includes('Note: 5/5')
    );
    expect(noteCell).toBeTruthy();
    expect(noteCell.className).toMatch(/\bpx-2\b/);
    expect(noteCell.className).not.toMatch(/\bpx-3\b/);

    const itemTable = [...container.querySelectorAll('table:not(.invoice-print-shell)')].find((table) =>
      table.textContent.includes('Pasteur Pipette PP')
    );
    const bodyRows = [...itemTable.querySelectorAll(':scope > tbody > tr')];
    expect(bodyRows[0].textContent).toContain('Note: 5/5');
    expect(bodyRows[1].querySelector('td').textContent.trim()).toBe('1');
    expect(bodyRows[2].querySelector('td').textContent.trim()).toBe('2');
  });
});

describe('resolveTypography', () => {
  it('falls back so old templates keep looking the same', () => {
    const type = resolveTypography({ companyNameSize: 24, smallSize: 9, bodySize: 11 });
    expect(type.companyAddressSize).toBe(9);
    expect(type.tableHeaderSize).toBe(9);
    expect(type.tableBodySize).toBe(12);
    expect(type.bankDetailsSize).toBe(12);
    expect(type.footerSize).toBe(9);
    expect(type.customerNameSize).toBe(11);
  });

  it('uses explicit region sizes when set', () => {
    const type = resolveTypography({
      tableHeaderSize: 14,
      bankDetailsSize: 8,
      companyAddressSize: 11,
    });
    expect(type.tableHeaderSize).toBe(14);
    expect(type.bankDetailsSize).toBe(8);
    expect(type.companyAddressSize).toBe(11);
  });
});

describe('Classic invoice dynamic columns and page-break spacer', () => {
  it('renders a 10mm tfoot footer spacer for page-break clearance', () => {
    const { container } = render(
      <ClassicTemplate invoice={challan} template={template} businessInfo={businessInfo} />
    );
    const tfoot = container.querySelector('.invoice-print-shell-footer-spacer');
    expect(tfoot).toBeTruthy();
    expect(tfoot.style.display).toBe('table-footer-group');
    const td = tfoot.querySelector('td');
    expect(td.style.height).toBe('10mm');
  });

  it('calculates dynamic column widths: maintains 9% price and 10% amount for normal values, giving surplus to description', () => {
    const invoice = {
      invoice_number: 'INV-001',
      invoice_date: '2026-10-30',
      customer_name: 'Acme Corporation',
      items: [
        { product: 'Standard Item', quantity: 1, price: 420, tax: 18 },
      ],
    };
    const templateWithAllCols = {
      ...template,
      columns: [
        { id: 'serial', label: 'Sl.', show: true },
        { id: 'description', label: 'Description', show: true },
        { id: 'hsn', label: 'HSNC', show: true },
        { id: 'quantity', label: 'QTY', show: true },
        { id: 'unit', label: 'Unit', show: true },
        { id: 'price', label: 'Price', show: true },
        { id: 'discount', label: 'Disc.', show: true },
        { id: 'tax', label: 'TAX', show: true },
        { id: 'amount', label: 'AMOUNT', show: true },
      ],
    };

    const { container } = render(
      <ClassicTemplate invoice={invoice} template={templateWithAllCols} businessInfo={businessInfo} />
    );

    const priceCol = container.querySelector('col[data-col-id="price"]');
    const amountCol = container.querySelector('col[data-col-id="amount"]');
    const descCol = container.querySelector('col[data-col-id="description"]');

    expect(priceCol.style.width).toBe('9%');
    expect(amountCol.style.width).toBe('10%');
    // visible: serial (4), description, hsn (11.5), quantity (6), unit (6), price (9), tax (6), amount (10)
    // nonDescription = 4 + 11.5 + 6 + 6 + 9 + 6 + 10 = 52.5%. description = 47.5%
    expect(descCol.style.width).toBe('47.5%');
  });

  it('expands price and amount when content exceeds normal maintained width and reduces description', () => {
    const invoice = {
      invoice_number: 'INV-002',
      invoice_date: '2026-10-30',
      customer_name: 'Big Corp',
      items: [
        { product: 'Heavy Machinery', quantity: 2, price: 12500000, tax: 18 },
      ],
    };
    const templateWithAllCols = {
      ...template,
      columns: [
        { id: 'serial', label: 'Sl.', show: true },
        { id: 'description', label: 'Description', show: true },
        { id: 'hsn', label: 'HSNC', show: true },
        { id: 'quantity', label: 'QTY', show: true },
        { id: 'unit', label: 'Unit', show: true },
        { id: 'price', label: 'Price', show: true },
        { id: 'discount', label: 'Disc.', show: true },
        { id: 'tax', label: 'TAX', show: true },
        { id: 'amount', label: 'AMOUNT', show: true },
      ],
    };

    const { container } = render(
      <ClassicTemplate invoice={invoice} template={templateWithAllCols} businessInfo={businessInfo} />
    );

    const priceWidth = parseFloat(container.querySelector('col[data-col-id="price"]').style.width);
    const amountWidth = parseFloat(container.querySelector('col[data-col-id="amount"]').style.width);
    const descWidth = parseFloat(container.querySelector('col[data-col-id="description"]').style.width);

    expect(priceWidth).toBeGreaterThan(9);
    expect(amountWidth).toBeGreaterThan(10);
    expect(descWidth).toBeLessThan(47.5);
  });

  it('shifts billing address down in natural table flow when company address expands', () => {
    const multiLineBusinessInfo = {
      ...businessInfo,
      business_address: 'Line 1: Main Complex\nLine 2: Tower B, Floor 4\nLine 3: Industrial Suburb\nLine 4: Near Metro Station\nLine 5: Bhubaneswar 751019, Odisha',
    };

    const { container } = render(
      <ClassicTemplate invoice={challan} template={template} businessInfo={multiLineBusinessInfo} />
    );

    const thead = container.querySelector('.invoice-print-shell > thead');
    const tbody = container.querySelector('.invoice-print-shell > tbody');
    expect(thead).toBeTruthy();
    expect(tbody).toBeTruthy();

    // Verify the continuation header contains the full multi-line address
    expect(thead.textContent).toContain('Line 5: Bhubaneswar 751019, Odisha');

    // The billing/customer address is inside tbody (which flows strictly below thead)
    expect(tbody.textContent).toContain('Customer Address');
    expect(tbody.textContent).toContain('123 Business Park');
  });
});

