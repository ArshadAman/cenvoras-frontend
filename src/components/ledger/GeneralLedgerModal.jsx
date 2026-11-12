import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { getGeneralLedger } from '../../api/ledger';
import { format } from 'date-fns';
import { XMarkIcon } from '@heroicons/react/24/outline';
import useEscKey from '../../hooks/useEscStack';
import useResizableColumns from '../../hooks/useResizableColumns';
import { LIST_THEAD, LIST_TH, LIST_TH_SORTABLE, LIST_TH_LABEL } from '../common/tableHeaderClasses';
import { typeSignedNet, typeSignedNetLabel } from '../../utils/ledgerBalance';
import DateInputField from '../common/DateInputField';

const DEFAULT_COLUMN_WIDTHS = {
  date: 110,
  party: 160,
  document: 140,
  reference: 130,
  description: 220,
  debit: 110,
  credit: 110,
  balance: 130,
};

const cellClip = 'overflow-hidden text-ellipsis whitespace-nowrap min-w-0 max-w-full';

function documentLabel(entry) {
  if (entry?.sales_invoice_number) return entry.sales_invoice_number;
  if (entry?.purchase_bill_number) return entry.purchase_bill_number;
  if (entry?.credit_note_number) return entry.credit_note_number;
  if (entry?.debit_note_number) return entry.debit_note_number;
  const ref = (entry?.reference || '').trim();
  if (ref) return ref;
  if (entry?.payment) return 'Payment';
  return 'Journal';
}

function partyLabel(entry) {
  return entry?.customer_name || entry?.vendor_name || '—';
}

export default function GeneralLedgerModal({
  isOpen,
  onClose,
  account,
  dateTo: dateToProp = '',
}) {
  useEscKey(onClose, isOpen, 15);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(dateToProp || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const { colWidths, renderResizeHandle } = useResizableColumns(
    'cenvoras_general_ledger_modal_col_widths_v2',
    DEFAULT_COLUMN_WIDTHS
  );

  useEffect(() => {
    if (!isOpen) return;
    setDateFrom('');
    setDateTo(dateToProp || '');
    setCurrentPage(1);
    setSortBy('date');
    setSortOrder('desc');
  }, [isOpen, account?.id, dateToProp]);

  const {
    data: ledgerData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['general-ledger', account?.id, dateFrom, dateTo],
    queryFn: () => getGeneralLedger(account.id, {
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    enabled: Boolean(isOpen && account?.id),
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
      return format(date, 'dd/MM/yyyy');
    } catch {
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

  const allEntries = useMemo(() => {
    const raw = ledgerData?.entries || ledgerData?.results || [];
    return Array.isArray(raw) ? raw : [];
  }, [ledgerData]);

  const entriesWithBalance = useMemo(() => {
    const chronological = [...allEntries].sort((a, b) => {
      const da = String(a.date || a.created_at || '');
      const db = String(b.date || b.created_at || '');
      if (da === db) return String(a.id).localeCompare(String(b.id));
      return da.localeCompare(db);
    });
    let running = 0;
    return chronological.map((entry) => {
      const debit = parseFloat(entry.debit) || 0;
      const credit = parseFloat(entry.credit) || 0;
      running += typeSignedNet(debit, credit, account?.account_type);
      return { ...entry, _running: running };
    });
  }, [allEntries, account?.account_type]);

  const sortedEntries = useMemo(() => {
    const list = [...entriesWithBalance];
    const dir = sortOrder === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (sortBy === 'debit' || sortBy === 'credit') {
        return ((parseFloat(a[sortBy]) || 0) - (parseFloat(b[sortBy]) || 0)) * dir;
      }
      const av = String(a[sortBy] || a.date || '');
      const bv = String(b[sortBy] || b.date || '');
      return av.localeCompare(bv) * dir;
    });
    return list;
  }, [entriesWithBalance, sortBy, sortOrder]);

  const totalEntries = sortedEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const pageEntries = sortedEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalDebits = allEntries.reduce((sum, entry) => sum + (parseFloat(entry.debit) || 0), 0);
  const totalCredits = allEntries.reduce((sum, entry) => sum + (parseFloat(entry.credit) || 0), 0);
  const pageNet = typeSignedNet(totalDebits, totalCredits, account?.account_type);
  const pageNetLabel = typeSignedNetLabel(pageNet, account?.account_type);

  const apiBalance = ledgerData?.balance?.balance;
  const accountBalance = Number(
    apiBalance ?? account?.current_balance ?? account?.balance ?? pageNet
  );
  const headerBalance = Number.isFinite(accountBalance) ? accountBalance : pageNet;
  const headerBalanceLabel = typeSignedNetLabel(headerBalance, account?.account_type);

  if (!isOpen) return null;

  const inputClass = "w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all text-sm";
  const labelClass = "block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-6xl rounded-2xl shadow-2xl animate-fade-up bg-[var(--bg-surface)] border border-[var(--border-default)] max-h-[90vh] flex flex-col overflow-hidden text-[var(--text-primary)]">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3 min-w-0">
              General Ledger
              <span className="text-[var(--text-muted)] font-normal">|</span>
              <span className={`${cellClip} text-[var(--accent-primary)]`} title={account?.name}>{account?.name}</span>
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1 flex gap-3">
              <span className="bg-[var(--bg-surface)] py-0.5 px-2 rounded border border-[var(--border-subtle)]">Code: {account?.code}</span>
              <span className="bg-[var(--bg-surface)] py-0.5 px-2 rounded border border-[var(--border-subtle)] capitalize">Type: {account?.account_type}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors shrink-0"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className={labelClass}>From Date</label>
              <DateInputField
                name="date_from"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div>
              <label className={labelClass}>To Date</label>
              <DateInputField
                name="date_to"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div>
              <label className={labelClass}>Items per Page</label>
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
              <label className={labelClass}>Summary</label>
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
              <div className="flex-1 overflow-auto">
                <table className="w-full table-fixed divide-y divide-[var(--border-subtle)] text-sm">
                  <colgroup>
                    <col style={{ width: `${colWidths.date}px` }} />
                    <col style={{ width: `${colWidths.party}px` }} />
                    <col style={{ width: `${colWidths.document}px` }} />
                    <col style={{ width: `${colWidths.reference}px` }} />
                    <col style={{ width: `${colWidths.description}px` }} />
                    <col style={{ width: `${colWidths.debit}px` }} />
                    <col style={{ width: `${colWidths.credit}px` }} />
                    <col style={{ width: `${colWidths.balance}px` }} />
                  </colgroup>
                  <thead className={`${LIST_THEAD} sticky top-0 z-10`}>
                    <tr>
                      <th className={LIST_TH_SORTABLE} onClick={() => handleSort('date')}>
                        <div className={LIST_TH_LABEL}>
                          <span>Date</span>
                          {getSortIcon('date')}
                        </div>
                        {renderResizeHandle('date')}
                      </th>
                      <th className={LIST_TH}>
                        Party
                        {renderResizeHandle('party')}
                      </th>
                      <th className={LIST_TH}>
                        Document
                        {renderResizeHandle('document')}
                      </th>
                      <th className={LIST_TH}>
                        Reference
                        {renderResizeHandle('reference')}
                      </th>
                      <th className={LIST_TH}>
                        Description
                        {renderResizeHandle('description')}
                      </th>
                      <th className={LIST_TH_SORTABLE} onClick={() => handleSort('debit')}>
                        <div className={LIST_TH_LABEL}>
                          <span>Debit</span>
                          {getSortIcon('debit')}
                        </div>
                        {renderResizeHandle('debit')}
                      </th>
                      <th className={LIST_TH_SORTABLE} onClick={() => handleSort('credit')}>
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
                    {pageEntries.map((entry) => {
                      const debit = parseFloat(entry.debit) || 0;
                      const credit = parseFloat(entry.credit) || 0;
                      const running = entry._running || 0;
                      const rowLabel = typeSignedNetLabel(running, account?.account_type);
                      const party = partyLabel(entry);
                      const doc = documentLabel(entry);
                      const ref = (entry.reference || '').trim() || '—';

                      return (
                        <tr key={entry.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors group">
                          <td className={`px-4 py-3 text-[var(--text-primary)] ${cellClip}`}>
                            {formatDate(entry.date || entry.created_at)}
                          </td>
                          <td className={`px-4 py-3 text-[var(--text-primary)] ${cellClip}`} title={party}>
                            {party}
                          </td>
                          <td className={`px-4 py-3 font-mono text-[var(--accent-primary)] ${cellClip}`} title={doc}>
                            {doc}
                          </td>
                          <td className={`px-4 py-3 text-[var(--text-secondary)] ${cellClip}`} title={ref}>
                            {ref}
                          </td>
                          <td className={`px-4 py-3 text-[var(--text-secondary)] ${cellClip}`} title={entry.description || ''}>
                            {entry.description || '—'}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono ${cellClip}`}>
                            {debit > 0 ? (
                              <span className="text-[var(--status-danger)] font-semibold">{formatCurrency(debit)}</span>
                            ) : '—'}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono ${cellClip}`}>
                            {credit > 0 ? (
                              <span className="text-[var(--status-success)] font-semibold">{formatCurrency(credit)}</span>
                            ) : '—'}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium font-mono ${cellClip} ${
                            running >= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'
                          }`}>
                            {formatCurrency(Math.abs(running))} {rowLabel}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-[var(--bg-primary)] border-t-2 border-[var(--border-subtle)] sticky bottom-0 z-10">
                    <tr>
                      <td className="px-4 py-3 text-sm font-bold text-[var(--text-primary)] uppercase" colSpan={5}>
                        Total ({totalEntries} entries)
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-right text-[var(--status-danger)] font-mono">
                        {formatCurrency(totalDebits)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-right text-[var(--status-success)] font-mono">
                        {formatCurrency(totalCredits)}
                      </td>
                      <td className={`px-4 py-3 text-sm font-bold text-right font-mono ${
                        pageNet >= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'
                      }`}>
                        {formatCurrency(Math.abs(pageNet))} {pageNetLabel}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {totalEntries === 0 && (
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

              {totalEntries > pageSize && (
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
                        onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage >= totalPages}
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
