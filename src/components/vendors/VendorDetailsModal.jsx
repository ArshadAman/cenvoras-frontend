import React, { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getVendor } from "../../api/vendors";
import { getPurchaseBills } from "../../api/purchase";
import { listPurchaseOrders } from "../../api/purchase_orders";
import { getDebitNotes } from "../../api/gst";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import { EyeIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import PurchaseDetailsModal from "../purchase/PurchaseDetailsModal";
import useEscKey from "../../hooks/useEscStack";

export default function VendorDetailsModal({ isOpen, onClose, vendor }) {
  useEscKey(onClose, isOpen, 15);
  const printRef = useRef();
  const [activeTab, setActiveTab] = useState("bills");
  const [previewBillId, setPreviewBillId] = useState(null);

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

  const { data: debitNotesData } = useQuery({
    queryKey: ["debit-notes"],
    queryFn: getDebitNotes,
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

  const rawDebitNotes = Array.isArray(debitNotesData)
    ? debitNotesData
    : debitNotesData?.data || debitNotesData?.results || [];

  /** Map original_bill id → sum of DN totals (same netting as vendor unpaid-bills API). */
  const dnCreditByBillId = rawDebitNotes.reduce((acc, dn) => {
    const billId = dn.original_bill?.id ?? dn.original_bill;
    if (!billId) return acc;
    const key = String(billId);
    acc[key] = (acc[key] || 0) + (Number(dn.total_amount) || 0);
    return acc;
  }, {});

  const billBalanceDue = (bill) => {
    const tot = Number(bill.total_amount) || 0;
    const paid = Number(bill.amount_paid) || 0;
    const dnCredit = dnCreditByBillId[String(bill.id)] || 0;
    return Math.max(0, tot - paid - dnCredit);
  };

  const totalBilled = vendorBills.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
  const totalPaid = vendorBills.reduce((sum, b) => sum + (Number(b.amount_paid) || 0), 0);
  const outstandingBalance = vendorBills.reduce((sum, b) => sum + billBalanceDue(b), 0);

  const getReferenceForBill = (bill) => {
    const ref = bill.meta?.po_number || bill.order_number || bill.purchase_order_number || bill.challan_number || bill.meta?.challan_number || bill.meta?.reference_number;
    if (ref) return ref;

    const matchedPo = vendorOrders.find(po => {
      const poId = bill.purchase_order?.id || bill.purchase_order || bill.purchase_order_id;
      if (poId && (poId === po.id || String(poId) === String(po.id))) return true;
      if (po.po_number && bill.order_number && po.po_number.trim().toLowerCase() === bill.order_number.trim().toLowerCase()) return true;
      return false;
    });

    if (matchedPo) return matchedPo.po_number || `PO-${matchedPo.id?.slice(0, 6)}`;
    return null;
  };

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform animate-fade-up overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0 bg-[var(--bg-surface)] z-10 print-hidden">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">
              Vendor <span className="text-[var(--accent-primary)]">Profile & Ledger</span>
            </h2>
            <div className="flex bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("bills")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "bills"
                    ? "bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold shadow-md"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span>Ledger (Bills)</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                  activeTab === "bills" ? "bg-black/20 text-[var(--text-on-accent)]" : "bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                }`}>
                  {vendorBills.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "orders"
                    ? "bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold shadow-md"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span>Orders</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                  activeTab === "orders" ? "bg-black/20 text-[var(--text-on-accent)]" : "bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                }`}>
                  {vendorOrders.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "overview"
                    ? "bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold shadow-md"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                Overview
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 sm:px-4 sm:py-2 bg-[var(--bg-primary)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-xl transition-all flex items-center gap-2"
              title="Print Profile"
            >
              <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="p-2 sm:px-4 sm:py-2 bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 rounded-xl transition-all flex items-center gap-2"
              title="Download PDF"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={printRef} data-print-target className="flex-1 overflow-y-auto p-5 sm:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)]"></div>
              <div className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider">Loading Profile...</div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Vendor Header */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--accent-primary)] rounded-2xl flex items-center justify-center text-[var(--text-on-accent)] text-2xl sm:text-3xl font-black mb-2 shadow-xl">
                  {vendorDetails.name?.charAt(0).toUpperCase() || 'V'}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                  {vendorDetails.name || 'N/A'}
                </h1>
                <div className="flex flex-wrap justify-center gap-2">
                   {vendorDetails.meta?.party_category && (
                     <span className="badge-info text-xs font-semibold uppercase tracking-wider">
                       {vendorDetails.meta.party_category}
                     </span>
                   )}
                   {vendorDetails.gstin && (
                     <span className="badge-success text-xs font-semibold uppercase tracking-wider font-mono">
                       GSTIN: {vendorDetails.gstin}
                     </span>
                   )}
                </div>
              </div>

              {/* Financial Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total Billed</span>
                  <span className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-mono mt-2">
                    {getCurrencySymbol()}{totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-[var(--status-success-bg)] border border-[var(--status-success-border)] rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-[var(--status-success-text)] uppercase tracking-wider">Total Paid</span>
                  <span className="text-lg sm:text-xl font-bold text-[var(--status-success-text)] font-mono mt-2">
                    {getCurrencySymbol()}{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-[var(--status-warning-text)] uppercase tracking-wider">Outstanding Due</span>
                  <span className="text-lg sm:text-xl font-bold text-[var(--status-warning-text)] font-mono mt-2">
                    {getCurrencySymbol()}{outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider">Total Documents</span>
                  <span className="text-lg sm:text-xl font-bold text-[var(--accent-primary)] font-mono mt-2">
                    {vendorBills.length} Bills / {vendorOrders.length} PO
                  </span>
                </div>
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {/* Contact Details */}
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-5 sm:p-6 rounded-2xl space-y-6">
                    <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-3">
                      Contact Details
                    </h3>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Email</span>
                        <span className="text-sm text-[var(--text-primary)] font-medium break-all">{vendorDetails.email || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Phone</span>
                        <span className="text-sm text-[var(--text-primary)] font-medium">{vendorDetails.phone || 'N/A'}</span>
                      </div>
                      <div className="pt-2">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Billing Address</span>
                        <span className="text-sm text-[var(--text-secondary)] leading-relaxed block bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-subtle)]">
                          {vendorDetails.address || 'No address provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Summary */}
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-5 sm:p-6 rounded-2xl space-y-6">
                    <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-3">
                      Account Summary
                    </h3>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Vendor ID</span>
                        <span className="text-xs text-[var(--accent-primary)] font-mono bg-[var(--accent-primary)]/10 px-2 py-1 rounded self-start sm:self-auto">{vendorDetails.id?.substring(0, 8)}...</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Created At</span>
                        <span className="text-sm text-[var(--text-primary)]">
                          {vendorDetails.created_at ? format(new Date(vendorDetails.created_at), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Place of Supply</span>
                        <span className="text-sm text-[var(--text-primary)] uppercase tracking-wider font-semibold">{vendorDetails.state || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pt-4 border-t border-[var(--border-subtle)]">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Credit Limit</span>
                        <span className="text-lg font-bold text-[var(--text-primary)] font-mono">
                          {getCurrencySymbol()}{vendorDetails.meta?.credit_limit ? Number(vendorDetails.meta.credit_limit).toLocaleString() : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PURCHASE BILLS */}
              {activeTab === "bills" && (
                <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Purchase Bills Ledger</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Detailed purchase bills & order references for {vendorDetails.name}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-1 rounded-full">
                      {vendorBills.length} Records
                    </span>
                  </div>

                  {isLoadingBills ? (
                    <div className="py-12 flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
                    </div>
                  ) : vendorBills.length === 0 ? (
                    <div className="py-12 text-center text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider">
                      No purchase bills recorded for this vendor yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                            <th className="py-3 px-4">Bill #</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Due Date</th>
                            <th className="py-3 px-4">PO / Ref #</th>
                            <th className="py-3 px-4 text-right">Total</th>
                            <th className="py-3 px-4 text-right">Paid</th>
                            <th className="py-3 px-4 text-right">Balance</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-center print-hidden">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                          {vendorBills.map((bill) => {
                            const tot = Number(bill.total_amount) || 0;
                            const paid = Number(bill.amount_paid) || 0;
                            const bal = billBalanceDue(bill);
                            const status = bill.payment_status || (bal <= 0 ? 'paid' : paid > 0 ? 'partial' : 'pending');
                            const ref = getReferenceForBill(bill);

                            return (
                              <tr key={bill.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                                <td className="py-3 px-4 font-mono font-bold">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewBillId(bill.id)}
                                    className="text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1 group text-left cursor-pointer"
                                    title="View Full Bill Details & Print / Download"
                                  >
                                    <span>{bill.bill_number || bill.id?.slice(0, 8)}</span>
                                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                                  </button>
                                </td>
                                <td className="py-3 px-4 text-[var(--text-secondary)]">
                                  {bill.bill_date ? format(new Date(bill.bill_date), 'dd MMM yyyy') : '-'}
                                </td>
                                <td className="py-3 px-4 text-[var(--text-muted)]">
                                  {bill.due_date ? format(new Date(bill.due_date), 'dd MMM yyyy') : '-'}
                                </td>
                                <td className="py-3 px-4">
                                  {ref ? (
                                    <span
                                      className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] text-xs font-mono font-medium"
                                      title={`PO / Reference: ${ref}`}
                                    >
                                      #{ref}
                                    </span>
                                  ) : (
                                    <span className="text-[var(--text-muted)] font-mono text-xs">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-[var(--text-primary)]">
                                  {getCurrencySymbol()}{tot.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-[var(--status-success-text)] font-semibold">
                                  {getCurrencySymbol()}{paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-[var(--status-warning-text)] font-bold">
                                  {getCurrencySymbol()}{bal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                    status === 'paid' ? 'badge-success' :
                                    status === 'partial' ? 'badge-warning' :
                                    'badge-danger'
                                  }`}>
                                    {status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center print-hidden">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewBillId(bill.id)}
                                    className="p-1 rounded-md bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-[var(--border-default)] transition-all inline-flex items-center"
                                    title="View & Print Bill"
                                    aria-label="View & Print Bill"
                                  >
                                    <EyeIcon className="w-3.5 h-3.5" />
                                  </button>
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
                <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Purchase Orders</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Orders placed to {vendorDetails.name}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-1 rounded-full">
                      {vendorOrders.length} Records
                    </span>
                  </div>

                  {isLoadingOrders ? (
                    <div className="py-12 flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
                    </div>
                  ) : vendorOrders.length === 0 ? (
                    <div className="py-12 text-center text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider">
                      No purchase orders recorded for this vendor yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                            <th className="py-3 px-4">PO #</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4 text-right">Total Amount</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                          {vendorOrders.map((po) => {
                            const tot = Number(po.total_amount) || 0;
                            const status = po.status || 'draft';

                            return (
                              <tr key={po.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                                <td className="py-3 px-4 font-mono font-bold text-[var(--accent-primary)]">
                                  {po.po_number || po.id?.slice(0, 8)}
                                </td>
                                <td className="py-3 px-4 text-[var(--text-secondary)]">
                                  {po.created_at ? format(new Date(po.created_at), 'dd MMM yyyy') : '-'}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-[var(--text-primary)]">
                                  {getCurrencySymbol()}{tot.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                    status === 'received' ? 'badge-success' :
                                    status === 'sent' ? 'badge-info' :
                                    'badge-neutral'
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
              <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4 rounded-xl text-center">
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  This profile was automatically generated on {format(new Date(), 'PPPP')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-subtle)] print-hidden">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="btn-secondary w-full sm:w-auto px-8"
            >
              Close Profile
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Purchase Bill Preview Modal */}
      {previewBillId && (
        <PurchaseDetailsModal
          billId={previewBillId}
          onClose={() => setPreviewBillId(null)}
        />
      )}
    </div>
  );
}