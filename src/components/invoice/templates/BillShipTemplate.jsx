import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';

// Bill To - Ship To Template (Flipkart Style)
const BillShipTemplate = forwardRef(({ 
  invoice = {}, template = {}, businessInfo = {}, invoiceSettings = {}, scale = 1, showWatermark = false,
}, ref) => {
  const colors = template.colors || {};
  const typography = template.typography || {};
  const sections = template.sections || {};
  const content = template.content || {};
  const columns = template.columns || [];

  const companyName = template.branding?.useBusinessName !== false ? (businessInfo.business_name || 'Your Business Name') : (template.branding?.customName || 'Your Business Name');
  const companyAddress = businessInfo.business_address || businessInfo.address || '';
  const customerName = invoice.customer_name || 'Customer Name';
  const billingAddress = invoice.customer_address || '';
  const shippingAddress = invoice.delivery_address || invoice.shipping_address || invoice.customer_details?.delivery_address || billingAddress;
  const invoiceNumber = invoice.invoice_number || 'INV-001';
  const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const items = invoice.items || [];
  
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0);
  const taxTotal = items.reduce((sum, item) => sum + ((parseFloat(item.quantity||0) * parseFloat(item.price||0) * parseFloat(item.tax||0)) / 100), 0);
  const finalTotal = subtotal + taxTotal + (parseFloat(invoice.round_off || 0));

  const planCode = businessInfo.plan_code || 'free';
  const showWatermarkFooter = planCode !== 'business';

  const primaryColor = colors.primary || '#facc15'; // yellow theme border
  const visibleColumns = columns.filter(col => col.show !== false);

  return (
    <div 
      ref={ref}
      style={{
        width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box',
        backgroundColor: colors.background || '#ffffff', color: colors.text || '#111827',
        fontFamily: typography.fontFamily, fontSize: `${typography.bodySize || 10}px`,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        border: `4px solid ${colors.accent || '#3b82f6'}`, borderRadius: '16px' // bold outer border
      }}
    >
      {/* Header Strip */}
      <div className="flex justify-between items-start mb-6 border-b border-gray-300 pb-4">
        <div className="flex gap-4 items-center">
           {sections.showLogo && template.branding?.logo && (
             <img src={template.branding.logo} alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} className="p-2 border border-gray-200 rounded-lg" />
           )}
           <div>
             <h1 className="font-extrabold text-xl mb-1">{companyName}</h1>
             {sections.showGST && <p className="font-bold text-xs uppercase text-gray-700">GSTIN: {businessInfo.gstin}</p>}
             {invoice.customer_phone && <p className="font-bold text-xs text-gray-700 mt-1">Contact: {invoice.customer_phone}</p>}
           </div>
        </div>
        <div className="text-right">
           <h2 className="text-xl font-bold tracking-widest">{content.invoiceTitle || 'TAX INVOICE'}</h2>
           <p className="text-xs font-semibold text-gray-500 uppercase mt-1">Original for Recipient</p>
           <p className="text-sm font-bold mt-3">Invoice #: {invoiceNumber}</p>
           <p className="text-sm">Invoice Date: {invoiceDate}</p>
           {invoice.due_date && <p className="text-sm font-semibold text-red-600 mt-1">Due: {new Date(invoice.due_date).toLocaleDateString('en-IN')}</p>}
        </div>
      </div>

      {/* Bill To Ships To side by side precisely */}
      <div className="flex border-b border-gray-300 pb-6 mb-6">
        <div className="w-1/2 pr-6">
           <h3 className="font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">Bill To:</h3>
           <p className="font-bold text-base">{customerName}</p>
           <p className="whitespace-pre-line text-gray-700 leading-snug mt-1">{billingAddress}</p>
           {invoice.customer_gstin && <p className="font-bold text-xs mt-2">GSTIN: {invoice.customer_gstin}</p>}
        </div>
        <div className="w-1/2 pl-6 border-l border-gray-300">
           <h3 className="font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">Ship To:</h3>
           <p className="font-bold text-base">{customerName}</p>
           <p className="whitespace-pre-line text-gray-700 leading-snug mt-1">{shippingAddress}</p>
           <p className="font-bold text-gray-800 mt-2 text-xs">Place of Supply: {invoice.place_of_supply || '-'}</p>
        </div>
      </div>

      <table className="w-full text-center mb-6">
        <thead>
          <tr className="border-y border-gray-400 bg-gray-50 h-8">
            {visibleColumns.map(col => (
              <th key={col.id} className="px-2 text-xs font-bold uppercase tracking-widest border-r border-gray-300 last:border-0 text-gray-600">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-200">
            {visibleColumns.map(col => {
              let val = '';
              if(col.id==='serial') val = idx+1;
              else if(col.id==='description') val = <div className="text-left py-2 font-semibold text-gray-900">{item.product_name || item.product}</div>;
              else if(col.id==='quantity') val = item.quantity;
              else if(col.id==='price') val = parseFloat(item.price||0).toLocaleString('en-IN', {minimumFractionDigits:2});
              else if(col.id==='tax') val = `${item.tax||0}%`;
              else if(col.id==='amount') val = (item.quantity * item.price).toLocaleString('en-IN', {minimumFractionDigits:2});
              else if(col.id==='hsn') val = item.hsn_sac_code || '-';
              return <td key={col.id} className="px-2 border-r border-gray-200 last:border-0 align-middle py-0.5">{val}</td>;
            })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between border-t border-gray-400 pt-6">
        <div className="w-1/2 pr-6 border-r border-gray-200">
           {sections.showBankDetails && (
             <div className="mb-6">
                <p className="font-bold text-xs uppercase tracking-wider mb-2 text-gray-900 underline underline-offset-4 decoration-gray-300">Bank Details:</p>
                <div className="text-xs text-gray-700">
                  <p><span className="font-semibold inline-block w-20">Bank:</span> {content.bankDetails?.bankName}</p>
                  <p><span className="font-semibold inline-block w-20">Account #:</span> {content.bankDetails?.accountNumber}</p>
                  <p><span className="font-semibold inline-block w-20">IFSC:</span> {content.bankDetails?.ifscCode}</p>
                  <p><span className="font-semibold inline-block w-20">Branch:</span> {content.bankDetails?.accountHolder}</p>
                </div>
             </div>
           )}
           <div className="text-xs">
              <p className="font-medium text-gray-600 mb-1">Total items / qty : {items.length} / {items.reduce((acc, curr) => acc + (parseFloat(curr.quantity)||0), 0)}</p>
              <p className="font-bold text-gray-900">Total amount (in words): <em>INR {amountInWords(finalTotal)}</em></p>
           </div>

           {sections.showTerms && (
             <div className="mt-6">
                <p className="font-bold text-xs text-gray-900 tracking-wider">Notes:</p>
                <p className="text-xs text-gray-700 mb-4">{content.footerNote}</p>
                <p className="font-bold text-xs text-gray-900 tracking-wider">Terms and Conditions:</p>
                <ol className="text-xs text-gray-600 list-decimal pl-4 space-y-1 mt-1">
                  {content.termsAndConditions?.map((t, i) => <li key={i}>{t}</li>)}
                </ol>
             </div>
           )}
        </div>

        <div className="w-1/2 pl-6 flex flex-col justify-between">
           <div>
             <div className="flex justify-between text-sm font-medium text-gray-700 mb-2 items-center">
               <span>Taxable Amount</span>
               <span className="font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
             </div>
             <div className="flex justify-between text-sm font-medium text-gray-700 mb-2 items-center">
               <span>CGST/SGST/IGST</span>
               <span className="font-bold text-gray-900">₹{taxTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
             </div>
             <div className="flex justify-between text-lg font-bold text-gray-900 py-3 border-t-2 border-b-2 border-gray-800 mt-2">
               <span>Grand Total</span>
               <span>₹{finalTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
             </div>
             <div className="flex justify-end mt-2">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-extrabold uppercase">✔ Amount Due</span>
             </div>
           </div>

           {sections.showSignature && (
             <div className="text-right mt-16">
                <p className="text-xs font-bold text-gray-600 mb-12">For {companyName}</p>
                <div className="border-t border-gray-400 inline-block pt-1 text-xs px-4">
                  {content.signatureLabel || 'Authorized Signatory'}
                </div>
             </div>
           )}
        </div>
      </div>
      <div className="mt-6 text-center text-[10px] text-gray-500 font-medium">
        This is a computer generated digital invoice and does not require a signature.
      </div>
      
      {showWatermarkFooter && (
        <div className="mt-2 text-center text-[10px] text-gray-400 print-watermark w-full">
          Made with Cenvora: built for Indian Businesses<br />
          <a href="https://cenvora.app" className="text-blue-500 font-medium" target="_blank" rel="noreferrer">https://cenvora.app</a>
        </div>
      )}
    </div>
  );
});

BillShipTemplate.displayName = 'BillShipTemplate';
export default BillShipTemplate;
