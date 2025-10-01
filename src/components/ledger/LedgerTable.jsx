import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGeneralLedgerEntries } from '../../api/ledger';
import Loader from '../Loader';
import { format } from 'date-fns';

const LedgerTable = ({ searchTerm, dateFilter, accountFilter, onEdit, onDelete, selectedEntries = [], onBulkSelect }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const itemsPerPage = 20;

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
      account: accountFilter,
      page: currentPage,
      page_size: itemsPerPage,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy
    }],
    queryFn: () => getGeneralLedgerEntries({
      description: searchTerm,
      date_from: dateFilter?.startDate,
      date_to: dateFilter?.endDate,
      account: accountFilter,
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
      return '↕️';
    }
    return sortOrder === 'asc' ? '↑' : '↓';
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
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error loading ledger entries
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error?.message || 'Failed to fetch ledger data'}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => refetch()}
                className="bg-red-100 dark:bg-red-800 px-3 py-2 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 shadow-lg rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium text-white dark:text-white">
            Ledger Entries
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total: {totalCount} entries
          </div>
        </div>

        {ledgerEntries.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No ledger entries</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No entries found matching your criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-[#7fd3f7]/10 to-[#b6e0f7]/10 backdrop-blur-10">
                  <tr>
                    {onBulkSelect && (
                      <th scope="col" className="relative px-6 py-3">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-white/30 text-[#7fd3f7] focus:ring-[#7fd3f7] bg-white/10 backdrop-filter backdrop-blur-10"
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
                      className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 drop-shadow-lg"
                      onClick={() => handleSort('date')}
                    >
                      Date {getSortIcon('date')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 drop-shadow-lg"
                      onClick={() => handleSort('account_name')}
                    >
                      Account {getSortIcon('account_name')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-wider drop-shadow-lg">
                      Reference
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-wider drop-shadow-lg">
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-black text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 drop-shadow-lg"
                      onClick={() => handleSort('debit')}
                    >
                      Debit {getSortIcon('debit')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-black text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 drop-shadow-lg"
                      onClick={() => handleSort('credit')}
                    >
                      Credit {getSortIcon('credit')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-wider drop-shadow-lg">
                      Source
                    </th>
                    <th scope="col" className="relative px-6 py-3">
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="backdrop-filter backdrop-blur-10 bg-white/5 px-4 py-3 flex items-center justify-between border-t border-white/10 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-md text-white bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed backdrop-filter backdrop-blur-10"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-md text-white bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed backdrop-filter backdrop-blur-10"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-white  drop-shadow-lg">
                      Showing{' '}
                      <span className="font-black text-cyan-300">{(currentPage - 1) * itemsPerPage + 1}</span>
                      {' '}to{' '}
                      <span className="font-black text-cyan-300">
                        {Math.min(currentPage * itemsPerPage, totalCount)}
                      </span>
                      {' '}of{' '}
                      <span className="font-black text-cyan-300">{totalCount}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
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
                                ? 'z-10 bg-indigo-50 dark:bg-indigo-900 border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-200'
                                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
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