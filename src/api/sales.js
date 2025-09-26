import api from './api';

// Sales Invoices API endpoints
export const getSalesInvoices = params =>
  api.get("/billing/sales-invoices/", { params }).then(res => res.data);

export const getSalesInvoice = id =>
  api.get(`/billing/sales-invoices/${id}/`).then(res => res.data);

export const createSalesInvoice = data =>
  api.post("/billing/sales-invoices/", data).then(res => res.data);

export const updateSalesInvoice = (id, data) =>
  api.put(`/billing/sales-invoices/${id}/`, data).then(res => res.data);

export const deleteSalesInvoice = id =>
  api.delete(`/billing/sales-invoices/${id}/`).then(res => res.data);

export const uploadSalesCsv = formData =>
  api.post("/billing/upload-sales-invoices-csv/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(res => res.data);

// Product API endpoints for sales form (reuse from inventory)
export const getProducts = () =>
  api.get("/inventory/products/").then(res => res.data);

// Customer API endpoints for sales form
export const getCustomers = () =>
  api.get("/customers/").then(res => res.data);

export const createCustomer = (data) =>
  api.post("/customers/", data).then(res => res.data);

export const updateCustomer = (id, data) =>
  api.put(`/customers/${id}/`, data).then(res => res.data);