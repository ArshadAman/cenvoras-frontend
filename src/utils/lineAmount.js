/**
 * Line Amount = (Unit Price × Qty) − Disc%
 * Tax is NOT included in line amount (shown separately / in document totals).
 */
export function calculateLineAmount(quantity, price, discountPercent = 0) {
  const qty = Number(quantity) || 0;
  const unitPrice = Number(price) || 0;
  const disc = Number(discountPercent) || 0;
  const base = qty * unitPrice;
  const discAmt = (base * disc) / 100;
  return Number((base - discAmt).toFixed(2));
}

export function calculateLineTax(quantity, price, discountPercent = 0, taxPercent = 0) {
  const taxable = calculateLineAmount(quantity, price, discountPercent);
  const tax = Number(taxPercent) || 0;
  return Number(((taxable * tax) / 100).toFixed(2));
}

export function calculateLineGross(quantity, price, discountPercent = 0, taxPercent = 0) {
  return Number(
    (
      calculateLineAmount(quantity, price, discountPercent) +
      calculateLineTax(quantity, price, discountPercent, taxPercent)
    ).toFixed(2)
  );
}

/**
 * Round half up to the nearest whole rupee using integer paise
 * (matches backend billing/round_off.py compute_round_off).
 */
export function computeRoundedTotal(amount) {
  const paise = Math.round(Number(amount || 0) * 100);
  const sign = paise < 0 ? -1 : 1;
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  return sign * (abs - rupees * 100 >= 50 ? rupees + 1 : rupees);
}

/**
 * Split total intra-state GST into whole-paise CGST and SGST so cgst + sgst === taxTotal.
 */
export function splitIntraStateTax(taxTotal) {
  const totalPaise = Math.round(Number(taxTotal || 0) * 100);
  const cgstPaise = Math.trunc(totalPaise / 2);
  const sgstPaise = totalPaise - cgstPaise;
  return {
    cgst: cgstPaise / 100,
    sgst: sgstPaise / 100,
  };
}

/**
 * Compute consistent 2-decimal invoice totals for print/PDF templates.
 * - Accumulates per-line taxable and tax rounded to 2 decimal places (matching backend DocumentSyncService).
 * - Splits intra-state GST into whole-paise CGST & SGST (never 3 decimals like .255).
 * - When round-off is applied (round_off !== 0 or apply_round_off === true), guarantees
 *   finalTotal is a whole rupee (.00) and roundOff reconciles unroundedTotal -> finalTotal.
 */
export function calculateInvoiceTotals(items = [], invoice = {}) {
  const validItems = (items || []).filter((item) => item && item.row_type !== 'note');

  const subtotalPaise = validItems.reduce((sum, item) => {
    return sum + Math.round(calculateLineAmount(item.quantity, item.price, item.discount) * 100);
  }, 0);

  const taxPaise = validItems.reduce((sum, item) => {
    return sum + Math.round(calculateLineTax(item.quantity, item.price, item.discount, item.tax) * 100);
  }, 0);

  const subtotal = subtotalPaise / 100;
  const taxTotal = taxPaise / 100;
  const unroundedTotal = (subtotalPaise + taxPaise) / 100;
  const { cgst, sgst } = splitIntraStateTax(taxTotal);

  const rawRoundOff = parseFloat(invoice?.round_off || 0) || 0;
  const isRoundOffApplied = rawRoundOff !== 0 || invoice?.apply_round_off === true;

  let finalTotal;
  let roundOff;

  if (isRoundOffApplied) {
    const baseAmount = validItems.length > 0
      ? unroundedTotal
      : (invoice?.total_amount != null ? parseFloat(invoice.total_amount) : 0);
    finalTotal = computeRoundedTotal(baseAmount);
    roundOff = validItems.length > 0
      ? Number((finalTotal - unroundedTotal).toFixed(2))
      : Number(rawRoundOff.toFixed(2));
  } else {
    finalTotal = invoice?.total_amount != null
      ? Number(parseFloat(invoice.total_amount).toFixed(2))
      : unroundedTotal;
    roundOff = 0;
  }

  return {
    subtotal,
    taxTotal,
    cgst,
    sgst,
    unroundedTotal,
    roundOff,
    finalTotal,
  };
}
