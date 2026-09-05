import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccounts, deleteAccount, setupDefaultAccounts, bulkDeleteAccounts } from '../api/ledger';
import Loader from '../components/Loader';
import AccountForm from '../components/ledger/AccountForm';
import GeneralLedgerModal from '../components/ledger/GeneralLedgerModal';
import BulkDeleteModal from '../components/BulkDeleteModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCurrencySymbol, formatCurrency } from '../utils/currency';

const ACCOUNT_TYPE_LABELS = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expense'
};

const ACCOUNT_TYPE_COLORS = {
  asset: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  liability: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  equity: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  revenue: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  expense: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
};

export default function ChartOfAccounts() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('code');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Form states
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);
  
  // General ledger modal state
  const [isGeneralLedgerOpen, setIsGeneralLedgerOpen] = useState(false);
  const [selectedAccountForLedger, setSelectedAccountForLedger] = useState(null);
  
  // Bulk selection states
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Build query parameters
  const queryParams = useMemo(() => ({
    search: searchTerm || undefined,
    account_type: accountTypeFilter || undefined,
    is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
    ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
    page: currentPage,
    page_size: pageSize
  }), [searchTerm, accountTypeFilter, activeFilter, sortBy, sortOrder, currentPage, pageSize]);

  // Fetch accounts
  const { 
    data: accountsData, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['accounts', queryParams],
    queryFn: () => getAccounts(queryParams),
    keepPreviousData: true
  });

  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts']);
      toast.success('Account deleted successfully');
      setDeletingAccount(null);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to delete account';
      toast.error(errorMessage);
    }
  });

  // Setup default accounts mutation
  const setupDefaultsMutation = useMutation({
    mutationFn: setupDefaultAccounts,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['accounts']);
      const accountsCreated = data?.accounts_created || 0;
      toast.success(`Default chart of accounts set up successfully! ${accountsCreated} accounts created.`);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to setup default accounts';
      toast.error(errorMessage);
    }
  });

  const handleEdit = (account) => {
    setEditingAccount(account);
    setIsAccountFormOpen(true);
  };

  const handleDelete = (account) => {
    setDeletingAccount(account);
  };

  const handleViewLedger = (account) => {
    setSelectedAccountForLedger(account);
    setIsGeneralLedgerOpen(true);
  };

  const confirmDelete = () => {
    if (deletingAccount) {
      deleteMutation.mutate(deletingAccount.id);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Bulk selection handlers
  const handleBulkSelect = (accountIds) => {
    setSelectedAccounts(accountIds);
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const allAccountIds = displayedAccounts.map(account => account.id);
      setSelectedAccounts([...new Set([...selectedAccounts, ...allAccountIds])]);
    } else {
      const currentPageIds = displayedAccounts.map(account => account.id);
      setSelectedAccounts(selectedAccounts.filter(id => !currentPageIds.includes(id)));
    }
  };

  const handleSelectAccount = (accountId, isChecked) => {
    if (isChecked) {
      setSelectedAccounts([...selectedAccounts, accountId]);
    } else {
      setSelectedAccounts(selectedAccounts.filter(id => id !== accountId));
    }
  };

  const clearSelection = () => {
    setSelectedAccounts([]);
  };

  const handleBulkDelete = () => {
    if (selectedAccounts.length > 0) {
      setIsBulkDeleteOpen(true);
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (isLoading && !accountsData) {
    return (
      <>
        <Loader />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-4">Error loading accounts</div>
          <div className="text-gray-500">{error?.message || 'Something went wrong'}</div>
        </div>
      </>
    );
  }

  const accounts = accountsData?.results || [];
  const totalAccounts = accountsData?.count || 0;
  const totalPages = Math.ceil(totalAccounts / pageSize);

  // Helper variables for bulk selection
  const displayedAccounts = accounts; // Using accounts directly since no client-side filtering
  const isAllCurrentPageSelected = displayedAccounts.length > 0 && 
    displayedAccounts.every(account => selectedAccounts.includes(account.id));
  const isSomeCurrentPageSelected = displayedAccounts.some(account => selectedAccounts.includes(account.id));

  return (
    <>
      <div className="page-bg min-h-screen p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Chart of Accounts
              </h1>
              <p className="text-[#b6e0f7] mt-2">
                Manage your accounting structure and financial categories
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setupDefaultsMutation.mutate()}
                disabled={setupDefaultsMutation.isPending}
                className="btn-secondary flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{setupDefaultsMutation.isPending ? 'Setting up...' : 'Setup Defaults'}</span>
              </button>
              <button
                onClick={() => {
                  setEditingAccount(null);
                  setIsAccountFormOpen(true);
                }}
                className="btn-primary flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Account</span>
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {Object.entries(ACCOUNT_TYPE_LABELS).map(([type, label]) => {
              const count = accounts.filter(acc => acc.account_type === type).length;
              return (
                <div
                  key={type}
                  className={`bento-card p-4 hover:border-cyan-500/30 transition-all duration-200 cursor-pointer ${
                    accountTypeFilter === type ? 'ring-2 ring-cyan-500 bg-white/5' : ''
                  }`}
                  onClick={() => setAccountTypeFilter(accountTypeFilter === type ? '' : type)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                      <p className="text-2xl font-bold text-white mt-1">{count}</p>
                    </div>
                    <div className={`p-2 rounded-lg bg-white/5 border border-white/10`}>
                      <div className={`w-2 h-2 rounded-full ${ACCOUNT_TYPE_COLORS[type].split(' ')[0].replace('bg-', 'bg-')}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bento-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Search Accounts
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by code, name..."
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Account Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Account Type
              </label>
              <select
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all appearance-none"
              >
                <option value="">All Types</option>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Active Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Status
              </label>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all appearance-none"
              >
                <option value="all">All Accounts</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Page Size */}
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Items per Page
              </label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all appearance-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedAccounts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
            <div className="px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedAccounts.length} {selectedAccounts.length === 1 ? 'account' : 'accounts'} selected
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={clearSelection}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Accounts Table */}
        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-white/5">
                <tr>
                  <th scope="col" className="relative px-6 py-4">
                    <input
                      type="checkbox"
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-white/20 bg-[#111] text-cyan-500 focus:ring-cyan-500/50"
                      checked={isAllCurrentPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeCurrentPageSelected && !isAllCurrentPageSelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleSort('code')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Code</span>
                      {getSortIcon('code')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Account Name</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleSort('account_type')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Type</span>
                      {getSortIcon('account_type')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Parent Account
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-white/5 transition-colors">
                    <td className="relative px-6 py-4 whitespace-nowrap text-sm">
                      <input
                        type="checkbox"
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-white/20 bg-[#111] text-cyan-500 focus:ring-cyan-500/50"
                        checked={selectedAccounts.includes(account.id)}
                        onChange={(e) => handleSelectAccount(account.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {account.code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        {account.name}
                      </div>
                      {account.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {account.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${ACCOUNT_TYPE_COLORS[account.account_type]}`}>
                        {ACCOUNT_TYPE_LABELS[account.account_type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {account.parent_account_name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${account.is_active ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                        <span className="text-sm text-white">
                          {account.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {account.balance !== undefined ? `${getCurrencySymbol()}${Number(account.balance).toLocaleString('en-IN')}` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => handleViewLedger(account)}
                          className="text-cyan-400 hover:text-cyan-300 transition-colors p-1 hover:bg-cyan-500/10 rounded-lg"
                          title="View General Ledger"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(account)}
                          className="text-blue-400 hover:text-blue-300 transition-colors p-1 hover:bg-blue-500/10 rounded-lg"
                          title="Edit Account"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(account)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-500/10 rounded-lg"
                          title="Delete Account"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* No results */}
          {accounts.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
                <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No accounts found</h3>
              <p className="text-gray-400 max-w-sm mx-auto mb-8">
                Get started by setting up default accounts or creating your first account manually.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setupDefaultsMutation.mutate()}
                  disabled={setupDefaultsMutation.isPending}
                  className="btn-secondary"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {setupDefaultsMutation.isPending ? 'Setting up...' : 'Setup Defaults'}
                </button>
                <button
                  onClick={() => {
                    setEditingAccount(null);
                    setIsAccountFormOpen(true);
                  }}
                  className="btn-primary"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Account
                </button>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white/5 px-6 py-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Showing <span className="text-white font-medium">{((currentPage - 1) * pageSize) + 1}</span> to <span className="text-white font-medium">{Math.min(currentPage * pageSize, totalAccounts)}</span> of <span className="text-white font-medium">{totalAccounts}</span> accounts
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Form Modal */}
      <AccountForm
        isOpen={isAccountFormOpen}
        onClose={() => {
          setIsAccountFormOpen(false);
          setEditingAccount(null);
        }}
        editData={editingAccount}
        onSuccess={() => {
          queryClient.invalidateQueries(['accounts']);
        }}
      />

      {/* General Ledger Modal */}
      <GeneralLedgerModal
        isOpen={isGeneralLedgerOpen}
        onClose={() => {
          setIsGeneralLedgerOpen(false);
          setSelectedAccountForLedger(null);
        }}
        account={selectedAccountForLedger}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        selectedItems={selectedAccounts}
        onClearSelection={clearSelection}
        bulkDeleteFn={bulkDeleteAccounts}
        invalidateQueries={[['accounts']]}
        itemType="account"
        title="Delete Selected Accounts"
        description="Are you sure you want to delete the selected accounts? This action cannot be undone and may affect related transactions."
      />

      {/* Delete Confirmation Modal */}
      {deletingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Delete Account
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Are you sure you want to delete the account "{deletingAccount.code} - {deletingAccount.name}"? 
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeletingAccount(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </>
  );
}