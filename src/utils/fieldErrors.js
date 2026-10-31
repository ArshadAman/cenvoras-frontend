/**
 * Pull DRF field errors out of an axios error: { gstin: ["..."] } or
 * { error, details: { gstin: ["..."] } }. Returns { field: "first message" }.
 */
export function extractFieldErrors(err) {
  const data = err?.response?.data;
  if (!data || typeof data !== 'object') return {};
  const src = data.details && typeof data.details === 'object' ? data.details : data;
  const out = {};
  for (const [k, v] of Object.entries(src)) {
    if (['detail', 'error', 'message', 'non_field_errors'].includes(k)) continue;
    const msg = Array.isArray(v) ? v[0] : v;
    if (typeof msg === 'string' && msg) out[k] = msg;
  }
  return out;
}

/** Flatten any DRF error body (nested lists/objects) into one readable string. */
export function extractServerMessage(err, fallback = 'Request failed') {
  const data = err?.response?.data;
  const msgs = [];
  const walk = (v, key) => {
    if (v == null) return;
    if (typeof v === 'string') { msgs.push(v); return; }
    if (Array.isArray(v)) { v.forEach((x) => walk(x, key)); return; }
    if (typeof v === 'object') Object.values(v).forEach((x) => walk(x, key));
  };
  if (typeof data === 'string' && data && !data.trim().startsWith('<')) msgs.push(data);
  else if (data && typeof data === 'object') walk(data);
  const uniq = [...new Set(msgs.map((m) => m.trim()).filter(Boolean))];
  if (uniq.length) return uniq.join(' ');
  if (err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '')) return 'The server took too long to respond. Check the list before retrying so you do not create a duplicate.';
  return err?.message || fallback;
}

/** Product UUID from a bill/invoice line. `product` is serialised as the NAME, so prefer product_detail.id. */
export function lineProductId(item) {
  return item?.product_detail?.id || item?.product_id || item?.product || null;
}

/** Remaining returnable qty for a line, given a {productId: qty} map from the server (falls back to original qty). */
export function remainingQtyFor(productId, originalQty, remainingMap) {
  const orig = parseFloat(originalQty || 0);
  if (!remainingMap || productId == null || !(String(productId) in remainingMap)) return orig;
  return Math.max(0, Math.min(orig, parseFloat(remainingMap[String(productId)] || 0)));
}

/** True when a typed return qty exceeds the server remaining cap. */
export function exceedsRemainingQty(returnQty, remainingQty) {
  return (Number(returnQty) || 0) > (Number(remainingQty) || 0);
}
