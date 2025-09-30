import api from "./api";

// Record a payment received from a client
// Record a client payment
export const recordClientPayment = async (paymentData) => {
  try {
    // Transform the data to match API requirements
    const requestData = {
      customer: paymentData.customer,
      amount: parseFloat(paymentData.amount),
      description: paymentData.description || "Payment received",
      date: paymentData.date || new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    };

    const response = await api.post('/ledger/client-ledger/payment/', requestData);
    return response.data;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

// Get client ledger entries with filtering
// Get client ledger entries
export const getClientLedger = async (params = {}) => {
  try {
    const queryString = new URLSearchParams();
    
    if (params.search) queryString.append('search', params.search);
    if (params.customer) queryString.append('customer', params.customer);
    if (params.date_from) queryString.append('date_from', params.date_from);
    if (params.date_to) queryString.append('date_to', params.date_to);
    if (params.page) queryString.append('page', params.page);
    if (params.page_size) queryString.append('page_size', params.page_size);
    if (params.ordering) queryString.append('ordering', params.ordering);

    const response = await api.get(`/ledger/client-ledger/?${queryString}`);
    
    // The API returns an array directly, not paginated results
    // Transform to match expected format for the components
    const entries = Array.isArray(response.data) ? response.data : [];
    
    return {
      results: entries,
      count: entries.length,
      next: null,
      previous: null
    };
  } catch (error) {
    console.error('Error fetching client ledger:', error);
    throw error;
  }
};

// Get specific ledger entry
export const getLedgerEntry = id =>
  api.get(`/ledger/client-ledger/${id}/`).then(res => res.data);

// Get customer balance summary
export const getCustomerBalance = customerId =>
  api.get(`/ledger/client-ledger/balance/${customerId}/`).then(res => res.data);

// Update a ledger entry
export const updateLedgerEntry = async (id, entryData) => {
  try {
    // Transform the data to match API requirements
    const requestData = {
      customer: entryData.customer,
      date: entryData.date,
      description: entryData.description,
      invoice: entryData.invoice || null,
      debit: entryData.debit ? entryData.debit.toString() : "0",
      credit: entryData.credit ? entryData.credit.toString() : "0"
    };

    const response = await api.put(`/ledger/client-ledger/${id}/`, requestData);
    return response.data;
  } catch (error) {
    console.error('Error updating ledger entry:', error);
    throw error;
  }
};

// Delete a ledger entry
export const deleteLedgerEntry = async (id) => {
  try {
    const response = await api.delete(`/ledger/client-ledger/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting ledger entry:', error);
    throw error;
  }
};

// Get ledger statistics
export const getLedgerStats = () =>
  api.get("/ledger/client-ledger/stats/").then(res => res.data);