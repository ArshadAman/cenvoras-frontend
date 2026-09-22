import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getCurrencySymbol } from '../../utils/currency';

export default function QuotationConvertModal({ isOpen, quotation, onClose, onConfirm, isSubmitting }) {
  const [selected, setSelected] = useState(new Set());

  const approvedItems = useMemo(() => {
    if (!quotation?.items) return [];
    return quotation.items.filter((item) => item.approval_status === 'approved' && !item.converted_to_order);
  }, [quotation]);

  useEffect(() => {
    if (!isOpen) return;
    // By default, select all approved items
    setSelected(new Set(approvedItems.map((item) => item.id)));
  }, [isOpen, approvedItems]);

  if (!isOpen || !quotation) return null;

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === approvedItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(approvedItems.map((item) => item.id)));
    }
  };

  const selectedIds = Array.from(selected);
  const selectedAmount = approvedItems
    .filter((item) => selected.has(item.id))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const allSelected = approvedItems.length > 0 && selected.size === approvedItems.length;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto antialiased">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose} 
      />
      
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        {/* Modal Container */}
        <div className="relative w-full max-w-3xl flex flex-col h-[80vh] min-h-[500px] max-h-[850px] bg-[#141416] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
        
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-5 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div>
              <h3 className="text-white text-lg font-bold tracking-tight">Convert to Sales Order</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Quotation Ref: <span className="text-cyan-400 font-mono font-medium">{quotation.quotation_number}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader / Selection Controls */}
          {approvedItems.length > 0 && (
            <div className="flex-shrink-0 px-6 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-xs">
              <span className="text-gray-400">
                Choose the items to include in this Sales Order ({selected.size} of {approvedItems.length} selected):
              </span>
              <button
                type="button"
                onClick={toggleAll}
                className="text-cyan-400 hover:text-cyan-300 font-medium px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all"
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          )}

          {/* Items List Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {approvedItems.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-white/5 p-8 text-center text-gray-400 text-sm font-medium">
                No pending approved items available for conversion.
              </div>
            ) : (
              approvedItems.map((item) => {
                const isChecked = selected.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    role="checkbox"
                    aria-checked={isChecked}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        toggle(item.id);
                      }
                    }}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                      isChecked 
                        ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm shadow-cyan-500/10' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* Checkbox Icon */}
                    <div className="flex-shrink-0">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isChecked 
                          ? 'bg-cyan-500 border-cyan-500 text-black' 
                          : 'border-gray-500 bg-white/5'
                      }`}>
                        {isChecked && (
                          <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />
                        )}
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <p className={`font-semibold text-sm truncate ${isChecked ? 'text-white' : 'text-gray-300'}`}>
                          {item.product_name}
                        </p>
                        <p className={`font-bold text-sm whitespace-nowrap font-mono ${isChecked ? 'text-cyan-400' : 'text-gray-400'}`}>
                          {getCurrencySymbol()}{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                        <span>Qty: <strong className="text-gray-300">{item.quantity}</strong> {item.unit || ''}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                        <span>Rate: {getCurrencySymbol()}{Number(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        {Number(item.discount || 0) > 0 && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span className="text-amber-400">Disc: {item.discount}%</span>
                          </>
                        )}
                        {Number(item.tax || 0) > 0 && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span className="text-gray-400">Tax: {item.tax}%</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 bg-black/40 px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex flex-col">
                <span className="text-gray-400 uppercase font-bold text-[10px] tracking-wider">Selected</span>
                <span className="text-white font-bold text-sm">
                  {selectedIds.length} <span className="text-xs font-normal text-gray-400">of {approvedItems.length} items</span>
                </span>
              </div>
              <div className="w-px h-7 bg-white/10"></div>
              <div className="flex flex-col">
                <span className="text-gray-400 uppercase font-bold text-[10px] tracking-wider">Order Value</span>
                <span className="text-cyan-400 font-bold text-sm font-mono">
                  {getCurrencySymbol()}{selectedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 text-gray-300 font-medium hover:bg-white/10 bg-white/5 border border-white/10 rounded-xl transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onConfirm(selectedIds)}
                disabled={isSubmitting || selectedIds.length === 0}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-cyan-500/20 text-xs flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Converting...
                  </>
                ) : (
                  `Create Order (${selectedIds.length})`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
