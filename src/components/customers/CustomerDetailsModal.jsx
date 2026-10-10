import React, { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCustomer } from "../../api/customers";
import { getSalesInvoices } from "../../api/sales";
import { getDeliveryChallans } from "../../api/delivery_challan";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

export default function CustomerDetailsModal({ isOpen, onClose, customer }) {
  const printRef = useRef();

  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["customer", customer?.id],
    queryFn: () => getCustomer(customer?.id),
    enabled: !!customer?.id,
  });

  const { data: invoicesData, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["customer-invoices", customer?.id],
    queryFn: () => getSalesInvoices({ customer: customer?.id }),
    enabled: !!customer?.id,
  });

  const { data: challansData, isLoading: isLoadingChallans } = useQuery({
    queryKey: ["customer-challans", customer?.id],
    queryFn: () => getDeliveryChallans({ customer: customer?.id }),
    enabled: !!customer?.id,
  });

  const customerDetails = data?.data || data || customer || {};

  const rawInvoices = Array.isArray(invoicesData) ? invoicesData : invoicesData?.data || invoicesData?.results || [];
  const customerInvoices = rawInvoices.filter(inv =>
    inv.customer === customer?.id ||
    inv.customer?.id === customer?.id ||
    (customer?.name && inv.customer_name?.toLowerCase() === customer?.name?.toLowerCase())
  );

  const rawChallans = Array.isArray(challansData) ? challansData : challansData?.data || challansData?.results || [];
  const customerChallans = rawChallans.filter(ch =>
    ch.customer === customer?.id ||
    ch.customer?.id === customer?.id ||
    (customer?.name && (ch.customer_name?.toLowerCase() === customer?.name?.toLowerCase() || ch.customer?.name?.toLowerCase() === customer?.name?.toLowerCase()))
  );

  const totalInvoiced = customerInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
  const totalPaid = customerInvoices.reduce((sum, inv) => sum + (Number(inv.amount_paid) || 0), 0);
  const outstandingBalance = Number(customerDetails.current_balance) || (totalInvoiced - totalPaid);

  // Print functionality
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Customer Details - ${customerDetails?.name || customer?.id}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        .print-hidden {
          display: none !important;
        }
      }
    `,
  });

  // PDF Download functionality
  const handleDownloadPDF = async () => {
    if (!printRef.current || !customerDetails) return;

    try {
      const element = printRef.current;
      
      // Scroll to top for clean capture
      window.scrollTo(0, 0);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-print-target]');
          if (clonedElement) {
            clonedElement.style.height = 'auto';
            clonedElement.style.overflow = 'visible';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Subsequent pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`customer-details-${customerDetails?.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || customer?.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-start justify-center z-[9999] p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0F0F12] border border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl my-8 transform animate-fade-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0F0F12]/80 backdrop-blur-md z-10 print-hidden">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              Customer <span className="text-cyan-400">Profile & Ledger</span>
            </h2>
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "overview"
                    ? "bg-cyan-500 text-black font-black shadow-lg shadow-cyan-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("invoices")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "invoices"
                    ? "bg-cyan-500 text-black font-black shadow-lg shadow-cyan-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <span>Invoices</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                  {customerInvoices.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("challans")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "challans"
                    ? "bg-cyan-500 text-black font-black shadow-lg shadow-cyan-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <span>Challans</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                  {customerChallans.length}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 sm:px-4 sm:py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all flex items-center gap-2"
              title="Print Profile"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="p-2 sm:px-4 sm:py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-xl transition-all flex items-center gap-2"
              title="Download PDF"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={printRef} data-print-target className="p-6 sm:p-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
              <div className="text-gray-500 text-xs font-black uppercase tracking-widest">Loading Profile...</div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Customer Header */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-black mb-2 shadow-xl shadow-cyan-500/20">
                  {customerDetails.name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {customerDetails.name || 'N/A'}
                </h1>
                <div className="flex flex-wrap justify-center gap-2">
                   {customerDetails.meta?.party_category && (
                     <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                       {customerDetails.meta.party_category}
                     </span>
                   )}
                   {customerDetails.gstin && (
                     <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-500/20 font-mono">
                       GSTIN: {customerDetails.gstin}
                     </span>
                   )}
                </div>
              </div>

              {/* Financial Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Invoiced</span>
                  <span className="text-lg sm:text-xl font-black text-white font-mono mt-2">
                    {getCurrencySymbol()}{totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Total Paid</span>
                  <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-2">
                    {getCurrencySymbol()}{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Outstanding Due</span>
                  <span className="text-lg sm:text-xl font-black text-amber-400 font-mono mt-2">
                    {getCurrencySymbol()}{outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Total Documents</span>
                  <span className="text-lg sm:text-xl font-black text-cyan-400 font-mono mt-2">
                    {customerInvoices.length} Inv / {customerChallans.length} DC
                  </span>
                </div>
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {/* Contact Details */}
                  <div className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-2xl space-y-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-white/5 pb-3">
                      Contact Details
                    </h3>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Email</span>
                        <span className="text-sm text-white font-medium break-all">{customerDetails.email || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</span>
                        <span className="text-sm text-white font-medium">{customerDetails.phone || 'N/A'}</span>
                      </div>
                      <div className="pt-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Billing Address</span>
                        <span className="text-sm text-gray-300 leading-relaxed block bg-black/20 p-3 rounded-xl border border-white/5">
                          {customerDetails.address || 'No address provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Summary */}
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-white/5 pb-3">
                      Account Summary
                    </h3>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Customer ID</span>
                        <span className="text-xs text-cyan-400 font-mono bg-cyan-400/10 px-2 py-1 rounded self-start sm:self-auto">{customerDetails.id?.substring(0, 8)}...</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Created At</span>
                        <span className="text-sm text-white">
                          {customerDetails.created_at ? format(new Date(customerDetails.created_at), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Place of Supply</span>
                        <span className="text-sm text-white uppercase tracking-wider font-bold">{customerDetails.state || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pt-4 border-t border-white/5">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Credit Limit</span>
                        <span className="text-lg font-black text-white font-mono">
                          {getCurrencySymbol()}{customerDetails.meta?.credit_limit ? Number(customerDetails.meta.credit_limit).toLocaleString() : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INVOICES LEDGER */}
              {activeTab === "invoices" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Sales Invoices Ledger</h3>
                      <p className="text-xs text-gray-400 mt-1">Transaction record for {customerDetails.name}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full">
                      {customerInvoices.length} Records
                    </span>
                  </div>

                  {isLoadingInvoices ? (
                    <div className="py-12 flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                    </div>
                  ) : customerInvoices.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 text-xs font-bold uppercase tracking-wider">
                      No invoices recorded for this customer yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider">
                            <th className="py-3 px-4">Invoice #</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Due Date</th>
                            <th className="py-3 px-4 text-right">Total</th>
                            <th className="py-3 px-4 text-right">Paid</th>
                            <th className="py-3 px-4 text-right">Balance</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {customerInvoices.map((inv) => {
                            const tot = Number(inv.total_amount) || 0;
                            const paid = Number(inv.amount_paid) || 0;
                            const bal = tot - paid;
                            const status = inv.payment_status || (bal <= 0 ? 'paid' : paid > 0 ? 'partial' : 'pending');

                            return (
                              <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-3 px-4 font-mono font-black text-cyan-400">
                                  {inv.invoice_number || inv.id?.slice(0, 8)}
                                </td>
                                <td className="py-3 px-4 text-gray-300">
                                  {inv.invoice_date ? format(new Date(inv.invoice_date), 'dd MMM yyyy') : '-'}
                                </td>
                                <td className="py-3 px-4 text-gray-400">
                                  {inv.due_date ? format(new Date(inv.due_date), 'dd MMM yyyy') : '-'}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-white">
                                  {getCurrencySymbol()}{tot.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-emerald-400">
                                  {getCurrencySymbol()}{paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-amber-400 font-bold">
                                  {getCurrencySymbol()}{bal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    status === 'partial' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}>
                                    {status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DELIVERY CHALLANS */}
              {activeTab === "challans" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Delivery Challans</h3>
                      <p className="text-xs text-gray-400 mt-1">Dispatches and linked challans</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full">
                      {customerChallans.length} Records
                    </span>
                  </div>

                  {isLoadingChallans ? (
                    <div className="py-12 flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                    </div>
                  ) : customerChallans.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 text-xs font-bold uppercase tracking-wider">
                      No delivery challans issued for this customer yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider">
                            <th className="py-3 px-4">Challan #</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Items Count</th>
                            <th className="py-3 px-4 text-right">Total Amount</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {customerChallans.map((ch) => {
                            const tot = Number(ch.total_amount) || 0;
                            const itemsCount = ch.items?.length || 0;
                            const status = ch.status || (ch.is_billed ? 'billed' : 'open');

                            return (
                              <tr key={ch.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-3 px-4 font-mono font-black text-cyan-400">
                                  {ch.challan_number || ch.id?.slice(0, 8)}
                                </td>
                                <td className="py-3 px-4 text-gray-300">
                                  {ch.challan_date ? format(new Date(ch.challan_date), 'dd MMM yyyy') : '-'}
                                </td>
                                <td className="py-3 px-4 text-gray-400 font-mono">
                                  {itemsCount} items
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-white">
                                  {getCurrencySymbol()}{tot.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    status === 'billed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    status === 'open' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                  }`}>
                                    {status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* System Note */}
              <div className="bg-cyan-500/5 border border-cyan-500/10 p-4 rounded-xl text-center">
                <p className="text-xs text-cyan-400/70 font-medium">
                  This profile was automatically generated on {format(new Date(), 'PPPP')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 print-hidden">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-3 text-xs font-black text-gray-400 uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              Close Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}