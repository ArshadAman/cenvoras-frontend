import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDebitNotes, deleteDebitNote } from "../api/gst";
import { ArrowUturnRightIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const fmt = (v) => parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

import DebitNoteForm from "../components/returns/DebitNoteForm"; // Add Import
import { getCurrencySymbol, formatCurrency } from '../utils/currency';

export default function DebitNoteList() {
  const [showForm, setShowForm] = useState(false); // Add State
  const queryClient = useQueryClient();

  const { data: notesResult, isLoading } = useQuery({
    queryKey: ["debit-notes"],
    queryFn: getDebitNotes,
  });

  const notes = Array.isArray(notesResult) ? notesResult : notesResult?.results || [];

  const deleteMutation = useMutation({
    mutationFn: deleteDebitNote,
    onSuccess: () => {
      queryClient.invalidateQueries(["debit-notes"]);
      toast.success("Debit note deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const reasonLabels = {
    return: "Goods Returned",
    defective: "Defective",
    rate_diff: "Rate Difference",
    shortage: "Short Supply",
    other: "Other",
  };

  const reasonColors = {
    return: "bg-blue-500/20 text-blue-400",
    defective: "bg-red-500/20 text-red-400",
    rate_diff: "bg-amber-500/20 text-amber-400",
    shortage: "bg-orange-500/20 text-orange-400",
    other: "bg-gray-500/20 text-gray-400",
  };

  return (
    <>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Debit Notes</h1>
            <p className="text-gray-400 text-sm">Purchase returns — goods returned to vendors.</p>
          </div>
          <button
            onClick={() => setShowForm(true)} // Connect Button
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" /> New Debit Note
          </button>
        </div>

        <div className="bento-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase bg-white/5">
                  <th className="p-4 font-medium">DN Number</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Vendor</th>
                  <th className="p-4 font-medium">GSTIN</th>
                  <th className="p-4 font-medium">Reason</th>
                  <th className="p-4 font-medium">Items</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr><td colSpan="8" className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : notes.length === 0 ? (
                  <tr><td colSpan="8" className="p-8 text-center text-gray-500">
                    <ArrowUturnRightIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    No debit notes yet.
                  </td></tr>
                ) : (
                  notes.map((dn) => (
                    <tr key={dn.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="text-white font-medium">DN-{dn.debit_note_number}</div>
                      </td>
                      <td className="p-4 text-gray-300 text-sm">{dn.date}</td>
                      <td className="p-4 text-gray-300 text-sm">{dn.vendor_name}</td>
                      <td className="p-4 text-gray-400 text-xs font-mono">{dn.vendor_gstin || '—'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${reasonColors[dn.reason] || reasonColors.other}`}>
                          {reasonLabels[dn.reason] || dn.reason}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">{dn.items?.length || 0} items</td>
                      <td className="p-4 text-right text-white font-semibold">{getCurrencySymbol()}{fmt(dn.total_amount)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => { if (confirm('Delete this debit note?')) deleteMutation.mutate(dn.id); }}
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
      </div>
      
      {showForm && (
        <DebitNoteForm isOpen={showForm} onClose={() => setShowForm(false)} />
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="dark" />
    </>
  );
}

