const INVOICE_PRINT_PAGE_RULES = `
  @page {
    size: A4 portrait;
    margin: 0mm;
  }
  @page :left {
    margin: 0mm;
  }
  @page :right {
    margin: 0mm;
  }
`;

export const INVOICE_PRINT_DOCUMENT_RULES = `
  *, *::before, *::after {
    box-sizing: border-box !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: auto !important;
    background: #ffffff !important;
  }
  thead {
    display: table-header-group !important;
  }
  thead tr {
    page-break-before: avoid !important;
    break-before: avoid !important;
  }
  tr:not(.invoice-print-shell-row) {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .invoice-print-shell,
  .invoice-print-shell > tbody,
  .invoice-print-shell-row {
    break-inside: auto !important;
    page-break-inside: auto !important;
    page-break-before: avoid !important;
    break-before: avoid !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .print-hidden, [data-no-print], button {
    display: none !important;
  }
  [data-print-wrapper] {
    transform: none !important;
    -webkit-transform: none !important;
    width: auto !important;
    margin: 0 !important;
  }
  .invoice-sheet {
    position: relative !important;
    display: flex !important;
    flex-direction: column !important;
    box-shadow: none !important;
    transform: none !important;
    -webkit-transform: none !important;
    width: 210mm !important;
    max-width: 100% !important;
    min-height: 297mm !important;
    margin: 0 auto !important;
    box-sizing: border-box !important;
    background: #ffffff !important;
    overflow: visible !important;
  }
  /* Classic: full-bleed letterhead; 7mm body inset on the print-shell cell. */
  .invoice-sheet:has(.invoice-print-shell[data-print-theme="classic"]) {
    padding: 0 0 10mm 0 !important;
    padding-top: 0 !important;
  }
  .invoice-sheet-body {
    flex: 0 0 auto !important;
    flex-grow: 0 !important;
  }
  .invoice-print-shell[data-print-theme="classic"] .invoice-continuation-header {
    display: table-row !important;
  }
  .invoice-print-shell[data-print-theme="classic"] .invoice-continuation-header > td {
    /* Slight white gap under letterhead before body (items or bank/totals on page break) */
    padding: 0 0 3mm 0 !important;
    border: none !important;
    overflow: visible !important;
  }
  .invoice-print-shell {
    border-collapse: collapse !important;
    border-spacing: 0 !important;
    width: 100% !important;
    margin: 0 !important;
  }
  .invoice-continuation-letterhead-classic {
    display: block !important;
    margin: 0 !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  .invoice-print-shell[data-print-theme="classic"] .invoice-print-shell-row > td {
    padding: 0 7mm !important;
    border: none !important;
    overflow: visible !important;
  }
  /* Bank + totals (+ amount in words): never split across pages */
  .invoice-totals-block {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    break-before: auto !important;
    page-break-before: auto !important;
  }
  /* Terms / signatory / Made with Cenvora — flow under totals */
  .invoice-page-footer {
    position: static !important;
    bottom: auto !important;
    left: auto !important;
    right: auto !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  [data-print-target] {
    width: 210mm !important;
    max-width: 100% !important;
    min-height: 297mm !important;
    margin: 0 auto !important;
    padding: 0 !important;
    box-shadow: none !important;
    background: #ffffff !important;
    transform: none !important;
    -webkit-transform: none !important;
  }
`;

export const INVOICE_PRINT_PAGE_STYLE = `
  ${INVOICE_PRINT_PAGE_RULES}
  @media print {
    ${INVOICE_PRINT_DOCUMENT_RULES}
  }
`;

export const INVOICE_INLINE_PRINT_STYLE = `
  ${INVOICE_PRINT_PAGE_RULES}
  body:has([data-print-target]) > #root {
    display: none !important;
  }
  ${INVOICE_PRINT_DOCUMENT_RULES}
`;
