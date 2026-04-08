import api from './api';

// Sales Invoices API endpoints
export const getSalesInvoices = params =>
  api.get("/billing/sales-invoices/", { params }).then(res => res.data);

export const getNextInvoiceNumber = (prefix = "INV-") =>
  api.get(`/billing/sales-invoices/next-number/?prefix=${prefix}`).then(res => res.data);

export const getSalesAnalytics = params =>
  api.get("/billing/sales-invoices/analytics/", { params }).then(res => res.data);

export const getSalesInvoice = id =>
  api.get(`/billing/sales-invoices/${id}/`).then(res => res.data);

export const createSalesInvoice = data =>
  api.post("/billing/sales-invoices/", data).then(res => res.data);

export const updateSalesInvoice = (id, data) =>
  api.put(`/billing/sales-invoices/${id}/edit/`, data).then(res => res.data);

export const deleteSalesInvoice = id =>
  api.delete(`/billing/sales-invoices/${id}/edit/`)
    .then(res => res.data)
    .catch((error) => {
      const message = error?.response?.data?.error || error?.response?.data?.message || 'Failed to delete sales invoice';
      throw new Error(message);
    });

export const uploadSalesCsv = formData =>
  api.post("/billing/upload-sales-invoices-csv/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(res => res.data);

// Product API endpoints for sales form (reuse from inventory)
export const getProducts = (params = {}) =>
  api.get("/inventory/products/", {
    params: {
      page_size: 50,
      ...params,
    },
  }).then(res => res.data);

// Customer API endpoints for sales form
export const getCustomers = () =>
  api.get("/billing/customers/").then(res => res.data);

export const createCustomer = (data) =>
  api.post("/billing/customers/", data).then(res => res.data);

export const updateCustomer = (id, data) =>
  api.put(`/billing/customers/${id}/`, data).then(res => res.data);