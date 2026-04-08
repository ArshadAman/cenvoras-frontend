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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-xl shadow-2xl shadow-red-900/20 animate-fade-up">
        <div className="p-8">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {title}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {description}
              </p>
            </div>
          </div>
          
          {/* Selected items preview */}
          <div className="mt-6 p-4 bg-[#1a1a1a] rounded-lg border border-white/5">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
              Selected {itemType}s ({selectedItems.length}):
            </p>
            <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar">
              <div className="text-xs font-mono text-gray-500 space-y-1.5">
                {selectedItems.slice(0, 10).map((id) => (
                  <div key={id} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500/50"></span>
                    ID: <span className="text-gray-300">{id}</span>
                  </div>
                ))}
                {selectedItems.length > 10 && (
                  <div className="text-gray-600 italic pl-3.5">
                    ... and {selectedItems.length - 10} more
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress indicator during deletion */}
          {isDeleting && (
            <div className="mt-6">
              <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                <span>Deleting {itemType}s...</span>
                <span>{progress.completed} / {progress.total}</span>
              </div>
              <div className="w-full bg-[#1a1a1a] rounded-full h-2 border border-white/5 overflow-hidden">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                ></div>
              </div>
              {progress.failed.length > 0 && (
                <p className="text-xs text-red-400 mt-2 font-medium">
                  {progress.failed.length} deletion{progress.failed.length === 1 ? '' : 's'} failed
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="p-6 bg-black/20 flex justify-end gap-3 rounded-b-xl border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-900/20 flex items-center gap-2"
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