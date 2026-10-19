import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { hrApi } from "../../api/hr";
import {
  ChartBarIcon, UserGroupIcon, CalendarDaysIcon, CurrencyRupeeIcon,
  BuildingOfficeIcon, BriefcaseIcon, ClockIcon, CheckCircleIcon,
  ArrowPathIcon, PlusIcon, PencilIcon, TrashIcon, CheckIcon,
  XMarkIcon, CloudArrowDownIcon, ExclamationTriangleIcon,
  BanknotesIcon, ArrowRightIcon, ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import EmployeeFormModal from "./EmployeeFormModal";
import SimpleFormModal from "./SimpleFormModal";
import LeaveTypeModal from "./LeaveTypeModal";

// ─── Alert Details Modal ───────────────────────────────────────────────────────
function AlertDetailsModal({ isOpen, onClose, alert, onSelectEmployee }) {
  if (!isOpen || !alert) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-xl shadow-2xl my-10 animate-fade-up">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <ShieldExclamationIcon className={`w-5 h-5 ${
                alert.type === 'danger' ? 'text-[var(--status-danger)]' :
                alert.type === 'warning' ? 'text-[var(--status-warning)]' :
                'text-[var(--status-info)]'
              }`} />
              <h3 className="text-base font-semibold text-[var(--text-primary)]">{alert.title}</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">{alert.message}</p>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2.5">
          {(!alert.items || alert.items.length === 0) ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">No specific employees listed for this alert.</p>
          ) : (
            alert.items.map((item, idx) => (
              <div key={item.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)]/50 border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition">
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.name}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                    {item.employee_code && <span className="font-mono text-[var(--accent-primary)] mr-1.5">{item.employee_code}</span>}
                    {item.department && <span className="text-[var(--text-secondary)]">· {item.department} </span>}
                    {item.designation && <span className="text-[var(--text-muted)]">({item.designation}) </span>}
                    {item.reason && <span className="text-[var(--status-warning)] font-medium">· {item.reason}</span>}
                  </p>
                </div>
                {item.id && onSelectEmployee && (
                  <button
                    type="button"
                    onClick={() => onSelectEmployee(item.id)}
                    className="shrink-0 btn-primary text-xs py-1 px-3"
                  >
                    Edit / Fix
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-primary)]/40 rounded-b-2xl">
          <span className="text-xs text-[var(--text-muted)]">Total: {alert.items?.length || 0} affected</span>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Reusable Stat Card ───────────────────────────────────────────────────────
function StatCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 flex items-start gap-4 hover:bg-[var(--bg-surface-hover)] transition shadow-sm">
      <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-muted)] mb-1 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
        {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",      label: "Overview" },
  { id: "employees",     label: "Employees" },
  { id: "departments",   label: "Departments" },
  { id: "designations",  label: "Designations" },
  { id: "attendance",    label: "Attendance" },
  { id: "leaves",        label: "Leaves" },
  { id: "tasks",         label: "Tasks" },
  { id: "queries",       label: "Queries" },
  { id: "notifications", label: "Notifications" },
];

const STATUS_COLORS = {
  present:  "bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30",
  absent:   "bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30",
  half_day: "bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30",
  leave:    "bg-[var(--status-info)]/15 text-[var(--status-info)] border border-[var(--status-info)]/30",
  holiday:  "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30",
};

const LEAVE_COLORS = {
  pending:  "bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30",
  approved: "bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30",
  rejected: "bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30",
};

// ─── Attendance Log Modal ─────────────────────────────────────────────────────
function AttendanceModal({ isOpen, onClose, onSuccess, employees }) {
  const [form, setForm] = useState({ employee: "", date: "", status: "present" });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (isOpen) setForm({ employee: "", date: new Date().toISOString().split("T")[0], status: "present" }); }, [isOpen]);
  const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const selectedEmp = employees.find((e) => String(e.id) === String(form.employee));
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedEmp?.date_of_joining && form.date < selectedEmp.date_of_joining) {
      toast.error(`Attendance cannot be marked before joining date (${selectedEmp.date_of_joining})`);
      return;
    }
    setSaving(true);
    try { await hrApi.createAttendance(form); toast.success("Attendance logged"); onSuccess(); onClose(); }
    catch (err) {
      const data = err.response?.data;
      const msg = data?.date?.[0] || data?.date || data?.detail || "Failed to log attendance";
      toast.error(msg);
    }
    finally { setSaving(false); }
  };
  if (!isOpen) return null;
  const ic = "w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";
  const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1";
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-sm shadow-2xl my-8">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Log Attendance</h2>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div><label className={labelCls}>Employee *</label>
            <select required name="employee" value={form.employee} onChange={hc} className={ic}>
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}
            </select></div>
          <div><label className={labelCls}>Date *</label>
            <input
              required
              type="date"
              name="date"
              min={selectedEmp?.date_of_joining || ''}
              value={form.date}
              onChange={hc}
              className={ic}
            />
            {selectedEmp?.date_of_joining && (
              <p className="text-xs text-[var(--accent-primary)] mt-1">
                Joining Date: {selectedEmp.date_of_joining} (only from this date)
              </p>
            )}
          </div>
          <div><label className={labelCls}>Status *</label>
            <select required name="status" value={form.status} onChange={hc} className={ic}>
              <option value="present">Present</option><option value="absent">Absent</option>
              <option value="half_day">Half-Day</option><option value="leave">Leave</option><option value="holiday">Holiday</option>
            </select></div>
          <div className="pt-3 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">{saving ? "Saving..." : "Log"}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── Leave Application Modal ──────────────────────────────────────────────────
function LeaveModal({ isOpen, onClose, onSuccess, employees, leaveTypes, onLeaveTypeAdded }) {
  const [form, setForm] = useState({ employee: "", leave_type: "", start_date: "", end_date: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [showAddLeaveType, setShowAddLeaveType] = useState(false);
  const [balances, setBalances] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setForm({ employee: "", leave_type: "", start_date: "", end_date: "", reason: "" });
      setShowAddLeaveType(false);
      hrApi.getLeaveBalances().then(res => setBalances(res.data?.results || res.data || [])).catch(() => {});
    }
  }, [isOpen]);

  const hc = (e) => {
    if (e.target.name === "leave_type" && e.target.value === "__add_new__") {
      setShowAddLeaveType(true);
      return;
    }
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleLeaveTypeCreated = (newLt) => {
    if (onLeaveTypeAdded) onLeaveTypeAdded(newLt);
    setForm(p => ({ ...p, leave_type: newLt.id }));
    setShowAddLeaveType(false);
  };

  const selectedLt = leaveTypes.find((lt) => String(lt.id) === String(form.leave_type));
  const currentYear = form.start_date ? new Date(form.start_date).getFullYear() : new Date().getFullYear();
  const matchedBalance = balances.find((b) =>
    String(b.employee) === String(form.employee) &&
    String(b.leave_type) === String(form.leave_type) &&
    Number(b.year) === currentYear
  );
  const availableQuota = matchedBalance
    ? parseFloat(matchedBalance.balance)
    : (selectedLt?.is_paid ? parseFloat(selectedLt?.annual_entitlement || 0) : null);
  const isPaid = selectedLt?.is_paid;
  const isQuotaExhausted = Boolean(form.employee && form.leave_type && isPaid && availableQuota !== null && availableQuota <= 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isQuotaExhausted) {
      toast.error("Paid leave quota is fully exhausted. Additional paid leave cannot be taken.");
      return;
    }
    setSaving(true);
    try { await hrApi.createLeaveApplication(form); toast.success("Leave application submitted"); onSuccess(); onClose(); }
    catch (err) {
      const errors = err.response?.data;
      if (errors && typeof errors === "object") toast.error(Object.entries(errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join("\n"));
      else toast.error("Failed to submit");
    } finally { setSaving(false); }
  };
  if (!isOpen) return null;
  const ic = "w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";
  const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1";
  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md shadow-2xl my-8">
            <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Apply for Leave</h2>
              <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className={labelCls}>Employee *</label>
                <select required name="employee" value={form.employee} onChange={hc} className={ic}>
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}
                </select></div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Leave Type *</label>
                  <button
                    type="button"
                    onClick={() => setShowAddLeaveType(true)}
                    className="text-xs text-[var(--accent-primary)] hover:underline font-medium inline-flex items-center gap-1 transition"
                  >
                    <PlusIcon className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                <select required name="leave_type" value={form.leave_type} onChange={hc} className={ic}>
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map(lt => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.is_paid ? 'Paid' : 'Unpaid/Free'})
                    </option>
                  ))}
                  <option value="__add_new__" className="text-[var(--accent-primary)] font-semibold">+ Add New Leave Type...</option>
                </select>
                {form.employee && form.leave_type && (
                  <div className="flex items-center justify-between text-xs mt-1 px-1">
                    <span className={isPaid ? (isQuotaExhausted ? "text-[var(--status-danger)] font-medium" : "text-[var(--status-success)] font-medium") : "text-[var(--status-warning)]"}>
                      {isPaid
                        ? `Paid Quota: ${availableQuota !== null ? `${availableQuota} Days remaining` : 'Calculating...'}`
                        : "Unpaid / Free Leave (no quota limit)"}
                    </span>
                    {isQuotaExhausted && (
                      <span className="text-[var(--status-danger)] font-semibold uppercase text-[10px] tracking-wider bg-[var(--status-danger)]/15 border border-[var(--status-danger)]/30 px-1.5 py-0.5 rounded">
                        Quota Exhausted
                      </span>
                    )}
                  </div>
                )}
                {isQuotaExhausted && (
                  <div className="p-2.5 mt-2 rounded-xl bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30 text-xs text-[var(--status-danger)]">
                    This employee has exhausted their paid leave quota (0 days remaining). Additional paid leave cannot be taken. Please apply for an Unpaid / Free Leave type instead.
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Start *</label><input required type="date" name="start_date" value={form.start_date} onChange={hc} className={ic} /></div>
                <div><label className={labelCls}>End *</label><input required type="date" name="end_date" value={form.end_date} onChange={hc} className={ic} /></div>
              </div>
              <div><label className={labelCls}>Reason</label>
                <textarea name="reason" value={form.reason} onChange={hc} rows={2} className={ic + " resize-none"} /></div>
              <div className="pt-3 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
                <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
                <button
                  type="submit"
                  disabled={saving || isQuotaExhausted}
                  className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Submitting..." : isQuotaExhausted ? "Quota Exhausted" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <LeaveTypeModal
        isOpen={showAddLeaveType}
        onClose={() => setShowAddLeaveType(false)}
        onSuccess={handleLeaveTypeCreated}
      />
    </>
  );
}

// ─── Task Assignment Modal ──────────────────────────────────────────────────
function TaskModal({ isOpen, onClose, onSuccess, employees, task = null }) {
  const [form, setForm] = useState({ employee: "", title: "", description: "", deadline: "", status: "pending" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setForm({
          employee: task.employee || "",
          title: task.title || "",
          description: task.description || "",
          deadline: task.deadline || "",
          status: task.status || "pending"
        });
      } else {
        setForm({ employee: "", title: "", description: "", deadline: "", status: "pending" });
      }
    }
  }, [isOpen, task]);

  const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    const cleanedForm = {
      ...form,
      deadline: form.deadline ? form.deadline : null
    };
    try {
      if (task) {
        await hrApi.updateTask(task.id, cleanedForm);
        toast.success("Task updated successfully");
      } else {
        await hrApi.createTask(cleanedForm);
        toast.success("Task assigned successfully");
      }
      onSuccess();
      onClose();
    }
    catch (err) {
      console.error("Task submission error:", err);
      const errMsg = err.response?.data ? JSON.stringify(err.response.data) : (task ? "Failed to update task" : "Failed to assign task");
      toast.error(errMsg);
    }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;
  const ic = "w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";
  const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1";
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md shadow-2xl my-8">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{task ? "Edit Task" : "Assign Task"}</h2>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Employee *</label>
            <select required name="employee" value={form.employee} onChange={hc} className={ic}>
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Title *</label>
            <input required type="text" name="title" value={form.title} onChange={hc} className={ic} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea name="description" value={form.description} onChange={hc} rows={3} className={ic + " resize-none"} />
          </div>
          <div>
            <label className={labelCls}>Deadline</label>
            <input type="date" name="deadline" value={form.deadline} onChange={hc} className={ic} />
          </div>
          {task && (
            <div>
              <label className={labelCls}>Status *</label>
              <select required name="status" value={form.status} onChange={hc} className={ic}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}
          <div className="pt-3 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
              {saving ? "Saving..." : (task ? "Update" : "Assign")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── Task Details Modal ─────────────────────────────────────────────────────
function TaskDetailsModal({ isOpen, onClose, task, employees, onEdit = null, onDelete = null, onStatusChange = null }) {
  if (!isOpen || !task) return null;
  const isOverdue = task.status !== "completed" && task.deadline && new Date(task.deadline) < new Date(new Date().setHours(0,0,0,0));
  const emp = employees.find(e => e.id === task.employee);
  
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-lg shadow-2xl my-8 animate-fade-up">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)]">
          <span className="text-xs uppercase tracking-widest text-[var(--accent-primary)] font-bold">Task Details</span>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] leading-snug">{task.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                task.status === "completed" 
                  ? "bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30" 
                  : task.status === "in_progress"
                  ? "bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30"
                  : "bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
              }`}>
                {task.status.replace("_", " ")}
              </span>
              
              {isOverdue && (
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30 animate-pulse uppercase tracking-wider">
                  Overdue
                </span>
              )}
            </div>
          </div>
          
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 p-4 space-y-4">
            {task.description ? (
              <div>
                <span className="text-[11px] uppercase font-semibold tracking-wider text-[var(--text-muted)] block mb-1">Description</span>
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{task.description}</p>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] italic">No description provided for this task.</p>
            )}
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-subtle)] text-sm">
              <div>
                <span className="text-[11px] uppercase font-semibold tracking-wider text-[var(--text-muted)] block mb-0.5">Assigned To</span>
                <span className="font-semibold text-[var(--text-primary)]">{emp ? `${emp.full_name} (${emp.employee_code})` : "—"}</span>
              </div>
              <div>
                <span className="text-[11px] uppercase font-semibold tracking-wider text-[var(--text-muted)] block mb-0.5">Assigned By</span>
                <span className="font-semibold text-[var(--text-primary)]">{task.assigned_by_name || "HR System"}</span>
              </div>
              <div>
                <span className="text-[11px] uppercase font-semibold tracking-wider text-[var(--text-muted)] block mb-0.5">Deadline</span>
                <span className={`font-mono font-semibold ${isOverdue ? "text-[var(--status-danger)] font-bold" : "text-[var(--accent-primary)]"}`}>
                  {task.deadline || "No deadline"}
                </span>
              </div>
              <div>
                <span className="text-[11px] uppercase font-semibold tracking-wider text-[var(--text-muted)] block mb-0.5">Created At</span>
                <span className="text-[var(--text-secondary)]">{new Date(task.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end gap-3">
            {onStatusChange && task.status !== "completed" && (
              <>
                {task.status === "pending" && (
                  <button onClick={() => onStatusChange(task.id, "in_progress")} className="btn-secondary text-xs">
                    Start Task
                  </button>
                )}
                <button onClick={() => onStatusChange(task.id, "completed")} className="btn-primary text-xs">
                  Complete Task
                </button>
              </>
            )}
            {onEdit && (
              <button onClick={() => { onClose(); onEdit(task); }} className="btn-secondary text-xs">
                Edit Task
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(task.id)} className="px-4 py-2 text-xs font-semibold text-[var(--status-danger)] hover:bg-[var(--status-danger)]/15 border border-[var(--status-danger)]/30 rounded-xl transition">
                Delete Task
              </button>
            )}
            <button type="button" onClick={onClose} className="btn-secondary text-xs">Close</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── HR Notification Broadcast Modal ──────────────────────────────────────────
function NotificationModal({ isOpen, onClose, onSuccess, employees }) {
  const [form, setForm] = useState({ employee: "", title: "", message: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (isOpen) setForm({ employee: "", title: "", message: "" }); }, [isOpen]);
  const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    const payload = {
      ...form,
      employee: form.employee === "" ? null : form.employee
    };
    try {
      await hrApi.createNotification(payload);
      toast.success("Notification sent successfully");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Failed to send notification");
    } finally {
      setSaving(false);
    }
  };
  if (!isOpen) return null;
  const ic = "w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";
  const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1";
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md shadow-2xl my-8">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Send Broadcast Notification</h2>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Target Recipient</label>
            <select name="employee" value={form.employee} onChange={hc} className={ic}>
              <option value="">All Active Employees (Broadcast)</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Title *</label>
            <input required type="text" name="title" value={form.title} onChange={hc} className={ic} placeholder="e.g. Office Closure, Policy Update" />
          </div>
          <div>
            <label className={labelCls}>Message *</label>
            <textarea required name="message" value={form.message} onChange={hc} rows={4} className={ic + " resize-none"} placeholder="Enter announcement content..." />
          </div>
          <div className="pt-3 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">{saving ? "Sending..." : "Send Announcement"}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── Salary Increment Modal ─────────────────────────────────────────────────
function SalaryIncrementModal({ isOpen, onClose, onSuccess, employee }) {
  const [form, setForm] = useState({ increment_percentage: "", effective_from: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (isOpen) setForm({ increment_percentage: "", effective_from: new Date().toISOString().split("T")[0] }); }, [isOpen, employee]);
  const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await hrApi.incrementSalary(employee.id, {
        ...form,
        effective_date: form.effective_from,
      });
      toast.success("Salary incremented");
      onSuccess();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error || data?.detail || (typeof data === 'string' ? data : null) || err.message || "Failed to increment salary";
      toast.error(msg);
    } finally { setSaving(false); }
  };
  if (!isOpen || !employee) return null;
  const ic = "w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";
  const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1";
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-sm shadow-2xl my-8">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Apply Salary Increment</h2>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="mb-4">
            <p className="text-sm text-[var(--text-muted)]">Employee: <span className="text-[var(--text-primary)] font-medium">{employee.full_name}</span></p>
          </div>
          <div><label className={labelCls}>Increment Percentage (%) *</label>
            <input required type="number" step="0.01" min="0" name="increment_percentage" value={form.increment_percentage} onChange={hc} className={ic} placeholder="e.g. 10.5" /></div>
          <div><label className={labelCls}>Effective Date *</label>
            <input required type="date" name="effective_from" value={form.effective_from} onChange={hc} className={ic} /></div>
          <div className="pt-3 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">{saving ? "Applying..." : "Apply Increment"}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function HRDashboard() {
  const [tab, setTab] = useState("overview");
  const [metrics, setMetrics] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [queries, setQueries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [empModal, setEmpModal] = useState({ open: false, employee: null });
  const [deptModal, setDeptModal] = useState({ open: false, item: null });
  const [desigModal, setDesigModal] = useState({ open: false, item: null });
  const [attModal, setAttModal] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [notificationModal, setNotificationModal] = useState(false);
  const [incrementModal, setIncrementModal] = useState({ open: false, employee: null });
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [activeAlertDetails, setActiveAlertDetails] = useState(null);

  const handleFixAlertEmployee = async (empId) => {
    setActiveAlertDetails(null);
    const existing = employees.find(e => String(e.id) === String(empId));
    if (existing) {
      setEmpModal({ open: true, employee: existing });
    } else {
      try {
        const res = await hrApi.getEmployee(empId);
        setEmpModal({ open: true, employee: res.data });
      } catch (err) {
        toast.error("Could not load employee details");
      }
    }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, eRes, dRes, dgRes, ltRes, aRes, lRes, tRes, qRes, nRes] = await Promise.allSettled([
        hrApi.getHRDashboard(),
        hrApi.getEmployees(),
        hrApi.getDepartments(),
        hrApi.getDesignations(),
        hrApi.getLeaveTypes(),
        hrApi.getAttendance(),
        hrApi.getLeaveApplications(),
        hrApi.getTasks(),
        hrApi.getQueries(),
        hrApi.getNotifications(),
      ]);
      if (mRes.status === "fulfilled") setMetrics(mRes.value.data);
      if (eRes.status === "fulfilled") setEmployees(eRes.value.data?.results || eRes.value.data || []);
      if (dRes.status === "fulfilled") setDepartments(dRes.value.data?.results || dRes.value.data || []);
      if (dgRes.status === "fulfilled") setDesignations(dgRes.value.data?.results || dgRes.value.data || []);
      if (ltRes.status === "fulfilled") setLeaveTypes(ltRes.value.data?.results || ltRes.value.data || []);
      if (aRes.status === "fulfilled") setAttendance(aRes.value.data?.results || aRes.value.data || []);
      if (lRes.status === "fulfilled") setLeaves(lRes.value.data?.results || lRes.value.data || []);
      if (tRes.status === "fulfilled") setTasks(tRes.value.data?.results || tRes.value.data || []);
      if (qRes.status === "fulfilled") setQueries(qRes.value.data?.results || qRes.value.data || []);
      if (nRes.status === "fulfilled") setNotifications(nRes.value.data?.results || nRes.value.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSeedDefaults = async () => {
    try { await hrApi.seedDefaults(); toast.success("Defaults loaded!"); fetchAll(); }
    catch { toast.error("Failed to load defaults"); }
  };

  // Dept/Desig CRUD
  const handleSaveDept = async (name) => {
    try {
      if (deptModal.item) { await hrApi.updateDepartment(deptModal.item.id, { name }); toast.success("Updated"); }
      else { await hrApi.createDepartment({ name }); toast.success("Created"); }
      setDeptModal({ open: false, item: null }); fetchAll();
    } catch (e) { toast.error(e.response?.data?.name?.[0] || "Failed"); }
  };
  const handleDeleteDept = async (dept) => {
    if (!window.confirm(`Delete "${dept.name}"?`)) return;
    try { await hrApi.deleteDepartment(dept.id); toast.success("Deleted"); fetchAll(); }
    catch (e) { toast.error(e.response?.data?.detail || "Cannot delete — employees assigned"); }
  };
  const handleSaveDesig = async (name) => {
    try {
      if (desigModal.item) { await hrApi.updateDesignation(desigModal.item.id, { name }); toast.success("Updated"); }
      else { await hrApi.createDesignation({ name }); toast.success("Created"); }
      setDesigModal({ open: false, item: null }); fetchAll();
    } catch (e) { toast.error(e.response?.data?.name?.[0] || "Failed"); }
  };
  const handleDeleteDesig = async (d) => {
    if (!window.confirm(`Delete "${d.name}"?`)) return;
    try { await hrApi.deleteDesignation(d.id); toast.success("Deleted"); fetchAll(); }
    catch (e) { toast.error(e.response?.data?.detail || "Cannot delete — employees assigned"); }
  };
  const handleDeleteEmployee = async (emp) => {
    if (!window.confirm(`Delete "${emp.full_name}"?`)) return;
    try { await hrApi.deleteEmployee(emp.id); toast.success("Deleted"); fetchAll(); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed to delete employee"); }
  };
  const handleDeleteNotification = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    try {
      await hrApi.deleteNotification(id);
      toast.success("Notification deleted successfully");
      fetchAll();
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };
  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await hrApi.deleteTask(id);
      toast.success("Task deleted successfully");
      setSelectedTask(null);
      fetchAll();
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };
  const handleApproveLeave = async (id) => {
    try { await hrApi.approveLeave(id); toast.success("Approved"); fetchAll(); }
    catch { toast.error("Failed to approve"); }
  };
  const handleRejectLeave = async (id) => {
    try { await hrApi.rejectLeave(id); toast.success("Rejected"); fetchAll(); }
    catch { toast.error("Failed to reject"); }
  };
  const handleResolveQuery = async (id) => {
    try { await hrApi.updateQuery(id, { status: 'resolved' }); toast.success("Query resolved"); fetchAll(); }
    catch { toast.error("Failed to resolve query"); }
  };
  const handleRejectQuery = async (id) => {
    try { await hrApi.updateQuery(id, { status: 'rejected' }); toast.success("Query rejected"); fetchAll(); }
    catch { toast.error("Failed to reject query"); }
  };

  const ic = "w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";

  const emptyState = (msg, onLoad = true) => (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <p className="text-[var(--text-muted)] text-sm">{msg}</p>
      {onLoad && <button onClick={handleSeedDefaults} className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl">
        <CloudArrowDownIcon className="w-4 h-4" /> Load Defaults
      </button>}
    </div>
  );

  return (
    <>
      <div className="relative p-6 md:p-8 space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-1">Human Resources</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <ChartBarIcon className="w-8 h-8 text-[var(--accent-primary)]" /> HR Dashboard
          </h1>
        </div>
        <button onClick={fetchAll} className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
          <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1 p-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-fit min-w-full md:min-w-0 whitespace-nowrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition ${tab === t.id ? "bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-semibold shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-[var(--text-muted)] py-20">Loading...</div>
      ) : (
        <>
          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="space-y-6">
              {/* 5 KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon={UserGroupIcon} iconBg="bg-[var(--status-info)]/15" iconColor="text-[var(--status-info)]" label="Total Employees" value={metrics?.kpis?.total_employees ?? employees.length} sub={`${metrics?.kpis?.active_employees ?? employees.filter(e => e.status === 'active').length} Active`} />
                <StatCard icon={CheckCircleIcon} iconBg="bg-[var(--status-success)]/15" iconColor="text-[var(--status-success)]" label="Present Today" value={metrics?.kpis?.present_today ?? metrics?.present_today ?? 0} sub={`${metrics?.kpis?.on_leave_today ?? metrics?.on_leave_today ?? 0} On Leave`} />
                <StatCard icon={CurrencyRupeeIcon} iconBg="bg-[var(--accent-primary)]/15" iconColor="text-[var(--accent-primary)]" label="Payroll This Month" value={`₹${parseFloat(metrics?.kpis?.payroll_this_month || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub="Gross Salary" />
                <StatCard icon={BanknotesIcon} iconBg="bg-[var(--brand-accent)]/15" iconColor="text-[var(--brand-accent)]" label="Net Salary Payable" value={`₹${parseFloat(metrics?.kpis?.net_salary_payable || metrics?.last_payroll_net || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub="Disbursement Due" />
                <StatCard icon={ClockIcon} iconBg="bg-[var(--status-warning)]/15" iconColor="text-[var(--status-warning)]" label="Pending Payroll" value={metrics?.kpis?.pending_payroll ?? 0} sub="Cycles in Progress" />
              </div>

              {/* Current Payroll & Alerts Bento Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Current Payroll Card */}
                <div className="lg:col-span-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 relative overflow-hidden flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Current Payroll Cycle</span>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full uppercase ${
                        metrics?.current_payroll?.status === 'approved' || metrics?.current_payroll?.status === 'paid'
                          ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30'
                          : 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30'
                      }`}>
                        {metrics?.current_payroll?.status || 'Draft'}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                      {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mb-6">
                      {metrics?.current_payroll ? `${metrics.current_payroll.employee_count} employees processed` : 'Payroll not yet calculated for this month'}
                    </p>

                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <span>Gross Salary:</span>
                        <span className="font-semibold text-[var(--text-primary)]">₹{parseFloat(metrics?.current_payroll?.total_gross || '0').toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <span>Total Deductions:</span>
                        <span className="font-semibold text-[var(--status-danger)]">₹{parseFloat(metrics?.current_payroll?.total_deductions || '0').toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-xs text-[var(--text-secondary)] border-t border-[var(--border-subtle)] pt-2 font-medium">
                        <span>Net Payable:</span>
                        <span className="font-bold text-[var(--status-success)]">₹{parseFloat(metrics?.current_payroll?.total_net || '0').toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <Link to="/hr/payroll" className="btn-primary w-full py-2.5 px-4 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition">
                    Manage Payroll <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>

                {/* HR Alerts Drawer */}
                <div className="lg:col-span-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden flex flex-col shadow-sm">
                  <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-[var(--status-warning)]" />
                      <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">HR Alerts & Action Items</span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full">
                      {(metrics?.alerts || []).length} active
                    </span>
                  </div>

                  <div className="p-4 flex-1 overflow-y-auto max-h-[260px] space-y-3">
                    {(!metrics?.alerts || metrics.alerts.length === 0) ? (
                      <div className="flex items-center justify-center py-10 text-[var(--text-muted)] text-sm">
                        ✅ No pending alerts or blocked actions.
                      </div>
                    ) : (
                      metrics.alerts.map((alert, idx) => (
                        <div key={idx} className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
                          alert.type === 'danger' ? 'bg-[var(--status-danger)]/10 border-[var(--status-danger)]/25 text-[var(--status-danger)]' :
                          alert.type === 'warning' ? 'bg-[var(--status-warning)]/10 border-[var(--status-warning)]/25 text-[var(--status-warning)]' :
                          'bg-[var(--status-info)]/10 border-[var(--status-info)]/25 text-[var(--status-info)]'
                        }`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <ShieldExclamationIcon className="w-5 h-5 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">{alert.title}</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{alert.message}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {alert.items && alert.items.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setActiveAlertDetails(alert)}
                                  className="btn-secondary text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                                >
                                  View Affected ({alert.items.length})
                                </button>
                              )}
                              {alert.action_url && (
                                <Link to={alert.action_url} className="btn-secondary text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap">
                                  Resolve
                                </Link>
                              )}
                            </div>
                          </div>
                          {/* Affected Employees quick inline pills preview */}
                          {alert.items && alert.items.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[var(--border-subtle)]">
                              <span className="text-[11px] text-[var(--text-muted)] font-medium">Affecting:</span>
                              {alert.items.slice(0, 4).map((it, i) => (
                                <button
                                  key={it.id || i}
                                  type="button"
                                  onClick={() => handleFixAlertEmployee(it.id)}
                                  className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--bg-primary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition inline-flex items-center gap-1"
                                  title="Click to view/edit employee"
                                >
                                  <span>{it.name}</span>
                                  {it.employee_code && <span className="text-[var(--text-muted)] font-mono text-[11px]">({it.employee_code})</span>}
                                </button>
                              ))}
                              {alert.items.length > 4 && (
                                <button
                                  type="button"
                                  onClick={() => setActiveAlertDetails(alert)}
                                  className="text-[11px] text-[var(--accent-primary)] hover:underline font-medium"
                                >
                                  +{alert.items.length - 4} more
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Departments summary */}
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 flex items-center gap-2">
                    <BuildingOfficeIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Departments</span>
                  </div>
                  {departments.length === 0 ? emptyState("No departments yet") : (
                    <ul className="divide-y divide-[var(--border-subtle)]">
                      {departments.slice(0, 6).map(d => {
                        const count = employees.filter(e => e.department === d.id).length;
                        return (
                          <li key={d.id} className="flex justify-between px-5 py-3 hover:bg-[var(--bg-surface-hover)] transition">
                            <span className="text-sm text-[var(--text-primary)]">{d.name}</span>
                            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full">{count} emp</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                {/* Pending leaves */}
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-[var(--status-warning)]" />
                    <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Pending Leaves</span>
                  </div>
                  {leaves.filter(l => l.status === "pending").length === 0 ? (
                    <p className="p-5 text-sm text-[var(--text-muted)]">No pending approvals.</p>
                  ) : (
                    <ul className="divide-y divide-[var(--border-subtle)]">
                      {leaves.filter(l => l.status === "pending").slice(0, 5).map(l => (
                        <li key={l.id} className="flex justify-between items-center px-5 py-3 hover:bg-[var(--bg-surface-hover)] transition">
                          <div>
                            <p className="text-sm text-[var(--text-primary)] font-medium">{l.employee_name || l.employee}</p>
                            <p className="text-xs text-[var(--text-muted)]">{l.leave_type_name} · {l.start_date} → {l.end_date}</p>
                          </div>
                          <span className="text-xs text-[var(--status-warning)] bg-[var(--status-warning)]/15 border border-[var(--status-warning)]/30 px-2 py-0.5 rounded-full font-medium">{l.computed_days}d</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── EMPLOYEES ── */}
          {tab === "employees" && (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 flex justify-between items-center">
                <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">All Employees</span>
                <button onClick={() => setEmpModal({ open: true, employee: null })} className="btn-primary inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-xl">
                  <PlusIcon className="h-3.5 w-3.5" /> Add Employee
                </button>
              </div>
              {employees.length === 0 ? emptyState("No employees yet. Add your first one.", false) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[var(--text-secondary)]">
                    <thead className="text-xs uppercase bg-[var(--bg-primary)]/60 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                      <tr>
                        <th className="px-5 py-3">Code</th>
                        <th className="px-5 py-3">Name</th>
                        <th className="px-5 py-3">Department</th>
                        <th className="px-5 py-3">Designation</th>
                        <th className="px-5 py-3">Type</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(emp => (
                        <tr key={emp.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition">
                          <td className="px-5 py-3 text-[var(--accent-primary)] font-mono text-xs">{emp.employee_code}</td>
                          <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{emp.full_name}</td>
                          <td className="px-5 py-3">{emp.department_name || "—"}</td>
                          <td className="px-5 py-3">{emp.designation_name || "—"}</td>
                          <td className="px-5 py-3 capitalize">{(emp.employment_type || "").replace("_", "-")}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${emp.status === "active" ? "bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30" : "bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30"}`}>{emp.status}</span>
                          </td>
                          <td className="px-5 py-3 text-right space-x-2">
                            <button onClick={() => setEmpModal({ open: true, employee: emp })} className="text-[var(--accent-primary)] hover:opacity-80 transition" title="Edit Employee"><PencilIcon className="w-4 h-4" /></button>
                            <button onClick={() => setIncrementModal({ open: true, employee: emp })} className="text-[var(--status-success)] hover:opacity-80 transition" title="Apply Salary Increment"><CurrencyRupeeIcon className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteEmployee(emp)} className="text-[var(--status-danger)] hover:opacity-80 transition" title="Delete Employee"><TrashIcon className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── DEPARTMENTS ── */}
          {tab === "departments" && (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 flex justify-between items-center">
                <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Departments</span>
                <div className="flex gap-2">
                  {departments.length === 0 && (
                    <button onClick={handleSeedDefaults} className="btn-secondary inline-flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-xl">
                      <CloudArrowDownIcon className="h-3.5 w-3.5" /> Load Defaults
                    </button>
                  )}
                  <button onClick={() => setDeptModal({ open: true, item: null })} className="btn-primary inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-xl">
                    <PlusIcon className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              </div>
              {departments.length === 0 ? emptyState("No departments yet") : (
                <table className="w-full text-sm text-left text-[var(--text-secondary)]">
                  <thead className="text-xs uppercase bg-[var(--bg-primary)]/60 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                    <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Employees</th><th className="px-5 py-3 text-right">Actions</th></tr>
                  </thead>
                  <tbody>
                    {departments.map(d => (
                      <tr key={d.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition">
                        <td className="px-5 py-3 text-[var(--text-primary)] font-medium">{d.name}</td>
                        <td className="px-5 py-3">{employees.filter(e => e.department === d.id).length}</td>
                        <td className="px-5 py-3 text-right space-x-3">
                          <button onClick={() => setDeptModal({ open: true, item: d })} className="text-[var(--accent-primary)] hover:opacity-80 transition"><PencilIcon className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteDept(d)} className="text-[var(--status-danger)] hover:opacity-80 transition"><TrashIcon className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── DESIGNATIONS ── */}
          {tab === "designations" && (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 flex justify-between items-center">
                <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Designations</span>
                <div className="flex gap-2">
                  {designations.length === 0 && (
                    <button onClick={handleSeedDefaults} className="btn-secondary inline-flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-xl">
                      <CloudArrowDownIcon className="h-3.5 w-3.5" /> Load Defaults
                    </button>
                  )}
                  <button onClick={() => setDesigModal({ open: true, item: null })} className="btn-primary inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-xl">
                    <PlusIcon className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              </div>
              {designations.length === 0 ? emptyState("No designations yet") : (
                <table className="w-full text-sm text-left text-[var(--text-secondary)]">
                  <thead className="text-xs uppercase bg-[var(--bg-primary)]/60 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                    <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3 text-right">Actions</th></tr>
                  </thead>
                  <tbody>
                    {designations.map(d => (
                      <tr key={d.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition">
                        <td className="px-5 py-3 text-[var(--text-primary)] font-medium">{d.name}</td>
                        <td className="px-5 py-3 text-right space-x-3">
                          <button onClick={() => setDesigModal({ open: true, item: d })} className="text-[var(--accent-primary)] hover:opacity-80 transition"><PencilIcon className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteDesig(d)} className="text-[var(--status-danger)] hover:opacity-80 transition"><TrashIcon className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── ATTENDANCE ── */}
          {tab === "attendance" && (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 flex justify-between items-center">
                <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Attendance Log</span>
                <button onClick={() => setAttModal(true)} className="btn-primary inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-xl">
                  <PlusIcon className="h-3.5 w-3.5" /> Log Attendance
                </button>
              </div>
              {attendance.length === 0 ? emptyState("No attendance records yet", false) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[var(--text-secondary)]">
                    <thead className="text-xs uppercase bg-[var(--bg-primary)]/60 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                      <tr><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Status</th></tr>
                    </thead>
                    <tbody>
                      {attendance.map(r => (
                        <tr key={r.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition">
                          <td className="px-5 py-3">
                            <span className="text-[var(--text-primary)] font-medium">{r.employee_name || "—"}</span>
                            {r.employee_code && <span className="ml-2 text-xs text-[var(--text-muted)] font-mono">{r.employee_code}</span>}
                          </td>
                          <td className="px-5 py-3">{r.date}</td>
                          <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[r.status] || "bg-[var(--bg-primary)] text-[var(--text-muted)]"}`}>{r.status?.replace("_", " ")}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── LEAVES ── */}
          {tab === "leaves" && (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 flex justify-between items-center">
                <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Leave Applications</span>
                <button onClick={() => setLeaveModal(true)} className="btn-primary inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-xl">
                  <PlusIcon className="h-3.5 w-3.5" /> Apply for Leave
                </button>
              </div>
              {leaves.length === 0 ? emptyState("No leave applications yet", false) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[var(--text-secondary)]">
                    <thead className="text-xs uppercase bg-[var(--bg-primary)]/60 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                      <tr><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Duration</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr>
                    </thead>
                    <tbody>
                      {leaves.map(l => (
                        <tr key={l.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition">
                          <td className="px-5 py-3 text-[var(--text-primary)] font-medium">{l.employee_name || l.employee}</td>
                          <td className="px-5 py-3">
                            <div className="font-medium text-[var(--text-primary)]">{l.leave_type_name || l.leave_type}</div>
                            {l.reason && <div className="text-xs text-[var(--text-muted)] mt-1 max-w-xs break-words" title={l.reason}>{l.reason}</div>}
                          </td>
                          <td className="px-5 py-3 text-[var(--text-secondary)]">{l.start_date} → {l.end_date}<br /><span className="text-xs text-[var(--text-muted)]">{l.computed_days} days</span></td>
                          <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${LEAVE_COLORS[l.status] || "bg-[var(--bg-primary)] text-[var(--text-muted)]"}`}>{l.status}</span></td>
                          <td className="px-5 py-3 text-right space-x-2">
                            {l.status === "pending" && (<>
                              <button onClick={() => handleApproveLeave(l.id)} className="p-1 rounded bg-[var(--status-success)]/15 text-[var(--status-success)] hover:bg-[var(--status-success)]/25 transition"><CheckIcon className="w-4 h-4" /></button>
                              <button onClick={() => handleRejectLeave(l.id)} className="p-1 rounded bg-[var(--status-danger)]/15 text-[var(--status-danger)] hover:bg-[var(--status-danger)]/25 transition"><XMarkIcon className="w-4 h-4" /></button>
                            </>)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {/* ── TASKS ── */}
          {tab === "tasks" && (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 flex justify-between items-center">
                <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Assigned Tasks</span>
                <button onClick={() => setTaskModal(true)} className="btn-primary inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-xl">
                  <PlusIcon className="h-3.5 w-3.5" /> Assign Task
                </button>
              </div>
              {tasks.length === 0 ? emptyState("No tasks assigned yet", false) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[var(--text-secondary)]">
                    <thead className="text-xs uppercase bg-[var(--bg-primary)]/60 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                      <tr><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Title</th><th className="px-5 py-3">Deadline</th><th className="px-5 py-3">Status</th></tr>
                    </thead>
                    <tbody>
                      {tasks.map(t => {
                        const isOverdue = t.status !== 'completed' && t.deadline && new Date(t.deadline) < new Date(new Date().setHours(0,0,0,0));
                        return (
                          <tr key={t.id} onClick={() => setSelectedTask(t)} className={`border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] cursor-pointer transition ${isOverdue ? 'bg-[var(--status-danger)]/5' : ''}`}>
                            <td className="px-5 py-3 text-[var(--text-primary)] font-medium">{employees.find(e => e.id === t.employee)?.full_name || "—"}</td>
                            <td className="px-5 py-3 font-semibold text-[var(--text-primary)]">{t.title}</td>
                            <td className="px-5 py-3 font-mono text-xs">
                              {t.deadline ? (
                                <span className={`px-2 py-0.5 rounded ${isOverdue ? 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] font-bold border border-[var(--status-danger)]/30' : 'text-[var(--accent-primary)]'}`}>
                                  {t.deadline} {isOverdue && "(OVERDUE)"}
                                </span>
                              ) : (
                                "No deadline"
                              )}
                            </td>
                            <td className="px-5 py-3 capitalize">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${t.status === 'completed' ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30' : t.status === 'in_progress' ? 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30' : 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30'}`}>
                                {t.status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── QUERIES ── */}
          {tab === "queries" && (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 flex justify-between items-center">
                <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Employee Queries</span>
              </div>
              {queries.length === 0 ? emptyState("No queries found", false) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[var(--text-secondary)]">
                    <thead className="text-xs uppercase bg-[var(--bg-primary)]/60 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                      <tr><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Message</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr>
                    </thead>
                    <tbody>
                      {queries.map(q => (
                        <tr key={q.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition">
                          <td className="px-5 py-3 text-[var(--text-primary)] font-medium">{employees.find(e => e.id === q.employee)?.full_name || "—"}</td>
                          <td className="px-5 py-3 text-[var(--text-primary)]">{q.subject}</td>
                          <td className="px-5 py-3 max-w-xs truncate text-[var(--text-muted)]">{q.message}</td>
                          <td className="px-5 py-3 capitalize">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${q.status === 'resolved' ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30' : q.status === 'rejected' ? 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30' : 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30'}`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right space-x-2">
                            {q.status === 'pending' && (
                              <>
                                <button onClick={() => handleResolveQuery(q.id)} className="p-1 rounded bg-[var(--status-success)]/15 text-[var(--status-success)] hover:bg-[var(--status-success)]/25 transition"><CheckIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleRejectQuery(q.id)} className="p-1 rounded bg-[var(--status-danger)]/15 text-[var(--status-danger)] hover:bg-[var(--status-danger)]/25 transition"><XMarkIcon className="w-4 h-4" /></button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === "notifications" && (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 flex justify-between items-center">
                <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Broadcast & Announcements</span>
                <button onClick={() => setNotificationModal(true)} className="btn-primary inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-xl">
                  <PlusIcon className="h-3.5 w-3.5" /> Send Notification
                </button>
              </div>
              {notifications.length === 0 ? emptyState("No notifications sent yet", false) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[var(--text-secondary)]">
                    <thead className="text-xs uppercase bg-[var(--bg-primary)]/60 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                      <tr>
                        <th className="px-5 py-3">Recipient</th>
                        <th className="px-5 py-3">Title</th>
                        <th className="px-5 py-3">Message</th>
                        <th className="px-5 py-3">Sent At</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notifications.map(n => (
                        <tr key={n.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition">
                          <td className="px-5 py-3 text-[var(--accent-primary)] font-medium">{n.employee_name || "All Employees (Broadcast)"}</td>
                          <td className="px-5 py-3 text-[var(--text-primary)] font-medium">{n.title}</td>
                          <td className="px-5 py-3 max-w-sm truncate text-[var(--text-muted)]" title={n.message}>{n.message}</td>
                          <td className="px-5 py-3 text-xs text-[var(--text-muted)]">{new Date(n.created_at).toLocaleString()}</td>
                          <td className="px-5 py-3 text-right">
                            <button onClick={() => handleDeleteNotification(n.id)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--status-danger)] rounded-lg hover:bg-[var(--status-danger)]/10 transition" title="Delete Notification">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      </div>

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}
      <EmployeeFormModal isOpen={empModal.open} onClose={() => setEmpModal({ open: false, employee: null })} employee={empModal.employee} onSuccess={fetchAll} />
      <SimpleFormModal isOpen={deptModal.open} onClose={() => setDeptModal({ open: false, item: null })} title={deptModal.item ? "Edit Department" : "Add Department"} label="Department Name" initialValue={deptModal.item?.name || ""} onSubmit={handleSaveDept} />
      <SimpleFormModal isOpen={desigModal.open} onClose={() => setDesigModal({ open: false, item: null })} title={desigModal.item ? "Edit Designation" : "Add Designation"} label="Designation Name" initialValue={desigModal.item?.name || ""} onSubmit={handleSaveDesig} />
      <AttendanceModal isOpen={attModal} onClose={() => setAttModal(false)} onSuccess={fetchAll} employees={employees} />
      <LeaveModal isOpen={leaveModal} onClose={() => setLeaveModal(false)} onSuccess={fetchAll} employees={employees} leaveTypes={leaveTypes} onLeaveTypeAdded={(newLt) => setLeaveTypes(p => [...p, newLt])} />
      <TaskModal isOpen={taskModal} onClose={() => { setTaskModal(false); setTaskToEdit(null); }} onSuccess={fetchAll} employees={employees} task={taskToEdit} />
      <TaskDetailsModal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} task={selectedTask} employees={employees} onEdit={(t) => { setTaskToEdit(t); setTaskModal(true); }} onDelete={handleDeleteTask} />
      <NotificationModal isOpen={notificationModal} onClose={() => setNotificationModal(false)} onSuccess={fetchAll} employees={employees} />
      <SalaryIncrementModal isOpen={incrementModal.open} onClose={() => setIncrementModal({ open: false, employee: null })} onSuccess={fetchAll} employee={incrementModal.employee} />
      <AlertDetailsModal
        isOpen={!!activeAlertDetails}
        onClose={() => setActiveAlertDetails(null)}
        alert={activeAlertDetails}
        onSelectEmployee={handleFixAlertEmployee}
      />
    </>
  );
}
