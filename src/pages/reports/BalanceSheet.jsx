import React, { useState } from "react";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBalanceSheet, getBalanceSheetAccountDetail } from "../../api/gst";
import { repairRoundOffEntries } from "../../api/ledger";
import { toast } from "react-toastify";
import {
  BuildingLibraryIcon,
  ScaleIcon,
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

const today = new Date().toISOString().split("T")[0];
const fmt = (v) =>
  parseFloat(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Collapsible sub-group within a section
function SubGroup({ label, items = [], total, color }) {
  const [open, setOpen] = useState(true);
  if (!items.length) return null;
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        className="w-full flex items-center justify-between px-5 py-2.5 text-sm hover:bg-white/[0.02] transition-colors text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2 text-gray-300 font-semibold">
          {open ? (
            <ChevronDownIcon className="w-3.5 h-3.5 text-gray-500" />
          ) : (
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-500" />
          )}
          {label}
        </span>
        <span className={`font-bold text-sm ${color}`}>{getCurrencySymbol()}{fmt(total)}</span>
      </button>
      {open && (
        <div className="pl-8 pr-5 pb-1">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-1.5 border-b border-white/[0.03] last:border-0 group"
            >
              <div>
                <span className="text-white text-sm">{item.name}</span>
                {item.code && (
                  <span className="ml-2 text-xs text-gray-500 font-mono">
                    [{item.code}]
                  </span>
                )}
              </div>
              <span className={`text-sm font-semibold ${color}`}>
                {getCurrencySymbol()}{fmt(item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Full section card (Assets / Liabilities / Equity)
function Section({ title, icon: Icon, color, bg, items = [], total, extra, subGroups, onRowClick }) {
  return (
    <div className="bento-card overflow-hidden">
      {/* Section Header */}
      <div className={`px-5 py-4 border-b border-white/10 flex justify-between items-center ${bg}`}>
        <h3 className="text-white font-bold text-base flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${bg} border border-white/10`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          {title}
        </h3>
        <span className={`text-xl font-extrabold tabular-nums ${color}`}>
          {getCurrencySymbol()}{fmt(total)}
        </span>
      </div>

      {/* Table Header */}
      <div className="flex justify-between px-5 py-2 bg-white/[0.02] border-b border-white/5">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Account</span>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount</span>
      </div>

      {/* Rows */}
      {subGroups ? (
        <>
          {subGroups.map((sg, i) => (
            <SubGroup key={i} {...sg} color={color} />
          ))}
        </>
      ) : items.length === 0 && !extra ? (
        <div className="px-5 py-8 text-center text-gray-500 text-sm">No entries</div>
      ) : (
        <div className="divide-y divide-white/5">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onRowClick && onRowClick(item)}
              className="w-full flex justify-between items-center px-5 py-3 hover:bg-white/[0.02] transition-colors text-left"
            >
              <div>
                <span className="text-white text-sm">{item.name}</span>
                {item.code && (
                  <span className="ml-2 text-xs text-gray-500 font-mono">[{item.code}]</span>
                )}
              </div>
              <span className={`text-sm font-semibold ${color}`}>{getCurrencySymbol()}{fmt(item.amount)}</span>
            </button>
          ))}
          {extra && (
            <div className="flex justify-between items-center px-5 py-3 bg-white/[0.02] border-t border-white/10">
              <span className="text-gray-300 text-sm italic">{extra.label}</span>
              <span className={`text-sm font-semibold ${extra.amount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {getCurrencySymbol()}{fmt(extra.amount)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BalanceSheet() {
  const [asOf, setAsOf] = useState(today);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["balance-sheet", asOf],
    queryFn: () => getBalanceSheet(asOf),
  });

  const repairMutation = useMutation({
    mutationFn: repairRoundOffEntries,
    onSuccess: (d) => {
      toast.success(d.message || "Round-off entries repaired.");
      queryClient.invalidateQueries({ queryKey: ["balance-sheet"] });
    },
    onError: () => toast.error("Failed to repair round-off entries."),
  });

  const isBalanced = data?.is_balanced;
  const diff = data?.difference;

  const { data: accountDetail, isLoading: accountDetailLoading } = useQuery({
    queryKey: ["balance-sheet-account-detail", selectedAccount?.id, asOf],
    queryFn: () => getBalanceSheetAccountDetail(selectedAccount.id, asOf),
    enabled: Boolean(selectedAccount?.id),
  });

  return (
    <>
      <div className="p-6 md:p-10 space-y-6 animate-fade-up">
        {/* Back to Reports */}
        <Link
          to="/reports"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
        >
          <span className="p-1.5 bg-white/5 border border-white/10 rounded-lg group-hover:bg-white/10 transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
          </span>
          <ChartBarIcon className="w-3.5 h-3.5" />
          Back to Reports
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
              <ScaleIcon className="w-8 h-8 text-indigo-400" />
              Balance Sheet
            </h1>
            <p className="text-gray-400 text-sm">Assets = Liabilities + Equity · Financial position at a point in time</p>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">As of Date</label>
              <input
                type="date"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Balanced / Unbalanced Banner */}
        {data && (
          <div
            className={`rounded-2xl border px-6 py-4 flex flex-col md:flex-row items-start md:items-center gap-4 ${
              isBalanced
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-rose-500/10 border-rose-500/30"
            }`}
          >
            <div className={`p-3 rounded-xl ${isBalanced ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
              {isBalanced ? (
                <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
              ) : (
                <XCircleIcon className="w-8 h-8 text-rose-400" />
              )}
            </div>
            <div className="flex-1">
              <div className={`text-lg font-bold ${isBalanced ? "text-emerald-400" : "text-rose-400"}`}>
                {isBalanced ? "✓ Balanced" : "⚠ Unbalanced"}
              </div>
              <div className="text-sm text-gray-400 mt-0.5 mb-2">
                {isBalanced
                  ? "Assets equal Liabilities + Equity. Your books are in order."
                  : `Difference of ${getCurrencySymbol()}${fmt(diff)} detected. Review your ledger entries for missing transactions.`}
              </div>
              {!isBalanced && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => repairMutation.mutate()}
                    disabled={repairMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold rounded-lg border border-amber-500/30 transition-colors disabled:opacity-50"
                  >
                    <WrenchScrewdriverIcon className="w-3.5 h-3.5" />
                    {repairMutation.isPending ? "Repairing..." : "Fix Round-Off Entries"}
                  </button>
                  <Link to="/ledger/manual-journal" className="inline-block px-4 py-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold rounded-lg border border-rose-500/30 transition-colors">
                    Create Adjusting Journal Entry
                  </Link>
                </div>
              )}
            </div>
            {/* Mini Equation */}
            <div className="flex items-center gap-3 text-center shrink-0 bg-white/5 rounded-xl px-5 py-3 border border-white/10">
              <div>
                <div className="text-xs text-gray-500 mb-1">Assets</div>
                <div className="text-base font-bold text-blue-400 tabular-nums">{getCurrencySymbol()}{fmt(data.assets?.total)}</div>
              </div>
              <div className="text-gray-600 font-bold">=</div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Liabilities</div>
                <div className="text-base font-bold text-rose-400 tabular-nums">{getCurrencySymbol()}{fmt(data.liabilities?.total)}</div>
              </div>
              <div className="text-gray-600 font-bold">+</div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Equity</div>
                <div className="text-base font-bold text-emerald-400 tabular-nums">{getCurrencySymbol()}{fmt(data.equity?.total)}</div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="bento-card p-12 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full animate-spin mx-auto mb-3" />
            <div className="text-gray-500 text-sm">Generating balance sheet...</div>
          </div>
        ) : !data ? (
          <div className="bento-card p-12 text-center text-gray-500">No data available for the selected date.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Assets */}
            <Section
              title="Assets"
              icon={BuildingLibraryIcon}
              color="text-blue-400"
              bg="bg-blue-500/5"
              items={data.assets?.items || []}
              total={data.assets?.total}
              onRowClick={setSelectedAccount}
            />

            {/* Right: Liabilities + Equity stacked */}
            <div className="space-y-6">
              <Section
                title="Liabilities"
                icon={ScaleIcon}
                color="text-rose-400"
                bg="bg-rose-500/5"
                items={data.liabilities?.items || []}
                total={data.liabilities?.total}
                onRowClick={setSelectedAccount}
              />
              <Section
                title="Equity"
                icon={BanknotesIcon}
                color="text-emerald-400"
                bg="bg-emerald-500/5"
                items={data.equity?.items || []}
                total={data.equity?.total}
                extra={{
                  label: "Retained Earnings (Net Profit)",
                  amount: data.equity?.retained_earnings,
                }}
                onRowClick={setSelectedAccount}
              />
            </div>
          </div>
        )}

        {selectedAccount && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0f1017]">
              <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedAccount.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">Ledger breakdown as of {asOf || "current"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAccount(null)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-white/20 text-gray-300 hover:text-white hover:bg-white/5"
                >
                  Close
                </button>
              </div>

              <div className="overflow-auto max-h-[65vh]">
                {accountDetailLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading account details...</div>
                ) : !accountDetail ? (
                  <div className="p-8 text-center text-gray-500">Unable to load account details.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border-b border-white/10 bg-white/[0.02]">
                      <div className="rounded-lg border border-white/10 p-3">
                        <div className="text-xs text-gray-400">Total Debit</div>
                        <div className="text-sm font-semibold text-white mt-1">{getCurrencySymbol()}{fmt(accountDetail.totals?.debit)}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 p-3">
                        <div className="text-xs text-gray-400">Total Credit</div>
                        <div className="text-sm font-semibold text-white mt-1">{getCurrencySymbol()}{fmt(accountDetail.totals?.credit)}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 p-3">
                        <div className="text-xs text-gray-400">Net Balance</div>
                        <div className="text-sm font-semibold text-emerald-400 mt-1">{getCurrencySymbol()}{fmt(accountDetail.totals?.net_balance)}</div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400 text-xs uppercase bg-white/5">
                            <th className="p-3 font-medium">Date</th>
                            <th className="p-3 font-medium">Description</th>
                            <th className="p-3 font-medium">Reference</th>
                            <th className="p-3 font-medium text-right">Debit</th>
                            <th className="p-3 font-medium text-right">Credit</th>
                            <th className="p-3 font-medium text-right">Running Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {accountDetail.entries?.length ? (
                            accountDetail.entries.map((entry) => (
                              <tr key={entry.id} className="hover:bg-white/[0.03]">
                                <td className="p-3 text-gray-300 text-sm">{entry.date}</td>
                                <td className="p-3 text-white text-sm">{entry.description}</td>
                                <td className="p-3 text-gray-400 text-xs">{entry.reference || "-"}</td>
                                <td className="p-3 text-right text-blue-300 text-sm">{getCurrencySymbol()}{fmt(entry.debit)}</td>
                                <td className="p-3 text-right text-rose-300 text-sm">{getCurrencySymbol()}{fmt(entry.credit)}</td>
                                <td className="p-3 text-right text-emerald-300 text-sm font-semibold">{getCurrencySymbol()}{fmt(entry.running_balance)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-gray-500">No ledger entries for this account and date.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
