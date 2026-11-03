// DOJ correction history (backend hr/services/doj_correction._log_history): each entry keeps the
// values before a recompute/edit: { action, at, by_email, reason, old: { amount, target_month, target_year } }.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const inr = (v) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function dojHistoryLines(corr) {
  const hist = Array.isArray(corr?.history) ? corr.history : [];
  return [...hist].reverse().map((h) => {
    const o = h.old || {};
    const when = h.at ? new Date(h.at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : '';
    const month = o.target_month ? `${MONTHS[o.target_month - 1]} ${o.target_year}` : '—';
    const verb = h.action === 'recompute' ? 'Recomputed' : h.action === 'edit' ? 'Edited' : (h.action || 'Changed');
    return `${verb} ${when} IST by ${h.by_email || h.by || 'unknown'}: was ₹${inr(o.amount)} in ${month}. Reason: ${h.reason || '—'}`;
  });
}
