import api from './api';

export const getStockValuation = () => api.get("/reports/stock-valuation/").then(res => res.data);

// Points to new inventory endpoint
export const getExpiryReport = (days = 30) => api.get(`/inventory/reports/expiry/?days=${days}`).then(res => res.data);

// Points to new billing endpoint
export const getProfitLoss = (startDate, endDate) => 
    api.get(`/billing/reports/item-pl/?from=${startDate}&to=${endDate}`).then(res => res.data);

// NEW: Shortage report
export const getShortageReport = () => api.get("/inventory/reports/shortage/").then(res => res.data);

// NEW: Batch split
export const splitBatch = (data) => api.post("/inventory/batches/split/", data).then(res => res.data);

// NEW: Warehouse CRUD
export const getWarehouse = (id) => api.get(`/inventory/warehouses/${id}/`).then(res => res.data);
export const updateWarehouse = (id, data) => api.put(`/inventory/warehouses/${id}/`, data).then(res => res.data);
export const deleteWarehouse = (id) => api.delete(`/inventory/warehouses/${id}/`).then(res => res.data);
export const getStockLedger = (productId, startDate, endDate) => {
    let url = `/reports/stock-ledger/?product_id=${productId}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return api.get(url).then(res => res.data);
};
