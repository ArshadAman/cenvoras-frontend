import api from './api';

export const getInvoiceSettings = () => 
  api.get("/billing/invoice-settings/").then(res => res.data);

export const updateInvoiceSettings = (data) => 
  api.post("/billing/invoice-settings/", data).then(res => res.data);
