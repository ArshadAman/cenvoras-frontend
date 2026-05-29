import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { ScaleIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

export default function LeaveBalances() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getLeaveBalances();
      setBalances(res.data?.results || res.data);
    } catch (error) {
      toast.error("Failed to load leave balances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">Leave Management</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <ScaleIcon className="w-9 h-9 text-indigo-300" />
                Leave Balances
              </h1>
              <p className="text-white/65 text-sm mt-2">View remaining leave balances for employees.</p>
            </div>
          </div>
        </section>

        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Balances</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Year</th>
                  <th className="px-6 py-4">Balance</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="px-6 py-4 text-center">Loading...</td></tr>
                ) : balances.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-4 text-center">No leave balances found</td></tr>
                ) : (
                  balances.map(bal => (
                    <tr key={bal.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4">{bal.employee_name || bal.employee}</td>
                      <td className="px-6 py-4">{bal.leave_type_name || bal.leave_type}</td>
                      <td className="px-6 py-4">{bal.year}</td>
                      <td className="px-6 py-4">{bal.balance} Days</td>
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
