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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-white font-bold">Convert Quotation to Sales Order</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">Close</button>
        </div>

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <p className="text-sm text-gray-400">
            Select approved items from quotation <span className="text-white font-medium">{quotation.quotation_number}</span>.
          </p>

          {approvedItems.length === 0 ? (
            <p className="text-red-400 text-sm">No approved items are available for conversion.</p>
          ) : (
            <div className="space-y-2">
              {approvedItems.map((item) => (
                <label key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggle(item.id)}
                    />
                    <div>
                      <p className="text-white text-sm font-medium">{item.product_name}</p>
                      <p className="text-xs text-gray-400">
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

        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-300 border border-white/10 rounded-lg">Cancel</button>
          <button
            onClick={() => onConfirm(selectedIds)}
            disabled={isSubmitting || selectedIds.length === 0}
            className="px-4 py-2 bg-cyan-500 text-black font-medium rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Converting...' : 'Convert Selected Items'}
          </button>
        </div>
      </div>
    </div>
  );
}
