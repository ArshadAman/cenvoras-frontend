import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSalesInvoice } from "../../api/sales";
import { getQuotation } from "../../api/quotation";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { 
  XMarkIcon, 
  PrinterIcon, 
  ArrowDownTrayIcon, 
  PaintBrushIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { toast } from 'react-toastify';
import { sendCustomEmail } from '../../api/integrations';
import InvoicePreview from "../invoice/InvoicePreview";
import InvoiceTemplateDesigner from "../invoice/InvoiceTemplateDesigner";
import { getActiveTemplate } from "../../utils/invoiceSettings";
import { getInvoiceSettings } from "../../api/invoice_settings";

export default function SalesDetailsModal({ isOpen, onClose, invoice, businessInfo = {}, documentType = "invoice" }) {
  const queryClient = useQueryClient();
  const printRef = useRef();
  const [template, setTemplate] = useState(null);
  const [showDesigner, setShowDesigner] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailPromptOpen, setEmailPromptOpen] = useState(false);
  const [manualEmail, setManualEmail] = useState('');

  // Load active template
  useEffect(() => {
    if (isOpen) {
      const activeTemplate = getActiveTemplate();
      setTemplate(activeTemplate);
    }
  }, [isOpen, showDesigner]);

  const isQuotation = documentType === "quotation";

  const { data, isLoading } = useQuery({
    queryKey: [isQuotation ? "quotation" : "sales-invoice", invoice?.id],
    queryFn: () => (isQuotation ? getQuotation(invoice?.id) : getSalesInvoice(invoice?.id)),
    enabled: isOpen && !!invoice?.id,
  });

  const { data: invoiceSettings } = useQuery({
    queryKey: ["invoiceSettings"],
    queryFn: getInvoiceSettings,
    enabled: isOpen,
  });

  const invoiceDetails = data?.data || data?.result || data || invoice || {};
  const previewTemplate = isQuotation
    ? {
        ...template,
        content: {
          ...(template?.content || {}),
          invoiceTitle: "PERFORMA INVOICE",
        },
      }
    : template;

  // Print functionality
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${isQuotation ? "Performa Invoice" : "Tax Invoice"} - ${invoiceDetails?.invoice_number || invoice?.id}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        html, body {
          width: 210mm;
          height: 297mm;
          margin: 0;
          padding: 0;
        }
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
      const pageHeight = 297;
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

      pdf.save(`${isQuotation ? "performa-invoice" : "invoice"}-${invoiceDetails.invoice_number || invoice?.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Send invoice email helper
  const sendInvoiceEmail = async (email) => {
    setSendingEmail(true);
    try {
      const businessName = businessInfo.business_name || 'Cenvora';
      const subject = `Invoice ${invoiceDetails.invoice_number} from ${businessName}`;

      // Build HTML-formatted invoice for email
      const items = invoiceDetails.items || [];
      let itemRows = items.map(item =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.product_name || item.product?.name || '—'}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${Number(item.price || 0).toFixed(2)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${Number(item.amount || 0).toFixed(2)}</td>
        </tr>`
      ).join('');

      const body =
        `<div style="font-family:Arial,sans-serif;max-width:600px;">` +
        `<h2 style="color:#333;">Invoice from ${businessName}</h2>` +
        `<table style="width:100%;margin:16px 0;">` +
        `<tr><td style="color:#666;">Invoice No:</td><td><strong>${invoiceDetails.invoice_number}</strong></td></tr>` +
        `<tr><td style="color:#666;">Date:</td><td>${invoiceDetails.invoice_date}</td></tr>` +
        `<tr><td style="color:#666;">Customer:</td><td>${invoiceDetails.customer_name || 'N/A'}</td></tr>` +
        `</table>` +
        `<table style="width:100%;border-collapse:collapse;margin:16px 0;">` +
        `<thead><tr style="background:#f5f5f5;">` +
        `<th style="padding:8px;text-align:left;">Item</th>` +
        `<th style="padding:8px;text-align:center;">Qty</th>` +
        `<th style="padding:8px;text-align:right;">Price</th>` +
        `<th style="padding:8px;text-align:right;">Amount</th>` +
        `</tr></thead>` +
        `<tbody>${itemRows}</tbody>` +
        `<tfoot><tr style="background:#f5f5f5;font-weight:bold;">` +
        `<td colspan="3" style="padding:8px;text-align:right;">Total:</td>` +
        `<td style="padding:8px;text-align:right;">₹${Number(invoiceDetails.total_amount || 0).toFixed(2)}</td>` +
        `</tr></tfoot>` +
        `</table>` +
        `<p style="color:#666;">Thank you for your business!<br>— ${businessName}</p>` +
        `</div>`;

      await sendCustomEmail({ recipient: email, subject, body });
      toast.success(`Invoice emailed to ${email}`);
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      setEmailPromptOpen(false);
      setManualEmail('');
    } catch {
      toast.error('Failed to send email. Check your email configuration in Business Tools.');
    }
    setSendingEmail(false);
  };

  // Handle email button click
  const handleEmailClick = () => {
    const email =
      invoiceDetails?.customer_email ||
      invoiceDetails?.customer_details?.email ||
      invoiceDetails?.customer?.email;
    if (!email) {
      setEmailPromptOpen(true);
      return;
    }
    sendInvoiceEmail(email);
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Email Prompt Modal */}
      {emailPromptOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEmailPromptOpen(false)}></div>
          <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-6 animate-fade-up">
            <h3 className="text-lg font-bold text-white mb-2">Enter Customer Email</h3>
            <p className="text-sm text-gray-400 mb-4">
              No email is on file for this customer. Enter an email to send this invoice.
            </p>
            <input
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && manualEmail.includes('@') && sendInvoiceEmail(manualEmail)}
              placeholder="customer@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setEmailPromptOpen(false); setManualEmail(''); }}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => sendInvoiceEmail(manualEmail)}
                disabled={!manualEmail.includes('@') || sendingEmail}
                className="px-5 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-sm font-semibold hover:bg-cyan-500/30 transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                {sendingEmail ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Sending...</> : <><EnvelopeIcon className="w-4 h-4" /> Send Invoice</>}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <h2 className="text-lg font-bold text-white">{isQuotation ? "Performa Invoice Preview" : "Invoice Preview"}</h2>
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
                disabled={sendingEmail}
                onClick={handleEmailClick}
                className="px-3 py-2 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sendingEmail
                  ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Sending...</>
                  : <><EnvelopeIcon className="w-4 h-4" /> Email</>}
              </button>

              <button
                onClick={(e) => { e.preventDefault(); toast.info('WhatsApp integration is coming soon!'); }}
                className="relative px-4 py-2 bg-green-900/10 text-green-500 border border-green-500/20 hover:border-green-500/40 rounded-lg text-sm font-medium flex items-center gap-2 transition-all cursor-not-allowed group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <ChatBubbleLeftIcon className="w-4 h-4 opacity-70" />
                <span className="opacity-90">WhatsApp</span>
                
                {/* Coming Soon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 font-bold text-[10px] uppercase tracking-wider text-green-400/90 rounded-lg border border-green-500/30">
                  Coming Soon
                </div>
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
                <p className="text-gray-400">{isQuotation ? "Loading quotation..." : "Loading invoice..."}</p>
              </div>
            ) : previewTemplate ? (
              <div className="shadow-2xl">
                <InvoicePreview
                  ref={printRef}
                  invoice={invoiceDetails}
                  template={previewTemplate}
                  businessInfo={businessInfo}
                  invoiceSettings={invoiceSettings || {}}
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