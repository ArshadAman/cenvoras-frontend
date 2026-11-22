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
import { EyeIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import SalesDetailsModal from "../sales/SalesDetailsModal";
import useEscKey from "../../hooks/useEscStack";
import { STATEMENT_PRINT_PAGE_STYLE, prepareClonedStatementElementForPdf } from "../../utils/statementPrintStyles";

export default function CustomerDetailsModal({ isOpen, onClose, customer }) {
  useEscKey(onClose, isOpen, 15);
  const printRef = useRef();

  const [activeTab, setActiveTab] = useState("invoices");
  const [previewDoc, setPreviewDoc] = useState(null);

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
  const customerInvoices = rawInvoices.filter(inv => {
    const invCustId = inv.customer?.id || inv.customer;
    if (invCustId) return String(invCustId) === String(customer?.id);
    return customer?.name && inv.customer_name?.toLowerCase() === customer?.name?.toLowerCase();
  });

  const rawChallans = Array.isArray(challansData) ? challansData : challansData?.data || challansData?.results || [];
  const customerChallans = rawChallans.filter(ch => {
    const chCustId = ch.customer?.id || ch.customer;
    if (chCustId) return String(chCustId) === String(customer?.id);
    return customer?.name && (
      ch.customer_name?.toLowerCase() === customer?.name?.toLowerCase() ||
      ch.customer?.name?.toLowerCase() === customer?.name?.toLowerCase()
    );
  });

  // Financial accounting: only confirmed/posted invoices drive receivables (drafts are unposted)
  const confirmedInvoices = customerInvoices.filter(inv => inv.status !== 'draft');
  const totalInvoiced = confirmedInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
  const totalPaid = confirmedInvoices.reduce((sum, inv) => sum + (Number(inv.amount_paid) || 0), 0);
  const rawBal = customerDetails.current_balance;
  let outstandingBalance = (rawBal !== undefined && rawBal !== null && !isNaN(Number(rawBal)))
    ? Number(rawBal)
    : (totalInvoiced - totalPaid);
  // Guard against phantom receivables when customer has no confirmed invoices
  if (confirmedInvoices.length === 0 && outstandingBalance > 0) {
    outstandingBalance = 0;
  }

  const getRelatedChallansForInvoice = (inv) => {
    const matched = customerChallans.filter(ch => {
      const convInvId = ch.converted_invoice?.id || ch.converted_invoice;
      if (convInvId && (convInvId === inv.id || String(convInvId) === String(inv.id))) return true;
      if (ch.converted_invoice_number && inv.invoice_number &&
          ch.converted_invoice_number.trim().toLowerCase() === inv.invoice_number.trim().toLowerCase()) {
        return true;
      }
      if (inv.challan_number && ch.challan_number &&
          inv.challan_number.trim().toLowerCase() === ch.challan_number.trim().toLowerCase()) {
        return true;
      }
      return false;
    });

    if (matched.length > 0) {
      return matched.map(ch => ({
        id: ch.id,
        number: ch.challan_number || `DC-${ch.id?.slice(0, 6)}`,
        date: ch.challan_date,
        rawChallan: ch,
      }));
    }

    if (inv.challan_number) {
      return [{
        id: null,
        number: inv.challan_number,
        date: inv.challan_date,
        rawChallan: null,
      }];
    }

    return [];
  };

  // Print functionality
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Customer-Statement-${customerDetails?.name || customer?.id}`,
    pageStyle: STATEMENT_PRINT_PAGE_STYLE,
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
          prepareClonedStatementElementForPdf(clonedDoc, '[data-print-target]');
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

      pdf.save(`customer-statement-${customerDetails?.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || customer?.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform animate-fade-up overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0 bg-[var(--bg-surface)] z-10 print-hidden">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">
              Customer <span className="text-[var(--accent-primary)]">Profile & Ledger</span>
            </h2>
            {customerDetails?.linked_vendor?.name && (
              <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                Also vendor: {customerDetails.linked_vendor.name}
              </span>
            )}
            <div className="flex bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("invoices")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "invoices"
                    ? "bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold shadow-md"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span>Ledger (Invoices)</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                  activeTab === "invoices" ? "bg-black/20 text-[var(--text-on-accent)]" : "bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                }`}>
                  {customerInvoices.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("challans")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "challans"
                    ? "bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold shadow-md"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span>Challans</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                  activeTab === "challans" ? "bg-black/20 text-[var(--text-on-accent)]" : "bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                }`}>
                  {customerChallans.length}
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
        <div ref={printRef} data-print-target className="statement-print-root flex-1 overflow-y-auto p-5 sm:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)]"></div>
              <div className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider">Loading Profile...</div>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {/* Executive Statement Header */}
              <div className="border-b border-[var(--border-subtle)] pb-6 statement-no-break">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Left: Identity & Contact Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--accent-primary)] text-[var(--text-on-accent)] flex items-center justify-center text-2xl sm:text-3xl font-black shadow-md shrink-0">
                      {customerDetails.name?.charAt(0).toUpperCase() || customer?.name?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                          {customerDetails.name || customer?.name || 'Customer Profile'}
                        </h1>
                        {customerDetails.meta?.party_category && (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 uppercase tracking-wider">
                            {customerDetails.meta.party_category}
                          </span>
                        )}
                      </div>
                      {customerDetails.gstin && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[var(--status-success-bg)] text-[var(--status-success-text)] border border-[var(--status-success-border)] text-xs font-mono font-semibold">
                          <span>GSTIN:</span>
                          <span>{customerDetails.gstin}</span>
                        </div>
                      )}
                      <div className="text-xs text-[var(--text-secondary)] flex flex-wrap gap-x-4 gap-y-1 pt-1">
                        {customerDetails.email && (
                          <span><strong className="text-[var(--text-muted)] font-medium">Email:</strong> {customerDetails.email}</span>
                        )}
                        {customerDetails.phone && (
                          <span><strong className="text-[var(--text-muted)] font-medium">Phone:</strong> {customerDetails.phone}</span>
                        )}
                        {customerDetails.state && (
                          <span><strong className="text-[var(--text-muted)] font-medium">POS / State:</strong> {customerDetails.state}</span>
                        )}
                      </div>
                      {customerDetails.address && (
                        <p className="text-xs text-[var(--text-muted)] max-w-xl line-clamp-2 mt-0.5">
                          {customerDetails.address}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Statement Metadata */}
                  <div className="text-left sm:text-right flex flex-col justify-between sm:items-end gap-1.5 shrink-0 bg-[var(--bg-primary)] sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-[var(--border-subtle)]">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 self-start sm:self-auto">
                      Customer Statement & Ledger
                    </span>
                    <div className="text-xs text-[var(--text-muted)] space-y-0.5">
                      <div>Statement Date: <span className="font-semibold text-[var(--text-primary)]">{format(new Date(), 'dd MMM yyyy')}</span></div>
                      <div>Customer ID: <span className="font-mono text-[var(--text-secondary)]">{customerDetails.id?.substring(0, 8) || customer?.id?.substring(0, 8) || 'N/A'}</span></div>
                      {customerDetails.meta?.credit_limit && (
                        <div>Credit Limit: <span className="font-mono font-semibold text-[var(--text-primary)]">{getCurrencySymbol()}{Number(customerDetails.meta.credit_limit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 statement-no-break">
                <div className="bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl p-3 sm:p-4 flex flex-col justify-between metric-card">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total Invoiced</span>
                  <span className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-mono mt-1.5">
                    {getCurrencySymbol()}{totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-[var(--status-success-bg)] border border-[var(--status-success-border)] rounded-xl p-3 sm:p-4 flex flex-col justify-between metric-card">
                  <span className="text-[11px] font-semibold text-[var(--status-success-text)] uppercase tracking-wider">Total Paid</span>
                  <span className="text-lg sm:text-xl font-bold text-[var(--status-success-text)] font-mono mt-1.5">
                    {getCurrencySymbol()}{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] rounded-xl p-3 sm:p-4 flex flex-col justify-between metric-card">
                  <span className="text-[11px] font-semibold text-[var(--status-warning-text)] uppercase tracking-wider">Outstanding Due</span>
                  <span className="text-lg sm:text-xl font-bold text-[var(--status-warning-text)] font-mono mt-1.5">
                    {getCurrencySymbol()}{outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xl p-3 sm:p-4 flex flex-col justify-between metric-card">
                  <span className="text-[11px] font-semibold text-[var(--accent-primary)] uppercase tracking-wider">Total Documents</span>
                  <span className="text-lg sm:text-xl font-bold text-[var(--accent-primary)] font-mono mt-1.5">
                    {customerInvoices.length} Inv / {customerChallans.length} DC
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
                        <span className="text-sm text-[var(--text-primary)] font-medium break-all">{customerDetails.email || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Phone</span>
                        <span className="text-sm text-[var(--text-primary)] font-medium">{customerDetails.phone || 'N/A'}</span>
                      </div>
                      <div className="pt-2">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Billing Address</span>
                        <span className="text-sm text-[var(--text-secondary)] leading-relaxed block bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-subtle)]">
                          {customerDetails.address || 'No address provided'}
                        </span>
                      </div>
                      {(() => {
                        const savedShips = Array.isArray(customerDetails.meta?.shipping_addresses)
                          ? customerDetails.meta.shipping_addresses.filter(Boolean)
                          : (Array.isArray(customerDetails.shipping_addresses) ? customerDetails.shipping_addresses.filter(Boolean) : []);
                        if (savedShips.length === 0) return null;
                        return (
                          <div className="pt-2">
                            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                              Saved Shipping Addresses ({savedShips.length})
                            </span>
                            <div className="space-y-2">
                              {savedShips.map((addr, i) => (
                                <span key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed block bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-subtle)]">
                                  {addr}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Account Summary */}
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-6 rounded-2xl space-y-6">
                    <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-3">
                      Account Summary
                    </h3>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Customer ID</span>
                        <span className="text-xs text-[var(--accent-primary)] font-mono bg-[var(--accent-primary)]/10 px-2 py-1 rounded self-start sm:self-auto">{customerDetails.id?.substring(0, 8)}...</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Created At</span>
                        <span className="text-sm text-[var(--text-primary)]">
                          {customerDetails.created_at ? format(new Date(customerDetails.created_at), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Place of Supply</span>
                        <span className="text-sm text-[var(--text-primary)] uppercase tracking-wider font-semibold">{customerDetails.state || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pt-4 border-t border-[var(--border-subtle)]">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Credit Limit</span>
                        <span className="text-lg font-bold text-[var(--text-primary)] font-mono">
                          {getCurrencySymbol()}{customerDetails.meta?.credit_limit ? Number(customerDetails.meta.credit_limit).toLocaleString() : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INVOICES LEDGER */}
              {activeTab === "invoices" && (
                <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Sales Invoices Ledger</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">Detailed transaction & dispatch records for {customerDetails.name || 'Customer'}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-3 py-1 rounded-full">
                      {customerInvoices.length} Records
                    </span>
                  </div>

                  {isLoadingInvoices ? (
                    <div className="py-12 flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
                    </div>
                  ) : customerInvoices.length === 0 ? (
                    <div className="py-12 text-center text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider">
                      No invoices recorded for this customer yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[var(--bg-primary)] border-b border-[var(--border-default)] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3">Invoice #</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Due Date</th>
                            <th className="py-2.5 px-3">Related Challan(s)</th>
                            <th className="py-2.5 px-3 text-right">Total</th>
                            <th className="py-2.5 px-3 text-right">Paid</th>
                            <th className="py-2.5 px-3 text-right">Balance</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-center print-hidden statement-action-col">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                          {customerInvoices.map((inv) => {
                            const isDraft = inv.status === 'draft';
                            const tot = Number(inv.total_amount) || 0;
                            const paid = Number(inv.amount_paid) || 0;
                            const bal = tot - paid;
                            const status = isDraft ? 'draft' : (inv.payment_status || (bal <= 0 ? 'paid' : paid > 0 ? 'partial' : 'pending'));
                            const relatedChallans = getRelatedChallansForInvoice(inv);

                            return (
                              <tr key={inv.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors statement-no-break">
                                <td className="py-2.5 px-3 font-mono font-bold">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDoc({ invoice: inv, documentType: "invoice" })}
                                    className="statement-doc-link text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1 group text-left cursor-pointer"
                                    title="View Full Invoice Details"
                                  >
                                    <span>{inv.invoice_number || inv.id?.slice(0, 8)}</span>
                                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity print-hidden" />
                                  </button>
                                </td>
                                <td className="py-2.5 px-3 text-[var(--text-secondary)] whitespace-nowrap">
                                  {inv.invoice_date ? format(new Date(inv.invoice_date), 'dd MMM yyyy') : '-'}
                                </td>
                                <td className="py-2.5 px-3 text-[var(--text-muted)] whitespace-nowrap">
                                  {inv.due_date ? format(new Date(inv.due_date), 'dd MMM yyyy') : '-'}
                                </td>
                                <td className="py-2.5 px-3">
                                  {relatedChallans.length === 0 ? (
                                    <span className="text-[var(--text-muted)] font-mono text-xs">—</span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                      {relatedChallans.map((c, idx) => (
                                        c.rawChallan ? (
                                          <button
                                            key={c.id || idx}
                                            type="button"
                                            onClick={() => setPreviewDoc({ invoice: c.rawChallan, documentType: "delivery_challan" })}
                                            className="statement-doc-link inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 text-xs font-mono font-bold transition-all cursor-pointer"
                                            title={`View Delivery Challan #${c.number}${c.date ? ` (${format(new Date(c.date), 'dd/MM/yyyy')})` : ''}`}
                                          >
                                            <span>#{c.number}</span>
                                            {c.date && <span className="text-xs text-[var(--accent-primary)]/70 font-normal">({format(new Date(c.date), 'dd/MM')})</span>}
                                          </button>
                                        ) : (
                                          <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] text-xs font-mono font-medium"
                                            title={`Challan Ref: #${c.number}${c.date ? ` (${format(new Date(c.date), 'dd/MM/yyyy')})` : ''}`}
                                          >
                                            <span>#{c.number}</span>
                                            {c.date && <span className="text-xs text-[var(--text-muted)] font-normal">({format(new Date(c.date), 'dd/MM')})</span>}
                                          </span>
                                        )
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--text-primary)] whitespace-nowrap">
                                  {getCurrencySymbol()}{tot.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-[var(--status-success-text)] font-semibold whitespace-nowrap">
                                  {getCurrencySymbol()}{paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-[var(--status-warning-text)] font-bold whitespace-nowrap">
                                  {isDraft ? (
                                    <span className="text-[var(--text-muted)] font-normal italic">— (Draft)</span>
                                  ) : (
                                    `${getCurrencySymbol()}${bal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  {isDraft ? (
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                      Draft
                                    </span>
                                  ) : (
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      status === 'paid' ? 'badge-success' :
                                      status === 'partial' ? 'badge-warning' :
                                      'badge-danger'
                                    }`}>
                                      {status}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center print-hidden statement-action-col">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDoc({ invoice: inv, documentType: "invoice" })}
                                    className="p-1 rounded-md bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-[var(--border-default)] transition-all inline-flex items-center"
                                    title="View & Print Invoice"
                                    aria-label="View & Print Invoice"
                                  >
                                    <EyeIcon className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {/* Grand Total Summary Row */}
                        <tfoot>
                          <tr className="bg-[var(--bg-primary)] font-bold text-[var(--text-primary)] border-t-2 border-b border-[var(--border-default)] statement-no-break">
                            <td colSpan={4} className="py-3 px-3 uppercase tracking-wider text-xs font-bold text-[var(--text-secondary)]">
                              Grand Total ({confirmedInvoices.length} {confirmedInvoices.length === 1 ? 'Record' : 'Records'}{customerInvoices.length > confirmedInvoices.length ? ` · ${customerInvoices.length - confirmedInvoices.length} Draft Excluded` : ''})
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-xs whitespace-nowrap">
                              {getCurrencySymbol()}{totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-xs text-[var(--status-success-text)] whitespace-nowrap">
                              {getCurrencySymbol()}{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-xs text-[var(--status-warning-text)] whitespace-nowrap">
                              {getCurrencySymbol()}{outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 text-center"></td>
                            <td className="py-3 px-3 print-hidden statement-action-col"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DELIVERY CHALLANS */}
              {activeTab === "challans" && (
                <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Delivery Challans</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">Dispatches and converted billing records for {customerDetails.name || 'Customer'}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-3 py-1 rounded-full">
                      {customerChallans.length} Records
                    </span>
                  </div>

                  {isLoadingChallans ? (
                    <div className="py-12 flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
                    </div>
                  ) : customerChallans.length === 0 ? (
                    <div className="py-12 text-center text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider">
                      No delivery challans issued for this customer yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[var(--bg-primary)] border-b border-[var(--border-default)] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3">Challan #</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Linked Invoice</th>
                            <th className="py-2.5 px-3">Items Count</th>
                            <th className="py-2.5 px-3 text-right">Total Amount</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-center print-hidden statement-action-col">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                          {customerChallans.map((ch) => {
                            const tot = Number(ch.total_amount) || 0;
                            const itemsCount = ch.items?.length || 0;
                            const rawStatus = ch.status || (ch.is_billed ? 'billed' : 'open');
                            const isInvoiced = Boolean(
                              ch.is_billed
                              || rawStatus === 'billed'
                              || rawStatus === 'invoiced'
                              || ch.converted_invoice
                              || ch.converted_invoice_number
                            );
                            const statusLabel = isInvoiced ? 'Invoiced' : (rawStatus === 'open' || rawStatus === 'pending' ? 'Open' : rawStatus);

                            const linkedInv = customerInvoices.find(inv => {
                              const convInvId = ch.converted_invoice?.id || ch.converted_invoice;
                              if (convInvId && (convInvId === inv.id || String(convInvId) === String(inv.id))) return true;
                              if (ch.converted_invoice_number && inv.invoice_number &&
                                  ch.converted_invoice_number.trim().toLowerCase() === inv.invoice_number.trim().toLowerCase()) return true;
                              if (inv.challan_number && ch.challan_number &&
                                  inv.challan_number.trim().toLowerCase() === ch.challan_number.trim().toLowerCase()) return true;
                              return false;
                            });

                            return (
                              <tr key={ch.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors statement-no-break">
                                <td className="py-2.5 px-3 font-mono font-bold">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDoc({ invoice: ch, documentType: "delivery_challan" })}
                                    className="statement-doc-link text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1 group text-left cursor-pointer"
                                    title="View Delivery Challan Details"
                                  >
                                    <span>{ch.challan_number || ch.id?.slice(0, 8)}</span>
                                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity print-hidden" />
                                  </button>
                                </td>
                                <td className="py-2.5 px-3 text-[var(--text-secondary)] whitespace-nowrap">
                                  {ch.challan_date ? format(new Date(ch.challan_date), 'dd MMM yyyy') : '-'}
                                </td>
                                <td className="py-2.5 px-3">
                                  {linkedInv ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewDoc({ invoice: linkedInv, documentType: "invoice" })}
                                      className="statement-doc-link inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--status-success-bg)] text-[var(--status-success-text)] hover:opacity-80 border border-[var(--status-success-border)] text-xs font-mono font-bold transition-all cursor-pointer"
                                      title={`View Linked Invoice #${linkedInv.invoice_number}`}
                                    >
                                      <span>#{linkedInv.invoice_number}</span>
                                      <ArrowTopRightOnSquareIcon className="w-3 h-3 opacity-70 print-hidden" />
                                    </button>
                                  ) : ch.converted_invoice_number ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] text-xs font-mono">
                                      #{ch.converted_invoice_number}
                                    </span>
                                  ) : (
                                    <span className="text-[var(--text-muted)] text-xs uppercase font-semibold tracking-wider">Unbilled</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-[var(--text-muted)] font-mono">
                                  {itemsCount} items
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--text-primary)] whitespace-nowrap">
                                  {getCurrencySymbol()}{tot.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    isInvoiced ? 'badge-success' :
                                    statusLabel === 'Open' ? 'badge-info' :
                                    'badge-neutral'
                                  }`}>
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center print-hidden statement-action-col">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDoc({ invoice: ch, documentType: "delivery_challan" })}
                                    className="p-1 rounded-md bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-[var(--border-default)] transition-all inline-flex items-center"
                                    title="View & Print Challan"
                                    aria-label="View & Print Challan"
                                  >
                                    <EyeIcon className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {/* Grand Total Summary Row for Challans */}
                        <tfoot>
                          <tr className="bg-[var(--bg-primary)] font-bold text-[var(--text-primary)] border-t-2 border-b border-[var(--border-default)] statement-no-break">
                            <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-xs font-bold text-[var(--text-secondary)]">
                              Grand Total ({customerChallans.length} {customerChallans.length === 1 ? 'Challan' : 'Challans'})
                            </td>
                            <td className="py-3 px-3 font-mono text-xs text-[var(--text-muted)]">
                              {customerChallans.reduce((sum, ch) => sum + (ch.items?.length || 0), 0)} items
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-xs whitespace-nowrap">
                              {getCurrencySymbol()}{customerChallans.reduce((sum, ch) => sum + (Number(ch.total_amount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 text-center"></td>
                            <td className="py-3 px-3 print-hidden statement-action-col"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Executive Statement Footer */}
              <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-2 statement-no-break">
                <p className="font-medium text-center sm:text-left">
                  This is a computer-generated statement from Cenvora ERP and does not require a physical signature.
                </p>
                <p className="font-mono text-[11px] shrink-0">
                  Generated on {format(new Date(), 'PPPP, p')}
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

      {/* Embedded Document Preview Modal */}
      {previewDoc && (
        <SalesDetailsModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          invoice={previewDoc.invoice}
          documentType={previewDoc.documentType}
        />
      )}
    </div>
  );
}