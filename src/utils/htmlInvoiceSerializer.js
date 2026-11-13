import compiledTailwindStyles from '../index.css?inline';
import {
  INVOICE_GOOGLE_FONTS_HREF,
  INVOICE_DOCUMENT_FONT_FAMILY,
  INVOICE_VECTOR_LAYOUT_CSS,
} from './invoicePrintStyles';

/**
 * Serializes the rendered invoice preview into a standalone HTML document
 * for headless Chromium vector PDF — same layout CSS and Inter font stack
 * as on-screen preview / browser print.
 */

export function serializeInvoiceHtml(element) {
  if (!element) return '';

  // 1. Collect any runtime dynamic CSS stylesheets and style tags from document.head
  let collectedStyles = '';

  try {
    const styleElements = document.querySelectorAll('style:not([data-modal-print-style]):not([data-preview-layout-style]), link[rel="stylesheet"]');
    styleElements.forEach((el) => {
      if (el.tagName.toLowerCase() === 'style' && el.innerHTML) {
        collectedStyles += `\n${el.innerHTML}`;
      } else if (el.tagName.toLowerCase() === 'link') {
        try {
          const sheet = el.sheet;
          if (sheet && sheet.cssRules) {
            const rules = Array.from(sheet.cssRules || []).map((r) => r.cssText).join('\n');
            collectedStyles += `\n${rules}`;
          }
        } catch (e) {
          // Cross-origin or restricted stylesheet access
        }
      }
    });
  } catch (err) {
    // Non-fatal fallback
  }

  // 2. Clone the element to safely modify styles without altering the live UI
  const cloned = element.cloneNode(true);

  // Strip preview modal scaling classes and transform styles so it renders at standard A4 size
  cloned.className = (cloned.className || '')
    .replace(/scale-\[[^\]]+\]/g, '')
    .replace(/origin-[a-z-]+/g, '')
    .replace(/shadow-[a-z0-9]+/g, '');
  cloned.style.transform = 'none';
  cloned.style.webkitTransform = 'none';
  cloned.style.width = '210mm';
  cloned.style.maxWidth = '210mm';
  cloned.style.boxSizing = 'border-box';
  cloned.style.margin = '0 auto';
  cloned.style.boxShadow = 'none';

  // Ensure any inner elements with scale transforms are unscaled
  const scaledNodes = cloned.querySelectorAll('[style*="transform"], [style*="scale"]');
  scaledNodes.forEach((node) => {
    node.style.transform = 'none';
    node.style.webkitTransform = 'none';
  });

  // Remove any print-hidden or interactive elements from cloned DOM
  const hiddenElements = cloned.querySelectorAll('.print-hidden, button, [data-no-print]');
  hiddenElements.forEach((el) => el.remove());

  // Classic print chrome only (full-bleed letterhead + 7mm body inset).
  // Non-classic keeps in-body .invoice-first-page-header and sheet padding.
  cloned.querySelectorAll('.invoice-sheet').forEach((sheet) => {
    sheet.style.overflow = 'visible';
    sheet.style.boxSizing = 'border-box';
    if (sheet.querySelector('.invoice-print-shell[data-print-theme="classic"]')) {
      sheet.style.padding = '0 0 10mm 0';
    }
  });
  cloned.querySelectorAll('.invoice-print-shell[data-print-theme="classic"] .invoice-print-shell-row > td').forEach((el) => {
    el.style.padding = '0 7mm';
    el.style.border = 'none';
    el.style.overflow = 'visible';
  });
  cloned.querySelectorAll('.invoice-print-shell[data-print-theme="classic"] .invoice-continuation-header').forEach((el) => {
    el.style.display = 'table-row';
  });
  cloned.querySelectorAll('.invoice-print-shell[data-print-theme="classic"] .invoice-continuation-header > td').forEach((el) => {
    el.style.padding = '0 0 3mm 0';
    el.style.border = 'none';
  });
  cloned.querySelectorAll('.invoice-page-footer').forEach((el) => {
    el.style.position = 'static';
    el.style.bottom = '';
    el.style.left = '';
    el.style.right = '';
    el.style.marginTop = '';
  });

  // 3. Assemble complete standalone HTML with shared print layout + Inter
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${INVOICE_GOOGLE_FONTS_HREF}" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: #ffffff !important;
      color: #1f2937;
      font-family: ${INVOICE_DOCUMENT_FONT_FAMILY};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    ${INVOICE_VECTOR_LAYOUT_CSS}
    /* Compiled project Tailwind CSS */
    ${compiledTailwindStyles}
    /* Runtime captured styles */
    ${collectedStyles}
  </style>
</head>
<body style="background-color: #ffffff; margin: 0; padding: 0;">
  ${cloned.outerHTML}
</body>
</html>`;
}
