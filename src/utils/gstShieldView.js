import { turnoverGauge } from './turnoverGauge.js';

const n = (v) => {
  const x = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(x) ? x : 0;
};

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
