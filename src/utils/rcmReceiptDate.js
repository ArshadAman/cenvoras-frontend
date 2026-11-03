// Rudra (#219): 'Date of receipt of goods/services' on reverse-charge purchase bills.
// Defaults to the bill date and follows it until the user edits the receipt date.

export function initialReceiptDate(bill, billDate) {
  return bill?.rcm_receipt_date || billDate || '';
}

// A saved receipt date that differs from the bill date counts as user-edited.
export function initialReceiptTouched(bill) {
  return !!(bill?.rcm_receipt_date && bill.rcm_receipt_date !== bill.bill_date);
}

export function receiptDateAfterBillDateChange(newBillDate, currentReceipt, touched) {
  return touched ? currentReceipt : newBillDate;
}

export function receiptDatePayload(values) {
  return values?.is_reverse_charge ? (values.rcm_receipt_date || values.bill_date || null) : null;
}

// error.details from api/purchase.js: { rcm_receipt_date: ["..."] } or a nested { details: {...} }.
export function receiptDateError(details) {
  const src = details && typeof details === 'object' && details.details && typeof details.details === 'object'
    ? details.details : details;
  const v = src && typeof src === 'object' ? src.rcm_receipt_date : null;
  const msg = Array.isArray(v) ? v[0] : v;
  return typeof msg === 'string' && msg ? msg : null;
}
