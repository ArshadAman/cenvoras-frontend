import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';
import { getTaxType } from '../../../utils/taxUtils';
import { getCurrencySymbol, getCountryCode } from '../../../utils/currency';
import { paginateInvoiceItems, getVisibleColumns, calculateColumnWidths } from '../../../utils/invoicePaginator';

// Part 1: Professional Header Component (Repeated on every page)
const ProfessionalHeader = ({
  companyName,
  companyAddress,
  companyGST,
  businessInfo = {},
  sections = {},
  template = {},
  colors = {},
  isDeliveryChallan,
  content = {},
  invoice = {},
  invoiceNumber,
  invoiceDate,
  customerName,
  billingAddress,
  shippingAddress,
  customerGST,
  pageNumber,
  totalPages,
}) => {
  return (
    <div className="invoice-part-header flex-shrink-0">
      <div className="flex justify-between items-start mb-4">
        <div className="w-1/2">
          {sections.showLogo !== false && template.branding?.logo && (
            <img src={template.branding.logo} alt="Logo" style={{ maxHeight: 50 }} className="mb-2" />
          )}
          <h1 className="font-bold text-lg mb-0.5" style={{ color: colors.primary || '#1e3a8a' }}>{companyName}</h1>
          <div className="text-gray-600 space-y-0.5 text-xs leading-tight">
            <p className="whitespace-pre-line">{companyAddress}</p>
            {sections.showGST !== false && companyGST && <p><strong>{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'}</strong> {companyGST}</p>}
            {(businessInfo.pan_number || businessInfo.pan) && <p><strong>PAN:</strong> {businessInfo.pan_number || businessInfo.pan}</p>}
            {sections.showGEMID && (businessInfo.gem_id || invoice.gem_id) && <p><strong>GeM ID:</strong> {businessInfo.gem_id || invoice.gem_id}</p>}
            {(businessInfo.dl_number || invoice.dl_number) && <p><strong>DL No:</strong> {businessInfo.dl_number || invoice.dl_number}</p>}
          </div>
        </div>
        <div className="text-right w-1/2">
          <div className="flex justify-end items-center gap-2 mb-2">
            <h2 className="text-xl font-bold tracking-widest text-gray-900">
              {isDeliveryChallan ? (content.challanTitle || 'DELIVERY CHALLAN') : (content.invoiceTitle || 'TAX INVOICE')}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left ml-auto max-w-sm border border-gray-200 p-2.5 bg-gray-50/50 rounded-lg text-xs">
            <div>
              <p className="text-[10px] text-gray-500 font-semibold mb-0.5">{isDeliveryChallan ? 'Challan No' : 'Invoice No'}</p>
              <p className="font-bold text-gray-900">{isDeliveryChallan ? (invoice.challan_number || invoiceNumber) : invoiceNumber}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold mb-0.5">{isDeliveryChallan ? 'Challan Date' : 'Date'}</p>
              <p className="font-bold text-gray-900">{isDeliveryChallan ? (invoice.challan_date || invoiceDate) : invoiceDate}</p>
            </div>
            {isDeliveryChallan ? (
              <>
                {(invoice.sales_order_number || invoice.po_number) && (
                  <div>
                    <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Ref Order / PO</p>
                    <p className="font-bold text-gray-900">{invoice.sales_order_number || invoice.po_number}</p>
                  </div>
                )}
                {invoice.vehicle_number && (
                  <div>
                    <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Vehicle No</p>
                    <p className="font-mono font-bold text-gray-900">{invoice.vehicle_number}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {(invoice.po_number || invoice.sales_order_number) && (
                  <div>
                    <p className="text-[10px] text-gray-500 font-semibold mb-0.5">PO / Order No</p>
                    <p className="font-bold text-gray-900">{invoice.po_number || invoice.sales_order_number}</p>
                  </div>
                )}
                {(invoice.delivery_challan_number || invoice.challan_number) && (
                  <div>
                    <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Challan No</p>
                    <p className="font-bold text-gray-900">{invoice.delivery_challan_number || invoice.challan_number}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bill To & Ship To */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-xs">
        <div className="col-span-1 border border-gray-200 p-2.5 rounded-lg bg-white">
          <h3 className="font-bold border-b pb-1 mb-1 text-[11px]" style={{ borderColor: colors.primary || '#1e3a8a' }}>Bill To</h3>
          <p className="font-bold text-gray-900">{customerName}</p>
          <p className="whitespace-pre-line text-gray-600 leading-tight">{billingAddress}</p>
          {customerGST && (
            <p className="text-gray-600 mt-1 font-medium">
              <strong>{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'}</strong> {customerGST}
            </p>
          )}
        </div>
        {(shippingAddress && shippingAddress !== billingAddress) && (
          <div className="col-span-1 border border-gray-200 p-2.5 rounded-lg bg-white">
            <h3 className="font-bold border-b pb-1 mb-1 text-[11px]" style={{ borderColor: colors.primary || '#1e3a8a' }}>Ship To</h3>
            <p className="font-bold text-gray-900">{customerName}</p>
            <p className="whitespace-pre-line text-gray-600 leading-tight">{shippingAddress}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Part 2: Professional Item List Component (Middle)
const ProfessionalItemList = ({
  items = [],
  visibleColumns = [],
  invoiceSettings = {},
  columnWidths = {},
  getHeaderFontSize,
  getColumnLabel,
  startIndex = 0,
}) => {
  return (
    <div className="invoice-part-items flex-1">
      <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          {visibleColumns.map((col) => (
            <col key={col.id} style={{ width: columnWidths[col.id] || 'auto' }} />
          ))}
        </colgroup>
        <thead style={{ display: 'table-header-group' }}>
          <tr className="border-y-2 border-gray-900 bg-gray-50 h-8">
            {visibleColumns.map((col) => (
              <th 
                key={col.id} 
                className="py-1.5 px-1 font-bold text-gray-900" 
                style={{ 
                  width: columnWidths[col.id] || 'auto', 
                  fontSize: getHeaderFontSize(col.id),
                  textAlign: col.id === 'description' ? 'left' : ['price', 'discount', 'tax', 'amount'].includes(col.id) ? 'right' : 'center',
                  whiteSpace: 'nowrap' 
                }}
              >
                {getColumnLabel(col)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {items.map((item, index) => {
            const actualSerial = startIndex + index + 1;
            if (item.row_type === 'note') {
              return (
                <tr key={index} className="border-b border-gray-200" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <td colSpan={visibleColumns.length} className="py-1.5 px-3 text-xs italic text-gray-600">
                    Note: {item.description || item.product_description || item.product || ''}
                  </td>
                </tr>
              );
            }

            return (
              <tr 
                key={index} 
                className="border-b border-gray-100 hover:bg-gray-50/50"
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid', lineHeight: 1.2 }}
              >
                {visibleColumns.map(col => {
                  let val = '';
                  let isDesc = col.id === 'description';
                  let isNum = ['price', 'discount', 'tax', 'amount', 'quantity', 'free_qty'].includes(col.id);

                  if (col.id === 'serial') val = actualSerial;
                  else if (col.id === 'description') {
                    const desc = item.description || item.product_description || item.product_detail?.description || '';
                    val = (
                      <div>
                        <div className="font-semibold text-gray-900">{item.product_name || item.product || ''}</div>
                        {invoiceSettings.show_item_manufacturer !== false && (item.manufacturer || item.product_detail?.manufacturer) && (
                          <div className="text-[9px] text-gray-500 font-medium italic mt-0.5">
                            Mfr: {item.manufacturer || item.product_detail?.manufacturer}
                          </div>
                        )}
                        {desc && (
                          <div className="text-[9px] text-gray-500 whitespace-pre-line mt-0.5 leading-tight" style={{ wordBreak: 'break-word' }}>
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
                    val = `${getCurrencySymbol()}${p.toFixed(decimals)}`;
                  }
                  else if (col.id === 'discount') {
                    const discNum = parseFloat(item.discount || 0);
                    val = discNum > 0 ? `${discNum}%` : '-';
                  }
                  else if (col.id === 'tax') val = `${Math.round(item.tax || 0)}%`;
                  else if (col.id === 'amount') val = `${getCurrencySymbol()}${(item.quantity * item.price).toFixed(2)}`;
                  else if (col.id === 'hsn') val = item.hsn_sac_code || '-';

                  return (
                    <td 
                      key={col.id} 
                      className="align-middle text-gray-800"
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

// Part 3: Professional Footer Component (Sticky at the bottom of the final page)
const ProfessionalFooter = ({
  isDeliveryChallan,
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
  finalTotal,
  showWatermarkFooter,
}) => {
  return (
    <div className="invoice-part-footer mt-auto flex-shrink-0 pt-2">
      {!isDeliveryChallan && (
        <div className="flex justify-between pb-3 gap-6">
          <div className="w-1/2 pr-4">
            {sections.showBankDetails !== false && hasBankDetails && (
              <div className="mb-3">
                <p className="font-bold text-[10px] uppercase tracking-wider mb-1 text-gray-500">Bank & Payment Details</p>
                <div className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-start justify-between gap-3">
                  <div className="space-y-0.5 text-[11px]">
                    {bankName && <p><span className="font-semibold w-14 inline-block">Bank:</span> {bankName}</p>}
                    {bankAccount && <p><span className="font-semibold w-14 inline-block">A/C No:</span> <span className="font-mono">{bankAccount}</span></p>}
                    {bankIfsc && <p><span className="font-semibold w-14 inline-block">IFSC:</span> <span className="font-mono">{bankIfsc}</span></p>}
                    {bankBranch && <p><span className="font-semibold w-14 inline-block">Branch:</span> {bankBranch}</p>}
                    {bankUpi && <p><span className="font-semibold w-14 inline-block">UPI:</span> <span className="font-mono">{bankUpi}</span></p>}
                  </div>
                  {sections.showQRCode !== false && bankQr && (
                    <div className="text-center flex-shrink-0">
                      <img 
                        src={bankQr} 
                        alt="Payment QR" 
                        className="w-14 h-14 object-contain rounded border border-gray-200 p-0.5 bg-white shadow-sm"
                      />
                      <span className="text-[8px] text-gray-500 block mt-0.5">Scan to Pay</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {sections.showTerms !== false && (
              <div>
                <p className="font-bold text-[10px] uppercase tracking-wider mb-1 text-gray-500">Notes & Terms</p>
                <ul className="text-[10px] text-gray-600 space-y-0.5 list-disc pl-4">
                  {content.termsAndConditions?.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="w-72">
            <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
              <div className="flex justify-between px-2.5 py-1 border-b border-gray-100">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-bold">{getCurrencySymbol()}{subtotal.toFixed(2)}</span>
              </div>
              {isIGST ? (
                <div className="flex justify-between px-2.5 py-1 border-b border-gray-100">
                  <span className="text-gray-600">IGST</span>
                  <span className="font-bold">{getCurrencySymbol()}{taxTotal.toFixed(2)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between px-2.5 py-1 border-b border-gray-100">
                    <span className="text-gray-600">CGST</span>
                    <span className="font-bold">{getCurrencySymbol()}{(taxTotal / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between px-2.5 py-1 border-b border-gray-100">
                    <span className="text-gray-600">SGST</span>
                    <span className="font-bold">{getCurrencySymbol()}{(taxTotal / 2).toFixed(2)}</span>
                  </div>
                </>
              )}
              {roundOff !== 0 && (
                <div className="flex justify-between px-2.5 py-1 border-b border-gray-100">
                  <span className="text-gray-600">Round Off</span>
                  <span className="font-bold text-gray-700">
                    {roundOff >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOff.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between px-2.5 py-1.5 bg-gray-50">
                <span className="font-bold text-gray-900 whitespace-nowrap">Total</span>
                <span className="font-bold font-mono text-indigo-600 whitespace-nowrap">{getCurrencySymbol()}{finalTotal.toFixed(2)}</span>
              </div>
            </div>
            {sections.showAmountInWords !== false && (
              <p className="text-xs font-medium text-right mt-1.5 text-gray-700 italic">
                {amountInWords(finalTotal)}
              </p>
            )}

            {sections.showSignature !== false && (
              <div className="mt-8 text-right">
                <div className="border-t border-gray-400 inline-block pt-1 w-44 text-center text-[10px] font-semibold text-gray-500">
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
          <div className="flex justify-end pb-4">
            <div className="border-t border-gray-400 inline-block pt-1 w-44 text-center text-[10px] font-semibold text-gray-500">
              {content.signatureLabel || 'Received By / Signatory'}
            </div>
          </div>
        )}
        <div className="invoice-page-footer">
          <div className="mt-2 pt-2 border-t border-gray-200 text-center text-[9px] text-gray-500">
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
const ProfessionalContinuation = () => {
  return (
    <div className="invoice-part-continuation mt-auto flex-shrink-0 pt-2 pb-1 border-t border-dashed border-gray-300 text-center text-xs text-gray-400 italic font-medium">
      (Continued on next page)
    </div>
  );
};


// Main Unified Multi-Page Professional Template
const ProfessionalTemplate = forwardRef(({ 
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
  const companyGST = businessInfo.gstin || businessInfo.gst || '';
  
  const rawItems = Array.isArray(invoice.items) ? invoice.items : [];
  const customerName = invoice.customer_name || 'Customer Name';
  const billingAddress = invoice.customer_address || invoice.customer?.address || invoice.customer_details?.address || '';
  const shippingAddress = invoice.delivery_address || invoice.shipping_address || invoice.customer?.delivery_address || invoice.customer_details?.delivery_address || '';
  const customerGST = invoice.customer_gstin || invoice.gstin || '';
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
    { id: 'description', label: 'Item & Description', visible: true },
    { id: 'hsn', label: 'HSN', visible: true },
    { id: 'quantity', label: 'Qty', visible: true },
    { id: 'unit', label: 'Unit', visible: false },
    { id: 'price', label: 'Rate', visible: true },
    { id: 'discount', label: 'Disc %', visible: false },
    { id: 'tax', label: 'Tax %', visible: true },
    { id: 'amount', label: 'Amount', visible: true },
  ];

  const visibleColumns = getVisibleColumns(template.columns, { isDeliveryChallan, defaultColumns });
  const columnWidths = calculateColumnWidths(visibleColumns);


  const getHeaderFontSize = (colId) => {
    switch (colId) {
      case 'description': return '10px';
      default: return '9px';
    }
  };

  const getColumnLabel = (col) => {
    switch (col.id) {
      case 'serial': return '#';
      case 'description': return 'ITEM & DESCRIPTION';
      case 'batch': return 'BATCH';
      case 'hsn': return 'HSN';
      case 'quantity': return 'QTY';
      case 'free_qty': return 'FREE';
      case 'unit': return 'UNIT';
      case 'make': return 'MAKE';
      case 'pack_size': return 'PACK SIZE';
      case 'price': return 'UNIT PRICE';
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
              backgroundColor: colors.background || '#ffffff',
              color: colors.text || '#333333',
              fontFamily: typography.fontFamily || 'Inter, sans-serif',
              fontSize: `${typography.bodySize || 10}px`,
              border: `1px solid ${colors.tableBorder || '#e2e8f0'}`,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
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
            <ProfessionalHeader
              companyName={companyName}
              companyAddress={companyAddress}
              companyGST={companyGST}
              businessInfo={businessInfo}
              sections={sections}
              template={template}
              colors={colors}
              isDeliveryChallan={isDeliveryChallan}
              content={content}
              invoice={invoice}
              invoiceNumber={invoiceNumber}
              invoiceDate={invoiceDate}
              customerName={customerName}
              billingAddress={billingAddress}
              shippingAddress={shippingAddress}
              customerGST={customerGST}
              pageNumber={pageNumber}
              totalPages={totalPages}
            />

            {/* Part 2: Middle Item List */}
            <ProfessionalItemList
              items={pageItems}
              visibleColumns={visibleColumns}
              invoiceSettings={invoiceSettings}
              columnWidths={columnWidths}
              getHeaderFontSize={getHeaderFontSize}
              getColumnLabel={getColumnLabel}
              startIndex={startIndex}
            />

            {/* Part 3: Sticky Footer or Continuation */}
            {isLastPage ? (
              <ProfessionalFooter
                isDeliveryChallan={isDeliveryChallan}
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
                finalTotal={finalTotal}
                showWatermarkFooter={showWatermarkFooter}
              />
            ) : (
              <ProfessionalContinuation />
            )}

          </div>
        );
      })}
    </div>
  );
});

ProfessionalTemplate.displayName = 'ProfessionalTemplate';
export default ProfessionalTemplate;
