import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGeneralLedger } from '../../api/ledger';
import { format } from 'date-fns';

export default function GeneralLedgerModal({ 
  isOpen, 
  onClose, 
  account 
}) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch general ledger entries
  const { 
    data: ledgerData, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['general-ledger', account?.id, dateFrom, dateTo, currentPage, pageSize, sortBy, sortOrder],
    queryFn: () => getGeneralLedger(account.id, {
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: currentPage,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy
    }),
    enabled: Boolean(isOpen && account?.id)
  });

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
      if (isNaN(date.getTime())) return '-';
      return format(date, 'dd/MM/yyyy HH:mm');
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return '-';
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
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

  if (!isOpen) return null;

  const entries = ledgerData?.results || [];
  const totalEntries = ledgerData?.count || 0;
  const totalPages = Math.ceil(totalEntries / pageSize);

  // Calculate running balance and totals
  let runningBalance = 0;
  const totalDebits = entries.reduce((sum, entry) => sum + (parseFloat(entry.debit) || 0), 0);
  const totalCredits = entries.reduce((sum, entry) => sum + (parseFloat(entry.credit) || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              General Ledger - {account?.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Account Code: {account?.code} | Type: {account?.account_type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Items per Page
              </label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Summary
              </label>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div>Total: {totalEntries} entries</div>
                <div>Balance: {formatCurrency(totalDebits - totalCredits)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : isError ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-500 text-lg mb-2">Error loading entries</div>
                <div className="text-gray-500">{error?.message || 'Something went wrong'}</div>
              </div>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Date</span>
                          {getSortIcon('created_at')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Description
                      </th>
                      <th 
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('debit')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Debit</span>
                          {getSortIcon('debit')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('credit')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Credit</span>
                          {getSortIcon('credit')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {entries.map((entry) => {
                      const debit = parseFloat(entry.debit) || 0;
                      const credit = parseFloat(entry.credit) || 0;
                      runningBalance += debit - credit;
                      
                      return (
                        <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(entry.created_at)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            <div className="max-w-xs truncate" title={entry.description}>
                              {entry.description || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                            {debit > 0 ? formatCurrency(debit) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                            {credit > 0 ? formatCurrency(credit) : '-'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                            runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(runningBalance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Totals Footer */}
                  <tfoot className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white" colSpan={2}>
                        Total ({totalEntries} entries)
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-right text-gray-900 dark:text-white">
                        {formatCurrency(totalDebits)}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-right text-gray-900 dark:text-white">
                        {formatCurrency(totalCredits)}
                      </td>
                      <td className={`px-6 py-3 text-sm font-bold text-right ${
                        (totalDebits - totalCredits) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(totalDebits - totalCredits)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* No entries */}
              {entries.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No entries found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      No transactions found for this account in the selected date range.
                    </p>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}