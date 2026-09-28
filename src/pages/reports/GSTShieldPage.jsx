import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  getReconciliationSummary,
  uploadAndReconcileGSTR2B,
  toggleBillWithholding,
  manualMatchRecord,
  generateLegalNotice,
  downloadCAAuditPack
} from '../../api/gst';
import { getCurrencySymbol } from '../../utils/currency';

import {
  ShieldCheckIcon,
  ArrowUpTrayIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LockClosedIcon,
  LockOpenIcon,
  DocumentTextIcon,
  TableCellsIcon,
  CodeBracketIcon,
  PrinterIcon,
  ShareIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function GSTShieldPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const initialTab = searchParams.get('tab') || 'unmatched';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isUploading, setIsUploading] = useState(false);

  // Date filters for CA Pack
  const todayStr = new Date().toISOString().split('T')[0];
  const monthStartStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(monthStartStr);
  const [toDate, setToDate] = useState(todayStr);

  // Notice Modal
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [activeNotice, setActiveNotice] = useState(null);
  const [noticeLoading, setNoticeLoading] = useState(false);

  // Fetch Summary
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gst-reconciliation-summary'],
    queryFn: getReconciliationSummary,
  });

  const summary = data || {
    safe_itc: 0,
    at_risk_itc: 0,
    withheld_pool: 0,
    counts: { matched: 0, unmatched: 0, probable: 0, missing_in_books: 0 },
    unmatched_bills: [],
    probable_bills: [],
    missing_in_books: [],
    defaulters: [],
    recent_imports: []
  };

  const formatCurrency = (val) => {
    return `${getCurrencySymbol()}${Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      toast.info('Ingesting GSTR-2B and running reconciliation...');
      const res = await uploadAndReconcileGSTR2B(formData);
      toast.success(`Reconciliation complete! ${res.matched_count} matched, ${res.at_risk_bills_count} at-risk bills.`);
      queryClient.invalidateQueries(['gst-reconciliation-summary']);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reconcile GSTR-2B file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Toggle Withholding
  const handleToggleWithholding = async (billId, currentWithheld) => {
    try {
      const res = await toggleBillWithholding(billId, currentWithheld);
      toast.success(res.message);
      refetch();
    } catch (err) {
      toast.error('Failed to update withholding status.');
    }
  };

  // Generate Notice
  const handleGenerateNotice = async (vendorId) => {
    try {
      setNoticeLoading(true);
      const res = await generateLegalNotice(vendorId, 7);
      setActiveNotice(res);
      setNoticeModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate legal notice.');
    } finally {
      setNoticeLoading(false);
    }
  };

  // Download CA Pack
  const handleDownload = async (format) => {
    try {
      toast.info(`Preparing ${format.toUpperCase()} export...`);
      await downloadCAAuditPack(fromDate, toDate, format);
      toast.success(`${format.toUpperCase()} downloaded successfully!`);
    } catch (err) {
      toast.error('Export generation failed.');
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 animate-fade-up max-w-7xl mx-auto">
      <ToastContainer position="top-right" theme="dark" autoClose={3000} />

      {/* Top Nav & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/reports" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2">
            <ArrowLeftIcon className="w-4 h-4" /> Back to Reports
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheckIcon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                GST Shield & GSTR-2B Engine
              </h1>
              <p className="text-gray-400 text-sm">
                Automated ERP-to-GSTR-2B reconciliation, dynamic payment withholding, and statutory notice generator.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.xlsx,.xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="w-5 h-5" />
            <span>{isUploading ? 'Reconciling...' : 'Upload GSTR-2B (.json / .xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Hero Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Safe ITC */}
        <div className="bento-card !p-5 border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-2">
            <span className="flex items-center gap-1.5"><CheckCircleIcon className="w-4 h-4" /> Safe ITC (Matched)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">Verified</span>
          </div>
          <div className="text-2xl font-black text-white">{formatCurrency(summary.safe_itc)}</div>
          <p className="text-[11px] text-gray-400 mt-1">{summary.counts.matched} invoices matched in GSTR-2B</p>
        </div>

        {/* At-Risk ITC */}
        <div className="bento-card !p-5 border-rose-500/20 bg-gradient-to-b from-rose-500/5 to-transparent">
          <div className="flex items-center justify-between text-xs text-rose-400 font-semibold mb-2">
            <span className="flex items-center gap-1.5"><ExclamationTriangleIcon className="w-4 h-4" /> At-Risk ITC</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">Unfiled</span>
          </div>
          <div className="text-2xl font-black text-rose-300">{formatCurrency(summary.at_risk_itc)}</div>
          <p className="text-[11px] text-gray-400 mt-1">{summary.counts.unmatched} bills not found in 2B</p>
        </div>

        {/* Withheld Pool */}
        <div className="bento-card !p-5 border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-2">
            <span className="flex items-center gap-1.5"><LockClosedIcon className="w-4 h-4" /> Protected in Bank</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">Withheld</span>
          </div>
          <div className="text-2xl font-black text-amber-300">{formatCurrency(summary.withheld_pool)}</div>
          <p className="text-[11px] text-gray-400 mt-1">Payment held until vendor files</p>
        </div>

        {/* Defaulter Count */}
        <div className="bento-card !p-5 border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent">
          <div className="flex items-center justify-between text-xs text-purple-400 font-semibold mb-2">
            <span className="flex items-center gap-1.5"><ShieldCheckIcon className="w-4 h-4" /> Defaulter Vendors</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">Action Needed</span>
          </div>
          <div className="text-2xl font-black text-white">{summary.defaulters.length}</div>
          <p className="text-[11px] text-gray-400 mt-1">Suppliers causing credit blocks</p>
        </div>
      </div>

      {/* Multi-Format CA Pack Export Bar */}
      <div className="bento-card !p-4 flex flex-wrap items-center justify-between gap-4 border-gray-700/60 bg-gray-900/60">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">CA Audit Period:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
          <span className="text-gray-500 text-xs">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 font-medium mr-1">Download CA Pack:</span>
          <button
            onClick={() => handleDownload('xlsx')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
          >
            <TableCellsIcon className="w-4 h-4" /> Excel (.xlsx)
          </button>
          <button
            onClick={() => handleDownload('csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-semibold transition-colors"
          >
            <DocumentTextIcon className="w-4 h-4" /> Tally CSV (.csv)
          </button>
          <button
            onClick={() => handleDownload('json')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg text-xs font-semibold transition-colors"
          >
            <CodeBracketIcon className="w-4 h-4" /> Govt JSON (.json)
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold transition-colors"
          >
            <PrinterIcon className="w-4 h-4" /> Print PDF
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('unmatched')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'unmatched'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ExclamationTriangleIcon className="w-4 h-4" />
          <span>At-Risk / Missing in 2B ({summary.unmatched_bills.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matched')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'matched'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <CheckCircleIcon className="w-4 h-4" />
          <span>Matched Invoices ({summary.counts.matched})</span>
        </button>

        <button
          onClick={() => setActiveTab('defaulters')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'defaulters'
              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ShieldCheckIcon className="w-4 h-4" />
          <span>Defaulter Vendors ({summary.defaulters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('missing_books')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'missing_books'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <DocumentTextIcon className="w-4 h-4" />
          <span>Unclaimed in Books ({summary.missing_in_books.length})</span>
        </button>
      </div>

      {/* Tab 1: At-Risk Bills */}
      {activeTab === 'unmatched' && (
        <div className="bento-card overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-rose-400" />
              Invoices Missing in GSTR-2B (Payment Withheld)
            </h3>
            <span className="text-xs text-gray-400">
              Tax credit is blocked under Section 16(2)(aa). Withholding is active.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Bill No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4 text-right">Taxable</th>
                  <th className="py-3 px-4 text-right">Stuck ITC</th>
                  <th className="py-3 px-4 text-center">Withheld Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {summary.unmatched_bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">{bill.bill_number}</td>
                    <td className="py-3 px-4 text-gray-400">{bill.bill_date}</td>
                    <td className="py-3 px-4 font-medium text-gray-200">{bill.vendor_name}</td>
                    <td className="py-3 px-4 font-mono text-gray-400">{bill.vendor_gstin || 'N/A'}</td>
                    <td className="py-3 px-4 text-right text-gray-300">{formatCurrency(bill.taxable_value)}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">{formatCurrency(bill.tax_amount)}</td>
                    <td className="py-3 px-4 text-center">
                      {bill.is_gst_withheld ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          <LockClosedIcon className="w-3 h-3" /> Withheld ({formatCurrency(bill.gst_withheld_amount)})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                          <LockOpenIcon className="w-3 h-3" /> Unlocked
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {bill.vendor_id && (
                        <button
                          onClick={() => handleGenerateNotice(bill.vendor_id)}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          Send Notice
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleWithholding(bill.id, bill.is_gst_withheld)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-[11px] font-medium transition-colors"
                      >
                        {bill.is_gst_withheld ? 'Release' : 'Withhold'}
                      </button>
                    </td>
                  </tr>
                ))}
                {summary.unmatched_bills.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      🎉 Zero unmatched bills! All purchase tax credits are 100% verified.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Matched Invoices */}
      {activeTab === 'matched' && (
        <div className="bento-card overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
              100% Reconciled Invoices (Safe to Claim in GSTR-3B)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Bill No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4 text-right">Taxable</th>
                  <th className="py-3 px-4 text-right">Verified ITC</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {summary.unmatched_bills.length === 0 && summary.counts.matched === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      Upload your GSTR-2B JSON/Excel file above to run reconciliation.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Defaulter Vendors */}
      {activeTab === 'defaulters' && (
        <div className="bento-card overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-purple-400" />
              Vendor Compliance Risk Directory
            </h3>
            <span className="text-xs text-gray-400">Scores computed from filing history & ITC match rate</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Vendor Name</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4 text-center">Compliance Score</th>
                  <th className="py-3 px-4 text-center">Risk Tier</th>
                  <th className="py-3 px-4 text-right">At-Risk ITC</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {summary.defaulters.map((v) => (
                  <tr key={v.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{v.name}</td>
                    <td className="py-3 px-4 font-mono text-gray-400">{v.gstin}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              v.compliance_score >= 85 ? 'bg-emerald-500' : v.compliance_score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${v.compliance_score}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-200">{v.compliance_score}/100</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.risk_tier === 'safe'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : v.risk_tier === 'moderate_risk'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {v.risk_tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">
                      {formatCurrency(v.at_risk_itc)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleGenerateNotice(v.id)}
                        className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition-colors"
                      >
                        Generate Legal Notice
                      </button>
                    </td>
                  </tr>
                ))}
                {summary.defaulters.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No defaulting vendors found. All suppliers have 100% compliance.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Missing in Books */}
      {activeTab === 'missing_books' && (
        <div className="bento-card overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-cyan-400" />
              Invoices Present in GSTR-2B but Missing in Books (Unclaimed ITC)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier GSTIN</th>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4 text-right">Taxable</th>
                  <th className="py-3 px-4 text-right">Available ITC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {summary.missing_in_books.map((rec) => (
                  <tr key={rec.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">{rec.invoice_number}</td>
                    <td className="py-3 px-4 text-gray-400">{rec.invoice_date}</td>
                    <td className="py-3 px-4 font-mono text-gray-300">{rec.supplier_gstin}</td>
                    <td className="py-3 px-4 text-gray-200">{rec.supplier_name || '-'}</td>
                    <td className="py-3 px-4 text-right text-gray-300">{formatCurrency(rec.taxable_value)}</td>
                    <td className="py-3 px-4 text-right font-bold text-cyan-400">{formatCurrency(rec.total_tax)}</td>
                  </tr>
                ))}
                {summary.missing_in_books.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No unclaimed invoices in GSTR-2B.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STATUTORY LEGAL NOTICE MODAL */}
      {noticeModalOpen && activeNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bento-card !p-6 w-full max-w-3xl max-h-[90vh] flex flex-col border-rose-500/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-rose-400" />
                  Statutory Legal Demand Notice Generated
                </h2>
                <p className="text-xs text-gray-400">Section 16(2)(c) & (aa) CGST Act 2017 • Ref: {activeNotice.notice_number}</p>
              </div>
              <button
                onClick={() => setNoticeModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-xs text-gray-300 p-4 bg-black/50 border border-white/10 rounded-xl whitespace-pre-wrap leading-relaxed select-all">
              {activeNotice.notice_text}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4">
              <div className="text-xs text-rose-300 font-bold">
                Total ITC Stuck: {formatCurrency(activeNotice.total_tax_at_risk)} (Deadline: {activeNotice.deadline_date})
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={activeNotice.whatsapp_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <ShareIcon className="w-4 h-4" /> Send on WhatsApp
                </a>
                <button
                  onClick={() => {
                    const printWin = window.open('', '', 'width=800,height=600');
                    printWin.document.write(`<pre style="font-family: monospace; white-space: pre-wrap; padding: 20px;">${activeNotice.notice_text}</pre>`);
                    printWin.document.close();
                    printWin.print();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  <PrinterIcon className="w-4 h-4" /> Print Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
