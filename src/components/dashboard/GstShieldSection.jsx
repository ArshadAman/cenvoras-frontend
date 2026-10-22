import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrencySymbol } from '../../utils/currency';
import { getTodayKolkata, getKolkataMonthBounds, getKolkataFYStart } from '../../utils/date';
import { downloadCAAuditPack } from '../../api/gst';
import { gstShieldView } from '../../utils/gstShieldView';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/api';
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
  const [hoveredFormat, setHoveredFormat] = useState(null);
  const [period, setPeriod] = useState('month');
  const { data: fyData } = useQuery({
    queryKey: ['gst-shield', 'fy'],
    queryFn: () => api.get('/analytics/gst-shield/?period=fy').then((r) => r.data),
    enabled: period === 'fy',
    staleTime: 60_000,
  });

  // Date filters for CA Pack (IST — avoid UTC “yesterday”)
  const todayStr = getTodayKolkata();
  const { from: monthStartStr } = getKolkataMonthBounds();
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

  const gst = (period === 'fy' && fyData) ? fyData : (data || {});
  
  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return `${getCurrencySymbol()}0`;
    const num = Math.abs(Number(value));
    if (num >= 10000000) return `${getCurrencySymbol()}${(num / 10000000).toFixed(2)}Cr`;
    if (num >= 100000) return `${getCurrencySymbol()}${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `${getCurrencySymbol()}${(num / 1000).toFixed(1)}K`;
    return `${getCurrencySymbol()}${num.toLocaleString('en-IN')}`;
  };

  // Signed variant: Collected/ITC can be negative (e.g. credit notes this month exceed sales).
  const formatSigned = (value) => (Number(value) < 0 ? `−${formatCurrency(value)}` : formatCurrency(value));

  const view = gstShieldView(gst);
  const gaugeColor = !view.registered
    ? { success: 'var(--status-success)', warning: 'var(--status-warning)', danger: 'var(--status-danger)' }[view.gauge.level]
    : undefined;

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
            <ShieldCheckIcon className="w-5 h-5 text-[var(--status-success)]" />
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">GST Shield</h2>
          </div>
          <button
            onClick={() => navigate('/reports/gst-shield')}
            className="text-xs font-semibold text-[var(--status-success)] hover:opacity-90 flex items-center gap-1 transition-colors px-2 py-1 rounded-md bg-[var(--status-success-bg)] hover:bg-[var(--status-success)]/20 border border-[var(--status-success-border)]"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" /> Reconcile 2B
          </button>
        </div>

        {!view.registered ? (
          <div data-testid="gst-threshold">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-[var(--text-muted)] font-medium">Turnover (This FY)</span>
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                {formatCurrency(view.turnover)} / {formatCurrency(view.threshold)}
              </span>
            </div>
            <div
              className="relative w-full h-2.5 bg-[var(--border-subtle)] rounded-full overflow-hidden"
              role="progressbar"
              aria-label="Turnover against GST registration limit"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(view.gauge.width)}
            >
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${view.gauge.width}%`, backgroundColor: gaugeColor }} />
            </div>
            <div className="flex justify-between items-center mt-1 gap-2">
              <span className="text-xs text-[var(--text-muted)] truncate" title={view.basis}>
                {view.gauge.label} of {formatCurrency(view.threshold)} registration limit
              </span>
              {view.liable && <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--status-danger)' }}>Liable to register</span>}
            </div>
            {view.alertText && (
              <p className="mt-1.5 text-xs font-medium flex items-start gap-1" style={{ color: gaugeColor }}>
                <ExclamationTriangleIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {view.alertText}
              </p>
            )}
            {view.interstateWarning && (
              <p className="mt-1.5 text-xs font-medium flex items-start gap-1 text-[var(--status-danger)]">
                <ExclamationTriangleIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {view.interstateWarning}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2" data-testid="gst-registered">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-muted)] font-medium">{view.priorLabel} turnover</span>
              <span className="font-semibold font-mono text-[var(--text-primary)]">{formatCurrency(view.priorTurnover)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {view.checks.map((c) => (
                <span
                  key={c.key}
                  className={`text-[11px] px-2 py-0.5 rounded-md border ${c.ok ? 'bg-[var(--status-success-bg)] border-[var(--status-success-border)] text-[var(--status-success)]' : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)]'}`}
                  title={`${c.label} limit ${formatCurrency(c.limit)} (prior-FY turnover)`}
                >
                  {c.label} ≤{formatCurrency(c.limit)} {c.ok ? '✓' : '✗'}
                </span>
              ))}
              <span className="text-[11px] px-2 py-0.5 rounded-md border bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)]">
                HSN {view.hsnDigits}-digit
              </span>
            </div>
            {view.eInvoiceWarning && (
              <p className="text-xs font-medium flex items-start gap-1 text-[var(--status-warning)]">
                <ExclamationTriangleIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {view.eInvoiceWarning}
              </p>
            )}
          </div>
        )}

        {view.showTaxFigures && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">
                {period === 'month' ? 'This return period' : 'FY to date'}
              </span>
              <div className="inline-flex rounded-lg border border-[var(--border-subtle)] overflow-hidden text-[11px]" role="group" aria-label="GST period">
                {[['month', 'Month'], ['fy', 'FY']].map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={period === k}
                    onClick={() => setPeriod(k)}
                    className={`px-2 py-0.5 ${period === k ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2.5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)]">
                <div className="text-xs text-[var(--text-muted)] mb-0.5">Collected</div>
                <div className="text-sm font-bold text-[var(--status-success)] truncate font-mono">{formatSigned(view.outputTax)}</div>
              </div>
              <div className="text-center p-2.5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)]">
                <div className="text-xs text-[var(--text-muted)] mb-0.5">ITC</div>
                <div className="text-sm font-bold text-[var(--accent-primary)] truncate font-mono">{formatSigned(view.itc)}</div>
              </div>
              <div className="text-center p-2.5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)]">
                <div className="text-xs text-[var(--text-muted)] mb-0.5">{view.netLabel}</div>
                <div className={`text-sm font-bold truncate font-mono ${view.net >= 0 ? 'text-[var(--status-warning)]' : 'text-[var(--status-success)]'}`}>
                  {formatCurrency(view.net)}
                </div>
              </div>
            </div>
            {view.collectedNote && (
              <p className="text-[11px] text-[var(--text-muted)]" data-testid="collected-note">{view.collectedNote}</p>
            )}
            <div className="p-2.5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)] font-medium">GSTR-2B Verified ITC</span>
                <span className="text-[var(--status-success)] font-bold font-mono">{formatCurrency(view.safeItc)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)] font-medium">At-Risk (Unfiled by Vendors)</span>
                <span className="text-[var(--status-danger)] font-bold font-mono">{formatCurrency(view.atRiskItc)}</span>
              </div>
              {withheldPool > 0 && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border-subtle)]">
                  <span className="text-[var(--status-warning)] font-medium flex items-center gap-1">
                    <LockClosedIcon className="w-3 h-3" /> Protected in Bank
                  </span>
                  <span className="text-[var(--status-warning)] font-bold font-mono">{formatCurrency(withheldPool)}</span>
                </div>
              )}
            </div>
          </>
        )}

        {defaultersCount > 0 && (
          <div 
            onClick={() => navigate('/reports/gst-shield?tab=defaulters')}
            className="p-2 rounded-lg bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/20 flex items-center justify-between cursor-pointer hover:bg-[var(--status-danger)]/15 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-[var(--status-danger)] shrink-0" />
              <span className="text-xs font-medium text-[var(--status-danger)]">
                {defaultersCount} vendor{defaultersCount > 1 ? 's' : ''} have unfiled bills
              </span>
            </div>
            <span className="text-xs text-[var(--status-danger)] underline font-semibold">View</span>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="mt-4 pt-2">
        <button 
          onClick={() => setModalOpen(true)}
          className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
        >
          <DocumentArrowDownIcon className="w-4 h-4" />
          <span>Download Report for CA</span>
        </button>
      </div>

      {/* COMPACT ENTERPRISE CA AUDIT PACK MODAL */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setModalOpen(false)}
        >
          <div 
            className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 w-full max-w-lg shadow-2xl space-y-3.5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[var(--status-success)]/15 border border-[var(--status-success)]/25 text-[var(--status-success)]">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                    Download CA Audit Pack
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Statutory reconciliation registers for your tax consultant
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors focus:outline-none"
                title="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Date Range Selector & Presets */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4 text-[var(--status-success)] shrink-0" />
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Period:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md px-2 py-0.5 text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                />
                <span className="text-[var(--text-muted)] text-xs">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md px-2 py-0.5 text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setFromDate(monthStartStr);
                    setToDate(todayStr);
                  }}
                  className="px-2 py-0.5 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)]/40 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all whitespace-nowrap"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const [yStr, mStr] = todayStr.split('-');
                    const y = parseInt(yStr, 10);
                    const m = parseInt(mStr, 10);
                    const prevMonth = m === 1 ? 12 : m - 1;
                    const prevYear = m === 1 ? y - 1 : y;
                    const lastMonthFirst = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
                    const lastDay = new Date(prevYear, prevMonth, 0).getDate();
                    const lastMonthLast = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                    setFromDate(lastMonthFirst);
                    setToDate(lastMonthLast);
                  }}
                  className="px-2 py-0.5 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)]/40 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all whitespace-nowrap"
                >
                  Last Month
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFromDate(getKolkataFYStart());
                    setToDate(todayStr);
                  }}
                  className="px-2 py-0.5 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)]/40 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all whitespace-nowrap"
                >
                  This FY
                </button>
              </div>
            </div>

            {/* 4 Format Tiles (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'xlsx',
                  title: 'Excel Workbook',
                  badge: '.XLSX',
                  tagline: 'Multi-tab 3B & 2B',
                  icon: TableCellsIcon,
                  bgClass: 'bg-[var(--status-success)]/10 hover:bg-[var(--status-success)]/15 border-[var(--status-success)]/25 hover:border-[var(--status-success)]/50',
                  iconBg: 'bg-[var(--status-success)]/20 text-[var(--status-success)]',
                  badgeClass: 'bg-[var(--status-success)]/20 text-[var(--status-success)] border-[var(--status-success)]/30',
                },
                {
                  id: 'pdf',
                  title: 'Executive Report',
                  badge: '.PDF',
                  tagline: 'Formal CA Sign-off',
                  icon: PrinterIcon,
                  bgClass: 'bg-[var(--status-danger)]/10 hover:bg-[var(--status-danger)]/15 border-[var(--status-danger)]/25 hover:border-[var(--status-danger)]/50',
                  iconBg: 'bg-[var(--status-danger)]/20 text-[var(--status-danger)]',
                  badgeClass: 'bg-[var(--status-danger)]/20 text-[var(--status-danger)] border-[var(--status-danger)]/30',
                },
                {
                  id: 'json',
                  title: 'Govt Portal JSON',
                  badge: '.JSON',
                  tagline: 'Direct 1-Click Upload',
                  icon: CodeBracketIcon,
                  bgClass: 'bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/25 hover:border-[var(--accent-primary)]/50',
                  iconBg: 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]',
                  badgeClass: 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border-[var(--accent-primary)]/30',
                },
                {
                  id: 'csv',
                  title: 'Accounting CSV',
                  badge: '.CSV',
                  tagline: 'Tally & Busy Registers',
                  icon: DocumentTextIcon,
                  bgClass: 'bg-[var(--status-info)]/10 hover:bg-[var(--status-info)]/15 border-[var(--status-info)]/25 hover:border-[var(--status-info)]/50',
                  iconBg: 'bg-[var(--status-info)]/20 text-[var(--status-info)]',
                  badgeClass: 'bg-[var(--status-info)]/20 text-[var(--status-info)] border-[var(--status-info)]/30',
                }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={downloadingFormat !== null}
                  onMouseEnter={() => setHoveredFormat(opt.id)}
                  onMouseLeave={() => setHoveredFormat(null)}
                  onClick={() => !downloadingFormat && handleDownloadFormat(opt.id)}
                  className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all duration-150 cursor-pointer text-left ${opt.bgClass} ${
                    downloadingFormat ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'
                  } focus:outline-none`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${opt.iconBg}`}>
                      <opt.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {opt.title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 ${opt.badgeClass}`}>
                          {opt.badge}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors truncate">
                          {opt.tagline}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pl-2 shrink-0">
                    {downloadingFormat === opt.id ? (
                      <div className="w-4 h-4 border-2 border-[var(--status-success)] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-[var(--bg-primary)]/50 group-hover:bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-all">
                        <DocumentArrowDownIcon className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Dynamic Contextual Info Strip - Discloses contents on hover */}
            <div className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center transition-all duration-200">
              {hoveredFormat ? (
                (() => {
                  const descMap = {
                    xlsx: {
                      title: 'Excel Workbook (.XLSX)',
                      text: 'Includes 4 formatted sheets: GSTR-3B Computation, Outward Sales register, Inward 2B reconciled bills, and Defaulter/Withholding schedule.'
                    },
                    pdf: {
                      title: 'Executive Report (.PDF)',
                      text: 'Printable executive A4 audit report with corporate letterhead, statutory ITC risk breakdown, and CA attestation signature block.'
                    },
                    json: {
                      title: 'Govt Portal JSON (.JSON)',
                      text: '100% NIC-compliant JSON schema ready for direct 1-click filing upload to the official GST Portal (gst.gov.in).'
                    },
                    csv: {
                      title: 'Accounting CSV (.CSV)',
                      text: 'Clean tabular sales and purchase registers formatted for direct import into Tally Prime, Busy, Zoho, or spreadsheet analysis.'
                    }
                  };
                  const active = descMap[hoveredFormat];
                  return (
                    <div className="flex items-start gap-1.5 text-xs leading-tight text-[var(--text-secondary)]">
                      <span className="font-semibold text-[var(--text-primary)] shrink-0">{active.title}:</span>
                      <span>{active.text}</span>
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <span className="text-[var(--status-success)] font-semibold shrink-0">💡 CA Tip:</span>
                  <span>Hover over any format to preview its contents, or click to generate the audit report.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
