import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import QuotationConvertModal from './QuotationConvertModal';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('QuotationConvertModal Rate & Discount Flow', () => {
  const sampleQuotation = {
    id: 'quot-101',
    quotation_number: 'KE-026/153',
    po_number: 'PO-2026-9811',
    po_date: '2026-11-18',
    items: [
      {
        id: 'item-1',
        product_name: 'Turbidity standard solution 10 NTU',
        quantity: 1,
        price: 8510,
        discount: 10, // 10% quote discount -> Quoted rate should be 7659.00
        tax: 5,
        unit: 'pcs',
        approval_status: 'approved',
        converted_to_order: false,
      },
      {
        id: 'item-2',
        product_name: 'Nitrite (NO2-) AAS standard solution 1000 ppm in H2O',
        quantity: 1,
        price: 3487.50,
        discount: 0,
        tax: 5,
        unit: 'pcs',
        approval_status: 'approved',
        converted_to_order: false,
      },
    ],
  };

  it('displays the final discounted rate quoted instead of un-discounted catalog price', () => {
    render(
      <QuotationConvertModal
        isOpen={true}
        quotation={sampleQuotation}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isSubmitting={false}
      />
    );

    // Item 1: Quoted rate is 7659.00 (from base 8510 with 10% discount)
    expect(screen.getByText(/Rate:\s*₹7,659\.00/)).toBeTruthy();
    expect(screen.getByText(/₹8,510\.00/).className).toContain('line-through');
    expect(screen.getByText(/−10%/)).toBeTruthy();

    // Item 2: Un-discounted quote item
    expect(screen.getByText(/Rate:\s*₹3,487\.50/)).toBeTruthy();

    // Initial Line Totals (with 0% extra discount):
    // Item 1: 7659.00 * 1.05 = 8041.95
    expect(screen.getByText('₹8,041.95')).toBeTruthy();
    // Item 2: 3487.50 * 1.05 = 3661.88
    expect(screen.getByText('₹3,661.88')).toBeTruthy();

    // Order Value: 8041.95 + 3661.88 = 11,703.83
    expect(screen.getByText('₹11,703.83')).toBeTruthy();
  });

  it('applies Extra Discount from the quoted rate and submits correct payload', () => {
    const onConfirm = vi.fn();
    render(
      <QuotationConvertModal
        isOpen={true}
        quotation={sampleQuotation}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        isSubmitting={false}
      />
    );

    // Find the Create Order button and submit
    const submitBtn = screen.getByRole('button', { name: /Create Order/i });
    fireEvent.click(submitBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const payload = onConfirm.mock.calls[0][0];

    expect(payload.po_number).toBe('PO-2026-9811');
    expect(payload.items).toHaveLength(2);

    // Item 1 price submitted should be the discounted quoted rate (7659) with 0% extra discount
    const item1Payload = payload.items.find((it) => it.id === 'item-1');
    expect(item1Payload.price).toBe(7659);
    expect(item1Payload.discount).toBe(0);
    expect(item1Payload.quantity).toBe(1);

    // Item 2 price submitted should be 3487.5 with 0% extra discount
    const item2Payload = payload.items.find((it) => it.id === 'item-2');
    expect(item2Payload.price).toBe(3487.5);
    expect(item2Payload.discount).toBe(0);
  });

  it('correctly recalculates line total when extra discount is added', () => {
    render(
      <QuotationConvertModal
        isOpen={true}
        quotation={sampleQuotation}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isSubmitting={false}
      />
    );

    // Apply bulk extra discount of 10%
    const extraDiscInput = screen.getByPlaceholderText('0');
    fireEvent.change(extraDiscInput, { target: { value: '10' } });

    const applyBulkBtn = screen.getByRole('button', { name: /Apply to Selected/i });
    fireEvent.click(applyBulkBtn);

    // Item 1: 7659 * (1 - 0.10) * 1.05 = 6893.10 * 1.05 = 7237.76
    expect(screen.getByText('₹7,237.76')).toBeTruthy();
  });

  it('updates line total and order value when quantity changes', () => {
    render(
      <QuotationConvertModal
        isOpen={true}
        quotation={sampleQuotation}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isSubmitting={false}
      />
    );

    // Change quantity of Item 1 from 1 to 2
    const qtyInputs = screen.getAllByRole('spinbutton');
    // First input in toolbar is bulkDiscount; items have qty and disc inputs
    // Find the qty input that has value "1"
    const item1Qty = qtyInputs.find((input) => input.value === '1');
    expect(item1Qty).toBeTruthy();
    fireEvent.change(item1Qty, { target: { value: '2' } });

    // Item 1 with Qty 2: 2 * 7659.00 * 1.05 = 16,083.90
    expect(screen.getByText('₹16,083.90')).toBeTruthy();
  });
});
