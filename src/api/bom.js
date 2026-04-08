import api from './api';

export const getBOMs = (params) => 
  api.get("/inventory/bom/", { params }).then(res => res.data);

export const getBOM = (id) => 
  api.get(`/inventory/bom/${id}/`).then(res => res.data);

export const createBOM = (data) => 
  api.post("/inventory/bom/", data).then(res => res.data);

export const updateBOM = (id, data) => 
  api.put(`/inventory/bom/${id}/`, data).then(res => res.data);

export const deleteBOM = (id) => 
  api.delete(`/inventory/bom/${id}/`).then(res => res.data);
