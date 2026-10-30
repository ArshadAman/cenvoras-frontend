import React from 'react';
import InvoiceContinuationHeader from './InvoiceContinuationHeader';

/**
 * Outer table so Chromium/print can repeat the seller letterhead at the
 * top of every page — before billing/items (DOM order matches preview).
 *
 * Classic: thead letterhead is visible on screen and print (full-bleed band;
 * 7mm inset on the body cell). Other themes: continuation row hidden on
 * screen; print hides .invoice-first-page-header and shows this thead.
 */
export default function InvoicePrintShell({ children, theme = 'classic', headerProps = {} }) {
  const isClassic = theme === 'classic';
  return (
    <table
      className="invoice-print-shell w-full border-collapse"
      data-print-theme={theme}
      style={{ tableLayout: 'fixed', width: '100%' }}
    >
      <thead style={{ display: 'table-header-group' }}>
        <InvoiceContinuationHeader colSpan={1} theme={theme} {...headerProps} />
      </thead>
      <tbody>
        <tr className="invoice-print-shell-row">
          <td
            style={{
              padding: isClassic ? '0 7mm' : 0,
              border: 'none',
              verticalAlign: 'top',
            }}
          >
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
