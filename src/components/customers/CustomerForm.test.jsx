import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api/customers', () => ({
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
}));
vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { createCustomer, updateCustomer } from '../../api/customers';
import CustomerForm from './CustomerForm';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderWithQuery(ui) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('CustomerForm', () => {
  it('prefills initialName and submits deduplicated meta.shipping_addresses', async () => {
    const savedCustomer = {
      id: 'cust-1',
      name: 'Acme Biotech',
      meta: { shipping_addresses: ['Branch B, Cuttack', 'Branch A, Puri'] },
    };
    createCustomer.mockResolvedValue({ data: savedCustomer });
    const onSaved = vi.fn();
    const onClose = vi.fn();

    renderWithQuery(
      <CustomerForm
        isOpen
        onClose={onClose}
        initialName="Acme Biotech"
        onSaved={onSaved}
      />
    );

    const nameInput = screen.getByPlaceholderText('e.g. Acme Corp');
    expect(nameInput.value).toBe('Acme Biotech');

    // Add two shipping addresses, promote second to primary, submit
    const addShippingBtn = screen.getByRole('button', { name: /Add Shipping Address/i });
    fireEvent.click(addShippingBtn);
    fireEvent.click(addShippingBtn);

    const shippingBoxes = screen.getAllByPlaceholderText(/Shipping address #/i);
    fireEvent.change(shippingBoxes[0], { target: { value: 'Branch A, Puri' } });
    fireEvent.change(shippingBoxes[1], { target: { value: 'Branch B, Cuttack' } });

    const promoteBtns = screen.getAllByRole('button', { name: /Make Primary/i });
    fireEvent.click(promoteBtns[0]);

    fireEvent.click(screen.getByRole('button', { name: /Create Customer/i }));

    await waitFor(() => expect(createCustomer).toHaveBeenCalledTimes(1));
    const submittedPayload = createCustomer.mock.calls[0][0];
    expect(submittedPayload.name).toBe('Acme Biotech');
    expect(submittedPayload.meta.shipping_addresses).toEqual([
      'Branch B, Cuttack',
      'Branch A, Puri',
    ]);
    expect(onSaved).toHaveBeenCalledWith(savedCustomer);
  });

  it('edits and removes saved shipping addresses for existing customer', async () => {
    updateCustomer.mockResolvedValue({
      data: { id: 'cust-2', name: 'Existing Lab', meta: { shipping_addresses: [] } },
    });

    renderWithQuery(
      <CustomerForm
        isOpen
        onClose={() => {}}
        editData={{
          id: 'cust-2',
          name: 'Existing Lab',
          address: 'Main Campus',
          meta: { shipping_addresses: ['Old Ship-To Address'] },
        }}
      />
    );

    expect(screen.getByDisplayValue('Old Ship-To Address')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    fireEvent.click(screen.getByRole('button', { name: /Update Customer/i }));

    await waitFor(() => expect(updateCustomer).toHaveBeenCalledTimes(1));
    expect(updateCustomer.mock.calls[0][1].meta.shipping_addresses).toEqual([]);
  });
});
