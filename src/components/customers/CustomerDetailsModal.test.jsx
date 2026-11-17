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
});
