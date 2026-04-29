import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';
import { getTaxType } from '../../../utils/taxUtils';

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

  const taxType = getTaxType(invoice, businessInfo);
  const isIGST = taxType === 'igst';

  const planCode = businessInfo.plan_code || 'free';
  const showWatermarkFooter = planCode !== 'business';

  const primaryColor = colors.primary || '#174A82';

  const preferredWidths = {
    serial: '6%',
    description: 'auto',
    hsn: '12%',
    quantity: '8%',
    price: '15%',
    tax: '10%',
    amount: '18%',
  };

  const visibleColumns = columns.filter(col => col.show !== false);

  return (
    <div 
      ref={ref}
      style={{
        width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box',
        backgroundColor: colors.background || '#ffffff', color: colors.text || '#111827',
        fontFamily: typography.fontFamily || 'Inter, system-ui, sans-serif', fontSize: `${typography.bodySize || 10}px`,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        border: `3px solid ${primaryColor}`, borderRadius: '8px'
      }}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          {sections.showLogo && template.branding?.logo && (
             <img src={template.branding.logo} alt="Logo" style={{ maxHeight: 50 }} className="mb-4" />
          )}
          <h1 className="font-bold text-2xl mb-1 uppercase tracking-tight" style={{ color: primaryColor }}>{companyName}</h1>
          {sections.showGST && businessInfo.gstin && <p className="font-bold text-[10px] text-gray-700">GSTIN: {businessInfo.gstin}</p>}
          <p className="whitespace-pre-line text-gray-600 text-[11px] mt-2 leading-relaxed" style={{ maxWidth: '300px' }}>{companyAddress}</p>
          {(businessInfo.phone || businessInfo.email) && (
            <p className="text-gray-600 text-[11px] mt-1 font-medium">
              {businessInfo.phone ? `Mobile: +91 ${businessInfo.phone}` : ''}
              {businessInfo.email ? ` | Email: ${businessInfo.email}` : ''}
            </p>
          )}
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-black tracking-tighter mb-1" style={{ color: primaryColor }}>
            {content.invoiceTitle || 'TAX INVOICE'}
          </h2>
          <p className="text-gray-900 font-bold text-sm">Invoice #: {invoiceNumber}</p>
        </div>
      </div>

      <div className="flex mb-8 border-y-2 py-6" style={{ borderColor: '#f3f4f6' }}>
        <div className="w-1/2">
          <h3 className="font-bold text-gray-400 text-[10px] uppercase tracking-widest mb-2">Bill To:</h3>
          <p className="font-bold text-lg text-gray-900 leading-none mb-1">{customerName}</p>
          <p className="whitespace-pre-line text-gray-600 text-sm leading-relaxed">{billingAddress}</p>
          {invoice.customer_gstin && <p className="text-xs font-bold text-gray-800 mt-2">GSTIN: {invoice.customer_gstin}</p>}
        </div>
        <div className="w-1/2 space-y-2 text-sm pl-12 border-l border-gray-100">
          <div className="flex justify-between"><span className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">Invoice Date:</span> <span className="font-semibold text-gray-900">{invoiceDate}</span></div>
          {invoice.due_date && <div className="flex justify-between"><span className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">Due Date:</span> <span className="font-semibold text-gray-900">{new Date(invoice.due_date).toLocaleDateString('en-IN')}</span></div>}
          {invoice.po_number && <div className="flex justify-between"><span className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">PO Number:</span> <span className="font-semibold text-gray-900">{invoice.po_number}</span></div>}
        </div>
      </div>

      <table className="w-full text-left mb-8 border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-900">
            {visibleColumns.map(col => (
              <th 
                key={col.id} 
                className={`py-3 px-2 text-[11px] font-black text-gray-900 uppercase tracking-widest ${
                  ['quantity', 'price', 'amount', 'tax'].includes(col.id) ? 'text-right' : ''
                }`}
                style={{ width: preferredWidths[col.id] || '10%' }}
              >
                {col.id === 'serial' ? 'S. No' : col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
              {visibleColumns.map(col => {
                let val = '';
                let isNumeric = false;
                if(col.id==='serial') val = idx+1;
                else if(col.id==='description') val = (
                  <div className="py-3">
                    <div className="font-bold text-gray-900 text-sm">{item.product_name || item.product}</div>
                    {item.description && <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{item.description}</div>}
                  </div>
                );
                else if(col.id==='hsn') val = item.hsn_sac_code || item.hsn_code || '-';
                else if(col.id==='quantity') { val = item.quantity; isNumeric = true; }
                else if(col.id==='price') { val = `₹${parseFloat(item.price||0).toLocaleString('en-IN', {minimumFractionDigits:2})}`; isNumeric = true; }
                else if(col.id==='tax') { val = `${item.tax||0}%`; isNumeric = true; }
                else if(col.id==='amount') { val = `₹${(parseFloat(item.quantity||0) * parseFloat(item.price||0)).toLocaleString('en-IN', {minimumFractionDigits:2})}`; isNumeric = true; }
                
                return (
                  <th 
                    key={col.id} 
                    className={`py-3 px-2 text-[12px] font-medium text-gray-700 ${isNumeric ? 'text-right' : ''}`}
                  >
                    {val}
                  </th>
                );
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
              {isIGST ? (
                <tr><td className="py-1 font-semibold text-gray-700">IGST</td><td className="py-1">₹{taxTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
              ) : (
                <>
                  <tr><td className="py-1 font-semibold text-gray-700">CGST</td><td className="py-1">₹{(taxTotal/2).toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
                  <tr><td className="py-1 font-semibold text-gray-700">SGST</td><td className="py-1">₹{(taxTotal/2).toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
                </>
              )}
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
      
      {showWatermarkFooter && (
        <div className="mt-2 text-center text-[10px] text-gray-400 print-watermark w-full">
          Made with Cenvora: built for Indian Businesses<br />
          <a href="https://cenvora.app" className="text-blue-500 font-medium" target="_blank" rel="noreferrer">https://cenvora.app</a>
        </div>
      )}
    </div>
  );
});

ServiceTemplate.displayName = 'ServiceTemplate';
export default ServiceTemplate;
