import api from './api';

export const getVendors = (params) => {
  return api.get('/billing/vendors/', { params }).then(res => res.data);
};

export const getVendor = (id) => {
  return api.get(`/billing/vendors/${id}/`).then(res => res.data);
};

export const createVendor = (data) => {
  return api.post('/billing/vendors/', data).then(res => res.data);
};

export const updateVendor = (id, data) => {
  return api.patch(`/billing/vendors/${id}/edit/`, data).then(res => res.data);
};

export const deleteVendor = (id) => {
  return api.delete(`/billing/vendors/${id}/edit/`).then(res => res.data);
};
