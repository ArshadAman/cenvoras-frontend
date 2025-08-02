import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
});

// Attach JWT token if needed
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getPurchaseBills = params =>
  api.get("/billing/purchase-bills/", { params }).then(res => res.data);

export const getPurchaseBill = id =>
  api.get(`/billing/purchase-bills/${id}/`).then(res => res.data);

export const createPurchaseBill = data =>
  api.post("/billing/purchase-bills/", data);

export const updatePurchaseBill = (id, data) =>
  api.put(`/billing/purchase-bills/${id}/`, data);

export const deletePurchaseBill = id =>
  api.delete(`/billing/purchase-bills/${id}/`);

export const uploadPurchaseCsv = formData =>
  api.post("/billing/upload-purchase-bills-csv/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Add more API functions for other endpoints if needed