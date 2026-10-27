export const INDIAN_STATES = [
  { code: 'AN', name: 'Andaman and Nicobar Islands' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'CG', name: 'Chhattisgarh' },
  { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: 'DL', name: 'Delhi' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JK', name: 'Jammu and Kashmir' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'LA', name: 'Ladakh' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OR', name: 'Odisha' },
  { code: 'PY', name: 'Puducherry' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TG', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UT', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' }
];

export const GST_STATE_CODE_MAP = {
  '01': 'JK',
  '02': 'HP',
  '03': 'PB',
  '04': 'CH',
  '05': 'UT',
  '06': 'HR',
  '07': 'DL',
  '08': 'RJ',
  '09': 'UP',
  '10': 'BR',
  '11': 'SK',
  '12': 'AR',
  '13': 'NL',
  '14': 'MN',
  '15': 'MZ',
  '16': 'TR',
  '17': 'ML',
  '18': 'AS',
  '19': 'WB',
  '20': 'JH',
  '21': 'OR',
  '22': 'CG',
  '23': 'MP',
  '24': 'GJ',
  '26': 'DN',
  '27': 'MH',
  '29': 'KA',
  '30': 'GA',
  '31': 'LD',
  '32': 'KL',
  '33': 'TN',
  '34': 'PY',
  '35': 'AN',
  '36': 'TG',
  '37': 'AP',
  '38': 'LA',
};

// Customer place of supply (same rule as backend billing.gst_rules.customer_pos):
// registered -> GSTIN state code, else address state. Returns the INDIAN_STATES code (e.g. 'OR') or ''.
const STATE_ALIASES = { OD: 'OR', ORISSA: 'OR', TS: 'TG', UK: 'UT', UTTARANCHAL: 'UT' };
export const stateToCode = (v) => {
  if (!v) return '';
  const t = String(v).trim();
  if (/^\d{1,2}$/.test(t)) return GST_STATE_CODE_MAP[t.padStart(2, '0')] || '';
  const up = t.toUpperCase();
  const byCode = INDIAN_STATES.find((s) => s.code === up);
  if (byCode) return byCode.code;
  if (STATE_ALIASES[up]) return STATE_ALIASES[up];
  const byName = INDIAN_STATES.find((s) => s.name.toUpperCase() === up.replace(/^\d{2}\s*-\s*/, ''));
  return byName ? byName.code : '';
};
export const customerPosCode = (customer) => {
  const g = String(customer?.gstin || '').trim();
  if (g.length === 15 && GST_STATE_CODE_MAP[g.slice(0, 2)]) return GST_STATE_CODE_MAP[g.slice(0, 2)];
  return stateToCode(customer?.state);
};

// Rule 46: POS printed as "State name (GST code)", e.g. "Odisha (21)".
export const posLabel = (v) => {
  const code = stateToCode(v);
  if (!code) return v ? String(v) : '';
  const st = INDIAN_STATES.find((s) => s.code === code);
  const num = Object.keys(GST_STATE_CODE_MAP).find((k) => GST_STATE_CODE_MAP[k] === code);
  return `${st ? st.name : code}${num ? ` (${num})` : ''}`;
};
