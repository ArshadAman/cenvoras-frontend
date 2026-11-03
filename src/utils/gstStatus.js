// UAT P1 #13 rework (Rudra CA): company GST status -> document title, tax lock, returns.
// Backend (UserProfileSerializer) sends gst_status, gst_status_set, document_title,
// document_declaration, tax_locked and gst_returns_available. Until a status is stored
// (gst_status_set false) nothing changes from today's behaviour.
export const GST_STATUS_OPTIONS = [
  { value: 'regular', label: 'Regular' },
  { value: 'composition', label: 'Composition' },
  { value: 'unregistered', label: 'Not registered' },
];

export const COMPOSITION_DECLARATION =
  'composition taxable person, not eligible to collect tax on supplies';

export function storedGstStatus(profile) {
  return profile && profile.gst_status_set ? profile.gst_status || null : null;
}

// Title for a sales invoice. Composition -> BILL OF SUPPLY; Not registered -> INVOICE (never
// "Tax Invoice"); else the custom title or TAX INVOICE. Other document titles passed in the same
// slot (QUOTATION, PROFORMA INVOICE, DELIVERY CHALLAN, ...) are left alone.
const INVOICE_TITLE_RE = /^\s*(tax\s+)?invoice\s*$/i;
export function documentTitle(customTitle, profile) {
  const st = storedGstStatus(profile);
  const isInvoiceTitle = !customTitle || INVOICE_TITLE_RE.test(customTitle) || /tax\s+invoice/i.test(customTitle);
  if (isInvoiceTitle && st === 'composition') return 'BILL OF SUPPLY';
  if (isInvoiceTitle && st === 'unregistered') return 'INVOICE';
  return customTitle || 'TAX INVOICE';
}

export function documentDeclaration(profile) {
  return storedGstStatus(profile) === 'composition'
    ? profile.document_declaration || COMPOSITION_DECLARATION
    : null;
}

export function taxLocked(profile) {
  const st = storedGstStatus(profile);
  return st === 'composition' || st === 'unregistered';
}

export function gstReturnsAvailable(profile) {
  const st = storedGstStatus(profile);
  return st === null || st === 'regular';
}

// GSTR-1 / GSTR-3B screens (hidden when returns aren't available).
export function isGstReturnLink(link) {
  return /gstr-3b|tab=gstr1|^\/reports\/tax-register$/.test(String(link || ''));
}

// Rudra (#216): admin banner until the status is confirmed (null, or filled by the migration).
export function needsGstStatusConfirmation(profile) {
  return !!(profile && profile.gst_status_needs_confirmation);
}
