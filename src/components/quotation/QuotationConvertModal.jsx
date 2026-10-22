import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline';
import { getCurrencySymbol } from '../../utils/currency';
import useEscKey from '../../hooks/useEscStack';
import { getTodayKolkata } from '../../utils/date';

export default function QuotationConvertModal({ isOpen, quotation, onClose, onConfirm, isSubmitting }) {
  useEscKey(onClose, isOpen, 15);
  const [selected, setSelected] = useState(new Set());
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState('');
  const [bulkDiscount, setBulkDiscount] = useState('');
  const [itemsState, setItemsState] = useState({});

  const approvedItems = useMemo(() => {
    if (!quotation?.items) return [];
    return quotation.items.filter((item) => item.approval_status !== 'rejected' && !item.converted_to_order);
  }, [quotation]);

  useEffect(() => {
    if (!isOpen) return;
    // Default select all approved items
    setSelected(new Set(approvedItems.map((item) => item.id)));
    // Initialize PO details from quotation if available
    setPoNumber(quotation?.po_number || '');
    setPoDate(quotation?.po_date || getTodayKolkata());
    setBulkDiscount('');

    // Initialize item quantities and discounts
    const initialItems = {};
    approvedItems.forEach((item) => {
      initialItems[item.id] = {
        quantity: item.quantity,
        price: item.price || 0,
        discount: Number(item.discount || 0),
        tax: Number(item.tax || 0),
        unit: item.unit || '',
      };
    });
    setItemsState(initialItems);
  }, [isOpen, approvedItems, quotation]);

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

  const handleQtyChange = (id, val) => {
    setItemsState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        quantity: val,
      },
    }));
  };

  const handleDiscountChange = (id, val) => {
    setItemsState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        discount: val,
      },
    }));
  };

  const handleApplyBulkDiscount = () => {
    const discNum = Math.max(0, Math.min(100, Number(bulkDiscount) || 0));
    setItemsState((prev) => {
      const next = { ...prev };
      selected.forEach((id) => {
        if (next[id]) {
          next[id] = { ...next[id], discount: discNum };
        }
      });
      return next;
    });
  };

  const calculateLineTotal = (itemInfo) => {
    if (!itemInfo) return 0;
    const qty = Math.max(0, Number(itemInfo.quantity) || 0);
    const rate = Number(itemInfo.price) || 0;
    const disc = Math.max(0, Math.min(100, Number(itemInfo.discount) || 0));
    const tax = Math.max(0, Number(itemInfo.tax) || 0);

    const subtotal = qty * rate;
    const discounted = subtotal * (1 - disc / 100);
    const total = discounted * (1 + tax / 100);
    return Math.round(total * 100) / 100;
  };

  const selectedIds = Array.from(selected);

  const selectedAmount = approvedItems
    .filter((item) => selected.has(item.id))
    .reduce((sum, item) => sum + calculateLineTotal(itemsState[item.id]), 0);

  const allSelected = approvedItems.length > 0 && selected.size === approvedItems.length;

  const handleConfirmSubmit = () => {
    const payload = {
      po_number: poNumber.trim() || null,
      po_date: poDate || null,
      items: selectedIds.map((id) => {
        const it = itemsState[id] || {};
        return {
          id,
          quantity: Math.max(0.01, Number(it.quantity) || 1),
          discount: Math.max(0, Math.min(100, Number(it.discount) || 0)),
          price: Number(it.price) || 0,
        };
      }),
    };
    onConfirm(payload);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto antialiased">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose} 
      />
      
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
        {/* Modal Container */}
        <div className="relative w-full max-w-3xl flex flex-col max-h-[90vh] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden animate-fade-up my-auto">
        
          {/* Header */}
          <div className="flex-shrink-0 px-5 py-4 sm:px-6 sm:py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface)]">
            <div>
              <h3 className="text-[var(--text-primary)] text-base sm:text-lg font-bold font-display tracking-tight">Convert to Sales Order</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Quotation Ref: <span className="text-[var(--accent-primary)] font-mono font-medium">{quotation.quotation_number}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-xl transition-all cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Customer PO Details Section */}
          <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-3 px-5 sm:px-6 py-3.5 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Customer PO Number
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-2026-9811"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Customer PO Date
              </label>
              <input
                type="date"
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          {/* Extra Discount Toolbar & Selection Controls */}
          {approvedItems.length > 0 && (
            <div className="flex-shrink-0 px-6 py-2.5 bg-[var(--bg-primary)]/20 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-[var(--status-warning)]" />
                <span className="text-[var(--text-secondary)] font-medium">Extra Discount:</span>
                <div className="flex items-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2 py-0.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={bulkDiscount}
                    onChange={(e) => setBulkDiscount(e.target.value)}
                    placeholder="0"
                    className="w-12 bg-transparent border-none text-[var(--text-primary)] text-xs p-0 outline-none focus:ring-0 text-right pr-1 font-mono"
                  />
                  <span className="text-[var(--status-warning)] font-bold text-xs">%</span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyBulkDiscount}
                  disabled={selected.size === 0}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Apply to Selected ({selected.size})
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[var(--text-secondary)]">
                  {selected.size} of {approvedItems.length} selected
                </span>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-[var(--accent-primary)] hover:opacity-80 font-medium px-2 py-0.5 rounded bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/20 transition-all text-xs"
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>
          )}

          {/* Items List Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {approvedItems.length === 0 ? (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-8 text-center text-[var(--text-secondary)] text-sm font-medium">
                No pending approved items available for conversion.
              </div>
            ) : (
              approvedItems.map((item) => {
                const isChecked = selected.has(item.id);
                const itemInfo = itemsState[item.id] || {
                  quantity: item.quantity,
                  price: item.price,
                  discount: item.discount,
                  tax: item.tax,
                };
                const lineTotal = calculateLineTotal(itemInfo);

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all select-none ${
                      isChecked 
                        ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/40 shadow-sm' 
                        : 'bg-[var(--bg-primary)]/40 border-[var(--border-subtle)] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox Icon */}
                      <div 
                        onClick={() => toggle(item.id)}
                        className="flex-shrink-0 cursor-pointer pt-0.5"
                        role="checkbox"
                        aria-checked={isChecked}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            toggle(item.id);
                          }
                        }}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked 
                            ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--text-on-accent)]' 
                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]/50'
                        }`}>
                          {isChecked && (
                            <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                        </div>
                      </div>

                      {/* Item Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4">
                          <div 
                            onClick={() => toggle(item.id)}
                            className="cursor-pointer flex-1 min-w-0"
                          >
                            <p className="font-semibold text-sm truncate text-[var(--text-primary)]">
                              {item.product_name}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                              <span>Rate: {getCurrencySymbol()}{Number(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              {Number(item.tax || 0) > 0 && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]"></span>
                                  <span>Tax: {item.tax}%</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className={`font-bold text-sm whitespace-nowrap font-mono ${isChecked ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>
                              {getCurrencySymbol()}{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        {/* Editable Quantity & Discount Inputs */}
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs pt-2.5 border-t border-[var(--border-subtle)]">
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[var(--text-secondary)] font-medium">Qty:</span>
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={itemInfo.quantity}
                              onChange={(e) => handleQtyChange(item.id, e.target.value)}
                              disabled={!isChecked}
                              className="w-20 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-2 py-1 text-[var(--text-primary)] text-xs text-center focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-40 font-mono"
                            />
                            <span className="text-[var(--text-secondary)]">{item.unit || 'pcs'}</span>
                          </div>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[var(--text-secondary)] font-medium">Disc:</span>
                            <div className="flex items-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-1.5 py-0.5">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="any"
                                value={itemInfo.discount}
                                onChange={(e) => handleDiscountChange(item.id, e.target.value)}
                                disabled={!isChecked}
                                className="w-14 bg-transparent border-none text-[var(--text-primary)] text-xs text-right pr-0.5 focus:outline-none disabled:opacity-40 font-mono p-0"
                              />
                              <span className="text-[var(--status-warning)] font-semibold">%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 bg-[var(--bg-surface)] px-5 py-3.5 sm:px-6 sm:py-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex flex-col">
                <span className="text-[var(--text-secondary)] uppercase font-bold text-xs tracking-wider">Selected</span>
                <span className="text-[var(--text-primary)] font-bold text-sm">
                  {selectedIds.length} <span className="text-xs font-normal text-[var(--text-muted)]">of {approvedItems.length} items</span>
                </span>
              </div>
              <div className="w-px h-7 bg-[var(--border-subtle)]"></div>
              <div className="flex flex-col">
                <span className="text-[var(--text-secondary)] uppercase font-bold text-xs tracking-wider">Order Value</span>
                <span className="text-[var(--accent-primary)] font-bold text-sm font-mono">
                  {getCurrencySymbol()}{selectedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 sm:flex-none px-4 py-2.5 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting || selectedIds.length === 0}
                className="btn-primary flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
