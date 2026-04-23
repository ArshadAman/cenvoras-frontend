import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';

// Service Template (LTIMindtree Style)
const ServiceTemplate = forwardRef(({ 
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
  const invoiceNumber = invoice.invoice_number || 'INV-001';
  const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const items = invoice.items || [];
  
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0);
  const taxTotal = items.reduce((sum, item) => sum + ((parseFloat(item.quantity||0) * parseFloat(item.price||0) * parseFloat(item.tax||0)) / 100), 0);
  const finalTotal = subtotal + taxTotal + (parseFloat(invoice.round_off || 0));

  const primaryColor = colors.primary || '#174A82';

  const visibleColumns = columns.filter(col => col.show !== false);

  return (
    <div 
      ref={ref}
      style={{
        width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box',
        backgroundColor: colors.background || '#ffffff', color: colors.text || '#111827',
        fontFamily: typography.fontFamily, fontSize: `${typography.bodySize || 10}px`,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        border: `3px solid ${primaryColor}`, borderRadius: '4px' // Outer border for service style
      }}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          {sections.showLogo && template.branding?.logo && (
             <img src={template.branding.logo} alt="Logo" style={{ maxHeight: 40 }} className="mb-2" />
          )}
          <h1 className="font-bold text-lg mb-1" style={{ color: primaryColor }}>{companyName}</h1>
          {sections.showGST && businessInfo.gstin && <p className="font-semibold text-xs">GSTIN: {businessInfo.gstin}</p>}
          <p className="whitespace-pre-line text-gray-700 text-xs mt-1" style={{ maxWidth: '250px' }}>{companyAddress}</p>
          {(businessInfo.phone || businessInfo.email) && (
            <p className="text-gray-700 text-xs mt-1">
              {businessInfo.phone ? `Mobile: ${businessInfo.phone}` : ''}
              {businessInfo.email ? `\nEmail: ${businessInfo.email}` : ''}
            </p>
          )}
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold tracking-wide" style={{ color: primaryColor }}>
            {content.invoiceTitle || 'TAX INVOICE'}
          </h2>
          <p className="text-gray-600 font-semibold mt-1">Invoice #: {invoiceNumber}</p>
        </div>
      </div>

      <div className="flex mb-6 border-t-2 border-b-2 py-4" style={{ borderColor: '#e5e7eb' }}>
        <div className="w-1/2">
          <h3 className="font-bold text-gray-900 mb-1">Bill To:</h3>
          <p className="font-bold text-sm text-gray-900">{customerName}</p>
          <p className="whitespace-pre-line text-gray-700 mt-1">{billingAddress}</p>
          {invoice.customer_gstin && <p className="text-xs font-semibold mt-1">GSTIN: {invoice.customer_gstin}</p>}
        </div>
        <div className="w-1/2 space-y-2 text-sm pl-8">
          <div className="flex"><span className="w-32 font-bold text-gray-900">Invoice Date:</span> <span className="text-gray-700">{invoiceDate}</span></div>
          {invoice.due_date && <div className="flex"><span className="w-32 font-bold text-gray-900">Due Date:</span> <span className="text-gray-700">{new Date(invoice.due_date).toLocaleDateString('en-IN')}</span></div>}
          {invoice.po_number && <div className="flex"><span className="w-32 font-bold text-gray-900">PO Number:</span> <span className="text-gray-700">{invoice.po_number}</span></div>}
        </div>
      </div>

      <table className="w-full text-left mb-6">
        <thead>
          <tr className="border-y-2 border-gray-900 font-bold bg-white">
            {visibleColumns.map(col => (
              <th key={col.id} className="py-1 text-sm text-gray-900">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              {visibleColumns.map(col => {
                let val = '';
                if(col.id==='serial') val = idx+1;
                else if(col.id==='description') val = <span className="font-semibold">{item.product_name || item.product}</span>;
                else if(col.id==='quantity') val = item.quantity;
                else if(col.id==='price') val = parseFloat(item.price||0).toLocaleString('en-IN', {minimumFractionDigits:2});
                else if(col.id==='tax') val = `${item.tax||0}%`;
                else if(col.id==='amount') val = (item.quantity * item.price).toLocaleString('en-IN', {minimumFractionDigits:2});
                else if(col.id==='hsn') val = item.hsn_sac_code || '-';
                return <td key={col.id} className="py-1 text-sm align-middle">{val}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between mt-auto pt-6">
        <div className="w-1/2 pr-8">
          {sections.showBankDetails && (
            <div className="mb-4">
              <p className="font-bold text-gray-900 mb-1">Bank Details:</p>
              <div className="text-xs text-gray-700 leading-relaxed">
                {content.bankDetails?.bankName && <p>Bank: {content.bankDetails.bankName}</p>}
                {content.bankDetails?.accountNumber && <p>Account #: {content.bankDetails.accountNumber}</p>}
                {content.bankDetails?.ifscCode && <p>IFSC: {content.bankDetails.ifscCode}</p>}
                {content.bankDetails?.accountHolder && <p>Branch: {content.bankDetails.accountHolder}</p>}
              </div>
            </div>
          )}
          
          <div className="border border-gray-300 p-2 text-xs bg-gray-50 border-dashed rounded">
             <span className="font-bold">Total amount (in words): </span>
             <span>{amountInWords(finalTotal)}</span>
          </div>
        </div>

        <div className="w-[40%]">
          <table className="w-full text-sm text-right">
            <tbody>
              <tr><td className="py-1 font-semibold text-gray-700">Taxable Amount</td><td className="py-1">₹{subtotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
              <tr><td className="py-1 font-semibold text-gray-700">GST Total</td><td className="py-1">₹{taxTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
              {invoice.round_off ? <tr><td className="py-1 font-semibold text-gray-700">Round Off</td><td className="py-1">₹{parseFloat(invoice.round_off).toFixed(2)}</td></tr> : null}
              <tr className="border-t-2 border-b-2 border-gray-900 text-base">
                <td className="py-2 font-bold text-gray-900">Total</td>
                <td className="py-2 font-bold text-gray-900">₹{finalTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
              </tr>
            </tbody>
          </table>
          <div className="text-right mt-16 pt-2">
            <p className="text-xs text-gray-500 border-t border-gray-400 inline-block w-48 text-center pt-1">
               {content.signatureLabel || 'Authorized Signatory'}
            </p>
          </div>
        </div>
      </div>
      
      {sections.showTerms && (
         <div className="mt-8 border-t border-gray-300 pt-4">
           <p className="font-bold text-gray-900 text-xs mb-1">Notes:</p>
           <p className="text-gray-700 text-xs mb-3">{content.footerNote || 'Thank you for the Business!'}</p>
           <p className="font-bold text-gray-900 text-xs mb-1">Terms and Conditions:</p>
           <ol className="text-xs text-gray-600 pl-4 list-decimal space-y-0.5">
             {content.termsAndConditions?.map((t, i) => <li key={i}>{t}</li>)}
           </ol>
         </div>
      )}
      
      <div className="w-full text-center mt-6 text-[10px] text-gray-500 font-medium">
        This is a computer generated digital invoice and does not require a signature.
      </div>
    </div>
  );
});

ServiceTemplate.displayName = 'ServiceTemplate';
export default ServiceTemplate;
