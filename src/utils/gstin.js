/** Indian GSTIN format: 2 digit state + 10 char PAN + entity + Z + checksum */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const GSTIN_INVALID_MSG = 'Invalid GSTIN format';

export function normalizeGstin(value) {
  return String(value || '').trim().toUpperCase();
}

export function isValidGstin(value) {
  const gstin = normalizeGstin(value);
  if (!gstin) return true; // empty allowed where optional
  return GSTIN_REGEX.test(gstin);
}

/** Yup helper: optional GSTIN that must match format when provided */
export function yupGstinOptional(Yup) {
  return Yup.string()
    .nullable()
    .transform((v) => (v == null || v === '' ? null : normalizeGstin(v)))
    .test('gstin-format', GSTIN_INVALID_MSG, (value) => isValidGstin(value));
}

/** Yup helper: required GSTIN with format check */
export function yupGstinRequired(Yup, requiredMsg = 'GSTIN is required') {
  return Yup.string()
    .required(requiredMsg)
    .transform((v) => normalizeGstin(v))
    .matches(GSTIN_REGEX, GSTIN_INVALID_MSG)
    .length(15, 'GSTIN must be 15 characters');
}
