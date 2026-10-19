import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { TagIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import LeaveTypeModal from "./LeaveTypeModal";

export default function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getLeaveTypes();
      setLeaveTypes(res.data?.results || res.data || []);
    } catch (error) {
      toast.error("Failed to load leave types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const handleDelete = async (lt) => {
    if (!window.confirm(`Are you sure you want to delete leave type "${lt.name}"?`)) return;
    try {
      await hrApi.deleteLeaveType(lt.id);
      toast.success("Leave type deleted");
      fetchLeaveTypes();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete leave type");
    }
  };

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        <section className="bento-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent-primary)] font-semibold mb-2">Leave Management</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                <TagIcon className="w-9 h-9 text-[var(--accent-primary)]" />
                Leave Types
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">Configure leave categories and annual entitlements.</p>
            </div>

            <button
              onClick={() => {
                setSelectedLeaveType(null);
                setIsModalOpen(true);
              }}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl"
            >
              <PlusIcon className="h-4 w-4" />
              Add Leave Type
            </button>
          </div>
        </section>

        <section className="bento-card p-0 overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]/50">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Leave Types</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[var(--text-secondary)]">
              <thead className="text-xs uppercase bg-[var(--bg-primary)]/50 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Annual Entitlement</th>
                  <th className="px-6 py-4">Is Paid</th>
                  <th className="px-6 py-4">Carry Forward Max</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-4 text-center">Loading...</td></tr>
                ) : leaveTypes.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-4 text-center">No leave types found</td></tr>
                ) : (
                  leaveTypes.map(lt => (
                    <tr key={lt.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">{lt.name}</td>
                      <td className="px-6 py-4">{lt.annual_entitlement} Days</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${lt.is_paid ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                          {lt.is_paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{lt.carry_forward_max_days ?? 0} Days</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={() => {
                            setSelectedLeaveType(lt);
                            setIsModalOpen(true);
                          }}
                          className="p-1 text-indigo-400 hover:text-indigo-300 transition"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(lt)}
                          className="p-1 text-red-400 hover:text-red-300 transition"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <LeaveTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchLeaveTypes}
        initialData={selectedLeaveType}
      />
    </>
  );
}
