import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getVendor } from "../../api/vendors";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function VendorDetailsModal({ isOpen, onClose, vendor }) {
  const printRef = useRef();

  const { data, isLoading } = useQuery({
    queryKey: ["vendor", vendor?.id],
    queryFn: () => getVendor(vendor?.id),
    enabled: !!vendor?.id,
  });

  const vendorDetails = data?.data || data || vendor || {};

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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-start sm:items-center justify-center z-[9999] p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0F0F12] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl my-8 sm:my-auto transform animate-fade-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0F0F12]/80 backdrop-blur-md z-10 print-hidden">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">
            Vendor <span className="text-indigo-400">Profile</span>
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
            <div className="space-y-10">
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
                       {vendorDetails.gstin}
                     </span>
                   )}
                </div>
              </div>

              {/* Information Grid */}
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
                        ₹{vendorDetails.meta?.credit_limit ? Number(vendorDetails.meta.credit_limit).toLocaleString() : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

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