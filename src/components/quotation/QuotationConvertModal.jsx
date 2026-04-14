import React, { useMemo, useState, useEffect } from 'react';

export default function QuotationConvertModal({ isOpen, quotation, onClose, onConfirm, isSubmitting }) {
  const [selected, setSelected] = useState(new Set());

  const approvedItems = useMemo(() => {
    if (!quotation?.items) return [];
    return quotation.items.filter((item) => item.approval_status === 'approved' && !item.converted_to_order);
  }, [quotation]);

  useEffect(() => {
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
    <div className="fixed inset-0 z-[9999] overflow-y-auto antialiased">
      {/* Heavy blur backdrop a la Apple */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xl transition-opacity duration-300"
        onClick={onClose} 
      />
      
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        {/* Modal Container */}
        <div className="relative w-full max-w-3xl flex flex-col h-[75vh] min-h-[500px] max-h-[1000px] bg-[#1c1c1e] bg-opacity-[0.98] border border-white/10 rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Header */}
        <div className="flex-shrink-0 px-8 py-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-white text-xl font-semibold tracking-tight">Convert to Sales Order</h3>
            <p className="text-sm text-gray-400 mt-1">Quotation Ref: <span className="text-gray-200 font-medium">{quotation.quotation_number}</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
          {approvedItems.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-center text-gray-400 text-sm font-medium">
              No pending approved items available for conversion.
            </div>
          ) : (
            <div className="space-y-3">
              {approvedItems.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-5 p-4 rounded-2xl border transition-all cursor-pointer ${
                    selected.has(item.id) 
                      ? 'bg-blue-500/10 border-blue-500/30' 
                      : 'bg-white/5 border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selected.has(item.id) 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-500'
                    }`}>
                      {selected.has(item.id) && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <p className="text-gray-100 font-medium text-base truncate">{item.product_name}</p>
                      <p className="text-gray-100 font-semibold whitespace-nowrap">
                        Rs {Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
                      <span>Qty: {item.quantity} {item.unit || ''}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                      <span>Rate: Rs {Number(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-white/[0.02] px-8 py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-sm flex-1">
            <div className="flex flex-col">
              <span className="text-gray-400">Selected</span>
              <span className="text-white font-medium text-lg tracking-tight">{selectedIds.length} <span className="text-sm font-normal text-gray-500">items</span></span>
            </div>
            <div className="w-px h-8 bg-white/10 mx-4"></div>
            <div className="flex flex-col">
              <span className="text-gray-400">Total Amount</span>
              <span className="text-white font-semibold text-lg tracking-tight">Rs {selectedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-3 text-white font-medium hover:bg-white/10 bg-white/5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedIds)}
              disabled={isSubmitting || selectedIds.length === 0}
              className="flex-1 sm:flex-none px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-400 disabled:opacity-50 disabled:hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
            >
              {isSubmitting ? 'Converting...' : 'Create Order'}
            </button>
          </div>
        </div>
      </div>
     </div>
    </div>
  );
}
