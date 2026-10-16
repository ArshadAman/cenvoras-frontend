import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';
import { getTaxType } from '../../../utils/taxUtils';
import { getCurrencySymbol, getCountryCode } from '../../../utils/currency';
import { paginateInvoiceItems } from '../../../utils/invoicePaginator';

// Part 1: Classic Header Component (Repeats on every page)
const ClassicHeader = ({
  content = {},
  sections = {},
  colors = {},
  typography = {},
  isDeliveryChallan,
  challanNumber,
  invoiceNumber,
  challanDate,
  invoiceDate,
  poNumber,
  poDate,
  dueDate,
  invoice = {},
  customerName,
  customerGST,
  billingAddress,
  shippingAddress,
  hasSeparateShipping,
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  companyGST,
  companyPAN,
  companyGEM,
  companyDL,
  headerStyle,
  pageNumber,
  totalPages,
}) => {
  return (
    <div className="invoice-part-header flex-shrink-0">
      {/* Header Section with top curved banner */}
      <div
        className="mb-3 invoice-first-page-header"
        style={{
          backgroundColor: '#ececec',
          margin: '-10mm -10mm 0 -10mm',
          padding: '6mm 10mm 4mm 10mm',
          borderBottomLeftRadius: '120% 24px',
          borderBottomRightRadius: '120% 24px',
        }}
      >
        <div className="flex justify-between items-start">
          <div className="text-left text-xs text-gray-500 font-medium pt-1">
            {totalPages > 1 && (
              <span className="bg-white/80 px-2 py-0.5 rounded text-[10px] border border-gray-200">
                Page {pageNumber} of {totalPages}
              </span>
            )}
          </div>
          <div className="text-right" style={{ maxWidth: '62%' }}>
            <h1 className="font-semibold mb-0.5" style={{ ...headerStyle, color: '#d11f1f', fontSize: `${typography.companyNameSize || 20}px` }}>
              {companyName}
            </h1>
            <div className="space-y-0.5" style={{ color: '#1f2937', fontSize: `${typography.smallSize || 9}px` }}>
              {companyAddress && <p className="whitespace-pre-line leading-tight">{companyAddress}</p>}
              {(companyPhone || companyEmail) && (
                <p>
                  {companyPhone ? `Ph- ${companyPhone}` : ''}
                  {companyPhone && companyEmail ? ', ' : ''}
                  {companyEmail ? `email-${companyEmail}` : ''}
                </p>
              )}
              {sections.showGST !== false && companyGST && <p className="font-medium">{getCountryCode() === 'IN' ? 'GSTIN: ' : 'TRN: '}{companyGST}</p>}
              {companyPAN && <p className="font-medium">PAN: {companyPAN}</p>}
              {sections.showGEMID && companyGEM && <p className="font-medium">GEM ID- {companyGEM}</p>}
              {companyDL && <p className="font-medium">DL No- {companyDL}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="flex justify-between items-start mb-3 gap-6">
        <div className="flex-1 rounded-lg border border-gray-200 bg-white p-2.5">
          <div className="font-semibold mb-1 uppercase tracking-wide" style={{ color: colors.secondary || '#4b5563', fontSize: `${typography.sectionTitleSize || 11}px` }}>
            Billing Address
          </div>
          <div className="space-y-0.5" style={{ color: colors.text || '#1f2937', fontSize: `${typography.bodySize || 10}px` }}>
            <div className="font-medium">{customerName}</div>
            {billingAddress && <p className="whitespace-pre-line leading-tight">{billingAddress}</p>}
            {customerGST && <p className="font-medium">{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {customerGST}</p>}
          </div>
        </div>

        {hasSeparateShipping ? (
          <div className="flex-1 rounded-lg border border-gray-200 bg-white p-2.5">
            <div className="font-semibold mb-1 uppercase tracking-wide" style={{ color: colors.secondary || '#4b5563', fontSize: `${typography.sectionTitleSize || 11}px` }}>
              Shipping Address
            </div>
            <div className="space-y-0.5" style={{ color: colors.text || '#1f2937', fontSize: `${typography.bodySize || 10}px` }}>
              <div className="whitespace-pre-line leading-tight">{shippingAddress}</div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Invoice Title */}
      <div className="text-center mb-2">
        <h2 
          className="font-bold tracking-wide"
          style={{ 
            fontSize: `${typography.invoiceTitleSize || 18}px`,
            color: '#111827',
            letterSpacing: '1px',
          }}
        >
          {isDeliveryChallan ? (content.challanTitle || 'DELIVERY CHALLAN') : (content.invoiceTitle || 'TAX INVOICE')}
        </h2>
        {content.invoiceSubtitle && (
          <p className="text-xs mt-0.5" style={{ color: colors.lightText || '#6b7280' }}>
            {content.invoiceSubtitle}
          </p>
        )}
      </div>

      {/* Invoice / Challan Details Row */}
      <div className="flex justify-between mb-3 text-xs">
        <div className="space-y-0.5">
          <div>
            <span className="font-medium">{isDeliveryChallan ? 'Challan #:' : 'Invoice #:'}</span>{' '}
            <span className="font-bold" style={{ color: colors.primary || '#d11f1f' }}>
              {isDeliveryChallan ? (challanNumber || invoiceNumber) : invoiceNumber}
            </span>
          </div>
          <div>
            <span className="font-medium">{isDeliveryChallan ? 'Challan Date:' : 'Date:'}</span>{' '}
            {isDeliveryChallan ? (challanDate || invoiceDate) : invoiceDate}
          </div>
          {isDeliveryChallan ? (
            (invoice.sales_order_number || poNumber) && (
              <div>
                <span className="font-medium">Ref Order:</span>{' '}
                {invoice.sales_order_number || poNumber}
              </div>
            )
          ) : (
            <>
              {poNumber && <div><span className="font-medium">PO:</span> {poNumber}{poDate ? ` | ${poDate}` : ''}</div>}
              {challanNumber && <div><span className="font-medium">Challan:</span> {challanNumber}{challanDate ? ` | ${challanDate}` : ''}</div>}
            </>
          )}
        </div>
        <div className="text-right space-y-0.5">
          {isDeliveryChallan ? (
            <>
              {invoice.vehicle_number && (
                <div>
                  <span className="font-medium">Vehicle No:</span>{' '}
                  <span className="font-mono font-bold text-gray-800">{invoice.vehicle_number}</span>
                </div>
              )}
              {invoice.transport_mode && (
                <div>
                  <span className="font-medium">Transport Mode:</span> {invoice.transport_mode}
                </div>
              )}
              {invoice.transporter_name && (
                <div>
                  <span className="font-medium">Transporter:</span> {invoice.transporter_name}
                </div>
              )}
            </>
          ) : (
            sections.showDueDate && dueDate && (
              <div><span className="font-medium">Due Date:</span> {dueDate}</div>
            )
          )}
        </div>
      </div>

      <div className="mb-3" style={{ height: '4px', backgroundColor: '#ece8e8', borderRadius: '999px' }} />
    </div>
  );
};

// Part 2: Classic Item List Component (Middle)
const ClassicItemList = ({
  items = [],
  visibleColumns = [],
  colors = {},
  styles = {},
  typography = {},
  invoiceSettings = {},
  getColumnWidth,
  getColumnLabel,
  tableHeaderStyle,
  startIndex = 0,
}) => {
  return (
    <div className="invoice-part-items flex-1">
      <table 
        className="w-full border-collapse"
        style={{ 
          borderRadius: styles.borderRadius || 0,
          overflow: 'hidden',
          tableLayout: 'fixed',
        }}
      >
        <colgroup>
          {visibleColumns.map((col) => (
            <col key={col.id} style={{ width: getColumnWidth(col.id) }} />
          ))}
        </colgroup>
        <thead style={{ display: 'table-header-group' }}>
          <tr style={tableHeaderStyle}>
            {visibleColumns.map(col => (
              <th 
                key={col.id}
                className="px-2 py-1.5 font-bold border"
                style={{ 
                  width: getColumnWidth(col.id),
                  textAlign: col.align || 'left',
                  borderColor: colors.tableBorder || '#e5e7eb',
                  fontSize: `${typography.smallSize || 9}px`,
                  whiteSpace: 'nowrap',
                }}
              >
                {getColumnLabel(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? items.map((item, index) => {
            const actualSerial = startIndex + index + 1;
            if (item.row_type === 'note') {
              return (
                <tr key={index} style={{ backgroundColor: '#fbfbfb', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <td
                    colSpan={visibleColumns.length}
                    className="border px-3 py-1 text-xs text-slate-700 italic text-left font-medium"
                    style={{ borderColor: colors.tableBorder || '#e5e7eb' }}
                  >
                    Note: {item.description || item.product_description || item.product || ''}
                  </td>
                </tr>
              );
            }
            const qty = parseFloat(item.quantity || 0);
            const price = parseFloat(item.price || 0);
            const tax = parseFloat(item.tax || 0);
            const discount = parseFloat(item.discount || 0);
            const amount = qty * price;
            
            return (
              <tr 
                key={index}
                style={{
                  backgroundColor: styles.tableStyle === 'striped' && index % 2 === 1 
                    ? (colors.tableStripe || '#f9fafb') 
                    : 'transparent',
                  lineHeight: 1.2,
                  breakInside: 'avoid',
                  pageBreakInside: 'avoid',
                }}
              >
                {visibleColumns.map(col => {
                  let value = '';
                  switch(col.id) {
                    case 'serial': value = actualSerial; break;
                    case 'description': value = item.product_detail?.name || item.product_name || item.product || ''; break;
                    case 'batch': value = item.batch_number || item.batch?.batch_number || item.batch || '-'; break;
                    case 'hsn': value = item.hsn_sac_code || item.hsn_code || ''; break;
                    case 'quantity': value = qty; break;
                    case 'free_qty': value = item.free_quantity || 0; break;
                    case 'unit': value = item.unit || 'pcs'; break;
                    case 'make': value = item.make || item.product_detail?.make || item.brand || item.product_detail?.brand || '-'; break;
                    case 'pack_size': value = item.pack_size || item.product_detail?.pack_size || item.packing || item.product_detail?.packing || item.unit || '-'; break;
                    case 'price': {
                      const pStr = price.toString();
                      const decCount = (pStr.split('.')[1] || '').length;
                      const decimals = Math.min(Math.max(2, decCount), 4);
                      value = `${getCurrencySymbol()}${price.toFixed(decimals)}`;
                      break;
                    }
                    case 'discount': value = discount > 0 ? `${discount}%` : '-'; break;
                    case 'tax': value = `${Math.round(tax)}%`; break;
                    case 'amount': value = `${getCurrencySymbol()}${amount.toFixed(2)}`; break;
                    default: value = '';
                  }
                  
                  const isDesc = col.id === 'description';
                  const isNum = col.id === 'price' || col.id === 'amount';
                  return (
                    <td 
                      key={col.id}
                      className="border align-middle"
                      style={{ 
                        paddingTop: '3px',
                        paddingBottom: '3px',
                        paddingLeft: '6px',
                        paddingRight: '6px',
                        lineHeight: 1.2,
                        fontSize: '11px',
                        textAlign: isDesc ? 'left' : isNum ? 'right' : 'center',
                        borderColor: colors.tableBorder || '#e5e7eb',
                        wordBreak: isDesc ? 'break-word' : 'normal',
                        whiteSpace: isDesc ? 'normal' : 'nowrap',
                        verticalAlign: 'middle',
                      }}
                    >
                      {col.id === 'description' ? (
                        <div>
                          <div className="font-medium text-gray-900">{item.product_detail?.name || item.product_name || item.product || ''}</div>
                          {invoiceSettings.show_item_manufacturer !== false && (item.manufacturer || item.product_detail?.manufacturer) && (
                            <div className="text-[9px] text-gray-500 font-medium italic mt-0.5">
                              Mfr: {item.manufacturer || item.product_detail?.manufacturer}
                            </div>
                          )}
                          {invoiceSettings.show_item_description !== false && (item.description || item.product_description || item.product_detail?.description) ? (
                            <div className="whitespace-pre-line text-[9px] text-gray-500 mt-0.5 leading-tight" style={{ wordBreak: 'break-word' }}>
                              {item.description || item.product_description || item.product_detail?.description}
                            </div>
                          ) : null}
                          {invoiceSettings.show_item_storage_condition && (item.storage_condition || item.product_detail?.storage_condition || item.product_detail?.temperature) ? (
                            <div className="text-[9px] text-gray-500 mt-0.5 font-medium">
                              {(item.storage_condition || item.product_detail?.storage_condition) ? `Storage: ${item.storage_condition || item.product_detail.storage_condition}` : ''}
                              {(item.storage_condition || item.product_detail?.storage_condition) && item.product_detail?.temperature ? ' | ' : ''}
                              {item.product_detail?.temperature ? `Temp: ${item.product_detail.temperature}` : ''}
                            </div>
                          ) : null}
                        </div>
                      ) : value}
                    </td>
                  );
                })}
              </tr>
            );
          }) : (
            <tr>
              <td 
                colSpan={visibleColumns.length}
                className="text-center py-6 text-gray-400 text-xs"
              >
                No items added yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// Part 3: Classic Footer Component (Sticky at the bottom of the final page)
const ClassicFooter = ({
  sections = {},
  content = {},
  colors = {},
  typography = {},
  isDeliveryChallan,
  hasBankDetails,
  bankName,
  bankAccount,
  bankIfsc,
  bankBranch,
  bankUpi,
  bankQr,
  isIGST,
  subtotal,
  taxTotal,
  roundOff,
  finalTotal,
  totalRowStyle,
  showWatermarkFooter,
}) => {
  return (
    <div className="invoice-part-footer mt-auto flex-shrink-0 pt-2">
      {/* Bottom Section - Bank Details & Totals (Hidden for Delivery Challans) */}
      {!isDeliveryChallan && (
        <div className="flex justify-between gap-6 mb-2">
          {/* Bank Details - Left */}
          {sections.showBankDetails !== false && hasBankDetails && (
            <div className="flex-1 mr-4">
              <h4 
                className="font-bold mb-1 pb-0.5 text-xs"
                style={{ 
                  color: colors.secondary || '#4b5563',
                  borderBottom: `1px solid ${colors.tableBorder || '#e5e7eb'}`,
                }}
              >
                Our Bank Details:
              </h4>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 text-xs text-gray-600">
                  {bankName && <p><span className="font-medium">Bank Name:</span> {bankName}</p>}
                  {bankAccount && <p><span className="font-medium">A/C No:</span> <span className="font-mono">{bankAccount}</span></p>}
                  {bankIfsc && <p><span className="font-medium">IFSC:</span> <span className="font-mono">{bankIfsc}</span></p>}
                  {bankBranch && <p><span className="font-medium">Branch:</span> {bankBranch}</p>}
                  {bankUpi && <p><span className="font-medium">UPI / VPA:</span> <span className="font-mono">{bankUpi}</span></p>}
                </div>
                {sections.showQRCode !== false && bankQr && (
                  <div className="text-center flex-shrink-0">
                    <img 
                      src={bankQr} 
                      alt="Scan to Pay" 
                      className="w-14 h-14 object-contain rounded border border-gray-200 p-0.5 bg-white shadow-sm"
                    />
                    <span className="text-[8px] text-gray-500 block mt-0.5">Scan to Pay</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Totals - Right */}
          <div className="w-72">
            <table className="w-full border-collapse text-xs">
              <tbody>
                <tr>
                  <td className="px-2 py-1 border font-medium" style={{ borderColor: colors.tableBorder || '#e5e7eb' }}>
                    Untaxed Amount
                  </td>
                  <td className="px-2 py-1 border text-right font-medium" style={{ borderColor: colors.tableBorder || '#e5e7eb' }}>
                    {getCurrencySymbol()}{subtotal.toFixed(2)}
                  </td>
                </tr>
                {isIGST ? (
                  <tr>
                    <td className="px-2 py-1 border font-medium" style={{ borderColor: colors.tableBorder || '#e5e7eb' }}>IGST</td>
                    <td className="px-2 py-1 border text-right font-medium" style={{ borderColor: colors.tableBorder || '#e5e7eb' }}>{getCurrencySymbol()}{taxTotal.toFixed(2)}</td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <td className="px-2 py-1 border font-medium" style={{ borderColor: colors.tableBorder || '#e5e7eb' }}>CGST</td>
                      <td className="px-2 py-1 border text-right font-medium" style={{ borderColor: colors.tableBorder || '#e5e7eb' }}>{getCurrencySymbol()}{(taxTotal / 2).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1 border font-medium" style={{ borderColor: colors.tableBorder || '#e5e7eb' }}>SGST</td>
                      <td className="px-2 py-1 border text-right font-medium" style={{ borderColor: colors.tableBorder || '#e5e7eb' }}>{getCurrencySymbol()}{(taxTotal / 2).toFixed(2)}</td>
                    </tr>
                  </>
                )}
                {roundOff !== 0 && (
                  <tr>
                    <td className="px-2 py-1 border font-medium" style={{ borderColor: colors.tableBorder || '#e5e7eb' }}>
                      Round Off
                    </td>
                    <td className="px-2 py-1 border text-right font-medium" style={{ borderColor: colors.tableBorder || '#e5e7eb' }}>
                      {roundOff >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOff.toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr style={totalRowStyle}>
                  <td className="px-2 py-1.5 border font-bold">
                    Grand Total
                  </td>
                  <td className="px-2 py-1.5 border text-right font-bold text-sm">
                    {getCurrencySymbol()}{finalTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
            
            {/* Amount in Words */}
            {sections.showAmountInWords !== false && (
              <div className="mt-1 text-xs text-right text-gray-600">
                <span className="font-medium italic">
                  {amountInWords(finalTotal)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Terms & Signature Row */}
      <div className="flex justify-between gap-6 pt-2" style={{ borderTop: `1px solid ${colors.tableBorder || '#e5e7eb'}` }}>
        {/* Terms */}
        {sections.showTerms !== false && content.termsAndConditions?.length > 0 && (
          <div className="flex-1">
            <h4 className="font-bold mb-1 text-xs" style={{ color: colors.secondary || '#4b5563' }}>
              Terms & Conditions
            </h4>
            <ul className="space-y-0.5 text-[10px] text-gray-500">
              {content.termsAndConditions.map((term, i) => (
                <li key={i}>• {term}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Signature */}
        {sections.showSignature !== false && (
          <div className="w-44 text-center ml-auto">
            <div 
              className="border-b mb-1 h-12"
              style={{ borderColor: colors.text || '#1f2937' }}
            />
            <p className="text-[10px] font-medium" style={{ color: colors.secondary || '#4b5563' }}>
              {content.signatureLabel || (isDeliveryChallan ? 'Received By / Signatory' : 'Authorized Signatory')}
            </p>
          </div>
        )}
      </div>
      
      {/* Branding footer */}
      <div className="invoice-page-footer pt-1">
        {content.footerNote && (
          <div 
            className="text-center mt-2 pt-1 text-[10px] text-gray-500"
            style={{ borderTop: `1px dashed ${colors.tableBorder || '#e5e7eb'}` }}
          >
            {content.footerNote}
          </div>
        )}
        
        <div className="mt-1 text-center text-[9px] text-gray-400 font-medium">
          {isDeliveryChallan
            ? 'This is a computer generated delivery challan and does not require a signature.'
            : 'This is a computer generated digital invoice and does not require a signature.'}
        </div>
        
        {showWatermarkFooter && (
          <div className="mt-1 text-center text-[9px] text-gray-400 print-watermark">
            Made with Cenvora: Built for Modern Businesses • <a href="https://cenvora.co.in" className="text-blue-500 font-medium" target="_blank" rel="noreferrer">https://cenvora.co.in</a>
          </div>
        )}
      </div>
    </div>
  );
};

// Intermediate Page Continuation Marker
const ClassicContinuation = ({ pageNumber, totalPages }) => {
  return (
    <div className="invoice-part-continuation mt-auto flex-shrink-0 pt-2 pb-1 border-t border-dashed border-gray-300 flex justify-between items-center text-xs text-gray-500 font-medium">
      <span>Continued on next page...</span>
      <span>Page {pageNumber} of {totalPages}</span>
    </div>
  );
};

// Main Unified Multi-Page Classic Template
const ClassicTemplate = forwardRef(({ 
  invoice = {}, 
  template = {}, 
  businessInfo = {},
  invoiceSettings = {},
  scale = 1,
  showWatermark = false,
}, ref) => {
  
  // Merge with defaults
  const colors = template.colors || {};
  const typography = template.typography || {};
  const sections = template.sections || {};
  const content = template.content || {};
  const columns = template.columns || [];
  const styles = template.styles || {};
  const branding = template.branding || {};
  
  // Get business info
  const companyName = branding.useBusinessName !== false 
    ? (businessInfo.business_name || businessInfo.businessName || 'Your Business Name')
    : (branding.customName || 'Your Business Name');
  
  const companyAddress = businessInfo.business_address || businessInfo.address || '';
  const companyPhone = businessInfo.phone || '';
  const companyEmail = businessInfo.email || '';
  const companyGST = businessInfo.gstin || businessInfo.gst || '';
  const companyPAN = businessInfo.pan_number || businessInfo.pan || '';
  const companyGEM = businessInfo.gem_id || '';
  const companyDL = businessInfo.dl_number || '';

  const bankName = businessInfo.bank_name || content.bankDetails?.bankName || '';
  const bankAccount = businessInfo.bank_account_number || content.bankDetails?.accountNumber || '';
  const bankIfsc = businessInfo.bank_ifsc_code || content.bankDetails?.ifscCode || '';
  const bankBranch = businessInfo.bank_branch || content.bankDetails?.branch || '';
  const bankUpi = businessInfo.bank_upi_id || '';
  const bankQr = businessInfo.bank_qr_code || '';
  const hasBankDetails = Boolean(bankName || bankAccount || bankIfsc || bankUpi || bankQr);
  
  // Invoice data
  const rawItems = Array.isArray(invoice.items) ? invoice.items : [];
  const customerName = invoice.customer_name || 'Customer Name';
  const billingAddress = invoice.customer_address || invoice.customer?.address || invoice.customer_details?.address || '';
  const shippingAddress = invoice.delivery_address || invoice.shipping_address || invoice.customer?.delivery_address || invoice.customer_details?.delivery_address || '';
  const customerGST = invoice.customer_gstin || invoice.gstin || '';
  const invoiceNumber = invoice.invoice_number || 'INV-0001';
  const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : '';
  const poNumber = invoice.po_number || '';
  const poDate = invoice.po_date ? new Date(invoice.po_date).toLocaleDateString('en-IN') : '';
  const challanNumber = invoice.challan_number || invoice.delivery_challan_number || '';
  const challanDate = invoice.challan_date ? new Date(invoice.challan_date).toLocaleDateString('en-IN') : '';
  const roundOff = parseFloat(invoice.round_off || 0) || 0;
  const hasSeparateShipping = Boolean(shippingAddress && shippingAddress.trim() !== billingAddress.trim());
  
  // Tax type determination
  const taxType = getTaxType(invoice, businessInfo);
  const isIGST = taxType === 'igst';
  
  // Calculate totals factoring in discounts
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
  
  // Dynamic Styles
  const paperStyle = {
    backgroundColor: '#ffffff',
    color: colors.text || '#1f2937',
    fontFamily: typography.fontFamily || 'Inter, sans-serif',
    fontSize: `${typography.bodySize || 10}px`,
  };

  const headerStyle = {
    fontFamily: typography.headingFontFamily || typography.fontFamily || 'Inter, sans-serif',
  };

  const tableHeaderStyle = {
    backgroundColor: colors.tableHeader || '#d11f1f',
    color: colors.tableHeaderText || '#ffffff',
  };

  const totalRowStyle = {
    backgroundColor: colors.totalBackground || '#f3f4f6',
    color: colors.totalText || '#111827',
  };

  // Determine if Delivery Challan
  const isDeliveryChallan = Boolean(
    invoice.is_delivery_challan || 
    invoice.challan_number || 
    invoice.document_type === 'delivery_challan' ||
    challanNumber
  );

  // Filter visible columns
  const defaultColumns = [
    { id: 'serial', label: 'Sr.', visible: true, width: '4%' },
    { id: 'description', label: 'Item & Description', visible: true, width: '38%' },
    { id: 'hsn', label: 'HSN', visible: true, width: '10%' },
    { id: 'quantity', label: 'Qty', visible: true, width: '8%' },
    { id: 'unit', label: 'Unit', visible: true, width: '6%' },
    { id: 'price', label: 'Price', visible: true, width: '10%' },
    { id: 'discount', label: 'Disc %', visible: true, width: '8%' },
    { id: 'tax', label: 'Tax %', visible: true, width: '6%' },
    { id: 'amount', label: 'Amount', visible: true, width: '10%' },
  ];

  const visibleColumns = (columns.length > 0 ? columns : defaultColumns).filter(col => {
    if (isDeliveryChallan && ['price', 'discount', 'tax', 'amount'].includes(col.id)) return false;
    return col.visible !== false;
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
    if (col.label) return col.label;
    switch (col.id) {
      case 'serial': return 'SR.';
      case 'description': return 'DESCRIPTION';
      case 'hsn': return 'HSN';
      case 'quantity': return 'QTY';
      case 'free_qty': return 'FREE';
      case 'unit': return 'UNIT';
      case 'make': return 'MAKE';
      case 'pack_size': return 'PACK';
      case 'price': return 'PRICE';
      case 'discount': return 'DISC';
      case 'tax': return 'TAX';
      case 'amount': return 'AMOUNT';
      default: return col.id.toUpperCase();
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
              ...paperStyle,
              width: '210mm',
              height: '297mm',
              minHeight: '297mm',
              maxHeight: '297mm',
              padding: '10mm',
              boxSizing: 'border-box',
              margin: '0 auto',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
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
            <ClassicHeader
              content={content}
              sections={sections}
              colors={colors}
              typography={typography}
              isDeliveryChallan={isDeliveryChallan}
              challanNumber={challanNumber}
              invoiceNumber={invoiceNumber}
              challanDate={challanDate}
              invoiceDate={invoiceDate}
              poNumber={poNumber}
              poDate={poDate}
              dueDate={dueDate}
              invoice={invoice}
              customerName={customerName}
              customerGST={customerGST}
              billingAddress={billingAddress}
              shippingAddress={shippingAddress}
              hasSeparateShipping={hasSeparateShipping}
              companyName={companyName}
              companyAddress={companyAddress}
              companyPhone={companyPhone}
              companyEmail={companyEmail}
              companyGST={companyGST}
              companyPAN={companyPAN}
              companyGEM={companyGEM}
              companyDL={companyDL}
              headerStyle={headerStyle}
              pageNumber={pageNumber}
              totalPages={totalPages}
            />

            {/* Part 2: Middle Item List */}
            <ClassicItemList
              items={pageItems}
              visibleColumns={visibleColumns}
              colors={colors}
              styles={styles}
              typography={typography}
              invoiceSettings={invoiceSettings}
              getColumnWidth={getColumnWidth}
              getColumnLabel={getColumnLabel}
              tableHeaderStyle={tableHeaderStyle}
              startIndex={startIndex}
            />

            {/* Part 3: Sticky Footer or Continuation */}
            {isLastPage ? (
              <ClassicFooter
                sections={sections}
                content={content}
                colors={colors}
                typography={typography}
                isDeliveryChallan={isDeliveryChallan}
                hasBankDetails={hasBankDetails}
                bankName={bankName}
                bankAccount={bankAccount}
                bankIfsc={bankIfsc}
                bankBranch={bankBranch}
                bankUpi={bankUpi}
                bankQr={bankQr}
                isIGST={isIGST}
                subtotal={subtotal}
                taxTotal={taxTotal}
                roundOff={roundOff}
                finalTotal={finalTotal}
                totalRowStyle={totalRowStyle}
                showWatermarkFooter={showWatermarkFooter}
              />
            ) : (
              <ClassicContinuation
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

ClassicTemplate.displayName = 'ClassicTemplate';
export default ClassicTemplate;
