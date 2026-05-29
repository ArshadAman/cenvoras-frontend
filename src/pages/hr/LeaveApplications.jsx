import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { PaperAirplaneIcon, PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

function LeaveApplicationModal({ isOpen, onClose, onSuccess, employees, leaveTypes }) {
  const [form, setForm] = useState({ employee: '', leave_type: '', start_date: '', end_date: '', reason: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setForm({ employee: '', leave_type: '', start_date: '', end_date: '', reason: '' });
  }, [isOpen]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await hrApi.createLeaveApplication(form);
      toast.success("Leave application submitted");
      onSuccess();
      onClose();
    } catch (err) {
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        const msg = Object.entries(errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n');
        toast.error(msg);
      } else {
        toast.error("Failed to submit leave application");
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
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Apply for Leave</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Employee *</label>
            <select required name="employee" value={form.employee} onChange={handleChange} className={inputCls}>
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Leave Type *</label>
            <select required name="leave_type" value={form.leave_type} onChange={handleChange} className={inputCls}>
              <option value="">Select Leave Type</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>{lt.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date *</label>
              <input required type="date" name="start_date" value={form.start_date} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Date *</label>
              <input required type="date" name="end_date" value={form.end_date} onChange={handleChange} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Reason</label>
            <textarea name="reason" value={form.reason} onChange={handleChange} rows={3} className={inputCls + " resize-none"} placeholder="Optional reason..." />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 transition disabled:opacity-50">
              {saving ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeaveApplications() {
  const [applications, setApplications] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getLeaveApplications();
      setApplications(res.data?.results || res.data || []);
    } catch (error) {
      toast.error("Failed to load leave applications");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [empRes, ltRes] = await Promise.all([
        hrApi.getEmployees({ status: 'active' }),
        hrApi.getLeaveTypes(),
      ]);
      setEmployees(empRes.data?.results || empRes.data || []);
      setLeaveTypes(ltRes.data?.results || ltRes.data || []);
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    fetchApplications();
    fetchDropdowns();
  }, []);

  const handleApprove = async (id) => {
    try {
      await hrApi.approveLeave(id);
      toast.success("Leave approved");
      fetchApplications();
    } catch (error) {
      toast.error("Failed to approve leave");
    }
  };

  const handleReject = async (id) => {
    try {
      await hrApi.rejectLeave(id);
      toast.success("Leave rejected");
      fetchApplications();
    } catch (error) {
      toast.error("Failed to reject leave");
    }
  };

  const STATUS_COLORS = {
    pending: 'bg-yellow-500/10 text-yellow-400',
    approved: 'bg-green-500/10 text-green-400',
    rejected: 'bg-red-500/10 text-red-400',
  };

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">Leave Management</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <PaperAirplaneIcon className="w-9 h-9 text-indigo-300" />
                Leave Applications
              </h1>
              <p className="text-white/65 text-sm mt-2">Review, approve, or reject employee leave requests.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300"
            >
              <PlusIcon className="h-4 w-4" />
              Apply for Leave
            </button>
          </div>
        </section>

        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Leave Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-4 text-center">Loading...</td></tr>
                ) : applications.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">No leave applications found</td></tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4">{app.employee_name || app.employee}</td>
                      <td className="px-6 py-4">{app.leave_type_name || app.leave_type}</td>
                      <td className="px-6 py-4">
                        {app.start_date} → {app.end_date}<br />
                        <span className="text-xs text-gray-500">{app.computed_days} days</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[app.status] || 'bg-white/10 text-white'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {app.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(app.id)} className="p-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20" title="Approve">
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleReject(app.id)} className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20" title="Reject">
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </>
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

      <LeaveApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchApplications}
        employees={employees}
        leaveTypes={leaveTypes}
      />
    </>
  );
}
