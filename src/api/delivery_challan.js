import api from './api';

export const getDeliveryChallans = (params) => 
  api.get("/billing/delivery-challans/", { params }).then(res => res.data);

export const getDeliveryChallan = (id) => 
  api.get(`/billing/delivery-challans/${id}/`).then(res => res.data);

export const createDeliveryChallan = (data) => 
  api.post("/billing/delivery-challans/", data).then(res => res.data);

export const updateDeliveryChallan = (id, data) => 
  api.put(`/billing/delivery-challans/${id}/`, data).then(res => res.data);

export const deleteDeliveryChallan = (id) => 
  api.delete(`/billing/delivery-challans/${id}/`).then(res => res.data);

export const convertToInvoice = (id) =>
  api.post(`/billing/delivery-challans/${id}/convert_to_invoice/`).then(res => res.data);
