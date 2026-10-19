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
import { getTodayKolkata, getKolkataMonthBounds } from '../../utils/date';

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

  // Date filters for CA Pack (IST — avoid UTC “yesterday”)
  const { from: monthStartStr, to: _monthEnd } = getKolkataMonthBounds();
  const todayStr = getTodayKolkata();
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
    has_2b_import: false,
    is_fully_reconciled: false,
    ledger_net_itc: null,
    counts: { matched: 0, unmatched: 0, probable: 0, missing_in_books: 0 },
    matched_bills: [],
    unmatched_bills: [],
    probable_bills: [],
    missing_in_books: [],
    defaulters: [],
    recent_imports: []
  };

  const isFullyReconciled =
    summary.is_fully_reconciled === true ||
    (Boolean(summary.has_2b_import || (summary.recent_imports || []).length > 0) &&
      (summary.counts?.unmatched || 0) === 0 &&
      (summary.counts?.probable || 0) === 0 &&
      (summary.counts?.matched || 0) > 0);

  const matchedBills = summary.matched_bills || [];

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
      toast.error(err.message || 'Export generation failed.');
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 animate-fade-up max-w-7xl mx-auto">
      <ToastContainer position="top-right" theme="dark" autoClose={3000} />

      {/* Top Nav & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/reports" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-2">
            <ArrowLeftIcon className="w-4 h-4" /> Back to Reports
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--status-success)]/10 border border-[var(--status-success)]/20 text-[var(--status-success)]">
              <ShieldCheckIcon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                GST Shield & GSTR-2B Engine
              </h1>
              <p className="text-[var(--text-secondary)] text-sm">
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
            className="btn-primary flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="w-5 h-5" />
            <span>{isUploading ? 'Reconciling...' : 'Upload GSTR-2B (.json / .xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Hero Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Safe ITC */}
        <div className="bento-card !p-5 border border-[var(--status-success)]/30 bg-[var(--status-success)]/5">
          <div className="flex items-center justify-between text-xs text-[var(--status-success)] font-semibold mb-2">
            <span className="flex items-center gap-1.5"><CheckCircleIcon className="w-4 h-4" /> Matched ITC (2B)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
              isFullyReconciled
                ? 'bg-[var(--status-success)]/10 border-[var(--status-success)]/20 text-[var(--status-success)]'
                : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)]'
            }`}>
              {isFullyReconciled ? '2B reconciled' : 'Not reconciled yet'}
            </span>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">{formatCurrency(summary.safe_itc)}</div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            {summary.counts.matched} matched · {summary.counts.probable || 0} probable · {summary.counts.unmatched} at-risk
            {summary.ledger_net_itc != null && (
              <> · Ledger Input GST {formatCurrency(summary.ledger_net_itc)}</>
            )}
          </p>
        </div>

        {/* At-Risk ITC */}
        <div className="bento-card !p-5 border border-[var(--status-danger)]/30 bg-[var(--status-danger)]/5">
          <div className="flex items-center justify-between text-xs text-[var(--status-danger)] font-semibold mb-2">
            <span className="flex items-center gap-1.5"><ExclamationTriangleIcon className="w-4 h-4" /> At-Risk ITC</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/20 text-[var(--status-danger)]">Unfiled</span>
          </div>
          <div className="text-2xl font-black text-[var(--status-danger)]">{formatCurrency(summary.at_risk_itc)}</div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">{summary.counts.unmatched} bills not found in 2B</p>
        </div>

        {/* Withheld Pool */}
        <div className="bento-card !p-5 border border-[var(--status-warning)]/30 bg-[var(--status-warning)]/5">
          <div className="flex items-center justify-between text-xs text-[var(--status-warning)] font-semibold mb-2">
            <span className="flex items-center gap-1.5"><LockClosedIcon className="w-4 h-4" /> Protected in Bank</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/20 text-[var(--status-warning)]">Withheld</span>
          </div>
          <div className="text-2xl font-black text-[var(--status-warning)]">{formatCurrency(summary.withheld_pool)}</div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">Payment held until vendor files</p>
        </div>

        {/* Defaulter Count */}
        <div className="bento-card !p-5 border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between text-xs text-[var(--accent-primary)] font-semibold mb-2">
            <span className="flex items-center gap-1.5"><ShieldCheckIcon className="w-4 h-4" /> Defaulter Vendors</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)]">Action Needed</span>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">{summary.defaulters.length}</div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">Suppliers causing credit blocks</p>
        </div>
      </div>

      {/* Multi-Format CA Pack Export Bar */}
      <div className="bento-card !p-4 flex flex-wrap items-center justify-between gap-4 border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">CA Audit Period:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
          <span className="text-[var(--text-muted)] text-xs">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)] font-medium mr-1">Download CA Pack:</span>
          <button
            onClick={() => handleDownload('xlsx')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--status-success)]/10 hover:bg-[var(--status-success)]/20 border border-[var(--status-success)]/30 text-[var(--status-success)] rounded-lg text-xs font-semibold transition-colors"
          >
            <TableCellsIcon className="w-4 h-4" /> Excel (.xlsx)
          </button>
          <button
            onClick={() => handleDownload('csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] rounded-lg text-xs font-semibold transition-colors"
          >
            <DocumentTextIcon className="w-4 h-4" /> Tally CSV (.csv)
          </button>
          <button
            onClick={() => handleDownload('json')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--status-info)]/10 hover:bg-[var(--status-info)]/20 border border-[var(--status-info)]/30 text-[var(--status-info)] rounded-lg text-xs font-semibold transition-colors"
          >
            <CodeBracketIcon className="w-4 h-4" /> Govt JSON (.json)
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--status-danger)]/10 hover:bg-[var(--status-danger)]/20 border border-[var(--status-danger)]/30 text-[var(--status-danger)] rounded-lg text-xs font-semibold transition-colors"
          >
            <PrinterIcon className="w-4 h-4" /> Executive PDF (.pdf)
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-[var(--border-subtle)] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('unmatched')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'unmatched'
              ? 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <ExclamationTriangleIcon className="w-4 h-4" />
          <span>At-Risk / Missing in 2B ({summary.unmatched_bills.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matched')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'matched'
              ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <CheckCircleIcon className="w-4 h-4" />
          <span>Matched Invoices ({summary.counts.matched})</span>
        </button>

        <button
          onClick={() => setActiveTab('defaulters')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'defaulters'
              ? 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <ShieldCheckIcon className="w-4 h-4" />
          <span>Defaulter Vendors ({summary.defaulters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('missing_books')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'missing_books'
              ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <DocumentTextIcon className="w-4 h-4" />
          <span>Unclaimed in Books ({summary.missing_in_books.length})</span>
        </button>
      </div>

      {/* Tab 1: At-Risk Bills */}
      {activeTab === 'unmatched' && (
        <div className="bento-card overflow-hidden border border-[var(--border-subtle)]">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-[var(--status-danger)]" />
              Invoices Missing in GSTR-2B (Payment Withheld)
            </h3>
            <span className="text-xs text-[var(--text-secondary)]">
              Tax credit is blocked under Section 16(2)(aa). Withholding is active.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase font-semibold">
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
              <tbody className="divide-y divide-[var(--border-subtle)]/50">
                {summary.unmatched_bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[var(--text-primary)]">{bill.bill_number}</td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">{bill.bill_date}</td>
                    <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{bill.vendor_name}</td>
                    <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">{bill.vendor_gstin || 'N/A'}</td>
                    <td className="py-3 px-4 text-right text-[var(--text-secondary)]">{formatCurrency(bill.taxable_value)}</td>
                    <td className="py-3 px-4 text-right font-bold text-[var(--status-danger)]">{formatCurrency(bill.tax_amount)}</td>
                    <td className="py-3 px-4 text-center">
                      {bill.is_gst_withheld ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30">
                          <LockClosedIcon className="w-3 h-3" /> Withheld ({formatCurrency(bill.gst_withheld_amount)})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                          <LockOpenIcon className="w-3 h-3" /> Unlocked
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {bill.vendor_id && (
                        <button
                          onClick={() => handleGenerateNotice(bill.vendor_id)}
                          className="px-2.5 py-1 bg-[var(--status-danger)]/15 hover:bg-[var(--status-danger)]/25 text-[var(--status-danger)] border border-[var(--status-danger)]/30 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          Send Notice
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleWithholding(bill.id, bill.is_gst_withheld)}
                        className="px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-lg text-[11px] font-medium transition-colors"
                      >
                        {bill.is_gst_withheld ? 'Release' : 'Withhold'}
                      </button>
                    </td>
                  </tr>
                ))}
                {summary.unmatched_bills.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[var(--text-muted)]">
                      {isFullyReconciled
                        ? 'No at-risk bills — all purchase invoices match GSTR-2B for this import.'
                        : 'Not reconciled yet. Upload GSTR-2B to verify ITC matches.'}
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
        <div className="bento-card overflow-hidden border border-[var(--border-subtle)]">
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-[var(--status-success)]" />
              Matched in GSTR-2B (ITC available after 2B match)
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              2B match status is not the same as GSTR-3B table 4(C) net ITC from the ledger.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Bill No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4 text-right">Taxable</th>
                  <th className="py-3 px-4 text-right">Matched ITC</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]/50">
                {matchedBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[var(--text-primary)]">{bill.bill_number}</td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">{bill.bill_date}</td>
                    <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{bill.vendor_name}</td>
                    <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">{bill.vendor_gstin || 'N/A'}</td>
                    <td className="py-3 px-4 text-right text-[var(--text-secondary)]">{formatCurrency(bill.taxable_value)}</td>
                    <td className="py-3 px-4 text-right font-bold text-[var(--status-success)]">{formatCurrency(bill.tax_amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30">
                        Matched
                      </span>
                    </td>
                  </tr>
                ))}
                {matchedBills.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                      {summary.has_2b_import || (summary.recent_imports || []).length > 0
                        ? 'No matched bills yet for this import.'
                        : 'Upload your GSTR-2B JSON/Excel file above to run reconciliation.'}
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
        <div className="bento-card overflow-hidden border border-[var(--border-subtle)]">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-[var(--accent-primary)]" />
              Vendor Compliance Risk Directory
            </h3>
            <span className="text-xs text-[var(--text-secondary)]">Scores computed from filing history & ITC match rate</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Vendor Name</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4 text-center">Compliance Score</th>
                  <th className="py-3 px-4 text-center">Risk Tier</th>
                  <th className="py-3 px-4 text-right">At-Risk ITC</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]/50">
                {summary.defaulters.map((v) => (
                  <tr key={v.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-[var(--text-primary)]">{v.name}</td>
                    <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">{v.gstin}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                          <div
                            className={`h-full rounded-full ${
                              v.compliance_score >= 85 ? 'bg-[var(--status-success)]' : v.compliance_score >= 60 ? 'bg-[var(--status-warning)]' : 'bg-[var(--status-danger)]'
                            }`}
                            style={{ width: `${v.compliance_score}%` }}
                          />
                        </div>
                        <span className="font-bold text-[var(--text-secondary)]">{v.compliance_score}/100</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.risk_tier === 'safe'
                          ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30'
                          : v.risk_tier === 'moderate_risk'
                          ? 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30'
                          : 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30'
                      }`}>
                        {v.risk_tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[var(--status-danger)]">
                      {formatCurrency(v.at_risk_itc)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleGenerateNotice(v.id)}
                        className="px-3 py-1 bg-[var(--status-danger)]/15 hover:bg-[var(--status-danger)]/25 text-[var(--status-danger)] border border-[var(--status-danger)]/30 rounded-lg text-xs font-bold transition-colors"
                      >
                        Generate Legal Notice
                      </button>
                    </td>
                  </tr>
                ))}
                {summary.defaulters.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
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
        <div className="bento-card overflow-hidden border border-[var(--border-subtle)]">
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-[var(--accent-primary)]" />
              Invoices Present in GSTR-2B but Missing in Books (Unclaimed ITC)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier GSTIN</th>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4 text-right">Taxable</th>
                  <th className="py-3 px-4 text-right">Available ITC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]/50">
                {summary.missing_in_books.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[var(--text-primary)]">{rec.invoice_number}</td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">{rec.invoice_date}</td>
                    <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">{rec.supplier_gstin}</td>
                    <td className="py-3 px-4 text-[var(--text-primary)]">{rec.supplier_name || '-'}</td>
                    <td className="py-3 px-4 text-right text-[var(--text-secondary)]">{formatCurrency(rec.taxable_value)}</td>
                    <td className="py-3 px-4 text-right font-bold text-[var(--accent-primary)]">{formatCurrency(rec.total_tax)}</td>
                  </tr>
                ))}
                {summary.missing_in_books.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bento-card !p-6 w-full max-w-3xl max-h-[90vh] flex flex-col border border-[var(--status-danger)]/30 bg-[var(--bg-surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-[var(--status-danger)]" />
                  Statutory Legal Demand Notice Generated
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">Section 16(2)(c) & (aa) CGST Act 2017 • Ref: {activeNotice.notice_number}</p>
              </div>
              <button
                onClick={() => setNoticeModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-xs text-[var(--text-primary)] p-4 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl whitespace-pre-wrap leading-relaxed select-all">
              {activeNotice.notice_text}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4 mt-4">
              <div className="text-xs text-[var(--status-danger)] font-bold">
                Total ITC Stuck: {formatCurrency(activeNotice.total_tax_at_risk)} (Deadline: {activeNotice.deadline_date})
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={activeNotice.whatsapp_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--status-success)] hover:opacity-90 text-white font-bold rounded-xl text-xs transition-opacity shadow-lg"
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
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-primary)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] font-bold rounded-xl text-xs border border-[var(--border-subtle)] transition-colors"
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
