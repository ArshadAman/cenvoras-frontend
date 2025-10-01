import api from "./api";

// Helper function to create user-friendly error messages
const createUserFriendlyError = (error, defaultMessage) => {
  let message = defaultMessage;
  
  if (error.response?.data?.detail) {
    message = error.response.data.detail;
  } else if (error.response?.data?.error) {
    message = error.response.data.error;
  } else if (error.response?.data?.message) {
    message = error.response.data.message;
  } else if (error.response?.status) {
    switch (error.response.status) {
      case 400:
        message = "Invalid data provided. Please check your input and try again.";
        break;
      case 401:
        message = "You are not authorized to perform this action. Please log in again.";
        break;
      case 403:
        message = "You don't have permission to perform this action.";
        break;
      case 404:
        message = "The requested resource was not found.";
        break;
      case 409:
        message = "This action conflicts with existing data. Please check for duplicates.";
        break;
      case 422:
        message = "The data provided is invalid or incomplete.";
        break;
      case 500:
        message = "A server error occurred. Please try again later.";
        break;
      default:
        message = defaultMessage;
    }
  } else if (error.message?.includes('Network Error')) {
    message = "Unable to connect to the server. Please check your internet connection.";
  }
  
  const userError = new Error(message);
  userError.originalError = error;
  return userError;
};

// ==================== CHART OF ACCOUNTS API ====================

// Get accounts list with filtering
export const getAccounts = async (params = {}) => {
  try {
    const queryString = new URLSearchParams();
    
    if (params.account_type) queryString.append('account_type', params.account_type);
    if (params.search) queryString.append('search', params.search);
    if (params.page) queryString.append('page', params.page);
    if (params.page_size) queryString.append('page_size', params.page_size);
    if (params.ordering) queryString.append('ordering', params.ordering);

    const response = await api.get(`/ledger/accounts/?${queryString}`);
    
    // Handle both array and paginated responses
    if (Array.isArray(response.data)) {
      return {
        results: response.data,
        count: response.data.length,
        next: null,
        previous: null
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw createUserFriendlyError(error, 'Failed to load accounts. Please try again.');
  }
};

// Get specific account
export const getAccount = async (id) => {
  try {
    const response = await api.get(`/ledger/accounts/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching account:', error);
    throw createUserFriendlyError(error, 'Failed to load account details. Please try again.');
  }
};

// Create a new account
export const createAccount = async (accountData) => {
  try {
    // Transform the data to match API requirements
    const requestData = {
      name: accountData.name.trim(),
      account_type: accountData.account_type,
      code: accountData.code?.trim() || undefined,
      parent_account: accountData.parent_account || null,
      description: accountData.description?.trim() || "",
      is_active: accountData.is_active !== undefined ? accountData.is_active : true
    };

    // Validate required fields
    if (!requestData.name) {
      throw new Error('Account name is required');
    }
    if (!requestData.account_type) {
      throw new Error('Account type is required');
    }

    // Validate account type
    const validTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];
    if (!validTypes.includes(requestData.account_type)) {
      throw new Error('Invalid account type');
    }

    // Remove undefined values
    Object.keys(requestData).forEach(key => 
      requestData[key] === undefined && delete requestData[key]
    );

    const response = await api.post('/ledger/accounts/', requestData);
    return response.data;
  } catch (error) {
    console.error('Error creating account:', error);
    throw createUserFriendlyError(error, 'Failed to create account. Please check your input and try again.');
  }
};

// Update an existing account
export const updateAccount = async (id, accountData) => {
  try {
    // Transform the data to match API requirements
    const requestData = {
      name: accountData.name?.trim(),
      account_type: accountData.account_type,
      code: accountData.code?.trim(),
      parent_account: accountData.parent_account || null,
      description: accountData.description?.trim() || "",
      is_active: accountData.is_active
    };

    // Remove undefined values
    Object.keys(requestData).forEach(key => 
      requestData[key] === undefined && delete requestData[key]
    );

    const response = await api.put(`/ledger/accounts/${id}/`, requestData);
    return response.data;
  } catch (error) {
    console.error('Error updating account:', error);
    throw createUserFriendlyError(error, 'Failed to update account. Please check your input and try again.');
  }
};

// Delete account
export const deleteAccount = async (id) => {
  try {
    const response = await api.delete(`/ledger/accounts/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw createUserFriendlyError(error, 'Failed to delete account. This account may be in use or you may not have permission.');
  }
};

// Setup default chart of accounts for the user
export const setupDefaultAccounts = async () => {
  try {
    const response = await api.post('/ledger/accounts/setup-defaults/');
    return response.data;
  } catch (error) {
    console.error('Error setting up default accounts:', error);
    throw createUserFriendlyError(error, 'Failed to set up default accounts. Please try again.');
  }
};

// ==================== GENERAL LEDGER API ====================

// Get all general ledger entries with filtering
export const getGeneralLedgerEntries = async (params = {}) => {
  try {
    const queryString = new URLSearchParams();
    
    if (params.date_from) queryString.append('date_from', params.date_from);
    if (params.date_to) queryString.append('date_to', params.date_to);
    if (params.account) queryString.append('account', params.account);
    if (params.description) queryString.append('description', params.description);
    if (params.page) queryString.append('page', params.page);
    if (params.page_size) queryString.append('page_size', params.page_size);
    if (params.ordering) queryString.append('ordering', params.ordering);

    const response = await api.get(`/ledger/general-ledger-entries/?${queryString}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching general ledger entries:', error);
    throw createUserFriendlyError(error, 'Failed to load general ledger entries. Please try again.');
  }
};

// Get ledger entries for a specific account
export const getAccountLedger = async (accountId, params = {}) => {
  try {
    const queryString = new URLSearchParams();
    
    if (params.date_from) queryString.append('date_from', params.date_from);
    if (params.date_to) queryString.append('date_to', params.date_to);
    if (params.page) queryString.append('page', params.page);
    if (params.page_size) queryString.append('page_size', params.page_size);
    if (params.ordering) queryString.append('ordering', params.ordering);

    const url = `/ledger/general-ledger/${accountId}/${queryString.toString() ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching account ledger:', error);
    throw createUserFriendlyError(error, 'Failed to load account ledger entries. Please try again.');
  }
};

// Get general ledger entries for a specific account (with proper response handling)
export const getGeneralLedger = async (accountId, params = {}) => {
  try {
    const queryString = new URLSearchParams();
    
    if (params.date_from) queryString.append('date_from', params.date_from);
    if (params.date_to) queryString.append('date_to', params.date_to);
    if (params.page) queryString.append('page', params.page);
    if (params.page_size) queryString.append('page_size', params.page_size);
    if (params.ordering) queryString.append('ordering', params.ordering);

    const url = `/ledger/general-ledger/${accountId}/${queryString.toString() ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    
    // Handle both array and paginated responses
    if (Array.isArray(response.data)) {
      return {
        results: response.data,
        count: response.data.length,
        next: null,
        previous: null
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching general ledger:', error);
    throw createUserFriendlyError(error, 'Failed to load general ledger for this account. Please try again.');
  }
};

// Get specific ledger entry
export const getLedgerEntry = async (id) => {
  try {
    const response = await api.get(`/ledger/general-ledger-entry/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching ledger entry:', error);
    throw createUserFriendlyError(error, 'Failed to load ledger entry details. Please try again.');
  }
};

// Update ledger entry (limited fields only)
export const updateLedgerEntry = async (id, entryData) => {
  try {
    // Only description and reference can be updated
    const requestData = {
      description: entryData.description?.trim(),
      reference: entryData.reference?.trim()
    };

    // Remove undefined values
    Object.keys(requestData).forEach(key => 
      requestData[key] === undefined && delete requestData[key]
    );

    const response = await api.put(`/ledger/general-ledger-entry/${id}/`, requestData);
    return response.data;
  } catch (error) {
    console.error('Error updating ledger entry:', error);
    throw createUserFriendlyError(error, 'Failed to update ledger entry. Please check your input and try again.');
  }
};

// Delete ledger entry
export const deleteLedgerEntry = async (id) => {
  try {
    const response = await api.delete(`/ledger/general-ledger-entry/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting ledger entry:', error);
    throw createUserFriendlyError(error, 'Failed to delete ledger entry. This entry may be referenced elsewhere or you may not have permission.');
  }
};

// ==================== TRIAL BALANCE API ====================

// Get trial balance for all accounts
export const getTrialBalance = async () => {
  try {
    const response = await api.get('/ledger/trial-balance/');
    return response.data;
  } catch (error) {
    console.error('Error fetching trial balance:', error);
    throw createUserFriendlyError(error, 'Failed to load trial balance. Please try again.');
  }
};

// ==================== MANUAL LEDGER ENTRY CREATION ====================

// Create ledger entries for a sales invoice
export const createSalesInvoiceEntries = async (entryData) => {
  try {
    const requestData = {
      sales_invoice_id: entryData.sales_invoice_id,
      accounts_receivable_account_id: entryData.accounts_receivable_account_id || undefined,
      sales_revenue_account_id: entryData.sales_revenue_account_id || undefined
    };

    // Remove undefined values
    Object.keys(requestData).forEach(key => 
      requestData[key] === undefined && delete requestData[key]
    );

    const response = await api.post('/ledger/create-sales-invoice-entries/', requestData);
    return response.data;
  } catch (error) {
    console.error('Error creating sales invoice entries:', error);
    throw createUserFriendlyError(error, 'Failed to create ledger entries for sales invoice. Please check your data and try again.');
  }
};

// Create ledger entries for a purchase bill
export const createPurchaseBillEntries = async (entryData) => {
  try {
    const requestData = {
      purchase_bill_id: entryData.purchase_bill_id,
      purchases_account_id: entryData.purchases_account_id || undefined,
      accounts_payable_account_id: entryData.accounts_payable_account_id || undefined
    };

    // Remove undefined values
    Object.keys(requestData).forEach(key => 
      requestData[key] === undefined && delete requestData[key]
    );

    const response = await api.post('/ledger/create-purchase-bill-entries/', requestData);
    return response.data;
  } catch (error) {
    console.error('Error creating purchase bill entries:', error);
    throw createUserFriendlyError(error, 'Failed to create ledger entries for purchase bill. Please check your data and try again.');
  }
};

// ==================== BULK DELETE FUNCTIONS ====================

// Bulk delete accounts by iterating through individual deletes
export const bulkDeleteAccounts = async (accountIds) => {
  const results = {
    successful: [],
    failed: []
  };

  for (const id of accountIds) {
    try {
      await deleteAccount(id);
      results.successful.push(id);
    } catch (error) {
      console.error(`Failed to delete account ${id}:`, error);
      results.failed.push({ id, error: error.message || 'Unknown error' });
    }
  }

  // If any deletions failed, throw an error with details
  if (results.failed.length > 0) {
    const error = new Error(`Failed to delete ${results.failed.length} out of ${accountIds.length} accounts`);
    error.results = results;
    throw error;
  }

  return results;
};

// Bulk delete ledger entries by iterating through individual deletes
export const bulkDeleteLedgerEntries = async (entryIds) => {
  const results = {
    successful: [],
    failed: []
  };

  for (const id of entryIds) {
    try {
      await deleteLedgerEntry(id);
      results.successful.push(id);
    } catch (error) {
      console.error(`Failed to delete ledger entry ${id}:`, error);
      results.failed.push({ id, error: error.message || 'Unknown error' });
    }
  }

  // If any deletions failed, throw an error with details
  if (results.failed.length > 0) {
    const error = new Error(`Failed to delete ${results.failed.length} out of ${entryIds.length} entries`);
    error.results = results;
    throw error;
  }

  return results;
};

// ==================== LEGACY FUNCTIONS (DEPRECATED) ====================
// These functions are kept for backward compatibility but should be migrated

// Get client ledger entries (deprecated - use getGeneralLedgerEntries instead)
export const getClientLedger = async (params = {}) => {
  console.warn('getClientLedger is deprecated. Use getGeneralLedgerEntries instead.');
  return getGeneralLedgerEntries(params);
};

// Get ledger statistics
export const getLedgerStats = async () => {
  try {
    const response = await api.get('/ledger/accounts/stats/');
    return response.data;
  } catch (error) {
    console.error('Error fetching ledger stats:', error);
    throw createUserFriendlyError(error, 'Failed to load ledger statistics. Please try again.');
  }
};

// Record a client payment (deprecated - should use proper double-entry ledger entries)
export const recordClientPayment = async (paymentData) => {
  console.warn('recordClientPayment is deprecated. Use proper ledger entry creation instead.');
  try {
    const requestData = {
      customer: paymentData.customer,
      amount: parseFloat(paymentData.amount),
      description: paymentData.description || "Payment received",
      date: paymentData.date || new Date().toISOString().split('T')[0]
    };

    const response = await api.post('/ledger/accounts/payment/', requestData);
    return response.data;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw createUserFriendlyError(error, 'Failed to record payment. Please check your input and try again.');
  }
};