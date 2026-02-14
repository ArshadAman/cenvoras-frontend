import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { getSalesInvoice } from "../../api/sales";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { 
  XMarkIcon, 
  PrinterIcon, 
  ArrowDownTrayIcon, 
  PaintBrushIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon
} from "@heroicons/react/24/outline";
import { toast } from 'react-toastify';
import { sendInvoiceNotification } from '../../api/integrations';
import InvoicePreview from "../invoice/InvoicePreview";
import InvoiceTemplateDesigner from "../invoice/InvoiceTemplateDesigner";
import { getActiveTemplate, amountInWords } from "../../utils/invoiceSettings";

export default function SalesDetailsModal({ isOpen, onClose, invoice, businessInfo = {} }) {
  const printRef = useRef();
  const [template, setTemplate] = useState(null);
  const [showDesigner, setShowDesigner] = useState(false);

  // Load active template
  useEffect(() => {
    if (isOpen) {
      const activeTemplate = getActiveTemplate();
      setTemplate(activeTemplate);
    }
  }, [isOpen, showDesigner]);

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
      
      const imgWidth = 210;
      const pageHeight = 295;
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

      pdf.save(`invoice-${invoiceDetails.invoice_number || invoice?.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
          onClick={onClose}
        />
        
        {/* Modal Content */}
        <div className="relative w-full max-w-5xl max-h-[95vh] flex flex-col bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50">
            <div>
              <h2 className="text-lg font-bold text-white">Invoice Preview</h2>
              <p className="text-xs text-gray-400">
                {invoiceDetails.invoice_number || 'Loading...'}
                {template && <span className="ml-2 text-cyan-400">• {template.name}</span>}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDesigner(true)}
                className="px-3 py-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <PaintBrushIcon className="w-4 h-4" />
                Customize
              </button>
              
              <button
                onClick={handlePrint}
                className="px-3 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <PrinterIcon className="w-4 h-4" />
                Print
              </button>
              
              <button
                onClick={handleDownloadPDF}
                className="px-3 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                PDF
              </button>

              <button
                onClick={async () => {
                  const email = invoiceDetails?.customer_email || invoiceDetails?.customer_details?.email;
                  if (!email) { toast.warning('No email found for this customer'); return; }
                  try {
                    await sendInvoiceNotification({
                      channel: 'email', recipient: email,
                      subject: `Invoice ${invoiceDetails.invoice_number} from ${businessInfo.business_name || 'Cenvora'}`,
                      body: `Dear ${invoiceDetails.customer_name},\n\nYour invoice ${invoiceDetails.invoice_number} for ₹${invoiceDetails.total_amount} is ready.\n\nThank you for your business!`
                    });
                    toast.success(`Invoice sent to ${email}`);
                  } catch (e) { toast.error('Failed to send email'); }
                }}
                className="px-3 py-2 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <EnvelopeIcon className="w-4 h-4" />
                Email
              </button>

              <button
                onClick={async () => {
                  const phone = invoiceDetails?.customer_phone || invoiceDetails?.customer_details?.phone;
                  if (!phone) { toast.warning('No phone number found for this customer'); return; }
                  try {
                    await sendInvoiceNotification({
                      channel: 'whatsapp', recipient: phone,
                      body: `Hi ${invoiceDetails.customer_name}, your invoice ${invoiceDetails.invoice_number} for ₹${invoiceDetails.total_amount} is ready. Thank you!`
                    });
                    toast.success(`WhatsApp sent to ${phone}`);
                  } catch (e) { toast.error('Failed to send WhatsApp'); }
                }}
                className="px-3 py-2 bg-green-600/20 text-green-300 hover:bg-green-600/30 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                WhatsApp
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="flex-1 overflow-auto p-6 bg-gray-900/50 flex justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4" />
                <p className="text-gray-400">Loading invoice...</p>
              </div>
            ) : template ? (
              <div className="shadow-2xl">
                <InvoicePreview
                  ref={printRef}
                  invoice={invoiceDetails}
                  template={template}
                  businessInfo={businessInfo}
                />
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <p>No template loaded</p>
                <button
                  onClick={() => setShowDesigner(true)}
                  className="mt-4 text-cyan-400 hover:text-cyan-300"
                >
                  Create a template
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Designer Modal */}
      <InvoiceTemplateDesigner
        isOpen={showDesigner}
        onClose={() => setShowDesigner(false)}
        businessInfo={businessInfo}
      />
    </>,
    document.body
  );
}