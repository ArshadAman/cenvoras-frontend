import StockWarningBanner from '../../components/reports/StockWarningBanner';
import React, { useState } from "react";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import { getTodayKolkata } from '../../utils/date';
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

const today = getTodayKolkata();
const fmt = (v) => {
  const n = parseFloat(v || 0);
  const abs = Math.abs(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `${abs} (contra)` : abs;
};

// Collapsible sub-group within a section
function SubGroup({ label, items = [], total, color }) {
  const [open, setOpen] = useState(true);
  if (!items.length) return null;
  return (
    <div className="border-b border-[var(--border-subtle)]/50 last:border-0">
      <button
        className="w-full flex items-center justify-between px-5 py-2.5 text-sm hover:bg-[var(--bg-primary)]/40 transition-colors text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2 text-[var(--text-secondary)] font-semibold">
          {open ? (
            <ChevronDownIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          ) : (
            <ChevronRightIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
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
              className="flex justify-between items-center py-1.5 border-b border-[var(--border-subtle)]/30 last:border-0 group"
            >
              <div>
                <span className="text-[var(--text-primary)] text-sm">{item.name}</span>
                {item.code && (
                  <span className="ml-2 text-xs text-[var(--text-muted)] font-mono">
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
      <div className={`px-5 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center ${bg}`}>
        <h3 className="text-[var(--text-primary)] font-bold text-base flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${bg} border border-[var(--border-subtle)]`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          {title}
        </h3>
        <span className={`text-xl font-extrabold tabular-nums ${color}`}>
          {getCurrencySymbol()}{fmt(total)}
        </span>
      </div>

      {/* Table Header */}
      <div className="flex justify-between px-5 py-2 bg-[var(--bg-primary)]/40 border-b border-[var(--border-subtle)]/50">
        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Account</span>
        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Amount</span>
      </div>

      {/* Rows */}
      {subGroups ? (
        <>
          {subGroups.map((sg, i) => (
            <SubGroup key={i} {...sg} color={color} />
          ))}
        </>
      ) : items.length === 0 && !extra ? (
        <div className="px-5 py-8 text-center text-[var(--text-muted)] text-sm">No entries</div>
      ) : (
        <div className="divide-y divide-[var(--border-subtle)]/50">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onRowClick && onRowClick(item)}
              className="w-full flex justify-between items-center px-5 py-3 hover:bg-[var(--bg-primary)]/40 transition-colors text-left"
            >
              <div>
                <span className="text-[var(--text-primary)] text-sm">{item.name}</span>
                {item.code && (
                  <span className="ml-2 text-xs text-[var(--text-muted)] font-mono">[{item.code}]</span>
                )}
              </div>
              <span className={`text-sm font-semibold ${color}`}>{getCurrencySymbol()}{fmt(item.amount)}</span>
            </button>
          ))}
          {extra && (
            <div className="flex justify-between items-center px-5 py-3 bg-[var(--bg-primary)]/40 border-t border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)] text-sm italic">{extra.label}</span>
              <span className={`text-sm font-semibold ${extra.amount >= 0 ? "text-[var(--status-success)]" : "text-[var(--status-danger)]"}`}>
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
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
        >
          <span className="p-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg group-hover:border-[var(--accent-primary)]/40 transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
          </span>
          <ChartBarIcon className="w-3.5 h-3.5" />
          Back to Reports
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1 flex items-center gap-3">
              <ScaleIcon className="w-8 h-8 text-[var(--accent-primary)]" />
              Balance Sheet
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">Assets = Liabilities + Equity · Financial position at a point in time</p>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">As of Date</label>
              <input
                type="date"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
                className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Balanced / Unbalanced Banner */}
        {data && (
          <div
            className={`rounded-2xl border px-6 py-4 flex flex-col md:flex-row items-start md:items-center gap-4 ${
              isBalanced
                ? "bg-[var(--status-success)]/10 border-[var(--status-success)]/30"
                : "bg-[var(--status-danger)]/10 border-[var(--status-danger)]/30"
            }`}
          >
            <div className={`p-3 rounded-xl ${isBalanced ? "bg-[var(--status-success)]/15" : "bg-[var(--status-danger)]/15"}`}>
              {isBalanced ? (
                <CheckCircleIcon className="w-8 h-8 text-[var(--status-success)]" />
              ) : (
                <XCircleIcon className="w-8 h-8 text-[var(--status-danger)]" />
              )}
            </div>
            <div className="flex-1">
              <div className={`text-lg font-bold ${isBalanced ? "text-[var(--status-success)]" : "text-[var(--status-danger)]"}`}>
                {isBalanced ? "✓ Balanced" : "⚠ Unbalanced"}
              </div>
              <div className="text-sm text-[var(--text-secondary)] mt-0.5 mb-2">
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
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[var(--status-warning)]/20 text-[var(--status-warning)] hover:bg-[var(--status-warning)]/30 text-xs font-semibold rounded-lg border border-[var(--status-warning)]/40 transition-colors disabled:opacity-50"
                  >
                    <WrenchScrewdriverIcon className="w-3.5 h-3.5" />
                    {repairMutation.isPending ? "Repairing..." : "Fix Round-Off Entries"}
                  </button>
                  <Link to="/ledger/manual-journal" className="inline-block px-4 py-1.5 bg-[var(--status-danger)]/20 text-[var(--status-danger)] hover:bg-[var(--status-danger)]/30 text-xs font-semibold rounded-lg border border-[var(--status-danger)]/40 transition-colors">
                    Create Adjusting Journal Entry
                  </Link>
                </div>
              )}
            </div>
            {/* Mini Equation */}
            <div className="flex items-center gap-3 text-center shrink-0 bg-[var(--bg-primary)]/60 rounded-xl px-5 py-3 border border-[var(--border-subtle)]">
              <div>
                <div className="text-xs text-[var(--text-secondary)] mb-1">Assets</div>
                <div className="text-base font-bold text-[var(--status-info)] tabular-nums">{getCurrencySymbol()}{fmt(data.assets?.total)}</div>
              </div>
              <div className="text-[var(--text-secondary)] font-mono font-bold text-lg">=</div>
              <div>
                <div className="text-xs text-[var(--text-secondary)] mb-1">Liabilities</div>
                <div className="text-base font-bold text-[var(--status-danger)] tabular-nums">{getCurrencySymbol()}{fmt(data.liabilities?.total)}</div>
              </div>
              <div className="text-[var(--text-secondary)] font-mono font-bold text-lg">+</div>
              <div>
                <div className="text-xs text-[var(--text-secondary)] mb-1">Equity</div>
                <div className="text-base font-bold text-[var(--status-success)] tabular-nums">{getCurrencySymbol()}{fmt(data.equity?.total)}</div>
              </div>
            </div>
          </div>
        )}

        <StockWarningBanner inventory={data?.inventory} />

        {isLoading ? (
          <div className="bento-card p-12 text-center">
            <div className="w-8 h-8 border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin mx-auto mb-3" />
            <div className="text-[var(--text-muted)] text-sm">Generating balance sheet...</div>
          </div>
        ) : !data ? (
          <div className="bento-card p-12 text-center text-[var(--text-muted)]">No data available for the selected date.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Assets */}
            <Section
              title="Assets"
              icon={BuildingLibraryIcon}
              color="text-[var(--status-info)]"
              bg="bg-[var(--status-info)]/10"
              items={data.assets?.items || []}
              total={data.assets?.total}
              onRowClick={setSelectedAccount}
            />

            {/* Right: Liabilities + Equity stacked */}
            <div className="space-y-6">
              <Section
                title="Liabilities"
                icon={ScaleIcon}
                color="text-[var(--status-danger)]"
                bg="bg-[var(--status-danger)]/10"
                items={data.liabilities?.items || []}
                total={data.liabilities?.total}
                onRowClick={setSelectedAccount}
              />
              <Section
                title="Equity"
                icon={BanknotesIcon}
                color="text-[var(--status-success)]"
                bg="bg-[var(--status-success)]/10"
                items={data.equity?.items || []}
                total={data.equity?.total}
                extra={{
                  label: "Retained Earnings (Current-year net profit)",
                  amount: data.equity?.retained_earnings,
                }}
                onRowClick={setSelectedAccount}
              />
            </div>
          </div>
        )}

        {selectedAccount && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl">
              <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{selectedAccount.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Ledger breakdown as of {asOf || "current"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAccount(null)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]/50 transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="overflow-auto max-h-[65vh]">
                {accountDetailLoading ? (
                  <div className="p-8 text-center text-[var(--text-muted)]">Loading account details...</div>
                ) : !accountDetail ? (
                  <div className="p-8 text-center text-[var(--text-muted)]">Unable to load account details.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40">
                      <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                        <div className="text-xs text-[var(--text-secondary)]">Total Debit</div>
                        <div className="text-sm font-semibold text-[var(--text-primary)] mt-1">{getCurrencySymbol()}{fmt(accountDetail.totals?.debit)}</div>
                      </div>
                      <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                        <div className="text-xs text-[var(--text-secondary)]">Total Credit</div>
                        <div className="text-sm font-semibold text-[var(--text-primary)] mt-1">{getCurrencySymbol()}{fmt(accountDetail.totals?.credit)}</div>
                      </div>
                      <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                        <div className="text-xs text-[var(--text-secondary)]">Net Balance</div>
                        <div className="text-sm font-semibold text-[var(--status-success)] mt-1">{getCurrencySymbol()}{fmt(accountDetail.totals?.net_balance)}</div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs uppercase tracking-wider bg-[var(--bg-primary)]">
                            <th className="p-3 font-medium">Date</th>
                            <th className="p-3 font-medium">Description</th>
                            <th className="p-3 font-medium">Reference</th>
                            <th className="p-3 font-medium text-right">Debit</th>
                            <th className="p-3 font-medium text-right">Credit</th>
                            <th className="p-3 font-medium text-right">Running Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]/50">
                          {accountDetail.entries?.length ? (
                            accountDetail.entries.map((entry) => (
                              <tr key={entry.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                                <td className="p-3 text-[var(--text-secondary)] text-sm">{entry.date}</td>
                                <td className="p-3 text-[var(--text-primary)] text-sm">{entry.description}</td>
                                <td className="p-3 text-[var(--text-secondary)] text-xs font-mono">{entry.reference || "-"}</td>
                                <td className="p-3 text-right text-[var(--status-info)] text-sm">{getCurrencySymbol()}{fmt(entry.debit)}</td>
                                <td className="p-3 text-right text-[var(--status-danger)] text-sm">{getCurrencySymbol()}{fmt(entry.credit)}</td>
                                <td className="p-3 text-right text-[var(--status-success)] text-sm font-semibold">{getCurrencySymbol()}{fmt(entry.running_balance)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-[var(--text-muted)]">No ledger entries for this account and date.</td>
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
