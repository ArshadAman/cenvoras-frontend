import React from 'react';
import { getCountryCode } from '../../utils/currency';
import ClassicLetterhead from './ClassicLetterhead';

/**
 * Seller-only letterhead for Chromium/print (every page).
 * Used inside InvoicePrintShell <thead> so it sits ABOVE billing/items in DOM
 * and repeats on page 2+.
 *
 * Classic: visible on screen and print (same ClassicLetterhead markup).
 * Other themes: hidden on screen; print shows this and hides
 * .invoice-first-page-header. Does NOT include invoice title / bill-to.
 */
export default function InvoiceContinuationHeader({
  colSpan = 12,
  theme = 'classic',
  companyName = '',
  companyAddress = '',
  companyPhone = '',
  companyEmail = '',
  companyGST = '',
  companyPAN = '',
  companyGEM = '',
  companyDL = '',
  companyLogo = '',
  showLogo = false,
  companyNameColor = '#d11f1f',
  companyNameSize = 18,
  fontFamily,
  smallSize = 9,
  showGST = true,
  showGEMID = false,
  primaryColor,
}) {
  const gstLabel = getCountryCode() === 'IN' ? 'GSTIN' : 'TRN';
  const accent = primaryColor || companyNameColor || '#d11f1f';
  const contactLine = [
    companyPhone ? `Ph- ${companyPhone}` : null,
    companyEmail ? `email-${companyEmail}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  const idLineStyle = { fontWeight: 700, fontSize: '10px' };
  const taxLines = (
    <>
      {companyGST ? (
        <div style={idLineStyle}>
          {gstLabel}: {companyGST}
        </div>
      ) : null}
      {companyPAN ? <div style={idLineStyle}>PAN: {companyPAN}</div> : null}
      {companyGEM ? <div style={idLineStyle}>GEM ID: {companyGEM}</div> : null}
      {companyDL ? <div style={idLineStyle}>DL No- {companyDL}</div> : null}
    </>
  );

  let inner = null;

  if (theme === 'legend') {
    inner = (
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          padding: '3mm 4mm',
          borderBottom: '1px solid #d1d5db',
          backgroundColor: '#ffffff',
        }}
      >
        {showLogo && companyLogo ? (
          <img src={companyLogo} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />
        ) : null}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: `${companyNameSize}px`, color: accent, lineHeight: 1.25 }}>
            {companyName}
          </div>
          <div style={{ color: '#1f2937', fontSize: '9px', lineHeight: 1.35 }}>
            {companyAddress ? (
              <div style={{ whiteSpace: 'pre-line', marginBottom: 2 }}>{companyAddress}</div>
            ) : null}
            {taxLines}
          </div>
        </div>
      </div>
    );
  } else if (theme === 'billship') {
    inner = (
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          padding: '3mm 0 4mm 0',
          borderBottom: '1px solid #d1d5db',
          backgroundColor: '#ffffff',
        }}
      >
        {showLogo && companyLogo ? (
          <img
            src={companyLogo}
            alt=""
            style={{
              width: 56,
              height: 56,
              objectFit: 'contain',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 4,
            }}
          />
        ) : null}
        <div>
          <div style={{ fontWeight: 800, fontSize: `${companyNameSize}px`, color: '#111827', lineHeight: 1.25 }}>
            {companyName}
          </div>
          <div style={{ color: '#4b5563', fontSize: '9px', lineHeight: 1.35 }}>
            {companyAddress ? (
              <div style={{ whiteSpace: 'pre-line', marginBottom: 2 }}>{companyAddress}</div>
            ) : null}
            {taxLines}
          </div>
        </div>
      </div>
    );
  } else if (theme === 'professional' || theme === 'service') {
    inner = (
      <div style={{ padding: '2mm 0 3mm 0', backgroundColor: '#ffffff' }}>
        {showLogo && companyLogo ? (
          <img src={companyLogo} alt="" style={{ maxHeight: 44, marginBottom: 8, objectFit: 'contain' }} />
        ) : null}
        <div
          style={{
            fontWeight: 700,
            fontSize: `${Math.max(companyNameSize, theme === 'service' ? 18 : 16)}px`,
            color: accent,
            lineHeight: 1.25,
            marginBottom: 4,
            textTransform: theme === 'service' ? 'uppercase' : 'none',
            letterSpacing: theme === 'service' ? '-0.02em' : undefined,
          }}
        >
          {companyName}
        </div>
        <div style={{ color: '#4b5563', fontSize: '9px', lineHeight: 1.35, maxWidth: '70%' }}>
          {companyAddress ? (
            <div style={{ whiteSpace: 'pre-line', marginBottom: 2 }}>{companyAddress}</div>
          ) : null}
          {contactLine ? <div style={{ marginBottom: 2 }}>{contactLine}</div> : null}
          {taxLines}
        </div>
      </div>
    );
  } else {
    inner = (
      <ClassicLetterhead
        companyName={companyName}
        companyAddress={companyAddress}
        companyPhone={companyPhone}
        companyEmail={companyEmail}
        companyGST={companyGST}
        companyPAN={companyPAN}
        companyGEM={companyGEM}
        companyDL={companyDL}
        companyNameColor={companyNameColor}
        companyNameSize={companyNameSize}
        fontFamily={fontFamily}
        smallSize={smallSize}
        showGST={showGST}
        showGEMID={showGEMID}
      />
    );
  }

  const isClassic = theme === 'classic';

  return (
    <tr
      className="invoice-continuation-header"
      data-print-continuation-header="true"
      style={{ display: isClassic ? 'table-row' : 'none' }}
    >
      <td
        colSpan={colSpan}
        style={{
          // Slight white gap under letterhead; print/PDF CSS reinforces this on page breaks
          padding: '0 0 3mm 0',
          border: 'none',
          backgroundColor: '#ffffff',
        }}
      >
        {inner}
      </td>
    </tr>
  );
}
