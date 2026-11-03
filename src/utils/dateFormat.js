/** Shared IST / Indian business date helpers. */

const IST = 'Asia/Kolkata';

export function formatBusinessDate(value) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    // Already YYYY-MM-DD (date-only) — format without timezone shift
    const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return String(value);
  }
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: IST,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toLocaleDateString('en-IN');
  }
}

export function formatAuditTimestamp(value) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return (
      new Intl.DateTimeFormat('en-GB', {
        timeZone: IST,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(d) + ' IST'
    );
  } catch {
    return d.toLocaleString('en-IN');
  }
}
