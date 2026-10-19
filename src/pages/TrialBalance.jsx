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
  asset: { label: 'Assets', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  liability: { label: 'Liabilities', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  equity: { label: 'Equity', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  revenue: { label: 'Revenue', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  expense: { label: 'Expenses', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
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
              className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5"
              title="Back to Reports"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                <ScaleIcon className="w-8 h-8 text-cyan-400" />
                Trial Balance
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Double-entry verification of debit and credit balances
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* As-Of Date Picker */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 gap-2">
            <span className="text-xs text-gray-400 font-medium">As of:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={() => refetch()}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl border border-white/10 transition-all"
            title="Refresh Report"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCsv}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-cyan-400 rounded-xl border border-white/10 transition-all"
            title="Export CSV"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.print()}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl border border-white/10 transition-all"
            title="Print Report"
          >
            <PrinterIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => repairMutation.mutate()}
            disabled={repairMutation.isPending}
            className="p-2.5 bg-white/5 hover:bg-amber-500/10 text-gray-300 hover:text-amber-400 rounded-xl border border-white/10 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            title="Repair Accounting Entries & Round-offs"
          >
            <WrenchScrewdriverIcon className={`w-4 h-4 ${repairMutation.isPending ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isError && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center text-rose-400">
          <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-2 text-rose-400" />
          <h3 className="text-base font-bold text-white mb-1">Failed to load Trial Balance</h3>
          <p className="text-xs text-rose-300/80 mb-4">An error occurred while fetching double-entry account balances.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-semibold hover:bg-rose-600 transition-colors"
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
            className={`bento-card !p-5 border ${
              isBalanced
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-rose-500/30 bg-rose-500/5'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                Ledger State
              </span>
              {isBalanced ? (
                <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 text-rose-400 animate-pulse" />
              )}
            </div>
            <div className={`text-xl font-bold ${isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isBalanced ? 'Balanced' : 'Imbalanced'}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isBalanced ? 'Debits and Credits equal exactly' : `Difference of ${getCurrencySymbol()}${fmt(Math.abs(diff))}`}
            </p>
          </div>

          {/* Total Debits */}
          <div className="bento-card !p-5 border border-white/10">
            <div className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-2">
              Total Debits (Dr)
            </div>
            <div className="text-2xl font-bold text-white">
              {getCurrencySymbol()}{fmt(totalDebits)}
            </div>
            <p className="text-xs text-gray-400 mt-1">All accounts debit sum</p>
          </div>

          {/* Total Credits */}
          <div className="bento-card !p-5 border border-white/10">
            <div className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-2">
              Total Credits (Cr)
            </div>
            <div className="text-2xl font-bold text-white">
              {getCurrencySymbol()}{fmt(totalCredits)}
            </div>
            <p className="text-xs text-gray-400 mt-1">All accounts credit sum</p>
          </div>

          {/* Net Difference */}
          <div className="bento-card !p-5 border border-white/10">
            <div className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-2">
              Dr - Cr Difference
            </div>
            <div className={`text-2xl font-bold ${Math.abs(diff) < 0.01 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {getCurrencySymbol()}{fmt(diff)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Target is {getCurrencySymbol()}0.00</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search account name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Account Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Account Types</option>
            <option value="asset">Assets</option>
            <option value="liability">Liabilities</option>
            <option value="equity">Equity</option>
            <option value="revenue">Revenue</option>
            <option value="expense">Expenses</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 select-none">
          <input
            type="checkbox"
            checked={hideZeroBalances}
            onChange={(e) => setHideZeroBalances(e.target.checked)}
            className="rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-0"
          />
          <span>Hide Zero Balances</span>
        </label>
      </div>

      {/* Main Grouped Tables */}
      {isLoading ? (
        <div className="bento-card p-12 text-center text-gray-400 animate-pulse">
          <ScaleIcon className="w-10 h-10 mx-auto mb-3 opacity-30 animate-spin" />
          Loading Trial Balance...
        </div>
      ) : isError ? (
        <div className="bento-card p-12 text-center text-rose-400">
          <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-3" />
          Failed to load trial balance. Please try again.
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bento-card p-12 text-center text-gray-400">
          <DocumentChartBarIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No accounts matched your filters.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedAccounts).map(([typeKey, items]) => {
            if (!items.length) return null;
            const config = ACCOUNT_TYPE_CONFIG[typeKey] || {
              label: typeKey,
              color: 'text-white',
              bg: 'bg-white/5',
              border: 'border-white/10',
            };
            const isCollapsed = collapsedSections[typeKey];

            const groupDr = items.reduce((s, it) => s + Number(it.debit_total || 0), 0);
            const groupCr = items.reduce((s, it) => s + Number(it.credit_total || 0), 0);

            return (
              <div key={typeKey} className="bento-card overflow-hidden border border-white/10">
                {/* Collapsible Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(typeKey)}
                  className={`w-full px-5 py-3.5 flex items-center justify-between border-b border-white/10 hover:bg-white/[0.02] transition-colors text-left ${config.bg}`}
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={`font-bold text-base ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
                      {items.length} {items.length === 1 ? 'account' : 'accounts'}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-xs tabular-nums">
                    <div>
                      <span className="text-gray-400 mr-1.5">Dr:</span>
                      <span className="font-semibold text-white">{getCurrencySymbol()}{fmt(groupDr)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 mr-1.5">Cr:</span>
                      <span className="font-semibold text-white">{getCurrencySymbol()}{fmt(groupCr)}</span>
                    </div>
                  </div>
                </button>

                {/* Section Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/[0.02] border-b border-white/5 text-gray-400 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-5 font-semibold w-24">Code</th>
                          <th className="py-2.5 px-4 font-semibold">Account Name</th>
                          <th className="py-2.5 px-4 font-semibold text-right w-36">Debit (Dr)</th>
                          <th className="py-2.5 px-4 font-semibold text-right w-36">Credit (Cr)</th>
                          <th className="py-2.5 px-4 font-semibold text-right w-36">Net Balance</th>
                          <th className="py-2.5 px-4 font-semibold text-center w-16">Drill</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {items.map((item) => {
                          const acc = item.account || {};
                          const dr = Number(item.debit_total || 0);
                          const cr = Number(item.credit_total || 0);
                          // Trial balance net side uses raw Dr−Cr (not account-type signed balance).
                          // Liabilities/revenue are credit-normal; their signed `balance` is flipped vs Dr/Cr.
                          const netDrCr = dr - cr;
                          const netLabel = netDrCr >= 0 ? 'Dr' : 'Cr';

                          return (
                            <tr key={acc.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="py-3 px-5 font-mono text-cyan-400 font-medium">
                                {acc.code || '—'}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-white">{acc.name}</div>
                                {acc.description && (
                                  <div className="text-[11px] text-gray-500 line-clamp-1">{acc.description}</div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-medium text-white">
                                {dr > 0.001 ? `${getCurrencySymbol()}${fmt(dr)}` : '—'}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-medium text-white">
                                {cr > 0.001 ? `${getCurrencySymbol()}${fmt(cr)}` : '—'}
                              </td>
                              <td className={`py-3 px-4 text-right font-mono font-semibold ${netDrCr >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {getCurrencySymbol()}{fmt(Math.abs(netDrCr))} {netLabel}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Link
                                  to={`/ledger?account=${acc.id}`}
                                  className="p-1.5 inline-flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors border border-transparent hover:border-cyan-500/20"
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
          <div className="bento-card !p-5 border border-white/20 bg-white/[0.02] flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <ScaleIcon className="w-6 h-6 text-cyan-400" />
              <div>
                <span className="font-bold text-white text-base">Grand Totals</span>
                <p className="text-xs text-gray-400">Sum of all general ledger accounts</p>
              </div>
            </div>

            <div className="flex items-center gap-8 text-sm tabular-nums font-mono">
              <div>
                <span className="text-xs text-gray-400 block uppercase tracking-wider mb-0.5">Debits</span>
                <span className="font-bold text-white text-base">{getCurrencySymbol()}{fmt(totalDebits)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block uppercase tracking-wider mb-0.5">Credits</span>
                <span className="font-bold text-white text-base">{getCurrencySymbol()}{fmt(totalCredits)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block uppercase tracking-wider mb-0.5">Diff</span>
                <span className={`font-bold text-base ${isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
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
