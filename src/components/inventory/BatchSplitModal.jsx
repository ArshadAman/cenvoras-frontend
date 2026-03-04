import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductBatches } from "../../api/inventory";
import { splitBatch } from "../../api/reports";
import { XMarkIcon, ScissorsIcon } from '@heroicons/react/24/outline';

export default function BatchSplitModal({ onClose }) {
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <ScissorsIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Split Batch</h2>
              <p className="text-xs text-gray-400">Move stock from one batch into a new sub-batch</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Source Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all"
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
            <label className="block text-sm font-medium text-gray-300 mb-2">New Batch Number</label>
            <input
              type="text"
              value={newBatchNumber}
              onChange={(e) => setNewBatchNumber(e.target.value)}
              placeholder="e.g. B001-1"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quantity to Split</label>
            <input
              type="number"
              min="1"
              value={splitQuantity}
              onChange={(e) => setSplitQuantity(e.target.value)}
              placeholder="Units to move to new batch"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mfg. Date <span className="text-gray-500 text-xs font-normal">(Optional)</span></label>
              <input
                type="date"
                value={manufacturingDate}
                onChange={(e) => setManufacturingDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Exp. Date <span className="text-gray-500 text-xs font-normal">(Optional)</span></label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes <span className="text-gray-500 text-xs font-normal">(Optional)</span></label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Custom remarks for this batch"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {mutation.isPending ? 'Splitting...' : 'Split Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
