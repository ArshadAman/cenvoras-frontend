import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrencySymbol } from '../../utils/currency';
import { downloadCAAuditPack } from '../../api/gst';
import {
  ShieldCheckIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  LockClosedIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  TableCellsIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';

/**
 * GstShieldSection - 360° GST Compliance, Dynamic Withholding & CA Pack Command Center
 */
export default function GstShieldSection({ data, isLoading, onDownloadReport }) {
  const navigate = useNavigate();
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDownloadOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <section className="bento-card !p-5 animate-pulse">
        <div className="h-6 w-40 bg-white/10 rounded mb-4" />
        <div className="h-32 bg-white/5 rounded-lg" />
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
      setDownloading(true);
      setDownloadOpen(false);
      const today = new Date();
      const fromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const toDate = today.toISOString().split('T')[0];
      await downloadCAAuditPack(fromDate, toDate, format);
    } catch (err) {
      console.error('Download CA Pack failed:', err);
      if (onDownloadReport) onDownloadReport();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="bento-card !p-5 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">GST Shield</h2>
        </div>
        <button
          onClick={() => navigate('/reports/gst-shield')}
          className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20"
        >
          <ArrowPathIcon className="w-3 h-3" /> Reconcile 2B
        </button>
      </div>

      <div className="space-y-4">
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

        {/* 360° ITC Protection & Withholding Cards */}
        <div className="grid grid-cols-3 gap-2">
          {/* Safe ITC */}
          <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium mb-1">
              <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Safe ITC</span>
            </div>
            <div className="text-xs font-bold text-emerald-300 truncate">
              {formatCurrency(safeItc)}
            </div>
          </div>

          {/* At-Risk ITC */}
          <div className="p-2.5 bg-rose-500/5 border border-rose-500/15 rounded-lg">
            <div className="flex items-center gap-1 text-[10px] text-rose-400 font-medium mb-1">
              <ExclamationTriangleIcon className="w-3.5 h-3.5 shrink-0" />
              <span>At-Risk</span>
            </div>
            <div className="text-xs font-bold text-rose-300 truncate">
              {formatCurrency(atRiskItc)}
            </div>
          </div>

          {/* Withheld Pool */}
          <div className="p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-lg">
            <div className="flex items-center gap-1 text-[10px] text-amber-400 font-medium mb-1">
              <LockClosedIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Withheld</span>
            </div>
            <div className="text-xs font-bold text-amber-300 truncate">
              {formatCurrency(withheldPool)}
            </div>
          </div>
        </div>

        {/* Defaulter Alert Banner */}
        {defaultersCount > 0 && (
          <div 
            onClick={() => navigate('/reports/gst-shield?tab=defaulters')}
            className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between cursor-pointer hover:bg-red-500/15 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-[11px] font-medium text-red-300">
                {defaultersCount} vendor{defaultersCount > 1 ? 's' : ''} have unfiled invoices
              </span>
            </div>
            <span className="text-[10px] text-red-400 underline font-semibold">Take Action</span>
          </div>
        )}

        {/* Action Button: Multi-Format Download Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDownloadOpen(!downloadOpen)}
            disabled={downloading}
            className="w-full flex items-center justify-between px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
          >
            <div className="flex items-center gap-2">
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>{downloading ? 'Preparing Pack...' : 'Download CA Audit Pack'}</span>
            </div>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${downloadOpen ? 'rotate-180' : ''}`} />
          </button>

          {downloadOpen && (
            <div className="absolute left-0 right-0 bottom-full mb-1 bg-gray-900 border border-gray-700/80 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-fade-in space-y-1">
              <button
                onClick={() => handleDownloadFormat('xlsx')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-gray-200 hover:text-white hover:bg-emerald-500/15 rounded-lg transition-colors group"
              >
                <TableCellsIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-emerald-300">Multi-Tab Excel (.xlsx)</div>
                  <div className="text-[10px] text-gray-400">Complete GSTR-3B & 2B workbook</div>
                </div>
              </button>

              <button
                onClick={() => handleDownloadFormat('csv')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-gray-200 hover:text-white hover:bg-cyan-500/15 rounded-lg transition-colors group"
              >
                <DocumentTextIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-cyan-300">Tally / Raw CSV (.csv)</div>
                  <div className="text-[10px] text-gray-400">Flat tables for accounting software</div>
                </div>
              </button>

              <button
                onClick={() => handleDownloadFormat('json')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-gray-200 hover:text-white hover:bg-purple-500/15 rounded-lg transition-colors group"
              >
                <CodeBracketIcon className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-purple-300">Govt Portal Payload (.json)</div>
                  <div className="text-[10px] text-gray-400">Direct upload on gst.gov.in</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setDownloadOpen(false);
                  navigate('/reports/gst-shield?tab=summary&print=true');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-gray-200 hover:text-white hover:bg-amber-500/15 rounded-lg transition-colors group"
              >
                <DocumentArrowDownIcon className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-amber-300">Executive PDF (.pdf)</div>
                  <div className="text-[10px] text-gray-400">Official printable summary with letterhead</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
