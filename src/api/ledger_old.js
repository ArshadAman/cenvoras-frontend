import api from "./api";

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
    throw error;
  }
};

// Get specific account
export const getAccount = async (id) => {
  try {
    const response = await api.get(`/ledger/accounts/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching account:', error);
    throw error;
  }
};

// Create a new account
export const createAccount = async (accountData) => {
  try {
    // Validate and transform the data to match API requirements
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

    const response = await api.post('/ledger/accounts/', requestData);
    return response.data;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
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
    throw error;
  }
};

// Delete account
export const deleteAccount = async (id) => {
  try {
    const response = await api.delete(`/ledger/accounts/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

// Setup default chart of accounts for the user
export const setupDefaultAccounts = async () => {
  try {
    const response = await api.post('/ledger/accounts/setup-defaults/');
    return response.data;
  } catch (error) {
    console.error('Error setting up default accounts:', error);
    throw error;
  }
};

// Get specific ledger entry
export const getLedgerEntry = id =>
  api.get(`/ledger/accounts/${id}/`).then(res => res.data);

// Get customer balance summary
export const getCustomerBalance = customerId =>
  api.get(`/ledger/accounts/balance/${customerId}/`).then(res => res.data);

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

    const response = await api.put(`/ledger/accounts/${id}/`, requestData);
    return response.data;
  } catch (error) {
    console.error('Error updating ledger entry:', error);
    throw error;
  }
};

// Delete a ledger entry
export const deleteLedgerEntry = async (id) => {
  try {
    const response = await api.delete(`/ledger/accounts/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting ledger entry:', error);
    throw error;
  }
};

// Get ledger statistics
export const getLedgerStats = () =>
  api.get("/ledger/accounts/stats/").then(res => res.data);

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
    throw error;
  }
};

// Create a new account
export const createAccount = async (accountData) => {
  try {
    // Validate and transform the data to match API requirements
    const requestData = {
      code: accountData.code.trim(),
      name: accountData.name.trim(),
      account_type: accountData.account_type,
      parent_account: accountData.parent_account || null,
      description: accountData.description?.trim() || "",
      is_active: accountData.is_active !== undefined ? accountData.is_active : true
    };

    // Validate required fields
    if (!requestData.code) {
      throw new Error('Account code is required');
    }
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

    // Validate code length
    if (requestData.code.length > 20) {
      throw new Error('Account code must be 20 characters or less');
    }

    // Validate name length
    if (requestData.name.length < 1 || requestData.name.length > 100) {
      throw new Error('Account name must be between 1 and 100 characters');
    }

    const response = await api.post('/ledger/accounts/', requestData);
    return response.data;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
};

// Get specific account
export const getAccount = async (id) => {
  try {
    const response = await api.get(`/ledger/accounts/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching account:', error);
    throw error;
  }
};

// Update account
export const updateAccount = async (id, accountData) => {
  try {
    const requestData = {
      code: accountData.code.trim(),
      name: accountData.name.trim(),
      account_type: accountData.account_type,
      parent_account: accountData.parent_account || null,
      description: accountData.description?.trim() || "",
      is_active: accountData.is_active !== undefined ? accountData.is_active : true
    };

    const response = await api.put(`/ledger/accounts/${id}/`, requestData);
    return response.data;
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
};

// Delete account
export const deleteAccount = async (id) => {
  try {
    const response = await api.delete(`/ledger/accounts/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

// Setup default chart of accounts for the user
export const setupDefaultAccounts = async () => {
  try {
    const response = await api.post('/ledger/accounts/setup-defaults/');
    return response.data;
  } catch (error) {
    console.error('Error setting up default accounts:', error);
    throw error;
  }
};

// Get general ledger entries for a specific account
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
    throw error;
  }
};

// ==================== BULK DELETE FUNCTIONS ====================

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