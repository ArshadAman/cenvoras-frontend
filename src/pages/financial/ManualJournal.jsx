import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/api';
import Button from '../../components/common/Button';
import { PlusIcon, TrashIcon, ArrowLeftIcon, BookOpenIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

const fetchAccounts = () => api.get('/ledger/accounts/').then(res => res.data);
const createManualJournalEntry = (data) => api.post('/ledger/create-journal-entry/', data).then(res => res.data);

export default function ManualJournal() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toLocaleDateString('sv-SE'));
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [entries, setEntries] = useState([
    { account_id: '', debit: '', credit: '' },
    { account_id: '', debit: '', credit: '' },
  ]);

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  });

  const mutation = useMutation({
    mutationFn: createManualJournalEntry,
    onSuccess: () => {
      toast.success('Journal entry created successfully');
      navigate('/ledger');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create journal entry');
    }
  });

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    
    // Auto-clear opposite field if user starts typing in one
    if (field === 'debit' && value) newEntries[index].credit = '';
    if (field === 'credit' && value) newEntries[index].debit = '';
    
    setEntries(newEntries);
  };

  const addRow = () => {
    setEntries([...entries, { account_id: '', debit: '', credit: '' }]);
  };

  const removeRow = (index) => {
    if (entries.length <= 2) {
      toast.error('You need at least two rows for a balanced journal entry.');
      return;
    }
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
  };

  const totalDebit = entries.reduce((sum, e) => sum + (parseFloat(e.debit) || 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + (parseFloat(e.credit) || 0), 0);
  const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isBalanced) {
      toast.error(`Entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`);
      return;
    }

    const payload = {
      date,
      description,
      reference,
      entries: entries.map(e => ({
        account_id: e.account_id,
        debit: parseFloat(e.debit) || 0,
        credit: parseFloat(e.credit) || 0,
      })).filter(e => e.account_id && (e.debit > 0 || e.credit > 0)) // Only send filled rows
    };

    if (payload.entries.length < 2) {
      toast.error('At least two valid entry lines are required.');
      return;
    }

    mutation.mutate(payload);
  };

  return (
    <>
      <div className="p-6 md:p-10 space-y-6 max-w-5xl mx-auto animate-fade-up">
        {/* Back navigation */}
        <Link
          to="/ledger"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
        >
          <span className="p-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg group-hover:border-[var(--accent-primary)] transition-colors">
            <ArrowLeftIcon className="w-4 h-4 text-[var(--text-primary)]" />
          </span>
          Back to Ledger
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <BookOpenIcon className="w-8 h-8 text-[var(--accent-primary)]" />
            New Manual Journal Entry
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Create adjusting or balancing entries. Ensure total debits equal total credits.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Form Fields */}
          <div className="bento-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-semibold text-[var(--text-muted)] block mb-2">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-[var(--text-muted)] block mb-2">Description *</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., Opening balance adjustments, Corrections"
                className="input-field w-full"
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-semibold text-[var(--text-muted)] block mb-2">Reference Number</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optional reference, e.g., JRNL-001"
                className="input-field w-full"
              />
            </div>
          </div>

          {/* Lines */}
          <div className="bento-card overflow-hidden">
            <div className="bg-[var(--bg-primary)]/40 px-6 py-4 border-b border-[var(--border-default)] flex justify-between items-center">
              <h3 className="font-semibold text-[var(--text-primary)]">Journal Lines</h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addRow}
                icon={PlusIcon}
              >
                Add Line
              </Button>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--bg-primary)]/40">
                    <th className="px-6 py-3 text-xs font-bold text-[var(--text-primary)] uppercase">Account</th>
                    <th className="px-6 py-3 text-xs font-bold text-[var(--text-primary)] uppercase w-48 text-right">Debit</th>
                    <th className="px-6 py-3 text-xs font-bold text-[var(--text-primary)] uppercase w-48 text-right">Credit</th>
                    <th className="px-6 py-3 text-xs font-bold text-[var(--text-primary)] uppercase w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {entries.map((entry, index) => (
                    <tr key={index} className="hover:bg-[var(--bg-primary)]/30 transition-colors">
                      <td className="px-6 py-3">
                        <select
                          required
                          value={entry.account_id}
                          onChange={(e) => handleEntryChange(index, 'account_id', e.target.value)}
                          className="input-field w-full appearance-none bg-transparent select-none text-sm text-[var(--text-primary)]"
                        >
                          <option value="">Select Account</option>
                          {accountsLoading ? (
                            <option value="" disabled>Loading accounts...</option>
                          ) : (
                            accounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.code ? `${acc.code} - ` : ''}{acc.name} ({acc.account_type})
                              </option>
                            ))
                          )}
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={entry.debit}
                          onChange={(e) => handleEntryChange(index, 'debit', e.target.value)}
                          placeholder="0.00"
                          className="input-field w-full text-right bg-transparent placeholder-[var(--text-muted)] text-[var(--text-primary)] font-mono text-sm"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={entry.credit}
                          onChange={(e) => handleEntryChange(index, 'credit', e.target.value)}
                          placeholder="0.00"
                          className="input-field w-full text-right bg-transparent placeholder-[var(--text-muted)] text-[var(--text-primary)] font-mono text-sm"
                        />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-transparent rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-[var(--bg-primary)]/60 border-t-2 border-[var(--border-default)] font-bold">
                    <td className="px-6 py-4 text-right text-[var(--text-primary)]">Totals</td>
                    <td className={`px-6 py-4 text-right font-mono ${totalDebit > 0 && isBalanced ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-primary)] underline font-bold'}`}>
                      {getCurrencySymbol()}{totalDebit.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 text-right font-mono ${totalCredit > 0 && isBalanced ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-primary)] underline font-bold'}`}>
                      {getCurrencySymbol()}{totalCredit.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Balance Indicator */}
            <div className="px-6 py-4 border-t border-[var(--border-default)] flex justify-end">
              <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${isBalanced ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/30 text-[var(--accent-primary)] font-bold' : 'bg-[var(--bg-primary)] border-2 border-[var(--text-primary)] text-[var(--text-primary)] font-bold'}`}>
                {isBalanced ? (
                  <><CheckCircleIcon className="w-5 h-5" /> <span>Balanced & Ready</span></>
                ) : (
                  <><span>⚠ Difference: {getCurrencySymbol()}{Math.abs(totalDebit - totalCredit).toFixed(2)}</span></>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-default)]">
            <Link
              to="/ledger"
              className="btn-ghost"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              variant="primary"
              disabled={!isBalanced || mutation.isPending}
              isLoading={mutation.isPending}
            >
              Post Journal Entry
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
