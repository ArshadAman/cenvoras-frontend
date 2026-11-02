export function profileBankAccounts(profile) {
  const billing = profile?.billing_profile || profile?.profile || profile || {};
  if (Array.isArray(billing.bank_accounts) && billing.bank_accounts.length > 0) {
    return billing.bank_accounts;
  }
  if (billing.bank_name || billing.bank_account_number) {
    return [{
      id: 'bank_acc_1',
      account_name: 'Primary Account',
      bank_name: billing.bank_name || '',
      account_number: billing.bank_account_number || '',
      ifsc_code: billing.bank_ifsc_code || '',
      is_default: true,
    }];
  }
  return [];
}

export function defaultBankAccountId(accounts) {
  if (!accounts?.length) return '';
  const preferred = accounts.find((a) => a.is_default) || accounts[0];
  return preferred.id || preferred.account_number || 'bank_acc_1';
}

export function findBankAccount(accounts, id) {
  if (!id) return null;
  return (accounts || []).find((a) => String(a.id) === String(id)) || null;
}

export function bankAccountLabel(account) {
  if (!account) return '';
  const last4 = String(account.account_number || '').slice(-4);
  const bank = account.bank_name || account.account_name || 'Bank';
  return last4 ? `${bank} ···${last4}` : bank;
}

export const BANK_MODES = new Set(['bank_transfer', 'upi', 'cheque']);
