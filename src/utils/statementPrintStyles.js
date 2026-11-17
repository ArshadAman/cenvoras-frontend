/**
 * Shared Print and PDF Styles for Customer & Vendor Statements and Ledgers
 * Ensures complete immunity against dark-mode color bleed, eliminates horizontal scrollbars,
 * and standardizes executive statement formatting across browsers and PDF export engines.
 */

export const STATEMENT_PRINT_PAGE_STYLE = `
  @page {
    size: A4 portrait;
    margin: 10mm 12mm;
  }
  @page :left {
    margin: 10mm 12mm;
  }
  @page :right {
    margin: 10mm 12mm;
  }

  @media print {
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body, #root {
      background-color: #ffffff !important;
      background: #ffffff !important;
      color: #0f172a !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: auto !important;
      overflow: visible !important;
    }

    /* Isolate statement print container with dedicated high-contrast light accounting tokens */
    [data-print-target], .statement-print-root {
      --bg-primary: #f8fafc !important;
      --bg-surface: #ffffff !important;
      --text-primary: #0f172a !important;
      --text-secondary: #334155 !important;
      --text-muted: #64748b !important;
      --text-on-accent: #ffffff !important;
      --border-default: #cbd5e1 !important;
      --border-subtle: #e2e8f0 !important;
      --accent-primary: #1d4ed8 !important;

      --status-success: #166534 !important;
      --status-success-text: #166534 !important;
      --status-success-bg: #f0fdf4 !important;
      --status-success-border: #bbf7d0 !important;

      --status-warning: #9a3412 !important;
      --status-warning-text: #9a3412 !important;
      --status-warning-bg: #fffbeb !important;
      --status-warning-border: #fde68a !important;

      --status-danger: #991b1b !important;
      --status-danger-text: #991b1b !important;
      --status-danger-bg: #fef2f2 !important;
      --status-danger-border: #fecaca !important;

      --status-info: #1e40af !important;
      --status-info-text: #1e40af !important;
      --status-info-bg: #eff6ff !important;
      --status-info-border: #bfdbfe !important;

      background: #ffffff !important;
      color: #0f172a !important;
      padding: 0 !important;
      margin: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      height: auto !important;
      overflow: visible !important;
      box-shadow: none !important;
      border: none !important;
    }

    /* Eliminate horizontal scrolling and scrollbars in print */
    [data-print-target] *, .statement-print-root * {
      overflow: visible !important;
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
    ::-webkit-scrollbar {
      display: none !important;
    }
    .overflow-x-auto, .overflow-y-auto {
      overflow: visible !important;
    }

    /* Page break controls */
    .statement-no-break, [data-no-break], tr, .metric-card {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    thead {
      display: table-header-group !important;
    }
    tfoot {
      display: table-footer-group !important;
    }

    /* Hide UI navigation, action columns, and interactive elements */
    .print-hidden, [data-no-print], .statement-action-col {
      display: none !important;
    }

    /* Ensure document links inside table cells render as clean dark text rather than disappearing */
    button.statement-doc-link {
      display: inline-block !important;
      background: transparent !important;
      border: none !important;
      padding: 0 !important;
      color: #1d4ed8 !important;
      font-weight: 700 !important;
      text-decoration: none !important;
      box-shadow: none !important;
      cursor: default !important;
    }
    button.statement-doc-link svg {
      display: none !important;
    }

    /* Force tables to 100% printable width */
    table {
      width: 100% !important;
      table-layout: auto !important;
      border-collapse: collapse !important;
    }

    /* Print header styling adjustments */
    .statement-header-print {
      display: block !important;
    }
  }
`;

/**
 * Prepares the cloned DOM element for html2canvas PDF rendering.
 * Strips dark mode, applies high-contrast light colors, removes interactive elements,
 * and fixes width to A4 dimensions (794px at 96 DPI) so the PDF is razor-sharp.
 */
export function prepareClonedStatementElementForPdf(clonedDoc, targetSelector = '[data-print-target]') {
  if (!clonedDoc) return null;

  // 1. Force document root & body to light mode
  if (clonedDoc.documentElement) {
    clonedDoc.documentElement.classList.remove('dark');
    clonedDoc.documentElement.setAttribute('data-theme', 'light');
    clonedDoc.documentElement.style.backgroundColor = '#ffffff';
    clonedDoc.documentElement.style.color = '#0f172a';
  }
  if (clonedDoc.body) {
    clonedDoc.body.classList.remove('dark');
    clonedDoc.body.style.backgroundColor = '#ffffff';
    clonedDoc.body.style.color = '#0f172a';
  }

  // 2. Select the target printable container
  const element = clonedDoc.querySelector(targetSelector);
  if (!element) return null;

  // 3. Set standard A4 width (~794px @ 96 DPI) with clean margins and visible overflow
  element.style.width = '794px';
  element.style.maxWidth = '794px';
  element.style.minWidth = '794px';
  element.style.height = 'auto';
  element.style.overflow = 'visible';
  element.style.padding = '20px';
  element.style.margin = '0 auto';
  element.style.boxSizing = 'border-box';
  element.style.backgroundColor = '#ffffff';
  element.style.color = '#0f172a';

  // 4. Override CSS custom properties directly on the element
  const lightTokens = {
    '--bg-primary': '#f8fafc',
    '--bg-surface': '#ffffff',
    '--text-primary': '#0f172a',
    '--text-secondary': '#334155',
    '--text-muted': '#64748b',
    '--text-on-accent': '#ffffff',
    '--border-default': '#cbd5e1',
    '--border-subtle': '#e2e8f0',
    '--accent-primary': '#1d4ed8',
    '--status-success': '#166534',
    '--status-success-text': '#166534',
    '--status-success-bg': '#f0fdf4',
    '--status-success-border': '#bbf7d0',
    '--status-warning': '#9a3412',
    '--status-warning-text': '#9a3412',
    '--status-warning-bg': '#fffbeb',
    '--status-warning-border': '#fde68a',
    '--status-danger': '#991b1b',
    '--status-danger-text': '#991b1b',
    '--status-danger-bg': '#fef2f2',
    '--status-danger-border': '#fecaca',
    '--status-info': '#1e40af',
    '--status-info-text': '#1e40af',
    '--status-info-bg': '#eff6ff',
    '--status-info-border': '#bfdbfe',
  };

  Object.entries(lightTokens).forEach(([prop, val]) => {
    element.style.setProperty(prop, val);
  });

  // 5. Hide interactive action elements, buttons, and .print-hidden elements
  element.querySelectorAll('.print-hidden, [data-no-print], .statement-action-col').forEach(el => {
    el.style.display = 'none';
  });

  // 6. Fix all overflow containers inside the target
  element.querySelectorAll('.overflow-x-auto, .overflow-y-auto').forEach(el => {
    el.style.overflow = 'visible';
    el.style.maxWidth = '100%';
  });

  // 7. Decouple document buttons (e.g. bill numbers, invoices) into clean text
  element.querySelectorAll('button.statement-doc-link').forEach(btn => {
    btn.style.boxShadow = 'none';
    btn.style.border = 'none';
    btn.style.background = 'transparent';
    btn.style.color = '#1d4ed8';
    btn.querySelectorAll('svg').forEach(icon => {
      icon.style.display = 'none';
    });
  });

  return element;
}
