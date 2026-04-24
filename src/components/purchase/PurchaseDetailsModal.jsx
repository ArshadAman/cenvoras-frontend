import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPurchaseBill } from "../../api/purchase";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { createPortal } from "react-dom";
import { XMarkIcon, PrinterIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

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
      // Temporarily switch to light mode for PDF generation
      const wasDark = element.classList.contains('text-white');
      
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
                // You might need to target specific children to invert colors back to black if they are white
                 clonedElement.querySelectorAll('*').forEach(el => {
                     // Reset text colors that might be white classes
                     el.style.color = 'inherit';
                 });
             }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl bento-card !p-0 shadow-2xl shadow-blue-900/20 animate-fade-up bg-[#09090b] border border-white/10 max-h-[90vh] flex flex-col rounded-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 print-hidden">
           <h3 className="text-xl font-bold text-white">Invoice Details</h3>
           <div className="flex gap-2">
             <button
               onClick={handlePrint}
               className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
               title="Print"
             >
               <PrinterIcon className="w-5 h-5" />
             </button>
             <button
               onClick={handleDownloadPDF}
               className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Download PDF"
             >
               <ArrowDownTrayIcon className="w-5 h-5" />
             </button>
             <button
               onClick={onClose}
               className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
             >
               <XMarkIcon className="w-6 h-6" />
             </button>
           </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#09090b]">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
             // We use a specific structure here to separate screen view (Dark) from print view (White) if we wanted to
             // But for simplicity and user request "no white elements", we will style this document as Dark Mode.
             // However, for printing/PDF, we usually want white. handling this via CSS @media print is best.
             // We will apply Dark styles by default.
            <div ref={printRef} data-print-target className="print-content text-white font-sans max-w-3xl mx-auto">
              
              {/* Invoice Header */}
              <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-6">
                <div>
                  <h2 className="text-3xl font-bold text-blue-500 mb-1">
                    INVOICE
                  </h2>
                  <div className="text-sm text-gray-400">
                    #{bill.bill_number}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400 font-semibold uppercase tracking-wider">
                    Date
                  </div>
                  <div className="text-lg font-medium text-white">{bill.bill_date}</div>
                </div>
              </div>

              {/* Vendor and Journal Info */}
              <div className="mb-8 grid grid-cols-2 gap-8">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Vendor Details
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="text-lg font-bold text-white mb-1">{bill.vendor_name}</div>
                    {bill.vendor_address && (
                      <div className="text-sm text-gray-400">
                        {bill.vendor_address}
                      </div>
                    )}
                    {(bill.vendor_gstin || bill.vendor_phone) && <div className="mt-3 space-y-1">
                        {bill.vendor_gstin && (
                        <div className="text-xs text-gray-500">
                            GSTIN: <span className="text-gray-300">{bill.vendor_gstin}</span>
                        </div>
                        )}
                        {bill.vendor_phone && (
                        <div className="text-xs text-gray-500">
                            Phone: <span className="text-gray-300">{bill.vendor_phone}</span>
                        </div>
                        )}
                    </div>}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Journal & Details
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="text-lg font-medium text-white">{bill.journal}</div>
                    <div className="mt-2 space-y-1">
                        {bill.gst_treatment && (
                        <div className="text-xs text-gray-500">
                            GST Treatment: <span className="text-gray-300">{bill.gst_treatment}</span>
                        </div>
                        )}
                        {bill.place_of_supply && (
                        <div className="text-xs text-gray-500">
                            Place of Supply: <span className="text-gray-300">{bill.place_of_supply}</span>
                        </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Items</h3>
                <div className="overflow-hidden border border-white/10 rounded-xl">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-white/5 text-gray-400 border-b border-white/10">
                        <th className="px-4 py-3 text-left font-semibold">Item</th>
                        <th className="px-4 py-3 text-center font-semibold">Qty</th>
                        <th className="px-4 py-3 text-right font-semibold">Rate</th>
                        <th className="px-4 py-3 text-right font-semibold">Disc.</th>
                        <th className="px-4 py-3 text-right font-semibold">Tax</th>
                        <th className="px-4 py-3 text-right font-semibold text-white">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bill.items?.map((item, index) => (
                        <tr key={index} className="bg-transparent hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-medium text-white">
                            <div>{item.item_name}</div>
                            {item.description && (
                              <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-300">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-300">
                            ₹{parseFloat(item.rate || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-300">
                            {item.discount_type === 'percentage' ? `${item.discount || 0}%` : `₹${parseFloat(item.discount || 0).toFixed(2)}`}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-300">
                            ₹{parseFloat(item.tax_amount || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-white">
                            ₹{parseFloat(item.amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end mb-8">
                <div className="w-80">
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Subtotal</span>
                      <span className="text-white">₹{parseFloat(bill.sub_total || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Discount</span>
                      <span className="text-white">₹{parseFloat(bill.total_discount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Tax</span>
                      <span className="text-white">₹{parseFloat(bill.total_tax || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Adjustment</span>
                      <span className="text-white">₹{parseFloat(bill.adjustment || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/10 pt-3 mt-1">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-blue-400">Total Amount</span>
                        <span className="text-white">₹{parseFloat(bill.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes and Terms */}
              {(bill.notes || bill.terms_conditions) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/10 pt-6">
                  {bill.notes && (
                    <div>
                      <h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-2">Notes</h4>
                      <div className="text-sm text-gray-400 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                        {bill.notes}
                      </div>
                    </div>
                  )}
                  {bill.terms_conditions && (
                    <div>
                      <h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-2">Terms & Conditions</h4>
                      <div className="text-sm text-gray-400 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                        {bill.terms_conditions}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-gray-600">
                Generated from Cenvoras System on {new Date().toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}