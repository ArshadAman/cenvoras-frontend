import api from "./api";

// Record a payment received from a client
export const recordClientPayment = (data) =>
  api.post("/ledger/client-ledger/payment/", data).then(res => res.data);

// Get client ledger entries with filtering
export const getClientLedger = ({ customer = "", search = "", ordering = "", page = 1, date_from = "", date_to = "" } = {}) => {
  const params = new URLSearchParams();
  if (customer) params.append("customer", customer);
  if (search) params.append("search", search);
  if (ordering) params.append("ordering", ordering);
  if (page) params.append("page", page);
  if (date_from) params.append("date_from", date_from);
  if (date_to) params.append("date_to", date_to);
  
  const queryString = params.toString();
  const url = queryString ? `/ledger/client-ledger/?${queryString}` : "/ledger/client-ledger/";
  
  return api.get(url).then(res => res.data);
};

// Get specific ledger entry
export const getLedgerEntry = id =>
  api.get(`/ledger/client-ledger/${id}/`).then(res => res.data);

// Get customer balance summary
export const getCustomerBalance = customerId =>
  api.get(`/ledger/client-ledger/balance/${customerId}/`).then(res => res.data);

// Get ledger statistics
export const getLedgerStats = () =>
  api.get("/ledger/client-ledger/stats/").then(res => res.data);