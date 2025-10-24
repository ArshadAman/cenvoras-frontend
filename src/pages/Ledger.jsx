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
import { PlusIcon} from '@heroicons/react/24/outline';

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
      <div className="min-h-screen bg-gradient-to-br from-[#1a2341] via-[#1a2341] to-[#0d1421] p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Page Header */}
        <header className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Client Ledger
                </h1>
                <p className="mt-1 text-sm text-[#b6e0f7]">
                  Track client payments and account balances
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] text-[#1a2341] text-sm font-medium rounded-xl shadow-lg hover:from-[#b6e0f7] hover:to-[#eaf6fa] transform hover:scale-105 transition-all duration-200"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-white mb-4">
              Filters
            </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-[#b6e0f7]">
                Search
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[#7fd3f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 backdrop-filter backdrop-blur-10 bg-white/10 border border-white/20 rounded-lg leading-5 text-white placeholder-[#b6e0f7] focus:outline-none focus:placeholder-white/50 focus:ring-2 focus:ring-[#7fd3f7] focus:border-[#7fd3f7] sm:text-sm"
                  placeholder="Search descriptions..."
                />
              </div>
            </div>

            {/* Account Filter */}
            <div>
              <label htmlFor="account-filter" className="block text-sm font-medium text-[#b6e0f7]">
                Account
              </label>
              <select
                id="account-filter"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base backdrop-filter backdrop-blur-10 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#7fd3f7] focus:border-[#7fd3f7] sm:text-sm"
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
              <label htmlFor="date-from" className="block text-sm font-medium text-[#b6e0f7]">
                From Date
              </label>
              <input
                type="date"
                id="date-from"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 backdrop-filter backdrop-blur-10 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#7fd3f7] focus:border-[#7fd3f7] sm:text-sm"
              />
            </div>

            {/* Date To */}
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-[#b6e0f7]">
                To Date
              </label>
              <input
                type="date"
                id="date-to"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 backdrop-filter backdrop-blur-10 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#7fd3f7] focus:border-[#7fd3f7] sm:text-sm"
              />
            </div>
          </div>
          
          {/* Clear Filters Button */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 backdrop-filter backdrop-blur-10 bg-white/10 border border-white/20 rounded-lg text-sm leading-4 font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-[#7fd3f7] transition-all duration-200"
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
          <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
            <div className="px-4 py-3 sm:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-white">
                    {selectedEntries.length} {selectedEntries.length === 1 ? 'entry' : 'entries'} selected
                  </span>
                </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={clearSelection}
                  className="inline-flex items-center px-3 py-2 backdrop-filter backdrop-blur-10 bg-white/10 border border-white/20 rounded-lg text-sm leading-4 font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-[#7fd3f7] transition-all duration-200"
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm leading-4 font-medium hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
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

      {/* Ledger Entries Section */}
      <div className="mb-6">
        {/* Ledger Table */}
        <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 rounded-2xl shadow-lg overflow-hidden">
          <LedgerTable
            searchTerm={searchTerm}
            dateFilter={dateFilter}
            accountFilter={selectedAccount}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            selectedEntries={selectedEntries}
            onBulkSelect={handleBulkSelect}
          />
        </div>
      </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-[#1a2341] opacity-90 backdrop-blur-md"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom backdrop-filter backdrop-blur-20 bg-gradient-to-br from-[#1a2341]/95 to-[#0d1421]/95 border border-[#7fd3f7]/30 rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="backdrop-filter backdrop-blur-10 bg-white/10 rounded-lg text-[#b6e0f7] hover:text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-[#7fd3f7] transition-all duration-200"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-white mb-4">
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
              <div className="absolute inset-0 bg-[#1a2341] opacity-90 backdrop-blur-md"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom backdrop-filter backdrop-blur-20 bg-gradient-to-br from-[#1a2341]/95 to-[#0d1421]/95 border border-[#7fd3f7]/30 rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setSelectedEntry(null);
                  }}
                  className="backdrop-filter backdrop-blur-10 bg-white/10 rounded-lg text-[#b6e0f7] hover:text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-[#7fd3f7] transition-all duration-200"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-white mb-4">
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
    </Layout>
  );
};

export default Ledger;