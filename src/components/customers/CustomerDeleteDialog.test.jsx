import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CustomerDeleteDialog from './CustomerDeleteDialog';
import * as customersApi from '../../api/customers';

vi.mock('../../api/customers', () => ({
  deleteCustomer: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

describe('CustomerDeleteDialog', () => {
  it('renders confirmation text with customer name', () => {
    const customer = { id: 'c-101', name: 'JITM Again' };
    render(
      <QueryClientProvider client={createQueryClient()}>
        <CustomerDeleteDialog isOpen={true} onClose={() => {}} customer={customer} />
      </QueryClientProvider>
    );

    expect(screen.getByText(/"JITM Again"/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Delete/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeTruthy();
  });

  it('renders blocking documents list when deletion returns 400 with blocking_documents', async () => {
    const customer = { id: 'c-101', name: 'JITM Again' };
    const errorResponse = {
      response: {
        status: 400,
        data: {
          success: false,
          message: "Cannot delete customer 'JITM Again'. Linked to: Sales Order 'SO-001'.",
          blocking_documents: [
            {
              type: 'Sales Order',
              identifier: 'SO-001',
              id: 'so-1',
              status: 'new',
              route: '/sales-orders',
            },
            {
              type: 'Quotation',
              identifier: 'QT-002',
              id: 'q-2',
              status: 'draft',
              route: '/quotations',
            },
          ],
        },
      },
    };

    vi.spyOn(customersApi, 'deleteCustomer').mockRejectedValue(errorResponse);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <CustomerDeleteDialog isOpen={true} onClose={() => {}} customer={customer} />
      </QueryClientProvider>
    );

    const deleteBtn = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(deleteBtn);

    // Verify blocking documents heading and items appear
    const blockingHeader = await screen.findByText(/linked document\(s\) detected/i);
    expect(blockingHeader).toBeTruthy();
    expect(screen.getByText('SO-001')).toBeTruthy();
    expect(screen.getByText('Sales Order')).toBeTruthy();
    expect(screen.getByText('QT-002')).toBeTruthy();
    expect(screen.getByText('Quotation')).toBeTruthy();
  });
});
