import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { getGeneralLedger } from '../../api/ledger';
import { format } from 'date-fns';
import { XMarkIcon } from '@heroicons/react/24/outline';
import useEscKey from '../../hooks/useEscStack';
import useResizableColumns from '../../hooks/useResizableColumns';
import { LIST_THEAD, LIST_TH, LIST_TH_SORTABLE, LIST_TH_LABEL } from '../common/tableHeaderClasses';
import { typeSignedNet, typeSignedNetLabel } from '../../utils/ledgerBalance';

const DEFAULT_COLUMN_WIDTHS = {
  date: 130,
  description: 260,
  debit: 120,
  credit: 120,
  balance: 130,
};

export default function GeneralLedgerModal({ 
  isOpen, 
  onClose, 
  account 
}) {
  useEscKey(onClose, isOpen, 15);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const { colWidths, renderResizeHandle } = useResizableColumns(
    'cenvoras_general_ledger_modal_col_widths',
    DEFAULT_COLUMN_WIDTHS
  );

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
    if (sortBy !== field) return null;
    return (
      <span className="text-[var(--accent-primary)] font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
    );
  };

  if (!isOpen) return null;

  const entries = ledgerData?.results || [];
  const totalEntries = ledgerData?.count || 0;
  const totalPages = Math.ceil(totalEntries / pageSize);

  // Calculate running balance and totals (liability/equity/revenue nets as Cr)
  let runningBalance = 0;
  const totalDebits = entries.reduce((sum, entry) => sum + (parseFloat(entry.debit) || 0), 0);
  const totalCredits = entries.reduce((sum, entry) => sum + (parseFloat(entry.credit) || 0), 0);
  const pageNet = typeSignedNet(totalDebits, totalCredits, account?.account_type);
  const pageNetLabel = typeSignedNetLabel(pageNet, account?.account_type);
  const accountBalance = Number(account?.current_balance ?? account?.balance);
  const headerBalance = Number.isFinite(accountBalance)
    ? accountBalance
    : pageNet;
  const headerBalanceLabel = typeSignedNetLabel(headerBalance, account?.account_type);
  
  const inputClass = "w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all text-sm";
  const labelClass = "block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl rounded-2xl shadow-2xl animate-fade-up bg-[var(--bg-surface)] border border-[var(--border-default)] max-h-[90vh] flex flex-col overflow-hidden text-[var(--text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              General Ledger
              <span className="text-[var(--text-muted)] font-normal">|</span>
              <span className="text-[var(--accent-primary)]">{account?.name}</span>
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1 flex gap-3">
              <span className="bg-[var(--bg-surface)] py-0.5 px-2 rounded border border-[var(--border-subtle)]">Code: {account?.code}</span>
              <span className="bg-[var(--bg-surface)] py-0.5 px-2 rounded border border-[var(--border-subtle)]">Type: {account?.account_type}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
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
              <div className="flex flex-col gap-1 justify-center h-10 p-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Total:</span>
                  <span className="text-[var(--text-primary)] font-mono">{totalEntries} entries</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Balance:</span>
                  <span className={`font-mono font-bold ${headerBalance >= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'}`}>
                    {formatCurrency(Math.abs(headerBalance))} {headerBalanceLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[var(--bg-surface)]">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
            </div>
          ) : isError ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8 bg-[var(--status-danger)]/15 border border-[var(--status-danger)]/30 rounded-xl">
                <div className="text-[var(--status-danger)] text-lg mb-2 font-bold">Error loading entries</div>
                <div className="text-[var(--text-secondary)] text-sm">{error?.message || 'Something went wrong'}</div>
              </div>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full table-fixed divide-y divide-[var(--border-subtle)] text-sm">
                  <colgroup>
                    <col style={{ width: `${colWidths.date}px` }} />
                    <col style={{ width: `${colWidths.description}px` }} />
                    <col style={{ width: `${colWidths.debit}px` }} />
                    <col style={{ width: `${colWidths.credit}px` }} />
                    <col style={{ width: `${colWidths.balance}px` }} />
                  </colgroup>
                  <thead className={`${LIST_THEAD} sticky top-0 z-10`}>
                    <tr>
                      <th
                        className={LIST_TH_SORTABLE}
                        onClick={() => handleSort('created_at')}
                      >
                        <div className={LIST_TH_LABEL}>
                          <span>Date</span>
                          {getSortIcon('created_at')}
                        </div>
                        {renderResizeHandle('date')}
                      </th>
                      <th className={LIST_TH}>
                        Description
                        {renderResizeHandle('description')}
                      </th>
                      <th
                        className={LIST_TH_SORTABLE}
                        onClick={() => handleSort('debit')}
                      >
                        <div className={LIST_TH_LABEL}>
                          <span>Debit</span>
                          {getSortIcon('debit')}
                        </div>
                        {renderResizeHandle('debit')}
                      </th>
                      <th
                        className={LIST_TH_SORTABLE}
                        onClick={() => handleSort('credit')}
                      >
                        <div className={LIST_TH_LABEL}>
                          <span>Credit</span>
                          {getSortIcon('credit')}
                        </div>
                        {renderResizeHandle('credit')}
                      </th>
                      <th className={LIST_TH}>
                        Balance
                        {renderResizeHandle('balance')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] bg-transparent">
                    {entries.map((entry) => {
                      const debit = parseFloat(entry.debit) || 0;
                      const credit = parseFloat(entry.credit) || 0;
                      runningBalance += typeSignedNet(debit, credit, account?.account_type);
                      const rowLabel = typeSignedNetLabel(runningBalance, account?.account_type);
                      
                      return (
                        <tr key={entry.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-[var(--text-primary)]">
                            {formatDate(entry.created_at)}
                          </td>
                          <td className="px-6 py-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                            <div className="max-w-xs truncate" title={entry.description}>
                              {entry.description || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-[var(--text-primary)] font-mono">
                            {debit > 0 ? (
                              <span className="text-[var(--status-danger)] font-semibold">{formatCurrency(debit)}</span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-[var(--text-primary)] font-mono">
                            {credit > 0 ? (
                              <span className="text-[var(--status-success)] font-semibold">{formatCurrency(credit)}</span>
                            ) : '-'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right font-medium font-mono ${
                            runningBalance >= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'
                          }`}>
                            {formatCurrency(Math.abs(runningBalance))} {rowLabel}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Totals Footer */}
                  <tfoot className="bg-[var(--bg-primary)] border-t-2 border-[var(--border-subtle)] sticky bottom-0 z-10">
                    <tr>
                      <td className="px-6 py-4 text-sm font-bold text-[var(--text-primary)] uppercase" colSpan={2}>
                        Total ({totalEntries} entries)
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-right text-[var(--status-danger)] font-mono">
                        {formatCurrency(totalDebits)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-right text-[var(--status-success)] font-mono">
                        {formatCurrency(totalCredits)}
                      </td>
                      <td className={`px-6 py-4 text-sm font-bold text-right font-mono text-lg ${
                        pageNet >= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'
                      }`}>
                        {formatCurrency(Math.abs(pageNet))} {pageNetLabel}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* No entries */}
              {entries.length === 0 && (
                <div className="flex-1 flex items-center justify-center bg-[var(--bg-surface)]">
                  <div className="text-center py-12">
                     <div className="bg-[var(--bg-primary)] p-4 rounded-full inline-block mb-4 border border-[var(--border-subtle)]">
                        <svg className="mx-auto h-10 w-10 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                     </div>
                    <h3 className="mt-2 text-lg font-bold text-[var(--text-primary)]">No entries found</h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
                      No transactions found for this account in the selected date range.
                    </p>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-[var(--border-subtle)] px-6 py-4 bg-[var(--bg-primary)]">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-[var(--text-secondary)]">
                      Showing <span className="text-[var(--text-primary)] font-medium">{((currentPage - 1) * pageSize) + 1}</span> to <span className="text-[var(--text-primary)] font-medium">{Math.min(currentPage * pageSize, totalEntries)}</span> of <span className="text-[var(--text-primary)] font-medium">{totalEntries}</span> entries
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--bg-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--bg-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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