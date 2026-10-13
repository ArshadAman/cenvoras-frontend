/**
 * Date utilities with strict Asia/Kolkata timezone support (IST, UTC+05:30).
 * Prevents UTC day rollover bugs where 13/10 displays as 12/10.
 */

export function getTodayKolkata(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  // Uses en-CA which outputs YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

export function getKolkataMonthBounds(date = new Date()) {
  const todayStr = getTodayKolkata(date);
  const [yearStr, monthStr] = todayStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  
  const from = `${yearStr}-${monthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

/** Calendar year start (Jan 1) in Asia/Kolkata. */
export function getKolkataYearStart(date = new Date()) {
  const todayStr = getTodayKolkata(date);
  const year = todayStr.split('-')[0];
  return `${year}-01-01`;
}

/** Indian FY start (Apr 1) in Asia/Kolkata. */
export function getKolkataFYStart(date = new Date()) {
  const todayStr = getTodayKolkata(date);
  const [yearStr, monthStr] = todayStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const fyYear = month >= 4 ? year : year - 1;
  return `${fyYear}-04-01`;
}

export function formatDateKolkata(date, format = 'DD-MM-YYYY') {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).formatToParts(d);

  const day = parts.find(p => p.type === 'day')?.value || '01';
  const month = parts.find(p => p.type === 'month')?.value || '01';
  const year = parts.find(p => p.type === 'year')?.value || '1970';

  if (format === 'DD-MM-YYYY') return `${day}-${month}-${year}`;
  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  if (format === 'DD-MMM-YYYY') {
    const monthShort = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
    }).format(d);
    return `${day}-${monthShort}-${year}`;
  }
  return `${day}/${month}/${year}`;
}
