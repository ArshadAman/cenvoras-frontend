import { describe, it, expect } from 'vitest';
import { computeSetupReadiness } from './readinessProgress';

describe('computeSetupReadiness', () => {
  it('provides endowed progress (1/6) for a brand new workspace', () => {
    const result = computeSetupReadiness({});
    expect(result.completedCount).toBe(1);
    expect(result.totalCount).toBe(6);
    expect(result.remainingCount).toBe(5);
    expect(result.percent).toBe(17);
    expect(result.isComplete).toBe(false);
    expect(result.nextStep?.id).toBe('business_profile');
  });

  it('marks business_profile, tax_status, and bank_details when profile is configured', () => {
    const result = computeSetupReadiness({
      profile: {
        business_name: 'Cenvora Traders',
        state: 'KA',
        gst_status_set: true,
        bank_upi_id: 'cenvora@upi',
      },
      metrics: { total_sales: 0, total_purchases: 0, total_inventory_value: 0 },
    });
    expect(result.completedCount).toBe(4);
    expect(result.remainingCount).toBe(2);
    expect(result.percent).toBe(67);
    expect(result.nextStep?.id).toBe('first_sale');
  });

  it('reaches 100% completion when sales and inventory/purchases are recorded', () => {
    const result = computeSetupReadiness({
      profile: {
        business_name: 'Cenvora Traders',
        state: 'MH',
        gstin: '27ABCDE1234F1Z5',
        bank_accounts: [{ bank_name: 'HDFC', account_number: '123456' }],
      },
      metrics: {
        total_sales: 12500,
        total_inventory_value: 45000,
      },
    });
    expect(result.completedCount).toBe(6);
    expect(result.remainingCount).toBe(0);
    expect(result.percent).toBe(100);
    expect(result.isComplete).toBe(true);
    expect(result.nextStep).toBeNull();
  });
});
