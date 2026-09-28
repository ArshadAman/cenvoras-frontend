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
      alert(err.message || 'Failed to generate report. Please try again.');
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

      {/* COMPACT ENTERPRISE CA AUDIT PACK MODAL (Zero-Scroll, Fits Entire Screen, Contextual Tooltips) */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setModalOpen(false)}
        >
          <div 
            className="bg-[#111318] border border-white/15 rounded-2xl p-5 w-full max-w-xl shadow-2xl space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Compact single-row */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Download CA Audit Pack
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Reconciliation workbooks and filing reports for your Accountant
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Date Range Selector & Presets - Sleek single-row toolbar */}
            <div className="bg-gray-900/70 border border-white/10 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Period:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setFromDate(monthStartStr);
                    setToDate(todayStr);
                  }}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition-all whitespace-nowrap"
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
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition-all whitespace-nowrap"
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
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition-all whitespace-nowrap"
                >
                  Quarter
                </button>
              </div>
            </div>

            {/* 4 Compact Format Tiles (2x2 Grid, No Bloat, Hover Tooltip) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Multi-Tab Excel */}
              <div
                role="button"
                tabIndex={0}
                title="Multi-Tab Excel (.xlsx): Includes GSTR-3B Computation, GSTR-1 Sales, 2B Purchases, Defaulter Schedule & TDS summary."
                onClick={() => !downloadingFormat && handleDownloadFormat('xlsx')}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 hover:border-emerald-500/50 transition-all cursor-pointer group hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <TableCellsIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors whitespace-nowrap">
                        Excel Workbook
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                        .XLSX
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 group-hover:text-gray-300 transition-colors truncate">
                      Multi-tab 3B & 2B audit pack
                    </div>
                  </div>
                </div>
                <div className="pl-2 shrink-0">
                  {downloadingFormat === 'xlsx' ? (
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <DocumentArrowDownIcon className="w-4 h-4 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
                  )}
                </div>
              </div>

              {/* Option 2: Executive PDF */}
              <div
                role="button"
                tabIndex={0}
                title="Executive Summary (.pdf): Printable A4 document with company letterhead, tax totals, audit charts, and CA attestation."
                onClick={() => !downloadingFormat && handleDownloadFormat('pdf')}
                className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 hover:border-rose-500/50 transition-all cursor-pointer group hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <PrinterIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors whitespace-nowrap">
                        Executive Summary
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap">
                        .PDF
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 group-hover:text-gray-300 transition-colors truncate">
                      Printable summary & CA sign-off
                    </div>
                  </div>
                </div>
                <div className="pl-2 shrink-0">
                  {downloadingFormat === 'pdf' ? (
                    <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <DocumentArrowDownIcon className="w-4 h-4 text-rose-400 group-hover:translate-y-0.5 transition-transform" />
                  )}
                </div>
              </div>

              {/* Option 3: Govt JSON */}
              <div
                role="button"
                tabIndex={0}
                title="Govt Portal Payload (.json): Official NIC-compliant payload ready for direct 1-click filing on gst.gov.in."
                onClick={() => !downloadingFormat && handleDownloadFormat('json')}
                className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 hover:border-purple-500/50 transition-all cursor-pointer group hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <CodeBracketIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors whitespace-nowrap">
                        Govt Portal Upload
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap">
                        .JSON
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 group-hover:text-gray-300 transition-colors truncate">
                      Direct 1-click filing on gst.gov.in
                    </div>
                  </div>
                </div>
                <div className="pl-2 shrink-0">
                  {downloadingFormat === 'json' ? (
                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <DocumentArrowDownIcon className="w-4 h-4 text-purple-400 group-hover:translate-y-0.5 transition-transform" />
                  )}
                </div>
              </div>

              {/* Option 4: Accounting CSV */}
              <div
                role="button"
                tabIndex={0}
                title="Accounting Registers (.csv): Flat registers formatted for import into Tally Prime, Busy, Zoho, and spreadsheets."
                onClick={() => !downloadingFormat && handleDownloadFormat('csv')}
                className="flex items-center justify-between p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 hover:border-sky-500/50 transition-all cursor-pointer group hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <DocumentTextIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors whitespace-nowrap">
                        Accounting CSV
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 whitespace-nowrap">
                        .CSV
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 group-hover:text-gray-300 transition-colors truncate">
                      Tally Prime & Busy compatible
                    </div>
                  </div>
                </div>
                <div className="pl-2 shrink-0">
                  {downloadingFormat === 'csv' ? (
                    <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <DocumentArrowDownIcon className="w-4 h-4 text-sky-400 group-hover:translate-y-0.5 transition-transform" />
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
