import { numberToWords } from './invoiceSettings';

/**
 * invoiceEmailGenerator.js
 * 
 * Generates email-client compatible, responsive HTML invoices formatted
 * in the user's selected invoice theme (Classic, Professional Marico,
 * Service LTIMindtree, Legend ITC, or BillShip Flipkart).
 * 
 * Uses bulletproof inline CSS ensuring 100% visual fidelity in Gmail,
 * Outlook, Apple Mail, and mobile email clients.
 */

export function buildThemedInvoiceEmailHtml({
  invoice,
  template,
  businessInfo,
  currencySymbol = '₹',
  docTypeLabel = 'Tax Invoice'
}) {
  const layoutType = template?.layout?.layoutType || 'classic';
  const colors = template?.colors || {};
  const sections = template?.sections || {};
  const content = template?.content || {};

  // Theme Palette
  const primaryColor = colors.primary || (
    layoutType === 'professional' ? '#0a235c' :
    layoutType === 'service' ? '#174A82' :
    layoutType === 'legend' ? '#111827' :
    layoutType === 'billship' ? '#1f2937' :
    '#1a1a2e'
  );
  const accentColor = colors.accent || (
    layoutType === 'billship' ? '#f59e0b' :
    layoutType === 'legend' ? '#2563eb' :
    '#3b82f6'
  );
  const tableHeaderBg = colors.tableHeader || (
    layoutType === 'professional' ? '#f0f4fc' :
    layoutType === 'legend' ? '#f3f4f6' :
    '#f9fafb'
  );

  const businessName = businessInfo?.business_name || template?.branding?.customName || 'Company';
  const businessAddress = businessInfo?.business_address || businessInfo?.address || '';
  const businessPhone = businessInfo?.phone || '';
  const businessEmail = businessInfo?.email || '';
  const businessGst = businessInfo?.gstin || '';
  const businessPan = businessInfo?.pan_number || '';

  const customerName = invoice?.customer_name || invoice?.customer?.name || invoice?.customer_details?.name || 'Valued Customer';
  const customerAddress = invoice?.customer_address || invoice?.customer?.address || invoice?.customer_details?.address || '';
  const customerPhone = invoice?.customer_phone || invoice?.customer?.phone || invoice?.customer_details?.phone || '';
  const customerEmail = invoice?.customer_email || invoice?.customer?.email || invoice?.customer_details?.email || '';
  const customerGst = invoice?.customer_gstin || invoice?.customer?.gstin || invoice?.customer_details?.gstin || '';

  const invoiceNumber = invoice?.invoice_number || invoice?.order_number || invoice?.quotation_number || invoice?.challan_number || 'INV-0001';
  const invoiceDate = invoice?.invoice_date || invoice?.order_date || invoice?.quotation_date || invoice?.date || '';
  const dueDate = invoice?.due_date || '';

  const items = invoice?.items || [];
  const subtotal = Number(invoice?.subtotal || invoice?.taxable_amount || 0);
  const totalAmount = Number(invoice?.total_amount || 0);
  const totalTax = Number(invoice?.total_tax || (invoice?.cgst || 0) + (invoice?.sgst || 0) + (invoice?.igst || 0) || 0);
  const roundOff = Number(invoice?.round_off || 0);
  const discountAmount = Number(invoice?.discount_amount || 0);

  // Bank Info
  const bankName = businessInfo?.bank_name || content?.bankDetails?.bankName || '';
  const bankAccount = businessInfo?.bank_account_number || content?.bankDetails?.accountNumber || '';
  const bankIfsc = businessInfo?.bank_ifsc_code || content?.bankDetails?.ifscCode || '';
  const bankBranch = businessInfo?.bank_branch || '';
  const bankUpi = businessInfo?.bank_upi_id || '';

  // Header Badge by Layout
  const themeBadge = 
    layoutType === 'professional' ? `<span style="display:inline-block;padding:4px 10px;background:#e0e7ff;color:#1e1b4b;font-size:11px;font-weight:700;border-radius:4px;letter-spacing:1px;text-transform:uppercase;">Corporate Verified</span>` :
    layoutType === 'billship' ? `<span style="display:inline-block;padding:4px 10px;background:#fef3c7;color:#92400e;font-size:11px;font-weight:700;border-radius:4px;">GST Compliant</span>` :
    layoutType === 'legend' ? `<span style="display:inline-block;padding:4px 10px;background:#1e293b;color:#f8fafc;font-size:11px;font-weight:700;border-radius:4px;letter-spacing:1px;">Official Document</span>` :
    '';

  // Items Rows HTML
  const itemsRowsHtml = items.map((it, idx) => {
    const itName = it.product_name || it.product?.name || it.item_name || it.description || `Item ${idx + 1}`;
    const hsn = it.hsn || it.hsn_code || '';
    const qty = it.quantity || 1;
    const rate = Number(it.unit_price || it.price || it.rate || 0).toFixed(2);
    const taxRate = it.tax_rate ? `${it.tax_rate}%` : '';
    const lineTotal = Number(it.total || it.amount || (qty * rate)).toFixed(2);

    return `
      <tr style="border-bottom: 1px solid #e5e7eb; background: ${idx % 2 === 0 ? '#ffffff' : '#fafafa'};">
        <td style="padding: 10px 12px; font-size: 13px; color: #6b7280; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px 12px; font-size: 13px; color: #111827; font-weight: 500;">
          ${itName}
          ${it.description && it.description !== itName ? `<div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${it.description}</div>` : ''}
        </td>
        ${sections.showHSN !== false && hsn ? `<td style="padding: 10px 12px; font-size: 12px; color: #6b7280; text-align: center;">${hsn}</td>` : ''}
        <td style="padding: 10px 12px; font-size: 13px; color: #111827; text-align: center; font-weight: 600;">${qty}</td>
        <td style="padding: 10px 12px; font-size: 13px; color: #111827; text-align: right;">${currencySymbol}${Number(rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        ${taxRate ? `<td style="padding: 10px 12px; font-size: 12px; color: #6b7280; text-align: center;">${taxRate}</td>` : ''}
        <td style="padding: 10px 12px; font-size: 13px; color: #111827; text-align: right; font-weight: 700;">${currencySymbol}${Number(lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  // Amount In Words
  let amountInWords = '';
  try {
    amountInWords = numberToWords(Math.round(totalAmount));
  } catch {
    amountInWords = '';
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTypeLabel} ${invoiceNumber}</title>
</head>
<body style="margin:0; padding:20px 10px; background-color:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1f2937;">
  <div style="max-width:680px; margin:0 auto; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.06); border:1px solid #e5e7eb;">
    
    <!-- Top Theme Header Banner -->
    <div style="background-color:${primaryColor}; color:#ffffff; padding:24px 28px; position:relative;">
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="vertical-align:top;">
            <h1 style="margin:0; font-size:24px; font-weight:800; letter-spacing:-0.5px; color:#ffffff;">
              ${businessName}
            </h1>
            ${businessAddress ? `<p style="margin:4px 0 0 0; font-size:12px; color:#e0e7ff; opacity:0.9; line-height:1.4;">${businessAddress}</p>` : ''}
            <div style="margin-top:8px; font-size:11px; color:#c7d2fe;">
              ${businessGst ? `<span style="margin-right:12px;"><strong>GSTIN:</strong> ${businessGst}</span>` : ''}
              ${businessPhone ? `<span style="margin-right:12px;"><strong>Phone:</strong> ${businessPhone}</span>` : ''}
              ${businessEmail ? `<span><strong>Email:</strong> ${businessEmail}</span>` : ''}
            </div>
          </td>
          <td style="vertical-align:top; text-align:right;">
            <div style="display:inline-block; text-align:right;">
              <span style="display:block; font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#c7d2fe; font-weight:600;">
                ${docTypeLabel}
              </span>
              <span style="display:block; font-size:20px; font-weight:800; color:#ffffff; margin-top:2px;">
                #${invoiceNumber}
              </span>
              <div style="margin-top:6px;">
                ${themeBadge}
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Meta / Invoice Dates Ribbon -->
    <div style="background-color:${tableHeaderBg}; border-bottom:1px solid #e5e7eb; padding:12px 28px;">
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <tr>
          <td style="color:#6b7280;">Invoice Date: <strong style="color:#111827;">${invoiceDate || '—'}</strong></td>
          ${dueDate ? `<td style="color:#6b7280; text-align:center;">Due Date: <strong style="color:#b91c1c;">${dueDate}</strong></td>` : ''}
          <td style="color:#6b7280; text-align:right;">Amount Due: <strong style="color:${primaryColor}; font-size:14px;">${currencySymbol}${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
        </tr>
      </table>
    </div>

    <!-- Parties Section (Bill To / Ship To) -->
    <div style="padding:24px 28px; border-bottom:1px solid #f3f4f6;">
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="width:50%; vertical-align:top; padding-right:16px;">
            <div style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:${accentColor}; margin-bottom:6px;">
              Billed To
            </div>
            <div style="font-size:15px; font-weight:700; color:#111827;">
              ${customerName}
            </div>
            ${customerAddress ? `<div style="font-size:12px; color:#4b5563; margin-top:4px; line-height:1.4;">${customerAddress}</div>` : ''}
            ${customerGst ? `<div style="font-size:11px; color:#6b7280; margin-top:4px;"><strong>GSTIN:</strong> ${customerGst}</div>` : ''}
            ${customerPhone ? `<div style="font-size:11px; color:#6b7280; margin-top:2px;"><strong>Phone:</strong> ${customerPhone}</div>` : ''}
            ${customerEmail ? `<div style="font-size:11px; color:#6b7280; margin-top:2px;"><strong>Email:</strong> ${customerEmail}</div>` : ''}
          </td>

          ${layoutType === 'billship' && (invoice?.shipping_address || invoice?.shipping_name) ? `
          <td style="width:50%; vertical-align:top; padding-left:16px; border-left:1px dashed #e5e7eb;">
            <div style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#f59e0b; margin-bottom:6px;">
              Shipped To
            </div>
            <div style="font-size:14px; font-weight:700; color:#111827;">
              ${invoice?.shipping_name || customerName}
            </div>
            <div style="font-size:12px; color:#4b5563; margin-top:4px; line-height:1.4;">
              ${invoice?.shipping_address || customerAddress}
            </div>
          </td>
          ` : `
          <td style="width:50%; vertical-align:top; text-align:right;">
            <div style="display:inline-block; text-align:left; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:12px 16px;">
              <div style="font-size:11px; color:#6b7280;">Payment Status</div>
              <div style="font-size:14px; font-weight:700; color:${invoice?.payment_status === 'paid' ? '#059669' : '#d97706'}; text-transform:capitalize; margin-top:2px;">
                ${invoice?.payment_status || 'Pending Payment'}
              </div>
            </div>
          </td>
          `}
        </tr>
      </table>
    </div>

    <!-- Items Table -->
    <div style="padding:0 28px 24px 28px;">
      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        <thead>
          <tr style="background-color:${tableHeaderBg}; border-bottom:2px solid ${primaryColor};">
            <th style="padding:10px 12px; font-size:11px; font-weight:700; text-transform:uppercase; color:#4b5563; text-align:center; width:6%;">#</th>
            <th style="padding:10px 12px; font-size:11px; font-weight:700; text-transform:uppercase; color:#4b5563; text-align:left;">Item / Description</th>
            ${sections.showHSN !== false ? `<th style="padding:10px 12px; font-size:11px; font-weight:700; text-transform:uppercase; color:#4b5563; text-align:center; width:12%;">HSN</th>` : ''}
            <th style="padding:10px 12px; font-size:11px; font-weight:700; text-transform:uppercase; color:#4b5563; text-align:center; width:8%;">Qty</th>
            <th style="padding:10px 12px; font-size:11px; font-weight:700; text-transform:uppercase; color:#4b5563; text-align:right; width:16%;">Rate</th>
            <th style="padding:10px 12px; font-size:11px; font-weight:700; text-transform:uppercase; color:#4b5563; text-align:center; width:10%;">Tax</th>
            <th style="padding:10px 12px; font-size:11px; font-weight:700; text-transform:uppercase; color:#4b5563; text-align:right; width:18%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRowsHtml}
        </tbody>
      </table>

      <!-- Summary & Totals Calculation Box -->
      <table style="width:100%; border-collapse:collapse; margin-top:20px;">
        <tr>
          <!-- Bank Details (Left Column) -->
          <td style="width:55%; vertical-align:top; padding-right:20px;">
            ${bankName || bankAccount ? `
            <div style="background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:14px 16px;">
              <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:${primaryColor}; margin-bottom:8px;">
                Bank & Payment Details
              </div>
              <div style="font-size:12px; color:#374151; line-height:1.6;">
                ${bankName ? `<div><strong>Bank:</strong> ${bankName}</div>` : ''}
                ${bankAccount ? `<div><strong>A/C No:</strong> ${bankAccount}</div>` : ''}
                ${bankIfsc ? `<div><strong>IFSC:</strong> ${bankIfsc}</div>` : ''}
                ${bankBranch ? `<div><strong>Branch / Holder:</strong> ${bankBranch}</div>` : ''}
                ${bankUpi ? `<div style="margin-top:4px; color:${accentColor}; font-weight:600;"><strong>UPI ID:</strong> ${bankUpi}</div>` : ''}
              </div>
            </div>
            ` : ''}

            ${amountInWords ? `
            <div style="margin-top:12px; font-size:11px; color:#6b7280; line-height:1.4;">
              <strong>Amount in Words:</strong><br>
              <span style="font-style:italic; color:#111827;">${amountInWords}</span>
            </div>
            ` : ''}
          </td>

          <!-- Financial Totals (Right Column) -->
          <td style="width:45%; vertical-align:top;">
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <tr>
                <td style="padding:6px 0; color:#6b7280;">Subtotal (Taxable):</td>
                <td style="padding:6px 0; text-align:right; font-weight:600; color:#111827;">
                  ${currencySymbol}${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              ${totalTax > 0 ? `
              <tr>
                <td style="padding:6px 0; color:#6b7280;">Total Tax (GST):</td>
                <td style="padding:6px 0; text-align:right; font-weight:600; color:#111827;">
                  +${currencySymbol}${totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              ` : ''}
              ${discountAmount > 0 ? `
              <tr>
                <td style="padding:6px 0; color:#059669;">Discount:</td>
                <td style="padding:6px 0; text-align:right; font-weight:600; color:#059669;">
                  -${currencySymbol}${discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              ` : ''}
              ${roundOff !== 0 ? `
              <tr>
                <td style="padding:6px 0; color:#6b7280;">Round Off:</td>
                <td style="padding:6px 0; text-align:right; font-weight:600; color:#111827;">
                  ${roundOff >= 0 ? '+' : ''}${currencySymbol}${roundOff.toFixed(2)}
                </td>
              </tr>
              ` : ''}
              <tr style="border-top:2px solid ${primaryColor}; border-bottom:2px solid ${primaryColor};">
                <td style="padding:10px 0; font-size:15px; font-weight:800; color:${primaryColor};">
                  Total Payable:
                </td>
                <td style="padding:10px 0; text-align:right; font-size:18px; font-weight:800; color:${primaryColor};">
                  ${currencySymbol}${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer Terms & Signatory Section -->
    <div style="background-color:#f9fafb; border-top:1px solid #e5e7eb; padding:20px 28px;">
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="vertical-align:top; width:65%; font-size:11px; color:#6b7280; line-height:1.5;">
            <strong>Terms & Conditions:</strong><br>
            1. Goods once sold are subject to standard commercial terms.<br>
            2. Payment is due as indicated on this document.<br>
            <div style="margin-top:10px; color:#9ca3af; font-size:10px;">
              Thank you for choosing ${businessName}!
            </div>
          </td>
          <td style="vertical-align:bottom; text-align:right; width:35%;">
            <div style="font-size:11px; color:#374151; font-weight:700;">
              For ${businessName}
            </div>
            <div style="height:35px;"></div>
            <div style="border-top:1px solid #d1d5db; display:inline-block; padding-top:4px; font-size:10px; color:#6b7280;">
              Authorized Signatory
            </div>
          </td>
        </tr>
      </table>
    </div>

  </div>
</body>
</html>
  `;
}
