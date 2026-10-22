/** Section 40A(3): cash expenditure over ₹10,000 to one person in a day may be disallowed. */
export const S40A3_LIMIT = 10000;

export function isCashAccount(acc) {
  if (!acc) return false;
  const code = String(acc.code || '');
  const name = String(acc.name || '').trim().toLowerCase();
  return code === '1001' || name === 'cash' || name.startsWith('cash ');
}

export function cash40A3Warning(acc, amount) {
  const amt = Number(amount || 0);
  if (isCashAccount(acc) && amt > S40A3_LIMIT) {
    return 'Section 40A(3): Cash payment exceeds ₹10,000 in a day. The expense may be disallowed; prefer Bank (1002).';
  }
  return '';
}
