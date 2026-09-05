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
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">Payroll Setup</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <DocumentCheckIcon className="w-9 h-9 text-indigo-300" />
                Salary Assignments
              </h1>
              <p className="text-white/65 text-sm mt-2">Assign salary structures and CTC to employees.</p>
            </div>

            <button 
              onClick={() => setModalState({ open: true, item: null })}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300"
            >
              <PlusIcon className="h-4 w-4" />
              New Assignment
            </button>
          </div>
        </section>

        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Employee Assignments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
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
                    <tr key={assign.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">{assign.employee_name || assign.employee}</td>
                      <td className="px-6 py-4">{assign.salary_structure_name || assign.salary_structure}</td>
                      <td className="px-6 py-4">{assign.effective_from}</td>
                      <td className="px-6 py-4">₹{parseFloat(assign.monthly_ctc).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => setModalState({ open: true, item: assign })} className="text-indigo-400 hover:text-indigo-300" title="Edit"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(assign.id)} className="text-red-400 hover:text-red-300" title="Delete"><TrashIcon className="w-4 h-4" /></button>
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
