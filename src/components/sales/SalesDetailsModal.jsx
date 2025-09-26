import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSalesInvoice } from "../../api/sales";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function SalesDetailsModal({ isOpen, onClose, invoice }) {
  const printRef = useRef();

  const { data, isLoading } = useQuery({
    queryKey: ["sales-invoice", invoice?.id],
    queryFn: () => getSalesInvoice(invoice?.id),
    enabled: !!invoice?.id,
  });

  const invoiceDetails = data?.data || data?.result || data || invoice || {};

  // Print functionality
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Sales Invoice - ${invoiceDetails?.invoice_number || invoice?.id}`,
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
    if (!printRef.current || !invoiceDetails) return;

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

      pdf.save(`sales-invoice-${invoiceDetails.invoice_number || invoice?.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  if (!isOpen) return null;

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
            Download PDF
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        {/* Invoice Content - Will be printed */}
        <div ref={printRef} className="bg-white p-8">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading bill details...</p>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="text-center mb-8 border-b-2 border-blue-600 pb-6">
                <h1 className="text-3xl font-bold text-blue-800 mb-2">SALES INVOICE</h1>
                <p className="text-gray-600">Your Company Name</p>
                <p className="text-sm text-gray-500">Your Company Address</p>
              </div>

              {/* Bill Info & Customer Info */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Invoice Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2">
                    Invoice Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Invoice Number:</span>
                      <span className="font-bold">{invoiceDetails.invoice_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Invoice Date:</span>
                      <span>{new Date(invoiceDetails.invoice_date).toLocaleDateString()}</span>
                    </div>
                    {invoiceDetails.due_date && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Due Date:</span>
                        <span>{new Date(invoiceDetails.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Status:</span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        pending
                      </span>
                    </div>
                    {invoiceDetails.payment_terms && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Payment Terms:</span>
                        <span>{invoiceDetails.payment_terms}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2">
                    Bill To
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-bold text-gray-800">{invoiceDetails.customer}</span>
                    </div>
                    {invoiceDetails.customer_address && (
                      <div className="text-gray-600 whitespace-pre-line">
                        {invoiceDetails.customer_address}
                      </div>
                    )}
                    {invoiceDetails.customer_gstin && (
                      <div>
                        <span className="font-medium text-gray-600">GSTIN: </span>
                        <span>{invoiceDetails.customer_gstin}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Product</th>
                        <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">HSN</th>
                        <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">Qty</th>
                        <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">Unit</th>
                        <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Rate</th>
                        <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">Disc %</th>
                        <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">Tax %</th>
                        <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceDetails.items?.map((item, index) => {
                        const quantity = parseFloat(item.quantity || 0);
                        const price = parseFloat(item.price || 0);
                        const discount = parseFloat(item.discount || 0);
                        const tax = parseFloat(item.tax || 0);
                        const subtotal = quantity * price;
                        const discountAmount = (subtotal * discount) / 100;
                        const taxableAmount = subtotal - discountAmount;
                        const taxAmount = (taxableAmount * tax) / 100;
                        const totalAmount = taxableAmount + taxAmount;

                        return (
                          <tr key={index}>
                            <td className="border border-gray-300 px-4 py-2 text-sm">
                              {item.product_detail?.name || item.product_name}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                              {item.hsn_code || '-'}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                              {quantity}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                              {item.unit}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                              ₹{price.toFixed(2)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                              {discount}%
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                              {tax}%
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-sm font-medium">
                              ₹{totalAmount.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-2 gap-8">
                <div></div> {/* Empty space */}
                <div className="border-t border-gray-300 pt-4">
                  <div className="space-y-2">
                    {invoiceDetails.items && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>₹{invoiceDetails.items.reduce((sum, item) => 
                            sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Total Discount:</span>
                          <span>-₹{invoiceDetails.items.reduce((sum, item) => {
                            const subtotal = parseFloat(item.quantity || 0) * parseFloat(item.price || 0);
                            const discount = parseFloat(item.discount || 0);
                            return sum + ((subtotal * discount) / 100);
                          }, 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Total Tax:</span>
                          <span>₹{invoiceDetails.items.reduce((sum, item) => {
                            const quantity = parseFloat(item.quantity || 0);
                            const price = parseFloat(item.price || 0);
                            const discount = parseFloat(item.discount || 0);
                            const tax = parseFloat(item.tax || 0);
                            const subtotal = quantity * price;
                            const discountAmount = (subtotal * discount) / 100;
                            const taxableAmount = subtotal - discountAmount;
                            return sum + ((taxableAmount * tax) / 100);
                          }, 0).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="border-t border-gray-400 pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Grand Total:</span>
                        <span>₹{parseFloat(invoiceDetails.total_amount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
                <p>Thank you for your business!</p>
                <p className="mt-2">This is a computer-generated invoice.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}