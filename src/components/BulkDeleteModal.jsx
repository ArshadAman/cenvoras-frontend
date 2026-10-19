import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const BulkDeleteModal = ({
  isOpen,
  onClose,
  selectedItems,
  onClearSelection,
  bulkDeleteFn,
  invalidateQueries = [],
  itemType = 'item',
  title = 'Delete Selected Items',
  description = 'Are you sure you want to delete the selected items? This action cannot be undone.'
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, failed: [] });
  const queryClient = useQueryClient();

  const bulkDeleteMutation = useMutation({
    mutationFn: async (itemIds) => {
      setIsDeleting(true);
      setProgress({ completed: 0, total: itemIds.length, failed: [] });

      try {
        const result = await bulkDeleteFn(itemIds);
        return result;
      } catch (error) {
        // Handle partial failures
        if (error.results) {
          return error.results;
        }
        throw error;
      }
    },
    onSuccess: (result) => {
      setIsDeleting(false);
      
      const successCount = result.successful?.length || 0;
      const failCount = result.failed?.length || 0;
      
      if (failCount === 0) {
        toast.success(`Successfully deleted ${successCount} ${itemType}${successCount === 1 ? '' : 's'}`);
      } else {
        toast.warning(`Deleted ${successCount} ${itemType}${successCount === 1 ? '' : 's'}, but ${failCount} failed`);
        
        // Show individual failure messages
        result.failed?.forEach((failure, index) => {
          if (index < 3) { // Limit to first 3 error messages to avoid spam
            toast.error(`Failed to delete ${itemType} ${failure.id}: ${failure.error}`);
          }
        });
        
        if (result.failed?.length > 3) {
          toast.error(`... and ${result.failed.length - 3} more failures`);
        }
      }

      // Invalidate queries to refresh data
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });

      onClearSelection();
      onClose();
    },
    onError: (error) => {
      setIsDeleting(false);
      console.error('Bulk delete error:', error);
      toast.error(`Failed to delete ${itemType}s: ${error.message}`);
    }
  });

  const handleConfirmDelete = () => {
    if (selectedItems.length > 0) {
      bulkDeleteMutation.mutate(selectedItems);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl animate-fade-up">
        <div className="p-8">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20">
              <svg className="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {description}
              </p>
            </div>
          </div>
          
          {/* Selected items preview */}
          <div className="mt-6 p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)]">
            <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
              Selected {itemType}s ({selectedItems.length}):
            </p>
            <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar">
              <div className="text-xs font-mono text-[var(--text-muted)] space-y-1.5">
                {selectedItems.slice(0, 10).map((id) => (
                  <div key={id} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500/50"></span>
                    ID: <span className="text-[var(--text-primary)]">{id}</span>
                  </div>
                ))}
                {selectedItems.length > 10 && (
                  <div className="text-[var(--text-muted)] italic pl-3.5">
                    ... and {selectedItems.length - 10} more
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress indicator during deletion */}
          {isDeleting && (
            <div className="mt-6">
              <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
                <span>Deleting {itemType}s...</span>
                <span>{progress.completed} / {progress.total}</span>
              </div>
              <div className="w-full bg-[var(--bg-primary)] rounded-full h-2 border border-[var(--border-subtle)] overflow-hidden">
                <div 
                  className="bg-rose-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                ></div>
              </div>
              {progress.failed.length > 0 && (
                <p className="text-xs text-rose-500 mt-2 font-medium">
                  {progress.failed.length} deletion{progress.failed.length === 1 ? '' : 's'} failed
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="p-6 bg-[var(--bg-primary)]/40 flex justify-end gap-3 rounded-b-xl border-t border-[var(--border-default)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn-secondary !text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500/25 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              `Delete ${selectedItems.length} ${itemType}${selectedItems.length === 1 ? '' : 's'}`
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BulkDeleteModal;