import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';
import { getTaxType } from '../../../utils/taxUtils';
import { getCurrencySymbol, getCountryCode, formatCurrency } from '../../../utils/currency';

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
        width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box',
        backgroundColor: colors.background || '#ffffff', color: colors.text || '#111827',
        fontFamily: typography.fontFamily, fontSize: `${typography.bodySize || 10}px`,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        border: `4px solid ${colors.accent || '#3b82f6'}`, borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
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
             <p className="whitespace-pre-line text-xs text-gray-600 mb-1">{companyAddress}</p>
             {sections.showGST && businessInfo.gstin && <p className="font-bold text-xs uppercase text-gray-700">{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {businessInfo.gstin}</p>}
             {(businessInfo.pan_number || businessInfo.pan) && <p className="font-bold text-xs uppercase text-gray-700">PAN: {businessInfo.pan_number || businessInfo.pan}</p>}
             {sections.showGEMID && (businessInfo.gem_id || invoice.gem_id) && <p className="text-xs text-gray-700">GeM ID: {businessInfo.gem_id || invoice.gem_id}</p>}
             {(businessInfo.dl_number || invoice.dl_number) && <p className="text-xs text-gray-700">DL No: {businessInfo.dl_number || invoice.dl_number}</p>}
             {invoice.customer_phone && <p className="font-bold text-xs text-gray-700 mt-1">Contact: {invoice.customer_phone}</p>}
           </div>
        </div>
        <div className="text-right">
           <h2 className="text-xl font-bold tracking-widest">{content.invoiceTitle || (isDeliveryChallan ? 'DELIVERY CHALLAN' : 'TAX INVOICE')}</h2>
           <p className="text-xs font-semibold text-gray-500 uppercase mt-1">Original for Recipient</p>
           <p className="text-sm font-bold mt-3">
             {isDeliveryChallan ? 'Challan #:' : 'Invoice #:'} {isDeliveryChallan ? (invoice.challan_number || invoiceNumber) : invoiceNumber}
           </p>
           <p className="text-sm">
             {isDeliveryChallan ? 'Challan Date:' : 'Invoice Date:'} {isDeliveryChallan ? (invoice.challan_date || invoiceDate) : invoiceDate}
           </p>
           {isDeliveryChallan ? (
             <>
               {(invoice.sales_order_number || invoice.po_number) && (
                 <p className="text-sm text-gray-800 font-semibold mt-1">
                   Ref Order: {invoice.sales_order_number || invoice.po_number}
                 </p>
               )}
               {invoice.vehicle_number && (
                 <p className="text-sm font-mono font-bold text-gray-900 mt-1">
                   Vehicle: {invoice.vehicle_number}
                 </p>
               )}
             </>
           ) : (
             <>
               {(invoice.po_number || invoice.sales_order_number) && (
                 <p className="text-sm text-gray-800 font-semibold mt-1">
                   PO / Order: {invoice.po_number || invoice.sales_order_number}
                 </p>
               )}
               {invoice.challan_number && (
                 <p className="text-sm text-gray-800 font-semibold mt-1">
                   Challan: {invoice.challan_number}
                 </p>
               )}
               {invoice.due_date && <p className="text-sm font-semibold text-red-600 mt-1">Due: {new Date(invoice.due_date).toLocaleDateString('en-IN')}</p>}
             </>
           )}
        </div>
      </div>

      {/* Bill To Ships To side by side precisely */}
      <div className="flex border-b border-gray-300 pb-6 mb-6">
        <div className="w-1/2 pr-6">
           <h3 className="font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">Bill To:</h3>
           <p className="font-bold text-base">{customerName}</p>
           <p className="whitespace-pre-line text-gray-700 leading-snug mt-1">{billingAddress}</p>
           {invoice.customer_gstin && <p className="font-bold text-xs mt-2">{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {invoice.customer_gstin}</p>}
        </div>
        <div className="w-1/2 pl-6 border-l border-gray-300">
           <h3 className="font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">Ship To:</h3>
           <p className="font-bold text-base">{customerName}</p>
           <p className="whitespace-pre-line text-gray-700 leading-snug mt-1">{shippingAddress}</p>
           <p className="font-bold text-gray-800 mt-2 text-xs">Place of Supply: {invoice.place_of_supply || '-'}</p>
        </div>
      </div>

      {/* Items Table */}
      {isDeliveryChallan ? (
        <table className="w-full border-collapse mb-6" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="border-y border-gray-400 bg-gray-50 h-9">
              <th className="py-2 text-xs font-bold uppercase tracking-widest text-gray-700 text-center px-2 border-r border-gray-300" style={{ width: '8%', whiteSpace: 'nowrap' }}>Sl.</th>
              <th className="py-2 text-xs font-bold uppercase tracking-widest text-gray-700 text-left px-3 border-r border-gray-300" style={{ width: '48%', whiteSpace: 'nowrap' }}>Item & Description</th>
              <th className="py-2 text-xs font-bold uppercase tracking-widest text-gray-700 text-center px-2 border-r border-gray-300" style={{ width: '14%', whiteSpace: 'nowrap' }}>Qty</th>
              <th className="py-2 text-xs font-bold uppercase tracking-widest text-gray-700 text-left px-3 border-r border-gray-300" style={{ width: '15%', whiteSpace: 'nowrap' }}>Make</th>
              <th className="py-2 text-xs font-bold uppercase tracking-widest text-gray-700 text-left px-3" style={{ width: '15%', whiteSpace: 'nowrap' }}>Pack Size</th>
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
                <tr key={idx} style={{ paddingTop: '0.6px', paddingBottom: '0.6px', margin: 0, lineHeight: 1.2 }} className="border-b border-gray-200">
                  <td className="align-middle text-center border-r border-gray-200 text-xs font-medium" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>{idx + 1}</td>
                  <td className="align-middle text-left border-r border-gray-200" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>
                    <div className="font-normal text-gray-900 leading-tight">{item.product_detail?.name || item.product_name || item.product}</div>
                    {desc && (
                      <div className="text-[10px] text-gray-500 whitespace-pre-line mt-0.5 leading-tight font-normal" style={{ wordBreak: 'break-word' }}>
                        {desc}
                      </div>
                    )}
                  </td>
                  <td className="align-middle text-center border-r border-gray-200 text-xs font-bold text-gray-900" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>{qty} {unit}</td>
                  <td className="align-middle text-left border-r border-gray-200 text-xs text-gray-700" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>{make}</td>
                  <td className="align-middle text-left text-xs text-gray-700" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>{packSize}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <table className="w-full border-collapse mb-6" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="border-y border-gray-400 bg-gray-50 h-9">
              {visibleColumns.map((col, idx) => {
                const isLast = idx === visibleColumns.length - 1;
                const isNum = ['price', 'amount'].includes(col.id);
                const isDesc = col.id === 'description';
                const alignClass = isDesc ? 'text-left px-3' : isNum ? 'text-right px-3' : 'text-center px-2';
                const colWidth = col.id === 'serial' ? '6%' : col.id === 'description' ? '36%' : col.id === 'hsn' ? '12%' : col.id === 'quantity' ? '8%' : col.id === 'price' ? '14%' : col.id === 'discount' ? '8%' : col.id === 'tax' ? '10%' : '14%';
                return (
                  <th key={col.id} className={`py-2 text-xs font-bold uppercase tracking-widest text-gray-700 ${alignClass} ${!isLast ? 'border-r border-gray-300' : ''}`} style={{ width: colWidth, whiteSpace: 'nowrap' }}>
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
                <tr key={idx} style={{ paddingTop: '0.6px', paddingBottom: '0.6px', margin: 0, lineHeight: 1.2 }} className="border-b border-gray-200">
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
                      <div className="py-0">
                        <div className="font-normal text-gray-900 leading-tight">{item.product_detail?.name || item.product_name || item.product}</div>
                        {desc && (
                          <div className="text-[10px] text-gray-500 whitespace-pre-line mt-0.5 leading-tight font-normal" style={{ wordBreak: 'break-word' }}>
                            {desc}
                          </div>
                        )}
                        {invoiceSettings.show_item_storage_condition && (item.product_detail?.storage_condition || item.product_detail?.temperature) ? (
                          <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                            {item.product_detail?.storage_condition ? `Storage: ${item.product_detail.storage_condition}` : ''}
                            {item.product_detail?.storage_condition && item.product_detail?.temperature ? ' | ' : ''}
                            {item.product_detail?.temperature ? `Temp: ${item.product_detail.temperature}` : ''}
                          </div>
                        ) : null}
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
                      paddingTop: '0.6px',
                      paddingBottom: '0.6px',
                      paddingLeft: '8px',
                      paddingRight: '8px',
                      margin: 0,
                      lineHeight: 1.2,
                      fontSize: '12px',
                      textAlign: isDesc ? 'left' : isNum ? 'right' : 'center',
                      verticalAlign: 'middle',
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

      {/* Totals & Notes Section (Hidden for Delivery Challans) */}
      {!isDeliveryChallan && (
        <div className="flex justify-between border-t border-gray-400 pt-6">
          <div className="w-1/2 pr-6 border-r border-gray-200">
             {sections.showBankDetails && hasBankDetails && (
               <div className="mb-6">
                  <p className="font-bold text-xs uppercase tracking-wider mb-2 text-gray-900 underline underline-offset-4 decoration-gray-300">Bank Details:</p>
                  <div className="flex items-start justify-between gap-3 text-xs text-gray-700 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                    <div className="space-y-0.5">
                      {bankName && <p><span className="font-semibold inline-block w-20">Bank:</span> {bankName}</p>}
                      {bankAccount && <p><span className="font-semibold inline-block w-20">Account #:</span> <span className="font-mono">{bankAccount}</span></p>}
                      {bankIfsc && <p><span className="font-semibold inline-block w-20">IFSC:</span> <span className="font-mono">{bankIfsc}</span></p>}
                      {bankBranch && <p><span className="font-semibold inline-block w-20">Branch:</span> {bankBranch}</p>}
                      {bankUpi && <p><span className="font-semibold inline-block w-20">UPI / VPA:</span> <span className="font-mono">{bankUpi}</span></p>}
                    </div>
                    {sections.showQRCode !== false && bankQr && (
                      <div className="text-center flex-shrink-0">
                        <img 
                          src={bankQr} 
                          alt="Scan & Pay" 
                          className="w-16 h-16 object-contain rounded border border-gray-200 p-0.5 bg-white shadow-sm"
                        />
                        <span className="text-[9px] text-gray-500 block mt-0.5">Scan to Pay</span>
                      </div>
                    )}
                  </div>
               </div>
             )}
             <div className="text-xs">
                <p className="font-medium text-gray-600 mb-1">Total items / qty : {items.length} / {items.reduce((acc, curr) => acc + (parseFloat(curr.quantity)||0), 0)}</p>
                <p className="text-sm font-medium text-gray-800">Total amount (in words): <em>INR {amountInWords(finalTotal)}</em></p>
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
               <div className="flex justify-between text-sm font-medium text-gray-700 mb-1.5 items-center">
                 <span>Taxable Amount</span>
                 <span className="font-bold text-gray-900">{getCurrencySymbol()}{subtotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
               </div>
               {isIGST ? (
                 <div className="flex justify-between text-sm font-medium text-gray-700 mb-1.5 items-center">
                   <span>IGST</span>
                   <span className="font-bold text-gray-900">{getCurrencySymbol()}{taxTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                 </div>
               ) : (
                 <>
                   <div className="flex justify-between text-sm font-medium text-gray-700 mb-1.5 items-center">
                     <span>CGST</span>
                     <span className="font-bold text-gray-900">{getCurrencySymbol()}{(taxTotal/2).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                   </div>
                   <div className="flex justify-between text-sm font-medium text-gray-700 mb-1.5 items-center">
                     <span>SGST</span>
                     <span className="font-bold text-gray-900">{getCurrencySymbol()}{(taxTotal/2).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                   </div>
                 </>
               )}
               {roundOff !== 0 && (
                 <div className="flex justify-between text-sm font-medium text-gray-700 mb-1.5 items-center">
                   <span>Round Off</span>
                   <span className="font-bold text-gray-900">{roundOff >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOff.toFixed(2)}</span>
                 </div>
               )}
               <div className="flex justify-between text-sm font-bold text-gray-900 py-2.5 border-t-2 border-b-2 border-gray-800 mt-2">
                 <span className="whitespace-nowrap">Grand Total</span>
                 <span className="font-mono whitespace-nowrap">{getCurrencySymbol()}{finalTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
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
      )}

      {/* Bottom Anchored Footer */}
      <div className="mt-auto">
        {isDeliveryChallan && sections.showSignature && (
          <div className="flex justify-end pt-8 mb-4">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-600 mb-8">For {companyName}</p>
              <div className="border-t border-gray-400 inline-block pt-1 text-xs px-4">
                {content.signatureLabel || 'Received By / Signatory'}
              </div>
            </div>
          </div>
        )}
        <div className="mt-4 text-center text-[10px] text-gray-500 font-medium">
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
  );
});

BillShipTemplate.displayName = 'BillShipTemplate';
export default BillShipTemplate;
