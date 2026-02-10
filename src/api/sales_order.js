import api from './api';

export const getSalesOrders = (params) => 
  api.get("/billing/sales-orders/", { params }).then(res => res.data);

export const getSalesOrder = (id) => 
  api.get(`/billing/sales-orders/${id}/`).then(res => res.data);

export const createSalesOrder = (data) => 
  api.post("/billing/sales-orders/", data).then(res => res.data);

export const updateSalesOrder = (id, data) => 
  api.put(`/billing/sales-orders/${id}/`, data).then(res => res.data);

export const deleteSalesOrder = (id) => 
  api.delete(`/billing/sales-orders/${id}/`).then(res => res.data);

export const convertToInvoice = (id) =>
  api.post(`/billing/sales-orders/${id}/convert_to_invoice/`).then(res => res.data);
