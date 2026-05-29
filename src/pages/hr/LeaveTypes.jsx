import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { TagIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

export default function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getLeaveTypes();
      setLeaveTypes(res.data?.results || res.data);
    } catch (error) {
      toast.error("Failed to load leave types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">Leave Management</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <TagIcon className="w-9 h-9 text-indigo-300" />
                Leave Types
              </h1>
              <p className="text-white/65 text-sm mt-2">Configure leave categories and annual entitlements.</p>
            </div>

            <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300">
              <PlusIcon className="h-4 w-4" />
              Add Leave Type
            </button>
          </div>
        </section>

        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Leave Types</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Annual Entitlement</th>
                  <th className="px-6 py-4">Is Paid</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="px-6 py-4 text-center">Loading...</td></tr>
                ) : leaveTypes.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-4 text-center">No leave types found</td></tr>
                ) : (
                  leaveTypes.map(lt => (
                    <tr key={lt.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4">{lt.name}</td>
                      <td className="px-6 py-4">{lt.annual_entitlement} Days</td>
                      <td className="px-6 py-4">{lt.is_paid ? 'Yes' : 'No'}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button className="text-indigo-400 hover:text-indigo-300"><PencilIcon className="w-4 h-4" /></button>
                        <button className="text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
