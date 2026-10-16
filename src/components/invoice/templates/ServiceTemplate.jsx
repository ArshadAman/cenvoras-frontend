import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';
import { getTaxType } from '../../../utils/taxUtils';
import { getCurrencySymbol, getCountryCode } from '../../../utils/currency';
import { paginateInvoiceItems, getVisibleColumns, calculateColumnWidths } from '../../../utils/invoicePaginator';

// Part 1: Service Header Component (Repeated on every page)
const ServiceHeader = ({
  sections = {},
  template = {},
  companyName,
  primaryColor,
  businessInfo = {},
  companyAddress,
  isDeliveryChallan,
  content = {},
  invoiceNumber,
  invoice = {},
  invoiceDate,
  customerName,
  billingAddress,
  pageNumber,
  totalPages,
}) => {
  return (
    <div className="invoice-part-header flex-shrink-0">
      <div className="flex justify-between items-start mb-4">
        <div>
          {sections.showLogo !== false && template.branding?.logo && (
            <img src={template.branding.logo} alt="Logo" style={{ maxHeight: 45 }} className="mb-2" />
          )}
          <h1 className="font-bold text-xl mb-0.5 uppercase tracking-tight" style={{ color: primaryColor }}>{companyName}</h1>
          <div className="text-[10px] space-y-0.5 text-gray-700">
            {sections.showGST !== false && businessInfo.gstin && <p className="font-bold">{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {businessInfo.gstin}</p>}
            {businessInfo.pan_number && <p className="font-bold">PAN: {businessInfo.pan_number}</p>}
            {businessInfo.gem_id && <p className="font-bold">GeM ID: {businessInfo.gem_id}</p>}
            {businessInfo.drug_license_number && <p className="font-bold">DL No: {businessInfo.drug_license_number}</p>}
          </div>
          <p className="whitespace-pre-line text-gray-600 text-[10px] mt-1 leading-tight" style={{ maxWidth: '300px' }}>{companyAddress}</p>
          {(businessInfo.phone || businessInfo.email) && (
            <p className="text-gray-600 text-[10px] mt-0.5 font-medium">
              {businessInfo.phone ? `Mobile: +91 ${businessInfo.phone}` : ''}
              {businessInfo.email ? ` | Email: ${businessInfo.email}` : ''}
            </p>
          )}
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black tracking-tighter mb-0.5" style={{ color: primaryColor }}>
            {isDeliveryChallan ? (content.challanTitle || 'DELIVERY CHALLAN') : (content.invoiceTitle || 'TAX INVOICE')}
          </h2>

          <p className="text-gray-900 font-bold text-xs">
            {isDeliveryChallan ? 'Challan #:' : 'Invoice #:'} {isDeliveryChallan ? (invoice.challan_number || invoiceNumber) : invoiceNumber}
          </p>
        </div>
      </div>

      <div className="flex mb-4 border-y-2 py-3" style={{ borderColor: '#f3f4f6' }}>
        <div className="w-1/2">
          <h3 className="font-bold text-gray-400 text-[9px] uppercase tracking-widest mb-1">Bill To:</h3>
          <p className="font-bold text-base text-gray-900 leading-none mb-0.5">{customerName}</p>
          <p className="whitespace-pre-line text-gray-600 text-xs leading-tight">{billingAddress}</p>
          {invoice.customer_gstin && <p className="text-[11px] font-bold text-gray-800 mt-1">{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {invoice.customer_gstin}</p>}
        </div>
        <div className="w-1/2 space-y-1 text-xs pl-8 border-l border-gray-100">
          <div className="flex justify-between">
            <span className="font-bold text-gray-500 uppercase text-[9px] tracking-widest">
              {isDeliveryChallan ? 'Challan Date:' : 'Invoice Date:'}
            </span>
            <span className="font-bold text-gray-900">
              {isDeliveryChallan ? (invoice.challan_date || invoiceDate) : invoiceDate}
            </span>
          </div>
          {isDeliveryChallan ? (
            <>
              {(invoice.sales_order_number || invoice.po_number) && (
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500 uppercase text-[9px] tracking-widest">Ref Order / PO:</span>
                  <span className="font-bold text-gray-900">{invoice.sales_order_number || invoice.po_number}</span>
                </div>
              )}
              {invoice.vehicle_number && (
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500 uppercase text-[9px] tracking-widest">Vehicle No:</span>
                  <span className="font-mono font-bold text-gray-900">{invoice.vehicle_number}</span>
                </div>
              )}
            </>
          ) : (
            <>
              {(invoice.po_number || invoice.sales_order_number) && (
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500 uppercase text-[9px] tracking-widest">PO / Ref:</span>
                  <span className="font-bold text-gray-900">{invoice.po_number || invoice.sales_order_number}</span>
                </div>
              )}
              {invoice.due_date && (
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500 uppercase text-[9px] tracking-widest">Due Date:</span>
                  <span className="font-bold text-gray-900">{new Date(invoice.due_date).toLocaleDateString('en-IN')}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Part 2: Service Item List Component (Middle)
const ServiceItemList = ({
  items = [],
  visibleColumns = [],
  invoiceSettings = {},
  columnWidths = {},
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
          <tr className="border-b-2 border-gray-900 text-left text-gray-900 text-[10px] tracking-wider uppercase">
            {visibleColumns.map((col) => (
              <th 
                key={col.id} 
                className="py-1.5 px-1 font-bold" 
                style={{ 
                  width: columnWidths[col.id] || 'auto', 
                  textAlign: col.id === 'description' ? 'left' : ['price', 'discount', 'tax', 'amount'].includes(col.id) ? 'right' : 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {getColumnLabel(col)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
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
              <tr key={index} style={{ breakInside: 'avoid', pageBreakInside: 'avoid', lineHeight: 1.2 }}>
                {visibleColumns.map(col => {
                  let val = '';

                  if (col.id === 'serial') val = actualSerial;
                  else if (col.id === 'description') {
                    const desc = item.description || item.product_description || item.product_detail?.description || '';
                    val = (
                      <div>
                        <div className="font-bold text-gray-900 leading-tight">{item.product_name || item.product || ''}</div>
                        {invoiceSettings.show_item_manufacturer !== false && (item.manufacturer || item.product_detail?.manufacturer) && (
                          <div className="text-[9px] text-gray-500 font-medium italic mt-0.5">
                            Mfr: {item.manufacturer || item.product_detail?.manufacturer}
                          </div>
                        )}
                        {desc && (
                          <div className="text-[9px] text-gray-500 mt-0.5 whitespace-pre-line leading-tight font-normal" style={{ wordBreak: 'break-word' }}>
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
                  else if (col.id === 'hsn') val = item.hsn_sac_code || item.hsn_code || '-';
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
                    val = `${getCurrencySymbol()}${p.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: decimals })}`;
                  }
                  else if (col.id === 'discount') {
                    const discNum = parseFloat(item.discount || 0);
                    val = discNum > 0 ? `${discNum}%` : '-';
                  }
                  else if (col.id === 'tax') val = `${Math.round(item.tax || 0)}%`;
                  else if (col.id === 'amount') val = `${getCurrencySymbol()}${(parseFloat(item.quantity || 0) * parseFloat(item.price || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

                  return (
                    <td 
                      key={col.id} 
                      className="align-middle font-medium text-gray-700"
                      style={{ 
                        paddingTop: '3px',
                        paddingBottom: '3px',
                        paddingLeft: '6px',
                        paddingRight: '6px',
                        fontSize: '11px',
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
    </div>
  );
};

// Part 3: Service Footer Component (Sticky at the bottom of the final page)
const ServiceFooter = ({
  isDeliveryChallan,
  sections = {},
  hasBankDetails,
  bankName,
  bankAccount,
  bankIfsc,
  bankBranch,
  bankUpi,
  bankQr,
  finalTotal,
  subtotal,
  isIGST,
  taxTotal,
  roundOff,
  content = {},
  showWatermarkFooter,
}) => {
  return (
    <div className="invoice-part-footer mt-auto flex-shrink-0 pt-2">
      {!isDeliveryChallan ? (
        <div className="flex justify-between pb-2">
          <div className="w-1/2 pr-6">
            {sections.showBankDetails !== false && hasBankDetails && (
              <div className="mb-3 flex items-start gap-3">
                <div className="text-[11px] text-gray-700 leading-tight flex-1">
                  <p className="font-bold text-gray-900 mb-0.5">Bank Details:</p>
                  {bankName && <p>Bank: {bankName}</p>}
                  {bankAccount && <p>Account #: {bankAccount}</p>}
                  {bankIfsc && <p>IFSC: {bankIfsc}</p>}
                  {bankBranch && <p>Branch: {bankBranch}</p>}
                  {bankUpi && <p>UPI/VPA: {bankUpi}</p>}
                </div>
                {bankQr && (
                  <div className="flex flex-col items-center">
                    <img src={bankQr} alt="Payment QR" className="w-14 h-14 object-contain rounded border border-gray-200 p-0.5" />
                    <span className="text-[8px] text-gray-500 mt-0.5 font-medium">Scan & Pay</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="border border-gray-300 p-2 text-xs bg-gray-50 border-dashed rounded">
              <span className="font-bold">Total amount (in words): </span>
              <span className="italic font-medium">{amountInWords(finalTotal)}</span>
            </div>
          </div>

          <div className="w-[42%]">
            <table className="w-full text-xs text-right">
              <tbody>
                <tr><td className="py-0.5 font-semibold text-gray-700">Taxable Amount</td><td className="py-0.5">{getCurrencySymbol()}{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                {isIGST ? (
                  <tr><td className="py-0.5 font-semibold text-gray-700">IGST</td><td className="py-0.5">{getCurrencySymbol()}{taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                ) : (
                  <>
                    <tr><td className="py-0.5 font-semibold text-gray-700">CGST</td><td className="py-0.5">{getCurrencySymbol()}{(taxTotal / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                    <tr><td className="py-0.5 font-semibold text-gray-700">SGST</td><td className="py-0.5">{getCurrencySymbol()}{(taxTotal / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                  </>
                )}
                {roundOff !== 0 && (
                  <tr>
                    <td className="py-0.5 font-semibold text-gray-700">Round Off</td>
                    <td className="py-0.5">{roundOff >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOff.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-b-2 border-gray-900 text-sm">
                  <td className="py-1.5 font-bold text-gray-900">Total</td>
                  <td className="py-1.5 font-bold text-gray-900">{getCurrencySymbol()}{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
            {sections.showSignature !== false && (
              <div className="text-right mt-6 pt-1">
                <p className="text-[10px] text-gray-500 border-t border-gray-400 inline-block w-44 text-center pt-0.5">
                  {content.signatureLabel || 'Authorized Signatory'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        sections.showSignature !== false && (
          <div className="flex justify-end pb-3">
            <div className="text-right pt-1">
              <p className="text-[10px] text-gray-500 border-t border-gray-400 inline-block w-44 text-center pt-0.5">
                {content.signatureLabel || 'Received By / Signatory'}
              </p>
            </div>
          </div>
        )
      )}
      
      {/* Bottom Anchored Footer */}
      <div>
        {sections.showTerms !== false && content.termsAndConditions?.length > 0 && (
          <div className="border-t border-gray-200 pt-2 text-[10px]">
            <p className="font-bold text-gray-900 mb-0.5">Terms and Conditions:</p>
            <ol className="text-gray-600 pl-4 list-decimal space-y-0.5">
              {content.termsAndConditions.map((t, i) => <li key={i}>{t}</li>)}
            </ol>
          </div>
        )}
        <div className="invoice-page-footer">
          <div className="w-full text-center mt-2 text-[9px] text-gray-400 font-medium">
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
const ServiceContinuation = () => {
  return (
    <div className="invoice-part-continuation mt-auto flex-shrink-0 pt-2 pb-1 border-t border-dashed border-gray-300 text-center text-xs text-gray-400 italic font-medium">
      (Continued on next page)
    </div>
  );
};


// Main Unified Multi-Page Service Template
const ServiceTemplate = forwardRef(({ 
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

  const primaryColor = colors.primary || '#0f172a';

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
    { id: 'description', label: 'Service Description', visible: true },
    { id: 'hsn', label: 'SAC/HSN', visible: true },
    { id: 'quantity', label: 'Qty', visible: true },
    { id: 'unit', label: 'Unit', visible: false },
    { id: 'price', label: 'Rate', visible: true },
    { id: 'discount', label: 'Disc %', visible: false },
    { id: 'tax', label: 'Tax %', visible: true },
    { id: 'amount', label: 'Line Total', visible: true },
  ];

  const visibleColumns = getVisibleColumns(template.columns, { isDeliveryChallan, defaultColumns });
  const columnWidths = calculateColumnWidths(visibleColumns);


  const getColumnLabel = (col) => {
    switch (col.id) {
      case 'serial': return '#';
      case 'description': return 'SERVICE DESCRIPTION';
      case 'batch': return 'BATCH';
      case 'hsn': return 'SAC/HSN';
      case 'quantity': return 'QTY';
      case 'free_qty': return 'FREE';
      case 'unit': return 'UNIT';
      case 'make': return 'MAKE';
      case 'pack_size': return 'PACK SIZE';
      case 'price': return 'RATE';
      case 'discount': return 'DISC.%';
      case 'tax': return 'TAX';
      case 'amount': return 'LINE TOTAL';
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
            <ServiceHeader
              sections={sections}
              template={template}
              companyName={companyName}
              primaryColor={primaryColor}
              businessInfo={businessInfo}
              companyAddress={companyAddress}
              isDeliveryChallan={isDeliveryChallan}
              content={content}
              invoiceNumber={invoiceNumber}
              invoice={invoice}
              invoiceDate={invoiceDate}
              customerName={customerName}
              billingAddress={billingAddress}
              pageNumber={pageNumber}
              totalPages={totalPages}
            />

            {/* Part 2: Middle Item List */}
            <ServiceItemList
              items={pageItems}
              visibleColumns={visibleColumns}
              invoiceSettings={invoiceSettings}
              columnWidths={columnWidths}
              getColumnLabel={getColumnLabel}
              startIndex={startIndex}
            />

            {/* Part 3: Sticky Footer or Continuation */}
            {isLastPage ? (
              <ServiceFooter
                isDeliveryChallan={isDeliveryChallan}
                sections={sections}
                hasBankDetails={hasBankDetails}
                bankName={bankName}
                bankAccount={bankAccount}
                bankIfsc={bankIfsc}
                bankBranch={bankBranch}
                bankUpi={bankUpi}
                bankQr={bankQr}
                finalTotal={finalTotal}
                subtotal={subtotal}
                isIGST={isIGST}
                taxTotal={taxTotal}
                roundOff={roundOff}
                content={content}
                showWatermarkFooter={showWatermarkFooter}
              />
            ) : (
              <ServiceContinuation />
            )}

          </div>
        );
      })}
    </div>
  );
});

ServiceTemplate.displayName = 'ServiceTemplate';
export default ServiceTemplate;
