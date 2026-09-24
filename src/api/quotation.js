import api from './api';

export const getQuotations = (params) =>
  api.get('/billing/quotations/', { params }).then((res) => res.data);

export const getQuotation = (id) =>
  api.get(`/billing/quotations/${id}/`).then((res) => res.data);

export const createQuotation = (data) =>
  api.post('/billing/quotations/', data).then((res) => res.data);

export const updateQuotation = (id, data) =>
  api.put(`/billing/quotations/${id}/`, data).then((res) => res.data);

export const deleteQuotation = (id) =>
  api.delete(`/billing/quotations/${id}/`).then((res) => res.data);

export const getNextQuotationNumber = (prefix = 'QT-') =>
  api.get(`/billing/quotations/next-number/?prefix=${prefix}`).then((res) => res.data);

export const convertQuotationToSalesOrder = (id, approvedItemIds = []) =>
  api
    .post(`/billing/quotations/${id}/convert-to-sales-order/`, {
      approved_item_ids: approvedItemIds,
    })
    .then((res) => res.data);

export const downloadQuotationPDF = (id, payload) => {
  if (payload) {
    const body = typeof payload === 'object' && ('html' in payload || 'template' in payload)
      ? payload
      : { template: payload };
    return api.post(`/billing/quotations/${id}/pdf/`, body, { responseType: 'blob' })
      .then((res) => res.data);
  }
  return api.get(`/billing/quotations/${id}/pdf/`, { responseType: 'blob' })
    .then((res) => res.data);
};

