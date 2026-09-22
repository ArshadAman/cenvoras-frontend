import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { ScaleIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

function AdjustBalanceModal({ isOpen, onClose, onSuccess, balanceRecord }) {
  const [balance, setBalance] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (balanceRecord) {
      setBalance(String(balanceRecord.balance ?? ""));
    }
  }, [balanceRecord]);

  if (!isOpen || !balanceRecord) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (balance === "" || isNaN(balance) || Number(balance) < 0) {
      toast.error("Please enter a valid balance in days");
      return;
    }
    setSaving(true);
    try {
      await hrApi.updateLeaveBalance(balanceRecord.id, {
        balance: parseFloat(balance),
        employee: balanceRecord.employee,
        leave_type: balanceRecord.leave_type,
        year: balanceRecord.year,
      });
      toast.success("Leave balance updated successfully");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update leave balance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Set Leave Quota</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <p className="text-xs text-gray-400">Employee</p>
            <p className="text-sm font-semibold text-white">{balanceRecord.employee_name || 'Employee'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Leave Type & Year</p>
            <p className="text-sm font-semibold text-indigo-300">
              {balanceRecord.leave_type_name || 'Leave Type'} ({balanceRecord.year})
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Available Paid Leave Quota (Days) *
            </label>
            <input
              required
              type="number"
              step="0.5"
              min="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. 12"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              The employee can take paid leave up to this balance. Once exhausted, they cannot take additional paid leave.
            </p>
          </div>
          <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 bg-white/5 rounded-xl hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Quota"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeaveBalances() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBalance, setEditingBalance] = useState(null);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getLeaveBalances();
      setBalances(res.data?.results || res.data || []);
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
                Leave Balances & Quotas
              </h1>
              <p className="text-white/65 text-sm mt-2">
                Configure how many paid leave days each employee can take. Once quota is exhausted, no more paid leave can be applied.
              </p>
            </div>
          </div>
        </section>

        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Employee Quotas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Year</th>
                  <th className="px-6 py-4">Remaining Quota</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-4 text-center">Loading...</td></tr>
                ) : balances.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-4 text-center">No leave balances found</td></tr>
                ) : (
                  balances.map(bal => (
                    <tr key={bal.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">{bal.employee_name || bal.employee}</td>
                      <td className="px-6 py-4 text-indigo-300">{bal.leave_type_name || bal.leave_type}</td>
                      <td className="px-6 py-4">{bal.year}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          parseFloat(bal.balance) > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {bal.balance} Days Left
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setEditingBalance(bal)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-medium transition"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                          Set Quota
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

      <AdjustBalanceModal
        isOpen={Boolean(editingBalance)}
        onClose={() => setEditingBalance(null)}
        onSuccess={fetchBalances}
        balanceRecord={editingBalance}
      />
    </>
  );
}
