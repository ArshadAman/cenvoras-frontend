import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const {
  capturedPrintConfig,
  mockPrintTrigger,
  mockGetDeliveryChallan,
  mockGetDeliveryChallanPdf,
  mockGeneratePixelPerfectPDF,
  mockToast,
} = vi.hoisted(() => ({
  capturedPrintConfig: [],
  mockPrintTrigger: vi.fn(),
  mockGetDeliveryChallan: vi.fn(),
  mockGetDeliveryChallanPdf: vi.fn(),
  mockGeneratePixelPerfectPDF: vi.fn(),
  mockToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('react-to-print', () => ({
  useReactToPrint: (config) => {
    capturedPrintConfig.push(config);
    return mockPrintTrigger;
  },
}));

vi.mock('react-toastify', () => ({ toast: mockToast }));

vi.mock('../../api/delivery_challan', () => ({
  getDeliveryChallan: mockGetDeliveryChallan,
  getDeliveryChallanPdf: mockGetDeliveryChallanPdf,
  patchDeliveryChallan: vi.fn(),
}));

vi.mock('../../api/sales', () => ({
  getSalesInvoice: vi.fn(),
  downloadSalesInvoicePDF: vi.fn(),
  patchSalesInvoice: vi.fn(),
}));

vi.mock('../../api/quotation', () => ({
  getQuotation: vi.fn(),
  downloadQuotationPDF: vi.fn(),
  patchQuotation: vi.fn(),
}));

vi.mock('../../api/sales_order', () => ({
  getSalesOrder: vi.fn(),
  downloadSalesOrderPDF: vi.fn(),
  patchSalesOrder: vi.fn(),
}));

vi.mock('../../api/invoice_settings', () => ({
  getInvoiceSettings: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../api/users', () => ({
  getUserProfile: vi.fn().mockResolvedValue({
    billing_profile: {
      business_name: 'Kamal Enterprises',
      business_address: 'Plot 1, Bhubaneswar',
      gstin: '21ABCDE1234F1Z5',
    },
  }),
  patchUserProfile: vi.fn(),
}));

vi.mock('../../api/customers', () => ({
  patchCustomer: vi.fn(),
}));

vi.mock('../../api/integrations', () => ({
  sendCustomEmail: vi.fn(),
}));

vi.mock('../../utils/pdfEngine', () => ({
  generatePixelPerfectPDF: mockGeneratePixelPerfectPDF,
}));

vi.mock('../invoice/InvoiceTemplateDesigner', () => ({
  default: () => null,
}));

import SalesDetailsModal from './SalesDetailsModal';
import { serializeInvoiceHtml } from '../../utils/htmlInvoiceSerializer';
import { templatePresets } from '../../utils/invoiceSettings';

const sampleChallan = {
  id: 'dc-99',
  challan_number: 'KE-C26/088',
  date: '2026-11-10',
  customer_name: 'JITM',
  customer_address: 'ALURI NAGAR R SITAPUR',
  template_id: 'billship',
  items: [
    { product_name: 'Potassium Chloride', quantity: 1, unit: 'pcs', price: 60, tax: 18 },
  ],
};

function renderModal(challan = sampleChallan) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SalesDetailsModal
        isOpen
        onClose={() => {}}
        invoice={challan}
        documentType="delivery_challan"
      />
    </QueryClientProvider>
  );
}

describe('SalesDetailsModal Delivery Challan print & PDF parity', () => {
  const origCreateObjectURL = window.URL.createObjectURL;
  const origRevokeObjectURL = window.URL.revokeObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedPrintConfig.length = 0;
    localStorage.clear();
    mockGetDeliveryChallan.mockResolvedValue(sampleChallan);
    mockGeneratePixelPerfectPDF.mockResolvedValue(undefined);
    window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-pdf');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
    window.URL.createObjectURL = origCreateObjectURL;
    window.URL.revokeObjectURL = origRevokeObjectURL;
  });

  it('configures print styles to match A4 preview dimensions without breaking .flex-1', async () => {
    renderModal();
    await waitFor(() => expect(screen.getByText('DELIVERY CHALLAN')).toBeTruthy());

    const latestConfig = capturedPrintConfig[capturedPrintConfig.length - 1];
    expect(latestConfig.pageStyle).toContain('min-height: 297mm !important');
    expect(latestConfig.pageStyle).toContain('width: 210mm !important');
    expect(latestConfig.pageStyle).not.toContain('min-height: 100%');
    expect(latestConfig.pageStyle).not.toContain('.invoice-sheet .flex-1');

    const inlinePrintStyle = document.querySelector('style[data-modal-print-style="true"]');
    expect(inlinePrintStyle).toBeTruthy();
    expect(inlinePrintStyle.textContent).toContain('min-height: 297mm !important');
    expect(inlinePrintStyle.textContent).toContain('[data-print-wrapper]');
    expect(inlinePrintStyle.textContent).not.toContain('min-height: 100%');

    expect(document.querySelector('[data-print-wrapper="true"]')).toBeTruthy();
  });

  it('downloads valid %PDF- blob from getDeliveryChallanPdf without triggering fallback', async () => {
    const validPdfBlob = new Blob(['%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF'], {
      type: 'application/pdf',
    });
    mockGetDeliveryChallanPdf.mockResolvedValue(validPdfBlob);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      renderModal();
      await waitFor(() => expect(screen.getByText('DELIVERY CHALLAN')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'Download Vector PDF' }));

      await waitFor(() => expect(mockGetDeliveryChallanPdf).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));

      const [, payload] = mockGetDeliveryChallanPdf.mock.calls[0];
      expect(payload.html).toContain('JetBrains+Mono');
      expect(payload.html).toContain('min-height: 297mm !important');
      expect(payload.html).not.toContain('.invoice-sheet .flex-1');
      expect(payload.html).not.toContain('data-modal-print-style');
      expect(mockGeneratePixelPerfectPDF).not.toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalled();
    } finally {
      clickSpy.mockRestore();
    }
  });

  it('falls back to generatePixelPerfectPDF if API resolves with non-PDF object or error payload', async () => {
    mockGetDeliveryChallanPdf.mockResolvedValue({ data: 'not-unwrapped', status: 200 });

    renderModal();
    await waitFor(() => expect(screen.getByText('DELIVERY CHALLAN')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: 'Download Vector PDF' }));

    await waitFor(() => expect(mockGeneratePixelPerfectPDF).toHaveBeenCalledTimes(1));
    expect(window.URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('preserves Legend 2x2 info grid .flex-1 rules inside serialized vector HTML', async () => {
    const legendChallan = { ...sampleChallan, template_id: 'legend' };
    mockGetDeliveryChallan.mockResolvedValue(legendChallan);

    renderModal(legendChallan);
    await waitFor(() => expect(document.querySelector('[data-print-theme="legend"]')).toBeTruthy());

    const target = document.querySelector('[data-print-target]');
    const html = serializeInvoiceHtml(target);

    expect(html).toContain('family=Inter');
    expect(html).toContain('family=DM+Sans');
    expect(html).toContain('family=JetBrains+Mono');
    expect(html).toContain("'Inter'");
    expect(html).toContain("'JetBrains Mono'");
    expect(html).not.toContain('.invoice-sheet .flex-1');
    expect(html).toContain('.invoice-sheet-body');
    expect(html).toContain('[data-print-target]');
    expect(templatePresets.some((t) => t.id === 'legend')).toBe(true);
  });
});
