import React, { useState } from "react";
import Layout from "../../components/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getTaxRegister, getHSNSummary, getGSTR1Export, generateEInvoice, generateEWayBill } from "../../api/gst";
import { ArrowDownTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const today = new Date().toISOString().split('T')[0];
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

export default function TaxRegister() {
  const [activeTab, setActiveTab] = useState('register');
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [reportType, setReportType] = useState('sales');

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

  const fmt = (v) => parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Layout>
      <div className="p-6 md:p-10 space-y-6 animate-fade-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">GST Tax Register</h1>
          <p className="text-gray-400 text-sm">Invoice-wise GST breakup, HSN summary, and GSTR-1 export.</p>
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
                    <th className="p-4 font-medium">GSTIN</th>
                    <th className="p-4 font-medium text-right">Taxable</th>
                    <th className="p-4 font-medium text-right">CGST</th>
                    <th className="p-4 font-medium text-right">SGST</th>
                    <th className="p-4 font-medium text-right">IGST</th>
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
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 text-white font-medium text-sm">{row.invoice_number}</td>
                          <td className="p-4 text-gray-300 text-sm">{row.date}</td>
                          <td className="p-4 text-gray-300 text-sm">{row.party_name}</td>
                          <td className="p-4 text-gray-400 text-xs font-mono">{row.gstin || '—'}</td>
                          <td className="p-4 text-right text-gray-300 text-sm">₹{fmt(row.taxable_value)}</td>
                          <td className="p-4 text-right text-blue-400 text-sm">₹{fmt(row.cgst)}</td>
                          <td className="p-4 text-right text-emerald-400 text-sm">₹{fmt(row.sgst)}</td>
                          <td className="p-4 text-right text-purple-400 text-sm">₹{fmt(row.igst)}</td>
                          <td className="p-4 text-right text-white font-semibold text-sm">₹{fmt(row.total_amount)}</td>
                        </tr>
                      ))}
                      {/* Totals Row */}
                      <tr className="bg-white/5 border-t border-white/10 font-semibold">
                        <td colSpan="4" className="p-4 text-white">Totals ({registerData.count} invoices)</td>
                        <td className="p-4 text-right text-white">₹{fmt(registerData.totals?.taxable)}</td>
                        <td className="p-4 text-right text-blue-400">₹{fmt(registerData.totals?.cgst)}</td>
                        <td className="p-4 text-right text-emerald-400">₹{fmt(registerData.totals?.sgst)}</td>
                        <td className="p-4 text-right text-purple-400">₹{fmt(registerData.totals?.igst)}</td>
                        <td className="p-4 text-right text-white">₹{fmt(registerData.totals?.total)}</td>
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
                    <th className="p-4 font-medium">HSN Code</th>
                    <th className="p-4 font-medium text-right">Qty</th>
                    <th className="p-4 font-medium text-right">Taxable Value</th>
                    <th className="p-4 font-medium text-right">CGST</th>
                    <th className="p-4 font-medium text-right">SGST</th>
                    <th className="p-4 font-medium text-right">IGST</th>
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
                          <td className="p-4 text-right text-gray-300">₹{fmt(row.taxable_value)}</td>
                          <td className="p-4 text-right text-blue-400">₹{fmt(row.cgst)}</td>
                          <td className="p-4 text-right text-emerald-400">₹{fmt(row.sgst)}</td>
                          <td className="p-4 text-right text-purple-400">₹{fmt(row.igst)}</td>
                          <td className="p-4 text-right text-amber-400">₹{fmt(row.total_tax)}</td>
                          <td className="p-4 text-right text-white font-semibold">₹{fmt(row.total_value)}</td>
                        </tr>
                      ))}
                      <tr className="bg-white/5 border-t border-white/10 font-semibold">
                        <td colSpan="2" className="p-4 text-white">Total ({hsnData.count} HSN codes)</td>
                        <td className="p-4 text-right text-white">₹{fmt(hsnData.summary?.total_taxable_value)}</td>
                        <td colSpan="3" className="p-4 text-right text-amber-400">₹{fmt(hsnData.summary?.total_tax)}</td>
                        <td className="p-4"></td>
                        <td className="p-4 text-right text-white">₹{fmt(hsnData.summary?.total_value)}</td>
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
      </div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="dark" />
    </Layout>
  );
}
