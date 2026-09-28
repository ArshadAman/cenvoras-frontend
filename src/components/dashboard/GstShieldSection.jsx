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
  XMarkIcon
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

      {/* BULLETPROOF CENTERED CA AUDIT PACK MODAL (No Clipping / No Overflow Issues) */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div 
            className="bg-[#12141a] border border-white/15 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
                  Download CA Audit Pack
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Complete tax registers and GSTR-3B/2B reconciliation reports for your Accountant.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Date Range Selector */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
              <span className="text-gray-400 font-medium">Audit Period:</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 4 Multi-Format Options */}
            <div className="grid grid-cols-1 gap-2.5">
              {/* Option 1: Excel */}
              <button
                onClick={() => handleDownloadFormat('xlsx')}
                disabled={Boolean(downloadingFormat)}
                className="w-full flex items-center justify-between p-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-left transition-all hover:scale-[1.01] group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <TableCellsIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                      Multi-Tab Excel Workbook (.xlsx)
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">Recommended</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      GSTR-3B Computation, Sales (GSTR-1), 2B Purchases, Defaulter Schedule & TDS
                    </div>
                  </div>
                </div>
                <DocumentArrowDownIcon className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />
              </button>

              {/* Option 2: PDF */}
              <button
                onClick={() => {
                  setModalOpen(false);
                  navigate('/reports/gst-shield?print=true');
                }}
                disabled={Boolean(downloadingFormat)}
                className="w-full flex items-center justify-between p-3.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-left transition-all hover:scale-[1.01] group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <PrinterIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-2">
                      Executive Summary Report (.pdf)
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">Print Ready</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Clean printable summary with company letterhead, tax figures, and audit charts
                    </div>
                  </div>
                </div>
                <DocumentArrowDownIcon className="w-5 h-5 text-amber-400 shrink-0 ml-2" />
              </button>

              {/* Option 3: Govt JSON */}
              <button
                onClick={() => handleDownloadFormat('json')}
                disabled={Boolean(downloadingFormat)}
                className="w-full flex items-center justify-between p-3.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-left transition-all hover:scale-[1.01] group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                    <CodeBracketIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-2">
                      Govt Portal Upload Payload (.json)
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">gst.gov.in</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      NIC-compliant JSON ready for direct 1-click upload on the official GST portal
                    </div>
                  </div>
                </div>
                <DocumentArrowDownIcon className="w-5 h-5 text-purple-400 shrink-0 ml-2" />
              </button>

              {/* Option 4: Tally CSV */}
              <button
                onClick={() => handleDownloadFormat('csv')}
                disabled={Boolean(downloadingFormat)}
                className="w-full flex items-center justify-between p-3.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-left transition-all hover:scale-[1.01] group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <DocumentTextIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                      Accounting Raw Register (.csv)
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold">Tally / Busy</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Standard flat CSV registers for direct import into legacy accounting software
                    </div>
                  </div>
                </div>
                <DocumentArrowDownIcon className="w-5 h-5 text-cyan-400 shrink-0 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
