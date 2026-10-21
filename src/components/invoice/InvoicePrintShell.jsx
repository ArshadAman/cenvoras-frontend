import React from 'react';
import InvoiceContinuationHeader from './InvoiceContinuationHeader';

/**
 * Outer table so Chromium/print can repeat the seller letterhead at the
 * top of every page — before billing/items (DOM order matches preview).
 *
 * Screen: continuation row hidden; first-page hero inside children stays visible.
 * Print/PDF: first-page hero hidden; this thead company row shows and repeats.
 */
export default function InvoicePrintShell({ children, theme = 'classic', headerProps = {} }) {
  return (
    <table
      className="invoice-print-shell w-full border-collapse"
      style={{ tableLayout: 'fixed', width: '100%' }}
    >
      <thead style={{ display: 'table-header-group' }}>
        <InvoiceContinuationHeader colSpan={1} theme={theme} {...headerProps} />
      </thead>
      <tbody>
        <tr className="invoice-print-shell-row">
          <td style={{ padding: 0, border: 'none', verticalAlign: 'top' }}>{children}</td>
        </tr>
      </tbody>
    </table>
  );
}
