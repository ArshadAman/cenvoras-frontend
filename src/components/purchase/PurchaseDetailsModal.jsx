import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPurchaseBill } from "../../api/purchase";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
    content: () => printRef.current,
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
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-4xl font-sans max-h-[90vh] overflow-y-auto">
        {/* Action Buttons - Hidden during print */}
        <div className="print-hidden flex justify-end gap-2 mb-4">
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="bg-white p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="flex justify-between items-center mb-6 border-b-2 border-blue-600 pb-4">
                <div>
                  <h2 className="text-3xl font-bold text-blue-700">
                    Purchase Invoice
                  </h2>
                  <div className="text-sm text-gray-600 mt-1">
                    #{bill.bill_number}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-700 font-semibold">
                    Date:
                  </div>
                  <div className="text-lg font-medium">{bill.bill_date}</div>
                </div>
              </div>

              {/* Vendor and Journal Info */}
              <div className="mb-6 grid grid-cols-2 gap-6">
                <div>
                  <div className="font-semibold text-gray-700 text-lg mb-2">
                    Vendor Details
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-lg font-medium">{bill.vendor_name}</div>
                    {bill.vendor_address && (
                      <div className="text-sm text-gray-600 mt-1">
                        {bill.vendor_address}
                      </div>
                    )}
                    {bill.vendor_gstin && (
                      <div className="text-sm text-gray-600 mt-1">
                        GSTIN: {bill.vendor_gstin}
                      </div>
                    )}
                    {bill.vendor_phone && (
                      <div className="text-sm text-gray-600 mt-1">
                        Phone: {bill.vendor_phone}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700 text-lg mb-2">
                    Journal & Tax Details
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-lg font-medium">{bill.journal}</div>
                    {bill.gst_treatment && (
                      <div className="text-sm text-gray-600 mt-1">
                        GST Treatment: {bill.gst_treatment}
                      </div>
                    )}
                    {bill.place_of_supply && (
                      <div className="text-sm text-gray-600 mt-1">
                        Place of Supply: {bill.place_of_supply}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="px-4 py-3 text-left text-sm font-semibold">Item</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Qty</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Rate</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Discount</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Tax</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bill.items?.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="px-4 py-3 border-b">
                            <div className="font-medium">{item.item_name}</div>
                            {item.description && (
                              <div className="text-sm text-gray-500">{item.description}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 border-b text-center">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-3 border-b text-right">
                            ₹{parseFloat(item.rate || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 border-b text-right">
                            {item.discount_type === 'percentage' ? `${item.discount || 0}%` : `₹${parseFloat(item.discount || 0).toFixed(2)}`}
                          </td>
                          <td className="px-4 py-3 border-b text-right">
                            ₹{parseFloat(item.tax_amount || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 border-b text-right font-medium">
                            ₹{parseFloat(item.amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end mb-6">
                <div className="w-96">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>₹{parseFloat(bill.sub_total || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Discount:</span>
                        <span>₹{parseFloat(bill.total_discount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Tax:</span>
                        <span>₹{parseFloat(bill.total_tax || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Adjustment:</span>
                        <span>₹{parseFloat(bill.adjustment || 0).toFixed(2)}</span>
                      </div>
                      <div className="border-t-2 border-blue-600 pt-2">
                        <div className="flex justify-between text-lg font-bold text-blue-700">
                          <span>Total Amount:</span>
                          <span>₹{parseFloat(bill.total || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes and Terms */}
              {(bill.notes || bill.terms_conditions) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bill.notes && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Notes</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        {bill.notes}
                      </div>
                    </div>
                  )}
                  {bill.terms_conditions && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Terms & Conditions</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        {bill.terms_conditions}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                Generated on {new Date().toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}