import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';
import { getTaxType } from '../../../utils/taxUtils';
import { getCurrencySymbol, getCountryCode } from '../../../utils/currency';
import { paginateInvoiceItems } from '../../../utils/invoicePaginator';

// Part 1: GenZ Header Component (Repeats on every page)
const GenzHeader = ({
  primaryColor,
  sections = {},
  template = {},
  companyName,
  businessInfo = {},
  companyAddress,
  isDeliveryChallan,
  content = {},
  customerName,
  billingAddress,
  customerGST,
  invoice = {},
  invoiceNumber,
  invoiceDate,
  pageNumber,
  totalPages,
}) => {
  return (
    <div className="invoice-part-header flex-shrink-0">
      {/* Top Vibrant Color Header */}
      <div 
        style={{ backgroundColor: primaryColor }} 
        className="px-6 py-4 flex justify-between items-center text-white -mx-6 -mt-6 mb-4"
      >
        <div className="flex items-center gap-3">
          {sections.showLogo !== false && template.branding?.logo && (
            <img src={template.branding.logo} alt="Logo" className="h-10 bg-white p-1 rounded-lg" />
          )}
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{companyName}</h1>
            <div className="text-[10px] text-white/90 mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 font-medium">
              {sections.showGST !== false && businessInfo.gstin && <span>{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {businessInfo.gstin}</span>}
              {businessInfo.pan_number && <span>PAN: {businessInfo.pan_number}</span>}
              {businessInfo.gem_id && <span>GeM: {businessInfo.gem_id}</span>}
              {businessInfo.drug_license_number && <span>DL: {businessInfo.drug_license_number}</span>}
            </div>
            {companyAddress && <p className="text-[10px] text-white/80 mt-0.5 whitespace-pre-line leading-tight">{companyAddress}</p>}
          </div>
        </div>
        <div className="text-right">
          {totalPages > 1 && (
            <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider block mb-1">
              Page {pageNumber} of {totalPages}
            </span>
          )}
          <h2 className="text-xl font-bold opacity-90">
            {isDeliveryChallan ? (content.challanTitle || 'DELIVERY CHALLAN') : (content.invoiceTitle || 'TAX INVOICE')}
          </h2>
        </div>
      </div>

      {/* Bill To & Invoice Details Grid */}
      <div className="grid grid-cols-2 gap-6 mb-4 text-xs">
        <div>
          <h3 className="text-gray-400 font-bold mb-1 uppercase text-[10px] tracking-widest">Billed To</h3>
          <p className="font-bold text-sm text-gray-900 mb-0.5">{customerName}</p>
          <p className="whitespace-pre-line text-gray-600 font-medium leading-tight">{billingAddress}</p>
          {customerGST && (
            <p className="text-gray-600 font-medium mt-1">
              <strong>{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'}</strong> {customerGST}
            </p>
          )}
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col justify-center">
          <div className="flex justify-between mb-1.5 border-b border-gray-200 pb-1.5">
            <span className="text-gray-500 font-semibold">{isDeliveryChallan ? 'Challan No.' : 'Invoice No.'}</span>
            <span className="font-bold text-gray-900 text-sm">{isDeliveryChallan ? (invoice.challan_number || invoiceNumber) : invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-semibold">{isDeliveryChallan ? 'Challan Date' : 'Date of Issue'}</span>
            <span className="font-bold text-gray-900">{isDeliveryChallan ? (invoice.challan_date || invoiceDate) : invoiceDate}</span>
          </div>
          {isDeliveryChallan ? (
            <>
              {(invoice.sales_order_number || invoice.po_number) && (
                <div className="flex justify-between mt-1.5 pt-1.5 border-t border-gray-200">
                  <span className="text-gray-500 font-semibold">Ref Order</span>
                  <span className="font-bold text-gray-900">{invoice.sales_order_number || invoice.po_number}</span>
                </div>
              )}
              {invoice.vehicle_number && (
                <div className="flex justify-between mt-1">
                  <span className="text-gray-500 font-semibold">Vehicle No.</span>
                  <span className="font-mono font-bold text-gray-900">{invoice.vehicle_number}</span>
                </div>
              )}
            </>
          ) : (
            <>
              {(invoice.po_number || invoice.sales_order_number) && (
                <div className="flex justify-between mt-1.5 pt-1.5 border-t border-gray-200">
                  <span className="text-gray-500 font-semibold">Ref Order / PO</span>
                  <span className="font-bold text-gray-900">{invoice.po_number || invoice.sales_order_number}</span>
                </div>
              )}
              {invoice.due_date && (
                <div className="flex justify-between mt-1 text-red-500">
                  <span className="font-semibold">Due Date</span>
                  <span className="font-bold">{new Date(invoice.due_date).toLocaleDateString('en-IN')}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Part 2: GenZ Item List Component (Middle)
const GenzItemList = ({
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
          <tr className="border-b-2 border-gray-100 text-gray-400 text-[10px] tracking-wider uppercase">
            {visibleColumns.map((col) => (
              <th 
                key={col.id} 
                className="py-1.5 px-1 font-bold" 
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
        <tbody className="divide-y divide-gray-50">
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
              <tr 
                key={index} 
                className="hover:bg-gray-50/50"
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid', lineHeight: 1.2 }}
              >
                {visibleColumns.map(col => {
                  let val = '';
                  let isDesc = col.id === 'description';
                  let isNum = ['price', 'discount', 'tax', 'amount', 'quantity', 'free_qty'].includes(col.id);

                  if (col.id === 'serial') val = <span className="text-gray-400 font-bold">{actualSerial}</span>;
                  else if (col.id === 'description') {
                    const desc = item.description || item.product_description || item.product_detail?.description || '';
                    val = (
                      <div>
                        <div className="font-bold text-gray-900">{item.product_name || item.product || ''}</div>
                        {invoiceSettings.show_item_manufacturer !== false && (item.manufacturer || item.product_detail?.manufacturer) && (
                          <div className="text-[9px] text-gray-500 font-medium italic mt-0.5">
                            Mfr: {item.manufacturer || item.product_detail?.manufacturer}
                          </div>
                        )}
                        {desc && (
                          <div className="text-[9px] text-gray-400 mt-0.5 font-normal whitespace-pre-line leading-tight" style={{ wordBreak: 'break-word' }}>
                            {desc}
                          </div>
                        )}
                        {invoiceSettings.show_item_storage_condition && (item.storage_condition || item.product_detail?.storage_condition || item.product_detail?.temperature) ? (
                          <div className="text-[9px] text-gray-400 mt-0.5 font-medium">
                            {(item.storage_condition || item.product_detail?.storage_condition) ? `Storage: ${item.storage_condition || item.product_detail.storage_condition}` : ''}
                            {(item.storage_condition || item.product_detail?.storage_condition) && item.product_detail?.temperature ? ' | ' : ''}
                            {item.product_detail?.temperature ? `Temp: ${item.product_detail.temperature}` : ''}
                          </div>
                        ) : null}
                      </div>
                    );
                  }
                  else if (col.id === 'quantity') val = <span className="font-bold bg-gray-100 px-2 py-0.5 rounded-full text-[10px]">{item.quantity}</span>;
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

// Part 3: GenZ Footer Component (Sticky at the bottom of the final page)
const GenzFooter = ({
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
  primaryColor,
  finalTotal,
  showWatermarkFooter,
}) => {
  return (
    <div className="invoice-part-footer mt-auto flex-shrink-0 pt-2">
      {!isDeliveryChallan && (
        <div className="flex justify-between pb-3 gap-6">
          <div className="w-1/2 space-y-2">
            {sections.showBankDetails !== false && hasBankDetails && (
              <div className="rounded-xl bg-gray-50 p-3 border border-gray-100 flex items-start gap-3">
                <div className="text-[11px] text-gray-700 leading-tight flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">Bank & Payment Details</h3>
                  {bankName && <p><span className="font-medium text-gray-500">Bank:</span> {bankName}</p>}
                  {bankAccount && <p><span className="font-medium text-gray-500">A/C #:</span> {bankAccount}</p>}
                  {bankIfsc && <p><span className="font-medium text-gray-500">IFSC:</span> {bankIfsc}</p>}
                  {bankBranch && <p><span className="font-medium text-gray-500">Branch:</span> {bankBranch}</p>}
                  {bankUpi && <p><span className="font-medium text-gray-500">UPI/VPA:</span> {bankUpi}</p>}
                </div>
                {bankQr && (
                  <div className="flex flex-col items-center">
                    <img src={bankQr} alt="Payment QR" className="w-14 h-14 object-contain rounded-lg border border-gray-200 p-0.5 bg-white shadow-sm" />
                    <span className="text-[8px] text-gray-500 mt-0.5 font-semibold">Scan to Pay</span>
                  </div>
                )}
              </div>
            )}
            {sections.showTerms !== false && content.termsAndConditions?.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-0.5 text-xs">Terms & Conditions</h3>
                <ul className="text-gray-500 text-[10px] space-y-0.5 list-disc pl-4">
                  {content.termsAndConditions.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
          </div>
          
          <div className="w-72">
            <div className="rounded-xl bg-gray-50 p-3 border border-gray-100 text-xs">
              <div className="flex justify-between mb-1 text-gray-600 font-medium pb-1 border-b border-gray-200">
                <span>Subtotal</span>
                <span>{getCurrencySymbol()}{subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
              {isIGST ? (
                <div className="flex justify-between mb-1.5 text-gray-600 font-medium pb-1.5 border-b border-gray-200">
                  <span>IGST</span>
                  <span>{getCurrencySymbol()}{taxTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between mb-1 text-gray-600 font-medium">
                    <span>CGST</span>
                    <span>{getCurrencySymbol()}{(taxTotal / 2).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between mb-1.5 text-gray-600 font-medium pb-1.5 border-b border-gray-200">
                    <span>SGST</span>
                    <span>{getCurrencySymbol()}{(taxTotal / 2).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                </>
              )}
              {roundOff !== 0 && (
                <div className="flex justify-between mb-1.5 text-gray-600 font-medium pb-1 border-b border-gray-200">
                  <span>Round Off</span>
                  <span className="font-bold text-gray-700">
                    {roundOff >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOff.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs pt-0.5">
                <span className="font-extrabold text-gray-900 whitespace-nowrap">Total Due</span>
                <span style={{ color: primaryColor }} className="font-black font-mono text-sm whitespace-nowrap">
                  {getCurrencySymbol()}{finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                </span>
              </div>
              {sections.showAmountInWords !== false && (
                <p className="text-gray-700 text-right mt-1.5 text-[11px] font-medium italic">
                  {amountInWords(finalTotal)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Bottom Anchored Footer */}
      <div>
        {isDeliveryChallan && sections.showSignature !== false && (
          <div className="flex justify-end pb-3">
            <div className="text-right">
              <div className="border-t border-gray-400 inline-block pt-1 text-[10px] px-6">
                {content.signatureLabel || 'Received By / Signatory'}
              </div>
            </div>
          </div>
        )}
        <div className="invoice-page-footer">
          <div className="mt-1 pt-1.5 border-t border-gray-100 text-center text-[9px] text-gray-400 font-medium tracking-wide w-full">
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
const GenzContinuation = ({ pageNumber, totalPages }) => {
  return (
    <div className="invoice-part-continuation mt-auto flex-shrink-0 pt-2 pb-1 border-t border-dashed border-gray-300 flex justify-between items-center text-xs text-gray-500 font-medium">
      <span>Continued on next page...</span>
      <span>Page {pageNumber} of {totalPages}</span>
    </div>
  );
};

// Main Unified Multi-Page GenZ Template
const GenzTemplate = forwardRef(({ 
  invoice = {}, 
  template = {}, 
  businessInfo = {},
  invoiceSettings = {},
  showWatermark = false,
}, ref) => {
  const { sections = {}, content = {} } = template;
  
  const companyName = template.branding?.useBusinessName !== false 
    ? (businessInfo.business_name || businessInfo.businessName || 'Your Business Name')
    : (template.branding?.customName || 'Your Business Name');

  const companyAddress = businessInfo.business_address || businessInfo.address || '';
  const rawItems = Array.isArray(invoice.items) ? invoice.items : [];
  const customerName = invoice.customer_name || 'Customer Name';
  const billingAddress = invoice.customer_address || invoice.customer?.address || invoice.customer_details?.address || '';
  const customerGST = invoice.customer_gstin || invoice.gstin || '';
  const invoiceNumber = invoice.invoice_number || 'INV-0001';
  const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const roundOff = parseFloat(invoice.round_off || 0) || 0;
  
  const isDeliveryChallan = Boolean(
    invoice.is_delivery_challan || 
    invoice.challan_number || 
    invoice.document_type === 'delivery_challan'
  );

  const primaryColor = template.colors?.primary || '#8b5cf6';

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
    { id: 'price', label: 'Price', visible: true },
    { id: 'discount', label: 'Disc %', visible: true },
    { id: 'tax', label: 'Tax %', visible: true },
    { id: 'amount', label: 'Total', visible: true },
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
      case 'price': return 'PRICE';
      case 'discount': return 'DISC.%';
      case 'tax': return 'TAX';
      case 'amount': return 'TOTAL';
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
            <GenzHeader
              primaryColor={primaryColor}
              sections={sections}
              template={template}
              companyName={companyName}
              businessInfo={businessInfo}
              companyAddress={companyAddress}
              isDeliveryChallan={isDeliveryChallan}
              content={content}
              customerName={customerName}
              billingAddress={billingAddress}
              customerGST={customerGST}
              invoice={invoice}
              invoiceNumber={invoiceNumber}
              invoiceDate={invoiceDate}
              pageNumber={pageNumber}
              totalPages={totalPages}
            />

            {/* Part 2: Middle Item List */}
            <GenzItemList
              items={pageItems}
              visibleColumns={visibleColumns}
              invoiceSettings={invoiceSettings}
              getColumnWidth={getColumnWidth}
              getColumnLabel={getColumnLabel}
              startIndex={startIndex}
            />

            {/* Part 3: Sticky Footer or Continuation */}
            {isLastPage ? (
              <GenzFooter
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
                primaryColor={primaryColor}
                finalTotal={finalTotal}
                showWatermarkFooter={showWatermarkFooter}
              />
            ) : (
              <GenzContinuation
                pageNumber={pageNumber}
                totalPages={totalPages}
              />
            )}

            {/* Bottom Footer Border */}
            <div style={{ backgroundColor: primaryColor }} className="h-2 w-full mt-auto -mx-6 -mb-6 flex-shrink-0" />
          </div>
        );
      })}
    </div>
  );
});

GenzTemplate.displayName = 'GenzTemplate';
export default GenzTemplate;
