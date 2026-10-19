import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { getTrialBalance, repairRoundOffEntries } from '../api/ledger';
import { getCurrencySymbol, formatCurrency } from '../utils/currency';
import { getTodayKolkata } from '../utils/date';
import { toast } from 'react-toastify';
import {
  ScaleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftIcon,
  FunnelIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';

const fmt = (v) =>
  parseFloat(v || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const ACCOUNT_TYPE_CONFIG = {
  asset: { label: 'Assets', color: 'text-[var(--status-info)]', bg: 'bg-[var(--status-info)]/10', border: 'border-[var(--status-info)]/20' },
  liability: { label: 'Liabilities', color: 'text-[var(--status-warning)]', bg: 'bg-[var(--status-warning)]/10', border: 'border-[var(--status-warning)]/20' },
  equity: { label: 'Equity', color: 'text-[var(--accent-primary)]', bg: 'bg-[var(--accent-primary)]/10', border: 'border-[var(--accent-primary)]/20' },
  revenue: { label: 'Revenue', color: 'text-[var(--status-success)]', bg: 'bg-[var(--status-success)]/10', border: 'border-[var(--status-success)]/20' },
  expense: { label: 'Expenses', color: 'text-[var(--status-danger)]', bg: 'bg-[var(--status-danger)]/10', border: 'border-[var(--status-danger)]/20' },
};

export default function TrialBalance() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [asOfDate, setAsOfDate] = useState(getTodayKolkata());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [hideZeroBalances, setHideZeroBalances] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState({});

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['trialBalance', asOfDate],
    queryFn: () => getTrialBalance(asOfDate),
  });

  const repairMutation = useMutation({
    mutationFn: repairRoundOffEntries,
    onSuccess: (res) => {
      toast.success(res?.message || 'Accounting entries and round-offs repaired successfully');
      queryClient.invalidateQueries({ queryKey: ['trialBalance'] });
      queryClient.invalidateQueries({ queryKey: ['balanceSheet'] });
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to run repair');
    },
  });

  const accounts = useMemo(() => data?.accounts || [], [data]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((item) => {
      const acc = item.account || {};
      const type = (acc.account_type || '').toLowerCase();
      const code = (acc.code || '').toLowerCase();
      const name = (acc.name || '').toLowerCase();
      const s = searchTerm.toLowerCase();

      const matchesSearch = !s || code.includes(s) || name.includes(s);
      const matchesType = selectedType === 'all' || type === selectedType;
      const isNonZero = !hideZeroBalances || (Math.abs(item.debit_total || 0) > 0.001 || Math.abs(item.credit_total || 0) > 0.001 || Math.abs(item.balance || 0) > 0.001);

      return matchesSearch && matchesType && isNonZero;
    });
  }, [accounts, searchTerm, selectedType, hideZeroBalances]);

  // Group accounts by account_type
  const groupedAccounts = useMemo(() => {
    const groups = {
      asset: [],
      liability: [],
      equity: [],
      revenue: [],
      expense: [],
    };

    filteredAccounts.forEach((acc) => {
      const type = (acc.account?.account_type || 'asset').toLowerCase();
      if (!groups[type]) groups[type] = [];
      groups[type].push(acc);
    });

    return groups;
  }, [filteredAccounts]);

  const toggleSection = (type) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleExportCsv = () => {
    if (!accounts.length) {
      toast.info('No accounts to export');
      return;
    }

    const headers = ['Account Code', 'Account Name', 'Type', 'Debit (Dr)', 'Credit (Cr)', 'Net Balance'];
    const rows = filteredAccounts.map((item) => [
      `"${item.account?.code || ''}"`,
      `"${item.account?.name || ''}"`,
      `"${item.account?.account_type || ''}"`,
      Number(item.debit_total || 0).toFixed(2),
      Number(item.credit_total || 0).toFixed(2),
      Number(item.balance || 0).toFixed(2),
    ]);

    rows.push([
      '"TOTAL"',
      '""',
      '""',
      Number(data?.total_debits || 0).toFixed(2),
      Number(data?.total_credits || 0).toFixed(2),
      Number(data?.difference || 0).toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trial_balance_${asOfDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Never show Balanced while a fetch is in flight (incl. date changes / refetch)
  const reportReady = !isLoading && !isFetching && !isError && !!data;
  const isBalanced = reportReady && (data?.is_balanced ?? Math.abs(Number(data?.difference || 0)) < 0.01);
  const totalDebits = Number(data?.total_debits || 0);
  const totalCredits = Number(data?.total_credits || 0);
  const diff = Number(data?.difference || 0);

  return (
    <div className="p-6 md:p-10 space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/reports"
              className="p-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl transition-all border border-[var(--border-subtle)]"
              title="Back to Reports"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                <ScaleIcon className="w-8 h-8 text-[var(--accent-primary)]" />
                Trial Balance
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-0.5">
                Double-entry verification of debit and credit balances
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* As-Of Date Picker */}
          <div className="flex items-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-1.5 gap-2">
            <span className="text-xs text-[var(--text-secondary)] font-medium">As of:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="bg-transparent text-[var(--text-primary)] text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={() => refetch()}
            className="p-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl border border-[var(--border-subtle)] transition-all"
            title="Refresh Report"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCsv}
            className="p-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] rounded-xl border border-[var(--border-subtle)] transition-all"
            title="Export CSV"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.print()}
            className="p-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl border border-[var(--border-subtle)] transition-all"
            title="Print Report"
          >
            <PrinterIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => repairMutation.mutate()}
            disabled={repairMutation.isPending}
            className="p-2.5 bg-[var(--bg-surface)] hover:bg-[var(--status-warning)]/10 text-[var(--text-secondary)] hover:text-[var(--status-warning)] rounded-xl border border-[var(--border-subtle)] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            title="Repair Accounting Entries & Round-offs"
          >
            <WrenchScrewdriverIcon className={`w-4 h-4 ${repairMutation.isPending ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isError && (
        <div className="bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30 rounded-2xl p-6 text-center text-[var(--status-danger)]">
          <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-2 text-[var(--status-danger)]" />
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Failed to load Trial Balance</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-4">An error occurred while fetching double-entry account balances.</p>
          <button
            onClick={() => refetch()}
            className="btn-danger text-xs px-4 py-2 inline-block"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      {reportReady && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status Card */}
          <div
            className={`bg-[var(--bg-surface)] border rounded-2xl p-5 shadow-sm ${
              isBalanced
                ? 'border-[var(--status-success)]/30 bg-[var(--status-success)]/5'
                : 'border-[var(--status-danger)]/30 bg-[var(--status-danger)]/5'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
                Ledger State
              </span>
              {isBalanced ? (
                <CheckCircleIcon className="w-5 h-5 text-[var(--status-success)]" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 text-[var(--status-danger)] animate-pulse" />
              )}
            </div>
            <div className={`text-xl font-bold ${isBalanced ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'}`}>
              {isBalanced ? 'Balanced' : 'Imbalanced'}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {isBalanced ? 'Debits and Credits equal exactly' : `Difference of ${getCurrencySymbol()}${fmt(Math.abs(diff))}`}
            </p>
          </div>

          {/* Total Debits */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-2">
              Total Debits (Dr)
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {getCurrencySymbol()}{fmt(totalDebits)}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">All accounts debit sum</p>
          </div>

          {/* Total Credits */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-2">
              Total Credits (Cr)
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {getCurrencySymbol()}{fmt(totalCredits)}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">All accounts credit sum</p>
          </div>

          {/* Net Difference */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-2">
              Dr - Cr Difference
            </div>
            <div className={`text-2xl font-bold ${Math.abs(diff) < 0.01 ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'}`}>
              {getCurrencySymbol()}{fmt(diff)}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">Target is {getCurrencySymbol()}0.00</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 rounded-2xl">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search account name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          {/* Account Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          >
            <option value="all" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">All Account Types</option>
            <option value="asset" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Assets</option>
            <option value="liability" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Liabilities</option>
            <option value="equity" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Equity</option>
            <option value="revenue" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Revenue</option>
            <option value="expense" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Expenses</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-secondary)] select-none">
          <input
            type="checkbox"
            checked={hideZeroBalances}
            onChange={(e) => setHideZeroBalances(e.target.checked)}
            className="rounded border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--accent-primary)] focus:ring-0"
          />
          <span>Hide Zero Balances</span>
        </label>
      </div>

      {/* Main Grouped Tables */}
      {isLoading ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-12 text-center text-[var(--text-muted)] animate-pulse">
          <ScaleIcon className="w-10 h-10 mx-auto mb-3 opacity-30 animate-spin" />
          Loading Trial Balance...
        </div>
      ) : isError ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-12 text-center text-[var(--status-danger)]">
          <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-3" />
          Failed to load trial balance. Please try again.
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-12 text-center text-[var(--text-muted)]">
          <DocumentChartBarIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No accounts matched your filters.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedAccounts).map(([typeKey, items]) => {
            if (!items.length) return null;
            const config = ACCOUNT_TYPE_CONFIG[typeKey] || {
              label: typeKey,
              color: 'text-[var(--text-primary)]',
              bg: 'bg-[var(--bg-primary)]',
              border: 'border-[var(--border-subtle)]',
            };
            const isCollapsed = collapsedSections[typeKey];

            const groupDr = items.reduce((s, it) => s + Number(it.debit_total || 0), 0);
            const groupCr = items.reduce((s, it) => s + Number(it.credit_total || 0), 0);

            return (
              <div key={typeKey} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-sm">
                {/* Collapsible Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(typeKey)}
                  className={`w-full px-5 py-3.5 flex items-center justify-between border-b border-[var(--border-subtle)] hover:bg-[var(--bg-primary)]/50 transition-colors text-left ${config.bg}`}
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRightIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                    )}
                    <span className={`font-bold text-base ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]">
                      {items.length} {items.length === 1 ? 'account' : 'accounts'}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-xs tabular-nums">
                    <div>
                      <span className="text-[var(--text-secondary)] mr-1.5">Dr:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{getCurrencySymbol()}{fmt(groupDr)}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] mr-1.5">Cr:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{getCurrencySymbol()}{fmt(groupCr)}</span>
                    </div>
                  </div>
                </button>

                {/* Section Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-5 font-semibold w-24">Code</th>
                          <th className="py-2.5 px-4 font-semibold">Account Name</th>
                          <th className="py-2.5 px-4 font-semibold text-right w-36">Debit (Dr)</th>
                          <th className="py-2.5 px-4 font-semibold text-right w-36">Credit (Cr)</th>
                          <th className="py-2.5 px-4 font-semibold text-right w-36">Net Balance</th>
                          <th className="py-2.5 px-4 font-semibold text-center w-16">Drill</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {items.map((item) => {
                          const acc = item.account || {};
                          const dr = Number(item.debit_total || 0);
                          const cr = Number(item.credit_total || 0);
                          // Trial balance net side uses raw Dr−Cr (not account-type signed balance).
                          // Liabilities/revenue are credit-normal; their signed `balance` is flipped vs Dr/Cr.
                          const netDrCr = dr - cr;
                          const netLabel = netDrCr >= 0 ? 'Dr' : 'Cr';

                          return (
                            <tr key={acc.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors group">
                              <td className="py-3 px-5 font-mono text-[var(--accent-primary)] font-semibold">
                                {acc.code || '—'}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-[var(--text-primary)]">{acc.name}</div>
                                {acc.description && (
                                  <div className="text-[11px] text-[var(--text-muted)] line-clamp-1">{acc.description}</div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-medium text-[var(--text-primary)]">
                                {dr > 0.001 ? `${getCurrencySymbol()}${fmt(dr)}` : '—'}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-medium text-[var(--text-primary)]">
                                {cr > 0.001 ? `${getCurrencySymbol()}${fmt(cr)}` : '—'}
                              </td>
                              <td className={`py-3 px-4 text-right font-mono font-semibold ${netDrCr >= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-warning)]'}`}>
                                {getCurrencySymbol()}{fmt(Math.abs(netDrCr))} {netLabel}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Link
                                  to={`/ledger?account=${acc.id}`}
                                  className="p-1.5 inline-flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-colors border border-transparent hover:border-[var(--accent-primary)]/20"
                                  title={`View general ledger for ${acc.name}`}
                                >
                                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {/* Grand Totals Footer */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <ScaleIcon className="w-6 h-6 text-[var(--accent-primary)]" />
              <div>
                <span className="font-bold text-[var(--text-primary)] text-base">Grand Totals</span>
                <p className="text-xs text-[var(--text-secondary)]">Sum of all general ledger accounts</p>
              </div>
            </div>

            <div className="flex items-center gap-8 text-sm tabular-nums font-mono">
              <div>
                <span className="text-xs text-[var(--text-secondary)] block uppercase tracking-wider mb-0.5">Debits</span>
                <span className="font-bold text-[var(--text-primary)] text-base">{getCurrencySymbol()}{fmt(totalDebits)}</span>
              </div>
              <div>
                <span className="text-xs text-[var(--text-secondary)] block uppercase tracking-wider mb-0.5">Credits</span>
                <span className="font-bold text-[var(--text-primary)] text-base">{getCurrencySymbol()}{fmt(totalCredits)}</span>
              </div>
              <div>
                <span className="text-xs text-[var(--text-secondary)] block uppercase tracking-wider mb-0.5">Diff</span>
                <span className={`font-bold text-base ${isBalanced ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'}`}>
                  {getCurrencySymbol()}{fmt(diff)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
