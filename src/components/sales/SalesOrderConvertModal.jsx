import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { TruckIcon, DocumentTextIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
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

  if (!isOpen || !order) return null;

  const handleConvert = async () => {
    setIsSubmitting(true);
    try {
      if (conversionType === 'challan') {
        const res = await convertOrderToChallan(order.id);
        toast.success(res?.message || 'Order converted to Delivery Challan successfully!');
        queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
        queryClient.invalidateQueries({ queryKey: ['deliveryChallans'] });
        onClose();
        navigate('/delivery-challans');
      } else {
        const res = await convertToInvoice(order.id);
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

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-xl bg-[#18181b] border border-white/10 rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7)] overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div>
              <h3 className="text-white text-lg font-semibold tracking-tight">Convert Sales Order</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Ref: <span className="text-cyan-400 font-semibold">{order.order_number}</span> &bull; {customerName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center text-sm">
              <span className="text-gray-400">Order Total Amount</span>
              <span className="text-lg font-bold text-white tracking-tight">
                {getCurrencySymbol()}{Number(order.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 pt-1">
              Select conversion target:
            </p>

            <div className="space-y-3">
              {/* Option 1: Delivery Challan */}
              <div
                onClick={() => setConversionType('challan')}
                className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                  conversionType === 'challan'
                    ? 'bg-blue-500/10 border-blue-500/60 shadow-lg shadow-blue-500/10'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${conversionType === 'challan' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                  <TruckIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white">Delivery Challan (Dispatch Note)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      Stock Dispatch
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Dispatches goods to customer immediately. Deducts warehouse stock without impacting general ledger accounting. Can be billed to tax invoice later.
                  </p>
                </div>
                <div className="flex-shrink-0 pt-0.5">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    conversionType === 'challan' ? 'border-blue-500 bg-blue-500' : 'border-gray-500'
                  }`}>
                    {conversionType === 'challan' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              {/* Option 2: Direct Sales Invoice */}
              <div
                onClick={() => setConversionType('invoice')}
                className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                  conversionType === 'invoice'
                    ? 'bg-cyan-500/10 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${conversionType === 'invoice' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                  <DocumentTextIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white">Sales Invoice (Tax Invoice)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      Direct Billing
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Directly issue final GST tax invoice. Updates general ledger accounting, customer balance, and deducts inventory stock in one step.
                  </p>
                </div>
                <div className="flex-shrink-0 pt-0.5">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    conversionType === 'invoice' ? 'border-cyan-500 bg-cyan-500' : 'border-gray-500'
                  }`}>
                    {conversionType === 'invoice' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConvert}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Converting...'
                : conversionType === 'challan'
                ? 'Convert to Delivery Challan'
                : 'Convert to Sales Invoice'}
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
