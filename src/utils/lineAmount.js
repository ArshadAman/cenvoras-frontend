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
