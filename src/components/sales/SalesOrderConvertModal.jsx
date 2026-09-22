import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  TruckIcon, 
  DocumentTextIcon, 
  XMarkIcon, 
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon 
} from '@heroicons/react/24/outline';
import { convertOrderToChallan } from '../../api/delivery_challan';
import { convertToInvoice } from '../../api/sales_order';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getCurrencySymbol } from '../../utils/currency';

export default function SalesOrderConvertModal({ isOpen, onClose, order }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [conversionType, setConversionType] = useState('challan'); // 'challan' or 'invoice'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTransportFields, setShowTransportFields] = useState(false);

  // Transport details for Delivery Challan
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [transportMode, setTransportMode] = useState('');
  const [ewayBillNumber, setEwayBillNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Selected items & dispatch quantities for Delivery Challan / Sales Invoice
  const orderItems = useMemo(() => {
    return Array.isArray(order?.items)
      ? order.items.filter((i) => {
          const pending = typeof i.pending_quantity === 'number' ? i.pending_quantity : i.quantity;
          return Number(pending) > 0;
        })
      : [];
  }, [order]);

  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [dispatchQuantities, setDispatchQuantities] = useState({});

  useEffect(() => {
    if (!isOpen || !order) return;
    // Default: select all order items with their current remaining quantities
    const ids = new Set(orderItems.map((i) => i.id));
    setSelectedItemIds(ids);

    const initialQtys = {};
    orderItems.forEach((i) => {
      const pending = typeof i.pending_quantity === 'number' ? i.pending_quantity : i.quantity;
      initialQtys[i.id] = Number(pending) || 1;
    });
    setDispatchQuantities(initialQtys);
    setVehicleNumber('');
    setTransportMode('');
    setEwayBillNumber('');
    setNotes('');
  }, [isOpen, order, orderItems]);

  if (!isOpen || !order) return null;

  const toggleItem = (itemId) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleAllItems = () => {
    if (selectedItemIds.size === orderItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(orderItems.map((i) => i.id)));
    }
  };

  const handleQuantityChange = (itemId, maxQty, val) => {
    const parsed = parseInt(val, 10);
    let qty = isNaN(parsed) ? '' : parsed;
    if (typeof qty === 'number') {
      if (qty < 1) qty = 1;
      if (qty > maxQty) qty = maxQty;
    }
    setDispatchQuantities((prev) => ({
      ...prev,
      [itemId]: qty,
    }));
  };

  // Calculate total dispatch amount for selected items and customized quantities
  const dispatchSummary = useMemo(() => {
    let total = 0;
    let count = 0;
    orderItems.forEach((item) => {
      if (selectedItemIds.has(item.id)) {
        const qty = Number(dispatchQuantities[item.id]) || 0;
        const price = Number(item.price || 0);
        const discount = Number(item.discount || 0);
        const tax = Number(item.tax || 0);
        const base = qty * price;
        const discAmt = (base * discount) / 100;
        const taxable = base - discAmt;
        const taxAmt = (taxable * tax) / 100;
        total += taxable + taxAmt;
        count += 1;
      }
    });
    return { total, count };
  }, [orderItems, selectedItemIds, dispatchQuantities]);

  const handleConvert = async () => {
    setIsSubmitting(true);
    try {
      if (selectedItemIds.size === 0) {
        toast.warning(`Please select at least one item to ${conversionType === 'challan' ? 'dispatch' : 'invoice'}.`);
        setIsSubmitting(false);
        return;
      }

      const itemsPayload = [];
      for (const item of orderItems) {
        if (selectedItemIds.has(item.id)) {
          const qty = Number(dispatchQuantities[item.id]) || 0;
          const maxAvailable = typeof item.pending_quantity === 'number' ? item.pending_quantity : item.quantity;
          if (qty <= 0) {
            toast.error(`Please enter a valid quantity for ${item.product_name || 'item'}.`);
            setIsSubmitting(false);
            return;
          }
          if (qty > maxAvailable) {
            toast.error(`Cannot select ${qty} for ${item.product_name || 'item'}. Max available in order: ${maxAvailable}.`);
            setIsSubmitting(false);
            return;
          }
          itemsPayload.push({
            id: item.id,
            quantity: qty,
          });
        }
      }

      if (conversionType === 'challan') {
        const res = await convertOrderToChallan(order.id, {
          items: itemsPayload,
          vehicle_number: vehicleNumber,
          transport_mode: transportMode,
          eway_bill_number: ewayBillNumber,
          notes: notes,
        });

        toast.success(res?.message || 'Delivery Challan created successfully!');
        queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
        queryClient.invalidateQueries({ queryKey: ['deliveryChallans'] });
        onClose();
        navigate('/delivery-challans');
      } else {
        const res = await convertToInvoice(order.id, {
          items: itemsPayload,
        });
        toast.success(res?.message || 'Order converted to Sales Invoice successfully!');
        queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
        queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
        onClose();
        navigate('/sales');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Failed to convert order';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerName = order.customer_display_name || order.customer_name || (order.customer && order.customer.name) || 'Customer';

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto antialiased">
      {/* Blurred Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xl transition-opacity duration-300"
        onClick={onClose} 
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-2xl bg-[#141416] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-up">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40 flex-shrink-0">
            <div>
              <h3 className="text-white text-lg font-bold tracking-tight">Convert Sales Order</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Order: <span className="text-cyan-400 font-mono font-medium">{order.order_number}</span> &bull; {customerName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            
            {/* Conversion Type Selector */}
            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: Delivery Challan */}
              <div
                onClick={() => setConversionType('challan')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none ${
                  conversionType === 'challan'
                    ? 'bg-blue-500/10 border-blue-500 shadow-md shadow-blue-500/10'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`p-2 rounded-lg flex-shrink-0 ${conversionType === 'challan' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                  <TruckIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Delivery Challan</span>
                    <span className="text-[10px] text-blue-400 font-medium">Dispatch</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 leading-tight">
                    Dispatches goods & reduces inventory stock. No ledger/receivable entry created.
                  </p>
                </div>
              </div>

              {/* Option 2: Direct Sales Invoice */}
              <div
                onClick={() => setConversionType('invoice')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none ${
                  conversionType === 'invoice'
                    ? 'bg-cyan-500/10 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`p-2 rounded-lg flex-shrink-0 ${conversionType === 'invoice' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                  <DocumentTextIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Sales Invoice</span>
                    <span className="text-[10px] text-cyan-400 font-medium">Direct Billing</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 leading-tight">
                    Converts selected items directly into a final GST tax invoice with ledger accounting.
                  </p>
                </div>
              </div>
            </div>

            {/* Items Selection & Quantity Customization for both Challan & Invoice */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <span>Select Items to {conversionType === 'challan' ? 'Dispatch' : 'Invoice'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                    {selectedItemIds.size} of {orderItems.length} selected
                  </span>
                </div>
                {orderItems.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAllItems}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 transition-all"
                  >
                    {selectedItemIds.size === orderItems.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {orderItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 bg-white/5 rounded-xl border border-white/5">
                  No pending items available in this sales order.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {orderItems.map((item) => {
                    const isSelected = selectedItemIds.has(item.id);
                    const maxQty = typeof item.pending_quantity === 'number' ? item.pending_quantity : item.quantity;
                    const currentQty = dispatchQuantities[item.id] !== undefined ? dispatchQuantities[item.id] : maxQty;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-cyan-500/10 border-cyan-500/40'
                            : 'bg-white/5 border-white/5 opacity-70 hover:opacity-100'
                        }`}
                      >
                        {/* Item Left: Checkbox + Product Name */}
                        <div 
                          onClick={() => toggleItem(item.id)}
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 select-none"
                        >
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected 
                              ? 'bg-cyan-500 border-cyan-500 text-black' 
                              : 'border-gray-500 bg-white/5'
                          }`}>
                            {isSelected && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                              {item.product_name}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              Pending Qty: <strong className="text-gray-200">{maxQty} {item.unit || 'pcs'}</strong>
                              {item.dispatched_quantity > 0 && (
                                <span className="text-purple-300 ml-1.5">(Dispatched: {item.dispatched_quantity})</span>
                              )}
                              {' '}&bull; Rate: {getCurrencySymbol()}{Number(item.price || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Item Right: Quantity Input & Line Amount */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-gray-400 font-medium">
                              {conversionType === 'challan' ? 'Dispatch Qty:' : 'Invoice Qty:'}
                            </span>
                            <input
                              type="number"
                              min="1"
                              max={maxQty}
                              value={currentQty}
                              disabled={!isSelected}
                              onChange={(e) => handleQuantityChange(item.id, maxQty, e.target.value)}
                              className="w-20 px-2.5 py-1.5 bg-[#111] border border-white/20 rounded-lg text-white text-xs text-center font-bold font-mono focus:border-cyan-400 focus:outline-none disabled:opacity-40"
                            />
                            <span className="text-[11px] text-gray-400">{item.unit || 'pcs'}</span>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <span className="text-xs font-bold text-cyan-400 font-mono">
                              {getCurrencySymbol()}{(() => {
                                const q = Number(currentQty) || 0;
                                const p = Number(item.price || 0);
                                const d = Number(item.discount || 0);
                                const t = Number(item.tax || 0);
                                const base = q * p;
                                const discAmt = (base * d) / 100;
                                const taxable = base - discAmt;
                                const taxAmt = (taxable * t) / 100;
                                return (taxable + taxAmt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Optional Transport Info Accordion (Only for Delivery Challan) */}
              {conversionType === 'challan' && (
                <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
                  <button
                    type="button"
                    onClick={() => setShowTransportFields(!showTransportFields)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                  >
                    <span>Optional Transport & Dispatch Details</span>
                    {showTransportFields ? (
                      <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {showTransportFields && (
                    <div className="p-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/20">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Vehicle No.</label>
                        <input
                          type="text"
                          placeholder="e.g. MH12AB1234"
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                          className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white uppercase font-mono outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Transport Mode</label>
                        <input
                          type="text"
                          placeholder="Road, Air, Courier..."
                          value={transportMode}
                          onChange={(e) => setTransportMode(e.target.value)}
                          className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">E-Way Bill No.</label>
                        <input
                          type="text"
                          placeholder="12-digit number"
                          value={ewayBillNumber}
                          onChange={(e) => setEwayBillNumber(e.target.value)}
                          className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0">
            <div className="text-xs">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                {conversionType === 'challan' ? 'Challan Dispatch Value' : 'Invoice Value'}
              </span>
              <span className="text-cyan-400 font-bold text-base font-mono">
                {getCurrencySymbol()}
                {Number(dispatchSummary.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConvert}
                disabled={isSubmitting || (conversionType === 'challan' && selectedItemIds.size === 0)}
                className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold text-black bg-cyan-500 hover:bg-cyan-400 rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Converting...
                  </>
                ) : conversionType === 'challan' ? (
                  `Create Delivery Challan (${selectedItemIds.size})`
                ) : (
                  'Convert to Sales Invoice'
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
