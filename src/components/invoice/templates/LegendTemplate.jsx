import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';
import { getTaxType } from '../../../utils/taxUtils';
import { getCurrencySymbol, getCountryCode } from '../../../utils/currency';
import { paginateInvoiceItems } from '../../../utils/invoicePaginator';

// Part 1: Legend Header Component (Repeated on every page)
const LegendHeader = ({
  companyName,
  companyAddress,
  businessInfo = {},
  sections = {},
  template = {},
  colors = {},
  borderColor,
  isDeliveryChallan,
  content = {},
  customerName,
  billingAddress,
  invoice = {},
  invoiceNumber,
  invoiceDate,
  pageNumber,
  totalPages,
}) => {
  return (
    <div className="invoice-part-header flex-shrink-0">
      <div className="flex border-b" style={{ borderColor }}>
        <div className="p-3 w-2/3 flex gap-3 items-center border-r" style={{ borderColor }}>
          {sections.showLogo !== false && template.branding?.logo && (
            <img src={template.branding.logo} alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
          )}
          <div className="text-xs">
            <h1 className="font-bold text-base mb-0.5" style={{ color: colors.primary || '#000000' }}>{companyName}</h1>
            <p className="whitespace-pre-line leading-tight text-gray-700">{companyAddress}</p>
            {sections.showGST !== false && <p className="font-bold mt-0.5">{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {businessInfo.gstin || '-'}</p>}
            {(businessInfo.pan_number || businessInfo.pan) && <p className="font-bold">PAN: {businessInfo.pan_number || businessInfo.pan}</p>}
            {sections.showGEMID && (businessInfo.gem_id || invoice.gem_id) && <p className="text-[10px]">GeM ID: {businessInfo.gem_id || invoice.gem_id}</p>}
            {(businessInfo.dl_number || invoice.dl_number) && <p className="text-[10px]">DL No: {businessInfo.dl_number || invoice.dl_number}</p>}
          </div>
        </div>
        <div className="p-3 w-1/3 text-right flex flex-col justify-between">
          <div>
            {totalPages > 1 && (
              <span className="text-[9px] text-gray-500 font-semibold border border-gray-300 px-1.5 py-0.5 rounded bg-gray-50 inline-block mb-1">
                Page {pageNumber} of {totalPages}
              </span>
            )}
            <h2 className="text-lg font-bold tracking-widest">{isDeliveryChallan ? (content.challanTitle || 'DELIVERY CHALLAN') : (content.invoiceTitle || 'TAX INVOICE')}</h2>
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Original for Recipient</p>
          </div>
        </div>
      </div>

      {/* Info Blocks Grid */}
      <div className="flex border-b" style={{ borderColor }}>
        <div className="w-1/2 p-2.5 border-r" style={{ borderColor }}>
          <p className="font-bold text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Customer Details:</p>
          <p className="font-semibold text-gray-900 text-xs">{customerName}</p>
          {invoice.customer_gstin && <p className="font-medium text-[11px] mt-0.5">{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {invoice.customer_gstin}</p>}
          <p className="whitespace-pre-line mt-0.5 text-xs text-gray-600 leading-tight">{billingAddress}</p>
        </div>
        <div className="w-1/2 flex flex-col justify-between text-xs">
          <div className="flex border-b flex-1" style={{ borderColor }}>
            <div className="w-1/2 p-2 border-r flex flex-col justify-center" style={{ borderColor }}>
              <p className="font-bold text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">{isDeliveryChallan ? 'Challan #' : 'Invoice #'}</p>
              <p className="font-semibold text-gray-900">{isDeliveryChallan ? (invoice.challan_number || invoiceNumber) : invoiceNumber}</p>
            </div>
            <div className="w-1/2 p-2 flex flex-col justify-center">
              <p className="font-bold text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">{isDeliveryChallan ? 'Challan Date' : 'Date'}</p>
              <p className="font-semibold text-gray-900">{isDeliveryChallan ? (invoice.challan_date || invoiceDate) : invoiceDate}</p>
            </div>
          </div>
          <div className="flex flex-1">
            {isDeliveryChallan ? (
              <>
                <div className="w-1/2 p-2 border-r flex flex-col justify-center" style={{ borderColor }}>
                  <p className="font-bold text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Ref Order</p>
                  <p className="font-semibold text-gray-900">{invoice.sales_order_number || invoice.po_number || '—'}</p>
                </div>
                <div className="w-1/2 p-2 flex flex-col justify-center">
                  <p className="font-bold text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Vehicle No.</p>
                  <p className="font-mono font-semibold text-gray-900">{invoice.vehicle_number || '—'}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-1/2 p-2 border-r flex flex-col justify-center" style={{ borderColor }}>
                  <p className="font-bold text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Ref Order / PO</p>
                  <p className="font-semibold text-gray-900">{invoice.po_number || invoice.sales_order_number || '—'}</p>
                </div>
                <div className="w-1/2 p-2 flex flex-col justify-center">
                  <p className="font-bold text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Due Date</p>
                  <p className="font-semibold text-gray-900">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : '—'}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Part 2: Legend Item List Component (Middle)
const LegendItemList = ({
  items = [],
  visibleColumns = [],
  invoiceSettings = {},
  getColumnWidth,
  getColumnLabel,
  startIndex = 0,
}) => {
  return (
    <div className="invoice-part-items flex-1">
      <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
        <thead style={{ display: 'table-header-group' }}>
          <tr className="border-b bg-gray-50 text-[10px] uppercase text-gray-600 font-bold border-gray-300">
            {visibleColumns.map((col, idx) => (
              <th 
                key={col.id} 
                className={`py-1.5 px-1 ${idx !== visibleColumns.length - 1 ? 'border-r border-gray-200' : ''}`} 
                style={{ 
                  width: getColumnWidth(col.id),
                  textAlign: col.id === 'description' ? 'left' : ['price', 'discount', 'tax', 'amount', 'quantity', 'free_qty'].includes(col.id) ? 'right' : 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {getColumnLabel(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-xs">
          {items.map((item, index) => {
            const actualSerial = startIndex + index + 1;
            if (item.row_type === 'note') {
              return (
                <tr key={index} className="bg-gray-50/50" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <td colSpan={visibleColumns.length} className="py-1 px-3 text-xs italic text-gray-500">
                    Note: {item.description || item.product_description || item.product || ''}
                  </td>
                </tr>
              );
            }

            return (
              <tr key={index} className="hover:bg-gray-50/50" style={{ breakInside: 'avoid', pageBreakInside: 'avoid', lineHeight: 1.2 }}>
                {visibleColumns.map((col, idx) => {
                  let val = '';
                  const isLast = idx === visibleColumns.length - 1;
                  let isDesc = col.id === 'description';
                  let isNum = ['price', 'discount', 'tax', 'amount', 'quantity', 'free_qty'].includes(col.id);

                  if (col.id === 'serial') val = actualSerial;
                  else if (col.id === 'description') {
                    const desc = item.description || item.product_description || item.product_detail?.description || '';
                    val = (
                      <div>
                        <div className="font-semibold text-gray-900 leading-tight">{item.product_name || item.product || ''}</div>
                        {invoiceSettings.show_item_manufacturer !== false && (item.manufacturer || item.product_detail?.manufacturer) && (
                          <div className="text-[9px] text-gray-500 font-medium italic mt-0.5">
                            Mfr: {item.manufacturer || item.product_detail?.manufacturer}
                          </div>
                        )}
                        {desc && (
                          <div className="text-[9px] text-gray-500 whitespace-pre-line mt-0.5 leading-tight font-normal" style={{ wordBreak: 'break-word' }}>
                            {desc}
                          </div>
                        )}
                        {invoiceSettings.show_item_storage_condition && (item.storage_condition || item.product_detail?.storage_condition || item.product_detail?.temperature) ? (
                          <div className="text-[9px] text-gray-500 mt-0.5 font-medium">
                            {(item.storage_condition || item.product_detail?.storage_condition) ? `Storage: ${item.storage_condition || item.product_detail.storage_condition}` : ''}
                            {(item.storage_condition || item.product_detail?.storage_condition) && item.product_detail?.temperature ? ' | ' : ''}
                            {item.product_detail?.temperature ? `Temp: ${item.product_detail.temperature}` : ''}
                          </div>
                        ) : null}
                      </div>
                    );
                  }
                  else if (col.id === 'quantity') val = item.quantity;
                  else if (col.id === 'batch') val = item.batch_number || item.batch?.batch_number || item.batch || '-';
                  else if (col.id === 'unit') val = item.unit || 'pcs';
                  else if (col.id === 'free_qty') val = item.free_quantity || 0;
                  else if (col.id === 'make') val = item.make || item.product_detail?.make || item.brand || item.product_detail?.brand || '-';
                  else if (col.id === 'pack_size') val = item.pack_size || item.product_detail?.pack_size || item.packing || item.product_detail?.packing || item.unit || '-';
                  else if (col.id === 'price') {
                    const p = parseFloat(item.price || 0);
                    const pStr = p.toString();
                    const decCount = (pStr.split('.')[1] || '').length;
                    const decimals = Math.min(Math.max(2, decCount), 4);
                    val = p.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: decimals });
                  }
                  else if (col.id === 'discount') {
                    const discNum = parseFloat(item.discount || 0);
                    val = discNum > 0 ? `${discNum}%` : '-';
                  }
                  else if (col.id === 'tax') val = `${Math.round(item.tax || 0)}%`;
                  else if (col.id === 'amount') val = (item.quantity * item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                  else if (col.id === 'hsn') val = item.hsn_sac_code || '-';

                  return (
                    <td 
                      key={col.id} 
                      className={`align-middle ${!isLast ? 'border-r border-gray-200' : ''}`} 
                      style={{ 
                        paddingTop: '3px',
                        paddingBottom: '3px',
                        paddingLeft: '6px', 
                        paddingRight: '6px',
                        fontSize: '11px', 
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
    </div>
  );
};

// Part 3: Legend Footer Component (Sticky at the bottom of the final page)
const LegendFooter = ({
  isDeliveryChallan,
  borderColor,
  finalTotal,
  sections = {},
  hasBankDetails,
  bankName,
  bankAccount,
  bankIfsc,
  bankBranch,
  bankUpi,
  bankQr,
  content = {},
  subtotal,
  isIGST,
  taxTotal,
  roundOff,
  companyName,
  showWatermarkFooter,
}) => {
  return (
    <div className="invoice-part-footer mt-auto flex-shrink-0 border-t" style={{ borderColor }}>
      {!isDeliveryChallan ? (
        <div className="flex">
          <div className="w-3/5 p-2.5 border-r flex flex-col justify-between" style={{ borderColor }}>
            <div>
              <p className="italic mb-1.5 text-xs font-medium text-gray-800">Total amount (in words): <strong>INR {amountInWords(finalTotal)}</strong></p>
              {sections.showBankDetails !== false && hasBankDetails && (
                <div className="flex items-start justify-between gap-3 bg-gray-50/60 p-2 rounded border border-gray-100 text-[11px]">
                  <div>
                    <h4 className="font-bold border-b border-gray-300 inline-block mb-0.5 text-[10px]">Bank Details:</h4>
                    <table>
                      <tbody>
                        {bankName && <tr><td className="pr-3 py-0.5 text-gray-600">Bank:</td><td className="font-semibold">{bankName}</td></tr>}
                        {bankAccount && <tr><td className="pr-3 py-0.5 text-gray-600">Account #:</td><td className="font-semibold font-mono">{bankAccount}</td></tr>}
                        {bankIfsc && <tr><td className="pr-3 py-0.5 text-gray-600">IFSC:</td><td className="font-semibold font-mono">{bankIfsc}</td></tr>}
                        {bankBranch && <tr><td className="pr-3 py-0.5 text-gray-600">Branch:</td><td className="font-semibold">{bankBranch}</td></tr>}
                        {bankUpi && <tr><td className="pr-3 py-0.5 text-gray-600">UPI / VPA:</td><td className="font-semibold font-mono">{bankUpi}</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  {sections.showQRCode !== false && bankQr && (
                    <div className="text-center flex-shrink-0">
                      <img 
                        src={bankQr} 
                        alt="Scan & Pay" 
                        className="w-14 h-14 object-contain rounded border border-gray-200 p-0.5 bg-white shadow-sm"
                      />
                      <span className="text-[8px] text-gray-500 block mt-0.5">Scan to Pay</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {sections.showTerms !== false && (
              <div className="mt-2 text-[10px]">
                {content.footerNote && <p className="mb-1 text-gray-600">{content.footerNote}</p>}
                {content.termsAndConditions?.length > 0 && (
                  <>
                    <p className="font-bold border-b border-gray-300 inline-block mb-0.5">Terms & Conditions:</p>
                    <ul className="list-decimal pl-4 space-y-0.5 text-gray-600">
                      {content.termsAndConditions.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Totals Block */}
          <div className="w-2/5 flex flex-col justify-between">
            <div className="p-2.5 text-xs space-y-1">
              <div className="flex justify-between items-center py-0.5">
                <span className="font-semibold text-gray-700 whitespace-nowrap">Taxable Amount</span>
                <span className="font-mono text-gray-900 whitespace-nowrap">{getCurrencySymbol()}{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {isIGST ? (
                <div className="flex justify-between items-center py-0.5">
                  <span className="font-semibold text-gray-700 whitespace-nowrap">IGST</span>
                  <span className="font-mono text-gray-900 whitespace-nowrap">{getCurrencySymbol()}{taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="font-semibold text-gray-700 whitespace-nowrap">CGST</span>
                    <span className="font-mono text-gray-900 whitespace-nowrap">{getCurrencySymbol()}{(taxTotal / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="font-semibold text-gray-700 whitespace-nowrap">SGST</span>
                    <span className="font-mono text-gray-900 whitespace-nowrap">{getCurrencySymbol()}{(taxTotal / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
              {roundOff !== 0 && (
                <div className="flex justify-between items-center py-0.5">
                  <span className="font-semibold text-gray-700 whitespace-nowrap">Round Off</span>
                  <span className="font-mono text-gray-900 whitespace-nowrap">{roundOff >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOff.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center px-2 py-1.5 border-t border-b bg-gray-100 font-bold mt-1" style={{ borderColor }}>
                <span className="text-[11px] uppercase tracking-wider text-gray-900 whitespace-nowrap">Total Amount</span>
                <span className="text-xs font-mono text-gray-900 whitespace-nowrap">{getCurrencySymbol()}{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            {sections.showSignature !== false && (
              <div className="p-2.5 text-right text-xs">
                <p className="font-bold mb-6 text-[10px]">For {companyName}</p>
                <p className="border-t border-gray-400 inline-block pt-0.5 text-[10px]">{content.signatureLabel || 'Authorized Signatory'}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex justify-between p-3">
          <div className="w-1/2">
            {sections.showTerms !== false && content.termsAndConditions?.length > 0 && (
              <div>
                <p className="font-bold border-b border-gray-300 inline-block mb-1 text-xs">Terms & Conditions:</p>
                <ul className="list-decimal pl-4 space-y-0.5 text-xs text-gray-600">
                  {content.termsAndConditions.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
          </div>
          {sections.showSignature !== false && (
            <div className="w-1/2 flex flex-col justify-end text-right text-xs p-2">
              <p className="font-bold mb-6 text-[10px]">For {companyName}</p>
              <p className="border-t border-gray-400 inline-block pt-0.5 text-[10px]">{content.signatureLabel || 'Received By / Signatory'}</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom Anchored Notice */}
      <div className="invoice-page-footer p-1">
        <div className="text-center text-[9px] text-gray-400 font-medium w-full">
          {isDeliveryChallan
            ? 'This is a computer generated delivery challan and does not require a signature.'
            : 'This is a computer generated digital invoice and does not require a signature.'}
        </div>
        
        {showWatermarkFooter && (
          <div className="text-center text-[9px] text-gray-400 print-watermark w-full">
            Made with Cenvora: Built for Modern Businesses • <a href="https://cenvora.co.in" className="text-blue-500 font-medium" target="_blank" rel="noreferrer">https://cenvora.co.in</a>
          </div>
        )}
      </div>
    </div>
  );
};

// Intermediate Page Continuation Marker
const LegendContinuation = ({ pageNumber, totalPages, borderColor }) => {
  return (
    <div className="invoice-part-continuation mt-auto flex-shrink-0 p-2 border-t flex justify-between items-center text-xs text-gray-500 font-medium" style={{ borderColor }}>
      <span>Continued on next page...</span>
      <span>Page {pageNumber} of {totalPages}</span>
    </div>
  );
};

// Main Unified Multi-Page Legend Template
const LegendTemplate = forwardRef(({ 
  invoice = {}, 
  template = {}, 
  businessInfo = {}, 
  invoiceSettings = {},
  showWatermark = false,
}, ref) => {
  const { colors = {}, typography = {}, sections = {}, content = {} } = template;
  
  const companyName = template.branding?.useBusinessName !== false 
    ? (businessInfo.business_name || businessInfo.businessName || 'Your Business Name')
    : (template.branding?.customName || 'Your Business Name');

  const companyAddress = businessInfo.business_address || businessInfo.address || '';
  const rawItems = Array.isArray(invoice.items) ? invoice.items : [];
  const customerName = invoice.customer_name || 'Customer Name';
  const billingAddress = invoice.customer_address || invoice.customer?.address || invoice.customer_details?.address || '';
  const invoiceNumber = invoice.invoice_number || 'INV-0001';
  const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const roundOff = parseFloat(invoice.round_off || 0) || 0;

  const isDeliveryChallan = Boolean(
    invoice.is_delivery_challan || 
    invoice.challan_number || 
    invoice.document_type === 'delivery_challan'
  );

  const bankName = businessInfo.bank_name || content.bankDetails?.bankName || '';
  const bankAccount = businessInfo.bank_account_number || content.bankDetails?.accountNumber || '';
  const bankIfsc = businessInfo.bank_ifsc_code || content.bankDetails?.ifscCode || '';
  const bankBranch = businessInfo.bank_branch || content.bankDetails?.branch || '';
  const bankUpi = businessInfo.bank_upi_id || '';
  const bankQr = businessInfo.bank_qr_code || '';
  const hasBankDetails = Boolean(bankName || bankAccount || bankIfsc || bankUpi || bankQr);

  const taxType = getTaxType(invoice, businessInfo);
  const isIGST = taxType === 'igst';

  const subtotal = rawItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity || 0);
    const price = parseFloat(item.price || 0);
    const discount = parseFloat(item.discount || 0);
    const lineBase = qty * price;
    return sum + (lineBase - (lineBase * discount) / 100);
  }, 0);

  const taxTotal = rawItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity || 0);
    const price = parseFloat(item.price || 0);
    const discount = parseFloat(item.discount || 0);
    const tax = parseFloat(item.tax || 0);
    const lineBase = qty * price;
    const taxable = lineBase - (lineBase * discount) / 100;
    return sum + ((taxable * tax) / 100);
  }, 0);

  const grandTotal = subtotal + taxTotal;
  const finalTotal = invoice.total_amount != null
    ? parseFloat(invoice.total_amount)
    : Number((grandTotal + roundOff).toFixed(2));

  const planCode = businessInfo.plan_code || 'free';
  const showWatermarkFooter = businessInfo.show_cenvora_footer !== undefined
    ? Boolean(businessInfo.show_cenvora_footer)
    : planCode !== 'business';

  const borderColor = '#374151';

  const defaultColumns = [
    { id: 'serial', label: 'Sr', visible: true },
    { id: 'description', label: 'Item Description', visible: true },
    { id: 'hsn', label: 'HSN/SAC', visible: true },
    { id: 'quantity', label: 'Qty', visible: true },
    { id: 'unit', label: 'Unit', visible: true },
    { id: 'price', label: 'Rate (₹)', visible: true },
    { id: 'discount', label: 'Disc %', visible: true },
    { id: 'tax', label: 'Tax %', visible: true },
    { id: 'amount', label: 'Amount (₹)', visible: true },
  ];

  const visibleColumns = (template.columns?.length > 0 ? template.columns : defaultColumns).filter(c => {
    if (isDeliveryChallan && ['price', 'discount', 'tax', 'amount'].includes(c.id)) return false;
    return c.visible !== false;
  });

  const getColumnWidth = (colId) => {
    switch (colId) {
      case 'serial': return '5%';
      case 'hsn': return '10%';
      case 'quantity': return '8%';
      case 'free_qty': return '7%';
      case 'unit': return '6%';
      case 'make': return '9%';
      case 'pack_size': return '8%';
      case 'price': return '12%';
      case 'discount': return '7%';
      case 'tax': return '7%';
      case 'amount': return '13%';
      case 'description': return 'auto';
      default: return 'auto';
    }
  };

  const getColumnLabel = (col) => {
    switch (col.id) {
      case 'serial': return 'SR';
      case 'description': return 'ITEM DESCRIPTION';
      case 'batch': return 'BATCH';
      case 'hsn': return 'HSN/SAC';
      case 'quantity': return 'QTY';
      case 'free_qty': return 'FREE';
      case 'unit': return 'UNIT';
      case 'make': return 'MAKE';
      case 'pack_size': return 'PACK SIZE';
      case 'price': return 'RATE (₹)';
      case 'discount': return 'DISC %';
      case 'tax': return 'TAX %';
      case 'amount': return 'AMOUNT (₹)';
      default: return col.label?.toUpperCase() || '';
    }
  };

  // Divide items into discrete A4 pages
  const pages = paginateInvoiceItems(rawItems, { isDeliveryChallan });
  const totalPages = pages.length;

  return (
    <div ref={ref} className="invoice-container flex flex-col items-center gap-8 print:gap-0 print:block">
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === totalPages - 1;
        const pageNumber = pageIdx + 1;
        const startIndex = pages.slice(0, pageIdx).reduce((acc, p) => acc + p.length, 0);

        return (
          <div 
            key={pageIdx}
            className="bg-white invoice-sheet shadow-2xl print:shadow-none"
            style={{
              width: '210mm',
              height: '297mm',
              minHeight: '297mm',
              maxHeight: '297mm',
              margin: '0 auto',
              padding: '6mm 6mm',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              fontFamily: typography.fontFamily || 'Inter, sans-serif',
              fontSize: `${typography.bodySize || 10}px`,
              border: `2px solid ${borderColor}`,
              pageBreakAfter: isLastPage ? 'auto' : 'always',
              breakAfter: isLastPage ? 'auto' : 'page',
              overflow: 'hidden',
            }}
          >
            {/* Watermark */}
            {showWatermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <span className="text-8xl font-bold text-gray-500 rotate-[-30deg]">PREVIEW</span>
              </div>
            )}

            {/* Part 1: Header (Repeated on every page) */}
            <LegendHeader
              companyName={companyName}
              companyAddress={companyAddress}
              businessInfo={businessInfo}
              sections={sections}
              template={template}
              colors={colors}
              borderColor={borderColor}
              isDeliveryChallan={isDeliveryChallan}
              content={content}
              customerName={customerName}
              billingAddress={billingAddress}
              invoice={invoice}
              invoiceNumber={invoiceNumber}
              invoiceDate={invoiceDate}
              pageNumber={pageNumber}
              totalPages={totalPages}
            />

            {/* Part 2: Middle Item List */}
            <LegendItemList
              items={pageItems}
              visibleColumns={visibleColumns}
              invoiceSettings={invoiceSettings}
              getColumnWidth={getColumnWidth}
              getColumnLabel={getColumnLabel}
              startIndex={startIndex}
            />

            {/* Part 3: Sticky Footer or Continuation */}
            {isLastPage ? (
              <LegendFooter
                isDeliveryChallan={isDeliveryChallan}
                borderColor={borderColor}
                finalTotal={finalTotal}
                sections={sections}
                hasBankDetails={hasBankDetails}
                bankName={bankName}
                bankAccount={bankAccount}
                bankIfsc={bankIfsc}
                bankBranch={bankBranch}
                bankUpi={bankUpi}
                bankQr={bankQr}
                content={content}
                subtotal={subtotal}
                isIGST={isIGST}
                taxTotal={taxTotal}
                roundOff={roundOff}
                companyName={companyName}
                showWatermarkFooter={showWatermarkFooter}
              />
            ) : (
              <LegendContinuation
                pageNumber={pageNumber}
                totalPages={totalPages}
                borderColor={borderColor}
              />
            )}
          </div>
        );
      })}
    </div>
  );
});

LegendTemplate.displayName = 'LegendTemplate';
export default LegendTemplate;
