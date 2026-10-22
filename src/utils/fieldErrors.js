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
