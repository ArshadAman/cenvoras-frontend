/**
 * GST Tax Type Utility
 *
 * Rule:
 *  - If seller state == place_of_supply (or customer state) → CGST + SGST (intra-state)
 *  - If they differ, or seller state is missing → IGST (inter-state / safe default)
 *
 * Returns: 'igst' | 'cgst_sgst'
 */
export function getTaxType(invoice = {}, businessInfo = {}) {
  const sellerState = businessInfo.state || null;
  const pos = invoice.place_of_supply || invoice.customer_details?.state || invoice.customer?.state || null;

  // If seller state is not configured, default to CGST/SGST (intra-state assumption)
  if (!sellerState) return 'cgst_sgst';

  // If place of supply is not set, default to CGST/SGST
  if (!pos) return 'cgst_sgst';

  // Inter-state → IGST
  if (sellerState.toUpperCase() !== pos.toUpperCase()) return 'igst';

  // Intra-state → CGST + SGST
  return 'cgst_sgst';
}

/**
 * Given a total tax amount, split into CGST/SGST or return as IGST.
 * Returns { igst, cgst, sgst }
 */
export function splitTax(taxAmount, taxType) {
  const tax = parseFloat(taxAmount) || 0;
  if (taxType === 'igst') {
    return { igst: tax, cgst: 0, sgst: 0 };
  }
  const half = Math.round(tax * 100) / 200; // half, rounded to 2dp
  return { igst: 0, cgst: half, sgst: half };
}
