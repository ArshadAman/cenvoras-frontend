import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { DocumentCheckIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import SalaryAssignmentModal from "./SalaryAssignmentModal";

export default function SalaryAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ open: false, item: null });

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getSalaryAssignments();
      setAssignments(res.data?.results || res.data);
    } catch (error) {
      toast.error("Failed to load salary assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await hrApi.deleteSalaryAssignment(id);
      toast.success("Salary assignment deleted");
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete salary assignment");
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
                <DocumentCheckIcon className="w-9 h-9 text-[var(--accent-primary)]" />
                Salary Assignments
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">Assign salary structures and CTC to employees.</p>
            </div>

            <button 
              onClick={() => setModalState({ open: true, item: null })}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl"
            >
              <PlusIcon className="h-4 w-4" />
              New Assignment
            </button>
          </div>
        </section>

        <section className="bento-card p-0 overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]/50">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Employee Assignments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border-subtle)] text-sm text-left text-[var(--text-secondary)]">
              <thead className="text-xs uppercase bg-[var(--bg-primary)] text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Structure</th>
                  <th className="px-6 py-4">Effective From</th>
                  <th className="px-6 py-4">Monthly CTC</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-4 text-center">Loading...</td></tr>
                ) : assignments.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-4 text-center">No assignments found</td></tr>
                ) : (
                  assignments.map(assign => (
                    <tr key={assign.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                      <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{assign.employee_name || assign.employee}</td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">{assign.salary_structure_name || assign.salary_structure}</td>
                      <td className="px-6 py-4 text-[var(--text-muted)] text-xs">{assign.effective_from}</td>
                      <td className="px-6 py-4 font-semibold text-[var(--text-primary)] tabular-nums">₹{parseFloat(assign.monthly_ctc).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => setModalState({ open: true, item: assign })} className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors p-1" title="Edit"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(assign.id)} className="text-[var(--status-danger)] hover:opacity-80 transition-opacity p-1" title="Delete"><TrashIcon className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <SalaryAssignmentModal 
        isOpen={modalState.open} 
        onClose={() => setModalState({ open: false, item: null })} 
        onSuccess={fetchAssignments} 
        initialData={modalState.item} 
      />
    </>
  );
}
