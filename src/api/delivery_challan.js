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

export const getNextDeliveryChallanNumber = (prefix = "DC-") =>
  api.get(`/billing/delivery-challans/next-number/?prefix=${prefix}`).then(res => res.data);

export const convertOrderToChallan = (orderId, data = {}) =>
  api.post(`/billing/sales-orders/${orderId}/convert_to_challan/`, data).then(res => res.data);

export const convertToInvoice = (id) =>
  api.post(`/billing/delivery-challans/${id}/convert_to_invoice/`).then(res => res.data);

export const getDeliveryChallanPdf = (id, templateData) => {
  if (templateData) {
    return api.post(`/billing/delivery-challans/${id}/pdf/`, { template: templateData }, { responseType: 'blob' });
  }
  return api.get(`/billing/delivery-challans/${id}/pdf/`, { responseType: 'blob' });
};
