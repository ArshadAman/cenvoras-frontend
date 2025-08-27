import api from './api';

// Inventory/Product API endpoints
export const getProducts = (params) =>
  api.get("/inventory/products/", { params }).then(res => res.data);

export const getProduct = (id) =>
  api.get(`/inventory/product/${id}/`).then(res => res.data);

export const createProduct = (data) =>
  api.post("/inventory/add-product/", data).then(res => res.data);

export const updateProduct = (id, data) =>
  api.put(`/inventory/product/${id}/`, data).then(res => res.data);

export const deleteProduct = (id) =>
  api.delete(`/inventory/product/${id}/`).then(res => res.data);

// Stock management endpoints
export const getStockMovements = (params) =>
  api.get("/inventory/stock-movements/", { params }).then(res => res.data);

export const createStockMovement = (data) =>
  api.post("/inventory/stock-movements/", data).then(res => res.data);

export const getStockAdjustments = (params) =>
  api.get("/inventory/stock-adjustments/", { params }).then(res => res.data);

export const createStockAdjustment = (data) =>
  api.post("/inventory/stock-adjustments/", data).then(res => res.data);

// Categories and units
export const getCategories = () =>
  api.get("/inventory/categories/").then(res => res.data);

export const createCategory = (data) =>
  api.post("/inventory/categories/", data).then(res => res.data);

export const getUnits = () =>
  api.get("/inventory/units/").then(res => res.data);

export const createUnit = (data) =>
  api.post("/inventory/units/", data).then(res => res.data);

// Suppliers/Vendors
export const getSuppliers = () =>
  api.get("/inventory/suppliers/").then(res => res.data);

export const createSupplier = (data) =>
  api.post("/inventory/suppliers/", data).then(res => res.data);

// Low stock alerts
export const getLowStockProducts = () =>
  api.get("/inventory/low-stock/").then(res => res.data);

// Inventory reports
export const getInventoryReport = (params) =>
  api.get("/inventory/reports/", { params }).then(res => res.data);

export const getStockValuation = () =>
  api.get("/inventory/stock-valuation/").then(res => res.data);
