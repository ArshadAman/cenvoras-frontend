import api from './api';

// Purchase Bills API endpoints
export const getPurchaseBills = params =>
  api.get("/billing/purchase-bills/", { params }).then(res => res.data);

export const getPurchaseBill = id =>
  api.get(`/billing/purchase-bills/${id}/`).then(res => res.data);

export const createPurchaseBill = data =>
  api.post("/billing/purchase-bills/", data).then(res => res.data);

export const updatePurchaseBill = (id, data) =>
  api.put(`/billing/purchase-bills/${id}/edit/`, data).then(res => res.data);

export const deletePurchaseBill = id =>
  api.delete(`/billing/purchase-bills/${id}/edit/`).then(res => res.data);

export const uploadPurchaseCsv = formData =>
  api.post("/billing/upload-purchase-bills-csv/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(res => res.data);

// Product API endpoints for purchase form
export const getProducts = () =>
  api.get("/inventory/products/").then(res => res.data);

export const createProduct = (data) =>
  api.post("/inventory/add-product/", data).then(res => res.data);

export const updateProduct = (id, data) =>
  api.put(`/inventory/product/${id}/`, data).then(res => res.data);