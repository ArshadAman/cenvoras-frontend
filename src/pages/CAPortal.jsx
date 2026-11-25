import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArchiveBoxArrowDownIcon as Archive,
  BuildingOffice2Icon as Building2,
  CalendarIcon as Calendar,
  CheckCircleIcon as CheckCircle2,
  ExclamationTriangleIcon as AlertTriangle,
  ArrowDownTrayIcon as Download,
  CodeBracketSquareIcon as FileCode2,
  TableCellsIcon as FileSpreadsheet,
  ArrowPathIcon as Loader2,
  ShieldCheckIcon as ShieldCheck,
  ClockIcon as Clock,
} from '@heroicons/react/24/outline';

const ENV_API_URL = (import.meta.env.VITE_API_URL || '').trim();
const API_BASE = ENV_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '');

function getDefaultMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return {
    start: `${y}-${m}-01`,
    end: `${y}-${m}-${d}`,
  };
}

function formatINR(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
}

export default function CAPortal() {
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') || '').trim();

  const defaults = getDefaultMonthRange();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [xmlMode, setXmlMode] = useState('accounting_only');
  const [includeInventoryInZip, setIncludeInventoryInZip] = useState(false);

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const fetchSummary = useCallback(async () => {
    if (!token) {
      setError('Missing CA Portal access token. Please open the exact magic link shared by your client.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const resp = await axios.get(`${API_BASE}/billing/ca-portal/summary/`, {
        params: {
          token,
          start_date: startDate,
          end_date: endDate,
        },
      });
      setData(resp.data);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        'Unable to verify this CA Portal link. It may be invalid or expired.';
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, startDate, endDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const triggerDownload = async (endpoint, filenameFallback, extraParams = {}) => {
    setDownloading(endpoint);
    try {
      const resp = await axios.get(`${API_BASE}/billing/ca-portal/${endpoint}/`, {
        params: {
          token,
          start_date: startDate,
          end_date: endDate,
          ...extraParams,
        },
        responseType: 'blob',
      });

      const disposition = resp.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const filename = match ? match[1] : filenameFallback;

      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.error || 'Download failed. Please refresh and try again.');
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#0F1521]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight text-white">Cenvora</span>
                <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-medium text-blue-300 border border-blue-500/30">
                  CA Auditor Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Read-Only Statutory Tax &amp; TallyPrime Export Bridge
              </p>
            </div>
          </div>

          {data?.ca?.expires_at && (
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-300">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                Link valid until{' '}
                {new Date(data.ca.expires_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 py-24">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-3" />
            <p className="text-sm text-slate-300">Verifying CA Portal access...</p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-rose-500/30 bg-rose-950/20 p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-rose-400 mb-3" />
            <h1 className="text-lg font-semibold text-white mb-2">Access Unavailable</h1>
            <p className="text-sm text-slate-300 leading-relaxed">{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Business Identity & Period Picker */}
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-blue-400">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Client Organization</span>
                </div>
                <h1 className="text-2xl font-bold text-white">{data.business.name}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  {data.business.gstin && (
                    <span>
                      GSTIN: <strong className="text-slate-200 font-mono">{data.business.gstin}</strong>
                    </span>
                  )}
                  {data.business.state && (
                    <span>
                      State: <strong className="text-slate-200">{data.business.state}</strong>
                    </span>
                  )}
                  {data.ca.firm_name && (
                    <span>
                      Auditor: <strong className="text-slate-200">{data.ca.name || data.ca.firm_name}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">From Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchSummary}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span>{loading ? 'Refreshing...' : 'Apply'}</span>
                </button>
              </div>
            </div>

            {/* Period Tax & Accounting Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                <p className="text-xs font-medium text-slate-400">Outward Sales ({data.summary.sales_count} Bills)</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatINR(data.summary.sales_total)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Taxable: {formatINR(data.summary.sales_taxable)} &middot; GST: {formatINR(data.summary.sales_tax)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                <p className="text-xs font-medium text-slate-400">Inward Purchases ({data.summary.purchase_count} Bills)</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatINR(data.summary.purchase_total)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Taxable: {formatINR(data.summary.purchase_taxable)} &middot; ITC: {formatINR(data.summary.purchase_tax)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                <p className="text-xs font-medium text-slate-400">Net GST Liability (Output - ITC)</p>
                <p className="mt-2 text-2xl font-bold text-blue-400">
                  {formatINR(data.summary.net_gst_payable)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Credit Notes: {data.summary.credit_note_count}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                <p className="text-xs font-medium text-slate-400">Double-Entry Trial Balance</p>
                <div className="mt-2 flex items-center gap-2">
                  {data.trial_balance.is_balanced ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                      <span className="text-lg font-bold text-emerald-400">100% Balanced</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-6 w-6 text-amber-400" />
                      <span className="text-lg font-bold text-amber-400">Check Suspense</span>
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Dr {formatINR(data.trial_balance.total_debits)} = Cr {formatINR(data.trial_balance.total_credits)}
                </p>
              </div>
            </div>

            {/* 1-Click Download Actions */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Card 1: Complete Monthly ZIP */}
              <div className="flex flex-col justify-between rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-950/30 to-slate-900/60 p-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                      <Archive className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-300">
                      Recommended
                    </span>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-white">Complete Monthly CA Audit Pack (.ZIP)</h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                    One-click bundle containing TallyPrime XML, GSTR-1/2B Audit Registers (.xlsx), Trial Balance (.xlsx), GSTR JSON payload, and import instructions.
                  </p>
                  <label className="mt-4 flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeInventoryInZip}
                      onChange={(e) => setIncludeInventoryInZip(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-900 text-blue-500"
                    />
                    <span>Also include Full Inventory &amp; Batch XML</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    triggerDownload('download-zip', 'CA_Audit_Pack.zip', {
                      include_inventory_xml: includeInventoryInZip ? 'true' : 'false',
                    })
                  }
                  disabled={Boolean(downloading)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition cursor-pointer disabled:opacity-50"
                >
                  {downloading === 'download-zip' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>Download Audit Pack (.ZIP)</span>
                </button>
              </div>

              {/* Card 2: Tally XML Direct */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <FileCode2 className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold text-white">TallyPrime XML Vouchers</h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                    Self-contained Tally XML with automatic Party &amp; GST Master creation configured to your Chart of Accounts preset.
                  </p>

                  <div className="mt-4">
                    <label className="block text-xs text-slate-400 mb-1">Export Mode</label>
                    <select
                      value={xmlMode}
                      onChange={(e) => setXmlMode(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="accounting_only">Accounting Vouchers Only (Fast GST Filing)</option>
                      <option value="full_inventory">Full Inventory &amp; Batch Vouchers (Stock Audit)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    triggerDownload('download-xml', 'Tally_Export.xml', { mode: xmlMode })
                  }
                  disabled={Boolean(downloading)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  {downloading === 'download-xml' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>Download Tally XML</span>
                </button>
              </div>

              {/* Card 3: GSTR Excel Registers */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                    <FileSpreadsheet className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold text-white">GSTR-1 &amp; 2B Excel Workbook</h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                    Multi-tab Excel workbook with B2B/B2C sales, HSN-wise tax summary, inward purchases, GSTR-2B reconciliation, and Credit Notes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => triggerDownload('download-excel', 'GSTR_Audit_Registers.xlsx')}
                  disabled={Boolean(downloading)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  {downloading === 'download-excel' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>Download Excel (.XLSX)</span>
                </button>
              </div>
            </div>

            {/* 60-Second TallyPrime Import Guide */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
              <h3 className="text-sm font-semibold text-white">60-Second TallyPrime Import Guide</h3>
              <div className="mt-3 grid grid-cols-1 gap-4 text-xs text-slate-300 md:grid-cols-3">
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <span className="font-semibold text-blue-400">Step 1:</span> Open your client&apos;s company in TallyPrime.
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <span className="font-semibold text-blue-400">Step 2:</span> Press <code className="rounded bg-slate-800 px-1.5 py-0.5 text-white">Alt+O</code> (Import) &rarr; Transactions &rarr; select the downloaded <code className="rounded bg-slate-800 px-1.5 py-0.5 text-white">.xml</code> file.
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <span className="font-semibold text-blue-400">Step 3:</span> Verify Day Book &amp; Trial Balance against <code className="rounded bg-slate-800 px-1.5 py-0.5 text-white">Trial_Balance.xlsx</code>.
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
