import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getGSTR3BSummary } from '../../api/gst';
import { getCurrencySymbol } from '../../utils/currency';
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
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

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
  const t32 = data?.table_3_2 || [];
  const t4 = data?.table_4_itc || {};

  return (
    <div className="p-6 md:p-10 space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/gst"
            className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5"
            title="Back to GST Dashboard"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <DocumentTextIcon className="w-8 h-8 text-cyan-400" />
              GSTR-3B Summary
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Monthly summary return for outward supplies, input tax credit, and tax payment
            </p>
          </div>
        </div>

        {/* Action Controls & Date Pickers */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 gap-2">
            <span className="text-xs text-gray-400 font-medium">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none"
            />
            <span className="text-xs text-gray-400 font-medium">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={() => refetch()}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl border border-white/10 transition-all"
            title="Refresh Data"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportJson}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-cyan-400 rounded-xl border border-white/10 transition-all"
            title="Export GSTR-3B JSON"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.print()}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl border border-white/10 transition-all"
            title="Print Summary"
          >
            <PrinterIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Taxpayer Meta Pill */}
      {data && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">GSTIN</span>
              <div className="text-white font-mono font-bold">{data.gstin || 'NOT REGISTERED'}</div>
            </div>
            <div className="h-8 w-px bg-white/10 hidden sm:block" />
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Legal Name</span>
              <div className="text-white font-medium">{data.legal_name || 'Business'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full font-mono font-semibold">
              Period: {data.fp || 'MMYYYY'}
            </span>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Net Cash Tax Liability */}
        <div className="bento-card !p-5 border border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
              Tax Payable in Cash
            </span>
            <CurrencyRupeeIcon className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">
            {getCurrencySymbol()}{fmt(payment.total_tax_paid_cash)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Net liability after ITC set-off</p>
        </div>

        {/* Output Tax Payable */}
        <div className="bento-card !p-5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
              Total Output Tax
            </span>
            <DocumentTextIcon className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {getCurrencySymbol()}{fmt(payment.total_tax_payable)}
          </div>
          <p className="text-xs text-gray-400 mt-1">IGST + CGST + SGST</p>
        </div>

        {/* Net ITC Available */}
        <div className="bento-card !p-5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
              Net ITC Available
            </span>
            <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {getCurrencySymbol()}{fmt(payment.total_net_itc)}
          </div>
          <p className="text-xs text-gray-400 mt-1">After debit note reversals</p>
        </div>

        {/* Total Outward Taxable */}
        <div className="bento-card !p-5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
              Outward Taxable Value
            </span>
            <BuildingLibraryIcon className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {getCurrencySymbol()}{fmt(t31.outward_taxable?.txval)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Net sales taxable amount</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Tables' },
          { id: 'table_3_1', label: '3.1 Outward & RCM Supplies' },
          { id: 'table_3_2', label: '3.2 Inter-State to Unregistered' },
          { id: 'table_4', label: '4. Eligible ITC' },
          { id: 'table_6_1', label: '6.1 Tax Payment & Cash Liability' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bento-card p-12 text-center text-gray-400 animate-pulse">
          <DocumentTextIcon className="w-10 h-10 mx-auto mb-3 opacity-30 animate-spin" />
          Calculating GSTR-3B summary from invoices and bills...
        </div>
      ) : isError ? (
        <div className="bento-card p-12 text-center text-rose-400">
          <ExclamationCircleIcon className="w-10 h-10 mx-auto mb-3" />
          Failed to load GSTR-3B summary.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Table 3.1: Details of Outward Supplies */}
          {(activeTab === 'all' || activeTab === 'table_3_1') && (
            <div className="bento-card overflow-hidden border border-white/10">
              <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02]">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <span className="text-cyan-400 font-mono font-bold">3.1</span>
                  Details of Outward Supplies and inward supplies liable to reverse charge
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] border-b border-white/5 text-gray-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Nature of Supplies</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Taxable Value</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Integrated Tax (IGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Central Tax (CGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">State/UT Tax (SGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Cess</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-white font-medium">
                        (a) Outward taxable supplies (other than zero rated, nil and exempted)
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                        {getCurrencySymbol()}{fmt(t31.outward_taxable?.txval)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-cyan-400">
                        {getCurrencySymbol()}{fmt(t31.outward_taxable?.iamt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-cyan-400">
                        {getCurrencySymbol()}{fmt(t31.outward_taxable?.camt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-cyan-400">
                        {getCurrencySymbol()}{fmt(t31.outward_taxable?.samt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-500">
                        {getCurrencySymbol()}{fmt(t31.outward_taxable?.csamt)}
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-gray-400">
                        (b) Outward taxable supplies (zero rated)
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-400">
                        {getCurrencySymbol()}{fmt(t31.zero_rated?.txval)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-400">
                        {getCurrencySymbol()}{fmt(t31.zero_rated?.iamt)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600 font-mono">—</td>
                      <td className="py-3 px-4 text-right text-gray-600 font-mono">—</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-400">
                        {getCurrencySymbol()}{fmt(t31.zero_rated?.csamt)}
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-gray-400">
                        (c) Other outward supplies (Nil rated, exempted)
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-400">
                        {getCurrencySymbol()}{fmt(t31.nil_exempt?.txval)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600 font-mono">—</td>
                      <td className="py-3 px-4 text-right text-gray-600 font-mono">—</td>
                      <td className="py-3 px-4 text-right text-gray-600 font-mono">—</td>
                      <td className="py-3 px-4 text-right text-gray-600 font-mono">—</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-gray-400">
                        (d) Inward supplies (liable to reverse charge)
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-400">
                        {getCurrencySymbol()}{fmt(t31.inward_reverse_charge?.txval)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-400">
                        {getCurrencySymbol()}{fmt(t31.inward_reverse_charge?.iamt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-400">
                        {getCurrencySymbol()}{fmt(t31.inward_reverse_charge?.camt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-400">
                        {getCurrencySymbol()}{fmt(t31.inward_reverse_charge?.samt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-400">
                        {getCurrencySymbol()}{fmt(t31.inward_reverse_charge?.csamt)}
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-gray-400">
                        (e) Non-GST outward supplies
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-400">
                        {getCurrencySymbol()}{fmt(t31.non_gst_outward?.txval)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600 font-mono">—</td>
                      <td className="py-3 px-4 text-right text-gray-600 font-mono">—</td>
                      <td className="py-3 px-4 text-right text-gray-600 font-mono">—</td>
                      <td className="py-3 px-4 text-right text-gray-600 font-mono">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 3.2: Inter-state supplies to unregistered persons */}
          {(activeTab === 'all' || activeTab === 'table_3_2') && (
            <div className="bento-card overflow-hidden border border-white/10">
              <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02]">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <span className="text-cyan-400 font-mono font-bold">3.2</span>
                  Of the supplies shown in 3.1(a), inter-State supplies made to unregistered persons
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] border-b border-white/5 text-gray-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Place of Supply (State)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Taxable Value</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Amount of Integrated Tax (IGST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {t32.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-gray-500">
                          No inter-state supplies to unregistered persons during this period.
                        </td>
                      </tr>
                    ) : (
                      t32.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-medium text-white">{row.pos}</td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-white">
                            {getCurrencySymbol()}{fmt(row.txval)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-cyan-400">
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
            <div className="bento-card overflow-hidden border border-white/10">
              <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02]">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <span className="text-emerald-400 font-mono font-bold">4</span>
                  Eligible Input Tax Credit (ITC)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] border-b border-white/5 text-gray-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Details</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Integrated Tax (IGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Central Tax (CGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">State/UT Tax (SGST)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Cess</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {/* (A) ITC Available */}
                    <tr className="bg-white/[0.01]">
                      <td colSpan={5} className="py-2 px-4 font-bold text-gray-300">
                        (A) ITC Available (whether in full or part)
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-4 pl-8 text-gray-400">(5) All other ITC (Purchase Bills)</td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-400 font-medium">
                        {getCurrencySymbol()}{fmt(t4.itc_available?.all_other_itc?.iamt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-400 font-medium">
                        {getCurrencySymbol()}{fmt(t4.itc_available?.all_other_itc?.camt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-400 font-medium">
                        {getCurrencySymbol()}{fmt(t4.itc_available?.all_other_itc?.samt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-gray-500">
                        {getCurrencySymbol()}{fmt(t4.itc_available?.all_other_itc?.csamt)}
                      </td>
                    </tr>

                    {/* (B) ITC Reversed */}
                    <tr className="bg-white/[0.01]">
                      <td colSpan={5} className="py-2 px-4 font-bold text-gray-300">
                        (B) ITC Reversed
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-4 pl-8 text-gray-400">(2) Others (Debit Notes to Vendors)</td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-400 font-medium">
                        {getCurrencySymbol()}{fmt(t4.itc_reversed?.others?.iamt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-400 font-medium">
                        {getCurrencySymbol()}{fmt(t4.itc_reversed?.others?.camt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-400 font-medium">
                        {getCurrencySymbol()}{fmt(t4.itc_reversed?.others?.samt)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-gray-500">
                        {getCurrencySymbol()}{fmt(t4.itc_reversed?.others?.csamt)}
                      </td>
                    </tr>

                    {/* (C) Net ITC Available */}
                    <tr className="bg-emerald-500/5 font-bold">
                      <td className="py-3 px-4 text-emerald-400">
                        (C) Net ITC Available (A) – (B)
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400 text-sm">
                        {getCurrencySymbol()}{fmt(t4.net_itc_available?.iamt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400 text-sm">
                        {getCurrencySymbol()}{fmt(t4.net_itc_available?.camt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400 text-sm">
                        {getCurrencySymbol()}{fmt(t4.net_itc_available?.samt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-500">
                        {getCurrencySymbol()}{fmt(t4.net_itc_available?.csamt)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 6.1: Payment of Tax */}
          {(activeTab === 'all' || activeTab === 'table_6_1') && (
            <div className="bento-card overflow-hidden border border-white/10">
              <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02]">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <span className="text-rose-400 font-mono font-bold">6.1</span>
                  Payment of Tax (Cash Tax Calculation & ITC Utilization)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] border-b border-white/5 text-gray-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Description</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Tax Payable</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Paid Through ITC</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Tax Payable in Cash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-medium text-white">Integrated Tax (IGST)</td>
                      <td className="py-3 px-4 text-right font-mono text-white font-semibold">
                        {getCurrencySymbol()}{fmt(payment.igst?.tax_payable)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400">
                        {getCurrencySymbol()}{fmt(payment.igst?.paid_via_itc)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                        {getCurrencySymbol()}{fmt(payment.igst?.tax_paid_cash)}
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-medium text-white">Central Tax (CGST)</td>
                      <td className="py-3 px-4 text-right font-mono text-white font-semibold">
                        {getCurrencySymbol()}{fmt(payment.cgst?.tax_payable)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400">
                        {getCurrencySymbol()}{fmt(payment.cgst?.paid_via_itc)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                        {getCurrencySymbol()}{fmt(payment.cgst?.tax_paid_cash)}
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-medium text-white">State/UT Tax (SGST)</td>
                      <td className="py-3 px-4 text-right font-mono text-white font-semibold">
                        {getCurrencySymbol()}{fmt(payment.sgst?.tax_payable)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400">
                        {getCurrencySymbol()}{fmt(payment.sgst?.paid_via_itc)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                        {getCurrencySymbol()}{fmt(payment.sgst?.tax_paid_cash)}
                      </td>
                    </tr>

                    {/* Total Row */}
                    <tr className="bg-white/[0.03] font-bold text-sm">
                      <td className="py-3 px-4 text-white">Total</td>
                      <td className="py-3 px-4 text-right font-mono text-white">
                        {getCurrencySymbol()}{fmt(payment.total_tax_payable)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400">
                        {getCurrencySymbol()}{fmt(payment.total_net_itc)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-400">
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
