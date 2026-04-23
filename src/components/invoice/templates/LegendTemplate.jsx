import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';

// Legend Template (ITC Style)
const LegendTemplate = forwardRef(({ 
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

  const borderColor = colors.primary || '#111827';
  const visibleColumns = columns.filter(col => col.show !== false);

  return (
    <div 
      ref={ref}
      style={{
        width: '210mm', minHeight: '297mm', padding: '10mm', boxSizing: 'border-box',
        backgroundColor: colors.background || '#ffffff', color: colors.text || '#000000',
        fontFamily: typography.fontFamily, fontSize: `${typography.bodySize || 10}px`,
        transform: `scale(${scale})`, transformOrigin: 'top left',
      }}
    >
      <div style={{ border: `1px solid ${borderColor}` }} className="h-full flex flex-col">
        {/* Header Block */}
        <div className="flex justify-between items-start border-b" style={{ borderColor }}>
          <div className="p-4 flex gap-4 w-2/3 border-r" style={{ borderColor }}>
            {sections.showLogo && template.branding?.logo && (
              <img src={template.branding.logo} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
            )}
            <div>
              <h1 className="font-bold text-lg mb-0.5" style={{ color: colors.primary }}>{companyName}</h1>
              <p className="whitespace-pre-line leading-snug">{companyAddress}</p>
              {sections.showGST && <p className="font-bold mt-1">GSTIN: {businessInfo.gstin || '-'}</p>}
              {invoice.customer_phone && <p>Mobile: {invoice.customer_phone}</p>}
            </div>
          </div>
          <div className="p-4 w-1/3 text-right">
            <h2 className="text-xl font-bold tracking-widest">{content.invoiceTitle || 'TAX INVOICE'}</h2>
            <p className="text-xs uppercase tracking-wider text-gray-500 mt-1">Original for Recipient</p>
          </div>
        </div>

        {/* Info Blocks Grid */}
        <div className="flex border-b" style={{ borderColor }}>
          <div className="w-1/2 p-3 border-r" style={{ borderColor }}>
             <p className="font-bold uppercase mb-1">Customer Details:</p>
             <p className="font-bold">{customerName}</p>
             {invoice.customer_gstin && <p className="font-bold mt-1">GSTIN: {invoice.customer_gstin}</p>}
             <p className="whitespace-pre-line mt-1 leading-snug">{billingAddress}</p>
          </div>
          <div className="w-1/2">
             <div className="flex border-b" style={{ borderColor }}>
                <div className="w-1/2 p-2 border-r" style={{ borderColor }}>
                   <p className="font-bold">Invoice #:</p>
                   <p>{invoiceNumber}</p>
                </div>
                <div className="w-1/2 p-2">
                   <p className="font-bold">Date:</p>
                   <p>{invoiceDate}</p>
                </div>
             </div>
             <div className="p-2">
                <p className="font-bold">Place of Supply:</p>
                <p>{invoice.place_of_supply || 'Same State'}</p>
             </div>
          </div>
        </div>

        {/* Legend Table */}
        <table className="w-full text-center border-b" style={{ borderColor }}>
          <thead>
            <tr style={{ backgroundColor: colors.primary, color: '#fff' }}>
              {visibleColumns.map(col => (
                <th key={col.id} className="p-1 border-r border-white font-normal">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-200">
              {visibleColumns.map(col => {
                let val = '';
                if(col.id==='serial') val = idx+1;
                else if(col.id==='description') val = <div className="text-left font-semibold">{item.product_name || item.product}</div>;
                else if(col.id==='quantity') val = item.quantity;
                else if(col.id==='price') val = parseFloat(item.price||0).toLocaleString('en-IN', {minimumFractionDigits:2});
                else if(col.id==='tax') val = `${item.tax||0}%`;
                else if(col.id==='amount') val = (item.quantity * item.price).toLocaleString('en-IN', {minimumFractionDigits:2});
                else if(col.id==='hsn') val = item.hsn_sac_code || '-';
                return <td key={col.id} className="py-1 px-2 border-r border-gray-200">{val}</td>;
              })}
              </tr>
            ))}
            <tr className="font-bold h-8 align-middle">
              <td colSpan={visibleColumns.length - 2} className="text-left px-2 border-r border-gray-200">
                Total items: {items.length}
              </td>
              <td className="border-r border-gray-200">Subtotal</td>
              <td>₹{subtotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
            </tr>
          </tbody>
        </table>

        {/* Footer Details */}
        <div className="flex flex-1">
          <div className="w-3/5 p-3 border-r flex flex-col justify-between" style={{ borderColor }}>
             <div>
               <p className="italic mb-2">Total amount (in words): <strong>INR {amountInWords(finalTotal)}</strong></p>
               {sections.showBankDetails && (
                 <div>
                    <h4 className="font-bold border-b border-gray-300 inline-block mb-1">Bank Details:</h4>
                    <table className="text-xs">
                      <tbody>
                        <tr><td className="pr-4 py-0.5">Bank:</td><td className="font-semibold">{content.bankDetails?.bankName}</td></tr>
                        <tr><td className="pr-4 py-0.5">Account #:</td><td className="font-semibold">{content.bankDetails?.accountNumber}</td></tr>
                        <tr><td className="pr-4 py-0.5">IFSC:</td><td className="font-semibold">{content.bankDetails?.ifscCode}</td></tr>
                        <tr><td className="pr-4 py-0.5">Branch:</td><td className="font-semibold">{content.bankDetails?.accountHolder}</td></tr>
                      </tbody>
                    </table>
                 </div>
               )}
             </div>
             
             {sections.showTerms && (
               <div className="mt-4">
                 <p className="font-bold border-b border-gray-300 inline-block mb-1">Notes:</p>
                 <p className="mb-2">{content.footerNote}</p>
                 <p className="font-bold border-b border-gray-300 inline-block mb-1">Terms & Conditions:</p>
                 <ul className="list-decimal pl-4 space-y-0.5">
                   {content.termsAndConditions?.map((t, i) => <li key={i}>{t}</li>)}
                 </ul>
               </div>
             )}
          </div>
          
          {/* Totals Block */}
          <div className="w-2/5 flex flex-col justify-between">
             <table className="w-full text-right p-3 block text-sm">
               <tbody className="w-full block">
                 <tr className="w-full flex justify-between px-3 py-1"><td className="font-semibold">Taxable Amount</td><td>₹{subtotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
                 <tr className="w-full flex justify-between px-3 py-1"><td className="font-semibold">GST Total</td><td>₹{taxTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
                 <tr className="w-full flex justify-between px-3 py-2 border-t-2 border-b-2 bg-gray-100" style={{ borderColor }}>
                   <td className="font-bold text-lg">Total Amount</td>
                   <td className="font-bold text-lg">₹{finalTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                 </tr>
               </tbody>
             </table>
             
             {sections.showSignature && (
               <div className="p-3 text-right text-xs">
                  <p className="font-bold mb-10">For {companyName}</p>
                  <p className="border-t border-gray-400 inline-block pt-1">{content.signatureLabel || 'Authorized Signatory'}</p>
               </div>
             )}
          </div>
        </div>
      </div>
      <div className="text-center w-full mt-3 font-medium text-[10px] text-gray-500">
        This is a computer generated digital invoice and does not require a signature.
      </div>
    </div>
  );
});

LegendTemplate.displayName = 'LegendTemplate';
export default LegendTemplate;
