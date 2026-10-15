import React from 'react';
import { getCountryCode } from '../../utils/currency';

/**
 * Full-format company header for Chromium/print (every page).
 * Used inside InvoicePrintShell <thead> so it sits ABOVE billing/items in DOM
 * (avoids swapped order) and repeats on page 2+.
 * Hidden on screen; print shows this and hides .invoice-first-page-header.
 *
 * Matches Classic invoice density (right-aligned name / address / tax IDs).
 */
export default function InvoiceContinuationHeader({
  colSpan = 12,
  companyName = '',
  companyAddress = '',
  companyPhone = '',
  companyEmail = '',
  companyGST = '',
  companyPAN = '',
  companyGEM = '',
  companyDL = '',
  companyNameColor = '#d11f1f',
  companyNameSize = 18,
}) {
  const gstLabel = getCountryCode() === 'IN' ? 'GSTIN' : 'TRN';
  const contactLine = [
    companyPhone ? `Ph- ${companyPhone}` : null,
    companyEmail ? `email-${companyEmail}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <tr
      className="invoice-continuation-header"
      data-print-continuation-header="true"
      style={{ display: 'none' }}
    >
      <td
        colSpan={colSpan}
        style={{
          padding: 0,
          border: 'none',
          backgroundColor: '#ffffff',
        }}
      >
        <div
          style={{
            backgroundColor: '#ececec',
            padding: '6mm 4mm 4mm 4mm',
            marginBottom: '2mm',
            borderBottomLeftRadius: '120% 20px',
            borderBottomRightRadius: '120% 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'right', maxWidth: '62%' }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: `${companyNameSize}px`,
                  color: companyNameColor,
                  lineHeight: 1.25,
                  marginBottom: 4,
                }}
              >
                {companyName}
              </div>
              <div style={{ color: '#1f2937', fontSize: '9px', lineHeight: 1.35 }}>
                {companyAddress ? (
                  <div style={{ whiteSpace: 'pre-line', marginBottom: 2 }}>{companyAddress}</div>
                ) : null}
                {contactLine ? <div>{contactLine}</div> : null}
                {companyGST ? (
                  <div style={{ fontWeight: 500 }}>
                    {gstLabel}: {companyGST}
                  </div>
                ) : null}
                {companyPAN ? <div style={{ fontWeight: 500 }}>PAN: {companyPAN}</div> : null}
                {companyGEM ? <div style={{ fontWeight: 500 }}>GEM ID- {companyGEM}</div> : null}
                {companyDL ? <div style={{ fontWeight: 500 }}>DL No- {companyDL}</div> : null}
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}
