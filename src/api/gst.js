import api from './api';

// ==================== GST COMPLIANCE ====================

export const getHSNSummary = (from, to, type = 'sales') =>
  api.get(`/billing/gst/hsn-summary/?from=${from}&to=${to}&type=${type}`).then(res => res.data);

export const getTaxRegister = (from, to, type = 'sales') =>
  api.get(`/billing/gst/tax-register/?from=${from}&to=${to}&type=${type}`).then(res => res.data);

export const getGSTR1Export = (from, to) =>
  api.get(`/billing/gst/gstr1-export/?from=${from}&to=${to}`).then(res => res.data);

export const generateEInvoice = (invoiceId) =>
  api.post('/billing/gst/e-invoice/', { invoice_id: invoiceId }).then(res => res.data);

export const generateEWayBill = (data) =>
  api.post('/billing/gst/e-way-bill/', data).then(res => res.data);

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

export const getCashbook = (from, to) => {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  return api.get(`/ledger/cashbook/?${params}`).then(res => res.data);
};
