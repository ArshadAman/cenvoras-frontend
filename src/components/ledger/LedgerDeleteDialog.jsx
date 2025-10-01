import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteLedgerEntry } from '../../api/ledger';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function LedgerDeleteDialog({ isOpen, onClose, entry }) {
  const queryClient = useQueryClient();

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4">
          <div className="flex items-center">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
              <svg 
                className="h-6 w-6 text-red-600 dark:text-red-400" 
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
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Delete Ledger Entry
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete this ledger entry? This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Entry Details */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>
                <span className="text-gray-900 dark:text-white">{formatDate(entry.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Customer:</span>
                <span className="text-gray-900 dark:text-white">
                  {entry.customer?.name || 'Unknown Customer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
                <span className="text-gray-900 dark:text-white truncate ml-2" title={entry.description}>
                  {entry.description}
                </span>
              </div>
              {entry.debit > 0 && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Debit:</span>
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {formatCurrency(entry.debit)}
                  </span>
                </div>
              )}
              {entry.credit > 0 && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Credit:</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {formatCurrency(entry.credit)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 dark:border-gray-600">
                <span className="font-medium text-gray-700 dark:text-gray-300">Balance:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {formatCurrency(entry.balance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteEntryMutation.isLoading}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteEntryMutation.isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Deleting...
              </span>
            ) : (
              'Delete Entry'
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={deleteEntryMutation.isLoading}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}