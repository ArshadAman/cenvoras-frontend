import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPurchaseBill } from "../../api/purchase";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { createPortal } from "react-dom";
import { XMarkIcon, PrinterIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

export default function PurchaseDetailsModal({ billId, onClose }) {
  const printRef = useRef();

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
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
          background: white !important;
          color: black !important;
        }
        .print-content {
          background: white !important;
          color: black !important;
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
      
      // Scroll to top for clean capture
      window.scrollTo(0, 0);
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff', // Ensure white background for PDF
        logging: false,
        onclone: (clonedDoc) => {
             // Force white background and black text on cloned element for capture
             const clonedElement = clonedDoc.querySelector('[data-print-target]');
             if(clonedElement) {
                clonedElement.style.backgroundColor = 'white';
                clonedElement.style.color = 'black';
                clonedElement.style.height = 'auto';
                clonedElement.style.overflow = 'visible';
                
                 clonedElement.querySelectorAll('*').forEach(el => {
                     el.style.color = 'inherit';
                 });
             }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
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

      pdf.save(`purchase-bill-${bill.bill_number || billId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  if (!billId) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full sm:max-w-4xl bg-[var(--bg-surface)] border-x sm:border border-[var(--border-subtle)] shadow-2xl animate-fade-up min-h-screen sm:min-h-0 sm:rounded-[32px] overflow-hidden flex flex-col text-[var(--text-primary)]">
        
        {/* Header */}
        <div className="sticky top-0 z-50 flex items-center justify-between p-6 sm:p-8 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
           <div>
             <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-1">Transaction Details</h3>
             <div className="flex items-center gap-3">
                <span className="text-xl font-black text-[var(--text-primary)] tracking-tighter">Purchase Invoice</span>
                <span className="px-2 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-black rounded uppercase tracking-widest">
                  #{bill.bill_number || "Draft"}
                </span>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <button
               onClick={handlePrint}
               className="p-3 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-all"
               title="Print"
             >
               <PrinterIcon className="w-5 h-5" />
             </button>
             <button
               onClick={handleDownloadPDF}
               className="p-3 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-all"
                title="Download PDF"
             >
               <ArrowDownTrayIcon className="w-5 h-5" />
             </button>
             <button
               onClick={onClose}
               className="p-3 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-all"
             >
               <XMarkIcon className="w-6 h-6" />
             </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 sm:p-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-[var(--border-subtle)] border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
              <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Securing Data...</span>
            </div>
          ) : (
            <div ref={printRef} data-print-target className="space-y-10">
              
              {/* Top Section Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Vendor Info */}
                <div className="space-y-4">
                  <div className="text-xs font-black text-[var(--accent-primary)] uppercase tracking-[0.2em]">Supplier Profile</div>
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-6 rounded-3xl space-y-4">
                    <div>
                      <div className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-1">{bill.vendor_name}</div>
                      {bill.vendor_address && (
                        <div className="text-sm text-[var(--text-muted)] leading-relaxed max-w-sm">
                          {bill.vendor_address}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--border-subtle)]">
                      {bill.vendor_gstin && (
                        <div>
                          <div className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">GSTIN</div>
                          <div className="text-xs font-bold text-[var(--text-primary)]">{bill.vendor_gstin}</div>
                        </div>
                      )}
                      {bill.vendor_phone && (
                        <div>
                          <div className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Contact</div>
                          <div className="text-xs font-bold text-[var(--text-primary)]">{bill.vendor_phone}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bill Metadata */}
                <div className="space-y-4">
                  <div className="text-xs font-black text-[var(--accent-primary)] uppercase tracking-[0.2em]">Invoice Context</div>
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-6 rounded-3xl grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Issue Date</div>
                      <div className="text-sm font-bold text-[var(--text-primary)]">{bill.bill_date}</div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Account Journal</div>
                      <div className="text-sm font-bold text-[var(--text-primary)]">{bill.journal}</div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">GST Treatment</div>
                      <div className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest bg-[var(--bg-surface)] px-2 py-0.5 rounded border border-[var(--border-subtle)] inline-block">
                        {bill.gst_treatment || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Status</div>
                      <div className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded border inline-block ${
                        bill.payment_status === 'paid' 
                        ? "bg-[var(--bg-surface)] text-[var(--accent-primary)] border-[var(--accent-primary)]"
                        : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)]"
                      }`}>
                        {bill.payment_status || "Pending"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Line Items</div>
                
                {/* Desktop Table */}
                <div className="hidden md:block overflow-hidden border border-[var(--border-subtle)] rounded-3xl bg-[var(--bg-primary)]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-surface)] text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.15em] border-b border-[var(--border-subtle)]">
                        <th className="px-6 py-4 text-left">Description</th>
                        <th className="px-6 py-4 text-center">Qty / Unit</th>
                        <th className="px-6 py-4 text-right">Unit Price</th>
                        <th className="px-6 py-4 text-right">Disc.</th>
                        <th className="px-6 py-4 text-right">Tax</th>
                        <th className="px-6 py-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {bill.items?.map((item, index) => (
                        <tr key={index} className="hover:bg-[var(--bg-surface)]/50 transition-colors">
                          <td className="px-6 py-5 align-top">
                            <div className="text-sm font-bold text-[var(--text-primary)]">{item.product_detail?.name || item.product}</div>
                            {(item.description || item.product_description) && (
                              <div className="text-xs text-[var(--text-muted)] mt-1 whitespace-pre-line leading-relaxed font-normal" style={{ wordBreak: 'break-word' }}>
                                {item.description || item.product_description}
                              </div>
                            )}
                            {item.hsn_sac_code && (
                              <div className="text-xs font-black text-[var(--text-muted)] mt-1 uppercase tracking-widest">HSN: {item.hsn_sac_code}</div>
                            )}
                          </td>
                          <td className="px-6 py-5 text-center align-top">
                            <div className="text-sm font-bold text-[var(--text-primary)]">{item.quantity}</div>
                            <div className="text-xs text-[var(--text-muted)] uppercase">{item.unit}</div>
                            {item.free_quantity > 0 && <span className="text-xs font-black text-[var(--accent-primary)] uppercase tracking-tighter mt-1 block">+{item.free_quantity} Free</span>}
                          </td>
                          <td className="px-6 py-5 text-right font-mono text-sm text-[var(--text-primary)] align-top">{getCurrencySymbol()}{parseFloat(item.price || 0).toFixed(2)}</td>
                          <td className="px-6 py-5 text-right font-mono text-sm text-[var(--text-muted)] align-top">{parseFloat(item.discount || 0).toFixed(1)}%</td>
                          <td className="px-6 py-5 text-right font-mono text-sm text-[var(--text-muted)] align-top">{item.tax_display || `${parseFloat((item.tax_rate ?? item.tax) || 0)}%`}</td>
                          <td className="px-6 py-5 text-right font-mono text-sm font-black text-[var(--text-primary)] align-top">{getCurrencySymbol()}{parseFloat(item.amount || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {bill.items?.map((item, index) => (
                    <div key={index} className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="max-w-[70%]">
                          <div className="text-sm font-black text-[var(--text-primary)] leading-tight">{item.product_detail?.name || item.product}</div>
                          {(item.description || item.product_description) && (
                            <div className="text-xs text-[var(--text-muted)] mt-1 whitespace-pre-line leading-relaxed font-normal" style={{ wordBreak: 'break-word' }}>
                              {item.description || item.product_description}
                            </div>
                          )}
                          {item.hsn_sac_code && <div className="text-xs font-black text-[var(--text-muted)] mt-1 uppercase tracking-widest">HSN: {item.hsn_sac_code}</div>}
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-[var(--text-primary)] font-mono">{getCurrencySymbol()}{parseFloat(item.amount || 0).toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[var(--border-subtle)]">
                        <div className="space-y-1">
                          <div className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Quantity</div>
                          <div className="text-xs font-bold text-[var(--text-primary)]">{item.quantity} {item.unit} {item.free_quantity > 0 && <span className="text-[var(--accent-primary)]">+{item.free_quantity}</span>}</div>
                        </div>
                        <div className="space-y-1 text-right">
                          <div className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Unit Rate</div>
                          <div className="text-xs font-bold text-[var(--text-primary)]">{getCurrencySymbol()}{parseFloat(item.price || 0).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Summary */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8 pt-6">
                <div className="flex-1 space-y-6">
                  {bill.notes && (
                    <div className="space-y-2">
                      <div className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Remarks & Notes</div>
                      <div className="text-xs text-[var(--text-muted)] leading-relaxed italic bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-subtle)]">
                        {bill.notes}
                      </div>
                    </div>
                  )}
                  <div className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                    Generated by Cenvora Engine • {new Date().toLocaleDateString()}
                  </div>
                </div>

                <div className="w-full sm:w-80 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-[32px] p-8 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">
                    <span>Subtotal (ex-GST)</span>
                    <span className="font-mono text-xs text-[var(--text-primary)]">{getCurrencySymbol()}{parseFloat(bill.taxable_amount || bill.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {parseFloat(bill.igst || 0) > 0 ? (
                    <div className="flex justify-between items-center text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">
                      <span>IGST</span>
                      <span className="font-mono text-xs text-[var(--text-primary)]">{getCurrencySymbol()}{parseFloat(bill.igst || 0).toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">
                        <span>CGST</span>
                        <span className="font-mono text-xs text-[var(--text-primary)]">{getCurrencySymbol()}{parseFloat(bill.cgst || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">
                        <span>SGST</span>
                        <span className="font-mono text-xs text-[var(--text-primary)]">{getCurrencySymbol()}{parseFloat(bill.sgst || 0).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">
                    <span>Amount Paid</span>
                    <span className="font-mono text-xs text-[var(--text-primary)]">{getCurrencySymbol()}{parseFloat(bill.amount_paid || 0).toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t border-[var(--border-subtle)]">
                    <div className="flex justify-between items-baseline">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-[var(--accent-primary)] uppercase tracking-widest">Net Total</span>
                        <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-tighter">Tax Inclusive</span>
                      </div>
                      <span className="text-3xl font-black text-[var(--text-primary)] tracking-tighter font-mono">{getCurrencySymbol()}{parseFloat(bill.total_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="sticky bottom-0 p-6 sm:p-8 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex justify-center print:hidden">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-10 py-4 btn-secondary rounded-2xl transition-all font-black text-xs uppercase tracking-[0.2em] shadow-xl"
          >
            Close Insight
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}