import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBOMs } from "../../api/bom";
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import BOMForm from "../../components/inventory/BOMForm";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function BOMList() {
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  
  const { data: bomsResult, isLoading } = useQuery({ 
      queryKey: ["boms"], 
      queryFn: () => getBOMs() 
  });
  
  const boms = Array.isArray(bomsResult) ? bomsResult : bomsResult?.data || bomsResult?.results || [];

  const handleEdit = (bom) => {
    setEditData(bom);
    setShowForm(true);
  };

  const handClose = () => {
    setShowForm(false);
    setEditData(null);
  }

  return (
    <>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">Bill of Materials</h1>
            <p className="text-[var(--text-muted)] text-sm">
              Manage product recipes and component lists. Automated production runs / MRP are not supported yet.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" /> New BOM
          </button>
        </div>

        <div className="bento-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)] text-xs uppercase bg-[var(--bg-primary)]/70">
                  <th className="p-4 font-bold text-[var(--text-primary)]">BOM Name</th>
                  <th className="p-4 font-bold text-[var(--text-primary)]">Finished Good</th>
                  <th className="p-4 font-bold text-[var(--text-primary)]">Components</th>
                  <th className="p-4 font-bold text-[var(--text-primary)]">Status</th>
                  <th className="p-4 font-bold text-[var(--text-primary)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {isLoading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)]">Loading...</td></tr>
                ) : boms.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)]">No BOMs found. Create one to get started.</td></tr>
                ) : (
                    boms.map((bom) => (
                    <tr key={bom.id} className="hover:bg-[var(--bg-primary)]/40 transition-colors group">
                        <td className="p-4 text-[var(--text-primary)] font-semibold">{bom.name}</td>
                        <td className="p-4 text-[var(--text-secondary)]">{bom.finished_good_display || bom.finished_good_name}</td>
                        <td className="p-4 text-[var(--text-muted)] text-sm">
                            {bom.components?.length || 0} items
                        </td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${bom.is_active ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30' : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-subtle)]'}`}>
                                {bom.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(bom)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded-lg transition-colors" title="Edit BOM">
                                <PencilSquareIcon className="w-4 h-4" />
                            </button>
                        </div>
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
        <BOMForm isOpen={showForm} onClose={handClose} editData={editData} />
      )}
      
      
    </>
  );
}
