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
      
      <div className="relative w-full sm:max-w-4xl bg-[#0F0F12] border-x sm:border border-white/10 shadow-2xl animate-fade-up min-h-screen sm:min-h-0 sm:rounded-[32px] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 z-50 flex items-center justify-between p-6 sm:p-8 bg-[#0F0F12]/80 backdrop-blur-xl border-b border-white/5">
           <div>
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-1">Transaction Details</h3>
             <div className="flex items-center gap-3">
                <span className="text-xl font-black text-white tracking-tighter">Purchase Invoice</span>
                <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black rounded uppercase tracking-widest">
                  #{bill.bill_number || "Draft"}
                </span>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <button
               onClick={handlePrint}
               className="p-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
               title="Print"
             >
               <PrinterIcon className="w-5 h-5" />
             </button>
             <button
               onClick={handleDownloadPDF}
               className="p-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                title="Download PDF"
             >
               <ArrowDownTrayIcon className="w-5 h-5" />
             </button>
             <button
               onClick={onClose}
               className="p-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
             >
               <XMarkIcon className="w-6 h-6" />
             </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 sm:p-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Securing Data...</span>
            </div>
          ) : (
            <div ref={printRef} data-print-target className="space-y-10">
              
              {/* Top Section Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Vendor Info */}
                <div className="space-y-4">
                  <div className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em]">Supplier Profile</div>
                  <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-4">
                    <div>
                      <div className="text-2xl font-black text-white tracking-tight mb-1">{bill.vendor_name}</div>
                      {bill.vendor_address && (
                        <div className="text-sm text-gray-400 leading-relaxed max-w-sm">
                          {bill.vendor_address}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      {bill.vendor_gstin && (
                        <div>
                          <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">GSTIN</div>
                          <div className="text-xs font-bold text-gray-300">{bill.vendor_gstin}</div>
                        </div>
                      )}
                      {bill.vendor_phone && (
                        <div>
                          <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Contact</div>
                          <div className="text-xs font-bold text-gray-300">{bill.vendor_phone}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bill Metadata */}
                <div className="space-y-4">
                  <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Invoice Context</div>
                  <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Issue Date</div>
                      <div className="text-sm font-bold text-white">{bill.bill_date}</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Account Journal</div>
                      <div className="text-sm font-bold text-white">{bill.journal}</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">GST Treatment</div>
                      <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-400/5 px-2 py-0.5 rounded border border-cyan-400/10 inline-block">
                        {bill.gst_treatment || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Status</div>
                      <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border inline-block ${
                        bill.payment_status === 'paid' 
                        ? "bg-green-500/10 text-green-400 border-green-500/10"
                        : "bg-orange-500/10 text-orange-400 border-orange-500/10"
                      }`}>
                        {bill.payment_status || "Pending"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Line Items</div>
                
                {/* Desktop Table */}
                <div className="hidden md:block overflow-hidden border border-white/5 rounded-3xl bg-white/[0.01]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[9px] font-black text-gray-500 uppercase tracking-[0.15em] border-b border-white/5">
                        <th className="px-6 py-4 text-left">Description</th>
                        <th className="px-6 py-4 text-center">Qty / Unit</th>
                        <th className="px-6 py-4 text-right">Unit Price</th>
                        <th className="px-6 py-4 text-right">Disc.</th>
                        <th className="px-6 py-4 text-right">Tax</th>
                        <th className="px-6 py-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bill.items?.map((item, index) => (
                        <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-5">
                            <div className="text-sm font-bold text-white">{item.product_detail?.name || item.product}</div>
                            {item.hsn_sac_code && (
                              <div className="text-[8px] font-black text-gray-600 mt-1 uppercase tracking-widest">HSN: {item.hsn_sac_code}</div>
                            )}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="text-sm font-bold text-white">{item.quantity}</div>
                            <div className="text-[10px] text-gray-500 uppercase">{item.unit}</div>
                            {item.free_quantity > 0 && <span className="text-[9px] font-black text-green-500 uppercase tracking-tighter mt-1 block">+{item.free_quantity} Free</span>}
                          </td>
                          <td className="px-6 py-5 text-right font-mono text-sm text-gray-300">{getCurrencySymbol()}{parseFloat(item.price || 0).toFixed(2)}</td>
                          <td className="px-6 py-5 text-right font-mono text-sm text-gray-500">{parseFloat(item.discount || 0).toFixed(1)}%</td>
                          <td className="px-6 py-5 text-right font-mono text-sm text-gray-500">{getCurrencySymbol()}{parseFloat(item.tax || 0).toFixed(2)}</td>
                          <td className="px-6 py-5 text-right font-mono text-sm font-black text-white">{getCurrencySymbol()}{parseFloat(item.amount || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {bill.items?.map((item, index) => (
                    <div key={index} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="max-w-[70%]">
                          <div className="text-sm font-black text-white leading-tight">{item.product_detail?.name || item.product}</div>
                          {item.hsn_sac_code && <div className="text-[8px] font-black text-gray-600 mt-1 uppercase tracking-widest">HSN: {item.hsn_sac_code}</div>}
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-white font-mono">{getCurrencySymbol()}{parseFloat(item.amount || 0).toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
                        <div className="space-y-1">
                          <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Quantity</div>
                          <div className="text-[10px] font-bold text-gray-300">{item.quantity} {item.unit} {item.free_quantity > 0 && <span className="text-green-500">+{item.free_quantity}</span>}</div>
                        </div>
                        <div className="space-y-1 text-right">
                          <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Unit Rate</div>
                          <div className="text-[10px] font-bold text-gray-300">{getCurrencySymbol()}{parseFloat(item.price || 0).toFixed(2)}</div>
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
                      <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Remarks & Notes</div>
                      <div className="text-[11px] text-gray-500 leading-relaxed italic bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                        {bill.notes}
                      </div>
                    </div>
                  )}
                  <div className="text-[8px] font-black text-gray-700 uppercase tracking-[0.2em]">
                    Generated by Cenvoras Engine • {new Date().toLocaleDateString()}
                  </div>
                </div>

                <div className="w-full sm:w-80 bg-white/[0.03] border border-white/10 rounded-[32px] p-8 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="font-mono text-xs">{getCurrencySymbol()}{parseFloat(bill.total_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black text-green-500/70 uppercase tracking-widest">
                    <span>Amount Paid</span>
                    <span className="font-mono text-xs">{getCurrencySymbol()}{parseFloat(bill.amount_paid || 0).toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t border-white/5">
                    <div className="flex justify-between items-baseline">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Net Total</span>
                        <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter">Tax Inclusive</span>
                      </div>
                      <span className="text-3xl font-black text-white tracking-tighter font-mono">{getCurrencySymbol()}{parseFloat(bill.total_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="sticky bottom-0 p-6 sm:p-8 bg-[#0F0F12]/95 backdrop-blur-xl border-t border-white/5 flex justify-center print:hidden">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-xl"
          >
            Close Insight
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}