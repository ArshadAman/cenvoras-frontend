import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveValidPdfBlob } from '../src/utils/pdfValidation.js';
import {
  INVOICE_PRINT_DOCUMENT_RULES,
  INVOICE_PRINT_PAGE_STYLE,
  INVOICE_INLINE_PRINT_STYLE,
} from '../src/utils/invoicePrintStyles.js';

test('resolveValidPdfBlob accepts real %PDF- Blob and TypedArray payloads', async () => {
  const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
  const blobInput = new Blob([bytes], { type: 'application/octet-stream' });

  const normalized = await resolveValidPdfBlob(blobInput);
  assert.ok(normalized instanceof Blob);
  assert.equal(normalized.type, 'application/pdf');
  assert.equal(await normalized.text(), '%PDF-1.4');

  const fromArray = await resolveValidPdfBlob(bytes);
  assert.ok(fromArray instanceof Blob);
  assert.equal(fromArray.type, 'application/pdf');
  assert.equal(await fromArray.text(), '%PDF-1.4');
});

test('resolveValidPdfBlob rejects unwrapped AxiosResponse objects and non-PDF payloads', async () => {
  await assert.rejects(
    () => resolveValidPdfBlob({ data: new Blob(['%PDF-1.4']), status: 200 }),
    /expected binary Blob/i
  );

  await assert.rejects(
    () => resolveValidPdfBlob(new Blob(['<html>502 Bad Gateway</html>'], { type: 'text/html' })),
    /expected %PDF- header/i
  );

  await assert.rejects(
    () => resolveValidPdfBlob(new Blob(['{"error":"failed"}'], { type: 'application/json' })),
    /expected %PDF- header/i
  );

  await assert.rejects(
    () => resolveValidPdfBlob(new Blob(['%PDF'])),
    /too small/i
  );
});

test('print stylesheet preserves preview A4 dimensions and .flex-1 layouts', () => {
  for (const css of [INVOICE_PRINT_DOCUMENT_RULES, INVOICE_PRINT_PAGE_STYLE, INVOICE_INLINE_PRINT_STYLE]) {
    assert.match(css, /\.invoice-sheet\s*\{[^}]*width:\s*210mm\s*!important;/s);
    assert.match(css, /\.invoice-sheet\s*\{[^}]*min-height:\s*297mm\s*!important;/s);
    assert.match(css, /\[data-print-target\]\s*\{[^}]*width:\s*210mm\s*!important;/s);
    assert.match(css, /\[data-print-target\]\s*\{[^}]*min-height:\s*297mm\s*!important;/s);
    assert.doesNotMatch(css, /min-height:\s*100%/);
    assert.doesNotMatch(css, /\.invoice-sheet\s+\.flex-1/);
    assert.match(css, /\.invoice-sheet-body\s*\{[^}]*flex:\s*0\s+0\s+auto\s*!important;/s);
    assert.match(css, /\[data-print-wrapper\]\s*\{[^}]*transform:\s*none\s*!important;/s);
  }
});
