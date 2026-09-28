import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrencySymbol } from '../../utils/currency';
import { downloadCAAuditPack } from '../../api/gst';
import {
  ShieldCheckIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  LockClosedIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  TableCellsIcon,
  CodeBracketIcon,
  PrinterIcon,
  XMarkIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

/**
 * GstShieldSection - 360° GST Compliance, Dynamic Withholding & CA Pack Command Center
 */
export default function GstShieldSection({ data, isLoading, onDownloadReport }) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  // Date filters for CA Pack
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const monthStartStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(monthStartStr);
  const [toDate, setToDate] = useState(todayStr);

  if (isLoading) {
    return (
      <section className="bento-card !p-5 animate-pulse flex flex-col justify-between">
        <div className="h-6 w-40 bg-white/10 rounded mb-4" />
        <div className="h-32 bg-white/5 rounded-lg mb-4" />
        <div className="h-10 bg-white/10 rounded-lg" />
      </section>
    );
  }

  const gst = data || {};
  
  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return `${getCurrencySymbol()}0`;
    const num = Math.abs(Number(value));
    if (num >= 10000000) return `${getCurrencySymbol()}${(num / 10000000).toFixed(2)}Cr`;
    if (num >= 100000) return `${getCurrencySymbol()}${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `${getCurrencySymbol()}${(num / 1000).toFixed(1)}K`;
    return `${getCurrencySymbol()}${num.toLocaleString('en-IN')}`;
  };

  const turnoverPercent = gst.turnover_percent || 0;
  const isApproachingLimit = turnoverPercent >= 80;

  const safeItc = Number(gst.safe_itc || 0);
  const atRiskItc = Number(gst.at_risk_itc || 0);
  const withheldPool = Number(gst.withheld_pool || 0);
  const defaultersCount = Number(gst.defaulters_count || 0);

  const handleDownloadFormat = async (format) => {
    try {
      setDownloadingFormat(format);
      await downloadCAAuditPack(fromDate, toDate, format);
      setModalOpen(false);
    } catch (err) {
      console.error('Download CA Pack failed:', err);
      if (onDownloadReport) onDownloadReport();
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <section className="bento-card !p-5 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">GST Shield</h2>
          </div>
          <button
            onClick={() => navigate('/reports/gst-shield')}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" /> Reconcile 2B
          </button>
        </div>

        {/* Turnover Progress */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-gray-400 font-medium">Turnover (This FY)</span>
            <span className="text-xs font-semibold text-gray-200">
              {formatCurrency(gst.total_turnover)} / {formatCurrency(gst.turnover_limit || 4000000)}
            </span>
          </div>
          
          <div className="relative w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isApproachingLimit ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
              }`}
              style={{ width: `${Math.min(100, turnoverPercent)}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center mt-1">
            <span className={`text-[11px] ${isApproachingLimit ? 'text-amber-400 font-medium' : 'text-gray-500'}`}>
              {turnoverPercent.toFixed(1)}% of {getCurrencySymbol()}40L limit
            </span>
            {isApproachingLimit && (
              <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                <ExclamationTriangleIcon className="w-3 h-3" />
                Approaching limit
              </span>
            )}
          </div>
        </div>

        {/* Monthly GST Core Breakdown (Collected / Paid / Payable) */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2.5 bg-white/5 rounded-xl border border-white/5">
            <div className="text-[11px] text-gray-400 mb-0.5">Collected</div>
            <div className="text-sm font-bold text-green-400 truncate">
              {formatCurrency(gst.gst_collected)}
            </div>
          </div>
          <div className="text-center p-2.5 bg-white/5 rounded-xl border border-white/5">
            <div className="text-[11px] text-gray-400 mb-0.5">Paid (ITC)</div>
            <div className="text-sm font-bold text-purple-400 truncate">
              {formatCurrency(gst.gst_paid)}
            </div>
          </div>
          <div className="text-center p-2.5 bg-white/5 rounded-xl border border-white/5">
            <div className="text-[11px] text-gray-400 mb-0.5">Payable</div>
            <div className={`text-sm font-bold truncate ${gst.gst_payable >= 0 ? 'text-amber-400' : 'text-green-400'}`}>
              {gst.gst_payable >= 0 ? formatCurrency(gst.gst_payable) : `${formatCurrency(gst.gst_payable)} (Credit)`}
            </div>
          </div>
        </div>

        {/* Smart ITC Protection Strip */}
        <div className="p-2.5 bg-gray-900/60 rounded-xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400 font-medium">GSTR-2B Verified ITC</span>
            <span className="text-emerald-400 font-bold">{formatCurrency(safeItc)}</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400 font-medium">At-Risk (Unfiled by Vendors)</span>
            <span className="text-rose-400 font-bold">{formatCurrency(atRiskItc)}</span>
          </div>

          {withheldPool > 0 && (
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <LockClosedIcon className="w-3 h-3" /> Protected in Bank
              </span>
              <span className="text-amber-300 font-bold">{formatCurrency(withheldPool)}</span>
            </div>
          )}
        </div>

        {/* Defaulter Alert Badge */}
        {defaultersCount > 0 && (
          <div 
            onClick={() => navigate('/reports/gst-shield?tab=defaulters')}
            className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between cursor-pointer hover:bg-red-500/15 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-[11px] font-medium text-red-300">
                {defaultersCount} vendor{defaultersCount > 1 ? 's' : ''} have unfiled bills
              </span>
            </div>
            <span className="text-[10px] text-red-400 underline font-semibold">View</span>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="mt-4 pt-2">
        <button 
          onClick={() => setModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-500/10 hover:scale-[1.01]"
        >
          <DocumentArrowDownIcon className="w-4 h-4" />
          <span>Download Report for CA</span>
        </button>
      </div>

      {/* BULLETPROOF CENTERED CA AUDIT PACK MODAL (Enterprise 2x2 Grid, Zero Awkward Wrapping) */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setModalOpen(false)}
        >
          <div 
            className="bg-[#111318] border border-white/15 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <ShieldCheckIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Download CA Audit Pack
                  </h3>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Export complete reconciliation workbooks, tax registers, and filing payloads for your Accountant.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Date Range Selector & Presets */}
            <div className="bg-gray-900/80 border border-white/10 rounded-xl p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDaysIcon className="w-4 h-4 text-emerald-400" />
                  Audit Period
                </span>
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setFromDate(monthStartStr);
                      setToDate(todayStr);
                    }}
                    className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white font-medium transition-all"
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const lastMonthFirst = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
                      const lastMonthLast = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
                      setFromDate(lastMonthFirst);
                      setToDate(lastMonthLast);
                    }}
                    className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white font-medium transition-all"
                  >
                    Last Month
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
                      const qStart = new Date(today.getFullYear(), quarterMonth, 1).toISOString().split('T')[0];
                      setFromDate(qStart);
                      setToDate(todayStr);
                    }}
                    className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white font-medium transition-all"
                  >
                    This Quarter
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 4 Multi-Format Options - 2x2 Clean Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option 1: Multi-Tab Excel */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => !downloadingFormat && handleDownloadFormat('xlsx')}
                className="relative flex flex-col justify-between p-4 rounded-xl bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-500/30 hover:border-emerald-500/60 transition-all cursor-pointer group text-left shadow-lg hover:shadow-emerald-950/50 hover:scale-[1.01]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                      <TableCellsIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                      RECOMMENDED
                    </span>
                  </div>
                  <div className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                    Excel Audit Pack
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    3B computation, GSTR-1 sales, 2B inward, and defaulters schedule.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs font-semibold text-emerald-400">
                  <span>Multi-Tab .xlsx</span>
                  {downloadingFormat === 'xlsx' ? (
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <DocumentArrowDownIcon className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  )}
                </div>
              </div>

              {/* Option 2: Executive PDF */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setModalOpen(false);
                  navigate('/reports/gst-shield?print=true');
                }}
                className="relative flex flex-col justify-between p-4 rounded-xl bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/30 hover:border-rose-500/60 transition-all cursor-pointer group text-left shadow-lg hover:shadow-rose-950/50 hover:scale-[1.01]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                      <PrinterIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap">
                      PRINT READY
                    </span>
                  </div>
                  <div className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors">
                    Executive Summary
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Formatted report with company letterhead, tax totals, and audit charts.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-rose-500/20 flex items-center justify-between text-xs font-semibold text-rose-400">
                  <span>Printable .pdf</span>
                  <DocumentArrowDownIcon className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                </div>
              </div>

              {/* Option 3: Govt JSON */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => !downloadingFormat && handleDownloadFormat('json')}
                className="relative flex flex-col justify-between p-4 rounded-xl bg-purple-950/20 hover:bg-purple-900/30 border border-purple-500/30 hover:border-purple-500/60 transition-all cursor-pointer group text-left shadow-lg hover:shadow-purple-950/50 hover:scale-[1.01]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                      <CodeBracketIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap">
                      GST.GOV.IN
                    </span>
                  </div>
                  <div className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                    Govt Portal Payload
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    NIC-compliant JSON ready for direct 1-click upload on official portal.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs font-semibold text-purple-400">
                  <span>Direct Upload .json</span>
                  {downloadingFormat === 'json' ? (
                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <DocumentArrowDownIcon className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  )}
                </div>
              </div>

              {/* Option 4: Accounting CSV */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => !downloadingFormat && handleDownloadFormat('csv')}
                className="relative flex flex-col justify-between p-4 rounded-xl bg-sky-950/20 hover:bg-sky-900/30 border border-sky-500/30 hover:border-sky-500/60 transition-all cursor-pointer group text-left shadow-lg hover:shadow-sky-950/50 hover:scale-[1.01]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                      <DocumentTextIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 whitespace-nowrap">
                      TALLY / ERP
                    </span>
                  </div>
                  <div className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors">
                    Accounting CSV Registers
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Standard flat CSV registers for direct import into Tally, Busy & Excel.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-sky-500/20 flex items-center justify-between text-xs font-semibold text-sky-400">
                  <span>Raw Flat .csv</span>
                  {downloadingFormat === 'csv' ? (
                    <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <DocumentArrowDownIcon className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
