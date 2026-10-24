import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { getBankDepositSummary, createBankDeposit } from '../../api/ledger';
import { getTodayKolkata } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';

export default function BankDepositTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['bank-deposit-summary'],
    queryFn: getBankDepositSummary,
  });

  const [form, setForm] = useState({
    amount: '',
    source: 'owner',
    date: getTodayKolkata(),
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: createBankDeposit,
    onSuccess: (res) => {
      toast.success(`₹${Number(res.amount).toLocaleString('en-IN')} added to ${res.balances?.bank?.name || 'Bank'}`);
      setForm((prev) => ({ ...prev, amount: '', notes: '' }));
      queryClient.invalidateQueries({ queryKey: ['bank-deposit-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Could not update bank balance');
    },
  });

  const cashBal = Number(data?.balances?.cash?.balance || 0);
  const bankBal = Number(data?.balances?.bank?.balance || 0);
  const amountNum = Number(form.amount || 0);
  const previewBank = bankBal + (amountNum > 0 ? amountNum : 0);
  const previewCash = form.source === 'cash' && amountNum > 0 ? cashBal - amountNum : cashBal;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amountNum || amountNum <= 0) {
      toast.error('Enter an amount greater than zero');
      return;
    }
    mutation.mutate({
      amount: amountNum.toFixed(2),
      source: form.source,
      date: form.date,
      notes: form.notes.trim(),
    });
  };

  const ic = 'w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <BanknotesIcon className="w-5 h-5 text-[var(--accent-primary)]" />
          Update bank balance
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
          Bank is not only sales receipts. Deposit cash you collected, or extra money you put in, so payroll and vendor payments see the real balance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4">
          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Cash (1001)</p>
          <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1 tabular-nums">
            {isLoading ? '—' : formatCurrency(cashBal)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4">
          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Bank (1002)</p>
          <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1 tabular-nums">
            {isLoading ? '—' : formatCurrency(bankBal)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 p-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Where is this money from?</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, source: 'cash' }))}
              className={`text-left rounded-xl border px-3 py-3 text-sm transition ${
                form.source === 'cash'
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--text-primary)]'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
              }`}
            >
              <span className="font-semibold block">Cash collected</span>
              <span className="text-xs text-[var(--text-muted)]">Move Cash (1001) into Bank. Use this when you deposited shop cash.</span>
            </button>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, source: 'owner' }))}
              className={`text-left rounded-xl border px-3 py-3 text-sm transition ${
                form.source === 'owner'
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--text-primary)]'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
              }`}
            >
              <span className="font-semibold block">Extra / owner money</span>
              <span className="text-xs text-[var(--text-muted)]">Capital or any extra you put in the bank that is not already in Cash.</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Amount *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              className={ic}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Date *</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className={ic}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Note (optional)</label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            className={ic}
            placeholder="e.g. October cash deposited, owner top-up"
          />
        </div>

        {amountNum > 0 && (
          <p className="text-xs text-[var(--text-muted)]">
            After this, Bank will show {formatCurrency(previewBank)}
            {form.source === 'cash' ? ` and Cash ${formatCurrency(previewCash)}.` : '.'}
          </p>
        )}

        <button type="submit" disabled={mutation.isPending} className="btn-primary px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
          {mutation.isPending ? 'Saving…' : 'Add to bank'}
        </button>
      </form>

      {!!data?.recent?.length && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Recent deposits</h3>
          <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-[var(--text-muted)] bg-[var(--bg-primary)]">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Date</th>
                  <th className="text-left px-3 py-2 font-medium">Description</th>
                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border-subtle)]">
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{row.date}</td>
                    <td className="px-3 py-2 text-[var(--text-primary)]">{row.description}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[var(--text-primary)]">
                      {formatCurrency(Number(row.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
