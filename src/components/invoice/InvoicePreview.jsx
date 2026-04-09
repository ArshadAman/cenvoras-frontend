import React, { forwardRef } from 'react';
import { amountInWords } from '../../utils/invoiceSettings';

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
  const companyGEM = businessInfo.gem_id || '';
  
  // Invoice data
  const items = invoice.items || [];
  const customerName = invoice.customer_name || 'Customer Name';
  const customerAddress = invoice.customer_address || invoice.delivery_address || '';
  const customerGST = invoice.customer_gstin || invoice.gstin || '';
  const invoiceNumber = invoice.invoice_number || 'INV-0001';
  const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : '';
  const poNumber = invoice.po_number || '';
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity || 0);
    const price = parseFloat(item.price || 0);
    return sum + (qty * price);
  }, 0);
  
  const taxTotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity || 0);
    const price = parseFloat(item.price || 0);
    const tax = parseFloat(item.tax || 0);
    return sum + ((qty * price * tax) / 100);
  }, 0);
  
  const grandTotal = subtotal + taxTotal;
  
  // Dynamic styles
  const paperStyle = {
    fontFamily: typography.fontFamily || 'Inter, system-ui, sans-serif',
    fontSize: `${typography.bodySize || 11}px`,
    lineHeight: typography.lineHeight || 1.5,
    backgroundColor: colors.background || '#ffffff',
    color: colors.text || '#333333',
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
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
    backgroundColor: colors.totalRow || '#1a1a2e',
    color: colors.totalText || '#ffffff',
  };
  
  // Get visible columns
  const visibleColumns = columns
    .filter(col => col.show !== false)
    .filter(col => invoiceSettings.show_item_batch !== false || col.id !== 'batch')
    .filter(col => invoiceSettings.show_item_hsn !== false || col.id !== 'hsn')
    .filter(col => invoiceSettings.show_item_free_quantity !== false || col.id !== 'free_qty')
    .filter(col => invoiceSettings.show_item_discount !== false || col.id !== 'discount')
    .filter(col => invoiceSettings.show_item_tax !== false || col.id !== 'tax');
  
  return (
    <div 
      ref={ref}
      className="bg-white shadow-lg"
      style={{
        ...paperStyle,
        width: '210mm',
        padding: '8mm',
        boxSizing: 'border-box',
      }}
    >
      {/* Watermark */}
      {showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <span className="text-8xl font-bold text-gray-500 rotate-[-30deg]">PREVIEW</span>
        </div>
      )}
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-3 pb-2" style={{ borderBottom: `1px solid ${colors.accent || '#0f3460'}` }}>
        {/* Company Info - Left */}
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
            {sections.showGST && companyGST && <p className="font-medium">GSTIN: {companyGST}</p>}
            {sections.showGEMID && companyGEM && <p>GEM ID: {companyGEM}</p>}
          </div>
        </div>
        
        {/* Customer Info - Right */}
        <div className="text-right flex-1">
          <div className="mb-2" style={{ color: colors.secondary, fontSize: `${typography.sectionTitleSize || 12}px` }}>
            <span className="font-semibold">BILL TO</span>
          </div>
          <div className="font-bold text-base mb-1" style={{ color: colors.primary }}>
            {customerName}
          </div>
          <div className="space-y-0.5" style={{ color: colors.lightText, fontSize: `${typography.smallSize || 9}px` }}>
            {customerAddress && <p className="whitespace-pre-line">{customerAddress}</p>}
            {customerGST && <p className="font-medium">GSTIN: {customerGST}</p>}
          </div>
        </div>
      </div>
      
      {/* Invoice Title */}
      <div className="text-center mb-3">
        <h2 
          className="font-bold tracking-wide"
          style={{ 
            fontSize: `${typography.invoiceTitleSize || 18}px`,
            color: colors.primary,
            letterSpacing: '2px',
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
      
      {/* Invoice Details Row */}
      <div className="flex justify-between mb-3 text-sm">
        <div className="space-y-1">
          <div><span className="font-medium">Invoice #:</span> <span className="font-bold" style={{ color: colors.primary }}>{invoiceNumber}</span></div>
          <div><span className="font-medium">Date:</span> {invoiceDate}</div>
        </div>
        <div className="text-right space-y-1">
          {sections.showPONumber && poNumber && (
            <div><span className="font-medium">PO #:</span> {poNumber}</div>
          )}
          {sections.showDueDate && dueDate && (
            <div><span className="font-medium">Due Date:</span> {dueDate}</div>
          )}
        </div>
      </div>
      
      {/* Items Table */}
      <div className="mb-6">
        <table 
          className="w-full border-collapse"
          style={{ 
            borderRadius: styles.borderRadius || 0,
            overflow: 'hidden',
          }}
        >
          <thead style={{ display: 'table-header-group' }}>
            <tr style={tableHeaderStyle}>
              {visibleColumns.map(col => (
                <th 
                  key={col.id}
                  className="px-3 py-2 font-bold border"
                  style={{ 
                    width: col.width,
                    textAlign: col.align || 'left',
                    borderColor: colors.tableBorder,
                    fontSize: `${typography.smallSize || 9}px`,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((item, index) => {
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
                      case 'price': value = `₹${price.toFixed(2)}`; break;
                      case 'discount': value = discount > 0 ? `${discount}%` : '-'; break;
                      case 'tax': value = `${tax}%`; break;
                      case 'amount': value = `₹${amount.toFixed(2)}`; break;
                      default: value = '';
                    }
                    
                    return (
                      <td 
                        key={col.id}
                            className="px-2 py-1 border"
                        style={{ 
                          textAlign: col.align || 'left',
                          borderColor: colors.tableBorder,
                        }}
                      >
                            {col.id === 'description' ? (
                              <div>
                                <div>{item.product_detail?.name || item.product_name || item.product || ''}</div>
                                {invoiceSettings.show_item_description !== false && (item.product_detail?.description || item.product_description) ? (
                                  <div style={{ fontSize: `${typography.smallSize || 9}px`, color: colors.lightText || '#666' }}>
                                    {item.product_detail?.description || item.product_description}
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
      </div>
      
      {/* Bottom Section - Bank Details & Totals */}
      <div className="flex justify-between gap-6 mb-3">
        {/* Bank Details - Left */}
        {sections.showBankDetails && (
          <div className="flex-1">
            <h4 
              className="font-bold mb-2 pb-1"
              style={{ 
                color: colors.secondary,
                fontSize: `${typography.sectionTitleSize || 12}px`,
                borderBottom: `1px solid ${colors.tableBorder}`,
              }}
            >
              Bank Details
            </h4>
            <div className="space-y-1 text-sm" style={{ color: colors.lightText }}>
              {content.bankDetails?.bankName && (
                <p><span className="font-medium">Bank:</span> {content.bankDetails.bankName}</p>
              )}
              {content.bankDetails?.accountNumber && (
                <p><span className="font-medium">A/C No:</span> {content.bankDetails.accountNumber}</p>
              )}
              {content.bankDetails?.ifscCode && (
                <p><span className="font-medium">IFSC:</span> {content.bankDetails.ifscCode}</p>
              )}
              {content.bankDetails?.accountHolder && (
                <p><span className="font-medium">Name:</span> {content.bankDetails.accountHolder}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Totals - Right */}
        <div className="w-64">
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr>
                <td className="px-3 py-2 border font-medium" style={{ borderColor: colors.tableBorder }}>
                  Subtotal
                </td>
                <td className="px-3 py-2 border text-right" style={{ borderColor: colors.tableBorder }}>
                  ₹{subtotal.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border font-medium" style={{ borderColor: colors.tableBorder }}>
                  Tax (GST)
                </td>
                <td className="px-3 py-2 border text-right" style={{ borderColor: colors.tableBorder }}>
                  ₹{taxTotal.toFixed(2)}
                </td>
              </tr>
              <tr style={totalRowStyle}>
                <td className="px-3 py-3 border font-bold">
                  TOTAL
                </td>
                <td className="px-3 py-3 border text-right font-bold text-lg">
                  ₹{grandTotal.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
          
          {/* Amount in Words */}
          {sections.showAmountInWords && (
            <div className="mt-3 text-xs" style={{ color: colors.lightText }}>
              <span className="font-medium">In Words:</span>
              <br />
              <span className="font-semibold" style={{ color: colors.text }}>
                {amountInWords(grandTotal)}
              </span>
            </div>
          )}
        </div>
      </div>
      
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
          <div className="w-48 text-center">
            <div 
              className="border-b-2 mb-2 h-16"
              style={{ borderColor: colors.text }}
            />
            <p className="text-xs font-medium" style={{ color: colors.secondary }}>
              {content.signatureLabel || 'Authorized Signatory'}
            </p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      {content.footerNote && (
        <div 
          className="text-center mt-8 pt-4 text-xs"
          style={{ 
            color: colors.lightText,
            borderTop: `1px dashed ${colors.tableBorder}`,
          }}
        >
          {content.footerNote}
        </div>
      )}
    </div>
  );
});

InvoicePreview.displayName = 'InvoicePreview';

export default InvoicePreview;
