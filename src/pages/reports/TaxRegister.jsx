import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTaxRegister, getHSNSummary, getGSTR1Export, getTaxRegisterInvoiceDetail } from "../../api/gst";
import { ArrowDownTrayIcon, MagnifyingGlassIcon, ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getCurrencySymbol, formatCurrency, getCountryCode } from '../../utils/currency';

const today = new Date().toLocaleDateString('sv-SE');
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

export default function TaxRegister() {
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

  const downloadGSTR1 = () => {
    if (!gstr1Data) return;
    const blob = new Blob([JSON.stringify(gstr1Data, null, 2)], { type: 'application/json' });
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
        <Link to="/reports" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group">
          <span className="p-1.5 bg-white/5 border border-white/10 rounded-lg group-hover:bg-white/10 transition-colors"><ArrowLeftIcon className="w-4 h-4" /></span>
          <ChartBarIcon className="w-3.5 h-3.5" /> Back to Reports
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">{country === 'IN' ? 'GST Tax Register' : 'Tax Register'}</h1>
          <p className="text-gray-400 text-sm">{country === 'IN' ? 'Invoice-wise GST breakup' : 'Invoice-wise tax breakup'}, HSN summary, and GSTR-1 export.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
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
              <label className="text-xs text-gray-400 block mb-1">From</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">To</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50" />
            </div>
            {activeTab !== 'gstr1' && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">Type</label>
                <select value={reportType} onChange={e => setReportType(e.target.value)}
                  className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50">
                  <option value="sales">Sales</option>
                  <option value="purchase">Purchase</option>
                </select>
              </div>
            )}
            {activeTab === 'gstr1' && gstr1Data && (
              <button onClick={downloadGSTR1} className="btn-primary flex items-center gap-2 ml-auto">
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
                  <tr className="border-b border-white/10 text-gray-400 text-xs uppercase bg-white/5">
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
                <tbody className="divide-y divide-white/5">
                  {regLoading ? (
                    <tr><td colSpan="9" className="p-8 text-center text-gray-500">Loading...</td></tr>
                  ) : !registerData?.results?.length ? (
                    <tr><td colSpan="9" className="p-8 text-center text-gray-500">No invoices found for this period.</td></tr>
                  ) : (
                    <>
                      {registerData.results.map((row, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedInvoice(row)}>
                          <td className="p-4 text-white font-medium text-sm">{row.invoice_number}</td>
                          <td className="p-4 text-gray-300 text-sm">{row.date}</td>
                          <td className="p-4 text-gray-300 text-sm">{row.party_name}</td>
                          <td className="p-4 text-gray-400 text-xs font-mono">{row.gstin || '—'}</td>
                          <td className="p-4 text-right text-gray-300 text-sm">{getCurrencySymbol()}{fmt(row.taxable_value)}</td>
                          {country === 'IN' ? (
                            <>
                              <td className="p-4 text-right text-blue-400 text-sm">{getCurrencySymbol()}{fmt(row.cgst)}</td>
                              <td className="p-4 text-right text-emerald-400 text-sm">{getCurrencySymbol()}{fmt(row.sgst)}</td>
                              <td className="p-4 text-right text-purple-400 text-sm">{getCurrencySymbol()}{fmt(row.igst)}</td>
                            </>
                          ) : (
                            <td className="p-4 text-right text-amber-400 text-sm">{getCurrencySymbol()}{fmt((row.cgst || 0) + (row.sgst || 0) + (row.igst || 0))}</td>
                          )}
                          <td className="p-4 text-right text-white font-semibold text-sm">{getCurrencySymbol()}{fmt(row.total_amount)}</td>
                        </tr>
                      ))}
                      {/* Totals Row */}
                      <tr className="bg-white/5 border-t border-white/10 font-semibold">
                        <td colSpan="4" className="p-4 text-white">Totals ({registerData.count} invoices)</td>
                        <td className="p-4 text-right text-white">{getCurrencySymbol()}{fmt(registerData.totals?.taxable)}</td>
                        {country === 'IN' ? (
                          <>
                            <td className="p-4 text-right text-blue-400">{getCurrencySymbol()}{fmt(registerData.totals?.cgst)}</td>
                            <td className="p-4 text-right text-emerald-400">{getCurrencySymbol()}{fmt(registerData.totals?.sgst)}</td>
                            <td className="p-4 text-right text-purple-400">{getCurrencySymbol()}{fmt(registerData.totals?.igst)}</td>
                          </>
                        ) : (
                          <td className="p-4 text-right text-amber-400">{getCurrencySymbol()}{fmt((registerData.totals?.cgst || 0) + (registerData.totals?.sgst || 0) + (registerData.totals?.igst || 0))}</td>
                        )}
                        <td className="p-4 text-right text-white">{getCurrencySymbol()}{fmt(registerData.totals?.total)}</td>
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
                  <tr className="border-b border-white/10 text-gray-400 text-xs uppercase bg-white/5">
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
                <tbody className="divide-y divide-white/5">
                  {hsnLoading ? (
                    <tr><td colSpan="8" className="p-8 text-center text-gray-500">Loading...</td></tr>
                  ) : !hsnData?.results?.length ? (
                    <tr><td colSpan="8" className="p-8 text-center text-gray-500">No HSN data found.</td></tr>
                  ) : (
                    <>
                      {hsnData.results.map((row, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 text-white font-mono font-medium">{row.hsn_code}</td>
                          <td className="p-4 text-right text-gray-300">{row.quantity}</td>
                          <td className="p-4 text-right text-gray-300">{getCurrencySymbol()}{fmt(row.taxable_value)}</td>
                          {country === 'IN' ? (
                            <>
                              <td className="p-4 text-right text-blue-400 ">{getCurrencySymbol()}{fmt(row.cgst)}</td>
                              <td className="p-4 text-right text-emerald-400 ">{getCurrencySymbol()}{fmt(row.sgst)}</td>
                              <td className="p-4 text-right text-purple-400 ">{getCurrencySymbol()}{fmt(row.igst)}</td>
                            </>
                          ) : (
                            <td className="p-4 text-right text-amber-400 ">{getCurrencySymbol()}{fmt((row.cgst || 0) + (row.sgst || 0) + (row.igst || 0))}</td>
                          )}
                          <td className="p-4 text-right text-amber-400">{getCurrencySymbol()}{fmt(row.total_tax)}</td>
                          <td className="p-4 text-right text-white font-semibold">{getCurrencySymbol()}{fmt(row.total_value)}</td>
                        </tr>
                      ))}
                      <tr className="bg-white/5 border-t border-white/10 font-semibold">
                        <td colSpan="2" className="p-4 text-white">Total ({hsnData.count} HSN codes)</td>
                        <td className="p-4 text-right text-white">{getCurrencySymbol()}{fmt(hsnData.summary?.total_taxable_value)}</td>
                        <td colSpan="3" className="p-4 text-right text-amber-400">{getCurrencySymbol()}{fmt(hsnData.summary?.total_tax)}</td>
                        <td className="p-4"></td>
                        <td className="p-4 text-right text-white">{getCurrencySymbol()}{fmt(hsnData.summary?.total_value)}</td>
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
              <div className="bento-card p-8 text-center text-gray-500">Generating GSTR-1 data...</div>
            ) : !gstr1Data ? (
              <div className="bento-card p-8 text-center text-gray-500">No data available.</div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bento-card p-4">
                    <div className="text-xs text-gray-400 mb-1">GSTIN</div>
                    <div className="text-white font-mono text-sm">{gstr1Data.gstin || 'Not Set'}</div>
                  </div>
                  <div className="bento-card p-4">
                    <div className="text-xs text-gray-400 mb-1">Filing Period</div>
                    <div className="text-white font-semibold">{gstr1Data.fp}</div>
                  </div>
                  <div className="bento-card p-4">
                    <div className="text-xs text-gray-400 mb-1">B2B Invoices</div>
                    <div className="text-blue-400 font-bold text-xl">{gstr1Data.b2b?.reduce((sum, b) => sum + b.inv.length, 0) || 0}</div>
                  </div>
                  <div className="bento-card p-4">
                    <div className="text-xs text-gray-400 mb-1">HSN Entries</div>
                    <div className="text-emerald-400 font-bold text-xl">{gstr1Data.hsn?.data?.length || 0}</div>
                  </div>
                </div>

                {/* Raw JSON Preview */}
                <div className="bento-card p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white font-semibold">JSON Preview</h3>
                    <button onClick={downloadGSTR1} className="btn-primary text-xs flex items-center gap-1">
                      <ArrowDownTrayIcon className="w-3 h-3" /> Download
                    </button>
                  </div>
                  <pre className="bg-black/50 rounded-lg p-4 text-xs text-gray-300 overflow-auto max-h-96 font-mono">
                    {JSON.stringify(gstr1Data, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}

        {selectedInvoice && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-5xl max-h-[86vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0f1017]">
              <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Invoice Tax Breakdown</h3>
                  <p className="text-xs text-gray-400 mt-1">{selectedInvoice.invoice_number} • {selectedInvoice.date}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-white/20 text-gray-300 hover:text-white hover:bg-white/5"
                >
                  Close
                </button>
              </div>

              <div className="overflow-auto max-h-[70vh]">
                {invoiceDetailLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading invoice details...</div>
                ) : !invoiceDetail ? (
                  <div className="p-8 text-center text-gray-500">Unable to load invoice details.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 border-b border-white/10 bg-white/[0.02]">
                      <div className="rounded-lg border border-white/10 p-2.5">
                        <div className="text-[11px] text-gray-400">Taxable</div>
                        <div className="text-sm text-white font-semibold mt-1">{getCurrencySymbol()}{fmt(invoiceDetail.totals?.taxable)}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 p-2.5">
                        <div className="text-[11px] text-gray-400">CGST</div>
                        <div className="text-sm text-blue-300 font-semibold mt-1">{getCurrencySymbol()}{fmt(invoiceDetail.totals?.cgst)}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 p-2.5">
                        <div className="text-[11px] text-gray-400">SGST</div>
                        <div className="text-sm text-emerald-300 font-semibold mt-1">{getCurrencySymbol()}{fmt(invoiceDetail.totals?.sgst)}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 p-2.5">
                        <div className="text-[11px] text-gray-400">IGST</div>
                        <div className="text-sm text-violet-300 font-semibold mt-1">{getCurrencySymbol()}{fmt(invoiceDetail.totals?.igst)}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 p-2.5">
                        <div className="text-[11px] text-gray-400">Tax</div>
                        <div className="text-sm text-amber-300 font-semibold mt-1">{getCurrencySymbol()}{fmt(invoiceDetail.totals?.tax)}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 p-2.5">
                        <div className="text-[11px] text-gray-400">Total</div>
                        <div className="text-sm text-white font-semibold mt-1">{getCurrencySymbol()}{fmt(invoiceDetail.totals?.total_amount)}</div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400 text-xs uppercase bg-white/5">
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
                        <tbody className="divide-y divide-white/5">
                          {invoiceDetail.items?.length ? (
                            invoiceDetail.items.map((item) => (
                              <tr key={item.id} className="hover:bg-white/[0.03]">
                                <td className="p-3 text-white text-sm">{item.product_name}</td>
                                <td className="p-3 text-gray-400 text-xs font-mono">{item.hsn_code || '-'}</td>
                                <td className="p-3 text-right text-gray-300 text-sm">{item.quantity} {item.unit || ''}</td>
                                <td className="p-3 text-right text-gray-300 text-sm">{getCurrencySymbol()}{fmt(item.price)}</td>
                                <td className="p-3 text-right text-gray-300 text-sm">{getCurrencySymbol()}{fmt(item.taxable_value)}</td>
                                {country === 'IN' ? (
                                  <>
                                    <td className="p-3 text-right text-blue-300 text-sm">{getCurrencySymbol()}{fmt(item.cgst)}</td>
                                    <td className="p-3 text-right text-emerald-300 text-sm">{getCurrencySymbol()}{fmt(item.sgst)}</td>
                                    <td className="p-3 text-right text-violet-300 text-sm">{getCurrencySymbol()}{fmt(item.igst)}</td>
                                  </>
                                ) : null}
                                <td className="p-3 text-right text-amber-300 text-sm">{getCurrencySymbol()}{fmt(item.tax)}</td>
                                <td className="p-3 text-right text-white text-sm font-semibold">{getCurrencySymbol()}{fmt(item.line_total)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="10" className="p-8 text-center text-gray-500">No line items found for this invoice.</td>
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
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="dark" />
    </>
  );
}
