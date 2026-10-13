import { getGSTStateCode } from './indiaData';

/**
 * GST Tax Type Utility
 *
 * CA AUDIT (Issue 2):
 *  - Derive seller state from 2-digit prefix of seller GSTIN first.
 *  - Compare with place of supply (or customer state).
 *  - If they match -> CGST + SGST (intra-state).
 *  - If they differ -> IGST (inter-state).
 *
 * Returns: 'igst' | 'cgst_sgst'
 */
export function getSellerStateCode(businessInfo = {}) {
  const gstin = businessInfo.gstin || '';
  if (typeof gstin === 'string' && gstin.trim().length >= 2) {
    const prefix = gstin.trim().substring(0, 2);
    if (/^\d{2}$/.test(prefix)) {
      return prefix;
    }
  }
  return getGSTStateCode(businessInfo.state) || '21';
}

export function getTaxType(invoice = {}, businessInfo = {}) {
  const sellerStateCode = getSellerStateCode(businessInfo);
  const pos = invoice.place_of_supply || invoice.customer_details?.state || invoice.customer?.state || null;

  // If place of supply is not set, default to CGST/SGST
  if (!pos) return 'cgst_sgst';

  let posCode = null;
  const posStr = String(pos).trim();
  if (posStr.length === 15 && /^\d{2}/.test(posStr)) {
    posCode = posStr.substring(0, 2);
  } else {
    posCode = getGSTStateCode(posStr);
  }

  if (!posCode) return 'cgst_sgst';

  // Inter-state -> IGST, Intra-state -> CGST + SGST
  if (sellerStateCode !== posCode) return 'igst';

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
