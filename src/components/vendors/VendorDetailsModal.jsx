import React, { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getVendor } from "../../api/vendors";
import { getPurchaseBills } from "../../api/purchase";
import { listPurchaseOrders } from "../../api/purchase_orders";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

export default function VendorDetailsModal({ isOpen, onClose, vendor }) {
  const printRef = useRef();
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["vendor", vendor?.id],
    queryFn: () => getVendor(vendor?.id),
    enabled: !!vendor?.id,
  });

  const { data: billsData, isLoading: isLoadingBills } = useQuery({
    queryKey: ["vendor-bills", vendor?.id],
    queryFn: () => getPurchaseBills({ vendor: vendor?.id }),
    enabled: !!vendor?.id,
  });

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["vendor-orders", vendor?.id],
    queryFn: listPurchaseOrders,
    enabled: !!vendor?.id,
  });

  const vendorDetails = data?.data || data || vendor || {};

  const rawBills = Array.isArray(billsData) ? billsData : billsData?.data || billsData?.results || [];
  const vendorBills = rawBills.filter(b =>
    b.vendor === vendor?.id ||
    b.vendor?.id === vendor?.id ||
    (vendor?.name && b.vendor_name?.toLowerCase() === vendor?.name?.toLowerCase())
  );

  const rawOrders = Array.isArray(ordersData) ? ordersData : ordersData?.data || ordersData?.results || [];
  const vendorOrders = rawOrders.filter(po =>
    po.vendor === vendor?.id ||
    po.vendor?.id === vendor?.id ||
    (vendor?.name && po.vendor_name?.toLowerCase() === vendor?.name?.toLowerCase())
  );

  const totalBilled = vendorBills.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
  const totalPaid = vendorBills.reduce((sum, b) => sum + (Number(b.amount_paid) || 0), 0);
  const outstandingBalance = totalBilled - totalPaid;

  // Print functionality
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Vendor Details - ${vendorDetails?.name || vendor?.id}`,
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
    if (!printRef.current || !vendorDetails) return;

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

      pdf.save(`vendor-details-${vendorDetails?.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || vendor?.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (!isOpen || !vendor) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-start justify-center z-[9999] p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0F0F12] border border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl my-8 transform animate-fade-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0F0F12]/80 backdrop-blur-md z-10 print-hidden">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              Vendor <span className="text-indigo-400">Profile & Ledger</span>
            </h2>
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "overview"
                    ? "bg-indigo-500 text-white font-black shadow-lg shadow-indigo-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("bills")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "bills"
                    ? "bg-indigo-500 text-white font-black shadow-lg shadow-indigo-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <span>Bills</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                  {vendorBills.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "orders"
                    ? "bg-indigo-500 text-white font-black shadow-lg shadow-indigo-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <span>Orders</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                  {vendorOrders.length}
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
              className="p-2 sm:px-4 sm:py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl transition-all flex items-center gap-2"
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              <div className="text-gray-500 text-xs font-black uppercase tracking-widest">Loading Profile...</div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Vendor Header */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-black mb-2 shadow-xl shadow-indigo-500/20">
                  {vendorDetails.name?.charAt(0).toUpperCase() || 'V'}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {vendorDetails.name || 'N/A'}
                </h1>
                <div className="flex flex-wrap justify-center gap-2">
                   {vendorDetails.meta?.party_category && (
                     <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                       {vendorDetails.meta.party_category}
                     </span>
                   )}
                   {vendorDetails.gstin && (
                     <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-500/20 font-mono">
                       GSTIN: {vendorDetails.gstin}
                     </span>
                   )}
                </div>
              </div>

              {/* Financial Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Billed</span>
                  <span className="text-lg sm:text-xl font-black text-white font-mono mt-2">
                    {getCurrencySymbol()}{totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Documents</span>
                  <span className="text-lg sm:text-xl font-black text-indigo-400 font-mono mt-2">
                    {vendorBills.length} Bills / {vendorOrders.length} PO
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
                        <span className="text-sm text-white font-medium break-all">{vendorDetails.email || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</span>
                        <span className="text-sm text-white font-medium">{vendorDetails.phone || 'N/A'}</span>
                      </div>
                      <div className="pt-2">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Billing Address</span>
                        <span className="text-sm text-gray-300 leading-relaxed block bg-black/20 p-3 rounded-xl border border-white/5">
                          {vendorDetails.address || 'No address provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Summary */}
                  <div className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-2xl space-y-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-white/5 pb-3">
                      Account Summary
                    </h3>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor ID</span>
                        <span className="text-xs text-indigo-400 font-mono bg-indigo-400/10 px-2 py-1 rounded self-start sm:self-auto">{vendorDetails.id?.substring(0, 8)}...</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Created At</span>
                        <span className="text-sm text-white">
                          {vendorDetails.created_at ? format(new Date(vendorDetails.created_at), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Place of Supply</span>
                        <span className="text-sm text-white uppercase tracking-wider font-bold">{vendorDetails.state || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pt-4 border-t border-white/5">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Credit Limit</span>
                        <span className="text-lg font-black text-white font-mono">
                          {getCurrencySymbol()}{vendorDetails.meta?.credit_limit ? Number(vendorDetails.meta.credit_limit).toLocaleString() : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PURCHASE BILLS */}
              {activeTab === "bills" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Purchase Bills Ledger</h3>
                      <p className="text-xs text-gray-400 mt-1">Transaction record for {vendorDetails.name}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full">
                      {vendorBills.length} Records
                    </span>
                  </div>

                  {isLoadingBills ? (
                    <div className="py-12 flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : vendorBills.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 text-xs font-bold uppercase tracking-wider">
                      No purchase bills recorded for this vendor yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider">
                            <th className="py-3 px-4">Bill #</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Due Date</th>
                            <th className="py-3 px-4 text-right">Total</th>
                            <th className="py-3 px-4 text-right">Paid</th>
                            <th className="py-3 px-4 text-right">Balance</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {vendorBills.map((bill) => {
                            const tot = Number(bill.total_amount) || 0;
                            const paid = Number(bill.amount_paid) || 0;
                            const bal = tot - paid;
                            const status = bill.payment_status || (bal <= 0 ? 'paid' : paid > 0 ? 'partial' : 'pending');

                            return (
                              <tr key={bill.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-3 px-4 font-mono font-black text-indigo-400">
                                  {bill.bill_number || bill.id?.slice(0, 8)}
                                </td>
                                <td className="py-3 px-4 text-gray-300">
                                  {bill.bill_date ? format(new Date(bill.bill_date), 'dd MMM yyyy') : '-'}
                                </td>
                                <td className="py-3 px-4 text-gray-400">
                                  {bill.due_date ? format(new Date(bill.due_date), 'dd MMM yyyy') : '-'}
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

              {/* TAB 3: PURCHASE ORDERS */}
              {activeTab === "orders" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Purchase Orders</h3>
                      <p className="text-xs text-gray-400 mt-1">Orders placed to {vendorDetails.name}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full">
                      {vendorOrders.length} Records
                    </span>
                  </div>

                  {isLoadingOrders ? (
                    <div className="py-12 flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : vendorOrders.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 text-xs font-bold uppercase tracking-wider">
                      No purchase orders recorded for this vendor yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider">
                            <th className="py-3 px-4">PO #</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4 text-right">Total Amount</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {vendorOrders.map((po) => {
                            const tot = Number(po.total_amount) || 0;
                            const status = po.status || 'draft';

                            return (
                              <tr key={po.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-3 px-4 font-mono font-black text-indigo-400">
                                  {po.po_number || po.id?.slice(0, 8)}
                                </td>
                                <td className="py-3 px-4 text-gray-300">
                                  {po.created_at ? format(new Date(po.created_at), 'dd MMM yyyy') : '-'}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-white">
                                  {getCurrencySymbol()}{tot.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    status === 'received' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    status === 'sent' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
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
              <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl text-center">
                <p className="text-xs text-indigo-400/70 font-medium">
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