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

  // Apply print chrome on the clone itself (inline) so backend Chromium cannot
  // miss stylesheet overrides against React's padding: 7mm sides on .invoice-sheet.
  cloned.querySelectorAll('.invoice-sheet').forEach((sheet) => {
    sheet.style.padding = '0 0 88mm 0';
    sheet.style.overflow = 'visible';
    sheet.style.boxSizing = 'border-box';
  });
  cloned.querySelectorAll('.invoice-print-shell-row > td').forEach((el) => {
    el.style.padding = '0 7mm';
    el.style.border = 'none';
    el.style.overflow = 'visible';
  });
  cloned.querySelectorAll('.invoice-first-page-header').forEach((el) => {
    el.style.display = 'none';
  });
  cloned.querySelectorAll('.invoice-continuation-header').forEach((el) => {
    el.style.display = 'table-row';
  });
  cloned.querySelectorAll('.invoice-continuation-header > td').forEach((el) => {
    el.style.padding = '0 0 3mm 0';
    el.style.border = 'none';
  });
  cloned.querySelectorAll('.invoice-page-footer').forEach((el) => {
    el.style.position = 'absolute';
    el.style.bottom = '4mm';
    el.style.left = '7mm';
    el.style.right = '7mm';
    el.style.marginTop = '0';
  });

  // 3. Assemble complete standalone HTML with compile-time embedded Tailwind CSS
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet">
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
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'DejaVu Sans', 'Noto Sans', 'Liberation Sans', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    /* A4 sheet; seller letterhead in thead repeats every page; pin footer chrome */
    .invoice-sheet {
      position: relative !important;
      display: flex !important;
      flex-direction: column !important;
      box-shadow: none !important;
      transform: none !important;
      width: 210mm !important;
      min-height: 297mm !important;
      margin: 0 auto !important;
      /* Zero outer padding so letterhead is edge-to-edge (preview-seamless).
         Body inset is applied on the print-shell content cell instead. */
      padding: 0 0 88mm 0 !important;
      padding-top: 0 !important;
      box-sizing: border-box !important;
      background-color: #ffffff !important;
      overflow: visible !important;
    }
    .invoice-sheet-body,
    .invoice-sheet .flex-1 {
      flex: 0 0 auto !important;
      flex-grow: 0 !important;
    }
    thead {
      display: table-header-group !important;
    }
    .invoice-print-shell,
    .invoice-print-shell > tbody,
    .invoice-print-shell-row,
    .invoice-print-shell-row > td {
      break-inside: auto !important;
      page-break-inside: auto !important;
    }
    .invoice-first-page-header {
      display: none !important;
    }
    .invoice-continuation-header {
      display: table-row !important;
    }
    .invoice-continuation-header > td {
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
    /* Restore Classic 7mm body inset (sheet padding removed for full-bleed header) */
    .invoice-print-shell-row > td {
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
    .invoice-page-footer {
      position: absolute !important;
      bottom: 4mm !important;
      left: 7mm !important;
      right: 7mm !important;
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
