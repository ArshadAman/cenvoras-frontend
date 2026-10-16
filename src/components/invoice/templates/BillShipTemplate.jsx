import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';
import { getTaxType } from '../../../utils/taxUtils';
import { getCurrencySymbol, getCountryCode } from '../../../utils/currency';
import { paginateInvoiceItems } from '../../../utils/invoicePaginator';

// Part 1: BillShip Header Component (Repeats on every page)
const BillShipHeader = ({
  companyName,
  companyAddress,
  businessInfo = {},
  sections = {},
  template = {},
  isDeliveryChallan,
  content = {},
  customerName,
  billingAddress,
  shippingAddress,
  invoice = {},
  invoiceNumber,
  invoiceDate,
  pageNumber,
  totalPages,
}) => {
  return (
    <div className="invoice-part-header flex-shrink-0">
      <div className="flex justify-between items-start border-b border-gray-400 pb-3 mb-3">
        <div className="flex gap-3 items-center">
          {sections.showLogo !== false && template.branding?.logo && (
            <img src={template.branding.logo} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} className="p-1 border border-gray-200 rounded-lg" />
          )}
          <div>
            <h1 className="font-extrabold text-lg mb-0.5">{companyName}</h1>
            <p className="whitespace-pre-line text-[11px] text-gray-600 mb-0.5 leading-tight">{companyAddress}</p>
            {sections.showGST !== false && businessInfo.gstin && <p className="font-bold text-[10px] uppercase text-gray-700">{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {businessInfo.gstin}</p>}
            {(businessInfo.pan_number || businessInfo.pan) && <p className="font-bold text-[10px] uppercase text-gray-700">PAN: {businessInfo.pan_number || businessInfo.pan}</p>}
            {sections.showGEMID && (businessInfo.gem_id || invoice.gem_id) && <p className="text-[10px] text-gray-700">GeM ID: {businessInfo.gem_id || invoice.gem_id}</p>}
            {(businessInfo.dl_number || invoice.dl_number) && <p className="text-[10px] text-gray-700">DL No: {businessInfo.dl_number || invoice.dl_number}</p>}
          </div>
        </div>
        <div className="text-right">
          {totalPages > 1 && (
            <span className="text-[9px] text-gray-500 font-semibold border border-gray-300 px-1.5 py-0.5 rounded bg-gray-50 inline-block mb-1">
              Page {pageNumber} of {totalPages}
            </span>
          )}
          <h2 className="text-lg font-bold tracking-widest">{isDeliveryChallan ? (content.challanTitle || 'DELIVERY CHALLAN') : (content.invoiceTitle || 'TAX INVOICE')}</h2>
          <p className="text-[10px] font-semibold text-gray-500 uppercase">Original for Recipient</p>
          <p className="text-xs font-bold mt-1.5">
            {isDeliveryChallan ? 'Challan #:' : 'Invoice #:'} {isDeliveryChallan ? (invoice.challan_number || invoiceNumber) : invoiceNumber}
          </p>
          <p className="text-xs text-gray-600">
            {isDeliveryChallan ? 'Challan Date:' : 'Invoice Date:'} {isDeliveryChallan ? (invoice.challan_date || invoiceDate) : invoiceDate}
          </p>
          {isDeliveryChallan ? (
            <>
              {(invoice.sales_order_number || invoice.po_number) && (
                <p className="text-xs text-gray-800 font-semibold">
                  Ref Order: {invoice.sales_order_number || invoice.po_number}
                </p>
              )}
              {invoice.vehicle_number && (
                <p className="text-xs font-mono font-bold text-gray-900">
                  Vehicle: {invoice.vehicle_number}
                </p>
              )}
            </>
          ) : (
            <>
              {(invoice.po_number || invoice.sales_order_number) && (
                <p className="text-xs text-gray-800 font-semibold">
                  PO / Order: {invoice.po_number || invoice.sales_order_number}
                </p>
              )}
              {invoice.due_date && <p className="text-xs font-semibold text-red-600">Due: {new Date(invoice.due_date).toLocaleDateString('en-IN')}</p>}
            </>
          )}
        </div>
      </div>

      {/* Bill To & Ship To Boxes */}
      <div className="grid grid-cols-2 gap-4 border border-gray-400 p-2.5 mb-3 bg-gray-50/50 rounded text-xs">
        <div className="border-r border-gray-300 pr-3">
          <p className="font-bold uppercase tracking-wider text-[10px] text-gray-500 mb-0.5">Bill To:</p>
          <p className="font-bold text-gray-900">{customerName}</p>
          <p className="whitespace-pre-line text-gray-600 leading-tight">{billingAddress}</p>
          {invoice.customer_gstin && <p className="font-semibold text-gray-800 mt-1">{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {invoice.customer_gstin}</p>}
        </div>
        <div className="pl-2">
          <p className="font-bold uppercase tracking-wider text-[10px] text-gray-500 mb-0.5">Ship To:</p>
          <p className="font-bold text-gray-900">{customerName}</p>
          <p className="whitespace-pre-line text-gray-600 leading-tight">{shippingAddress || billingAddress}</p>
        </div>
      </div>
    </div>
  );
};

// Part 2: BillShip Item List Component (Middle)
const BillShipItemList = ({
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
          <tr className="border-b-2 border-t-2 border-gray-900 bg-gray-50 text-[10px] uppercase font-bold text-gray-900">
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

// Part 3: BillShip Footer Component (Sticky at the bottom of the final page)
const BillShipFooter = ({
  isDeliveryChallan,
  sections = {},
  hasBankDetails,
  bankName,
  bankAccount,
  bankIfsc,
  bankBranch,
  bankUpi,
  bankQr,
  rawItems = [],
  finalTotal,
  content = {},
  subtotal,
  isIGST,
  taxTotal,
  roundOff,
  companyName,
  showWatermarkFooter,
}) => {
  return (
    <div className="invoice-part-footer mt-auto flex-shrink-0 pt-2">
      {!isDeliveryChallan && (
        <div className="flex justify-between border-t border-gray-400 pt-2 pb-1">
          <div className="w-1/2 pr-4 border-r border-gray-200">
            {sections.showBankDetails !== false && hasBankDetails && (
              <div className="mb-2">
                <p className="font-bold text-[10px] uppercase tracking-wider mb-1 text-gray-900 underline underline-offset-2 decoration-gray-300">Bank Details:</p>
                <div className="flex items-start justify-between gap-3 text-xs text-gray-700 bg-gray-50/70 p-2 rounded border border-gray-100">
                  <div className="space-y-0.5 text-[11px]">
                    {bankName && <p><span className="font-semibold inline-block w-16">Bank:</span> {bankName}</p>}
                    {bankAccount && <p><span className="font-semibold inline-block w-16">A/C #:</span> <span className="font-mono">{bankAccount}</span></p>}
                    {bankIfsc && <p><span className="font-semibold inline-block w-16">IFSC:</span> <span className="font-mono">{bankIfsc}</span></p>}
                    {bankBranch && <p><span className="font-semibold inline-block w-16">Branch:</span> {bankBranch}</p>}
                    {bankUpi && <p><span className="font-semibold inline-block w-16">UPI:</span> <span className="font-mono">{bankUpi}</span></p>}
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
              </div>
            )}
            <div className="text-[11px]">
              <p className="font-medium text-gray-600 mb-0.5">Total items: {rawItems.length}</p>
              <p className="text-xs font-medium text-gray-800">Total amount (in words): <em>INR {amountInWords(finalTotal)}</em></p>
            </div>

            {sections.showTerms !== false && (
              <div className="mt-2 text-[10px]">
                {content.footerNote && <p className="text-gray-600 mb-1">{content.footerNote}</p>}
                {content.termsAndConditions?.length > 0 && (
                  <>
                    <p className="font-bold text-gray-900 mb-0.5">Terms and Conditions:</p>
                    <ol className="text-gray-600 list-decimal pl-4 space-y-0.5">
                      {content.termsAndConditions.map((t, i) => <li key={i}>{t}</li>)}
                    </ol>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="w-1/2 pl-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1 items-center">
                <span>Taxable Amount</span>
                <span className="font-bold text-gray-900">{getCurrencySymbol()}{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {isIGST ? (
                <div className="flex justify-between text-xs font-medium text-gray-700 mb-1 items-center">
                  <span>IGST</span>
                  <span className="font-bold text-gray-900">{getCurrencySymbol()}{taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-xs font-medium text-gray-700 mb-1 items-center">
                    <span>CGST</span>
                    <span className="font-bold text-gray-900">{getCurrencySymbol()}{(taxTotal / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-gray-700 mb-1 items-center">
                    <span>SGST</span>
                    <span className="font-bold text-gray-900">{getCurrencySymbol()}{(taxTotal / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
              {roundOff !== 0 && (
                <div className="flex justify-between text-xs font-medium text-gray-700 mb-1 items-center">
                  <span>Round Off</span>
                  <span className="font-bold text-gray-900">{roundOff >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOff.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold text-gray-900 py-1.5 border-t-2 border-b-2 border-gray-800 mt-1">
                <span className="whitespace-nowrap">Grand Total</span>
                <span className="font-mono whitespace-nowrap">{getCurrencySymbol()}{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {sections.showSignature !== false && (
              <div className="text-right mt-6">
                <p className="text-[10px] font-bold text-gray-600 mb-6">For {companyName}</p>
                <div className="border-t border-gray-400 inline-block pt-0.5 text-[10px] px-3">
                  {content.signatureLabel || 'Authorized Signatory'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Anchored Footer */}
      <div>
        {isDeliveryChallan && sections.showSignature !== false && (
          <div className="flex justify-end pb-3">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-600 mb-6">For {companyName}</p>
              <div className="border-t border-gray-400 inline-block pt-0.5 text-[10px] px-3">
                {content.signatureLabel || 'Received By / Signatory'}
              </div>
            </div>
          </div>
        )}
        <div className="invoice-page-footer">
          <div className="text-center text-[9px] text-gray-400 font-medium">
            {isDeliveryChallan
              ? 'This is a computer generated delivery challan and does not require a signature.'
              : 'This is a computer generated digital invoice and does not require a signature.'}
          </div>
          
          {showWatermarkFooter && (
            <div className="mt-1 text-center text-[9px] text-gray-400 print-watermark w-full">
              Made with Cenvora: Built for Modern Businesses • <a href="https://cenvora.co.in" className="text-blue-500 font-medium" target="_blank" rel="noreferrer">https://cenvora.co.in</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Intermediate Page Continuation Marker
const BillShipContinuation = ({ pageNumber, totalPages }) => {
  return (
    <div className="invoice-part-continuation mt-auto flex-shrink-0 pt-2 pb-1 border-t border-dashed border-gray-300 flex justify-between items-center text-xs text-gray-500 font-medium">
      <span>Continued on next page...</span>
      <span>Page {pageNumber} of {totalPages}</span>
    </div>
  );
};

// Main Unified Multi-Page BillShip Template
const BillShipTemplate = forwardRef(({ 
  invoice = {}, 
  template = {}, 
  businessInfo = {}, 
  invoiceSettings = {},
  showWatermark = false,
}, ref) => {
  const { typography = {}, sections = {}, content = {} } = template;
  
  const companyName = template.branding?.useBusinessName !== false 
    ? (businessInfo.business_name || businessInfo.businessName || 'Your Business Name')
    : (template.branding?.customName || 'Your Business Name');

  const companyAddress = businessInfo.business_address || businessInfo.address || '';
  const rawItems = Array.isArray(invoice.items) ? invoice.items : [];
  const customerName = invoice.customer_name || 'Customer Name';
  const billingAddress = invoice.customer_address || invoice.customer?.address || invoice.customer_details?.address || '';
  const shippingAddress = invoice.delivery_address || invoice.shipping_address || invoice.customer?.delivery_address || invoice.customer_details?.delivery_address || '';
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

  const defaultColumns = [
    { id: 'serial', label: '#', visible: true },
    { id: 'description', label: 'Item & Details', visible: true },
    { id: 'hsn', label: 'HSN', visible: true },
    { id: 'quantity', label: 'Qty', visible: true },
    { id: 'unit', label: 'Unit', visible: true },
    { id: 'price', label: 'Rate', visible: true },
    { id: 'discount', label: 'Disc %', visible: true },
    { id: 'tax', label: 'Tax %', visible: true },
    { id: 'amount', label: 'Amount', visible: true },
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
      case 'serial': return '#';
      case 'description': return 'ITEM & DETAILS';
      case 'batch': return 'BATCH';
      case 'hsn': return 'HSN';
      case 'quantity': return 'QTY';
      case 'free_qty': return 'FREE';
      case 'unit': return 'UNIT';
      case 'make': return 'MAKE';
      case 'pack_size': return 'PACK SIZE';
      case 'price': return 'RATE';
      case 'discount': return 'DISC.%';
      case 'tax': return 'TAX';
      case 'amount': return 'AMOUNT';
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
              padding: '8mm 10mm',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              fontFamily: typography.fontFamily || 'Inter, sans-serif',
              fontSize: `${typography.bodySize || 10}px`,
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
            <BillShipHeader
              companyName={companyName}
              companyAddress={companyAddress}
              businessInfo={businessInfo}
              sections={sections}
              template={template}
              isDeliveryChallan={isDeliveryChallan}
              content={content}
              customerName={customerName}
              billingAddress={billingAddress}
              shippingAddress={shippingAddress}
              invoice={invoice}
              invoiceNumber={invoiceNumber}
              invoiceDate={invoiceDate}
              pageNumber={pageNumber}
              totalPages={totalPages}
            />

            {/* Part 2: Middle Item List */}
            <BillShipItemList
              items={pageItems}
              visibleColumns={visibleColumns}
              invoiceSettings={invoiceSettings}
              getColumnWidth={getColumnWidth}
              getColumnLabel={getColumnLabel}
              startIndex={startIndex}
            />

            {/* Part 3: Sticky Footer or Continuation */}
            {isLastPage ? (
              <BillShipFooter
                isDeliveryChallan={isDeliveryChallan}
                sections={sections}
                hasBankDetails={hasBankDetails}
                bankName={bankName}
                bankAccount={bankAccount}
                bankIfsc={bankIfsc}
                bankBranch={bankBranch}
                bankUpi={bankUpi}
                bankQr={bankQr}
                rawItems={rawItems}
                finalTotal={finalTotal}
                content={content}
                subtotal={subtotal}
                isIGST={isIGST}
                taxTotal={taxTotal}
                roundOff={roundOff}
                companyName={companyName}
                showWatermarkFooter={showWatermarkFooter}
              />
            ) : (
              <BillShipContinuation
                pageNumber={pageNumber}
                totalPages={totalPages}
              />
            )}
          </div>
        );
      })}
    </div>
  );
});

BillShipTemplate.displayName = 'BillShipTemplate';
export default BillShipTemplate;
