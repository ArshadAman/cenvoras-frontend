import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import VendorDetailsModal from './VendorDetailsModal';

vi.mock('../../api/vendors', () => ({
  getVendor: vi.fn().mockResolvedValue({
    id: 'v-101',
    name: 'Remi Sales & Engineering Ltd.',
    gstin: '19AAACR0421M1ZG',
    email: 'contact@remisales.com',
    phone: '+91 98765 43210',
    address: '123 Industrial Estate, Mumbai, Maharashtra',
    state: 'Maharashtra',
    meta: { party_category: 'Regular', credit_limit: 100000 },
  }),
}));

vi.mock('../../api/purchase', () => ({
  getPurchaseBills: vi.fn().mockResolvedValue([
    {
      id: 'b-1',
      bill_number: 'LABG/D/415/26-27',
      bill_date: '2026-09-24',
      due_date: '2026-10-24',
      total_amount: 29488.20,
      amount_paid: 0,
      payment_status: 'pending',
      vendor: 'v-101',
    },
  ]),
}));

vi.mock('../../api/purchase_orders', () => ({
  listPurchaseOrders: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../api/gst', () => ({
  getDebitNotes: vi.fn().mockResolvedValue([]),
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

describe('VendorDetailsModal', () => {
  it('renders executive statement header with vendor name, GSTIN, and metadata', async () => {
    const mockVendor = {
      id: 'v-101',
      name: 'Remi Sales & Engineering Ltd.',
      gstin: '19AAACR0421M1ZG',
    };

    render(
      <QueryClientProvider client={queryClient}>
        <VendorDetailsModal isOpen={true} onClose={() => {}} vendor={mockVendor} />
      </QueryClientProvider>
    );

    // Vendor Name must be present in heading
    const nameEl = await screen.findByRole('heading', { name: /Remi Sales & Engineering Ltd\./i });
    expect(nameEl).toBeTruthy();

    // GSTIN badge must be visible
    expect(screen.getByText(/19AAACR0421M1ZG/i)).toBeTruthy();

    // Statement title badge
    expect(screen.getByText(/Vendor Statement & Ledger/i)).toBeTruthy();

    // Quick metrics
    expect(screen.getByText(/Total Billed/i)).toBeTruthy();
    expect(screen.getByText(/Total Paid/i)).toBeTruthy();
    expect(screen.getByText(/Outstanding Due/i)).toBeTruthy();

    // Table Grand Total row
    const grandTotalEl = await screen.findByText(/Grand Total/i);
    expect(grandTotalEl).toBeTruthy();

    // Executive footer
    expect(screen.getByText(/This is a computer-generated statement from Cenvora ERP/i)).toBeTruthy();
  });
});
