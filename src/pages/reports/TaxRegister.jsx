import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTaxRegister, getHSNSummary, getGSTR1Export, getTaxRegisterInvoiceDetail, getGSTR1Filing, setGSTR1Filing, downloadGSTR1AdvancesCSV, portalGSTR1 } from "../../api/gst";
import { extractServerMessage } from "../../utils/fieldErrors";
import { ArrowDownTrayIcon, MagnifyingGlassIcon, ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getCurrencySymbol, formatCurrency, getCountryCode } from '../../utils/currency';
import { getTodayKolkata, getKolkataMonthBounds } from '../../utils/date';

export default function TaxRegister() {
  const { from: monthStart, to: today } = getKolkataMonthBounds();
  const [activeTab, setActiveTab] = useState('register');
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [reportType, setReportType] = useState('sales');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Tax Register
  const { data: registerData, isLoading: regLoading, refetch: refetchRegister } = useQuery({
    queryKey: ["tax-register", fromDate, toDate, reportType],
    queryFn: () => getTaxRegister(fromDate, toDate, reportType),
    enabled: activeTab === 'register',
  });

  // HSN Summary
  const { data: hsnData, isLoading: hsnLoading, refetch: refetchHSN } = useQuery({
    queryKey: ["hsn-summary", fromDate, toDate, reportType],
    queryFn: () => getHSNSummary(fromDate, toDate, reportType),
    enabled: activeTab === 'hsn',
  });

  // GSTR-1
  const { data: gstr1Data, isLoading: gstr1Loading, refetch: refetchGSTR1 } = useQuery({
    queryKey: ["gstr1-export", fromDate, toDate],
    queryFn: () => getGSTR1Export(fromDate, toDate),
    enabled: activeTab === 'gstr1',
  });

  const queryClient = useQueryClient();
  const filingPeriod = (fromDate || '').slice(0, 7);
  const { data: filing } = useQuery({
    queryKey: ["gstr1-filing", filingPeriod],
    queryFn: () => getGSTR1Filing(filingPeriod),
    enabled: activeTab === 'gstr1' && !!filingPeriod,
  });
  const toggleFiled = async () => {
    const next = !filing?.filed;
    const msg = next
      ? `Mark GSTR-1 for ${filingPeriod} as FILED? Advances applied later will not change this month; any adjustment goes to the next open month (txpd).`
      : `Mark GSTR-1 for ${filingPeriod} as NOT filed? Only do this if the return was not actually filed.`;
    if (!window.confirm(msg)) return;
    try {
      await setGSTR1Filing(filingPeriod, next);
      await queryClient.invalidateQueries({ queryKey: ["gstr1-filing", filingPeriod] });
      toast.success(next ? 'Marked as filed' : 'Marked as not filed');
    } catch (err) {
      toast.error(extractServerMessage(err, 'Could not update filing status'));
    }
  };

  const downloadGSTR1 = () => {
    if (!gstr1Data) return;
    const blob = new Blob([JSON.stringify(portalGSTR1(gstr1Data), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1_${gstr1Data.fp || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('GSTR-1 JSON downloaded!');
  };

  const tabs = [
    { id: 'register', label: 'Tax Register' },
    { id: 'hsn', label: 'HSN Summary' },
    { id: 'gstr1', label: 'GSTR-1 Export' },
  ];

  const country = getCountryCode();
  const fmt = (v) => parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const { data: invoiceDetail, isLoading: invoiceDetailLoading } = useQuery({
    queryKey: ["tax-register-detail", selectedInvoice?.id, reportType],
    queryFn: () => getTaxRegisterInvoiceDetail(selectedInvoice.id, reportType),
    enabled: Boolean(selectedInvoice?.id),
  });

  return (
    <>
      <div className="p-6 md:p-10 space-y-6 animate-fade-up">
        <Link to="/reports" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group">
          <span className="p-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg group-hover:border-[var(--accent-primary)]/40 transition-colors"><ArrowLeftIcon className="w-4 h-4" /></span>
          <ChartBarIcon className="w-3.5 h-3.5" /> Back to Reports
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">{country === 'IN' ? 'GST Tax Register' : 'Tax Register'}</h1>
          <p className="text-[var(--text-secondary)] text-sm">{country === 'IN' ? 'Invoice-wise GST breakup' : 'Invoice-wise tax breakup'}, HSN summary, and GSTR-1 export.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow-sm font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bento-card p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1 font-semibold">From</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1 font-semibold">To</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] outline-none" />
            </div>
            {activeTab !== 'gstr1' && (
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1 font-semibold">Type</label>
                <select value={reportType} onChange={e => setReportType(e.target.value)}
                  className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] outline-none">
                  <option value="sales">Sales</option>
                  <option value="purchase">Purchase</option>
                </select>
              </div>
            )}
            {activeTab === 'gstr1' && filing && (
              <button onClick={toggleFiled} className="btn-secondary flex items-center gap-2 ml-auto" title="Cenvora does not file returns; record here that you filed this month on the GST portal.">
                {filing.filed ? `GSTR-1 ${filingPeriod}: Filed ✓ (undo)` : `Mark GSTR-1 ${filingPeriod} as filed`}
              </button>
            )}
            {activeTab === 'gstr1' && gstr1Data && (
              <button onClick={downloadGSTR1} className="btn-primary flex items-center gap-2">
                <ArrowDownTrayIcon className="w-4 h-4" /> Download JSON
              </button>
            )}
          </div>
        </div>

        {/* Tax Register Table */}
        {activeTab === 'register' && (
          <div className="bento-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs uppercase tracking-wider bg-[var(--bg-primary)]">
                    <th className="p-4 font-medium">Invoice</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Party</th>
                    <th className="p-4 font-medium">{country === 'IN' ? 'GSTIN' : 'TRN'}</th>
                    <th className="p-4 font-medium text-right">Taxable</th>
                    {country === 'IN' ? (
                      <>
                        <th className="p-4 font-medium text-right">CGST</th>
                        <th className="p-4 font-medium text-right">SGST</th>
                        <th className="p-4 font-medium text-right">IGST</th>
                      </>
                    ) : (
                      <th className="p-4 font-medium text-right">VAT</th>
                    )}
                    <th className="p-4 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]/50">
                  {regLoading ? (
                    <tr><td colSpan="9" className="p-8 text-center text-[var(--text-muted)] font-medium">Loading...</td></tr>
                  ) : !registerData?.results?.length ? (
                    <tr><td colSpan="9" className="p-8 text-center text-[var(--text-muted)] font-medium">No invoices found for this period.</td></tr>
                  ) : (
                    <>
                      {registerData.results.map((row, i) => (
                        <tr key={i} className="hover:bg-[var(--bg-primary)]/50 transition-colors cursor-pointer" onClick={() => setSelectedInvoice(row)}>
                          <td className="p-4 text-[var(--text-primary)] font-medium text-sm">{row.invoice_number}</td>
                          <td className="p-4 text-[var(--text-secondary)] text-sm">{row.date}</td>
                          <td className="p-4 text-[var(--text-secondary)] text-sm">{row.party_name}</td>
                          <td className="p-4 text-[var(--text-secondary)] text-xs font-mono">{row.gstin || '—'}</td>
                          <td className="p-4 text-right text-[var(--text-secondary)] text-sm">{getCurrencySymbol()}{fmt(row.taxable_value)}</td>
                          {country === 'IN' ? (
                            <>
                              <td className="p-4 text-right text-[var(--status-info)] text-sm">{getCurrencySymbol()}{fmt(row.cgst)}</td>
                              <td className="p-4 text-right text-[var(--status-success)] text-sm">{getCurrencySymbol()}{fmt(row.sgst)}</td>
                              <td className="p-4 text-right text-[var(--accent-primary)] text-sm">{getCurrencySymbol()}{fmt(row.igst)}</td>
                            </>
                          ) : (
                            <td className="p-4 text-right text-[var(--status-warning)] text-sm">{getCurrencySymbol()}{fmt((row.cgst || 0) + (row.sgst || 0) + (row.igst || 0))}</td>
                          )}
                          <td className="p-4 text-right text-[var(--text-primary)] font-semibold text-sm">{getCurrencySymbol()}{fmt(row.total_amount)}</td>
                        </tr>
                      ))}
                      {/* Totals Row */}
                      <tr className="bg-[var(--bg-primary)]/50 border-t border-[var(--border-subtle)] font-semibold">
                        <td colSpan="4" className="p-4 text-[var(--text-primary)]">Totals ({registerData.count} invoices)</td>
                        <td className="p-4 text-right text-[var(--text-primary)]">{getCurrencySymbol()}{fmt(registerData.totals?.taxable)}</td>
                        {country === 'IN' ? (
                          <>
                            <td className="p-4 text-right text-[var(--status-info)]">{getCurrencySymbol()}{fmt(registerData.totals?.cgst)}</td>
                            <td className="p-4 text-right text-[var(--status-success)]">{getCurrencySymbol()}{fmt(registerData.totals?.sgst)}</td>
                            <td className="p-4 text-right text-[var(--accent-primary)]">{getCurrencySymbol()}{fmt(registerData.totals?.igst)}</td>
                          </>
                        ) : (
                          <td className="p-4 text-right text-[var(--status-warning)]">{getCurrencySymbol()}{fmt((registerData.totals?.cgst || 0) + (registerData.totals?.sgst || 0) + (registerData.totals?.igst || 0))}</td>
                        )}
                        <td className="p-4 text-right text-[var(--text-primary)]">{getCurrencySymbol()}{fmt(registerData.totals?.total)}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HSN Summary Table */}
        {activeTab === 'hsn' && (
          <div className="bento-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs uppercase tracking-wider bg-[var(--bg-primary)]">
                    <th className="p-4 font-medium">{country === 'IN' ? 'HSN Code' : 'Tax Code'}</th>
                    <th className="p-4 font-medium text-right">Qty</th>
                    <th className="p-4 font-medium text-right">Taxable Value</th>
                    {country === 'IN' ? (
                      <>
                        <th className="p-4 font-medium text-right">CGST</th>
                        <th className="p-4 font-medium text-right">SGST</th>
                        <th className="p-4 font-medium text-right">IGST</th>
                      </>
                    ) : (
                      <th className="p-4 font-medium text-right">VAT</th>
                    )}
                    <th className="p-4 font-medium text-right">Total Tax</th>
                    <th className="p-4 font-medium text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]/50">
                  {hsnLoading ? (
                    <tr><td colSpan="8" className="p-8 text-center text-[var(--text-muted)] font-medium">Loading...</td></tr>
                  ) : !hsnData?.results?.length ? (
                    <tr><td colSpan="8" className="p-8 text-center text-[var(--text-muted)] font-medium">No HSN data found.</td></tr>
                  ) : (
                    <>
                      {hsnData.results.map((row, i) => (
                        <tr key={i} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                          <td className="p-4 text-[var(--text-primary)] font-mono font-medium">{row.hsn_code}</td>
                          <td className="p-4 text-right text-[var(--text-secondary)]">{row.quantity}</td>
                          <td className="p-4 text-right text-[var(--text-secondary)]">{getCurrencySymbol()}{fmt(row.taxable_value)}</td>
                          {country === 'IN' ? (
                            <>
                              <td className="p-4 text-right text-[var(--status-info)]">{getCurrencySymbol()}{fmt(row.cgst)}</td>
                              <td className="p-4 text-right text-[var(--status-success)]">{getCurrencySymbol()}{fmt(row.sgst)}</td>
                              <td className="p-4 text-right text-[var(--accent-primary)]">{getCurrencySymbol()}{fmt(row.igst)}</td>
                            </>
                          ) : (
                            <td className="p-4 text-right text-[var(--status-warning)]">{getCurrencySymbol()}{fmt((row.cgst || 0) + (row.sgst || 0) + (row.igst || 0))}</td>
                          )}
                          <td className="p-4 text-right text-[var(--status-warning)]">{getCurrencySymbol()}{fmt(row.total_tax)}</td>
                          <td className="p-4 text-right text-[var(--text-primary)] font-semibold">{getCurrencySymbol()}{fmt(row.total_value)}</td>
                        </tr>
                      ))}
                      <tr className="bg-[var(--bg-primary)]/50 border-t border-[var(--border-subtle)] font-semibold">
                        <td colSpan="2" className="p-4 text-[var(--text-primary)]">Total ({hsnData.count} HSN codes)</td>
                        <td className="p-4 text-right text-[var(--text-primary)]">{getCurrencySymbol()}{fmt(hsnData.summary?.total_taxable_value)}</td>
                        {country === 'IN' ? (
                          <>
                            <td className="p-4"></td>
                            <td className="p-4"></td>
                            <td className="p-4"></td>
                          </>
                        ) : (
                          <td className="p-4"></td>
                        )}
                        <td className="p-4 text-right text-[var(--status-warning)]">{getCurrencySymbol()}{fmt(hsnData.summary?.total_tax)}</td>
                        <td className="p-4 text-right text-[var(--text-primary)]">{getCurrencySymbol()}{fmt(hsnData.summary?.total_value)}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GSTR-1 Preview */}
        {activeTab === 'gstr1' && (
          <div className="space-y-4">
            {gstr1Loading ? (
              <div className="bento-card p-8 text-center text-[var(--text-muted)] font-medium">Generating GSTR-1 data...</div>
            ) : !gstr1Data ? (
              <div className="bento-card p-8 text-center text-[var(--text-muted)] font-medium">No data available.</div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bento-card p-4">
                    <div className="text-xs text-[var(--text-secondary)] mb-1">GSTIN</div>
                    <div className="text-[var(--text-primary)] font-mono text-sm">{gstr1Data.gstin || 'Not Set'}</div>
                  </div>
                  <div className="bento-card p-4">
                    <div className="text-xs text-[var(--text-secondary)] mb-1">Filing Period</div>
                    <div className="text-[var(--text-primary)] font-semibold">{gstr1Data.fp}</div>
                  </div>
                  <div className="bento-card p-4">
                    <div className="text-xs text-[var(--text-secondary)] mb-1">B2B Invoices</div>
                    <div className="text-[var(--status-info)] font-bold text-xl">{gstr1Data.b2b?.reduce((sum, b) => sum + b.inv.length, 0) || 0}</div>
                  </div>
                  <div className="bento-card p-4">
                    <div className="text-xs text-[var(--text-secondary)] mb-1">HSN Entries</div>
                    <div className="text-[var(--status-success)] font-bold text-xl">{gstr1Data.hsn?.data?.length || 0}</div>
                  </div>
                </div>

                {gstr1Data._cenvora && !gstr1Data._cenvora.advances_in_json && (
                  <div className="rounded-xl border border-[var(--status-warning)]/40 bg-[var(--status-warning)]/10 px-4 py-3 text-sm text-[var(--text-primary)] space-y-2">
                    <p>Advances: report via the GSTN offline tool AT/ATADJ sheets. They are not included in this JSON.</p>
                    {gstr1Data._cenvora.has_advances && (
                      <div className="flex gap-2">
                        <button className="btn-secondary text-xs" onClick={() => downloadGSTR1AdvancesCSV(fromDate, toDate, 'at').catch(() => toast.error('Download failed'))}>AT sheet (CSV)</button>
                        <button className="btn-secondary text-xs" onClick={() => downloadGSTR1AdvancesCSV(fromDate, toDate, 'atadj').catch(() => toast.error('Download failed'))}>ATADJ sheet (CSV)</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Raw JSON Preview */}
                <div className="bento-card p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[var(--text-primary)] font-semibold">JSON Preview</h3>
                    <button onClick={downloadGSTR1} className="btn-primary text-xs flex items-center gap-1">
                      <ArrowDownTrayIcon className="w-3 h-3" /> Download
                    </button>
                  </div>
                  <pre className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-4 text-xs text-[var(--text-secondary)] overflow-auto max-h-96 font-mono">
                    {JSON.stringify(portalGSTR1(gstr1Data), null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}

        {selectedInvoice && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-5xl max-h-[86vh] overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl">
              <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Invoice Tax Breakdown</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{selectedInvoice.invoice_number} • {selectedInvoice.date}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]/50 transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="overflow-auto max-h-[70vh]">
                {invoiceDetailLoading ? (
                  <div className="p-8 text-center text-[var(--text-muted)] font-medium">Loading invoice details...</div>
                ) : !invoiceDetail ? (
                  <div className="p-8 text-center text-[var(--text-muted)] font-medium">Unable to load invoice details.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40">
                      <div className="rounded-lg border border-[var(--border-subtle)] p-2.5">
                        <div className="text-xs text-[var(--text-secondary)]">Taxable</div>
                        <div className="text-sm text-[var(--text-primary)] font-semibold mt-1">{getCurrencySymbol()}{fmt(invoiceDetail.totals?.taxable)}</div>
                      </div>
                      <div className="rounded-lg border border-[var(--border-subtle)] p-2.5">
                        <div className="text-xs text-[var(--text-secondary)]">CGST</div>
                        <div className="text-sm text-[var(--status-info)] font-semibold mt-1">{getCurrencySymbol()}{fmt(invoiceDetail.totals?.cgst)}</div>
                      </div>
                      <div className="rounded-lg border border-[var(--border-subtle)] p-2.5">
                        <div className="text-xs text-[var(--text-secondary)]">SGST</div>
                        <div className="text-sm text-[var(--status-success)] font-semibold mt-1">{getCurrencySymbol()}{fmt(invoiceDetail.totals?.sgst)}</div>
                      </div>
                      <div className="rounded-lg border border-[var(--border-subtle)] p-2.5">
                        <div className="text-xs text-[var(--text-secondary)]">IGST</div>
                        <div className="text-sm text-[var(--accent-primary)] font-semibold mt-1">{getCurrencySymbol()}{fmt(invoiceDetail.totals?.igst)}</div>
                      </div>
                      <div className="rounded-lg border border-[var(--border-subtle)] p-2.5">
                        <div className="text-xs text-[var(--text-secondary)]">Tax</div>
                        <div className="text-sm text-[var(--status-warning)] font-semibold mt-1">{getCurrencySymbol()}{fmt(invoiceDetail.totals?.tax)}</div>
                      </div>
                      <div className="rounded-lg border border-[var(--border-subtle)] p-2.5">
                        <div className="text-xs text-[var(--text-secondary)]">Total</div>
                        <div className="text-sm text-[var(--text-primary)] font-semibold mt-1">{getCurrencySymbol()}{fmt(invoiceDetail.totals?.total_amount)}</div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs uppercase tracking-wider bg-[var(--bg-primary)]">
                            <th className="p-3 font-medium">Product</th>
                            <th className="p-3 font-medium">HSN</th>
                            <th className="p-3 font-medium text-right">Qty</th>
                            <th className="p-3 font-medium text-right">Price</th>
                            <th className="p-3 font-medium text-right">Taxable</th>
                            {country === 'IN' ? (
                              <>
                                <th className="p-3 font-medium text-right">CGST</th>
                                <th className="p-3 font-medium text-right">SGST</th>
                                <th className="p-3 font-medium text-right">IGST</th>
                              </>
                            ) : null}
                            <th className="p-3 font-medium text-right">Tax</th>
                            <th className="p-3 font-medium text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]/50">
                          {invoiceDetail.items?.length ? (
                            invoiceDetail.items.map((item) => (
                              <tr key={item.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                                <td className="p-3 text-[var(--text-primary)] text-sm">{item.product_name}</td>
                                <td className="p-3 text-[var(--text-secondary)] text-xs font-mono">{item.hsn_code || '-'}</td>
                                <td className="p-3 text-right text-[var(--text-secondary)] text-sm">{item.quantity} {item.unit || ''}</td>
                                <td className="p-3 text-right text-[var(--text-secondary)] text-sm">{getCurrencySymbol()}{fmt(item.price)}</td>
                                <td className="p-3 text-right text-[var(--text-secondary)] text-sm">{getCurrencySymbol()}{fmt(item.taxable_value)}</td>
                                {country === 'IN' ? (
                                  <>
                                    <td className="p-3 text-right text-[var(--status-info)] text-sm">{getCurrencySymbol()}{fmt(item.cgst)}</td>
                                    <td className="p-3 text-right text-[var(--status-success)] text-sm">{getCurrencySymbol()}{fmt(item.sgst)}</td>
                                    <td className="p-3 text-right text-[var(--accent-primary)] text-sm">{getCurrencySymbol()}{fmt(item.igst)}</td>
                                  </>
                                ) : null}
                                <td className="p-3 text-right text-[var(--status-warning)] text-sm">{getCurrencySymbol()}{fmt(item.tax)}</td>
                                <td className="p-3 text-right text-[var(--text-primary)] text-sm font-semibold">{getCurrencySymbol()}{fmt(item.line_total)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="10" className="p-8 text-center text-[var(--text-muted)] font-medium">No line items found for this invoice.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
    </>
  );
}
