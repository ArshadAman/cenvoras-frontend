import React from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from '@heroicons/react/24/outline';
import { format } from "date-fns";

export default function StockJournalDetailsModal({ isOpen, onClose, journal }) {
  if (!isOpen || !journal) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden bento-card !p-0 shadow-2xl animate-fade-up bg-[#111] border border-white/10 rounded-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              Stock Journal Details
              <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border
                ${['excess', 'internal_return'].includes(journal.adjustment_type) 
                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                  : 'bg-red-500/10 text-red-400 border-red-500/20'}
              `}>
                {journal.adjustment_type.replace('_', ' ')}
              </span>
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Transaction ID: {journal.id}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-xl">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-xs text-gray-500 mb-1">Date</div>
              <div className="font-medium text-white">{journal.date}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-xs text-gray-500 mb-1">Voucher No</div>
              <div className="font-medium text-white">{journal.voucher_no || 'N/A'}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-xs text-gray-500 mb-1">Warehouse</div>
              <div className="font-medium text-white">{journal.warehouse_name}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-xs text-gray-500 mb-1">Created</div>
              <div className="font-medium text-white text-sm">
                {format(new Date(journal.created_at), "MMM d, yyyy HH:mm")}
              </div>
            </div>
          </div>

          {journal.notes && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                Reason / Notes
              </h3>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-gray-300 text-sm leading-relaxed">
                {journal.notes}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              Adjusted Items
            </h3>
            <div className="border border-white/10 rounded-xl overflow-hidden bg-[#161616]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-gray-400">
                    <th className="p-3 font-medium">Product</th>
                    <th className="p-3 font-medium">Batch</th>
                    <th className="p-3 font-medium text-right">Quantity Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {journal.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="p-3 text-white font-medium">{item.product_name}</td>
                      <td className="p-3 text-gray-400">{item.batch_number}</td>
                      <td className="p-3 text-right">
                        <span className={`font-mono font-medium ${
                          item.quantity > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {item.quantity > 0 ? '+' : ''}{item.quantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!journal.items || journal.items.length === 0) && (
                    <tr>
                      <td colSpan="3" className="p-4 text-center text-gray-500">No items found for this journal.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
}
