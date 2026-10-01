import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';
import { getTaxType } from '../../../utils/taxUtils';
import { getCurrencySymbol, getCountryCode, formatCurrency } from '../../../utils/currency';

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

  const primaryColor = colors.primary || '#174A82';

  const preferredWidths = {
    serial: '6%',
    description: 'auto',
    hsn: '12%',
    quantity: '8%',
    price: '15%',
    discount: '8%',
    tax: '10%',
    amount: '18%',
  };

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
        fontFamily: typography.fontFamily || 'Inter, system-ui, sans-serif', fontSize: `${typography.bodySize || 10}px`,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        border: `3px solid ${primaryColor}`, borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          {sections.showLogo && template.branding?.logo && (
             <img src={template.branding.logo} alt="Logo" style={{ maxHeight: 50 }} className="mb-4" />
          )}
          <h1 className="font-bold text-2xl mb-1 uppercase tracking-tight" style={{ color: primaryColor }}>{companyName}</h1>
          {sections.showGST && businessInfo.gstin && <p className="font-bold text-[10px] text-gray-700">{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {businessInfo.gstin}</p>}
          {businessInfo.pan_number && <p className="font-bold text-[10px] text-gray-700">PAN: {businessInfo.pan_number}</p>}
          {businessInfo.gem_id && <p className="font-bold text-[10px] text-gray-700">GeM ID: {businessInfo.gem_id}</p>}
          {businessInfo.drug_license_number && <p className="font-bold text-[10px] text-gray-700">DL No: {businessInfo.drug_license_number}</p>}
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
            {content.invoiceTitle || (isDeliveryChallan ? 'DELIVERY CHALLAN' : 'TAX INVOICE')}
          </h2>
          <p className="text-gray-900 font-bold text-sm">
            {isDeliveryChallan ? 'Challan #:' : 'Invoice #:'} {isDeliveryChallan ? (invoice.challan_number || invoiceNumber) : invoiceNumber}
          </p>
        </div>
      </div>

      <div className="flex mb-8 border-y-2 py-6" style={{ borderColor: '#f3f4f6' }}>
        <div className="w-1/2">
          <h3 className="font-bold text-gray-400 text-[10px] uppercase tracking-widest mb-2">Bill To:</h3>
          <p className="font-bold text-lg text-gray-900 leading-none mb-1">{customerName}</p>
          <p className="whitespace-pre-line text-gray-600 text-sm leading-relaxed">{billingAddress}</p>
          {invoice.customer_gstin && <p className="text-xs font-bold text-gray-800 mt-2">{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {invoice.customer_gstin}</p>}
        </div>
        <div className="w-1/2 space-y-2 text-sm pl-12 border-l border-gray-100">
          <div className="flex justify-between">
            <span className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">
              {isDeliveryChallan ? 'Challan Date:' : 'Invoice Date:'}
            </span>{' '}
            <span className="font-semibold text-gray-900">{isDeliveryChallan ? (invoice.challan_date || invoiceDate) : invoiceDate}</span>
          </div>
          {isDeliveryChallan ? (
            <>
              {(invoice.sales_order_number || invoice.po_number) && (
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">Ref Order:</span>{' '}
                  <span className="font-semibold text-gray-900">{invoice.sales_order_number || invoice.po_number}</span>
                </div>
              )}
              {invoice.vehicle_number && (
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">Vehicle No:</span>{' '}
                  <span className="font-mono font-bold text-gray-900">{invoice.vehicle_number}</span>
                </div>
              )}
              {invoice.transport_mode && (
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">Mode:</span>{' '}
                  <span className="font-semibold text-gray-900">{invoice.transport_mode}</span>
                </div>
              )}
            </>
          ) : (
            <>
              {invoice.due_date && <div className="flex justify-between"><span className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">Due Date:</span> <span className="font-semibold text-gray-900">{new Date(invoice.due_date).toLocaleDateString('en-IN')}</span></div>}
              {(invoice.po_number || invoice.sales_order_number) && <div className="flex justify-between"><span className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">PO / Order #:</span> <span className="font-semibold text-gray-900">{invoice.po_number || invoice.sales_order_number}</span></div>}
              {invoice.delivery_challan_number && <div className="flex justify-between"><span className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">Challan #:</span> <span className="font-semibold text-gray-900">{invoice.delivery_challan_number}</span></div>}
            </>
          )}
        </div>
      </div>

      {/* Items Table */}
      {isDeliveryChallan ? (
        <table className="w-full text-left mb-8 border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className="py-3 px-2 text-[11px] font-black text-gray-900 uppercase tracking-widest text-center" style={{ width: '8%', whiteSpace: 'nowrap' }}>Sl.</th>
              <th className="py-3 px-3 text-[11px] font-black text-gray-900 uppercase tracking-widest text-left" style={{ width: '48%', whiteSpace: 'nowrap' }}>Item & Description</th>
              <th className="py-3 px-2 text-[11px] font-black text-gray-900 uppercase tracking-widest text-center" style={{ width: '14%', whiteSpace: 'nowrap' }}>Qty</th>
              <th className="py-3 px-3 text-[11px] font-black text-gray-900 uppercase tracking-widest text-left" style={{ width: '15%', whiteSpace: 'nowrap' }}>Make</th>
              <th className="py-3 px-3 text-[11px] font-black text-gray-900 uppercase tracking-widest text-left" style={{ width: '15%', whiteSpace: 'nowrap' }}>Pack Size</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              if (item.row_type === 'note') {
                return (
                  <tr key={idx} className="border-b border-gray-100 bg-gray-50/50">
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
                <tr key={idx} style={{ paddingTop: '0.6px', paddingBottom: '0.6px', margin: 0, lineHeight: 1.2 }} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="text-[12px] font-medium text-gray-700 align-middle text-center" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>{idx + 1}</td>
                  <td className="text-[12px] font-medium text-gray-700 align-middle text-left" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>
                    <div className="font-normal text-gray-900 text-sm">{item.product_name || item.product}</div>
                    {desc && (
                      <div className="text-[11px] text-gray-500 mt-0.5 whitespace-pre-line leading-tight font-normal" style={{ wordBreak: 'break-word' }}>
                        {desc}
                      </div>
                    )}
                  </td>
                  <td className="text-[12px] font-bold text-gray-900 align-middle text-center" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>{qty} {unit}</td>
                  <td className="text-[12px] text-gray-700 align-middle text-left" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>{make}</td>
                  <td className="text-[12px] text-gray-700 align-middle text-left" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>{packSize}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <table className="w-full text-left mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-900">
              {visibleColumns.map(col => (
                <th 
                  key={col.id} 
                  className={`py-3 px-2 text-[11px] font-black text-gray-900 uppercase tracking-widest ${
                    ['quantity', 'price', 'amount', 'tax', 'discount'].includes(col.id) ? 'text-right' : ''
                  }`}
                  style={{ width: preferredWidths[col.id] || '10%', whiteSpace: 'nowrap' }}
                >
                  {col.id === 'serial' ? 'Sl.' : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              if (item.row_type === 'note') {
                return (
                  <tr key={idx} className="border-b border-gray-100 bg-gray-50/50">
                    <td colSpan={visibleColumns.length} className="py-1.5 px-3 text-left text-xs text-gray-700 italic font-medium">
                      Note: {item.description || item.product_description || item.product || ''}
                    </td>
                  </tr>
                );
              }
              return (
              <tr key={idx} style={{ paddingTop: '0.6px', paddingBottom: '0.6px', margin: 0, lineHeight: 1.2 }} className="border-b border-gray-100 hover:bg-gray-50/50">
                {visibleColumns.map(col => {
                  let val = '';
                  let isNumeric = false;
                  if(col.id==='serial') val = idx+1;
                  else if(col.id==='description') {
                    const desc = item.description || item.product_description || item.product_detail?.description;
                    val = (
                      <div className="py-0">
                        <div className="font-normal text-gray-900 text-sm">{item.product_name || item.product}</div>
                        {desc && (
                          <div className="text-[11px] text-gray-500 mt-0.5 whitespace-pre-line leading-tight font-normal" style={{ wordBreak: 'break-word' }}>
                            {desc}
                          </div>
                        )}
                      </div>
                    );
                  }
                  else if(col.id==='hsn') val = item.hsn_sac_code || item.hsn_code || '-';
                  else if(col.id==='quantity') { val = item.quantity; isNumeric = true; }
                  else if(col.id==='price') {
                    const p = parseFloat(item.price||0);
                    const pStr = p.toString();
                    const decCount = (pStr.split('.')[1] || '').length;
                    const decimals = Math.min(Math.max(2, decCount), 4);
                    val = `${getCurrencySymbol()}${p.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: decimals })}`;
                    isNumeric = true;
                  }
                  else if(col.id==='discount') {
                    const discNum = parseFloat(item.discount || 0);
                    val = discNum > 0 ? `${discNum}%` : '-';
                    isNumeric = true;
                  }
                  else if(col.id==='tax') { val = `${Math.round(item.tax||0)}%`; isNumeric = true; }
                  else if(col.id==='amount') { val = `${getCurrencySymbol()}${(parseFloat(item.quantity||0) * parseFloat(item.price||0)).toLocaleString('en-IN', {minimumFractionDigits:2})}`; isNumeric = true; }
                  
                  return (
                    <td 
                      key={col.id} 
                      className="align-middle font-medium text-gray-700"
                      style={{ 
                        paddingTop: '0.6px',
                        paddingBottom: '0.6px',
                        paddingLeft: '8px',
                        paddingRight: '8px',
                        margin: 0,
                        lineHeight: 1.2,
                        fontSize: '12px',
                        textAlign: col.id === 'description' ? 'left' : ['price', 'amount'].includes(col.id) ? 'right' : 'center',
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
      {!isDeliveryChallan ? (
        <div className="flex justify-between mt-auto pt-6">
          <div className="w-1/2 pr-8">
            {sections.showBankDetails && hasBankDetails && (
              <div className="mb-4 flex items-start gap-4">
                <div className="text-xs text-gray-700 leading-relaxed flex-1">
                  <p className="font-bold text-gray-900 mb-1">Bank Details:</p>
                  {bankName && <p>Bank: {bankName}</p>}
                  {bankAccount && <p>Account #: {bankAccount}</p>}
                  {bankIfsc && <p>IFSC: {bankIfsc}</p>}
                  {bankBranch && <p>Branch: {bankBranch}</p>}
                  {bankUpi && <p>UPI/VPA: {bankUpi}</p>}
                </div>
                {bankQr && (
                  <div className="flex flex-col items-center">
                    <img src={bankQr} alt="Payment QR" className="w-16 h-16 object-contain rounded border border-gray-200 p-0.5" />
                    <span className="text-[9px] text-gray-500 mt-0.5 font-medium">Scan & Pay</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="border border-gray-300 p-2 text-sm bg-gray-50 border-dashed rounded">
               <span className="font-bold">Total amount (in words): </span>
               <span className="italic font-medium">{amountInWords(finalTotal)}</span>
            </div>
          </div>

          <div className="w-[40%]">
            <table className="w-full text-sm text-right">
              <tbody>
                <tr><td className="py-1 font-semibold text-gray-700">Taxable Amount</td><td className="py-1">{getCurrencySymbol()}{subtotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
                {isIGST ? (
                  <tr><td className="py-1 font-semibold text-gray-700">IGST</td><td className="py-1">{getCurrencySymbol()}{taxTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
                ) : (
                  <>
                    <tr><td className="py-1 font-semibold text-gray-700">CGST</td><td className="py-1">{getCurrencySymbol()}{(taxTotal/2).toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
                    <tr><td className="py-1 font-semibold text-gray-700">SGST</td><td className="py-1">{getCurrencySymbol()}{(taxTotal/2).toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
                  </>
                )}
                {roundOff !== 0 && (
                  <tr>
                    <td className="py-1 font-semibold text-gray-700">Round Off</td>
                    <td className="py-1">{roundOff >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOff.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-b-2 border-gray-900 text-base">
                  <td className="py-2 font-bold text-gray-900">Total</td>
                  <td className="py-2 font-bold text-gray-900">{getCurrencySymbol()}{finalTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
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
      ) : (
        sections.showSignature && (
          <div className="flex justify-end mt-auto pt-6">
            <div className="text-right pt-2">
              <p className="text-xs text-gray-500 border-t border-gray-400 inline-block w-48 text-center pt-1">
                {content.signatureLabel || 'Received By / Signatory'}
              </p>
            </div>
          </div>
        )
      )}
      
      {/* Bottom Anchored Footer */}
      <div className={isDeliveryChallan && !sections.showSignature ? "mt-auto" : ""}>
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

ServiceTemplate.displayName = 'ServiceTemplate';
export default ServiceTemplate;
