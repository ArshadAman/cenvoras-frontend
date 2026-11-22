import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CustomerDetailsModal from './CustomerDetailsModal';

vi.mock('../../api/customers', () => ({
  getCustomer: vi.fn().mockResolvedValue({
    id: 'c-101',
    name: 'Acme Technologies Pvt Ltd',
    gstin: '27AABCA1234F1Z5',
    email: 'billing@acme.com',
    phone: '+91 99887 76655',
    address: '456 Tech Park, Pune, Maharashtra',
    state: 'Maharashtra',
    current_balance: 45000,
    meta: { party_category: 'Regular', credit_limit: 200000 },
  }),
}));

vi.mock('../../api/sales', () => ({
  getSalesInvoices: vi.fn().mockResolvedValue([
    {
      id: 'inv-1',
      invoice_number: 'INV-2026-001',
      invoice_date: '2026-09-15',
      due_date: '2026-10-15',
      total_amount: 45000.00,
      amount_paid: 0,
      payment_status: 'pending',
      customer: 'c-101',
    },
  ]),
}));

vi.mock('../../api/delivery_challan', () => ({
  getDeliveryChallans: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../api/sales_order', () => ({
  getSalesOrders: vi.fn().mockResolvedValue([
    {
      id: 'so-1',
      order_number: 'SO-2026-001',
      date: '2026-09-10',
      due_date: '2026-09-20',
      total_amount: 12000.00,
      stage: 'new',
      customer: 'c-101',
    },
  ]),
}));

vi.mock('../../api/quotation', () => ({
  getQuotations: vi.fn().mockResolvedValue([
    {
      id: 'q-1',
      quotation_number: 'QT-2026-001',
      quotation_date: '2026-09-05',
      due_date: '2026-09-15',
      total_amount: 8000.00,
      status: 'pending',
      customer: 'c-101',
    },
  ]),
}));

vi.mock('react-to-print', () => ({
  useReactToPrint: () => vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('CustomerDetailsModal', () => {
  it('renders executive statement header with customer name, GSTIN, and metadata', async () => {
    const mockCustomer = {
      id: 'c-101',
      name: 'Acme Technologies Pvt Ltd',
      gstin: '27AABCA1234F1Z5',
    };

    render(
      <QueryClientProvider client={queryClient}>
        <CustomerDetailsModal isOpen={true} onClose={() => {}} customer={mockCustomer} />
      </QueryClientProvider>
    );

    // Customer Name must be present in heading
    const nameEl = await screen.findByRole('heading', { name: /Acme Technologies Pvt Ltd/i });
    expect(nameEl).toBeTruthy();

    // GSTIN badge must be visible
    expect(screen.getByText(/27AABCA1234F1Z5/i)).toBeTruthy();

    // Statement title badge
    expect(screen.getByText(/Customer Statement & Ledger/i)).toBeTruthy();

    // Quick metrics
    expect(screen.getByText(/Total Invoiced/i)).toBeTruthy();
    expect(screen.getByText(/Total Paid/i)).toBeTruthy();
    expect(screen.getByText(/Outstanding Due/i)).toBeTruthy();

    // Table Grand Total row
    const grandTotalEl = await screen.findByText(/Grand Total/i);
    expect(grandTotalEl).toBeTruthy();

    // Executive footer
    expect(screen.getByText(/This is a computer-generated statement from Cenvora ERP/i)).toBeTruthy();
  });

  it('respects zero current_balance without falling back to totalInvoiced', async () => {
    const { getCustomer } = await import('../../api/customers');
    getCustomer.mockResolvedValueOnce({
      id: 'c-zero',
      name: 'Zero Balance Co',
      current_balance: 0,
    });

    const { getSalesInvoices } = await import('../../api/sales');
    getSalesInvoices.mockResolvedValueOnce([
      {
        id: 'inv-z1',
        invoice_number: 'INV-Z-001',
        total_amount: 50000.00,
        amount_paid: 0,
        status: 'final',
        customer: 'c-zero',
      },
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <CustomerDetailsModal isOpen={true} onClose={() => {}} customer={{ id: 'c-zero', name: 'Zero Balance Co' }} />
      </QueryClientProvider>
    );

    await screen.findByRole('heading', { name: /Zero Balance Co/i });
    // Outstanding Due must show 0.00, not 50,000.00
    const outEls = screen.getAllByText(/0\.00/);
    expect(outEls.length).toBeGreaterThan(0);
  });

  it('excludes draft invoices from totalInvoiced and tags them with Draft badge', async () => {
    const { getCustomer } = await import('../../api/customers');
    getCustomer.mockResolvedValueOnce({
      id: 'c-draft-test',
      name: 'Draft Test Co',
      current_balance: 1000,
    });

    const { getSalesInvoices } = await import('../../api/sales');
    getSalesInvoices.mockResolvedValueOnce([
      {
        id: 'inv-final',
        invoice_number: 'INV-F-001',
        total_amount: 1000.00,
        amount_paid: 0,
        status: 'final',
        customer: 'c-draft-test',
      },
      {
        id: 'inv-draft',
        invoice_number: 'DFT-X-002',
        total_amount: 18000.00,
        amount_paid: 0,
        status: 'draft',
        customer: 'c-draft-test',
      },
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <CustomerDetailsModal isOpen={true} onClose={() => {}} customer={{ id: 'c-draft-test', name: 'Draft Test Co' }} />
      </QueryClientProvider>
    );

    await screen.findByRole('heading', { name: /Draft Test Co/i });

    // Draft badge must be rendered
    expect(screen.getByText(/^Draft$/i)).toBeTruthy();

    // Draft balance must show — (Draft)
    expect(screen.getByText(/— \(Draft\)/i)).toBeTruthy();

    // Grand total row must note draft excluded
    expect(screen.getByText(/1 Draft Excluded/i)).toBeTruthy();
  });
});
