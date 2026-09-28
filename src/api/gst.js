import api from './api';

// ==================== GST COMPLIANCE ====================

export const getHSNSummary = (from, to, type = 'sales') =>
  api.get(`/billing/gst/hsn-summary/?from=${from}&to=${to}&type=${type}`).then(res => res.data);

export const getTaxRegister = (from, to, type = 'sales') =>
  api.get(`/billing/gst/tax-register/?from=${from}&to=${to}&type=${type}`).then(res => res.data);

export const getTaxRegisterInvoiceDetail = (invoiceId, type = 'sales') =>
  api.get(`/billing/gst/tax-register/${invoiceId}/?type=${type}`).then(res => res.data);

export const getGSTR1Export = (from, to) =>
  api.get(`/billing/gst/gstr1-export/?from=${from}&to=${to}`).then(res => res.data);

export const generateEInvoice = (invoiceId) =>
  api.post('/billing/gst/e-invoice/', { invoice_id: invoiceId }).then(res => res.data);

export const generateEWayBill = (data) =>
  api.post('/billing/gst/e-way-bill/', data).then(res => res.data);

// ==================== GST SHIELD & GSTR-2B RECONCILIATION ====================

export const uploadAndReconcileGSTR2B = (formData) =>
  api.post('/billing/gst/reconcile-2b/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);

export const getReconciliationSummary = () =>
  api.get('/billing/gst/reconciliation-summary/').then(res => res.data);

export const toggleBillWithholding = (billId, override) =>
  api.post('/billing/gst/toggle-withholding/', { bill_id: billId, override }).then(res => res.data);

export const manualMatchRecord = (recordId, billId) =>
  api.post('/billing/gst/manual-match/', { record_id: recordId, bill_id: billId }).then(res => res.data);

export const generateLegalNotice = (vendorId, deadlineDays = 7, period = 'Current FY') =>
  api.post('/billing/gst/generate-legal-notice/', { vendor_id: vendorId, deadline_days: deadlineDays, period }).then(res => res.data);

export const downloadCAAuditPack = async (from, to, exportFormat = 'xlsx', reportType = 'sales') => {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  if (exportFormat) params.append('export', exportFormat);
  if (reportType) params.append('type', reportType);

  const response = await api.get(`/billing/gst/ca-audit-pack/?${params.toString()}`, {
    responseType: 'blob'
  });

  const mimeMap = {
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    json: 'application/json'
  };

  const blob = new Blob([response.data], { type: mimeMap[exportFormat] || 'application/octet-stream' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CA_Audit_Pack_${from || 'start'}_to_${to || 'now'}.${exportFormat}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// ==================== RETURNS ====================

export const getCreditNotes = () =>
  api.get('/billing/credit-notes/').then(res => res.data);

export const createCreditNote = (data) =>
  api.post('/billing/credit-notes/', data).then(res => res.data);

export const deleteCreditNote = (id) =>
  api.delete(`/billing/credit-notes/${id}/`).then(res => res.data);

export const getDebitNotes = () =>
  api.get('/billing/debit-notes/').then(res => res.data);

export const createDebitNote = (data) =>
  api.post('/billing/debit-notes/', data).then(res => res.data);

export const deleteDebitNote = (id) =>
  api.delete(`/billing/debit-notes/${id}/`).then(res => res.data);

// ==================== FINANCIAL STATEMENTS ====================

export const getProfitLossStatement = (from, to) => {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  return api.get(`/ledger/profit-loss/?${params}`).then(res => res.data);
};

export const getBalanceSheet = (asOf) => {
  const params = new URLSearchParams();
  if (asOf) params.append('as_of', asOf);
  return api.get(`/ledger/balance-sheet/?${params}`).then(res => res.data);
};

export const getBalanceSheetAccountDetail = (accountId, asOf) => {
  const params = new URLSearchParams();
  if (asOf) params.append('as_of', asOf);
  return api.get(`/ledger/balance-sheet/account/${accountId}/?${params}`).then(res => res.data);
};

export const getCashbook = (from, to) => {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  return api.get(`/ledger/cashbook/?${params}`).then(res => res.data);
};
