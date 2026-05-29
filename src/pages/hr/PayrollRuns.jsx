import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { CalculatorIcon, PlayIcon, CheckBadgeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function PayrollRunModal({ isOpen, onClose, onSuccess }) {
  const now = new Date();
  const [form, setForm] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const n = new Date();
      setForm({ month: n.getMonth() + 1, year: n.getFullYear() });
    }
  }, [isOpen]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: Number(e.target.value) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await hrApi.createPayrollRun(form);
      toast.success(`Payroll run created for ${MONTHS[form.month - 1]} ${form.year}`);
      onSuccess();
      onClose();
    } catch (err) {
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        const msg = Object.entries(errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n');
        toast.error(msg);
      } else {
        toast.error("Failed to create payroll run");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500";
  const labelCls = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">New Payroll Run</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Month *</label>
            <select required name="month" value={form.month} onChange={handleChange} className={inputCls}>
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Year *</label>
            <input
              required
              type="number"
              name="year"
              value={form.year}
              onChange={handleChange}
              min={2020}
              max={2099}
              className={inputCls}
            />
          </div>
          <p className="text-xs text-gray-500">This will create a draft payroll run for the selected period. You can then compute and finalise it from the list below.</p>
          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 transition disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Payroll Run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PayrollRuns() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getPayrollRuns();
      setRuns(res.data?.results || res.data || []);
    } catch (error) {
      toast.error("Failed to load payroll runs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleRun = async (id) => {
    try {
      await hrApi.runPayroll(id);
      toast.success("Payroll computation started");
      fetchRuns();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to start payroll run");
    }
  };

  const handleFinalise = async (id) => {
    if (!window.confirm('Finalise this payroll run? This cannot be undone.')) return;
    try {
      await hrApi.finalisePayroll(id);
      toast.success("Payroll finalised");
      fetchRuns();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to finalise payroll");
    }
  };

  const STATUS_COLORS = {
    draft: 'bg-gray-500/10 text-gray-400',
    processing: 'bg-yellow-500/10 text-yellow-400',
    completed: 'bg-blue-500/10 text-blue-400',
    failed: 'bg-red-500/10 text-red-400',
    finalised: 'bg-green-500/10 text-green-400',
  };

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">Payroll Operations</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <CalculatorIcon className="w-9 h-9 text-indigo-300" />
                Payroll Runs
              </h1>
              <p className="text-white/65 text-sm mt-2">Generate monthly payroll and process salary computations.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300"
            >
              <PlayIcon className="h-4 w-4" />
              New Payroll Run
            </button>
          </div>
        </section>

        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Payroll Processing History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Total Gross</th>
                  <th className="px-6 py-4">Total Net</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-4 text-center">Loading...</td></tr>
                ) : runs.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">No payroll runs found. Click "New Payroll Run" to get started.</td></tr>
                ) : (
                  runs.map((run) => (
                    <tr key={run.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">{MONTHS[run.month - 1]} {run.year}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[run.status] || 'bg-white/10 text-white'}`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">₹{parseFloat(run.total_gross || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-green-400">₹{parseFloat(run.total_net || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {run.status === 'draft' && (
                          <button onClick={() => handleRun(run.id)} className="px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs">
                            Run Computations
                          </button>
                        )}
                        {run.status === 'completed' && (
                          <button onClick={() => handleFinalise(run.id)} className="px-3 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs inline-flex items-center gap-1">
                            <CheckBadgeIcon className="w-3 h-3" /> Finalise
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <PayrollRunModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRuns}
      />
    </>
  );
}
