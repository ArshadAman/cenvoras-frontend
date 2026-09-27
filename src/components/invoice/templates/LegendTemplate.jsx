import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';
import { getTaxType } from '../../../utils/taxUtils';
import { getCurrencySymbol, getCountryCode, formatCurrency } from '../../../utils/currency';

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

  const hasAnyDiscount = (items || []).some(item => Number(item?.discount || 0) > 0);
  const visibleColumns = columns
    .filter(col => col.show !== false)
    .filter(col => invoiceSettings.show_item_batch !== false || col.id !== 'batch')
    .filter(col => invoiceSettings.show_item_hsn !== false || col.id !== 'hsn')
    .filter(col => invoiceSettings.show_item_free_quantity !== false || col.id !== 'free_qty')
    .filter(col => (invoiceSettings.show_item_discount !== false && hasAnyDiscount) || col.id !== 'discount')
    .filter(col => invoiceSettings.show_item_tax !== false || col.id !== 'tax');

  const planCode = businessInfo.plan_code || 'free';
  const showWatermarkFooter = planCode !== 'business';
  const borderColor = colors.tableBorder || '#e2e8f0';

  const isDeliveryChallan = 
    invoice.document_type === 'delivery_challan' || 
    invoice.is_delivery_challan || 
    content.invoiceTitle === 'DELIVERY CHALLAN' || 
    Boolean(invoice.challan_number && !invoice.invoice_number);

  return (
    <div 
      ref={ref}
      style={{
        width: '210mm', minHeight: '297mm', padding: '10mm', boxSizing: 'border-box',
        backgroundColor: colors.background || '#ffffff', color: colors.text || '#000000',
        fontFamily: typography.fontFamily, fontSize: `${typography.bodySize || 10}px`,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ border: `1px solid ${borderColor}` }} className="flex-1 flex flex-col">
        {/* Header Block */}
        <div className="flex justify-between items-start border-b" style={{ borderColor }}>
          <div className="p-4 flex gap-4 w-2/3 border-r" style={{ borderColor }}>
            {sections.showLogo && template.branding?.logo && (
              <img src={template.branding.logo} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
            )}
            <div>
              <h1 className="font-bold text-lg mb-0.5" style={{ color: colors.primary }}>{companyName}</h1>
              <p className="whitespace-pre-line leading-snug">{companyAddress}</p>
              {sections.showGST && <p className="font-bold mt-1">{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {businessInfo.gstin || '-'}</p>}
              {invoice.customer_phone && <p>Mobile: {invoice.customer_phone}</p>}
            </div>
          </div>
          <div className="p-4 w-1/3 text-right">
            <h2 className="text-xl font-bold tracking-widest">{content.invoiceTitle || (isDeliveryChallan ? 'DELIVERY CHALLAN' : 'TAX INVOICE')}</h2>
            <p className="text-xs uppercase tracking-wider text-gray-500 mt-1">Original for Recipient</p>
          </div>
        </div>

        {/* Info Blocks Grid */}
        <div className="flex border-b" style={{ borderColor }}>
          <div className="w-1/2 p-3 border-r" style={{ borderColor }}>
             <p className="font-bold text-[11px] uppercase tracking-wider text-gray-500 mb-0.5">Customer Details:</p>
             <p className="font-semibold text-gray-900">{customerName}</p>
             {invoice.customer_gstin && <p className="font-medium text-xs mt-0.5">{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {invoice.customer_gstin}</p>}
             <p className="whitespace-pre-line mt-0.5 text-xs text-gray-600 leading-snug">{billingAddress}</p>
          </div>
          <div className="w-1/2 flex flex-col justify-between">
             <div className="flex border-b flex-1" style={{ borderColor }}>
                <div className="w-1/2 p-2.5 border-r flex flex-col justify-center" style={{ borderColor }}>
                   <p className="font-bold text-[11px] uppercase tracking-wider text-gray-500 mb-0.5">{isDeliveryChallan ? 'Challan #' : 'Invoice #'}</p>
                   <p className="font-semibold text-gray-900">{isDeliveryChallan ? (invoice.challan_number || invoiceNumber) : invoiceNumber}</p>
                </div>
                <div className="w-1/2 p-2.5 flex flex-col justify-center">
                   <p className="font-bold text-[11px] uppercase tracking-wider text-gray-500 mb-0.5">{isDeliveryChallan ? 'Challan Date' : 'Date'}</p>
                   <p className="font-semibold text-gray-900">{isDeliveryChallan ? (invoice.challan_date || invoiceDate) : invoiceDate}</p>
                </div>
             </div>
             <div className="flex flex-1">
                {isDeliveryChallan ? (
                  <>
                    <div className="w-1/2 p-2.5 border-r flex flex-col justify-center" style={{ borderColor }}>
                       <p className="font-bold text-[11px] uppercase tracking-wider text-gray-500 mb-0.5">Ref Order</p>
                       <p className="font-semibold text-gray-900">{invoice.sales_order_number || invoice.po_number || '—'}</p>
                    </div>
                    <div className="w-1/2 p-2.5 flex flex-col justify-center">
                       <p className="font-bold text-[11px] uppercase tracking-wider text-gray-500 mb-0.5">Vehicle No.</p>
                       <p className="font-mono font-semibold text-gray-900">{invoice.vehicle_number || '—'}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-1/2 p-2.5 border-r flex flex-col justify-center" style={{ borderColor }}>
                       <p className="font-bold text-[11px] uppercase tracking-wider text-gray-500 mb-0.5">Place of Supply</p>
                       <p className="font-semibold text-gray-900">{invoice.place_of_supply || 'Same State'}</p>
                    </div>
                    <div className="w-1/2 p-2.5 flex flex-col justify-center">
                       {invoice.due_date ? (
                         <>
                           <p className="font-bold text-[11px] uppercase tracking-wider text-gray-500 mb-0.5">Due Date</p>
                           <p className="font-semibold text-gray-900">{new Date(invoice.due_date).toLocaleDateString('en-IN')}</p>
                         </>
                       ) : invoice.po_number ? (
                         <>
                           <p className="font-bold text-[11px] uppercase tracking-wider text-gray-500 mb-0.5">PO #</p>
                           <p className="font-semibold text-gray-900">{invoice.po_number}</p>
                         </>
                       ) : (
                         <>
                           <p className="font-bold text-[11px] uppercase tracking-wider text-gray-500 mb-0.5">Payment Terms</p>
                           <p className="font-semibold text-gray-900">Due on Receipt</p>
                         </>
                       )}
                    </div>
                  </>
                )}
             </div>
          </div>
        </div>

        {/* Legend Table */}
        {isDeliveryChallan ? (
          <table className="w-full border-collapse border-b" style={{ borderColor, tableLayout: 'fixed' }}>
            <thead>
              <tr className="h-9" style={{ backgroundColor: colors.primary, color: '#fff' }}>
                <th className="py-2 text-[11px] font-bold uppercase tracking-wider text-center px-2 border-r border-white/20" style={{ width: '8%', whiteSpace: 'nowrap' }}>Sl.</th>
                <th className="py-2 text-[11px] font-bold uppercase tracking-wider text-left px-3 border-r border-white/20" style={{ width: '48%', whiteSpace: 'nowrap' }}>Item & Description</th>
                <th className="py-2 text-[11px] font-bold uppercase tracking-wider text-center px-2 border-r border-white/20" style={{ width: '14%', whiteSpace: 'nowrap' }}>Qty</th>
                <th className="py-2 text-[11px] font-bold uppercase tracking-wider text-left px-3 border-r border-white/20" style={{ width: '15%', whiteSpace: 'nowrap' }}>Make</th>
                <th className="py-2 text-[11px] font-bold uppercase tracking-wider text-left px-3" style={{ width: '15%', whiteSpace: 'nowrap' }}>Pack Size</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                if (item.row_type === 'note') {
                  return (
                    <tr key={idx} className="border-b border-gray-200 bg-gray-50/50">
                      <td colSpan={5} className="py-1.5 px-3 text-left text-xs text-gray-700 italic font-medium">
                        Note: {item.description || item.product_description || item.product || ''}
                      </td>
                    </tr>
                  );
                }
                const qty = item.quantity || 0;
                const unit = item.unit || 'pcs';
                const make = item.make || item.product_detail?.make || item.brand || item.product_detail?.brand || '-';
                const packSize = item.pack_size || item.product_detail?.pack_size || item.packing || item.product_detail?.packing || item.unit || '-';
                const desc = item.description || item.product_description || item.product_detail?.description;
                return (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="text-xs text-gray-800 align-middle text-center border-r border-gray-200 font-medium" style={{ padding: '1px 8px', verticalAlign: 'middle' }}>{idx + 1}</td>
                    <td className="text-xs text-gray-800 align-middle text-left border-r border-gray-200" style={{ padding: '1px 8px', verticalAlign: 'middle' }}>
                      <div className="font-normal text-gray-900 leading-tight">{item.product_name || item.product}</div>
                      {desc && (
                        <div className="text-[10px] text-gray-500 whitespace-pre-line mt-0.5 leading-relaxed font-normal" style={{ wordBreak: 'break-word' }}>
                          {desc}
                        </div>
                      )}
                    </td>
                    <td className="text-xs text-gray-900 align-middle text-center border-r border-gray-200 font-bold" style={{ padding: '1px 8px', verticalAlign: 'middle' }}>{qty} {unit}</td>
                    <td className="text-xs text-gray-700 align-middle text-left border-r border-gray-200" style={{ padding: '1px 8px', verticalAlign: 'middle' }}>{make}</td>
                    <td className="text-xs text-gray-700 align-middle text-left" style={{ padding: '1px 8px', verticalAlign: 'middle' }}>{packSize}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-collapse border-b" style={{ borderColor, tableLayout: 'fixed' }}>
            <thead>
              <tr className="h-9" style={{ backgroundColor: colors.primary, color: '#fff' }}>
                {visibleColumns.map((col, idx) => {
                  const isLast = idx === visibleColumns.length - 1;
                  const isNum = ['price', 'amount'].includes(col.id);
                  const isDesc = col.id === 'description';
                  const alignClass = isDesc ? 'text-left px-3' : isNum ? 'text-right px-3' : 'text-center px-2';
                  const colWidth = col.id === 'serial' ? '6%' : col.id === 'description' ? '36%' : col.id === 'hsn' ? '12%' : col.id === 'quantity' ? '8%' : col.id === 'price' ? '14%' : col.id === 'discount' ? '8%' : col.id === 'tax' ? '10%' : '14%';
                  return (
                    <th 
                      key={col.id} 
                      className={`py-2 text-[11px] font-bold uppercase tracking-wider ${alignClass} ${!isLast ? 'border-r border-white/20' : ''}`}
                      style={{ width: colWidth, whiteSpace: 'nowrap' }}
                    >
                      {col.id === 'serial' ? 'Sl.' : col.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                if (item.row_type === 'note') {
                  return (
                    <tr key={idx} className="border-b border-gray-200 bg-gray-50/50">
                      <td colSpan={visibleColumns.length} className="py-1.5 px-3 text-left text-xs text-gray-700 italic font-medium">
                        Note: {item.description || item.product_description || item.product || ''}
                      </td>
                    </tr>
                  );
                }
                return (
                <tr key={idx} className="border-b border-gray-200">
                {visibleColumns.map((col, cIdx) => {
                  const isLast = cIdx === visibleColumns.length - 1;
                  const isNum = ['price', 'amount'].includes(col.id);
                  const isDesc = col.id === 'description';
                  const alignClass = isDesc ? 'text-left px-3' : isNum ? 'text-right px-3 font-mono' : 'text-center px-2';
                  let val = '';
                  if(col.id==='serial') val = idx+1;
                  else if(col.id==='description') {
                    const desc = item.description || item.product_description || item.product_detail?.description;
                    val = (
                      <div className="leading-tight py-0.5">
                        <div className="font-normal text-gray-900">{item.product_name || item.product}</div>
                        {desc && (
                          <div className="text-[10px] text-gray-500 whitespace-pre-line mt-0.5 leading-relaxed font-normal" style={{ wordBreak: 'break-word' }}>
                            {desc}
                          </div>
                        )}
                      </div>
                    );
                  }
                  else if(col.id==='quantity') val = item.quantity;
                  else if(col.id==='price') {
                    const p = parseFloat(item.price||0);
                    const pStr = p.toString();
                    const decCount = (pStr.split('.')[1] || '').length;
                    const decimals = Math.min(Math.max(2, decCount), 4);
                    val = p.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: decimals });
                  }
                  else if(col.id==='discount') {
                    const discNum = parseFloat(item.discount || 0);
                    val = discNum > 0 ? `${discNum}%` : '-';
                  }
                  else if(col.id==='tax') val = `${Math.round(item.tax||0)}%`;
                  else if(col.id==='amount') val = (item.quantity * item.price).toLocaleString('en-IN', {minimumFractionDigits:2});
                  else if(col.id==='hsn') val = item.hsn_sac_code || '-';
                  return (
                    <td 
                      key={col.id} 
                      className={`align-middle ${!isLast ? 'border-r border-gray-200' : ''}`} 
                      style={{ 
                        padding: '1px 8px', 
                        margin: 0, 
                        lineHeight: 1.2, 
                        fontSize: '12px', 
                        textAlign: isDesc ? 'left' : isNum ? 'right' : 'center', 
                        verticalAlign: 'middle' 
                      }}
                    >
                      {val}
                    </td>
                  );
                })}
                </tr>
              );
            })}
              <tr className="font-bold h-9 bg-gray-50/50">
                <td colSpan={visibleColumns.length - 2} className="text-left px-3 border-r border-gray-200 text-xs text-gray-600">
                  Total items: {items.length}
                </td>
                <td className="border-r border-gray-200 text-right px-3 text-xs uppercase tracking-wider font-semibold text-gray-700 whitespace-nowrap">Subtotal</td>
                <td className="text-right px-3 text-xs font-mono font-bold text-gray-900 whitespace-nowrap">{getCurrencySymbol()}{subtotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Footer Details (Hidden for Delivery Challans) */}
        {!isDeliveryChallan ? (
          <div className="flex flex-1">
            <div className="w-3/5 p-3 border-r flex flex-col justify-between" style={{ borderColor }}>
               <div>
                 <p className="italic mb-2 text-sm font-medium text-gray-800">Total amount (in words): <strong>INR {amountInWords(finalTotal)}</strong></p>
                 {sections.showBankDetails && (
                   <div>
                      <h4 className="font-bold border-b border-gray-300 inline-block mb-1 text-xs">Bank Details:</h4>
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
                   <p className="font-bold border-b border-gray-300 inline-block mb-1 text-xs">Notes:</p>
                   <p className="mb-2 text-xs">{content.footerNote}</p>
                   <p className="font-bold border-b border-gray-300 inline-block mb-1 text-xs">Terms & Conditions:</p>
                   <ul className="list-decimal pl-4 space-y-0.5 text-xs">
                     {content.termsAndConditions?.map((t, i) => <li key={i}>{t}</li>)}
                   </ul>
                 </div>
               )}
            </div>
            
            {/* Totals Block */}
            <div className="w-2/5 flex flex-col justify-between">
               <div className="p-3 text-xs space-y-1">
                 <div className="flex justify-between items-center py-0.5">
                   <span className="font-semibold text-gray-700 whitespace-nowrap">Taxable Amount</span>
                   <span className="font-mono text-gray-900 whitespace-nowrap">{getCurrencySymbol()}{subtotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                 </div>
                 {isIGST ? (
                   <div className="flex justify-between items-center py-0.5">
                     <span className="font-semibold text-gray-700 whitespace-nowrap">IGST</span>
                     <span className="font-mono text-gray-900 whitespace-nowrap">{getCurrencySymbol()}{taxTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                   </div>
                 ) : (
                   <>
                     <div className="flex justify-between items-center py-0.5">
                       <span className="font-semibold text-gray-700 whitespace-nowrap">CGST</span>
                       <span className="font-mono text-gray-900 whitespace-nowrap">{getCurrencySymbol()}{(taxTotal/2).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                     </div>
                     <div className="flex justify-between items-center py-0.5">
                       <span className="font-semibold text-gray-700 whitespace-nowrap">SGST</span>
                       <span className="font-mono text-gray-900 whitespace-nowrap">{getCurrencySymbol()}{(taxTotal/2).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                     </div>
                   </>
                 )}
                 {roundOff !== 0 && (
                   <div className="flex justify-between items-center py-0.5">
                     <span className="font-semibold text-gray-700 whitespace-nowrap">Round Off</span>
                     <span className="font-mono text-gray-900 whitespace-nowrap">{roundOff >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOff.toFixed(2)}</span>
                   </div>
                 )}
                 <div className="flex justify-between items-center px-2 py-2 border-t-2 border-b-2 bg-gray-100 font-bold mt-1" style={{ borderColor }}>
                   <span className="text-xs uppercase tracking-wider text-gray-900 whitespace-nowrap">Total Amount</span>
                   <span className="text-sm font-mono text-gray-900 whitespace-nowrap">{getCurrencySymbol()}{finalTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                 </div>
               </div>
               
               {sections.showSignature && (
                 <div className="p-3 text-right text-xs">
                    <p className="font-bold mb-10">For {companyName}</p>
                    <p className="border-t border-gray-400 inline-block pt-1">{content.signatureLabel || 'Authorized Signatory'}</p>
                 </div>
               )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 justify-between p-4">
            <div className="w-1/2">
              {sections.showTerms && (
                <div>
                  <p className="font-bold border-b border-gray-300 inline-block mb-1 text-xs">Terms & Conditions:</p>
                  <ul className="list-decimal pl-4 space-y-0.5 text-xs text-gray-600">
                    {content.termsAndConditions?.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}
            </div>
            {sections.showSignature && (
              <div className="w-1/2 flex flex-col justify-end text-right text-xs p-3">
                <p className="font-bold mb-10">For {companyName}</p>
                <p className="border-t border-gray-400 inline-block pt-1">{content.signatureLabel || 'Received By / Signatory'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Anchored Footer */}
      <div className="mt-auto">
        <div className="mt-4 text-center text-[10px] text-gray-500 font-medium w-full">
          {isDeliveryChallan
            ? 'This is a computer generated delivery challan and does not require a signature.'
            : 'This is a computer generated digital invoice and does not require a signature.'}
        </div>
        
        {showWatermarkFooter && (
          <div className="mt-2 text-center text-[10px] text-gray-400 print-watermark w-full">
            Made with Cenvora: Built for Modern Businesses<br />
            <a href="https://cenvora.app" className="text-blue-500 font-medium" target="_blank" rel="noreferrer">https://cenvora.app</a>
          </div>
        )}
      </div>
    </div>
  );
});

LegendTemplate.displayName = 'LegendTemplate';
export default LegendTemplate;
