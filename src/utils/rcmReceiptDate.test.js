import { describe, it, expect } from 'vitest';
import { initialReceiptDate, initialReceiptTouched, receiptDateAfterBillDateChange,
  receiptDatePayload, receiptDateError, hasReverseCharge } from './rcmReceiptDate';

describe('RCM receipt date', () => {
  it('defaults to the bill date and loads a saved value', () => {
    expect(initialReceiptDate(null, '2026-08-05')).toBe('2026-08-05');
    expect(initialReceiptDate({ rcm_receipt_date: '2026-07-28' }, '2026-08-05')).toBe('2026-07-28');
  });
  it('follows bill-date changes until edited', () => {
    expect(receiptDateAfterBillDateChange('2026-08-09', '2026-08-05', false)).toBe('2026-08-09');
    expect(receiptDateAfterBillDateChange('2026-08-09', '2026-07-28', true)).toBe('2026-07-28');
    expect(initialReceiptTouched({ bill_date: '2026-08-05', rcm_receipt_date: '2026-07-28' })).toBe(true);
    expect(initialReceiptTouched({ bill_date: '2026-08-05', rcm_receipt_date: '2026-08-05' })).toBe(false);
    expect(initialReceiptTouched(null)).toBe(false);
  });
  it('is sent only for reverse-charge bills', () => {
    expect(receiptDatePayload({ is_reverse_charge: true, rcm_receipt_date: '2026-07-28', bill_date: '2026-08-05' })).toBe('2026-07-28');
    expect(receiptDatePayload({ is_reverse_charge: false, rcm_receipt_date: '2026-07-28' })).toBeNull();
  });
  it('reads backend field errors', () => {
    expect(receiptDateError({ rcm_receipt_date: ['Enter a valid date.'] })).toBe('Enter a valid date.');
    expect(receiptDateError({ details: { rcm_receipt_date: ['Bad'] } })).toBe('Bad');
    expect(receiptDateError({ bill_number: ['x'] })).toBeNull();
  });
  it('treats a bill with any reverse-charge line as reverse charge', () => {
    const v = { is_reverse_charge: false, bill_date: '2026-08-05', rcm_receipt_date: '', items: [{ is_rcm: false }, { is_rcm: true }] };
    expect(hasReverseCharge(v)).toBe(true);
    expect(receiptDatePayload(v)).toBe('2026-08-05');
    expect(hasReverseCharge({ items: [{ is_rcm: false }] })).toBe(false);
  });
});
