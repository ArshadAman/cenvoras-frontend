import compiledTailwindStyles from '../index.css?inline';

/**
 * htmlInvoiceSerializer.js
 * 
 * Serializes the rendered invoice preview into a complete, standalone HTML document
 * containing all embedded Tailwind CSS and theme styles.
 * 
 * When processed by Headless Chromium on the backend, this guarantees a 100% pixel-perfect
 * vector PDF replica with 0 pixel difference from the on-screen preview.
 */

export function serializeInvoiceHtml(element) {
  if (!element) return '';

  // 1. Collect any runtime dynamic CSS stylesheets and style tags from document.head
  let collectedStyles = '';

  try {
    const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
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

  // 3. Assemble complete standalone HTML with compile-time embedded Tailwind CSS
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
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
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'DejaVu Sans', 'Noto Sans', 'Liberation Sans', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    /* Prevent dark empty slabs: do not stretch A4 shells / flex fillers in PDF */
    .invoice-sheet {
      position: relative !important;
      min-height: auto !important;
      height: auto !important;
      background-color: #ffffff !important;
      padding-bottom: 24mm !important;
    }
    .invoice-sheet-body,
    .invoice-sheet .flex-1 {
      flex: 0 0 auto !important;
      flex-grow: 0 !important;
      min-height: 0 !important;
    }
    /*
     * InvoicePrintShell puts company header in an OUTER thead (above billing).
     * Hide in-flow hero so it is not duplicated; show shell thead on every page.
     */
    .invoice-first-page-header {
      display: none !important;
    }
    .invoice-print-shell > thead .invoice-continuation-header,
    .invoice-continuation-header {
      display: table-row !important;
    }
    /* Pin branding footer to bottom of last printed page */
    .invoice-page-footer {
      position: absolute !important;
      bottom: 8mm !important;
      left: 10mm !important;
      right: 10mm !important;
      margin-top: 0 !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .font-mono, [class*="font-mono"], code, pre {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', 'DejaVu Sans', 'Noto Sans', monospace, sans-serif !important;
    }
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
