/**
 * Deterministic Indian GST monthly statutory filing cadence helper.
 * Provides calm, contextual orientation without streak-trap guilt or artificial urgency.
 *
 * Key statutory monthly dates (India GST):
 * - 11th: GSTR-1 due (outward supplies)
 * - 14th: GSTR-2B auto-drafted (ITC reconciliation window opens)
 * - 20th: GSTR-3B due (monthly summary & net tax payment)
 */
export function getGstFilingCadence(todayDateStr) {
  if (!todayDateStr || typeof todayDateStr !== 'string') {
    return null;
  }

  const parts = todayDateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return null;
  }

  const day = parts[2];

  if (day <= 11) {
    const daysLeft = 11 - day;
    return {
      phase: 'gstr1',
      title: daysLeft === 0 ? 'GSTR-1 due today (11th)' : `GSTR-1 due in ${daysLeft}d (11th)`,
      subtitle: 'Verify outward B2B/B2C invoices & HSN summary before export',
      tone: daysLeft <= 2 ? 'warning' : 'info',
      route: '/reports/tax-register?tab=gstr1',
      actionLabel: 'Review GSTR-1',
    };
  }

  if (day <= 20) {
    const daysLeft = 20 - day;
    const is2BReady = day >= 14;
    return {
      phase: 'gstr3b',
      title: daysLeft === 0 ? 'GSTR-3B due today (20th)' : `GSTR-3B due in ${daysLeft}d (20th)`,
      subtitle: is2BReady
        ? 'GSTR-2B window open — reconcile purchase ITC before filing 3B'
        : 'Prepare purchase register & ITC eligibility ahead of 2B generation (14th)',
      tone: daysLeft <= 2 ? 'warning' : 'info',
      route: is2BReady ? '/reports/gst-shield' : '/reports/gstr-3b',
      actionLabel: is2BReady ? 'Reconcile 2B' : 'View 3B',
    };
  }

  return {
    phase: 'bookkeeping',
    title: 'Monthly GST filings settled',
    subtitle: 'Keep daily sales, purchase bills, and credit notes current for next cycle',
    tone: 'success',
    route: '/reports/gst-dashboard',
    actionLabel: 'GST Summary',
  };
}
