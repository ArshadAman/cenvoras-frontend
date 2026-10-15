import React from 'react';
import { getCountryCode } from '../../utils/currency';

/**
 * Compact company band that lives inside a table <thead> so Chromium/print
 * repeats it on every page (with column headers). Keep density low — not a
 * full first-page hero duplicate.
 */
export default function InvoiceContinuationHeader({
  colSpan = 12,
  companyName = '',
  companyAddress = '',
  companyGST = '',
  companyPAN = '',
  companyGEM = '',
  primaryColor = '#1a1a2e',
}) {
  const gstLabel = getCountryCode() === 'IN' ? 'GSTIN' : 'TRN';
  const meta = [
    companyGST ? `${gstLabel}: ${companyGST}` : null,
    companyPAN ? `PAN: ${companyPAN}` : null,
    companyGEM ? `GeM: ${companyGEM}` : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <tr
      className="invoice-continuation-header"
      data-print-continuation-header="true"
      style={{ display: 'none' }}
    >
      <td
        colSpan={colSpan}
        style={{
          padding: '6px 8px',
          borderBottom: `1px solid ${primaryColor}22`,
          backgroundColor: '#ffffff',
          color: primaryColor,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '11px', lineHeight: 1.3 }}>{companyName}</div>
        {companyAddress ? (
          <div
            style={{
              fontSize: '8px',
              color: '#4b5563',
              whiteSpace: 'pre-line',
              lineHeight: 1.25,
              marginTop: 2,
            }}
          >
            {companyAddress}
          </div>
        ) : null}
        {meta ? (
          <div style={{ fontSize: '8px', color: '#6b7280', marginTop: 2, fontWeight: 500 }}>{meta}</div>
        ) : null}
      </td>
    </tr>
  );
}
