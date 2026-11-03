/**
 * View model for the Credit Note Details tax split. Amounts come from the backend
 * `tax_breakup` (same computation as GSTR-1 CDNR); nothing is recalculated here.
 */
export function creditNoteTaxView(note) {
  const tb = note?.tax_breakup;
  if (!tb) return null;
  const inter = !!tb.is_interstate;
  const byId = Object.fromEntries((tb.lines || []).map((l) => [String(l.id), l]));
  const halfRate = (r) => {
    const n = Number(r || 0) / 2;
    return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  };
  const rateLabel = (r) => {
    const n = Number(r || 0);
    return Number.isInteger(n) ? String(n) : String(n);
  };
  const lineTax = (itemId) => {
    const l = byId[String(itemId)];
    if (!l) return null;
    return inter
      ? { parts: [{ label: `IGST ${rateLabel(l.rate)}%`, amount: l.igst }], taxable: l.taxable }
      : {
          parts: [
            { label: `CGST ${halfRate(l.rate)}%`, amount: l.cgst },
            { label: `SGST ${halfRate(l.rate)}%`, amount: l.sgst },
          ],
          taxable: l.taxable,
        };
  };
  const t = tb.totals || {};
  const totals = inter
    ? [['Taxable value', t.taxable], ['IGST', t.igst], ['Total', t.total]]
    : [['Taxable value', t.taxable], ['CGST', t.cgst], ['SGST', t.sgst], ['Total', t.total]];
  return { isInterstate: inter, lineTax, totals };
}

export function originalInvoiceLabel(note) {
  return note?.original_invoice ? (note.original_invoice_number || '—') : '—';
}
