/** Shared HSN/SAC messages — must match billing.gst_utils on the backend. */
export const HSN_REQUIRED_MSG = 'HSN/SAC code is required.';
export const HSN_DIGITS_MSG =
  'HSN/SAC code must be at least 4 digits (6 digits if turnover > ₹5 Cr).';

export function validateHsnSac(value, { minDigits = 4 } = {}) {
  const hsn = String(value || '').trim();
  if (!hsn || hsn.toUpperCase() === 'N/A') {
    return HSN_REQUIRED_MSG;
  }
  const digits = hsn.replace(/\D/g, '');
  if (digits.length < minDigits) {
    return HSN_DIGITS_MSG;
  }
  return null;
}
