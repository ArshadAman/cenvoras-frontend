import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { getGeneralLedger } from '../../api/ledger';
import { format } from 'date-fns';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  
  const inputClass = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-6xl bento-card !p-0 shadow-2xl shadow-purple-900/20 animate-fade-up bg-[#09090b] border border-white/10 max-h-[90vh] flex flex-col rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              General Ledger
              <span className="text-gray-400 font-normal">|</span>
              <span className="text-blue-400">{account?.name}</span>
            </h2>
            <p className="text-sm text-gray-400 mt-1 flex gap-3">
              <span className="bg-white/5 py-0.5 px-2 rounded border border-white/10">Code: {account?.code}</span>
              <span className="bg-white/5 py-0.5 px-2 rounded border border-white/10">Type: {account?.account_type}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-white/10 bg-[#111]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className={labelClass}>
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Items per Page
              </label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={inputClass}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Summary
              </label>
              <div className="flex flex-col gap-1 justify-center h-10 p-2 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-white font-mono">{totalEntries} entries</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Balance:</span>
                  <span className={`font-mono font-bold ${totalDebits - totalCredits >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(totalDebits - totalCredits)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[#09090b]">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : isError ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="text-red-400 text-lg mb-2 font-bold">Error loading entries</div>
                <div className="text-gray-400 text-sm">{error?.message || 'Something went wrong'}</div>
              </div>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead className="bg-[#111] sticky top-0 z-10">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Date</span>
                          {getSortIcon('created_at')}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th 
                        className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort('debit')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Debit</span>
                          {getSortIcon('debit')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort('credit')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Credit</span>
                          {getSortIcon('credit')}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-transparent">
                    {entries.map((entry) => {
                      const debit = parseFloat(entry.debit) || 0;
                      const credit = parseFloat(entry.credit) || 0;
                      runningBalance += debit - credit;
                      
                      return (
                        <tr key={entry.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-white/90 group-hover:text-white">
                            {formatDate(entry.created_at)}
                          </td>
                          <td className="px-6 py-4 text-white/80 group-hover:text-white">
                            <div className="max-w-xs truncate" title={entry.description}>
                              {entry.description || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-white/90 font-mono">
                            {debit > 0 ? (
                              <span className="text-red-400">{formatCurrency(debit)}</span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-white/90 font-mono">
                            {credit > 0 ? (
                              <span className="text-green-400">{formatCurrency(credit)}</span>
                            ) : '-'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right font-medium font-mono ${
                            runningBalance >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(runningBalance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Totals Footer */}
                  <tfoot className="bg-[#111] border-t-2 border-white/10 sticky bottom-0 z-10">
                    <tr>
                      <td className="px-6 py-4 text-sm font-bold text-white uppercase" colSpan={2}>
                        Total ({totalEntries} entries)
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-right text-red-400 font-mono">
                        {formatCurrency(totalDebits)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-right text-green-400 font-mono">
                        {formatCurrency(totalCredits)}
                      </td>
                      <td className={`px-6 py-4 text-sm font-bold text-right font-mono text-lg ${
                        (totalDebits - totalCredits) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(totalDebits - totalCredits)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* No entries */}
              {entries.length === 0 && (
                <div className="flex-1 flex items-center justify-center bg-[#09090b]">
                  <div className="text-center py-12">
                     <div className="bg-white/5 p-4 rounded-full inline-block mb-4">
                        <svg className="mx-auto h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                     </div>
                    <h3 className="mt-2 text-lg font-bold text-white">No entries found</h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                      No transactions found for this account in the selected date range.
                    </p>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-white/10 px-6 py-4 bg-[#111]">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Showing <span className="text-white font-medium">{((currentPage - 1) * pageSize) + 1}</span> to <span className="text-white font-medium">{Math.min(currentPage * pageSize, totalEntries)}</span> of <span className="text-white font-medium">{totalEntries}</span> entries
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    </div>,
    document.body
  );
}