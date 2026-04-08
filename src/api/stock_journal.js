import api from './api';

export const getStockJournals = (params) => 
  api.get("/inventory/stock-journals/", { params }).then(res => res.data);

export const getStockJournal = (id) => 
  api.get(`/inventory/stock-journals/${id}/`).then(res => res.data);

export const createStockJournal = (data) => 
  api.post("/inventory/stock-journals/", data).then(res => res.data);

export const updateStockJournal = (id, data) => 
  api.put(`/inventory/stock-journals/${id}/`, data).then(res => res.data);

export const deleteStockJournal = (id) => 
  api.delete(`/inventory/stock-journals/${id}/`).then(res => res.data);
