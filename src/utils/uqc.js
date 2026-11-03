// UAT P1 item 5 (Rudra CA): quantity precision by UQC. Mirrors billing/uqc.py on the backend.
// Count units (NOS/PCS/UNT/BOX/SET/PRS/DOZ) are whole numbers only; measured units
// (KGS/GMS/LTR/MLT/MTR/CMS/SQM/CBM/TON/QTL) allow up to 3 decimals. Unknown units count as whole.
// Stock is decimal(15,3), so fractional returns of measured units go back into stock.
// Quantities are never rounded silently: the input keeps what was typed and shows an error.
const ALIASES = {
  NOS: 'NOS', NO: 'NOS', NUMBER: 'NOS', NUMBERS: 'NOS',
  PCS: 'PCS', PC: 'PCS', PIECE: 'PCS', PIECES: 'PCS',
  UNT: 'UNT', UNIT: 'UNT', UNITS: 'UNT',
  BOX: 'BOX', BOXES: 'BOX', SET: 'SET', SETS: 'SET',
  PRS: 'PRS', PAIR: 'PRS', PAIRS: 'PRS', DOZ: 'DOZ', DOZEN: 'DOZ', DOZENS: 'DOZ',
  KGS: 'KGS', KG: 'KGS', KILOGRAM: 'KGS', KILOGRAMS: 'KGS',
  GMS: 'GMS', G: 'GMS', GM: 'GMS', GRAM: 'GMS', GRAMS: 'GMS',
  LTR: 'LTR', L: 'LTR', LITRE: 'LTR', LITRES: 'LTR', LITER: 'LTR', LITERS: 'LTR',
  MLT: 'MLT', ML: 'MLT', MILLILITRE: 'MLT',
  MTR: 'MTR', M: 'MTR', METER: 'MTR', METRE: 'MTR', METERS: 'MTR', METRES: 'MTR',
  CMS: 'CMS', CM: 'CMS', CENTIMETER: 'CMS', CENTIMETRE: 'CMS',
  SQM: 'SQM', SQMTR: 'SQM', 'SQ M': 'SQM', 'SQ.M': 'SQM',
  CBM: 'CBM', 'CUBIC METER': 'CBM', 'CUBIC METRE': 'CBM',
  TON: 'TON', TONS: 'TON', TONNE: 'TON', TONNES: 'TON', MT: 'TON',
  QTL: 'QTL', QUINTAL: 'QTL', QUINTALS: 'QTL',
};
const MEASURED = new Set(['KGS', 'GMS', 'LTR', 'MLT', 'MTR', 'CMS', 'SQM', 'CBM', 'TON', 'QTL']);

export const toUqc = (unit) => ALIASES[String(unit || '').trim().toUpperCase().split(/\s+/).join(' ')] || null;
export const isMeasuredUnit = (unit) => MEASURED.has(toUqc(unit));

const decimalsOf = (str) => {
  const s = String(str ?? '').trim();
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.slice(i + 1).replace(/0+$/, '').length;
};

// Returns an error string or '' for a typed quantity (string or number).
export const quantityError = (value, unit) => {
  const s = String(value ?? '').trim();
  if (s === '' || Number(s) === 0) return '';
  if (!/^\d*\.?\d*$/.test(s) || Number.isNaN(Number(s))) return 'Enter a valid quantity.';
  const label = String(unit || '').trim() || 'units';
  const d = decimalsOf(s);
  if (isMeasuredUnit(unit)) {
    if (d > 3) return `${label} quantities can have at most 3 decimals.`;
    return '';
  }
  if (d > 0) return `${label} is counted in whole units, so the quantity must be a whole number.`;
  return '';
};
