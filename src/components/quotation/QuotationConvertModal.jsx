import React, { useMemo, useState } from 'react';

export default function QuotationConvertModal({ isOpen, quotation, onClose, onConfirm, isSubmitting }) {
  const [selected, setSelected] = useState(new Set());

  const approvedItems = useMemo(() => {
    if (!quotation?.items) return [];
    return quotation.items.filter((item) => item.approval_status === 'approved' && !item.converted_to_order);
  }, [quotation]);

  React.useEffect(() => {
    if (!isOpen) return;
    setSelected(new Set(approvedItems.map((item) => item.id)));
  }, [isOpen, approvedItems]);

  if (!isOpen || !quotation) return null;

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectedIds = Array.from(selected);
  const selectedAmount = approvedItems
    .filter((item) => selected.has(item.id))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl flex flex-col max-h-[90vh] bg-slate-950 border border-cyan-500/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-slate-900 to-slate-950 px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-white text-lg font-semibold tracking-tight">Convert to Sales Order</h3>
            <p className="text-sm text-cyan-400 mt-1 font-medium">Ref: {quotation.quotation_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-sm text-gray-300">
            Select the approved items from this quotation that you want to convert into a new Sales Order.
          </p>

          {approvedItems.length === 0 ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-sm">
              No pending approved items available for conversion.
            </div>
          ) : (
            <div className="space-y-3">
              {approvedItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggle(item.id)}
                      className="w-5 h-5 rounded border-gray-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <p className="text-white font-medium text-base truncate">{item.product_name}</p>
                      <p className="text-cyan-400 font-semibold whitespace-nowrap">
                        Rs {Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                      <span><span className="text-gray-500">Qty:</span> {item.quantity} {item.unit || ''}</span>
                      <span><span className="text-gray-500">Rate:</span> Rs {Number(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-slate-900/50 px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">Selected <span className="text-white font-medium">{selectedIds.length}</span> item(s)</span>
            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
            <span className="text-gray-400">Total: <span className="text-cyan-400 font-bold text-lg">Rs {selectedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 text-gray-300 font-medium hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedIds)}
              disabled={isSubmitting || selectedIds.length === 0}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
            >
              {isSubmitting ? 'Converting...' : 'Create Sales Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
