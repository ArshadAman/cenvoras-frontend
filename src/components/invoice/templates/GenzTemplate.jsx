import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';
import { getTaxType } from '../../../utils/taxUtils';
import { getCurrencySymbol, getCountryCode, formatCurrency } from '../../../utils/currency';

// GenZ Template (Google Style)
const GenzTemplate = forwardRef(({ 
  invoice = {}, template = {}, businessInfo = {}, invoiceSettings = {}, scale = 1, showWatermark = false,
}, ref) => {
  const colors = template.colors || {};
  const typography = template.typography || {};
  const sections = template.sections || {};
  const content = template.content || {};
  const columns = template.columns || [];

  const companyName = template.branding?.useBusinessName !== false 
    ? (businessInfo.business_name || 'Your Business Name') : (template.branding?.customName || 'Your Business Name');
  const companyAddress = businessInfo.business_address || businessInfo.address || '';
  const customerName = invoice.customer_name || 'Customer Name';
  const billingAddress = invoice.customer_address || '';
  const customerGST = invoice.customer_gstin || invoice.gstin || '';
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

  const primaryColor = colors.primary || '#4285F4';

  const visibleColumns = columns.filter(col => col.show !== false);

  return (
    <div 
      ref={ref}
      style={{
        width: '210mm', minHeight: '297mm', boxSizing: 'border-box',
        backgroundColor: colors.background || '#ffffff', color: colors.text || '#333333',
        fontFamily: typography.fontFamily, fontSize: `${typography.bodySize || 11}px`,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        border: `8px solid ${primaryColor}`, borderRadius: '24px', overflow: 'hidden'
      }}
    >
      {/* Massive Header Strip */}
      <div style={{ backgroundColor: primaryColor }} className="px-12 py-8 flex justify-between items-center text-white">
        <div className="flex items-center gap-4">
          {sections.showLogo && template.branding?.logo && (
             <img src={template.branding.logo} alt="Logo" className="h-12 bg-white p-1 rounded-xl" />
          )}
          <h1 className="text-3xl font-extrabold tracking-tight">{companyName}</h1>
        </div>
        <h2 className="text-3xl font-bold opacity-90">{content.invoiceTitle || 'TAX INVOICE'}</h2>
      </div>

      <div className="p-12">
        <div className="grid grid-cols-2 gap-12 mb-10">
          <div>
            <h3 className="text-gray-400 font-bold mb-2 uppercase text-xs tracking-widest">Billed To</h3>
            <p className="font-bold text-lg text-gray-900 mb-1">{customerName}</p>
            <p className="whitespace-pre-line text-gray-600 font-medium">{billingAddress}</p>
            {customerGST && (
              <p className="text-gray-600 font-medium mt-1">
                <strong>{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'}</strong> {customerGST}
              </p>
            )}
          </div>
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-center">
            <div className="flex justify-between mb-3 border-b border-gray-200 pb-3">
              <span className="text-gray-500 font-semibold">Invoice No.</span>
              <span className="font-bold text-gray-900 text-lg">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Date of Issue</span>
              <span className="font-bold text-gray-900">{invoiceDate}</span>
            </div>
          </div>
        </div>

        {/* Thick Styling Table */}
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm mb-10">
          <table className="w-full text-left">
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>
                {visibleColumns.map(col => (
                  <th key={col.id} className="px-6 py-2 text-xs font-bold text-gray-600 uppercase tracking-widest">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  {visibleColumns.map(col => {
                    let val = '';
                    if(col.id==='serial') val = idx+1;
                    else if(col.id==='description') val = <div className="py-1"><p className="font-bold text-gray-900 text-base">{item.product_name || item.product}</p><p className="text-xs text-gray-400 mt-0.5">{item.hsn_sac_code ? `{getCountryCode() === 'IN' ? 'HSN:' : 'Tax Code:'} ${item.hsn_sac_code}` : ''}</p></div>;
                    else if(col.id==='quantity') val = <span className="font-bold bg-gray-100 px-3 py-1 rounded-full">{item.quantity}</span>;
                    else if(col.id==='price') val = `${getCurrencySymbol()}${parseFloat(item.price||0).toLocaleString('en-IN')}`;
                    else if(col.id==='tax') val = `${item.tax||0}%`;
                    else if(col.id==='amount') val = <span className="font-bold">{getCurrencySymbol()}{(item.quantity * item.price).toLocaleString('en-IN')}</span>;
                    else if(col.id==='hsn') val = item.hsn_sac_code || '-';
                    return <td key={col.id} className="px-6 py-1.5 align-middle text-gray-800">{val}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between pb-10">
          {sections.showTerms && (
             <div className="w-1/2 pr-8">
               <h3 className="font-bold text-gray-900 mb-3">Terms & Conditions</h3>
               <ul className="text-gray-500 text-sm space-y-2 list-disc pl-4">
                 {content.termsAndConditions?.map((t, i) => <li key={i}>{t}</li>)}
               </ul>
             </div>
          )}
          
          <div className="w-1/2">
            <div className="rounded-2xl bg-gray-50 p-6 border border-gray-100">
               <div className="flex justify-between mb-3 text-gray-600 font-medium pb-3 border-b border-gray-200">
                 <span>Subtotal</span>
                 <span>{getCurrencySymbol()}{subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
               </div>
               {isIGST ? (
                 <div className="flex justify-between mb-4 text-gray-600 font-medium pb-4 border-b border-gray-200">
                   <span>IGST</span>
                   <span>{getCurrencySymbol()}{taxTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                 </div>
               ) : (
                 <>
                   <div className="flex justify-between mb-2 text-gray-600 font-medium">
                     <span>CGST</span>
                     <span>{getCurrencySymbol()}{(taxTotal / 2).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                   </div>
                   <div className="flex justify-between mb-4 text-gray-600 font-medium pb-4 border-b border-gray-200">
                     <span>SGST</span>
                     <span>{getCurrencySymbol()}{(taxTotal / 2).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                   </div>
                 </>
               )}
               <div className="flex justify-between items-center text-xl">
                 <span className="font-extrabold text-gray-900">Total Due</span>
                 <span style={{ color: primaryColor }} className="font-black text-2xl">
                   {getCurrencySymbol()}{finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                 </span>
               </div>
               {sections.showAmountInWords && (
                 <p className="text-gray-400 text-right mt-2 text-xs font-medium">
                   {amountInWords(finalTotal)}
                 </p>
               )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100 text-center text-[10px] text-gray-400 font-medium tracking-wide w-full">
          This is a computer generated digital invoice and does not require a signature.
        </div>
        
        {showWatermarkFooter && (
          <div className="mt-2 text-center text-[10px] text-gray-400 print-watermark w-full">
            Made with Cenvora: Built for Modern Businesses<br />
            <a href="https://cenvora.app" className="text-blue-500 font-medium" target="_blank" rel="noreferrer">https://cenvora.app</a>
          </div>
        )}
      </div>
      
      {/* Bottom Footer Border */}
      <div style={{ backgroundColor: primaryColor }} className="h-10 w-full" />
    </div>
  );
});

GenzTemplate.displayName = 'GenzTemplate';
export default GenzTemplate;
