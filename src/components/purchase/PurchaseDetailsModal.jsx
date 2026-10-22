import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPurchaseBill } from "../../api/purchase";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { createPortal } from "react-dom";
import {
  XMarkIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { getCurrencySymbol, formatCurrency } from "../../utils/currency";
import useEscKey from "../../hooks/useEscStack";
import { parseDateOnly } from '../../utils/date';

export default function PurchaseDetailsModal({ billId, onClose }) {
  const printRef = useRef(null);
  useEscKey(onClose, Boolean(billId), 15);

  const { data, isLoading } = useQuery({
    queryKey: ["purchase-bill", billId],
    queryFn: () => getPurchaseBill(billId),
    enabled: !!billId,
  });

  const bill = data?.data || data?.result || data || {};

  // Print functionality
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Purchase Bill - ${bill?.bill_number || billId}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
          background: #ffffff !important;
          color: #000000 !important;
        }
        .print-content {
          background: #ffffff !important;
          color: #000000 !important;
          padding: 0 !important;
        }
        .print-hidden {
          display: none !important;
        }
      }
    `,
  });

  // PDF Download functionality
  const handleDownloadPDF = async () => {
    if (!printRef.current || !bill) return;

    try {
      const element = printRef.current;
      window.scrollTo(0, 0);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector("[data-print-target]");
          if (clonedElement) {
            clonedElement.style.backgroundColor = "white";
            clonedElement.style.color = "black";
            clonedElement.style.height = "auto";
            clonedElement.style.overflow = "visible";
            clonedElement.querySelectorAll("*").forEach((el) => {
              el.style.color = "inherit";
            });
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`purchase-bill-${bill.bill_number || billId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  if (!billId) return null;

  const totalAmount = Number(bill.total_amount || 0);
  const amountPaid = Number(bill.amount_paid || 0);
  const balanceDue =
    bill.balance_due !== undefined
      ? Number(bill.balance_due)
      : Math.max(0, totalAmount - amountPaid);

  const paymentStatus = String(bill.payment_status || "pending").toLowerCase();
  const statusBadgeClass =
    paymentStatus === "paid"
      ? "bg-[var(--status-success-bg)] text-[var(--status-success-text)] border-[var(--status-success-border)]"
      : paymentStatus === "partial"
      ? "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[var(--status-warning-border)]"
      : "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[var(--status-warning-border)]";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl overflow-hidden text-[var(--text-primary)] my-auto animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center">
              <DocumentTextIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                  Purchase Invoice
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                  #{bill.bill_number || "Draft"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${statusBadgeClass}`}
                >
                  {bill.payment_status || "Pending"}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {bill.bill_date
                  ? `Recorded on ${parseDateOnly(bill.bill_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`
                  : "Transaction Details"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Print Bill"
            >
              <PrinterIcon className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-[var(--accent-primary)] hover:opacity-90 text-[var(--text-on-accent)] transition-all flex items-center gap-1.5 text-xs font-medium shadow-sm"
              title="Download PDF"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-3 border-[var(--border-subtle)] border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Loading Bill Details...
              </span>
            </div>
          ) : (
            <div ref={printRef} data-print-target className="space-y-6">
              {/* Supplier & Invoice Context Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supplier Profile Card */}
                <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      <BuildingOfficeIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                      <span>Supplier Details</span>
                    </div>
                    <div className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                      {bill.vendor_name || "N/A"}
                    </div>
                    {bill.vendor_address && (
                      <div className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                        {bill.vendor_address}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-[var(--border-subtle)] text-xs">
                    <div>
                      <span className="text-[var(--text-muted)] block font-medium">GSTIN</span>
                      <span className="font-mono font-semibold text-[var(--text-primary)]">
                        {bill.vendor_gstin || "Unregistered"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block font-medium">Contact</span>
                      <span className="font-medium text-[var(--text-primary)]">
                        {bill.vendor_phone || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Invoice Context Card */}
                <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    <CalendarIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span>Invoice Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[var(--text-muted)] block font-medium">Issue Date</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {bill.bill_date || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block font-medium">Due Date</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {bill.due_date || "Immediate"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block font-medium">Account Journal</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {bill.journal || "Purchase"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block font-medium">GST Treatment</span>
                      <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                        {bill.gst_treatment || "Registered"}
                      </span>
                    </div>
                    {bill.order_number && (
                      <div className="col-span-2 pt-2 border-t border-[var(--border-subtle)]">
                        <span className="text-[var(--text-muted)] block font-medium">Reference PO #</span>
                        <span className="font-mono font-semibold text-[var(--text-primary)]">
                          {bill.order_number}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Line Items ({bill.items?.length || 0})
                  </h3>
                </div>

                {/* Desktop View */}
                <div className="hidden sm:block border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--bg-surface)]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-semibold uppercase">
                        <th className="px-4 py-3 text-left w-12">#</th>
                        <th className="px-4 py-3 text-left">Description</th>
                        <th className="px-4 py-3 text-center w-24">Qty / Unit</th>
                        <th className="px-4 py-3 text-right w-28">Unit Price</th>
                        <th className="px-4 py-3 text-right w-20">Disc.</th>
                        <th className="px-4 py-3 text-right w-24">Tax</th>
                        <th className="px-4 py-3 text-right w-32">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {bill.items && bill.items.length > 0 ? (
                        bill.items.map((item, index) => (
                          <tr
                            key={index}
                            className="hover:bg-[var(--bg-primary)]/40 transition-colors"
                          >
                            <td className="px-4 py-3 text-xs text-[var(--text-muted)] font-mono">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-semibold text-[var(--text-primary)]">
                                {item.product_detail?.name || item.product || "Item"}
                              </div>
                              {(item.description || item.product_description) && (
                                <div
                                  className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed font-normal"
                                  style={{ wordBreak: "break-word" }}
                                >
                                  {item.description || item.product_description}
                                </div>
                              )}
                              {item.hsn_sac_code && (
                                <div className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">
                                  HSN: {item.hsn_sac_code}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-medium">
                              <span className="text-sm font-semibold text-[var(--text-primary)]">
                                {item.quantity}
                              </span>{" "}
                              <span className="text-xs text-[var(--text-muted)] uppercase">
                                {item.unit || "PCS"}
                              </span>
                              {Number(item.free_quantity) > 0 && (
                                <div className="text-xs font-semibold text-[var(--status-success-text)] mt-0.5">
                                  +{item.free_quantity} Free
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-sm text-[var(--text-primary)]">
                              {getCurrencySymbol()}
                              {parseFloat(item.price || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-xs text-[var(--text-secondary)]">
                              {parseFloat(item.discount || 0).toFixed(1)}%
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-xs text-[var(--text-secondary)]">
                              {item.tax_display ||
                                `${parseFloat((item.tax_rate ?? item.tax) || 0)}%`}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-sm font-bold text-[var(--text-primary)]">
                              {getCurrencySymbol()}
                              {parseFloat(item.amount || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-8 text-center text-xs text-[var(--text-muted)]"
                          >
                            No line items recorded for this bill.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="sm:hidden space-y-3">
                  {bill.items?.map((item, index) => (
                    <div
                      key={index}
                      className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="text-sm font-bold text-[var(--text-primary)]">
                            {item.product_detail?.name || item.product || "Item"}
                          </div>
                          {item.hsn_sac_code && (
                            <div className="text-xs text-[var(--text-secondary)] font-mono">
                              HSN: {item.hsn_sac_code}
                            </div>
                          )}
                        </div>
                        <div className="text-right font-mono font-bold text-sm text-[var(--text-primary)]">
                          {getCurrencySymbol()}
                          {parseFloat(item.amount || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
                        <div>
                          <span className="text-[var(--text-muted)] block">Qty</span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {item.quantity} {item.unit || "PCS"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--text-muted)] block">Rate</span>
                          <span className="font-mono text-[var(--text-primary)]">
                            {getCurrencySymbol()}
                            {parseFloat(item.price || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[var(--text-muted)] block">Tax</span>
                          <span className="font-mono text-[var(--text-secondary)]">
                            {item.tax_display || `${parseFloat((item.tax_rate ?? item.tax) || 0)}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Summary & Financial Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
                {/* Notes & Remarks */}
                <div className="space-y-3">
                  {bill.notes ? (
                    <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                        Remarks & Notes
                      </span>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                        {bill.notes}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-[var(--bg-primary)]/50 border border-dashed border-[var(--border-subtle)] rounded-xl p-4 text-xs text-[var(--text-muted)]">
                      No remarks recorded.
                    </div>
                  )}
                </div>

                {/* Totals Breakdown Card */}
                <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-muted)] font-medium">Subtotal (Excl. Tax)</span>
                    <span className="font-mono font-semibold text-[var(--text-primary)]">
                      {getCurrencySymbol()}
                      {parseFloat(bill.taxable_amount || bill.subtotal || 0).toFixed(2)}
                    </span>
                  </div>

                  {parseFloat(bill.igst || 0) > 0 ? (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--text-muted)] font-medium">IGST</span>
                      <span className="font-mono font-semibold text-[var(--text-primary)]">
                        {getCurrencySymbol()}
                        {parseFloat(bill.igst || 0).toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--text-muted)] font-medium">CGST</span>
                        <span className="font-mono font-semibold text-[var(--text-primary)]">
                          {getCurrencySymbol()}
                          {parseFloat(bill.cgst || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--text-muted)] font-medium">SGST</span>
                        <span className="font-mono font-semibold text-[var(--text-primary)]">
                          {getCurrencySymbol()}
                          {parseFloat(bill.sgst || 0).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}

                  {parseFloat(bill.round_off || 0) !== 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--text-muted)] font-medium">Round Off</span>
                      <span className="font-mono text-[var(--text-primary)]">
                        {getCurrencySymbol()}
                        {parseFloat(bill.round_off || 0).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[var(--border-subtle)] flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-bold text-[var(--text-primary)] block">
                        Net Total
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">Tax Inclusive</span>
                    </div>
                    <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                      {getCurrencySymbol()}
                      {parseFloat(bill.total_amount || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Payment Progress */}
                  <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-muted)]">Amount Paid</span>
                      <span className="font-mono font-medium text-[var(--text-primary)]">
                        {getCurrencySymbol()}
                        {parseFloat(bill.amount_paid || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-[var(--text-muted)]">Balance Due</span>
                      <span
                        className={`font-mono font-bold ${
                          balanceDue > 0
                            ? "text-[var(--status-danger-text)]"
                            : "text-[var(--status-success-text)]"
                        }`}
                      >
                        {getCurrencySymbol()}
                        {balanceDue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom Actions */}
        <div className="sticky bottom-0 px-5 py-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex items-center justify-between print:hidden">
          <div className="text-xs text-[var(--text-muted)]">
            Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-[11px]">Esc</kbd> to close
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] transition-colors text-xs font-semibold flex items-center gap-1.5"
            >
              <PrinterIcon className="w-4 h-4 text-[var(--text-muted)]" />
              <span>Print Bill</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 btn-secondary rounded-lg transition-all font-semibold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
