import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGeneralLedgerEntries } from '../../api/ledger';
import Loader from '../Loader';
import { format } from 'date-fns';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  ArrowsUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { getAccounts } from '../../api/ledger';
import { subDays } from 'date-fns';

const LedgerTable = ({ onEdit, onDelete, selectedEntries = [], onBulkSelect }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  
  const itemsPerPage = 20;

  // Fetch accounts for filter dropdown
  const { data: accountsData } = useQuery({
    queryKey: ['accounts', { search: '', page: 1, page_size: 1000 }],
    queryFn: () => getAccounts({ search: '', page: 1, page_size: 1000 }),
  });

  const accounts = accountsData?.results || [];

  const {
    data: ledgerData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['generalLedgerEntries', {
      description: searchTerm,
      date_from: dateFilter?.startDate,
      date_to: dateFilter?.endDate,
      account: selectedAccount,
      page: currentPage,
      page_size: itemsPerPage,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy
    }],
    queryFn: () => getGeneralLedgerEntries({
      description: searchTerm,
      date_from: dateFilter?.startDate,
      date_to: dateFilter?.endDate,
      account: selectedAccount,
      page: currentPage,
      page_size: itemsPerPage,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy
    }),
  });

  const ledgerEntries = ledgerData?.entries || [];
  const totalCount = ledgerData?.count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Bulk selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allEntryIds = ledgerEntries.map(entry => entry.id);
      onBulkSelect && onBulkSelect([...new Set([...selectedEntries, ...allEntryIds])]);
    } else {
      const currentPageIds = ledgerEntries.map(entry => entry.id);
      onBulkSelect && onBulkSelect(selectedEntries.filter(id => !currentPageIds.includes(id)));
    }
  };

  const handleSelectEntry = (entryId, isSelected) => {
    if (isSelected) {
      onBulkSelect && onBulkSelect([...selectedEntries, entryId]);
    } else {
      onBulkSelect && onBulkSelect(selectedEntries.filter(id => id !== entryId));
    }
  };

  const isAllCurrentPageSelected = ledgerEntries.length > 0 && 
    ledgerEntries.every(entry => selectedEntries.includes(entry.id));

  const isSomeCurrentPageSelected = ledgerEntries.some(entry => selectedEntries.includes(entry.id));

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <ArrowsUpDownIcon className="w-4 h-4 text-gray-500 ml-1 inline" />;
    }
    return sortOrder === 'asc' ? 
      <ChevronUpIcon className="w-4 h-4 text-cyan-400 ml-1 inline" /> : 
      <ChevronDownIcon className="w-4 h-4 text-cyan-400 ml-1 inline" />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) return '-';
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return '-';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bento-card">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="bg-red-500/20 p-3 rounded-full mb-3">
            <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            Error loading entries
          </h3>
          <p className="text-sm text-red-300 mb-4">
            {error?.message || 'Failed to fetch ledger data'}
          </p>
          <button
            onClick={() => refetch()}
            className="btn-secondary text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 shadow-lg rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        {/* Filters Toolbar */}
        <div className="flex flex-wrap gap-2 mb-6">
          <input
            className="border border-white/30 rounded px-3 py-1.5 text-sm bg-white/10 backdrop-filter backdrop-blur-10 text-white placeholder-white/70 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 min-w-[200px]"
            placeholder="Search descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="border border-white/30 rounded px-3 py-1.5 text-sm bg-white/10 backdrop-filter backdrop-blur-10 text-white focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
          >
            <option value="" className="bg-[#1a2341] text-white">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id} className="bg-[#1a2341] text-white">
                {account.code} - {account.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFilter.startDate}
            onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
            className="border border-white/30 rounded px-3 py-1.5 text-sm bg-white/10 backdrop-filter backdrop-blur-10 text-white focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
          />
          <input
            type="date"
            value={dateFilter.endDate}
            onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
            className="border border-white/30 rounded px-3 py-1.5 text-sm bg-white/10 backdrop-filter backdrop-blur-10 text-white focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
          />
          <button
            onClick={() => {
               setSearchTerm('');
               setSelectedAccount('');
               setDateFilter({
                 startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                 endDate: format(new Date(), 'yyyy-MM-dd')
               });
            }}
            className="px-3 py-1.5 bg-gray-500/30 text-white border border-gray-300/50 rounded hover:bg-gray-500/50 transition text-sm backdrop-filter backdrop-blur-10 drop-shadow-lg"
          >
            Clear Filters
          </button>
        </div>

        {ledgerEntries.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white/5 p-4 rounded-full inline-block mb-4">
               <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
            </div>
            <h3 className="mt-2 text-lg font-bold text-white">No ledger entries</h3>
            <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto">
              No entries found matching your criteria. Try adjusting your filters or record a new payment.
            </p>
          </div>
        ) : (
          <>
            {/* Table for desktop, Cards for mobile */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    {onBulkSelect && (
                      <th scope="col" className="relative px-6 py-4">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-white/30 text-[#7fd3f7] focus:ring-[#7fd3f7] bg-white/10"
                          checked={isAllCurrentPageSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isSomeCurrentPageSelected && !isAllCurrentPageSelected;
                          }}
                          onChange={handleSelectAll}
                        />
                      </th>
                    )}
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('date')}
                    >
                      Date {getSortIcon('date')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('account_name')}
                    >
                      Account {getSortIcon('account_name')}
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Reference
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('debit')}
                    >
                      Debit {getSortIcon('debit')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('credit')}
                    >
                      Credit {getSortIcon('credit')}
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Source
                    </th>
                    <th scope="col" className="relative px-6 py-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="backdrop-filter backdrop-blur-10 bg-transparent divide-y divide-white/10">
                  {ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/10 transition-colors">
                      {onBulkSelect && (
                        <td className="relative px-6 py-4 whitespace-nowrap text-sm text-white">
                          <input
                            type="checkbox"
                            className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-white/30 text-[#7fd3f7] focus:ring-[#7fd3f7] bg-white/10 backdrop-filter backdrop-blur-10"
                            checked={selectedEntries.includes(entry.id)}
                            onChange={(e) => handleSelectEntry(entry.id, e.target.checked)}
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm  text-white drop-shadow-lg">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm  text-white drop-shadow-lg">
                          {entry.account_code} - {entry.account_name}
                        </div>
                        <div className="text-xs text-cyan-300  capitalize">
                          {entry.account_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm  text-white drop-shadow-lg">
                        {entry.reference || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        <div className="max-w-xs truncate  drop-shadow-lg" title={entry.description}>
                          {entry.description || 'General Ledger Entry'}
                        </div>
                        <div className="text-xs text-cyan-300 ">
                          <span>Created: {formatDate(entry.created_at)}</span>
                          {entry.entry_number && (
                            <span className="ml-2">Entry #{entry.entry_number}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className={` drop-shadow-lg text-lg ${entry.debit > 0 ? 'text-red-300' : 'text-white'}`}>
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                        </div>
                        {entry.debit > 0 && (
                          <div className="text-xs text-cyan-300 ">
                            Debit
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className={` drop-shadow-lg text-lg ${entry.credit > 0 ? 'text-green-300' : 'text-white'}`}>
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                        </div>
                        {entry.credit > 0 && (
                          <div className="text-xs text-cyan-300 ">
                            Credit
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {entry.sales_invoice_number && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-blue-400/40 text-blue-100 backdrop-filter backdrop-blur-10 border-2 border-blue-300 mr-2 drop-shadow-lg">
                            📄 Sales #{entry.sales_invoice_number}
                          </span>
                        )}
                        {entry.purchase_bill_number && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-orange-400/40 text-orange-100 backdrop-filter backdrop-blur-10 border-2 border-orange-300 mr-2 drop-shadow-lg">
                            🧾 Purchase #{entry.purchase_bill_number}
                          </span>
                        )}
                        {!entry.sales_invoice_number && !entry.purchase_bill_number && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-400/40 text-green-100 backdrop-filter backdrop-blur-10 border-2 border-green-300 drop-shadow-lg">
                            📝 Manual Entry
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => onEdit && onEdit(entry)}
                            className="text-white dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 p-1 rounded"
                            title="Edit entry"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDelete && onDelete(entry)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded"
                            title="Delete entry"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            </div>

            {/* Mobile Card Layout */}
            <div className="lg:hidden space-y-4">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10 p-4 animate-pulse">
                    <div className="h-4 bg-white/20 rounded mb-2"></div>
                    <div className="h-3 bg-white/10 rounded mb-2"></div>
                    <div className="h-3 bg-white/10 rounded w-3/4"></div>
                  </div>
                ))
              ) : (
                ledgerEntries.map((entry, index) => (
                  <div key={entry.id} className="bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-300">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedEntries.includes(entry.id)}
                          onChange={(e) => {
                            const newSelected = e.target.checked
                              ? [...selectedEntries, entry.id]
                              : selectedEntries.filter(id => id !== entry.id);
                            onBulkSelect(newSelected);
                          }}
                          className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10"
                        />
                        <div>
                          <div className="text-lg font-semibold text-white">
                            {entry.customer_name || entry.customer?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-white/70">
                            {formatDate(entry.date)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/70">Account:</span>
                        <span className="text-sm font-medium text-white">{entry.account_name || entry.account?.name || 'N/A'}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/70">Description:</span>
                        <span className="text-sm text-white text-right">{entry.description || 'N/A'}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/70">Amount:</span>
                        <span className={`text-lg font-semibold ${
                          entry.entry_type === 'credit' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {entry.entry_type === 'credit' ? '+' : '-'}₹{Number(entry.amount || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/70">Balance:</span>
                        <span className="text-sm font-medium text-[#7fd3f7]">
                          ₹{Number(entry.running_balance || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex space-x-2 mt-4 pt-3 border-t border-white/10">
                      <button
                        onClick={() => onEdit(entry)}
                        className="flex-1 px-3 py-2 bg-indigo-500/30 text-white border border-indigo-300/50 rounded-lg hover:bg-indigo-500/50 transition backdrop-filter backdrop-blur-10 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(entry)}
                        className="flex-1 px-3 py-2 bg-red-500/30 text-white border border-red-300/50 rounded-lg hover:bg-red-500/50 transition backdrop-filter backdrop-blur-10 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* No data message for mobile */}
              {!isLoading && ledgerEntries.length === 0 && (
                <div className="p-8 text-center text-white/80">
                  <p>No ledger entries found.</p>
                  <p className="text-sm mt-2">
                    Click "Record Payment" to create your first ledger entry.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white/5 px-4 py-3 flex items-center justify-between border-t border-white/10 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium rounded-md text-gray-300 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium rounded-md text-gray-300 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      Showing{' '}
                      <span className="font-bold text-white">{(currentPage - 1) * itemsPerPage + 1}</span>
                      {' '}to{' '}
                      <span className="font-bold text-white">
                        {Math.min(currentPage * itemsPerPage, totalCount)}
                      </span>
                      {' '}of{' '}
                      <span className="font-bold text-white">{totalCount}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-white/10 bg-white/5 text-sm font-medium text-gray-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      
                      {[...Array(Math.min(5, totalPages))].map((_, index) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = index + 1;
                        } else if (currentPage <= 3) {
                          pageNum = index + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + index;
                        } else {
                          pageNum = currentPage - 2 + index;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-indigo-500/20 border-indigo-500 text-indigo-300'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-white/10 bg-white/5 text-sm font-medium text-gray-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LedgerTable;