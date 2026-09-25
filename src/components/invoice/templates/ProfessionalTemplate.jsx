import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';
import { getTaxType } from '../../../utils/taxUtils';
import { getCurrencySymbol, getCountryCode, formatCurrency } from '../../../utils/currency';

// Professional Template (Marico Style)
const ProfessionalTemplate = forwardRef(({ 
  invoice = {}, template = {}, businessInfo = {}, invoiceSettings = {}, scale = 1, showWatermark = false,
}, ref) => {
  const colors = template.colors || {};
  const typography = template.typography || {};
  const sections = template.sections || {};
  const content = template.content || {};
  const columns = template.columns || [];

  const companyName = template.branding?.useBusinessName !== false 
    ? (businessInfo.business_name || 'Your Business Name')
    : (template.branding?.customName || 'Your Business Name');
  
  const companyAddress = businessInfo.business_address || businessInfo.address || '';
  const companyGST = businessInfo.gstin || '';
  const customerGST = invoice.customer_gstin || invoice.gstin || '';
  const customerName = invoice.customer_name || 'Customer Name';
  const billingAddress = invoice.customer_address || invoice.customer?.address || '';
  const shippingAddress = invoice.delivery_address || invoice.shipping_address || '';
  const invoiceNumber = invoice.invoice_number || 'INV-001';
  const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const items = invoice.items || [];
  
  const roundOff = parseFloat(invoice.round_off || 0) || 0;
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity || 0);
    const price = parseFloat(item.price || 0);
    const discount = parseFloat(item.discount || 0);
    const lineBase = qty * price;
    return sum + (lineBase - (lineBase * discount) / 100);
  }, 0);
  const taxTotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity || 0);
    const price = parseFloat(item.price || 0);
    const discount = parseFloat(item.discount || 0);
    const tax = parseFloat(item.tax || 0);
    const lineBase = qty * price;
    const taxable = lineBase - (lineBase * discount) / 100;
    return sum + ((taxable * tax) / 100);
  }, 0);
  const finalTotal = invoice.total_amount != null
    ? parseFloat(invoice.total_amount)
    : Number((subtotal + taxTotal + roundOff).toFixed(2));

  const taxType = getTaxType(invoice, businessInfo);
  const isIGST = taxType === 'igst';

  const planCode = businessInfo.plan_code || 'free';
  const showWatermarkFooter = planCode !== 'business';

  const visibleColumns = columns.filter(col => col.show !== false);

  return (
    <div 
      ref={ref}
      style={{
        width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box',
        backgroundColor: colors.background || '#ffffff', color: colors.text || '#333333',
        fontFamily: typography.fontFamily, fontSize: `${typography.bodySize || 10}px`,
        transform: `scale(${scale})`, transformOrigin: 'top left', border: `1px solid ${colors.tableBorder || '#e2e8f0'}`,
        borderRadius: '12px'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="w-1/2">
          {sections.showLogo && template.branding?.logo && (
            <img src={template.branding.logo} alt="Logo" style={{ maxHeight: 60 }} className="mb-4" />
          )}
          <h1 className="font-bold text-xl mb-1" style={{ color: colors.primary }}>{companyName}</h1>
          <div className="text-gray-600 space-y-0.5">
            <p className="whitespace-pre-line">{companyAddress}</p>
            {sections.showGST && companyGST && <p><strong>{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'}</strong> {companyGST}</p>}
          </div>
        </div>
        <div className="text-right w-1/2">
          <h2 className="text-2xl font-bold tracking-widest mb-4" style={{ color: '#1f2937' }}>
            {content.invoiceTitle || 'TAX INVOICE'}
          </h2>
          <div className="grid grid-cols-2 gap-4 text-left ml-auto max-w-xs border border-gray-200 p-3 bg-gray-50/50">
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-0.5">Invoice No</p>
              <p className="font-bold">{invoiceNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-0.5">Date</p>
              <p className="font-bold">{invoiceDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To & Ship To */}
      <div className="grid grid-cols-3 gap-6 mb-8 text-sm">
        <div className="col-span-1">
          <h3 className="font-bold border-b pb-1 mb-2" style={{ borderColor: colors.primary }}>Bill To</h3>
          <p className="font-bold">{customerName}</p>
          <p className="whitespace-pre-line text-gray-600">{billingAddress}</p>
          {customerGST && (
            <p className="text-gray-600 mt-1">
              <strong>{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'}</strong> {customerGST}
            </p>
          )}
        </div>
        {(shippingAddress && shippingAddress !== billingAddress) && (
          <div className="col-span-1">
            <h3 className="font-bold border-b pb-1 mb-2" style={{ borderColor: colors.primary }}>Ship To</h3>
            <p className="font-bold">{customerName}</p>
            <p className="whitespace-pre-line text-gray-600">{shippingAddress}</p>
          </div>
        )}
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse mb-8" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className="border-y-2 border-gray-900 bg-gray-50 h-10">
            {visibleColumns.map((col) => {
              const isNum = ['price', 'amount'].includes(col.id);
              const isDesc = col.id === 'description';
              const alignClass = isDesc ? 'text-left px-3' : isNum ? 'text-right px-3' : 'text-center px-2';
              const colWidth = col.id === 'serial' ? '6%' : col.id === 'description' ? '36%' : col.id === 'hsn' ? '12%' : col.id === 'quantity' ? '8%' : col.id === 'price' ? '14%' : col.id === 'tax' ? '10%' : '14%';
              return (
                <th key={col.id} className={`py-2.5 text-xs font-bold uppercase tracking-wider text-gray-900 ${alignClass}`} style={{ width: colWidth }}>
                  {col.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item, idx) => (
            <tr key={idx} className="h-auto hover:bg-gray-50 transition-colors">
              {visibleColumns.map(col => {
                const isNum = ['price', 'amount'].includes(col.id);
                const isDesc = col.id === 'description';
                const alignClass = isDesc ? 'text-left px-3' : isNum ? 'text-right px-3 font-mono font-medium' : 'text-center px-2';
                let val = '';
                if(col.id==='serial') val = idx+1;
                else if(col.id==='description') {
                  const desc = item.description || item.product_description || item.product_detail?.description;
                  val = (
                    <div className="leading-tight py-0.5">
                      <div className="font-semibold text-gray-900">{item.product_name || item.product}</div>
                      {desc && (
                        <div className="text-[10px] text-gray-500 whitespace-pre-line mt-0.5 leading-relaxed font-normal" style={{ wordBreak: 'break-word' }}>
                          {desc}
                        </div>
                      )}
                    </div>
                  );
                }
                else if(col.id==='quantity') val = item.quantity;
                else if(col.id==='price') val = `${getCurrencySymbol()}${parseFloat(item.price||0).toFixed(2)}`;
                else if(col.id==='tax') val = `${item.tax||0}%`;
                else if(col.id==='amount') val = `${getCurrencySymbol()}${(item.quantity * item.price).toFixed(2)}`;
                else if(col.id==='hsn') val = item.hsn_sac_code || '-';
                return <td key={col.id} className={`py-2.5 text-xs text-gray-800 align-top ${alignClass}`} style={{ verticalAlign: 'top' }}>{val}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals & Details */}
      <div className="flex justify-between">
        <div className="w-1/2 pr-8">
          {sections.showBankDetails && (
             <div className="mb-6">
                <p className="font-bold text-xs uppercase tracking-wider mb-2 text-gray-500">Bank Details</p>
                <div className="text-xs text-gray-700 bg-gray-50 p-4 rounded-lg">
                  <p><span className="font-semibold w-16 inline-block">Bank:</span> {content.bankDetails?.bankName}</p>
                  <p><span className="font-semibold w-16 inline-block">A/C No:</span> {content.bankDetails?.accountNumber}</p>
                  <p><span className="font-semibold w-16 inline-block">IFSC:</span> {content.bankDetails?.ifscCode}</p>
                </div>
             </div>
          )}
          {sections.showTerms && (
             <div>
                <p className="font-bold text-xs uppercase tracking-wider mb-2 text-gray-500">Notes & Terms</p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                  {content.termsAndConditions?.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
             </div>
          )}
        </div>

        <div className="w-1/3">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex justify-between p-3 border-b border-gray-100 text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-bold">{getCurrencySymbol()}{subtotal.toFixed(2)}</span>
            </div>
            {isIGST ? (
              <div className="flex justify-between p-3 border-b border-gray-100 text-sm">
                <span className="text-gray-600">IGST</span>
                <span className="font-bold">{getCurrencySymbol()}{taxTotal.toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between p-3 border-b border-gray-100 text-sm">
                  <span className="text-gray-600">CGST</span>
                  <span className="font-bold">{getCurrencySymbol()}{(taxTotal / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-3 border-b border-gray-100 text-sm">
                  <span className="text-gray-600">SGST</span>
                  <span className="font-bold">{getCurrencySymbol()}{(taxTotal / 2).toFixed(2)}</span>
                </div>
              </>
            )}
            {roundOff !== 0 && (
              <div className="flex justify-between p-3 border-b border-gray-100 text-sm">
                <span className="text-gray-600">Round Off</span>
                <span className="font-bold text-gray-700">
                  {roundOff >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOff.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between p-3.5 bg-gray-50 text-sm">
              <span className="font-bold text-gray-900 whitespace-nowrap">Total</span>
              <span className="font-bold font-mono text-indigo-600 whitespace-nowrap">{getCurrencySymbol()}{finalTotal.toFixed(2)}</span>
            </div>
          </div>
          {sections.showAmountInWords && (
            <p className="text-xs text-right mt-3 text-gray-500 italic">
              {amountInWords(finalTotal)}
            </p>
          )}

          {sections.showSignature && (
            <div className="mt-16 text-right">
              <div className="border-t border-gray-400 inline-block pt-2 w-48 text-center text-xs font-semibold text-gray-500">
                {content.signatureLabel || 'Authorized Signatory'}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-500">
        This is a computer generated digital invoice and does not require a signature.
      </div>

      {showWatermarkFooter && (
        <div className="mt-2 text-center text-[10px] text-gray-400 print-watermark w-full">
          Made with Cenvora: Built for Modern Businesses<br />
          <a href="https://cenvora.app" className="text-blue-500 font-medium" target="_blank" rel="noreferrer">https://cenvora.app</a>
        </div>
      )}
    </div>
  );
});

ProfessionalTemplate.displayName = 'ProfessionalTemplate';
export default ProfessionalTemplate;
