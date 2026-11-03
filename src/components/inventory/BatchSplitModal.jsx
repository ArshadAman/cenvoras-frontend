import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductBatches } from "../../api/inventory";
import { splitBatch } from "../../api/reports";
import { XMarkIcon, ScissorsIcon } from '@heroicons/react/24/outline';
import useEscKey from "../../hooks/useEscStack";

export default function BatchSplitModal({ onClose }) {
  useEscKey(onClose, true, 20);
  const queryClient = useQueryClient();
  const [selectedBatch, setSelectedBatch] = useState('');
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [splitQuantity, setSplitQuantity] = useState('');
  const [manufacturingDate, setManufacturingDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["allBatches"],
    queryFn: () => getProductBatches({}),
  });

  const batchList = Array.isArray(batches) ? batches : (batches.results || []);

  const mutation = useMutation({
    mutationFn: splitBatch,
    onSuccess: (data) => {
      setSuccess(data.message);
      setError('');
      queryClient.invalidateQueries(["allBatches"]);
      queryClient.invalidateQueries(["products"]);
      setTimeout(() => onClose(), 2000);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to split batch.');
      setSuccess('');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!selectedBatch || !newBatchNumber || !splitQuantity) {
      setError('All fields are required.');
      return;
    }
    mutation.mutate({
      batch_id: selectedBatch,
      new_batch_number: newBatchNumber.trim(),
      split_quantity: parseInt(splitQuantity),
      manufacturing_date: manufacturingDate || undefined,
      expiry_date: expiryDate || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <ScissorsIcon className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Split Batch</h2>
              <p className="text-xs text-[var(--text-muted)]">Move stock from one batch into a new sub-batch</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-[var(--bg-primary)] border border-[var(--accent-primary)] rounded-lg text-[var(--accent-primary)] text-sm">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Source Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
            >
              <option value="">Select a batch...</option>
              {batchList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.product_name} — {b.batch_number} | Available: {b.stock_points?.reduce((acc, sp) => acc + sp.quantity, 0) || 0} | Exp: {b.expiry_date || 'N/A'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">New Batch Number</label>
            <input
              type="text"
              value={newBatchNumber}
              onChange={(e) => setNewBatchNumber(e.target.value)}
              placeholder="e.g. B001-1"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Quantity to Split</label>
            <input
              type="number"
              min="1"
              value={splitQuantity}
              onChange={(e) => setSplitQuantity(e.target.value)}
              placeholder="Units to move to new batch"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Mfg. Date <span className="text-[var(--text-muted)] text-xs font-normal">(Optional)</span></label>
              <input
                type="date"
                value={manufacturingDate}
                onChange={(e) => setManufacturingDate(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Exp. Date <span className="text-[var(--text-muted)] text-xs font-normal">(Optional)</span></label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Notes <span className="text-[var(--text-muted)] text-xs font-normal">(Optional)</span></label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Custom remarks for this batch"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg btn-secondary text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-3 rounded-lg btn-primary text-sm font-bold transition-all disabled:opacity-50"
            >
              {mutation.isPending ? 'Splitting...' : 'Split Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
