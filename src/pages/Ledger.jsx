import React, { useState } from 'react';
import { format, subDays } from 'date-fns';
import LedgerSummary from '../components/ledger/LedgerSummary';
import LedgerTable from '../components/ledger/LedgerTable';
import PaymentForm from '../components/ledger/PaymentForm';
import LedgerEntryForm from '../components/ledger/LedgerEntryForm';
import LedgerDeleteDialog from '../components/ledger/LedgerDeleteDialog';
import BulkDeleteModal from '../components/BulkDeleteModal';
import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '../api/customers';
import { bulkDeleteLedgerEntries, getAccounts } from '../api/ledger';
import Layout from '../components/Layout';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Ledger = () => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  // Fetch accounts for filter dropdown
  const { data: accountsData } = useQuery({
    queryKey: ['accounts', { search: '', page: 1, page_size: 1000 }],
    queryFn: () => getAccounts({ search: '', page: 1, page_size: 1000 }),
  });

  const accounts = accountsData?.results || [];

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
  };

  const handleEditEntry = (entry) => {
    setSelectedEntry(entry);
    setShowEditForm(true);
  };

  const handleDeleteEntry = (entry) => {
    setSelectedEntry(entry);
    setShowDeleteDialog(true);
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setSelectedEntry(null);
  };

  const handleDeleteSuccess = () => {
    setShowDeleteDialog(false);
    setSelectedEntry(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedAccount('');
    setDateFilter({
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    });
  };

  // Bulk selection handlers
  const handleBulkSelect = (entryIds) => {
    setSelectedEntries(entryIds);
  };

  const clearSelection = () => {
    setSelectedEntries([]);
  };

  const handleBulkDelete = () => {
    if (selectedEntries.length > 0) {
      setIsBulkDeleteOpen(true);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Client Ledger
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Track client payments and account balances
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </header>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Search
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search descriptions..."
                />
              </div>
            </div>

            {/* Account Filter */}
            <div>
              <label htmlFor="account-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Account
              </label>
              <select
                id="account-filter"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                From Date
              </label>
              <input
                type="date"
                id="date-from"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Date To */}
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                To Date
              </label>
              <input
                type="date"
                id="date-to"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          {/* Clear Filters Button */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
            >
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Dashboard
      <LedgerSummary 
        dateFilter={dateFilter}
        customerFilter={selectedCustomer}
      /> */}

      {/* Bulk Actions Toolbar */}
      {selectedEntries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedEntries.length} {selectedEntries.length === 1 ? 'entry' : 'entries'} selected
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

      {/* Ledger Table */}
      <LedgerTable
        searchTerm={searchTerm}
        dateFilter={dateFilter}
        accountFilter={selectedAccount}
        onEdit={handleEditEntry}
        onDelete={handleDeleteEntry}
        selectedEntries={selectedEntries}
        onBulkSelect={handleBulkSelect}
      />

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="bg-white dark:bg-gray-800 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                    Record Payment
                  </h3>
                  <PaymentForm
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => setShowPaymentForm(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {showEditForm && selectedEntry && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setSelectedEntry(null);
                  }}
                  className="bg-white dark:bg-gray-800 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                    Edit Ledger Entry
                  </h3>
                  <LedgerEntryForm
                    entry={selectedEntry}
                    onSuccess={handleEditSuccess}
                    onCancel={() => {
                      setShowEditForm(false);
                      setSelectedEntry(null);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        selectedItems={selectedEntries}
        onClearSelection={clearSelection}
        bulkDeleteFn={bulkDeleteLedgerEntries}
        invalidateQueries={[['generalLedgerEntries']]}
        itemType="ledger entry"
        title="Delete Selected Ledger Entries"
        description="Are you sure you want to delete the selected ledger entries? This action cannot be undone and will remove these transactions from your records."
      />

      {/* Delete Confirmation Dialog */}
      <LedgerDeleteDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteSuccess}
        entry={selectedEntry}
      />

        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      </div>
    </Layout>
  );
};

export default Ledger;