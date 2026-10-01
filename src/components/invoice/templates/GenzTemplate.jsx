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

  const bankName = businessInfo.bank_name || content.bankDetails?.bankName || '';
  const bankAccount = businessInfo.bank_account_number || content.bankDetails?.accountNumber || '';
  const bankIfsc = businessInfo.bank_ifsc_code || content.bankDetails?.ifscCode || '';
  const bankBranch = businessInfo.bank_branch || content.bankDetails?.accountHolder || '';
  const bankUpi = businessInfo.bank_upi_id || '';
  const bankQr = businessInfo.bank_qr_code || '';
  const hasBankDetails = Boolean(bankName || bankAccount || bankIfsc || bankUpi || bankQr);
  
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

  const isDeliveryChallan = 
    invoice.document_type === 'delivery_challan' || 
    invoice.is_delivery_challan || 
    content.invoiceTitle === 'DELIVERY CHALLAN' || 
    Boolean(invoice.challan_number && !invoice.invoice_number);

  const primaryColor = colors.primary || '#4285F4';

  const hasAnyDiscount = (items || []).some(item => Number(item?.discount || 0) > 0);
  const visibleColumns = columns
    .filter(col => col.show !== false)
    .filter(col => invoiceSettings.show_item_batch !== false || col.id !== 'batch')
    .filter(col => invoiceSettings.show_item_hsn !== false || col.id !== 'hsn')
    .filter(col => invoiceSettings.show_item_free_quantity !== false || col.id !== 'free_qty')
    .filter(col => (invoiceSettings.show_item_discount !== false && hasAnyDiscount) || col.id !== 'discount')
    .filter(col => invoiceSettings.show_item_tax !== false || col.id !== 'tax');

  return (
    <div 
      ref={ref}
      style={{
        width: '210mm', minHeight: '297mm', boxSizing: 'border-box',
        backgroundColor: colors.background || '#ffffff', color: colors.text || '#333333',
        fontFamily: typography.fontFamily, fontSize: `${typography.bodySize || 11}px`,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        border: `8px solid ${primaryColor}`, borderRadius: '24px', overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Massive Header Strip */}
      <div style={{ backgroundColor: primaryColor }} className="px-12 py-8 flex justify-between items-center text-white">
        <div className="flex items-center gap-4">
          {sections.showLogo && template.branding?.logo && (
             <img src={template.branding.logo} alt="Logo" className="h-12 bg-white p-1 rounded-xl" />
          )}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{companyName}</h1>
            <div className="text-xs text-white/90 mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-medium">
              {sections.showGST && businessInfo.gstin && <span>{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {businessInfo.gstin}</span>}
              {businessInfo.pan_number && <span>PAN: {businessInfo.pan_number}</span>}
              {businessInfo.gem_id && <span>GeM: {businessInfo.gem_id}</span>}
              {businessInfo.drug_license_number && <span>DL: {businessInfo.drug_license_number}</span>}
            </div>
            {companyAddress && <p className="text-xs text-white/80 mt-1 whitespace-pre-line leading-relaxed">{companyAddress}</p>}
          </div>
        </div>
        <h2 className="text-3xl font-bold opacity-90">{content.invoiceTitle || (isDeliveryChallan ? 'DELIVERY CHALLAN' : 'TAX INVOICE')}</h2>
      </div>

      <div className="p-12 flex-1 flex flex-col">
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
              <span className="text-gray-500 font-semibold">{isDeliveryChallan ? 'Challan No.' : 'Invoice No.'}</span>
              <span className="font-bold text-gray-900 text-lg">{isDeliveryChallan ? (invoice.challan_number || invoiceNumber) : invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">{isDeliveryChallan ? 'Challan Date' : 'Date of Issue'}</span>
              <span className="font-bold text-gray-900">{isDeliveryChallan ? (invoice.challan_date || invoiceDate) : invoiceDate}</span>
            </div>
            {isDeliveryChallan ? (
              <>
                {(invoice.sales_order_number || invoice.po_number) && (
                  <div className="flex justify-between mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-500 font-semibold">Ref Order</span>
                    <span className="font-bold text-gray-900">{invoice.sales_order_number || invoice.po_number}</span>
                  </div>
                )}
                {invoice.vehicle_number && (
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-500 font-semibold">Vehicle No.</span>
                    <span className="font-mono font-bold text-gray-900">{invoice.vehicle_number}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {invoice.due_date && (
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-500 font-semibold">Due Date</span>
                    <span className="font-bold text-gray-900">{new Date(invoice.due_date).toLocaleDateString('en-IN')}</span>
                  </div>
                )}
                {(invoice.po_number || invoice.sales_order_number) && (
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-500 font-semibold">PO / Order #</span>
                    <span className="font-bold text-gray-900">{invoice.po_number || invoice.sales_order_number}</span>
                  </div>
                )}
                {invoice.delivery_challan_number && (
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-500 font-semibold">Challan #</span>
                    <span className="font-bold text-gray-900">{invoice.delivery_challan_number}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm mb-10">
          {isDeliveryChallan ? (
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr className="border-b border-gray-200">
                  <th className="py-3 text-xs font-bold text-gray-600 uppercase tracking-widest text-center px-3" style={{ width: '8%', whiteSpace: 'nowrap' }}>Sl.</th>
                  <th className="py-3 text-xs font-bold text-gray-600 uppercase tracking-widest text-left px-5" style={{ width: '48%', whiteSpace: 'nowrap' }}>Item & Description</th>
                  <th className="py-3 text-xs font-bold text-gray-600 uppercase tracking-widest text-center px-3" style={{ width: '14%', whiteSpace: 'nowrap' }}>Qty</th>
                  <th className="py-3 text-xs font-bold text-gray-600 uppercase tracking-widest text-left px-5" style={{ width: '15%', whiteSpace: 'nowrap' }}>Make</th>
                  <th className="py-3 text-xs font-bold text-gray-600 uppercase tracking-widest text-left px-5" style={{ width: '15%', whiteSpace: 'nowrap' }}>Pack Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {items.map((item, idx) => {
                  const qty = item.quantity || 0;
                  const unit = item.unit || 'pcs';
                  const make = item.make || item.product_detail?.make || item.brand || item.product_detail?.brand || '-';
                  const packSize = item.pack_size || item.product_detail?.pack_size || item.packing || item.product_detail?.packing || item.unit || '-';
                  const desc = item.description || item.product_description || item.product_detail?.description;
                  return (
                    item.row_type === 'note' ? (
                      <tr key={idx} className="border-b border-gray-100 bg-gray-50/50">
                        <td colSpan={5} className="py-2.5 px-5 text-left text-xs text-gray-700 italic font-medium">
                          Note: {item.description || item.product_description || item.product || ''}
                        </td>
                      </tr>
                    ) : (
                    <tr key={idx} style={{ paddingTop: '0.6px', paddingBottom: '0.6px', margin: 0, lineHeight: 1.2 }} className="hover:bg-gray-50 transition-colors">
                      <td className="align-middle text-gray-800 text-xs text-center" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>{idx + 1}</td>
                      <td className="align-middle text-gray-800 text-xs text-left" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>
                        <p className="font-normal text-gray-900 text-sm leading-tight">{item.product_name || item.product}</p>
                        {desc && (
                          <p className="text-[11px] text-gray-500 whitespace-pre-line mt-0.5 leading-tight font-normal" style={{ wordBreak: 'break-word' }}>
                            {desc}
                          </p>
                        )}
                      </td>
                      <td className="align-middle text-gray-900 text-xs text-center font-bold" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>
                        <span className="bg-gray-100 px-2 py-0.5 rounded-full">{qty} {unit}</span>
                      </td>
                      <td className="align-middle text-gray-700 text-xs text-left" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>{make}</td>
                      <td className="align-middle text-gray-700 text-xs text-left" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>{packSize}</td>
                    </tr>
                    )
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr className="border-b border-gray-200">
                  {visibleColumns.map((col) => {
                    const isNum = ['price', 'amount'].includes(col.id);
                    const isDesc = col.id === 'description';
                    const alignClass = isDesc ? 'text-left px-5' : isNum ? 'text-right px-5' : 'text-center px-3';
                    const colWidth = col.id === 'serial' ? '8%' : col.id === 'description' ? '38%' : col.id === 'hsn' ? '12%' : col.id === 'quantity' ? '10%' : col.id === 'price' ? '14%' : col.id === 'discount' ? '8%' : col.id === 'tax' ? '8%' : '14%';
                    return (
                      <th key={col.id} className={`py-3 text-xs font-bold text-gray-600 uppercase tracking-widest ${alignClass}`} style={{ width: colWidth, whiteSpace: 'nowrap' }}>
                        {col.id === 'serial' ? 'Sl.' : col.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {items.map((item, idx) => {
                  if (item.row_type === 'note') {
                    return (
                      <tr key={idx} className="border-b border-gray-100 bg-gray-50/50">
                        <td colSpan={visibleColumns.length} className="py-2.5 px-5 text-left text-xs text-gray-700 italic font-medium">
                          Note: {item.description || item.product_description || item.product || ''}
                        </td>
                      </tr>
                    );
                  }
                  return (
                  <tr key={idx} style={{ paddingTop: '0.6px', paddingBottom: '0.6px', margin: 0, lineHeight: 1.2 }} className="hover:bg-gray-50 transition-colors">
                    {visibleColumns.map(col => {
                      const isNum = ['price', 'amount'].includes(col.id);
                      const isDesc = col.id === 'description';
                      const alignClass = isDesc ? 'text-left px-5' : isNum ? 'text-right px-5 font-mono font-medium' : 'text-center px-3';
                      let val = '';
                      if(col.id==='serial') val = idx+1;
                      else if(col.id==='description') {
                        const desc = item.description || item.product_description || item.product_detail?.description;
                        val = (
                          <div className="py-0">
                            <p className="font-normal text-gray-900 text-sm leading-tight">{item.product_name || item.product}</p>
                            {item.hsn_sac_code && <p className="text-[11px] text-gray-400 mt-0.5">{getCountryCode() === 'IN' ? 'HSN:' : 'Tax Code:'} {item.hsn_sac_code}</p>}
                            {desc && (
                              <p className="text-[11px] text-gray-500 whitespace-pre-line mt-0.5 leading-tight font-normal" style={{ wordBreak: 'break-word' }}>
                                {desc}
                              </p>
                            )}
                          </div>
                        );
                      }
                      else if(col.id==='quantity') val = <span className="font-bold bg-gray-100 px-2.5 py-0.5 rounded-full text-xs">{item.quantity}</span>;
                      else if(col.id==='price') {
                        const p = parseFloat(item.price||0);
                        const pStr = p.toString();
                        const decCount = (pStr.split('.')[1] || '').length;
                        const decimals = Math.min(Math.max(2, decCount), 4);
                        val = `${getCurrencySymbol()}${p.toFixed(decimals)}`;
                      }
                      else if(col.id==='discount') {
                        const discNum = parseFloat(item.discount || 0);
                        val = discNum > 0 ? `${discNum}%` : '-';
                      }
                      else if(col.id==='tax') val = `${Math.round(item.tax||0)}%`;
                      else if(col.id==='amount') val = `${getCurrencySymbol()}${(item.quantity * item.price).toFixed(2)}`;
                      else if(col.id==='hsn') val = item.hsn_sac_code || '-';
                      return (
                        <td 
                          key={col.id} 
                          className="align-middle text-gray-800" 
                          style={{ 
                            paddingTop: '0.6px',
                            paddingBottom: '0.6px',
                            paddingLeft: '8px', 
                            paddingRight: '8px',
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
              </tbody>
            </table>
          )}
        </div>

        {/* Totals Section (Hidden for Delivery Challans) */}
        {!isDeliveryChallan && (
          <div className="flex justify-between pb-10 gap-8">
            <div className="w-1/2 space-y-4">
              {sections.showBankDetails && hasBankDetails && (
                <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100 flex items-start gap-4">
                  <div className="text-xs text-gray-700 leading-relaxed flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">Bank & Payment Details</h3>
                    {bankName && <p><span className="font-medium text-gray-500">Bank:</span> {bankName}</p>}
                    {bankAccount && <p><span className="font-medium text-gray-500">Account #:</span> {bankAccount}</p>}
                    {bankIfsc && <p><span className="font-medium text-gray-500">IFSC:</span> {bankIfsc}</p>}
                    {bankBranch && <p><span className="font-medium text-gray-500">Branch:</span> {bankBranch}</p>}
                    {bankUpi && <p><span className="font-medium text-gray-500">UPI/VPA:</span> {bankUpi}</p>}
                  </div>
                  {bankQr && (
                    <div className="flex flex-col items-center">
                      <img src={bankQr} alt="Payment QR" className="w-16 h-16 object-contain rounded-lg border border-gray-200 p-0.5 bg-white shadow-sm" />
                      <span className="text-[9px] text-gray-500 mt-1 font-semibold">Scan to Pay</span>
                    </div>
                  )}
                </div>
              )}
              {sections.showTerms && content.termsAndConditions?.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Terms & Conditions</h3>
                  <ul className="text-gray-500 text-xs space-y-1 list-disc pl-4">
                    {content.termsAndConditions.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}
            </div>
            
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
                 {roundOff !== 0 && (
                   <div className="flex justify-between mb-4 text-gray-600 font-medium pb-2 border-b border-gray-200">
                     <span>Round Off</span>
                     <span className="font-bold text-gray-700">
                       {roundOff >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOff.toFixed(2)}
                     </span>
                   </div>
                 )}
                 <div className="flex justify-between items-center text-sm">
                   <span className="font-extrabold text-gray-900 whitespace-nowrap">Total Due</span>
                   <span style={{ color: primaryColor }} className="font-black font-mono text-base whitespace-nowrap">
                     {getCurrencySymbol()}{finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                   </span>
                 </div>
                 {sections.showAmountInWords && (
                   <p className="text-gray-700 text-right mt-2 text-sm font-medium italic">
                     {amountInWords(finalTotal)}
                   </p>
                 )}
              </div>
            </div>
          </div>
        )}
        
        {/* Bottom Anchored Footer */}
        <div className="mt-auto">
          {isDeliveryChallan && sections.showSignature && (
            <div className="flex justify-end pb-8">
              <div className="text-right">
                <div className="border-t border-gray-400 inline-block pt-1 text-xs px-6">
                  {content.signatureLabel || 'Received By / Signatory'}
                </div>
              </div>
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center text-[10px] text-gray-400 font-medium tracking-wide w-full">
            {isDeliveryChallan
              ? 'This is a computer generated delivery challan and does not require a signature.'
              : 'This is a computer generated digital invoice and does not require a signature.'}
          </div>
          
          {showWatermarkFooter && (
            <div className="mt-2 text-center text-[10px] text-gray-400 print-watermark w-full">
              Made with Cenvora: Built for Modern Businesses<br />
              <a href="https://cenvora.co.in" className="text-blue-500 font-medium" target="_blank" rel="noreferrer">https://cenvora.co.in</a>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Footer Border */}
      <div style={{ backgroundColor: primaryColor }} className="h-10 w-full" />
    </div>
  );
});

GenzTemplate.displayName = 'GenzTemplate';
export default GenzTemplate;
