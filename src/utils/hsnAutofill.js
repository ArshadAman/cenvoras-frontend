import { lookupLearnedHsnGst } from "../api/learned_hsn";

/**
 * If tax is empty/zero, fill from tenant-learned HSN→GST map.
 * Returns the applied rate or null.
 */
export async function autofillTaxFromLearnedHsn(hsn, currentTax, setTax) {
  const code = String(hsn || "").trim();
  if (code.length < 4) return null;
  const taxNum = Number(currentTax);
  if (Number.isFinite(taxNum) && taxNum > 0) return null;

  try {
    const hit = await lookupLearnedHsnGst(code);
    if (!hit || hit.gst_rate == null) return null;
    const rate = Number(hit.gst_rate);
    if (!Number.isFinite(rate)) return null;
    setTax(rate);
    return rate;
  } catch {
    return null;
  }
}
