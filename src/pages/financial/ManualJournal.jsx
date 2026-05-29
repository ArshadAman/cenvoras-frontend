import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/api';
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
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
        >
          <span className="p-1.5 bg-white/5 border border-white/10 rounded-lg group-hover:bg-white/10 transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
          </span>
          Back to Ledger
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <BookOpenIcon className="w-8 h-8 text-indigo-400" />
            New Manual Journal Entry
          </h1>
          <p className="text-sm text-gray-400">
            Create adjusting or balancing entries. Ensure total debits equal total credits.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Form Fields */}
          <div className="bento-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-300 block mb-2">Description *</label>
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
              <label className="text-sm font-medium text-gray-300 block mb-2">Reference Number</label>
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
            <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-semibold text-white">Journal Lines</h3>
              <button
                type="button"
                onClick={addRow}
                className="text-sm px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors rounded-lg flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" /> Add Line
              </button>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Account</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase w-48 text-right">Debit</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase w-48 text-right">Credit</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {entries.map((entry, index) => (
                    <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3">
                        <select
                          required
                          value={entry.account_id}
                          onChange={(e) => handleEntryChange(index, 'account_id', e.target.value)}
                          className="input-field w-full appearance-none bg-transparent select-none text-sm"
                        >
                          <option value="" className="bg-[#0f1017]">Select Account</option>
                          {accountsLoading ? (
                            <option value="" disabled className="bg-[#0f1017]">Loading accounts...</option>
                          ) : (
                            accounts.map((acc) => (
                              <option key={acc.id} value={acc.id} className="bg-[#0f1017]">
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
                          className="input-field w-full text-right bg-transparent placeholder-gray-600 font-mono text-sm"
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
                          className="input-field w-full text-right bg-transparent placeholder-gray-600 font-mono text-sm"
                        />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-white/5 border-t-2 border-white/10 font-bold">
                    <td className="px-6 py-4 text-right text-gray-300">Totals</td>
                    <td className={`px-6 py-4 text-right font-mono ${totalDebit > 0 && isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {getCurrencySymbol()}{totalDebit.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 text-right font-mono ${totalCredit > 0 && isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {getCurrencySymbol()}{totalCredit.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Balance Indicator */}
            <div className="px-6 py-4 border-t border-white/5 flex justify-end">
              <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${isBalanced ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                {isBalanced ? (
                  <><CheckCircleIcon className="w-5 h-5" /> <span>Balanced & Ready</span></>
                ) : (
                  <><span>⚠ Difference: {getCurrencySymbol()}{Math.abs(totalDebit - totalCredit).toFixed(2)}</span></>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Link
              to="/ledger"
              className="px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!isBalanced || mutation.isPending}
              className={`px-6 py-2.5 text-sm font-semibold rounded-xl text-white transition-colors flex items-center gap-2 ${
                isBalanced && !mutation.isPending
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
                  : 'bg-indigo-600/50 cursor-not-allowed text-white/50'
              }`}
            >
              {mutation.isPending ? 'Saving...' : 'Post Journal Entry'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
