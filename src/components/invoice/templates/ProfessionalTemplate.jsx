import React, { forwardRef } from 'react';
import { amountInWords } from '../../../utils/invoiceSettings';

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
  const customerName = invoice.customer_name || 'Customer Name';
  const billingAddress = invoice.customer_address || invoice.customer?.address || '';
  const shippingAddress = invoice.delivery_address || invoice.shipping_address || '';
  const invoiceNumber = invoice.invoice_number || 'INV-001';
  const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const items = invoice.items || [];
  
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0);
  const taxTotal = items.reduce((sum, item) => sum + ((parseFloat(item.quantity||0) * parseFloat(item.price||0) * parseFloat(item.tax||0)) / 100), 0);
  const finalTotal = subtotal + taxTotal + (parseFloat(invoice.round_off || 0));

  const visibleColumns = columns.filter(col => col.show !== false);

  return (
    <div 
      ref={ref}
      style={{
        width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box',
        backgroundColor: colors.background || '#ffffff', color: colors.text || '#333333',
        fontFamily: typography.fontFamily, fontSize: `${typography.bodySize || 10}px`,
        transform: `scale(${scale})`, transformOrigin: 'top left', border: `1px solid ${colors.tableBorder || '#e2e8f0'}`,
        borderRadius: '12px'
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
            {sections.showGST && companyGST && <p><strong>GSTIN:</strong> {companyGST}</p>}
          </div>
        </div>
        <div className="text-right w-1/2">
          <h2 className="text-2xl font-bold tracking-widest mb-4" style={{ color: '#1f2937' }}>
            {content.invoiceTitle || 'TAX INVOICE'}
          </h2>
          <div className="grid grid-cols-2 gap-4 text-left ml-auto max-w-xs border border-gray-200 p-3 bg-gray-50/50">
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-0.5">Invoice No</p>
              <p className="font-bold">{invoiceNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-0.5">Date</p>
              <p className="font-bold">{invoiceDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To & Ship To */}
      <div className="grid grid-cols-3 gap-6 mb-8 text-sm">
        <div className="col-span-1">
          <h3 className="font-bold border-b pb-1 mb-2" style={{ borderColor: colors.primary }}>Bill To</h3>
          <p className="font-bold">{customerName}</p>
          <p className="whitespace-pre-line text-gray-600">{billingAddress}</p>
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
      <table className="w-full text-left border-collapse mb-8">
        <thead>
          <tr className="border-y-2 border-gray-900 bg-gray-50 h-10">
            {visibleColumns.map(col => (
              <th key={col.id} className="px-2 text-xs font-bold uppercase tracking-wider">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item, idx) => (
            <tr key={idx} className="h-12 hover:bg-gray-50 transition-colors">
              {visibleColumns.map(col => {
                let val = '';
                if(col.id==='serial') val = idx+1;
                else if(col.id==='description') val = item.product_name || item.product;
                else if(col.id==='quantity') val = item.quantity;
                else if(col.id==='price') val = `₹${parseFloat(item.price||0).toFixed(2)}`;
                else if(col.id==='tax') val = `${item.tax||0}%`;
                else if(col.id==='amount') val = `₹${(item.quantity * item.price).toFixed(2)}`;
                else if(col.id==='hsn') val = item.hsn_sac_code || '-';
                return <td key={col.id} className="px-2 font-medium text-gray-800">{val}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals & Details */}
      <div className="flex justify-between">
        <div className="w-1/2 pr-8">
          {sections.showBankDetails && (
             <div className="mb-6">
                <p className="font-bold text-xs uppercase tracking-wider mb-2 text-gray-500">Bank Details</p>
                <div className="text-xs text-gray-700 bg-gray-50 p-4 rounded-lg">
                  <p><span className="font-semibold w-16 inline-block">Bank:</span> {content.bankDetails?.bankName}</p>
                  <p><span className="font-semibold w-16 inline-block">A/C No:</span> {content.bankDetails?.accountNumber}</p>
                  <p><span className="font-semibold w-16 inline-block">IFSC:</span> {content.bankDetails?.ifscCode}</p>
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
            <div className="flex justify-between p-3 border-b border-gray-100 text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-bold">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-3 border-b border-gray-100 text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-bold">₹{taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-4 bg-gray-50 text-base">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-indigo-600">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>
          {sections.showAmountInWords && (
            <p className="text-xs text-right mt-3 text-gray-500 italic">
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
    </div>
  );
});

ProfessionalTemplate.displayName = 'ProfessionalTemplate';
export default ProfessionalTemplate;
