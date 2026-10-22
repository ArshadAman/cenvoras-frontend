import { turnoverGauge } from './turnoverGauge.js';

const n = (v) => {
  const x = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(x) ? x : 0;
};

const inr = (v) => `₹${Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export function gstShieldTips({ priorLabel = 'last FY', priorTurnover = 0, compositionLimit = 0 } = {}) {
  return {
    composition: 'Composition scheme: pay GST at a flat low rate with simpler quarterly returns. '
      + 'Allowed if last FY turnover ≤ ₹1.5 Cr (₹75L in some states, ₹50L for services). '
      + `Your limit: ${inr(compositionLimit)}. Your ${priorLabel} turnover: ${inr(priorTurnover)}.`,
    qrmp: 'Quarterly filing (QRMP): file GSTR-1/3B every quarter instead of monthly and pay tax monthly via PMT-06. '
      + `Allowed up to ₹5 Cr turnover in the last FY. Your ${priorLabel} turnover: ${inr(priorTurnover)}.`,
    hsn: 'HSN codes on invoices: 4 digits if last FY turnover ≤ ₹5 Cr, 6 digits above.',
    turnover: "Last financial year's sales (taxable value, excluding GST, net of credit notes). Used to check the limits above.",
    collected: 'Collected: GST charged on your sales this period, net of credit notes.',
    itc: 'ITC: GST paid on purchase bills you can claim.',
    net: 'Net payable/credit: Collected minus ITC. Positive is tax to pay; negative is credit carried forward.',
    period: 'Month: the current return period. FY: 1 April to today.',
  };
}

/** View model for the GST Shield card (backend: billing.gst_thresholds.gst_shield). */
export function gstShieldView(gst = {}) {
  const registered = !!gst.registered;
  if (!registered) {
    const threshold = n(gst.registration_threshold) || n(gst.turnover_limit) || 2000000;
    const gauge = turnoverGauge(gst.fy_turnover ?? gst.total_turnover, threshold);
    return {
      registered,
      turnover: n(gst.fy_turnover ?? gst.total_turnover),
      threshold,
      basis: gst.threshold_basis || '',
      gauge,
      liable: !!gst.liable_to_register,
      alertText: gst.alert_text || null,
      interstateWarning: gst.compulsory_registration_interstate
        ? 'Inter-State supply of goods found: GST registration is compulsory regardless of turnover.'
        : null,
      showTaxFigures: false,
    };
  }
  const outputTax = n(gst.output_tax);
  const itc = n(gst.itc);
  // Net is always Collected − ITC; derive it here so the card can never disagree with its own figures.
  const net = Math.round((outputTax - itc) * 100) / 100;
  return {
    registered,
    priorTurnover: n(gst.prior_fy_turnover),
    priorLabel: gst.prior_fy_label || 'Prior FY',
    fyTurnover: n(gst.fy_turnover),
    checks: [
      { key: 'composition', label: 'Composition', limit: n(gst.composition_limit), ok: !!gst.composition_eligible },
      { key: 'qrmp', label: 'QRMP', limit: n(gst.qrmp_limit), ok: !!gst.qrmp_eligible },
    ],
    hsnDigits: gst.hsn_digits || 4,
    tips: gstShieldTips({ priorLabel: gst.prior_fy_label || 'last FY', priorTurnover: n(gst.prior_fy_turnover), compositionLimit: n(gst.composition_limit) }),
    eInvoiceWarning: gst.e_invoice_warning || null,
    showTaxFigures: true,
    outputTax,
    itc,
    net,
    netLabel: net > 0 ? 'Net payable' : net < 0 ? 'Net credit' : 'Net',
    collectedNote: outputTax < 0
      ? 'Collected is negative: credit notes issued in this period exceed the GST on invoices in this period.'
      : null,
    showPaid: !!gst.paid_available,
    safeItc: n(gst.safe_itc),
    atRiskItc: n(gst.at_risk_itc),
  };
}
