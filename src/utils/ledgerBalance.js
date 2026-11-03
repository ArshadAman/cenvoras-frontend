const CREDIT_NORMAL_TYPES = new Set(['liability', 'equity', 'revenue']);

export function isCreditNormalAccount(accountType) {
  return CREDIT_NORMAL_TYPES.has(String(accountType || '').toLowerCase());
}

/** Type-signed net: assets/expenses Dr−Cr; liability/equity/revenue Cr−Dr. */
export function typeSignedNet(debit, credit, accountType) {
  const dr = Number(debit) || 0;
  const cr = Number(credit) || 0;
  return isCreditNormalAccount(accountType) ? cr - dr : dr - cr;
}

/** Dr/Cr label for a type-signed balance (positive = account-normal side). */
export function typeSignedNetLabel(balance, accountType) {
  const n = Number(balance) || 0;
  if (isCreditNormalAccount(accountType)) return n >= 0 ? 'Cr' : 'Dr';
  return n >= 0 ? 'Dr' : 'Cr';
}
