import React from 'react';
import { getCountryCode } from '../../utils/currency';

/**
 * Classic gray curved seller band.
 * Shared by on-screen preview and print/PDF (InvoicePrintShell thead)
 * so the letterhead cannot drift between them.
 */
export default function ClassicLetterhead({
  companyName = '',
  companyAddress = '',
  companyPhone = '',
  companyEmail = '',
  companyGST = '',
  companyPAN = '',
  companyGEM = '',
  companyDL = '',
  companyNameColor = '#d11f1f',
  companyNameSize = 24,
  fontFamily,
  smallSize = 9,
  showGST = true,
  showGEMID = false,
}) {
  const gstLabel = getCountryCode() === 'IN' ? 'GSTIN' : 'TRN';
  const idSize = smallSize + 1;
  const contactLine = [
    companyPhone ? `Ph- ${companyPhone}` : null,
    companyEmail ? `email-${companyEmail}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      className="invoice-continuation-letterhead-classic"
      style={{
        display: 'block',
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#ececec',
        margin: 0,
        padding: '2mm 6mm 3mm 6mm',
        borderBottomLeftRadius: '120% 28px',
        borderBottomRightRadius: '120% 28px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'right', maxWidth: '58%' }}>
          <div
            style={{
              fontWeight: 400,
              fontSize: `${companyNameSize}px`,
              fontFamily: fontFamily || undefined,
              color: companyNameColor,
              lineHeight: 1.25,
              marginBottom: 4,
            }}
          >
            {companyName}
          </div>
          <div style={{ color: '#1f2937', fontSize: `${smallSize}px`, lineHeight: 1.35, fontWeight: 400 }}>
            {companyAddress ? (
              <div style={{ whiteSpace: 'pre-line', marginBottom: 2 }}>{companyAddress}</div>
            ) : null}
            {contactLine ? <div>{contactLine}</div> : null}
            {showGST && companyGST ? (
              <div style={{ fontWeight: 700, fontSize: `${idSize}px` }}>
                {gstLabel}: {companyGST}
              </div>
            ) : null}
            {companyPAN ? (
              <div style={{ fontWeight: 700, fontSize: `${idSize}px` }}>PAN: {companyPAN}</div>
            ) : null}
            {showGEMID && companyGEM ? (
              <div style={{ fontWeight: 700, fontSize: `${idSize}px` }}>GEM ID: {companyGEM}</div>
            ) : null}
            {companyDL ? (
              <div style={{ fontWeight: 700, fontSize: `${idSize}px` }}>DL No- {companyDL}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
