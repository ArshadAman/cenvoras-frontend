import { describe, it, expect } from 'vitest';
import { STATEMENT_PRINT_PAGE_STYLE, prepareClonedStatementElementForPdf } from './statementPrintStyles';

describe('statementPrintStyles', () => {
  it('defines comprehensive print page rules and tokens in STATEMENT_PRINT_PAGE_STYLE', () => {
    expect(STATEMENT_PRINT_PAGE_STYLE).toContain('@page');
    expect(STATEMENT_PRINT_PAGE_STYLE).toContain('size: A4 portrait');
    expect(STATEMENT_PRINT_PAGE_STYLE).toContain('@media print');
    expect(STATEMENT_PRINT_PAGE_STYLE).toContain('--text-primary: #0f172a');
    expect(STATEMENT_PRINT_PAGE_STYLE).toContain('--status-success-text: #166534');
    expect(STATEMENT_PRINT_PAGE_STYLE).toContain('--status-warning-text: #9a3412');
    expect(STATEMENT_PRINT_PAGE_STYLE).toContain('overflow: visible !important');
    expect(STATEMENT_PRINT_PAGE_STYLE).toContain('.print-hidden');
  });

  it('prepareClonedStatementElementForPdf strips dark mode and applies light tokens to cloned DOM', () => {
    // Construct mock DOM
    const doc = document.implementation.createHTMLDocument('Test Statement');
    doc.documentElement.classList.add('dark');
    doc.body.classList.add('dark');

    const container = doc.createElement('div');
    container.setAttribute('data-print-target', '');
    container.className = 'overflow-y-auto';

    const actionBtn = doc.createElement('div');
    actionBtn.className = 'print-hidden';
    actionBtn.textContent = 'Action Eye Icon';
    container.appendChild(actionBtn);

    const scrollTable = doc.createElement('div');
    scrollTable.className = 'overflow-x-auto';
    const docLinkBtn = doc.createElement('button');
    docLinkBtn.className = 'statement-doc-link';
    docLinkBtn.textContent = 'BILL-1001';
    scrollTable.appendChild(docLinkBtn);
    container.appendChild(scrollTable);

    doc.body.appendChild(container);

    const prepared = prepareClonedStatementElementForPdf(doc, '[data-print-target]');

    expect(prepared).not.toBeNull();
    // Verify dark class removed
    expect(doc.documentElement.classList.contains('dark')).toBe(false);
    expect(doc.body.classList.contains('dark')).toBe(false);

    // Verify dimensions set for A4
    expect(prepared.style.width).toBe('794px');
    expect(prepared.style.maxWidth).toBe('794px');
    expect(prepared.style.overflow).toBe('visible');
    expect(prepared.style.backgroundColor).toBe('rgb(255, 255, 255)');

    // Verify CSS variables set
    expect(prepared.style.getPropertyValue('--text-primary')).toBe('#0f172a');
    expect(prepared.style.getPropertyValue('--status-success-text')).toBe('#166534');
    expect(prepared.style.getPropertyValue('--status-warning-text')).toBe('#9a3412');

    // Verify .print-hidden is hidden
    expect(actionBtn.style.display).toBe('none');

    // Verify overflow is visible
    expect(scrollTable.style.overflow).toBe('visible');

    // Verify doc link button is cleaned
    expect(docLinkBtn.style.background).toBe('transparent');
  });

  it('prepareClonedStatementElementForPdf gracefully handles null or missing elements', () => {
    expect(prepareClonedStatementElementForPdf(null)).toBeNull();

    const emptyDoc = document.implementation.createHTMLDocument('Empty');
    expect(prepareClonedStatementElementForPdf(emptyDoc, '.non-existent')).toBeNull();
  });
});
