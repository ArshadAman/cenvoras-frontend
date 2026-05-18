import React, { useState } from "react";
import Layout from "../components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCreditNotes, deleteCreditNote } from "../api/gst";
import { ArrowUturnLeftIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const fmt = (v) => parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

import CreditNoteForm from "../components/returns/CreditNoteForm"; // Add Import
import { getCurrencySymbol, formatCurrency } from '../utils/currency';

export default function CreditNoteList() {
  const [showForm, setShowForm] = useState(false); // Add State
  const queryClient = useQueryClient();

  const { data: notesResult, isLoading } = useQuery({
    queryKey: ["credit-notes"],
    queryFn: getCreditNotes,
  });

  const notes = Array.isArray(notesResult) ? notesResult : notesResult?.results || [];

  const deleteMutation = useMutation({
    mutationFn: deleteCreditNote,
    onSuccess: () => {
      queryClient.invalidateQueries(["credit-notes"]);
      toast.success("Credit note deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const reasonLabels = {
    return: "Goods Returned",
    defective: "Defective",
    discount: "Post-Sale Discount",
    rate_diff: "Rate Difference",
    other: "Other",
  };

  const reasonColors = {
    return: "bg-blue-500/20 text-blue-400",
    defective: "bg-red-500/20 text-red-400",
    discount: "bg-green-500/20 text-green-400",
    rate_diff: "bg-amber-500/20 text-amber-400",
    other: "bg-gray-500/20 text-gray-400",
  };

  return (
    <Layout>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Credit Notes</h1>
            <p className="text-gray-400 text-sm">Sales returns — goods returned by customers.</p>
          </div>
          <button
            onClick={() => setShowForm(true)} // Connect Button
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" /> New Credit Note
          </button>
        </div>

        <div className="bento-card p-0 overflow-hidden bg-transparent border-none shadow-none">
          {/* Desktop Table */}
          <div className="hidden lg:block bento-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-xs uppercase bg-white/5">
                    <th className="p-4 font-medium">CN Number</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Customer</th>
                    <th className="p-4 font-medium">Reason</th>
                    <th className="p-4 font-medium">Items</th>
                    <th className="p-4 font-medium text-right">Amount</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr><td colSpan="7" className="p-8 text-center text-gray-500">Loading...</td></tr>
                  ) : notes.length === 0 ? (
                    <tr><td colSpan="7" className="p-8 text-center text-gray-500">
                      <ArrowUturnLeftIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                      No credit notes yet.
                    </td></tr>
                  ) : (
                    notes.map((cn) => (
                      <tr key={cn.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="text-white font-medium">CN-{cn.credit_note_number}</div>
                        </td>
                        <td className="p-4 text-gray-300 text-sm">{cn.date}</td>
                        <td className="p-4 text-gray-300 text-sm">{cn.customer_name}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${reasonColors[cn.reason] || reasonColors.other}`}>
                            {reasonLabels[cn.reason] || cn.reason}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400 text-sm">{cn.items?.length || 0} items</td>
                        <td className="p-4 text-right text-white font-semibold">{getCurrencySymbol()}{fmt(cn.total_amount)}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => { if (confirm('Delete this credit note?')) deleteMutation.mutate(cn.id); }}
                            className="text-red-400 hover:text-red-300 transition-colors p-1"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="lg:hidden space-y-4 px-2">
            {isLoading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white/5 rounded-xl border border-white/10">
                <ArrowUturnLeftIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                No credit notes found.
              </div>
            ) : (
              notes.map((cn) => {
                let formattedDate = cn.date;
                try {
                  if (cn.date) {
                    const d = new Date(cn.date);
                    formattedDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                  }
                } catch (e) { formattedDate = cn.date; }

                return (
                  <div key={cn.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 hover:bg-white/10 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-cyan-400 font-black text-xs tracking-widest uppercase mb-1">CN-{cn.credit_note_number}</div>
                        <div className="text-white font-bold">{cn.customer_name}</div>
                        <div className="text-gray-500 text-[10px] uppercase tracking-tighter mt-1">{formattedDate}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${reasonColors[cn.reason] || reasonColors.other}`}>
                        {reasonLabels[cn.reason] || cn.reason}
                      </span>
                    </div>

                    <div className="flex justify-between items-end pt-3 border-t border-white/5">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Amount</div>
                        <div className="text-xl font-black text-white font-mono">{getCurrencySymbol()}{fmt(cn.total_amount)}</div>
                      </div>
                      <div className="flex gap-2">
                         <button
                           onClick={() => { if (confirm('Delete this credit note?')) deleteMutation.mutate(cn.id); }}
                           className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg"
                         >
                           <TrashIcon className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {showForm && (
        <CreditNoteForm isOpen={showForm} onClose={() => setShowForm(false)} />
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="dark" />
    </Layout>
  );
}

