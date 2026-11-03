import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { CurrencyRupeeIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import SalaryStructureModal from "./SalaryStructureModal";

export default function SalaryStructures() {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ open: false, item: null });

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getSalaryStructures();
      setStructures(res.data?.results || res.data);
    } catch (error) {
      toast.error("Failed to load salary structures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this salary structure?")) return;
    try {
      await hrApi.deleteSalaryStructure(id);
      toast.success("Salary structure deleted");
      fetchStructures();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete salary structure");
    }
  };

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        <section className="bento-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent-primary)] font-semibold mb-2">Payroll Setup</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                <CurrencyRupeeIcon className="w-9 h-9 text-[var(--accent-primary)]" />
                Salary Structures
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">Define salary breakdown components and rules.</p>
            </div>

            <button 
              onClick={() => setModalState({ open: true, item: null })}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl"
            >
              <PlusIcon className="h-4 w-4" />
              Add Structure
            </button>
          </div>
        </section>

        <section className="bento-card p-0 overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]/50">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Salary Structures</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border-subtle)] text-sm text-left text-[var(--text-secondary)]">
              <thead className="text-xs uppercase bg-[var(--bg-primary)] text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Components Count</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="3" className="px-6 py-4 text-center">Loading...</td></tr>
                ) : structures.length === 0 ? (
                  <tr><td colSpan="3" className="px-6 py-4 text-center">No structures found</td></tr>
                ) : (
                  structures.map(structure => (
                    <tr key={structure.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                      <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{structure.name}</td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">{structure.components?.length || 0} Components</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => setModalState({ open: true, item: structure })} className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors p-1" title="Edit"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(structure.id)} className="text-[var(--status-danger)] hover:opacity-80 transition-opacity p-1" title="Delete"><TrashIcon className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <SalaryStructureModal 
        isOpen={modalState.open} 
        onClose={() => setModalState({ open: false, item: null })} 
        onSuccess={fetchStructures} 
        initialData={modalState.item} 
      />
    </>
  );
}
