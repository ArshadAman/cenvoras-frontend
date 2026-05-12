import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCustomer } from "../../api/customers";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function CustomerDetailsModal({ isOpen, onClose, customer }) {
  const printRef = useRef();

  const { data, isLoading } = useQuery({
    queryKey: ["customer", customer?.id],
    queryFn: () => getCustomer(customer?.id),
    enabled: !!customer?.id,
  });

  const customerDetails = data?.data || data || customer || {};

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-[#0F0F12] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto transform animate-fade-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0F0F12]/80 backdrop-blur-md z-10 print-hidden">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">
            Customer <span className="text-cyan-400">Profile</span>
          </h2>
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
            <div className="space-y-10">
              {/* Customer Header */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mb-2 shadow-xl shadow-cyan-500/20">
                  {customerDetails.name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">
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
                       {customerDetails.gstin}
                     </span>
                   )}
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Details */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-white/5 pb-3">
                    Contact Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</span>
                      <span className="text-sm text-white font-medium">{customerDetails.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</span>
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
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer ID</span>
                      <span className="text-xs text-cyan-400 font-mono bg-cyan-400/10 px-2 py-1 rounded">{customerDetails.id?.substring(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Created At</span>
                      <span className="text-sm text-white">
                        {customerDetails.created_at ? format(new Date(customerDetails.created_at), 'MMM dd, yyyy') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Place of Supply</span>
                      <span className="text-sm text-white uppercase tracking-wider font-bold">{customerDetails.state || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Credit Limit</span>
                      <span className="text-lg font-black text-white font-mono">
                        ₹{customerDetails.meta?.credit_limit ? Number(customerDetails.meta.credit_limit).toLocaleString() : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

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