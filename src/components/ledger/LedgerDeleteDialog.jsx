import React from 'react';
import { createPortal } from 'react-dom';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteLedgerEntry } from '../../api/ledger';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function LedgerDeleteDialog({ isOpen, onClose, entry }) {
  const queryClient = useQueryClient();
  const isDebitEntry = Number(entry?.debit || 0) > 0;

  const deleteEntryMutation = useMutation({
    mutationFn: deleteLedgerEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientLedger'] });
      queryClient.invalidateQueries({ queryKey: ['ledgerStats'] });
      toast.success('Ledger entry deleted successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete ledger entry');
    },
  });

  const handleDelete = () => {
    if (isDebitEntry) {
      toast.error('Debit ledger entries cannot be deleted.');
      return;
    }
    if (entry?.id) {
      deleteEntryMutation.mutate(entry.id);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) return '-';
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return '-';
    }
  };

  if (!isOpen || !entry) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-xl shadow-2xl shadow-red-900/20 animate-fade-up">
        <div className="p-8">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20">
              <svg 
                className="h-6 w-6 text-red-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Delete Ledger Entry
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                 Are you sure you want to delete this ledger entry?
              </p>
            </div>
          </div>

          {/* Entry Details */}
          <div className="mt-6 p-4 bg-[#1a1a1a] rounded-lg border border-white/5">
            <div className="text-sm space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-400">Date:</span>
                <span className="text-white font-medium">{formatDate(entry.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-400">Customer:</span>
                <span className="text-white font-medium">
                  {entry.customer?.name || 'Unknown Customer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-400">Description:</span>
                <span className="text-white font-medium truncate ml-2" title={entry.description}>
                  {entry.description}
                </span>
              </div>
              {entry.debit > 0 && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-400">Debit:</span>
                  <span className="text-red-400 font-bold">
                    {formatCurrency(entry.debit)}
                  </span>
                </div>
              )}
              {entry.credit > 0 && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-400">Credit:</span>
                  <span className="text-green-400 font-bold">
                    {formatCurrency(entry.credit)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                <span className="font-medium text-gray-400">Balance:</span>
                <span className="text-white font-bold">
                  {formatCurrency(entry.balance)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-200">
            Deletion policy: debit entries are blocked; credit entries linked to bills are only deletable when bill status is pending.
          </div>

          {isDebitEntry && (
            <div className="mt-3 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-300">
              This entry has a debit amount and cannot be deleted.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 bg-black/20 flex justify-end gap-3 rounded-b-xl border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={deleteEntryMutation.isLoading}
            className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteEntryMutation.isLoading || isDebitEntry}
            className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteEntryMutation.isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Deleting...
              </span>
            ) : (
              'Delete Entry'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}