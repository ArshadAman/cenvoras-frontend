/**
 * Computes verifiable business setup & operational readiness milestones.
 * Grounded in Endowed Progress & Goal-Gradient principles without fabricated points.
 */
export function computeSetupReadiness({ profile, metrics, salesList = [], purchasesList = [] } = {}) {
  const p = profile || {};
  const m = metrics || {};

  const hasBusinessIdentity = Boolean(
    (p.business_name || p.parent_business_name || '').trim() &&
    (p.state || '').trim()
  );

  const hasTaxStatus = Boolean(
    p.gst_status_set ||
    (p.gstin || '').trim() ||
    (p.trn || '').trim()
  );

  const hasBankDetails = Boolean(
    (p.bank_name || '').trim() ||
    (p.bank_account_number || '').trim() ||
    (p.bank_upi_id || '').trim() ||
    (Array.isArray(p.bank_accounts) && p.bank_accounts.some(
      (acc) => (acc?.bank_name || acc?.account_number || acc?.upi_id || '').trim()
    ))
  );

  const hasFirstSale = Boolean(
    Number(m.total_sales || 0) > 0 ||
    (Array.isArray(salesList) && salesList.length > 0)
  );

  const hasInventoryOrPurchase = Boolean(
    Number(m.total_purchases || 0) > 0 ||
    Number(m.total_inventory_value || 0) > 0 ||
    (Array.isArray(purchasesList) && purchasesList.length > 0)
  );

  const steps = [
    {
      id: 'account',
      label: 'Workspace active',
      description: 'Cenvora ledger & fiscal environment initialized',
      completed: true,
      route: '/dashboard',
      actionLabel: 'Active',
    },
    {
      id: 'business_profile',
      label: 'Business identity & state',
      description: 'Required for intra/inter-state IGST vs CGST/SGST place of supply',
      completed: hasBusinessIdentity,
      route: '/profile',
      actionLabel: 'Configure Profile',
    },
    {
      id: 'tax_status',
      label: 'GST / tax registration status',
      description: 'Confirm Regular, Composition, or Unregistered tax rules',
      completed: hasTaxStatus,
      route: '/profile',
      actionLabel: 'Confirm Tax Status',
    },
    {
      id: 'bank_details',
      label: 'Invoice bank & UPI details',
      description: 'Print payment & NEFT/UPI details automatically on tax invoices',
      completed: hasBankDetails,
      route: '/profile',
      actionLabel: 'Add Bank Details',
    },
    {
      id: 'first_sale',
      label: 'First sales invoice recorded',
      description: 'Issue a tax invoice or bill of supply to start revenue tracking',
      completed: hasFirstSale,
      route: '/sales',
      actionLabel: 'Record Sale',
    },
    {
      id: 'first_purchase_or_stock',
      label: 'Opening stock or purchase bill',
      description: 'Track inventory valuation and claim eligible Input Tax Credit',
      completed: hasInventoryOrPurchase,
      route: '/purchase',
      actionLabel: 'Record Purchase',
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const percent = Math.round((completedCount / totalCount) * 100);
  const nextStep = steps.find((s) => !s.completed) || null;

  return {
    steps,
    completedCount,
    totalCount,
    remainingCount: totalCount - completedCount,
    percent,
    nextStep,
    isComplete: completedCount === totalCount,
  };
}
