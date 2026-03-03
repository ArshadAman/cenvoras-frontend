import api from './api';

// Inventory/Product API endpoints
export const getProducts = (params) =>
  api.get("/inventory/products/", { params }).then(res => res.data);

export const getProduct = (id) =>
  api.get(`/inventory/product/${id}/`).then(res => res.data);

export const createProduct = (data) => {
  // Map frontend fields to backend schema
  const backendData = {
    name: data.name,
    hsn_sac_code: data.hsn_sac_code || data.hsn_code || null,
    stock: parseInt(data.stock || data.current_stock || 0),
    unit: data.unit,
    secondary_unit: data.secondary_unit || null,
    conversion_factor: parseInt(data.conversion_factor || 1),
    price: data.price || data.unit_price,
    low_stock_alert: parseInt(data.low_stock_alert || data.min_stock_level || 0),
    meta: data.meta
  };
  return api.post("/inventory/add-product/", backendData).then(res => res.data);
};

export const updateProduct = (id, data) => {
  // Map frontend fields to backend schema
  const backendData = {
    name: data.name,
    hsn_sac_code: data.hsn_sac_code || data.hsn_code || null,
    stock: parseInt(data.stock || data.current_stock || 0),
    unit: data.unit,
    secondary_unit: data.secondary_unit || null,
    conversion_factor: parseInt(data.conversion_factor || 1),
    price: data.price || data.unit_price,
    low_stock_alert: parseInt(data.low_stock_alert || data.min_stock_level || 0),
    meta: data.meta
  };
  return api.put(`/inventory/product/${id}/`, backendData).then(res => res.data);
};

export const deleteProduct = (id) =>
  api.delete(`/inventory/product/${id}/`).then(res => res.data);

// Stock management endpoints
export const getStockMovements = (params) =>
  api.get("/inventory/transfers/", { params }).then(res => res.data);

export const createStockMovement = (data) =>
  api.post("/inventory/transfers/", data).then(res => res.data);

export const getStockAdjustments = (params) =>
  api.get("/inventory/stock-adjustments/", { params }).then(res => res.data);

export const createStockAdjustment = (data) =>
  api.post("/inventory/stock-adjustments/", data).then(res => res.data);

// Warehouses and Stock Points
export const getWarehouses = () =>
  api.get("/inventory/warehouses/").then(res => res.data);

export const createWarehouse = (data) =>
  api.post("/inventory/warehouses/", data).then(res => res.data);

export const getProductBatches = (params) =>
  api.get("/inventory/batches/", { params }).then(res => res.data);

export const getStockPoints = (params) =>
  api.get("/inventory/stock-points/", { params }).then(res => res.data);

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

// Price Lists
export const getPriceLists = () => api.get("/inventory/price-lists/").then(res => res.data);
export const createPriceList = (data) => api.post("/inventory/price-lists/", data).then(res => res.data);
export const getPriceList = (id) => api.get(`/inventory/price-lists/${id}/`).then(res => res.data);
export const updatePriceList = (id, data) => api.put(`/inventory/price-lists/${id}/`, data).then(res => res.data);
export const deletePriceList = (id) => api.delete(`/inventory/price-lists/${id}/`).then(res => res.data);

// Schemes
export const getSchemes = () => api.get("/inventory/schemes/").then(res => res.data);
export const createScheme = (data) => api.post("/inventory/schemes/", data).then(res => res.data);
export const getScheme = (id) => api.get(`/inventory/schemes/${id}/`).then(res => res.data);
export const updateScheme = (id, data) => api.put(`/inventory/schemes/${id}/`, data).then(res => res.data);
export const deleteScheme = (id) => api.delete(`/inventory/schemes/${id}/`).then(res => res.data);
