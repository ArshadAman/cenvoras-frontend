import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';
import { getTaxType, splitTax } from '../../../utils/taxUtils';
import { getCurrencySymbol, getCountryCode, formatCurrency } from '../../../utils/currency';

// Beautiful Invoice Preview Component
// Renders invoice based on template settings with dynamic styling

const InvoicePreview = forwardRef(({ 
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
  const bankBranch = businessInfo.bank_branch || content.bankDetails?.accountHolder || '';
  const bankUpi = businessInfo.bank_upi_id || '';
  const bankQr = businessInfo.bank_qr_code || '';
  const hasBankDetails = Boolean(bankName || bankAccount || bankIfsc || bankUpi || bankQr);
  
  // Invoice data
  const items = invoice.items || [];
  const customerName = invoice.customer_name || 'Customer Name';
  const billingAddress = invoice.customer_address || invoice.customer?.address || invoice.customer_details?.address || '';
  const shippingAddress = invoice.delivery_address || invoice.shipping_address || invoice.customer?.delivery_address || invoice.customer_details?.delivery_address || '';
  const customerGST = invoice.customer_gstin || invoice.gstin || '';
  const invoiceNumber = invoice.invoice_number || 'INV-0001';
  const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : '';
  const poNumber = invoice.po_number || '';
  const poDate = invoice.po_date ? new Date(invoice.po_date).toLocaleDateString('en-IN') : '';
  const challanNumber = invoice.challan_number || '';
  const challanDate = invoice.challan_date ? new Date(invoice.challan_date).toLocaleDateString('en-IN') : '';
  const roundOff = parseFloat(invoice.round_off || 0) || 0;
  const customerAddress = billingAddress;
  const hasSeparateShipping = Boolean(
    shippingAddress && shippingAddress.trim() !== billingAddress.trim()
  );
  
  // Tax type determination
  const taxType = getTaxType(invoice, businessInfo);
  const isIGST = taxType === 'igst';
  
  // Calculate totals factoring in discounts
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
  
  const grandTotal = subtotal + taxTotal;
  const finalTotal = invoice.total_amount != null
    ? parseFloat(invoice.total_amount)
    : Number((grandTotal + roundOff).toFixed(2));
  
  const planCode = businessInfo.plan_code || 'free';
  const showWatermarkFooter = planCode !== 'business';
  
  const isDeliveryChallan = 
    invoice.document_type === 'delivery_challan' || 
    invoice.is_delivery_challan || 
    content.invoiceTitle === 'DELIVERY CHALLAN' || 
    Boolean(invoice.challan_number && !invoice.invoice_number);

  // Dynamic styles
  const paperStyle = {
    fontFamily: typography.fontFamily || 'Inter, system-ui, sans-serif',
    fontSize: `${typography.bodySize || 11}px`,
    lineHeight: typography.lineHeight || 1.5,
    backgroundColor: colors.background || '#ffffff',
    color: colors.text || '#333333',
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '297mm',
  };
  
  const headerStyle = {
    color: colors.primary || '#1a1a2e',
    fontSize: `${typography.companyNameSize || 24}px`,
    fontFamily: typography.headerFont || typography.fontFamily,
  };
  
  const tableHeaderStyle = {
    backgroundColor: colors.tableHeader || '#f8fafc',
    borderColor: colors.tableBorder || '#e5e7eb',
  };
  
  const totalRowStyle = {
    backgroundColor: '#e5e7eb',
    color: '#111827',
  };
  
  const hasAnyDiscount = (items || []).some(item => Number(item?.discount || 0) > 0);

  // Get visible columns
  const visibleColumns = columns
    .filter(col => col.show !== false)
    .filter(col => invoiceSettings.show_item_batch !== false || col.id !== 'batch')
    .filter(col => invoiceSettings.show_item_hsn !== false || col.id !== 'hsn')
    .filter(col => invoiceSettings.show_item_free_quantity !== false || col.id !== 'free_qty')
    .filter(col => (invoiceSettings.show_item_discount !== false && hasAnyDiscount) || col.id !== 'discount')
    .filter(col => invoiceSettings.show_item_tax !== false || col.id !== 'tax');

  const preferredWidths = {
    serial: 6,
    description: 0,
    batch: 10,
    hsn: 12,
    quantity: 7,
    free_qty: 7,
    unit: 8,
    price: 14,
    discount: 9,
    tax: 9,
    amount: 18,
  };

  const nonDescriptionWidth = visibleColumns
    .filter((col) => col.id !== 'description')
    .reduce((sum, col) => sum + (preferredWidths[col.id] || 10), 0);
  const descriptionWidth = Math.max(100 - nonDescriptionWidth, 20);

  const getColumnWidth = (columnId) => {
    if (columnId === 'description') return `${descriptionWidth}%`;
    return `${preferredWidths[columnId] || 10}%`;
  };

  const getColumnLabel = (col) => {
    if (col.id === 'serial') return 'Sl.';
    return col.label;
  };
  
  return (
    <div 
      ref={ref}
      className="bg-white"
      style={{
        ...paperStyle,
        width: '210mm',
        minHeight: '297mm',
        padding: '10mm',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Watermark */}
      {showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <span className="text-8xl font-bold text-gray-500 rotate-[-30deg]">PREVIEW</span>
        </div>
      )}
      
      {/* Header Section */}
      <div
        className="mb-4"
        style={{
          backgroundColor: '#ececec',
          margin: '-10mm -10mm 0 -10mm',
          padding: '8mm 10mm 5mm 10mm',
          borderBottomLeftRadius: '120% 28px',
          borderBottomRightRadius: '120% 28px',
        }}
      >
        <div className="flex justify-end">
          <div className="text-right" style={{ maxWidth: '58%' }}>
            <h1 className="font-semibold mb-1" style={{ ...headerStyle, color: '#d11f1f', fontSize: `${typography.companyNameSize || 22}px` }}>
              {companyName}
            </h1>
            <div className="space-y-0.5" style={{ color: '#1f2937', fontSize: `${typography.smallSize || 9}px` }}>
              {companyAddress && <p className="whitespace-pre-line">{companyAddress}</p>}
              {(companyPhone || companyEmail) && (
                <p>
                  {companyPhone ? `Ph- ${companyPhone}` : ''}
                  {companyPhone && companyEmail ? ', ' : ''}
                  {companyEmail ? `email-${companyEmail}` : ''}
                </p>
              )}
              {sections.showGST && companyGST && <p className="font-medium">{getCountryCode() === 'IN' ? 'GSTIN: ' : 'TRN: '}{companyGST}</p>}
              {companyPAN && <p className="font-medium">PAN: {companyPAN}</p>}
              {sections.showGEMID && companyGEM && <p className="font-medium">GEM ID- {companyGEM}</p>}
              {companyDL && <p className="font-medium">DL No- {companyDL}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="flex justify-between items-start mb-5 gap-8">
        <div className="flex-1 rounded-lg border border-white/10 bg-white/60 p-3">
          <div className="font-semibold mb-2 uppercase tracking-wide" style={{ color: colors.secondary, fontSize: `${typography.sectionTitleSize || 12}px` }}>
            Billing Address
          </div>
          <div className="space-y-0.5" style={{ color: colors.text, fontSize: `${typography.bodySize || 11}px` }}>
            <div className="font-medium">{customerName}</div>
            {billingAddress && <p className="whitespace-pre-line">{billingAddress}</p>}
            {customerGST && <p className="font-medium">{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {customerGST}</p>}
          </div>
        </div>

        {hasSeparateShipping ? (
          <div className="flex-1 rounded-lg border border-white/10 bg-white/60 p-3">
            <div className="font-semibold mb-2 uppercase tracking-wide" style={{ color: colors.secondary, fontSize: `${typography.sectionTitleSize || 12}px` }}>
              Shipping Address
            </div>
            <div className="space-y-0.5" style={{ color: colors.text, fontSize: `${typography.bodySize || 11}px` }}>
              <div className="whitespace-pre-line">{shippingAddress}</div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Legacy Header Hidden For New A4 Layout */}
      <div className="hidden">
        <div className="flex justify-between items-start mb-3 pb-2" style={{ borderBottom: `1px solid ${colors.accent || '#0f3460'}` }}>
          <div className="flex-1">
          {/* Logo */}
          {sections.showLogo && branding.logo && (
            <img 
              src={branding.logo} 
              alt="Logo" 
              className="mb-3"
              style={{ 
                maxWidth: branding.logoSize?.width || 120,
                maxHeight: branding.logoSize?.height || 60,
              }}
            />
          )}
          
          {/* Company Name */}
          <h1 className="font-bold mb-2" style={headerStyle}>
            {companyName}
          </h1>
          
          {/* Tagline */}
          {sections.showTagline && branding.tagline && (
            <p className="text-sm italic mb-2" style={{ color: colors.lightText }}>
              {branding.tagline}
            </p>
          )}
          
          {/* Company Details */}
          <div className="space-y-0.5" style={{ color: colors.lightText, fontSize: `${typography.smallSize || 9}px` }}>
            {companyAddress && <p className="whitespace-pre-line">{companyAddress}</p>}
            {companyPhone && <p>Ph: {companyPhone}</p>}
            {companyEmail && <p>Email: {companyEmail}</p>}
            {sections.showGST && companyGST && <p className="font-medium">{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {companyGST}</p>}
            {sections.showGEMID && companyGEM && <p>GEM ID: {companyGEM}</p>}
            {companyDL && <p>DL No: {companyDL}</p>}
          </div>
          </div>
          <div className="text-right flex-1">
          <div className="mb-2" style={{ color: colors.secondary, fontSize: `${typography.sectionTitleSize || 12}px` }}>
            <span className="font-semibold">BILL TO</span>
          </div>
          <div className="font-bold text-base mb-1" style={{ color: colors.primary }}>
            {customerName}
          </div>
          <div className="space-y-0.5" style={{ color: colors.lightText, fontSize: `${typography.smallSize || 9}px` }}>
            {customerAddress && <p className="whitespace-pre-line">{customerAddress}</p>}
            {customerGST && <p className="font-medium">{getCountryCode() === 'IN' ? 'GSTIN:' : 'TRN:'} {customerGST}</p>}
          </div>
          </div>
        </div>
      </div>
      
      {/* Invoice Title */}
      <div className="text-center mb-4">
        <h2 
          className="font-bold tracking-wide"
          style={{ 
            fontSize: `${typography.invoiceTitleSize || 20}px`,
            color: '#111827',
            letterSpacing: '1px',
          }}
        >
          {content.invoiceTitle || 'TAX INVOICE'}
        </h2>
        {content.invoiceSubtitle && (
          <p className="text-sm mt-1" style={{ color: colors.lightText }}>
            {content.invoiceSubtitle}
          </p>
        )}
      </div>
      
      {/* Invoice / Challan Details Row */}
      <div className="flex justify-between mb-4 text-sm">
        <div className="space-y-1">
          <div>
            <span className="font-medium">{isDeliveryChallan ? 'Challan #:' : 'Invoice #:'}</span>{' '}
            <span className="font-bold" style={{ color: colors.primary }}>
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
        <div className="text-right space-y-1">
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

      <div className="mb-4" style={{ height: '7px', backgroundColor: '#ece8e8', borderRadius: '999px' }} />
      
      {/* Items Table */}
      <div className="mb-5">
        {isDeliveryChallan ? (
          <table 
            className="w-full border-collapse"
            style={{ 
              borderRadius: styles.borderRadius || 0,
              overflow: 'hidden',
              tableLayout: 'fixed',
            }}
          >
            <thead style={{ display: 'table-header-group' }}>
              <tr style={tableHeaderStyle}>
                <th className="px-3 py-2 font-bold border text-center" style={{ width: '8%', borderColor: colors.tableBorder, fontSize: `${typography.smallSize || 10}px`, whiteSpace: 'nowrap' }}>Sl.</th>
                <th className="px-3 py-2 font-bold border text-left" style={{ width: '48%', borderColor: colors.tableBorder, fontSize: `${typography.smallSize || 10}px`, whiteSpace: 'nowrap' }}>Item & Description</th>
                <th className="px-3 py-2 font-bold border text-center" style={{ width: '14%', borderColor: colors.tableBorder, fontSize: `${typography.smallSize || 10}px`, whiteSpace: 'nowrap' }}>Qty</th>
                <th className="px-3 py-2 font-bold border text-left" style={{ width: '15%', borderColor: colors.tableBorder, fontSize: `${typography.smallSize || 10}px`, whiteSpace: 'nowrap' }}>Make</th>
                <th className="px-3 py-2 font-bold border text-left" style={{ width: '15%', borderColor: colors.tableBorder, fontSize: `${typography.smallSize || 10}px`, whiteSpace: 'nowrap' }}>Pack Size</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item, index) => {
                if (item.row_type === 'note') {
                  return (
                    <tr key={index} style={{ backgroundColor: '#fbfbfb' }}>
                      <td colSpan={5} className="px-3 py-1.5 border text-left text-xs text-slate-700 italic font-medium" style={{ borderColor: colors.tableBorder }}>
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
                  <tr 
                    key={index}
                    style={{
                      backgroundColor: styles.tableStyle === 'striped' && index % 2 === 1 
                        ? colors.tableStripe 
                        : 'transparent',
                      paddingTop: '0.6px',
                      paddingBottom: '0.6px',
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    <td className="border text-center align-middle font-medium" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle', borderColor: colors.tableBorder, fontSize: `${typography.bodySize || 11}px` }}>
                      {index + 1}
                    </td>
                    <td className="border align-middle" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle', borderColor: colors.tableBorder, fontSize: `${typography.bodySize || 11}px` }}>
                      <div className="font-normal text-gray-900">{item.product_detail?.name || item.product_name || item.product || ''}</div>
                      {invoiceSettings.show_item_manufacturer !== false && (item.manufacturer || item.product_detail?.manufacturer) && (
                        <div className="text-[10px] text-gray-500 font-medium italic mt-0.5">
                          Mfr: {item.manufacturer || item.product_detail?.manufacturer}
                        </div>
                      )}
                      {desc && (
                        <div className="whitespace-pre-line text-gray-500 mt-0.5 leading-tight font-normal" style={{ fontSize: `${typography.smallSize || 9}px`, wordBreak: 'break-word' }}>
                          {desc}
                        </div>
                      )}
                    </td>
                    <td className="border text-center align-middle font-semibold text-gray-900" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle', borderColor: colors.tableBorder, fontSize: `${typography.bodySize || 11}px` }}>
                      {qty} {unit}
                    </td>
                    <td className="border align-middle text-gray-700" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle', borderColor: colors.tableBorder, fontSize: `${typography.bodySize || 11}px` }}>
                      {make}
                    </td>
                    <td className="border align-middle text-gray-700" style={{ paddingTop: '0.6px', paddingBottom: '0.6px', paddingLeft: '8px', paddingRight: '8px', margin: 0, lineHeight: 1.2, verticalAlign: 'middle', borderColor: colors.tableBorder, fontSize: `${typography.bodySize || 11}px` }}>
                      {packSize}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    No items added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
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
                    className="px-3 py-2 font-bold border"
                    style={{ 
                      width: getColumnWidth(col.id),
                      textAlign: col.align || 'left',
                      borderColor: colors.tableBorder,
                      fontSize: `${typography.smallSize || 10}px`,
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
                if (item.row_type === 'note') {
                  return (
                    <tr key={index} style={{ backgroundColor: '#fbfbfb' }}>
                      <td
                        colSpan={visibleColumns.length}
                        className="border px-3 py-1.5 text-xs text-slate-700 italic text-left font-medium"
                        style={{ borderColor: colors.tableBorder }}
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
                        ? colors.tableStripe 
                        : 'transparent',
                      paddingTop: '0.6px',
                      paddingBottom: '0.6px',
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {visibleColumns.map(col => {
                      let value = '';
                      switch(col.id) {
                        case 'serial': value = index + 1; break;
                        case 'description': value = item.product_detail?.name || item.product_name || item.product || ''; break;
                        case 'batch': value = item.batch_number || item.batch?.batch_number || item.batch || '-'; break;
                        case 'hsn': value = item.hsn_sac_code || item.hsn_code || ''; break;
                        case 'quantity': value = qty; break;
                        case 'free_qty': value = item.free_quantity || 0; break;
                        case 'unit': value = item.unit || 'pcs'; break;
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
                            paddingTop: '0.6px',
                            paddingBottom: '0.6px',
                            paddingLeft: '8px',
                            paddingRight: '8px',
                            margin: 0,
                            lineHeight: 1.2,
                            fontSize: '12px',
                            textAlign: isDesc ? 'left' : isNum ? 'right' : 'center',
                            borderColor: colors.tableBorder,
                            wordBreak: isDesc ? 'break-word' : 'normal',
                            whiteSpace: isDesc ? 'normal' : 'nowrap',
                            verticalAlign: 'middle',
                          }}
                        >
                          {col.id === 'description' ? (
                            <div>
                              <div className="font-normal text-gray-900">{item.product_detail?.name || item.product_name || item.product || ''}</div>
                              {invoiceSettings.show_item_manufacturer !== false && (item.manufacturer || item.product_detail?.manufacturer) && (
                                <div className="text-[10px] text-gray-500 font-medium italic mt-0.5">
                                  Mfr: {item.manufacturer || item.product_detail?.manufacturer}
                                </div>
                              )}
                              {invoiceSettings.show_item_description !== false && (item.description || item.product_description || item.product_detail?.description) ? (
                                <div className="whitespace-pre-line" style={{ fontSize: `${typography.smallSize || 9}px`, color: colors.lightText || '#666', marginTop: '1px', lineHeight: 1.15, wordBreak: 'break-word' }}>
                                  {item.description || item.product_description || item.product_detail?.description}
                                </div>
                              ) : null}
                              {invoiceSettings.show_item_storage_condition && (item.product_detail?.storage_condition || item.product_detail?.temperature) ? (
                                <div style={{ fontSize: `${typography.smallSize || 9}px`, color: colors.lightText || '#666', marginTop: '1px', lineHeight: 1.15, fontWeight: 500 }}>
                                  {item.product_detail?.storage_condition ? `Storage: ${item.product_detail.storage_condition}` : ''}
                                  {item.product_detail?.storage_condition && item.product_detail?.temperature ? ' | ' : ''}
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
                    className="text-center py-8 text-gray-400"
                  >
                    No items added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Bottom Section - Bank Details & Totals (Hidden for Delivery Challans) */}
      {!isDeliveryChallan && (
        <div className="flex justify-between gap-6 mb-2">
          {/* Bank Details - Left */}
          {sections.showBankDetails && hasBankDetails && (
            <div className="flex-1 mr-8">
              <h4 
                className="font-bold mb-2 pb-1"
                style={{ 
                  color: colors.secondary,
                  fontSize: `${typography.sectionTitleSize || 12}px`,
                  borderBottom: `1px solid ${colors.tableBorder}`,
                }}
              >
                Our Bank Details:
              </h4>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 text-sm" style={{ color: colors.lightText }}>
                  {bankName && (
                    <p><span className="font-medium">Bank Name:</span> {bankName}</p>
                  )}
                  {bankAccount && (
                    <p><span className="font-medium">Account Number:</span> <span className="font-mono">{bankAccount}</span></p>
                  )}
                  {bankIfsc && (
                    <p><span className="font-medium">NEFT/IFSC Code:</span> <span className="font-mono">{bankIfsc}</span></p>
                  )}
                  {bankBranch && (
                    <p><span className="font-medium">Branch:</span> {bankBranch}</p>
                  )}
                  {bankUpi && (
                    <p><span className="font-medium">UPI / VPA:</span> <span className="font-mono">{bankUpi}</span></p>
                  )}
                </div>
                {sections.showQRCode !== false && bankQr && (
                  <div className="text-center flex-shrink-0">
                    <img 
                      src={bankQr} 
                      alt="Scan to Pay" 
                      className="w-16 h-16 object-contain rounded border border-gray-200 p-0.5 bg-white shadow-sm"
                    />
                    <span className="text-[9px] text-gray-500 block mt-0.5">Scan to Pay</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Totals - Right */}
          <div className="w-80">
            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr>
                  <td className="px-3 py-1.5 border font-medium" style={{ borderColor: colors.tableBorder }}>
                    Untaxed Amount
                  </td>
                  <td className="px-3 py-1.5 border text-right" style={{ borderColor: colors.tableBorder }}>
                    {getCurrencySymbol()}{subtotal.toFixed(2)}
                  </td>
                </tr>
                {isIGST ? (
                  <tr>
                    <td className="px-3 py-1.5 border font-medium" style={{ borderColor: colors.tableBorder }}>IGST</td>
                    <td className="px-3 py-1.5 border text-right" style={{ borderColor: colors.tableBorder }}>{getCurrencySymbol()}{taxTotal.toFixed(2)}</td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <td className="px-3 py-1.5 border font-medium" style={{ borderColor: colors.tableBorder }}>CGST</td>
                      <td className="px-3 py-1.5 border text-right" style={{ borderColor: colors.tableBorder }}>{getCurrencySymbol()}{(taxTotal / 2).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 border font-medium" style={{ borderColor: colors.tableBorder }}>SGST</td>
                      <td className="px-3 py-1.5 border text-right" style={{ borderColor: colors.tableBorder }}>{getCurrencySymbol()}{(taxTotal / 2).toFixed(2)}</td>
                    </tr>
                  </>
                )}
                {roundOff !== 0 && (
                  <tr>
                    <td className="px-3 py-1.5 border font-medium" style={{ borderColor: colors.tableBorder }}>
                      Round Off
                    </td>
                    <td className="px-3 py-1.5 border text-right" style={{ borderColor: colors.tableBorder }}>
                      {roundOff >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOff.toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr style={totalRowStyle}>
                  <td className="px-3 py-2 border font-bold">
                    Grand Total
                  </td>
                  <td className="px-3 py-2 border text-right font-bold text-lg">
                    {getCurrencySymbol()}{finalTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
            
            {/* Amount in Words */}
            {sections.showAmountInWords && (
              <div className="mt-2 text-sm text-right" style={{ color: colors.lightText }}>
                <span className="font-medium">Total amount in words:</span>
                <br />
                <span className="font-medium italic" style={{ color: colors.text }}>
                  {amountInWords(finalTotal)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Bottom Anchored Footer Section */}
      <div className="mt-auto">
        {/* Terms & Signature Row */}
        <div className="flex justify-between gap-6 mt-3 pt-3" style={{ borderTop: `1px solid ${colors.tableBorder}` }}>
          {/* Terms */}
          {sections.showTerms && content.termsAndConditions?.length > 0 && (
            <div className="flex-1">
              <h4 
                className="font-bold mb-2"
                style={{ 
                  color: colors.secondary,
                  fontSize: `${typography.sectionTitleSize || 12}px`,
                }}
              >
                Terms & Conditions
              </h4>
              <ul className="space-y-1 text-xs" style={{ color: colors.lightText }}>
                {content.termsAndConditions.map((term, i) => (
                  <li key={i}>• {term}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Signature */}
          {sections.showSignature && (
            <div className="w-48 text-center ml-auto">
              <div 
                className="border-b-2 mb-2 h-16"
                style={{ borderColor: colors.text }}
              />
              <p className="text-xs font-medium" style={{ color: colors.secondary }}>
                {content.signatureLabel || (isDeliveryChallan ? 'Received By / Signatory' : 'Authorized Signatory')}
              </p>
            </div>
          )}
        </div>
        
        {/* Footer Note */}
        {content.footerNote && (
          <div 
            className="text-center mt-6 pt-3 text-xs"
            style={{ 
              color: colors.lightText,
              borderTop: `1px dashed ${colors.tableBorder}`,
            }}
          >
            {content.footerNote}
          </div>
        )}
        
        <div className="mt-3 pt-2 text-center text-[10px] text-gray-500 font-medium">
          {isDeliveryChallan
            ? 'This is a computer generated delivery challan and does not require a signature.'
            : 'This is a computer generated digital invoice and does not require a signature.'}
        </div>
        
        {showWatermarkFooter && (
          <div className="mt-2 text-center text-[10px] text-gray-400 print-watermark">
            Made with Cenvora: Built for Modern Businesses<br />
            <a href="https://cenvora.co.in" className="text-blue-500 font-medium" target="_blank" rel="noreferrer">https://cenvora.co.in</a>
          </div>
        )}
      </div>
    </div>
  );
});

InvoicePreview.displayName = 'InvoicePreview';

export default InvoicePreview;
