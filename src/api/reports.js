import api from './api';

export const getStockValuation = () => api.get("/reports/stock-valuation/").then(res => res.data);
export const getExpiryReport = (days = 30) => api.get(`/reports/expiry/?days=${days}`).then(res => res.data);
export const getProfitLoss = (startDate, endDate) => 
    api.get(`/reports/profit-loss/?start_date=${startDate}&end_date=${endDate}`).then(res => res.data);
