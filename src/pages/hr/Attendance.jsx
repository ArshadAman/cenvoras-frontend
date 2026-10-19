import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { hrApi } from "../../api/hr";
import {
  CalendarDaysIcon, PlusIcon, XMarkIcon, MagnifyingGlassIcon,
  ArrowDownTrayIcon, EyeIcon, FunnelIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import { getTodayKolkata } from "../../utils/date";

const STATUS_COLORS = {
  present: 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30',
  absent: 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30',
  half_day: 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30',
  leave: 'bg-[var(--status-info)]/15 text-[var(--status-info)] border border-[var(--status-info)]/30',
  holiday: 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// ─── Attendance Log Modal ─────────────────────────────────────────────────────
function AttendanceModal({ isOpen, onClose, onSuccess, employees }) {
  const [form, setForm] = useState({ employee: '', date: '', status: 'present' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setForm({ employee: '', date: getTodayKolkata(), status: 'present' });
  }, [isOpen]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const selectedEmp = employees.find((e) => String(e.id) === String(form.employee));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedEmp?.date_of_joining && form.date < selectedEmp.date_of_joining) {
      toast.error(`Attendance cannot be marked before joining date (${selectedEmp.date_of_joining})`);
      return;
    }
    setSaving(true);
    try {
      await hrApi.createAttendance(form);
      toast.success("Attendance logged successfully");
      onSuccess();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.date?.[0] || data?.date || data?.detail || data?.non_field_errors?.[0] || "Failed to log attendance";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = "w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/30">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Log Attendance</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Employee *</label>
            <select required name="employee" value={form.employee} onChange={handleChange} className={inputCls}>
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date *</label>
            <input
              required
              type="date"
              name="date"
              min={selectedEmp?.date_of_joining || ''}
              value={form.date}
              onChange={handleChange}
              className={inputCls}
            />
            {selectedEmp?.date_of_joining && (
              <p className="text-xs text-[var(--accent-primary)] mt-1 font-medium">
                Joining Date: {selectedEmp.date_of_joining} (only from this date)
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status *</label>
            <select required name="status" value={form.status} onChange={handleChange} className={inputCls}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half-Day</option>
              <option value="leave">Leave</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl hover:text-[var(--text-primary)] transition">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm font-medium rounded-xl transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Log Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── Employee Monthly Attendance Breakdown Modal ──────────────────────────────
function EmployeeMonthlyAttendanceModal({ isOpen, onClose, employee }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    const empId = typeof employee?.id === 'object' ? employee?.id?.id : (employee?.id || employee?.employee_id);
    if (!empId) return;
    setLoading(true);
    setSummary(null);
    try {
      const res = await hrApi.getEmployeeAttendanceSummary(empId, {
        month: selectedMonth,
        year: selectedYear,
      });
      // Axios may return { data } or the body directly depending on interceptor
      const body = res?.data !== undefined && !res?.present_days && !res?.days ? res.data : res;
      setSummary(body && (body.days || body.present_days !== undefined || body.employee) ? body : null);
    } catch (e) {
      setSummary(null);
      toast.error('Failed to load employee attendance summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && (employee?.id || employee?.employee_id)) {
      fetchSummary();
    } else if (!isOpen) {
      setSummary(null);
    }
  }, [isOpen, employee, selectedMonth, selectedYear]);

  const handleExportIndividualCsv = () => {
    if (!summary || !summary.days) return;
    const headers = 'Date,Day,Status\n';
    const rows = summary.days.map(d => `${d.date},${d.day_name},${d.status}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_${employee.code || employee.name}_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Monthly record downloaded');
  };

  if (!isOpen || !employee) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)]">
              <CalendarDaysIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                {employee.name}
                {employee.code && (
                  <span className="text-xs font-mono font-normal text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 px-2 py-0.5 rounded border border-[var(--accent-primary)]/30">
                    {employee.code}
                  </span>
                )}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Monthly Attendance Breakdown & Logs</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Export */}
        <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)]"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)]"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleExportIndividualCsv}
            disabled={!summary}
            className="px-3 py-1.5 rounded-xl bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 text-xs font-semibold inline-flex items-center gap-1.5 transition"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            Export Month CSV
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="text-center py-16 text-[var(--text-muted)] text-sm">Loading attendance details...</div>
          ) : !summary ? (
            <div className="text-center py-16 text-[var(--text-muted)] text-sm">No summary data available.</div>
          ) : (
            <>
              {/* Stats KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-xl bg-[var(--bg-primary)]/60 border border-[var(--border-subtle)] text-center">
                  <p className="text-[11px] text-[var(--text-muted)]">Total Days</p>
                  <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">{summary.total_calendar_days ?? summary.total_days_in_month}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--status-success)]/10 border border-[var(--status-success)]/30 text-center">
                  <p className="text-[11px] text-[var(--status-success)] font-semibold">Present Days</p>
                  <p className="text-lg font-bold text-[var(--status-success)] mt-0.5">{summary.present_days}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30 text-center">
                  <p className="text-[11px] text-[var(--status-warning)] font-semibold">Half Days</p>
                  <p className="text-lg font-bold text-[var(--status-warning)] mt-0.5">{summary.half_days}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30 text-center">
                  <p className="text-[11px] text-[var(--status-danger)] font-semibold">Absent Days</p>
                  <p className="text-lg font-bold text-[var(--status-danger)] mt-0.5">{summary.absent_days}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--status-info)]/10 border border-[var(--status-info)]/30 text-center">
                  <p className="text-[11px] text-[var(--status-info)] font-semibold">Leave Days</p>
                  <p className="text-lg font-bold text-[var(--status-info)] mt-0.5">{summary.leave_days}</p>
                  {(summary.paid_leave_days != null || summary.unpaid_leave_days != null) && (
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      Paid {summary.paid_leave_days ?? 0} · Unpaid {summary.unpaid_leave_days ?? 0}
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-center">
                  <p className="text-[11px] text-[var(--accent-primary)] font-semibold">Attendance Rate</p>
                  <p className="text-lg font-bold text-[var(--accent-primary)] mt-0.5">
                    {String(summary.attendance_rate || '').includes('%')
                      ? summary.attendance_rate
                      : `${summary.attendance_rate ?? 0}%`}
                  </p>
                </div>
              </div>

              {/* Day-by-Day Grid */}
              <div>
                <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Daily Calendar Breakdown</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {summary.days.map((d) => (
                    <div
                      key={d.date}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        d.status === 'present' ? 'bg-[var(--status-success)]/10 border-[var(--status-success)]/30 text-[var(--status-success)]' :
                        d.status === 'half_day' ? 'bg-[var(--status-warning)]/10 border-[var(--status-warning)]/30 text-[var(--status-warning)]' :
                        d.status === 'absent' ? 'bg-[var(--status-danger)]/10 border-[var(--status-danger)]/30 text-[var(--status-danger)]' :
                        d.status === 'leave' ? 'bg-[var(--status-info)]/10 border-[var(--status-info)]/30 text-[var(--status-info)]' :
                        (d.status === 'holiday' || d.status === 'weekend') ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]' :
                        'bg-[var(--bg-primary)]/40 border-[var(--border-subtle)] text-[var(--text-muted)]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1">
                        <span>{d.day_name || d.day}</span>
                        <span className="font-semibold text-[var(--text-primary)]">{d.day_number ?? d.day}</span>
                      </div>
                      <p className="text-xs font-semibold capitalize tracking-wide">{d.status.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-subtle)] flex justify-end bg-[var(--bg-primary)]/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-primary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Attendance Page ─────────────────────────────────────────────────────
export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Individual Employee Summary Modal
  const [selectedEmpSummary, setSelectedEmpSummary] = useState(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (monthFilter) params.month = monthFilter;
      if (yearFilter) params.year = yearFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await hrApi.getAttendance(params);
      setRecords(res.data?.results || res.data || []);
    } catch (error) {
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await hrApi.getEmployees({ status: 'active', limit: 100 });
      setEmployees(res.data?.results || res.data || []);
    } catch (e) {
      // silently ignore
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [monthFilter, yearFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAttendance();
  };

  const handleExportCsv = async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (monthFilter) params.month = monthFilter;
      if (yearFilter) params.year = yearFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await hrApi.exportAttendance(params);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Attendance records exported successfully');
    } catch (err) {
      toast.error('Failed to export attendance');
    }
  };

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header Hero */}
        <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent-primary)] mb-2 font-semibold">HR Management</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                <CalendarDaysIcon className="w-9 h-9 text-[var(--accent-primary)]" />
                Attendance Tracking
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">Log daily presence, inspect employee monthly calendars, and export audits.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCsv}
                className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition"
              >
                <ArrowDownTrayIcon className="h-4 w-4 text-[var(--accent-primary)]" />
                Export CSV
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition shadow-sm"
              >
                <PlusIcon className="h-4 w-4" />
                Log Attendance
              </button>
            </div>
          </div>
        </section>

        {/* Filters Toolbar */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by employee name or code..."
                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)] placeholder-[var(--text-muted)]"
              />
            </div>
            <button
              type="submit"
              className="btn-primary px-3.5 py-2 rounded-xl text-sm font-semibold transition"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="">All Months</option>
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="">All Years</option>
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half-Day</option>
              <option value="leave">Leave</option>
              <option value="holiday">Holiday</option>
            </select>

            {(search || monthFilter || yearFilter || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setMonthFilter('');
                  setYearFilter('');
                  setStatusFilter('');
                }}
                className="px-3 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl transition"
              >
                Reset
              </button>
            )}
          </div>
        </section>

        {/* Attendance Records Table */}
        <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]/30">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Attendance Log ({records.length} records)</h2>
            <button
              onClick={fetchAttendance}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] inline-flex items-center gap-1 transition"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[var(--text-secondary)]">
              <thead className="text-xs uppercase bg-[var(--bg-primary)]/60 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Monthly Drilldown</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="px-6 py-10 text-center text-[var(--text-muted)]">Loading attendance records...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-12 text-center text-[var(--text-muted)]">No attendance records found matching filters</td></tr>
                ) : (
                  records.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] cursor-pointer transition"
                      onClick={() => setSelectedEmpSummary({
                        id: typeof record.employee === 'object' ? record.employee?.id : record.employee,
                        name: record.employee_name || 'Employee',
                        code: record.employee_code || '',
                      })}
                    >
                      <td className="px-6 py-4">
                        <span className="text-[var(--text-primary)] font-medium">{record.employee_name || '—'}</span>
                        {record.employee_code && (
                          <span className="ml-2 text-xs font-mono text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 px-2 py-0.5 rounded border border-[var(--accent-primary)]/30">
                            {record.employee_code}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">{record.date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[record.status] || 'bg-[var(--bg-primary)] text-[var(--text-muted)]'}`}>
                          {record.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmpSummary({
                              id: typeof record.employee === 'object' ? record.employee?.id : record.employee,
                              name: record.employee_name || 'Employee',
                              code: record.employee_code || '',
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                          View Month Details
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

      <AttendanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAttendance}
        employees={employees}
      />

      <EmployeeMonthlyAttendanceModal
        isOpen={!!selectedEmpSummary}
        onClose={() => setSelectedEmpSummary(null)}
        employee={selectedEmpSummary}
      />
    </>
  );
}
