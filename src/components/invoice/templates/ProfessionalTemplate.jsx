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

  const getColumnWidth = (columnId) => {
    switch (columnId) {
      case 'serial': return '30px';
      case 'description': return 'auto';
      case 'hsn': return '75px';
      case 'quantity': return '55px';
      case 'price': return '95px';
      case 'discount': return '50px';
      case 'tax': return '50px';
      case 'amount': return '95px';
      default: return 'auto';
    }
  };

  const getHeaderFontSize = (columnId) => {
    return columnId === 'serial' ? '16px' : '14px';
  };

  const getHeaderLabel = (col) => {
    switch (col.id) {
      case 'serial': return 'Sl.';
      case 'description': return 'DESCRIPTION';
      case 'hsn': return 'HSNC';
      case 'quantity': return 'QTY';
      case 'price': return 'UNIT PRICE';
      case 'discount': return 'DISC.%';
      case 'tax': return 'TAX';
      case 'amount': return 'AMOUNT';
      default: return col.label?.toUpperCase() || '';
    }
  };

  return (
    <div 
      ref={ref}
      style={{
        width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box',
        backgroundColor: colors.background || '#ffffff', color: colors.text || '#333333',
        fontFamily: typography.fontFamily, fontSize: `${typography.bodySize || 10}px`,
        transform: `scale(${scale})`, transformOrigin: 'top left', border: `1px solid ${colors.tableBorder || '#e2e8f0'}`,
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
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
            {(businessInfo.pan_number || businessInfo.pan) && <p><strong>PAN:</strong> {businessInfo.pan_number || businessInfo.pan}</p>}
            {sections.showGEMID && (businessInfo.gem_id || invoice.gem_id) && <p><strong>GeM ID:</strong> {businessInfo.gem_id || invoice.gem_id}</p>}
            {(businessInfo.dl_number || invoice.dl_number) && <p><strong>DL No:</strong> {businessInfo.dl_number || invoice.dl_number}</p>}
          </div>
        </div>
        <div className="text-right w-1/2">
          <h2 className="text-2xl font-bold tracking-widest mb-4" style={{ color: '#1f2937' }}>
            {content.invoiceTitle || (isDeliveryChallan ? 'DELIVERY CHALLAN' : 'TAX INVOICE')}
          </h2>
          <div className="grid grid-cols-2 gap-3 text-left ml-auto max-w-sm border border-gray-200 p-3 bg-gray-50/50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-0.5">{isDeliveryChallan ? 'Challan No' : 'Invoice No'}</p>
              <p className="font-bold text-gray-900">{isDeliveryChallan ? (invoice.challan_number || invoiceNumber) : invoiceNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-0.5">{isDeliveryChallan ? 'Challan Date' : 'Date'}</p>
              <p className="font-bold text-gray-900">{isDeliveryChallan ? (invoice.challan_date || invoiceDate) : invoiceDate}</p>
            </div>
            {isDeliveryChallan ? (
              <>
                {(invoice.sales_order_number || invoice.po_number) && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-0.5">Ref Order / PO</p>
                    <p className="font-bold text-gray-900">{invoice.sales_order_number || invoice.po_number}</p>
                  </div>
                )}
                {invoice.vehicle_number && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-0.5">Vehicle No</p>
                    <p className="font-mono font-bold text-gray-900">{invoice.vehicle_number}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {(invoice.po_number || invoice.sales_order_number) && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-0.5">PO / Order No</p>
                    <p className="font-bold text-gray-900">{invoice.po_number || invoice.sales_order_number}</p>
                  </div>
                )}
                {(invoice.delivery_challan_number || invoice.challan_number) && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-0.5">Challan No</p>
                    <p className="font-bold text-gray-900">{invoice.delivery_challan_number || invoice.challan_number}</p>
                  </div>
                )}
              </>
            )}
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
      {isDeliveryChallan ? (
        <table className="w-full border-collapse mb-8" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="border-y-2 border-gray-900 bg-gray-50 h-10">
              <th className="py-2.5 text-xs font-bold uppercase tracking-wider text-gray-900 text-center px-2" style={{ width: '8%', whiteSpace: 'nowrap' }}>Sl.</th>
              <th className="py-2.5 text-xs font-bold uppercase tracking-wider text-gray-900 text-left px-3" style={{ width: '48%', whiteSpace: 'nowrap' }}>Item & Description</th>
              <th className="py-2.5 text-xs font-bold uppercase tracking-wider text-gray-900 text-center px-2" style={{ width: '14%', whiteSpace: 'nowrap' }}>Qty</th>
              <th className="py-2.5 text-xs font-bold uppercase tracking-wider text-gray-900 text-left px-3" style={{ width: '15%', whiteSpace: 'nowrap' }}>Make</th>
              <th className="py-2.5 text-xs font-bold uppercase tracking-wider text-gray-900 text-left px-3" style={{ width: '15%', whiteSpace: 'nowrap' }}>Pack Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, idx) => {
              if (item.row_type === 'note') {
                return (
                  <tr key={idx} className="bg-gray-50/50">
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
                <tr key={idx} style={{ paddingTop: '0.6px', paddingBottom: '0.6px', margin: 0, lineHeight: 1.2 }} className="h-auto hover:bg-gray-50 transition-colors">
                  <td className="text-xs text-gray-800 text-center px-2 align-middle" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>{idx + 1}</td>
                  <td className="text-xs text-gray-800 text-left px-3 align-middle" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>
                    <div className="font-normal text-gray-900">{item.product_name || item.product}</div>
                    {invoiceSettings.show_item_manufacturer !== false && (item.manufacturer || item.product_detail?.manufacturer) && (
                      <div className="text-[10px] text-gray-500 font-medium italic mt-0.5">
                        Mfr: {item.manufacturer || item.product_detail?.manufacturer}
                      </div>
                    )}
                    {desc && (
                      <div className="text-[10px] text-gray-500 whitespace-pre-line mt-0.5 leading-tight font-normal" style={{ wordBreak: 'break-word' }}>
                        {desc}
                      </div>
                    )}
                    {invoiceSettings.show_item_storage_condition && (item.storage_condition || item.product_detail?.storage_condition || item.product_detail?.temperature) ? (
                      <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                        {(item.storage_condition || item.product_detail?.storage_condition) ? `Storage: ${item.storage_condition || item.product_detail.storage_condition}` : ''}
                        {(item.storage_condition || item.product_detail?.storage_condition) && item.product_detail?.temperature ? ' | ' : ''}
                        {item.product_detail?.temperature ? `Temp: ${item.product_detail.temperature}` : ''}
                      </div>
                    ) : null}
                  </td>
                  <td className="text-xs text-gray-900 font-medium text-center px-2 align-middle" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>{qty} {unit}</td>
                  <td className="text-xs text-gray-700 text-left px-3 align-middle" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>{make}</td>
                  <td className="text-xs text-gray-700 text-left px-3 align-middle" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle' }}>{packSize}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <table className="w-full border-collapse mb-8" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="border-y-2 border-gray-900 bg-gray-50 h-10">
              {visibleColumns.map((col) => (
                <th 
                  key={col.id} 
                  className="py-2.5 px-1 text-center font-bold text-gray-900" 
                  style={{ 
                    width: getColumnWidth(col.id), 
                    fontSize: getHeaderFontSize(col.id),
                    whiteSpace: 'nowrap' 
                  }}
                >
                  <strong>{getHeaderLabel(col)}</strong>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, idx) => {
              if (item.row_type === 'note') {
                return (
                  <tr key={idx} className="bg-gray-50/50">
                    <td colSpan={visibleColumns.length} className="py-1 px-3 text-left text-xs text-gray-700 italic font-medium align-middle" style={{ verticalAlign: 'middle' }}>
                      Note: {item.description || item.product_description || item.product || ''}
                    </td>
                  </tr>
                );
              }
              return (
              <tr key={idx} style={{ paddingTop: '0.6px', paddingBottom: '0.6px', margin: 0, lineHeight: 1.2 }} className="h-auto hover:bg-gray-50 transition-colors">
                {visibleColumns.map(col => {
                  const isNum = ['price', 'amount'].includes(col.id);
                  const isDesc = col.id === 'description';
                  const alignClass = isDesc ? 'text-left px-3' : isNum ? 'text-right px-3 font-mono font-medium' : 'text-center px-2';
                  let val = '';
                  if(col.id==='serial') val = idx+1;
                  else if(col.id==='description') {
                    const desc = item.description || item.product_description || item.product_detail?.description;
                    val = (
                      <div className="leading-tight py-0">
                        <div className="font-normal text-gray-900">{item.product_name || item.product}</div>
                        {invoiceSettings.show_item_manufacturer !== false && (item.manufacturer || item.product_detail?.manufacturer) && (
                          <div className="text-[10px] text-gray-500 font-medium italic mt-0.5">
                            Mfr: {item.manufacturer || item.product_detail?.manufacturer}
                          </div>
                        )}
                        {desc && (
                          <div className="text-[10px] text-gray-500 whitespace-pre-line mt-0.5 leading-tight font-normal" style={{ wordBreak: 'break-word' }}>
                            {desc}
                          </div>
                        )}
                        {invoiceSettings.show_item_storage_condition && (item.storage_condition || item.product_detail?.storage_condition || item.product_detail?.temperature) ? (
                          <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                            {(item.storage_condition || item.product_detail?.storage_condition) ? `Storage: ${item.storage_condition || item.product_detail.storage_condition}` : ''}
                            {(item.storage_condition || item.product_detail?.storage_condition) && item.product_detail?.temperature ? ' | ' : ''}
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
                      className="align-middle" 
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

      {/* Totals & Details (Hidden for Delivery Challans) */}
      {!isDeliveryChallan && (
        <div className="flex justify-between">
          <div className="w-1/2 pr-8">
            {sections.showBankDetails && hasBankDetails && (
               <div className="mb-6">
                  <p className="font-bold text-xs uppercase tracking-wider mb-2 text-gray-500">Bank & Payment Details</p>
                  <div className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      {bankName && <p><span className="font-semibold w-16 inline-block">Bank:</span> {bankName}</p>}
                      {bankAccount && <p><span className="font-semibold w-16 inline-block">A/C No:</span> <span className="font-mono">{bankAccount}</span></p>}
                      {bankIfsc && <p><span className="font-semibold w-16 inline-block">IFSC:</span> <span className="font-mono">{bankIfsc}</span></p>}
                      {bankBranch && <p><span className="font-semibold w-16 inline-block">Branch:</span> {bankBranch}</p>}
                      {bankUpi && <p><span className="font-semibold w-16 inline-block">UPI:</span> <span className="font-mono">{bankUpi}</span></p>}
                    </div>
                    {sections.showQRCode !== false && bankQr && (
                      <div className="text-center flex-shrink-0">
                        <img 
                          src={bankQr} 
                          alt="Payment QR" 
                          className="w-16 h-16 object-contain rounded border border-gray-200 p-0.5 bg-white shadow-sm"
                        />
                        <span className="text-[9px] text-gray-500 block mt-0.5">Scan to Pay</span>
                      </div>
                    )}
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
              <div className="flex justify-between px-3 py-1.5 border-b border-gray-100 text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-bold">{getCurrencySymbol()}{subtotal.toFixed(2)}</span>
              </div>
              {isIGST ? (
                <div className="flex justify-between px-3 py-1.5 border-b border-gray-100 text-sm">
                  <span className="text-gray-600">IGST</span>
                  <span className="font-bold">{getCurrencySymbol()}{taxTotal.toFixed(2)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between px-3 py-1.5 border-b border-gray-100 text-sm">
                    <span className="text-gray-600">CGST</span>
                    <span className="font-bold">{getCurrencySymbol()}{(taxTotal / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between px-3 py-1.5 border-b border-gray-100 text-sm">
                    <span className="text-gray-600">SGST</span>
                    <span className="font-bold">{getCurrencySymbol()}{(taxTotal / 2).toFixed(2)}</span>
                  </div>
                </>
              )}
              {roundOff !== 0 && (
                <div className="flex justify-between px-3 py-1.5 border-b border-gray-100 text-sm">
                  <span className="text-gray-600">Round Off</span>
                  <span className="font-bold text-gray-700">
                    {roundOff >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOff.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between px-3 py-2 bg-gray-50 text-sm">
                <span className="font-bold text-gray-900 whitespace-nowrap">Total</span>
                <span className="font-bold font-mono text-indigo-600 whitespace-nowrap">{getCurrencySymbol()}{finalTotal.toFixed(2)}</span>
              </div>
            </div>
            {sections.showAmountInWords && (
              <p className="text-sm font-medium text-right mt-2 text-gray-700 italic">
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
      )}
      
      {/* Bottom Anchored Footer */}
      <div className="mt-auto">
        {isDeliveryChallan && sections.showSignature && (
          <div className="flex justify-end pt-8">
            <div className="border-t border-gray-400 inline-block pt-2 w-48 text-center text-xs font-semibold text-gray-500">
              {content.signatureLabel || 'Received By / Signatory'}
            </div>
          </div>
        )}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-500">
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

ProfessionalTemplate.displayName = 'ProfessionalTemplate';
export default ProfessionalTemplate;
