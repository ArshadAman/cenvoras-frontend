import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { CalendarDaysIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

const STATUS_COLORS = {
  present: 'bg-green-500/10 text-green-400',
  absent: 'bg-red-500/10 text-red-400',
  half_day: 'bg-yellow-500/10 text-yellow-400',
  leave: 'bg-blue-500/10 text-blue-400',
  holiday: 'bg-purple-500/10 text-purple-400',
};

function AttendanceModal({ isOpen, onClose, onSuccess, employees }) {
  const [form, setForm] = useState({ employee: '', date: '', status: 'present' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setForm({ employee: '', date: new Date().toISOString().split('T')[0], status: 'present' });
  }, [isOpen]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await hrApi.createAttendance(form);
      toast.success("Attendance logged successfully");
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || "Failed to log attendance";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Log Attendance</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Employee *</label>
            <select required name="employee" value={form.employee} onChange={handleChange} className={inputCls}>
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Date *</label>
            <input required type="date" name="date" value={form.date} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Status *</label>
            <select required name="status" value={form.status} onChange={handleChange} className={inputCls}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half-Day</option>
              <option value="leave">Leave</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Log Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getAttendance();
      setRecords(res.data?.results || res.data || []);
    } catch (error) {
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await hrApi.getEmployees({ status: 'active' });
      setEmployees(res.data?.results || res.data || []);
    } catch (e) {
      // silently fail — dropdown just won't have options
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
  }, []);

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">HR Management</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <CalendarDaysIcon className="w-9 h-9 text-indigo-300" />
                Attendance Tracking
              </h1>
              <p className="text-white/65 text-sm mt-2">Log daily presence, absences, and half-days.</p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300"
            >
              <PlusIcon className="h-4 w-4" />
              Log Attendance
            </button>
          </div>
        </section>

        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Attendance Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="3" className="px-6 py-4 text-center">Loading...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-400">No attendance records found</td></tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">{record.employee_name || '—'}</span>
                        {record.employee_code && <span className="ml-2 text-xs text-gray-500">{record.employee_code}</span>}
                      </td>
                      <td className="px-6 py-4">{record.date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[record.status] || 'bg-white/10 text-white'}`}>
                          {record.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <AttendanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAttendance}
        employees={employees}
      />
    </>
  );
}
