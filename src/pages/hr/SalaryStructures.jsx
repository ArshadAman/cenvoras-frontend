import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { CurrencyRupeeIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

export default function SalaryStructures() {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">Payroll Setup</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <CurrencyRupeeIcon className="w-9 h-9 text-indigo-300" />
                Salary Structures
              </h1>
              <p className="text-white/65 text-sm mt-2">Define salary breakdown components and rules.</p>
            </div>

            <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300">
              <PlusIcon className="h-4 w-4" />
              Add Structure
            </button>
          </div>
        </section>

        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Salary Structures</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
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
                    <tr key={structure.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">{structure.name}</td>
                      <td className="px-6 py-4">{structure.components?.length || 0} Components</td>
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
