import api from "./api";

// Get all customers with search and ordering
export const getCustomers = ({ search = "", ordering = "", page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (ordering) params.append("ordering", ordering);
  if (page) params.append("page", page);
  
  const queryString = params.toString();
  const url = queryString ? `/billing/customers/?${queryString}` : "/billing/customers/";
  
  return api.get(url).then(res => res.data);
};

// Get a single customer by ID
export const getCustomer = id =>
  api.get(`/billing/customers/${id}/`).then(res => res.data);

// Create a new customer
export const createCustomer = data =>
  api.post("/billing/customers/", data).then(res => res.data);

// Update an existing customer
export const updateCustomer = (id, data) =>
  api.put(`/billing/customers/${id}/edit/`, data).then(res => res.data);

// Delete a customer
export const deleteCustomer = id =>
  api.delete(`/billing/customers/${id}/edit/`).then(res => res.data);

// Upload customers via CSV (if supported)
export const uploadCustomersCsv = formData =>
  api.post("/billing/upload-customers-csv/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }).then(res => res.data);