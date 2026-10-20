import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getGSTR3BSummary } from '../../api/gst';
import { getCurrencySymbol } from '../../utils/currency';
import { getKolkataMonthBounds } from '../../utils/date';
import { toast } from 'react-toastify';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  CurrencyRupeeIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

const fmt = (v) =>
  parseFloat(v || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function GSTR3B() {
  const { from: defaultFrom, to: defaultTo } = getKolkataMonthBounds();

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'table_3_1', 'table_3_2', 'table_4', 'table_6_1'

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['gstr3bSummary', fromDate, toDate],
    queryFn: () => getGSTR3BSummary(fromDate, toDate),
  });

  const handleExportJson = () => {
    if (!data) {
      toast.info('No data available to export');
      return;
    }

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `GSTR3B_${data.gstin || 'EXPORT'}_${data.fp || 'PERIOD'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const payment = data?.table_6_1_payment || {};
  const t31 = data?.table_3_1 || {};
  const t311 = data?.table_3_1_1 || {};
  const t32 = data?.table_3_2 || [];
  const t4 = data?.table_4_itc || {};
  const t5 = data?.table_5_exempt || {};
  const t51 = data?.table_5_1_interest || {};

  return (
    <div className="p-6 md:p-10 space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/gst"
            className="p-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl transition-all border border-[var(--border-subtle)]"
            title="Back to GST Dashboard"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
              <DocumentTextIcon className="w-8 h-8 text-[var(--accent-primary)]" />
              GSTR-3B Summary
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-0.5">
              Monthly summary return for outward supplies, input tax credit, and tax payment
            </p>
          </div>
        </div>

        {/* Action Controls & Date Pickers */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-1.5 gap-2">
            <span className="text-xs text-[var(--text-secondary)] font-medium">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-[var(--text-primary)] text-xs focus:outline-none"
            />
            <span className="text-xs text-[var(--text-secondary)] font-medium">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-[var(--text-primary)] text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={() => refetch()}
            className="p-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl border border-[var(--border-subtle)] transition-all"
            title="Refresh Data"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportJson}
            className="p-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] rounded-xl border border-[var(--border-subtle)] transition-all"
            title="Export GSTR-3B JSON"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.print()}
            className="p-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl border border-[var(--border-subtle)] transition-all"
            title="Print Summary"
          >
            <PrinterIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Taxpayer Meta Pill */}
      {data && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs uppercase font-bold text-[var(--text-muted)] tracking-wider">GSTIN</span>
              <div className="text-[var(--text-primary)] font-mono font-bold">{data.gstin || 'NOT REGISTERED'}</div>
            </div>
            <div className="h-8 w-px bg-[var(--border-subtle)] hidden sm:block" />
            <div>
              <span className="text-xs uppercase font-bold text-[var(--text-muted)] tracking-wider">Legal Name</span>
              <div className="text-[var(--text-primary)] font-medium">{data.legal_name || 'Business'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 px-3 py-1 rounded-full font-mono font-semibold">
              Period: {data.fp || 'MMYYYY'}
            </span>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Net Cash Tax Liability */}
        <div className="bento-card !p-5 border border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
              Tax Payable in Cash
            </span>
            <CurrencyRupeeIcon className="w-5 h-5 text-[var(--status-danger)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--status-danger)]">
            {getCurrencySymbol()}{fmt(payment.total_tax_paid_cash)}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Net liability after ITC set-off</p>
        </div>

        {/* Output Tax Payable */}
        <div className="bento-card !p-5 border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
              Total Output Tax
            </span>
            <DocumentTextIcon className="w-5 h-5 text-[var(--status-warning)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {getCurrencySymbol()}{fmt(payment.total_tax_payable)}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">IGST + CGST + SGST</p>
        </div>

        {/* Net ITC Available */}
        <div className="bento-card !p-5 border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
              Net ITC Available
            </span>
            <ShieldCheckIcon className="w-5 h-5 text-[var(--status-success)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--status-success)]">
            {getCurrencySymbol()}{fmt(payment.total_net_itc)}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">After debit note reversals</p>
        </div>

        {/* Total Outward Taxable */}
        <div className="bento-card !p-5 border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
              Outward Taxable Value
            </span>
            <BuildingLibraryIcon className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {getCurrencySymbol()}{fmt(t31.outward_taxable?.txval)}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Net sales taxable amount</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--border-subtle)] gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Tables' },
          { id: 'table_3_1', label: '3.1 Outward & RCM' },
          { id: 'table_3_1_1', label: '3.1.1 ECO Supplies u/s 9(5)' },
          { id: 'table_3_2', label: '3.2 Inter-State to Unreg' },
          { id: 'table_4', label: '4. Eligible & Ineligible ITC' },
          { id: 'table_5', label: '5. Exempt Inward' },
          { id: 'table_5_1', label: '5.1 Interest & Late Fee' },
          { id: 'table_6_1', label: '6.1 Tax Payment' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bento-card p-12 text-center text-[var(--text-secondary)] animate-pulse">
          <DocumentTextIcon className="w-10 h-10 mx-auto mb-3 opacity-30 animate-spin" />
          Calculating GSTR-3B summary from invoices and bills...
        </div>
      ) : isError ? (
        <div className="bento-card p-12 text-center text-[var(--status-danger)]">
          <ExclamationCircleIcon className="w-10 h-10 mx-auto mb-3" />
          Failed to load GSTR-3B summary.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Table 3.1: Details of Outward Supplies */}
          {(activeTab === 'all' || activeTab === 'table_3_1') && (
            <div className="bento-card overflow-hidden border border-[var(--border-subtle)]">
              <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40">
                <h3 className="text-[var(--text-primary)] font-bold text-sm flex items-center gap-2">
                  <span className="text-[var(--accent-primary)] font-mono font-bold">3.1</span>
                  Details of Outward Supplies and inward supplies liable to reverse charge
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase tracking-wider text-xs">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Nature of Supplies</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Taxable Value</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Integrated Tax (IGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Central Tax (CGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">State/UT Tax (SGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Cess</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]/50">
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-3 px-4 text-[var(--text-primary)] font-medium">
                        (a) Outward taxable supplies (other than zero rated, nil and exempted)
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--text-primary)]">
                        {getCurrencySymbol()}{fmt(t31.outward_taxable?.txval)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--accent-primary)]">
                        {getCurrencySymbol()}{fmt(t31.outward_taxable?.iamt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--status-info)]">
                        {getCurrencySymbol()}{fmt(t31.outward_taxable?.camt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--status-success)]">
                        {getCurrencySymbol()}{fmt(t31.outward_taxable?.samt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-muted)]">
                        {getCurrencySymbol()}{fmt(t31.outward_taxable?.csamt)}
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        (b) Outward taxable supplies (zero rated)
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t31.zero_rated?.txval)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t31.zero_rated?.iamt)}
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--text-muted)] font-mono">—</td>
                      <td className="py-3 px-4 text-right text-[var(--text-muted)] font-mono">—</td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t31.zero_rated?.csamt)}
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        (c) Other outward supplies (Nil rated, exempted)
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t31.nil_exempt?.txval)}
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--text-muted)] font-mono">—</td>
                      <td className="py-3 px-4 text-right text-[var(--text-muted)] font-mono">—</td>
                      <td className="py-3 px-4 text-right text-[var(--text-muted)] font-mono">—</td>
                      <td className="py-3 px-4 text-right text-[var(--text-muted)] font-mono">—</td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        (d) Inward supplies (liable to reverse charge)
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t31.inward_reverse_charge?.txval)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t31.inward_reverse_charge?.iamt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t31.inward_reverse_charge?.camt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t31.inward_reverse_charge?.samt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t31.inward_reverse_charge?.csamt)}
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        (e) Non-GST outward supplies
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t31.non_gst_outward?.txval)}
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--text-muted)] font-mono">—</td>
                      <td className="py-3 px-4 text-right text-[var(--text-muted)] font-mono">—</td>
                      <td className="py-3 px-4 text-right text-[var(--text-muted)] font-mono">—</td>
                      <td className="py-3 px-4 text-right text-[var(--text-muted)] font-mono">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 3.1.1: Supplies notified under section 9(5) */}
          {(activeTab === 'all' || activeTab === 'table_3_1_1') && (
            <div className="bento-card overflow-hidden border border-[var(--border-subtle)]">
              <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40">
                <h3 className="text-[var(--text-primary)] font-bold text-sm flex items-center gap-2">
                  <span className="text-[var(--accent-primary)] font-mono font-bold">3.1.1</span>
                  Details of supplies notified under sub-section (5) of section 9 of the CGST Act, 2017
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase tracking-wider text-xs">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Nature of Supplies</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Taxable Value</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Integrated Tax (IGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Central Tax (CGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">State/UT Tax (SGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Cess</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]/50">
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-3 px-4 text-[var(--text-primary)] font-medium">
                        (i) Taxable supplies on which electronic commerce operator pays tax u/s 9(5)
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--text-primary)]">
                        {getCurrencySymbol()}{fmt(t311.supplies_notified_9_5?.txval ?? t311.eco_taxable)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--accent-primary)]">
                        {getCurrencySymbol()}{fmt(t311.supplies_notified_9_5?.iamt ?? t311.eco_igst)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--status-info)]">
                        {getCurrencySymbol()}{fmt(t311.supplies_notified_9_5?.camt ?? t311.eco_cgst)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--status-success)]">
                        {getCurrencySymbol()}{fmt(t311.supplies_notified_9_5?.samt ?? t311.eco_sgst)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-muted)]">
                        {getCurrencySymbol()}{fmt(t311.supplies_notified_9_5?.csamt ?? t311.eco_csamt)}
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        (ii) Taxable supplies made by registered person through electronic commerce operator
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t311.supplies_through_eco?.txval)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t311.supplies_through_eco?.iamt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t311.supplies_through_eco?.camt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t311.supplies_through_eco?.samt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-muted)]">
                        {getCurrencySymbol()}{fmt(t311.supplies_through_eco?.csamt)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 3.2: Inter-state supplies to unregistered persons */}
          {(activeTab === 'all' || activeTab === 'table_3_2') && (
            <div className="bento-card overflow-hidden border border-[var(--border-subtle)]">
              <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40">
                <h3 className="text-[var(--text-primary)] font-bold text-sm flex items-center gap-2">
                  <span className="text-[var(--accent-primary)] font-mono font-bold">3.2</span>
                  Of the supplies shown in 3.1(a), inter-State supplies made to unregistered persons
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase tracking-wider text-xs">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Place of Supply (State)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Taxable Value</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Amount of Integrated Tax (IGST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]/50">
                    {t32.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-[var(--text-muted)]">
                          No inter-state supplies to unregistered persons during this period.
                        </td>
                      </tr>
                    ) : (
                      t32.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                          <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{row.pos}</td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-[var(--text-primary)]">
                            {getCurrencySymbol()}{fmt(row.txval)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--accent-primary)]">
                            {getCurrencySymbol()}{fmt(row.iamt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 4: Eligible Input Tax Credit */}
          {(activeTab === 'all' || activeTab === 'table_4') && (
            <div className="bento-card overflow-hidden border border-[var(--border-subtle)]">
              <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40">
                <h3 className="text-[var(--text-primary)] font-bold text-sm flex items-center gap-2">
                  <span className="text-[var(--status-success)] font-mono font-bold">4</span>
                  Eligible Input Tax Credit (ITC)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase tracking-wider text-xs">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Details</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Integrated Tax (IGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Central Tax (CGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">State/UT Tax (SGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Cess</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]/50">
                    {/* (A) ITC Available */}
                    <tr className="bg-[var(--bg-primary)]/30">
                      <td colSpan={5} className="py-2 px-4 font-bold text-[var(--text-primary)]">
                        (A) ITC Available (whether in full or part)
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-2.5 px-4 pl-8 text-[var(--text-secondary)]">(5) All other ITC (Purchase Bills)</td>
                      <td className="py-2.5 px-4 text-right font-mono text-[var(--status-success)] font-medium">
                        {getCurrencySymbol()}{fmt(t4.itc_available?.all_other_itc?.iamt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[var(--status-success)] font-medium">
                        {getCurrencySymbol()}{fmt(t4.itc_available?.all_other_itc?.camt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[var(--status-success)] font-medium">
                        {getCurrencySymbol()}{fmt(t4.itc_available?.all_other_itc?.samt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[var(--text-muted)]">
                        {getCurrencySymbol()}{fmt(t4.itc_available?.all_other_itc?.csamt)}
                      </td>
                    </tr>

                    {/* (B) ITC Reversed */}
                    <tr className="bg-[var(--bg-primary)]/30">
                      <td colSpan={5} className="py-2 px-4 font-bold text-[var(--text-primary)]">
                        (B) ITC Reversed
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-2.5 px-4 pl-8 text-[var(--text-secondary)]">(2) Others (Debit Notes to Vendors)</td>
                      <td className="py-2.5 px-4 text-right font-mono text-[var(--status-danger)] font-medium">
                        {getCurrencySymbol()}{fmt(t4.itc_reversed?.others?.iamt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[var(--status-danger)] font-medium">
                        {getCurrencySymbol()}{fmt(t4.itc_reversed?.others?.camt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[var(--status-danger)] font-medium">
                        {getCurrencySymbol()}{fmt(t4.itc_reversed?.others?.samt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[var(--text-muted)]">
                        {getCurrencySymbol()}{fmt(t4.itc_reversed?.others?.csamt)}
                      </td>
                    </tr>

                    {/* (C) Net ITC Available */}
                    <tr className="bg-[var(--status-success)]/10 font-bold">
                      <td className="py-3 px-4 text-[var(--status-success)]">
                        (C) Net ITC Available (A) – (B)
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--status-success)] text-sm">
                        {getCurrencySymbol()}{fmt(t4.net_itc_available?.iamt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--status-success)] text-sm">
                        {getCurrencySymbol()}{fmt(t4.net_itc_available?.camt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--status-success)] text-sm">
                        {getCurrencySymbol()}{fmt(t4.net_itc_available?.samt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-muted)]">
                        {getCurrencySymbol()}{fmt(t4.net_itc_available?.csamt)}
                      </td>
                    </tr>

                    {/* (D) Ineligible ITC */}
                    <tr className="bg-[var(--bg-primary)]/30">
                      <td colSpan={5} className="py-2 px-4 font-bold text-[var(--text-primary)]">
                        (D) Ineligible ITC
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-2.5 px-4 pl-8 text-[var(--text-secondary)]">(1) As per section 17(5)</td>
                      <td className="py-2.5 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t4.ineligible_itc?.as_per_section_17_5?.iamt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t4.ineligible_itc?.as_per_section_17_5?.camt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t4.ineligible_itc?.as_per_section_17_5?.samt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[var(--text-muted)]">
                        {getCurrencySymbol()}{fmt(t4.ineligible_itc?.as_per_section_17_5?.csamt)}
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-2.5 px-4 pl-8 text-[var(--text-secondary)]">(2) Others</td>
                      <td className="py-2.5 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t4.ineligible_itc?.others?.iamt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t4.ineligible_itc?.others?.camt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t4.ineligible_itc?.others?.samt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[var(--text-muted)]">
                        {getCurrencySymbol()}{fmt(t4.ineligible_itc?.others?.csamt)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 5: Values of exempt, nil-rated and non-GST inward supplies */}
          {(activeTab === 'all' || activeTab === 'table_5') && (
            <div className="bento-card overflow-hidden border border-[var(--border-subtle)]">
              <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40">
                <h3 className="text-[var(--text-primary)] font-bold text-sm flex items-center gap-2">
                  <span className="text-[var(--accent-primary)] font-mono font-bold">5</span>
                  Values of exempt, nil-rated and non-GST inward supplies
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase tracking-wider text-xs">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Nature of Supplies</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Inter-State Supplies</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Intra-State Supplies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]/50">
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-3 px-4 text-[var(--text-primary)] font-medium">
                        From a supplier under composition scheme, Exempt and Nil rated supply
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-primary)]">
                        {getCurrencySymbol()}{fmt(t5.from_composition_scheme?.inter_state ?? t5.inter_state)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-primary)]">
                        {getCurrencySymbol()}{fmt(t5.from_composition_scheme?.intra_state ?? t5.intra_state)}
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">
                        Non-GST supply
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t5.non_gst_supply?.inter_state)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t5.non_gst_supply?.intra_state)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 5.1: Interest & Late fee for previous tax period */}
          {(activeTab === 'all' || activeTab === 'table_5_1') && (
            <div className="bento-card overflow-hidden border border-[var(--border-subtle)]">
              <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40">
                <h3 className="text-[var(--text-primary)] font-bold text-sm flex items-center gap-2">
                  <span className="text-[var(--status-warning)] font-mono font-bold">5.1</span>
                  Interest and Late Fee Payable
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase tracking-wider text-xs">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Description</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Integrated Tax (IGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Central Tax (CGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">State/UT Tax (SGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Cess</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]/50">
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-3 px-4 text-[var(--text-primary)] font-medium">(a) Interest</td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--status-warning)]">
                        {getCurrencySymbol()}{fmt(t51.interest?.iamt ?? t51.iamt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--status-warning)]">
                        {getCurrencySymbol()}{fmt(t51.interest?.camt ?? t51.camt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--status-warning)]">
                        {getCurrencySymbol()}{fmt(t51.interest?.samt ?? t51.samt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-muted)]">
                        {getCurrencySymbol()}{fmt(t51.interest?.csamt ?? t51.csamt)}
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">(b) Late fee</td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-muted)]">—</td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t51.late_fee?.camt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                        {getCurrencySymbol()}{fmt(t51.late_fee?.samt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-muted)]">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 6.1: Payment of Tax */}
          {(activeTab === 'all' || activeTab === 'table_6_1') && (
            <div className="bento-card overflow-hidden border border-[var(--border-subtle)]">
              <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40">
                <h3 className="text-[var(--text-primary)] font-bold text-sm flex items-center gap-2">
                  <span className="text-[var(--status-danger)] font-mono font-bold">6.1</span>
                  Payment of Tax (Cash Tax Calculation & ITC Utilization)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase tracking-wider text-xs">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Description</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Tax Payable</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Paid Through ITC</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Tax Payable in Cash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]/50">
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-[var(--text-primary)]">Integrated Tax (IGST)</td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-primary)] font-semibold">
                        {getCurrencySymbol()}{fmt(payment.igst?.tax_payable)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--status-success)]">
                        {getCurrencySymbol()}{fmt(payment.igst?.paid_via_itc)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--status-danger)]">
                        {getCurrencySymbol()}{fmt(payment.igst?.tax_paid_cash)}
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-[var(--text-primary)]">Central Tax (CGST)</td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-primary)] font-semibold">
                        {getCurrencySymbol()}{fmt(payment.cgst?.tax_payable)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--status-success)]">
                        {getCurrencySymbol()}{fmt(payment.cgst?.paid_via_itc)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--status-danger)]">
                        {getCurrencySymbol()}{fmt(payment.cgst?.tax_paid_cash)}
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-[var(--text-primary)]">State/UT Tax (SGST)</td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-primary)] font-semibold">
                        {getCurrencySymbol()}{fmt(payment.sgst?.tax_payable)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--status-success)]">
                        {getCurrencySymbol()}{fmt(payment.sgst?.paid_via_itc)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--status-danger)]">
                        {getCurrencySymbol()}{fmt(payment.sgst?.tax_paid_cash)}
                      </td>
                    </tr>

                    {/* Total Row */}
                    <tr className="bg-[var(--bg-primary)]/50 font-bold text-sm">
                      <td className="py-3 px-4 text-[var(--text-primary)]">Total</td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-primary)]">
                        {getCurrencySymbol()}{fmt(payment.total_tax_payable)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--status-success)]">
                        {getCurrencySymbol()}{fmt(payment.total_net_itc)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--status-danger)]">
                        {getCurrencySymbol()}{fmt(payment.total_tax_paid_cash)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
