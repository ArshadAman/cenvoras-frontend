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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-[min(96vw,1100px)] md:w-[min(92vw,1100px)] overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-950 shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
        <div className="bg-gradient-to-r from-cyan-600/20 to-slate-900/40 px-5 py-4 md:px-6 border-b border-white/10 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-white text-base md:text-lg font-semibold">Convert Quotation to Sales Order</h3>
            <p className="text-xs md:text-sm text-gray-300">
              Quotation <span className="text-cyan-300 font-medium">{quotation.quotation_number}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white rounded-md border border-white/10 px-3 py-1.5 text-sm transition"
          >
            Close
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-4 max-h-[65vh] md:max-h-[70vh] overflow-y-auto">
          <p className="text-sm text-gray-300">
            Select approved line items to create a Sales Order.
          </p>

          {approvedItems.length === 0 ? (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
              No approved items are available for conversion.
            </div>
          ) : (
            <div className="space-y-3">
              {approvedItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-3.5 hover:border-cyan-300/40 hover:bg-cyan-500/[0.05] transition"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggle(item.id)}
                      className="mt-1 h-4 w-4 rounded border-white/30 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
                    />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium break-words">{item.product_name}</p>
                      <p className="text-xs text-gray-300 mt-1">
                        Qty: {item.quantity} | Price: Rs {Number(item.price || 0).toFixed(2)} | Amount: Rs {Number(item.amount || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {item.converted_to_order && <span className="text-[10px] text-green-400">Converted</span>}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 md:px-6 py-4 border-t border-white/10 bg-slate-900/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-xs md:text-sm text-gray-300">
            Selected: <span className="text-white font-medium">{selectedIds.length}</span> item(s)
            {' '}• Total: <span className="text-cyan-300 font-medium">Rs {selectedAmount.toFixed(2)}</span>
          </p>
          <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-200 border border-white/15 rounded-lg hover:bg-white/5 transition">Cancel</button>
          <button
            onClick={() => onConfirm(selectedIds)}
            disabled={isSubmitting || selectedIds.length === 0}
            className="px-4 py-2 bg-cyan-400 text-slate-950 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-300 transition"
          >
            {isSubmitting ? 'Converting...' : 'Convert Selected Items'}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
