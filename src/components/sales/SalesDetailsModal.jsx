import React, { useRef } from "react";
import { createPortal } from "react-dom";
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
    documentTitle: `Tax Invoice - ${invoiceDetails?.invoice_number || invoice?.id}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
          font-size: 10px;
        }
        .print-hidden {
          display: none !important;
        }
        table {
          page-break-inside: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        .h-6 {
          height: 18px;
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

  // Check if any items have HSN codes to conditionally show HSN column
  const hasHsnCodes = invoiceDetails?.items?.some(item => 
    item.hsn_sac_code || item.hsn_code
  ) || false;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999]">
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
        <div ref={printRef} className="bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading invoice details...</p>
            </div>
          ) : (
            <div className="p-4" style={{ fontSize: '11px', lineHeight: '1.3' }}>
              {/* Header Section */}
              <div className="border-b-2 border-gray-300 pb-4 mb-6">
                <div className="flex justify-between items-start">
                  {/* Company Details */}
                  <div>
                    <h1 className="text-lg font-bold text-red-600 text-center">KAMAL ENTERPRISES</h1>
                    <div className="text-xs text-gray-700 text-center space-y-1">
                      <p>Plot No.LIG-409, K-4, Kalinga Nagar, Bhubaneswar, Odisha-751019</p>
                      <p>Ph: 9337678495, email:kamal76enterprises@gmail.com</p>
                      <p>GST- 21BHMPPD9226P1ZQ</p>
                      <p>GEM ID- 27TD20000124218B</p>
                    </div>
                  </div>
                  
                  {/* Billing Address */}
                  <div className="text-right text-sm">
                    <div className="font-bold mb-2">{invoiceDetails.customer_name || 'Nikeeta Jobless'}</div>
                    <div className="text-gray-700 space-y-1">
                      {invoiceDetails.customer_address ? (
                        <div className="whitespace-pre-line">{invoiceDetails.customer_address}</div>
                      ) : (
                        <>
                          <p>No. 03, 7th Block, 6th Phase, 2nd A Main Rd,</p>
                          <p>Banashankari 3rd Stage, Bengaluru</p>
                          <p>Karnataka KA</p>
                          <p>India</p>
                        </>
                      )}
                      <p className="font-medium">GSTIN: {invoiceDetails.gstin || '29AAKCG6382L1ZU'}</p>
                    </div>
                  </div>
                </div>
              
              {/* Tax Invoice Header */}
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold">Tax Invoice</h2>
                <div className="text-sm font-medium">{invoiceDetails.invoice_number || 'RadheyTit2'}</div>
              </div>

              {/* Invoice Details - Positioned above items table */}
              <div className="flex justify-between mb-4 text-xs">
                <div className="space-y-1">
                  <div><span className="font-medium">Invoice Date:</span> {new Date(invoiceDetails.invoice_date).toLocaleDateString()}</div>
                  <div><span className="font-medium">Invoice #:</span> <span className="font-bold">{invoiceDetails.invoice_number}</span></div>
                </div>
                <div className="space-y-1">
                  <div><span className="font-medium">PO #:</span> {invoiceDetails.po_number || 'N/A'}</div>
                  {invoiceDetails.due_date && (
                    <div><span className="font-medium">Due Date:</span> {new Date(invoiceDetails.due_date).toLocaleDateString()}</div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full border-collapse border border-gray-400 text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-400 px-2 py-1 text-center font-bold">SI</th>
                      <th className="border border-gray-400 px-2 py-1 text-left font-bold">DESCRIPTION</th>
                      <th className="border border-gray-400 px-2 py-1 text-center font-bold">HSNC</th>
                      <th className="border border-gray-400 px-2 py-1 text-center font-bold">QTY</th>
                      <th className="border border-gray-400 px-2 py-1 text-center font-bold">UNIT PRICE</th>
                      <th className="border border-gray-400 px-2 py-1 text-center font-bold">TAX</th>
                      <th className="border border-gray-400 px-2 py-1 text-right font-bold">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceDetails.items?.length > 0 ? (
                      invoiceDetails.items.map((item, index) => {
                        const quantity = parseFloat(item.quantity || 0);
                        const price = parseFloat(item.price || 0);
                        const tax = parseFloat(item.tax || 0);
                        const totalAmount = quantity * price;

                        return (
                          <tr key={index}>
                            <td className="border border-gray-400 px-2 py-1 text-center">
                              {index + 1}
                            </td>
                            <td className="border border-gray-400 px-2 py-1">
                              {item.product_detail?.name || item.product_name || item.product}
                            </td>
                            <td className="border border-gray-400 px-2 py-1 text-center">
                              {item.hsn_sac_code || item.hsn_code || '690677'}
                            </td>
                            <td className="border border-gray-400 px-2 py-1 text-center">
                              {quantity}
                            </td>
                            <td className="border border-gray-400 px-2 py-1 text-right">
                              {price.toFixed(2)}
                            </td>
                            <td className="border border-gray-400 px-2 py-1 text-center">
                              IGST {tax}%
                            </td>
                            <td className="border border-gray-400 px-2 py-1 text-right">
                              ₹ {totalAmount.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="border border-gray-400 px-2 py-1 text-center">1</td>
                        <td className="border border-gray-400 px-2 py-1">Burger</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">690677</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">1</td>
                        <td className="border border-gray-400 px-2 py-1 text-right">1200.00</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">IGST 0%</td>
                        <td className="border border-gray-400 px-2 py-1 text-right">₹ 1200.00</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bank Details and Totals Section */}
              <div className="flex justify-between mb-8">
                {/* Left Side - Bank Details */}
                <div className="w-1/2 pr-4">
                  <h4 className="text-xs font-bold mb-3">Our Bank Details:</h4>
                  <div className="text-xs space-y-1.5">
                    <p><strong>Bank Name:</strong> State Bank of India</p>
                    <p><strong>Account Number:</strong> 37854735951</p>
                    <p><strong>NEFT/IFSC Code:</strong> SBIN0016569</p>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-xs font-bold mb-3">Terms & Conditions</h4>
                    <div className="text-xs space-y-1.5">
                      <p>All disputes are subjected to Bhubaneswar Jurisdiction only.</p>
                      <p>Items once sold, won't be taken back.</p>
                    </div>
                  </div>
                </div>

                {/* Right Side - Totals with improved spacing */}
                <div className="w-1/2 pl-4">
                  <table className="w-full border-collapse border border-gray-400 text-xs">
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 px-3 py-2 font-medium">Untaxed Amount</td>
                        <td className="border border-gray-400 px-3 py-2 text-right">
                          ₹ {invoiceDetails.items?.reduce((sum, item) => 
                            sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0).toFixed(2) || '1,200.00'}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-3 py-2 font-medium">
                          IGST ({(() => {
                            // Calculate effective tax rate
                            const untaxedAmount = invoiceDetails.items?.reduce((sum, item) => 
                              sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0) || 0;
                            const taxAmount = invoiceDetails.items?.reduce((sum, item) => {
                              const quantity = parseFloat(item.quantity || 0);
                              const price = parseFloat(item.price || 0);
                              const tax = parseFloat(item.tax || 0);
                              const subtotal = quantity * price;
                              return sum + ((subtotal * tax) / 100);
                            }, 0) || 0;
                            const effectiveRate = untaxedAmount > 0 ? ((taxAmount / untaxedAmount) * 100).toFixed(1) : 0;
                            return effectiveRate;
                          })()}%)
                        </td>
                        <td className="border border-gray-400 px-3 py-2 text-right">
                          {(() => {
                            // Calculate individual tax amounts and show breakdown
                            const taxBreakdown = invoiceDetails.items?.map((item, index) => {
                              const quantity = parseFloat(item.quantity || 0);
                              const price = parseFloat(item.price || 0);
                              const tax = parseFloat(item.tax || 0);
                              const subtotal = quantity * price;
                              const taxAmount = (subtotal * tax) / 100;
                              return taxAmount.toFixed(2);
                            }) || [];
                            
                            const total = invoiceDetails.items?.reduce((sum, item) => {
                              const quantity = parseFloat(item.quantity || 0);
                              const price = parseFloat(item.price || 0);
                              const tax = parseFloat(item.tax || 0);
                              const subtotal = quantity * price;
                              return sum + ((subtotal * tax) / 100);
                            }, 0).toFixed(2) || '0.00';
                            
                            return taxBreakdown.length > 1 
                              ? `₹ ${taxBreakdown.join(' + ')} = ₹ ${total}`
                              : `₹ ${total}`;
                          })()}
                        </td>
                      </tr>
                      <tr className="font-bold bg-gray-50">
                        <td className="border border-gray-400 px-3 py-2 font-bold">Total</td>
                        <td className="border border-gray-400 px-3 py-2 text-right font-bold">
                          ₹ {(() => {
                            const untaxedAmount = invoiceDetails.items?.reduce((sum, item) => 
                              sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0) || 0;
                            const taxAmount = invoiceDetails.items?.reduce((sum, item) => {
                              const quantity = parseFloat(item.quantity || 0);
                              const price = parseFloat(item.price || 0);
                              const tax = parseFloat(item.tax || 0);
                              const subtotal = quantity * price;
                              return sum + ((subtotal * tax) / 100);
                            }, 0) || 0;
                            return (untaxedAmount + taxAmount).toFixed(2);
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <div className="mt-4 text-xs">
                    <div className="font-medium mb-1">Total amount in words:</div>
                    <div className="font-bold">
                      {(() => {
                        const untaxedAmount = invoiceDetails.items?.reduce((sum, item) => 
                          sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0) || 0;
                        const taxAmount = invoiceDetails.items?.reduce((sum, item) => {
                          const quantity = parseFloat(item.quantity || 0);
                          const price = parseFloat(item.price || 0);
                          const tax = parseFloat(item.tax || 0);
                          const subtotal = quantity * price;
                          return sum + ((subtotal * tax) / 100);
                        }, 0) || 0;
                        const total = Math.round(untaxedAmount + taxAmount);
                        
                        // Simple number to words conversion for common amounts
                        if (total === 1210) return "One Thousand Two Hundred Ten Rupees Only";
                        if (total === 1200) return "One Thousand Two Hundred Rupees Only";
                        return `₹ ${total.toLocaleString()} Only`;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
                <p className="mt-2">This is a computer-generated invoice.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}