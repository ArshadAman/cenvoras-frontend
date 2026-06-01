import React, { useState, useEffect, useCallback } from "react";
import { hrApi } from "../../api/hr";
import {
  ChartBarIcon, UserGroupIcon, CalendarDaysIcon, CurrencyRupeeIcon,
  BuildingOfficeIcon, BriefcaseIcon, ClockIcon, CheckCircleIcon,
  ArrowPathIcon, PlusIcon, PencilIcon, TrashIcon, CheckIcon,
  XMarkIcon, CloudArrowDownIcon,
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import EmployeeFormModal from "./EmployeeFormModal";
import SimpleFormModal from "./SimpleFormModal";

// ─── Reusable Stat Card ───────────────────────────────────────────────────────
function StatCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md flex items-start gap-4 hover:bg-white/[0.08] transition">
      <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
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
  present:  "bg-green-500/10 text-green-400",
  absent:   "bg-red-500/10 text-red-400",
  half_day: "bg-yellow-500/10 text-yellow-400",
  leave:    "bg-blue-500/10 text-blue-400",
  holiday:  "bg-purple-500/10 text-purple-400",
};

const LEAVE_COLORS = {
  pending:  "bg-yellow-500/10 text-yellow-400",
  approved: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
};

// ─── Attendance Log Modal ─────────────────────────────────────────────────────
function AttendanceModal({ isOpen, onClose, onSuccess, employees }) {
  const [form, setForm] = useState({ employee: "", date: "", status: "present" });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (isOpen) setForm({ employee: "", date: new Date().toISOString().split("T")[0], status: "present" }); }, [isOpen]);
  const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await hrApi.createAttendance(form); toast.success("Attendance logged"); onSuccess(); onClose(); }
    catch (err) { toast.error(err.response?.data?.detail || "Failed to log attendance"); }
    finally { setSaving(false); }
  };
  if (!isOpen) return null;
  const ic = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl my-8">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Log Attendance</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div><label className="block text-sm text-gray-300 mb-1">Employee *</label>
            <select required name="employee" value={form.employee} onChange={hc} className={ic}>
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}
            </select></div>
          <div><label className="block text-sm text-gray-300 mb-1">Date *</label>
            <input required type="date" name="date" value={form.date} onChange={hc} className={ic} /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Status *</label>
            <select required name="status" value={form.status} onChange={hc} className={ic}>
              <option value="present">Present</option><option value="absent">Absent</option>
              <option value="half_day">Half-Day</option><option value="leave">Leave</option><option value="holiday">Holiday</option>
            </select></div>
          <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 disabled:opacity-50">{saving ? "Saving..." : "Log"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Leave Application Modal ──────────────────────────────────────────────────
function LeaveModal({ isOpen, onClose, onSuccess, employees, leaveTypes }) {
  const [form, setForm] = useState({ employee: "", leave_type: "", start_date: "", end_date: "", reason: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (isOpen) setForm({ employee: "", leave_type: "", start_date: "", end_date: "", reason: "" }); }, [isOpen]);
  const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await hrApi.createLeaveApplication(form); toast.success("Leave application submitted"); onSuccess(); onClose(); }
    catch (err) {
      const errors = err.response?.data;
      if (errors && typeof errors === "object") toast.error(Object.entries(errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join("\n"));
      else toast.error("Failed to submit");
    } finally { setSaving(false); }
  };
  if (!isOpen) return null;
  const ic = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl my-8">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Apply for Leave</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div><label className="block text-sm text-gray-300 mb-1">Employee *</label>
            <select required name="employee" value={form.employee} onChange={hc} className={ic}>
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}
            </select></div>
          <div><label className="block text-sm text-gray-300 mb-1">Leave Type *</label>
            <select required name="leave_type" value={form.leave_type} onChange={hc} className={ic}>
              <option value="">Select Leave Type</option>
              {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Start *</label><input required type="date" name="start_date" value={form.start_date} onChange={hc} className={ic} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">End *</label><input required type="date" name="end_date" value={form.end_date} onChange={hc} className={ic} /></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Reason</label>
            <textarea name="reason" value={form.reason} onChange={hc} rows={2} className={ic + " resize-none"} /></div>
          <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 disabled:opacity-50">{saving ? "Submitting..." : "Submit"}</button>
          </div>
        </form>
      </div>
    </div>
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
    try {
      if (task) {
        await hrApi.updateTask(task.id, form);
        toast.success("Task updated successfully");
      } else {
        await hrApi.createTask(form);
        toast.success("Task assigned successfully");
      }
      onSuccess();
      onClose();
    }
    catch (err) {
      toast.error(task ? "Failed to update task" : "Failed to assign task");
    }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;
  const ic = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl my-8">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">{task ? "Edit Task" : "Assign Task"}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Employee *</label>
            <select required name="employee" value={form.employee} onChange={hc} className={ic}>
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Title *</label>
            <input required type="text" name="title" value={form.title} onChange={hc} className={ic} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={hc} rows={3} className={ic + " resize-none"} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Deadline</label>
            <input type="date" name="deadline" value={form.deadline} onChange={hc} className={ic} />
          </div>
          {task && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">Status *</label>
              <select required name="status" value={form.status} onChange={hc} className={ic}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}
          <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 disabled:opacity-50">
              {saving ? "Saving..." : (task ? "Update" : "Assign")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Task Details Modal ─────────────────────────────────────────────────────
function TaskDetailsModal({ isOpen, onClose, task, employees, onEdit = null, onDelete = null, onStatusChange = null }) {
  if (!isOpen || !task) return null;
  const isOverdue = task.status !== "completed" && task.deadline && new Date(task.deadline) < new Date(new Date().setHours(0,0,0,0));
  const emp = employees.find(e => e.id === task.employee);
  
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl my-8 animate-fade-up">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <span className="text-xs uppercase tracking-widest text-indigo-300 font-bold">Task Details</span>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white leading-snug">{task.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                task.status === "completed" 
                  ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                  : task.status === "in_progress"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
              }`}>
                {task.status.replace("_", " ")}
              </span>
              
              {isOverdue && (
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse uppercase tracking-wider">
                  Overdue
                </span>
              )}
            </div>
          </div>
          
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 space-y-4">
            {task.description ? (
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-1">Description</span>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{task.description}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No description provided for this task.</p>
            )}
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 text-sm">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-0.5">Assigned To</span>
                <span className="font-semibold text-white">{emp ? `${emp.full_name} (${emp.employee_code})` : "—"}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-0.5">Assigned By</span>
                <span className="font-semibold text-white">{task.assigned_by_name || "HR System"}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-0.5">Deadline</span>
                <span className={`font-mono font-semibold ${isOverdue ? "text-rose-400 font-bold" : "text-indigo-300"}`}>
                  {task.deadline || "No deadline"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-0.5">Created At</span>
                <span className="text-gray-300">{new Date(task.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
            {onStatusChange && task.status !== "completed" && (
              <>
                {task.status === "pending" && (
                  <button onClick={() => onStatusChange(task.id, "in_progress")} className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition">
                    Start Task
                  </button>
                )}
                <button onClick={() => onStatusChange(task.id, "completed")} className="px-4 py-2 text-xs font-semibold text-slate-950 bg-green-400 hover:bg-green-300 rounded-xl transition">
                  Complete Task
                </button>
              </>
            )}
            {onEdit && (
              <button onClick={() => { onClose(); onEdit(task); }} className="px-4 py-2 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-xl transition">
                Edit Task
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(task.id)} className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition">
                Delete Task
              </button>
            )}
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition">Close</button>
          </div>
        </div>
      </div>
    </div>
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
  const ic = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl my-8">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Send Broadcast Notification</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Target Recipient</label>
            <select name="employee" value={form.employee} onChange={hc} className={ic}>
              <option value="">All Active Employees (Broadcast)</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Title *</label>
            <input required type="text" name="title" value={form.title} onChange={hc} className={ic} placeholder="e.g. Office Closure, Policy Update" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Message *</label>
            <textarea required name="message" value={form.message} onChange={hc} rows={4} className={ic + " resize-none"} placeholder="Enter announcement content..." />
          </div>
          <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 disabled:opacity-50">{saving ? "Sending..." : "Send Announcement"}</button>
          </div>
        </form>
      </div>
    </div>
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
    try { await hrApi.incrementSalary(employee.id, form); toast.success("Salary incremented"); onSuccess(); onClose(); }
    catch (err) { toast.error(err.response?.data?.detail || "Failed to increment salary"); }
    finally { setSaving(false); }
  };
  if (!isOpen || !employee) return null;
  const ic = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl my-8">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Apply Salary Increment</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="mb-4">
            <p className="text-sm text-gray-400">Employee: <span className="text-white font-medium">{employee.full_name}</span></p>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Increment Percentage (%) *</label>
            <input required type="number" step="0.01" min="0" name="increment_percentage" value={form.increment_percentage} onChange={hc} className={ic} placeholder="e.g. 10.5" /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Effective Date *</label>
            <input required type="date" name="effective_from" value={form.effective_from} onChange={hc} className={ic} /></div>
          <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 disabled:opacity-50">{saving ? "Applying..." : "Apply Increment"}</button>
          </div>
        </form>
      </div>
    </div>
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
    catch (e) { toast.error("Failed to delete employee"); }
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

  const ic = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500";

  const emptyState = (msg, onLoad = true) => (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <p className="text-gray-400 text-sm">{msg}</p>
      {onLoad && <button onClick={handleSeedDefaults} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition">
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
          <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-1">Human Resources</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-3">
            <ChartBarIcon className="w-8 h-8 text-indigo-300" /> HR Dashboard
          </h1>
        </div>
        <button onClick={fetchAll} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit min-w-full md:min-w-0 whitespace-nowrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition ${tab === t.id ? "bg-indigo-500 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20">Loading...</div>
      ) : (
        <>
          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={UserGroupIcon} iconBg="bg-blue-500/20" iconColor="text-blue-400" label="Active Employees" value={metrics?.total_active_employees ?? employees.filter(e => e.status === "active").length} sub={`Across ${departments.length} departments`} />
                <StatCard icon={CheckCircleIcon} iconBg="bg-green-500/20" iconColor="text-green-400" label="Present Today" value={metrics?.present_today ?? 0} />
                <StatCard icon={CalendarDaysIcon} iconBg="bg-orange-500/20" iconColor="text-orange-400" label="On Leave Today" value={metrics?.on_leave_today ?? 0} sub={`${leaves.filter(l => l.status === "pending").length} pending`} />
                <StatCard icon={CurrencyRupeeIcon} iconBg="bg-indigo-500/20" iconColor="text-indigo-400" label="Last Payroll Net" value={metrics?.last_payroll_net ? `₹${parseFloat(metrics.last_payroll_net).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "N/A"} sub="Last finalised run" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Departments summary */}
                <div className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
                  <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center gap-2">
                    <BuildingOfficeIcon className="w-4 h-4 text-indigo-300" />
                    <span className="text-sm font-semibold text-white uppercase tracking-wider">Departments</span>
                  </div>
                  {departments.length === 0 ? emptyState("No departments yet") : (
                    <ul className="divide-y divide-white/5">
                      {departments.slice(0, 6).map(d => {
                        const count = employees.filter(e => e.department === d.id).length;
                        return (
                          <li key={d.id} className="flex justify-between px-5 py-3 hover:bg-white/5">
                            <span className="text-sm text-white">{d.name}</span>
                            <span className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">{count} emp</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                {/* Pending leaves */}
                <div className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
                  <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-white uppercase tracking-wider">Pending Leaves</span>
                  </div>
                  {leaves.filter(l => l.status === "pending").length === 0 ? (
                    <p className="p-5 text-sm text-gray-400">No pending approvals.</p>
                  ) : (
                    <ul className="divide-y divide-white/5">
                      {leaves.filter(l => l.status === "pending").slice(0, 5).map(l => (
                        <li key={l.id} className="flex justify-between items-center px-5 py-3 hover:bg-white/5">
                          <div>
                            <p className="text-sm text-white">{l.employee_name || l.employee}</p>
                            <p className="text-xs text-gray-500">{l.leave_type_name} · {l.start_date} → {l.end_date}</p>
                          </div>
                          <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">{l.computed_days}d</span>
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
            <div className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
                <span className="text-sm font-semibold text-white uppercase tracking-wider">All Employees</span>
                <button onClick={() => setEmpModal({ open: true, employee: null })} className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-indigo-300 transition">
                  <PlusIcon className="h-3.5 w-3.5" /> Add Employee
                </button>
              </div>
              {employees.length === 0 ? emptyState("No employees yet. Add your first one.", false) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
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
                        <tr key={emp.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-5 py-3 text-indigo-300 font-mono text-xs">{emp.employee_code}</td>
                          <td className="px-5 py-3 font-medium text-white">{emp.full_name}</td>
                          <td className="px-5 py-3">{emp.department_name || "—"}</td>
                          <td className="px-5 py-3">{emp.designation_name || "—"}</td>
                          <td className="px-5 py-3 capitalize">{(emp.employment_type || "").replace("_", "-")}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${emp.status === "active" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{emp.status}</span>
                          </td>
                          <td className="px-5 py-3 text-right space-x-2">
                            <button onClick={() => setEmpModal({ open: true, employee: emp })} className="text-indigo-400 hover:text-indigo-300" title="Edit Employee"><PencilIcon className="w-4 h-4" /></button>
                            <button onClick={() => setIncrementModal({ open: true, employee: emp })} className="text-green-400 hover:text-green-300" title="Apply Salary Increment"><CurrencyRupeeIcon className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteEmployee(emp)} className="text-red-400 hover:text-red-300" title="Delete Employee"><TrashIcon className="w-4 h-4" /></button>
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
            <div className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
                <span className="text-sm font-semibold text-white uppercase tracking-wider">Departments</span>
                <div className="flex gap-2">
                  {departments.length === 0 && (
                    <button onClick={handleSeedDefaults} className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition">
                      <CloudArrowDownIcon className="h-3.5 w-3.5" /> Load Defaults
                    </button>
                  )}
                  <button onClick={() => setDeptModal({ open: true, item: null })} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-indigo-300 transition">
                    <PlusIcon className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              </div>
              {departments.length === 0 ? emptyState("No departments yet") : (
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                    <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Employees</th><th className="px-5 py-3 text-right">Actions</th></tr>
                  </thead>
                  <tbody>
                    {departments.map(d => (
                      <tr key={d.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-5 py-3 text-white">{d.name}</td>
                        <td className="px-5 py-3">{employees.filter(e => e.department === d.id).length}</td>
                        <td className="px-5 py-3 text-right space-x-3">
                          <button onClick={() => setDeptModal({ open: true, item: d })} className="text-indigo-400 hover:text-indigo-300"><PencilIcon className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteDept(d)} className="text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
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
            <div className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
                <span className="text-sm font-semibold text-white uppercase tracking-wider">Designations</span>
                <div className="flex gap-2">
                  {designations.length === 0 && (
                    <button onClick={handleSeedDefaults} className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition">
                      <CloudArrowDownIcon className="h-3.5 w-3.5" /> Load Defaults
                    </button>
                  )}
                  <button onClick={() => setDesigModal({ open: true, item: null })} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-indigo-300 transition">
                    <PlusIcon className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              </div>
              {designations.length === 0 ? emptyState("No designations yet") : (
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                    <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3 text-right">Actions</th></tr>
                  </thead>
                  <tbody>
                    {designations.map(d => (
                      <tr key={d.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-5 py-3 text-white">{d.name}</td>
                        <td className="px-5 py-3 text-right space-x-3">
                          <button onClick={() => setDesigModal({ open: true, item: d })} className="text-indigo-400 hover:text-indigo-300"><PencilIcon className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteDesig(d)} className="text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
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
            <div className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
                <span className="text-sm font-semibold text-white uppercase tracking-wider">Attendance Log</span>
                <button onClick={() => setAttModal(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-indigo-300 transition">
                  <PlusIcon className="h-3.5 w-3.5" /> Log Attendance
                </button>
              </div>
              {attendance.length === 0 ? emptyState("No attendance records yet", false) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                      <tr><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Status</th></tr>
                    </thead>
                    <tbody>
                      {attendance.map(r => (
                        <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-5 py-3">
                            <span className="text-white font-medium">{r.employee_name || "—"}</span>
                            {r.employee_code && <span className="ml-2 text-xs text-gray-500">{r.employee_code}</span>}
                          </td>
                          <td className="px-5 py-3">{r.date}</td>
                          <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[r.status] || "bg-white/10 text-white"}`}>{r.status?.replace("_", " ")}</span></td>
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
            <div className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
                <span className="text-sm font-semibold text-white uppercase tracking-wider">Leave Applications</span>
                <button onClick={() => setLeaveModal(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-indigo-300 transition">
                  <PlusIcon className="h-3.5 w-3.5" /> Apply for Leave
                </button>
              </div>
              {leaves.length === 0 ? emptyState("No leave applications yet", false) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                      <tr><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Duration</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr>
                    </thead>
                    <tbody>
                      {leaves.map(l => (
                        <tr key={l.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-5 py-3 text-white font-medium">{l.employee_name || l.employee}</td>
                          <td className="px-5 py-3">
                            <div className="font-medium">{l.leave_type_name || l.leave_type}</div>
                            {l.reason && <div className="text-xs text-gray-500 mt-1 max-w-xs break-words" title={l.reason}>{l.reason}</div>}
                          </td>
                          <td className="px-5 py-3">{l.start_date} → {l.end_date}<br /><span className="text-xs text-gray-500">{l.computed_days} days</span></td>
                          <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${LEAVE_COLORS[l.status] || "bg-white/10 text-white"}`}>{l.status}</span></td>
                          <td className="px-5 py-3 text-right space-x-2">
                            {l.status === "pending" && (<>
                              <button onClick={() => handleApproveLeave(l.id)} className="p-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20"><CheckIcon className="w-4 h-4" /></button>
                              <button onClick={() => handleRejectLeave(l.id)} className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"><XMarkIcon className="w-4 h-4" /></button>
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
            <div className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
                <span className="text-sm font-semibold text-white uppercase tracking-wider">Assigned Tasks</span>
                <button onClick={() => setTaskModal(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-indigo-300 transition">
                  <PlusIcon className="h-3.5 w-3.5" /> Assign Task
                </button>
              </div>
              {tasks.length === 0 ? emptyState("No tasks assigned yet", false) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                      <tr><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Title</th><th className="px-5 py-3">Deadline</th><th className="px-5 py-3">Status</th></tr>
                    </thead>
                    <tbody>
                      {tasks.map(t => {
                        const isOverdue = t.status !== 'completed' && t.deadline && new Date(t.deadline) < new Date(new Date().setHours(0,0,0,0));
                        return (
                          <tr key={t.id} onClick={() => setSelectedTask(t)} className={`border-b border-white/5 hover:bg-white/10 cursor-pointer transition ${isOverdue ? 'bg-red-500/5 hover:bg-red-500/10' : ''}`}>
                            <td className="px-5 py-3 text-white font-medium">{employees.find(e => e.id === t.employee)?.full_name || "—"}</td>
                            <td className="px-5 py-3 font-semibold text-white">{t.title}</td>
                            <td className="px-5 py-3 font-mono text-xs">
                              {t.deadline ? (
                                <span className={`px-2 py-0.5 rounded ${isOverdue ? 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30' : 'text-indigo-300'}`}>
                                  {t.deadline} {isOverdue && "(OVERDUE)"}
                                </span>
                              ) : (
                                "No deadline"
                              )}
                            </td>
                            <td className="px-5 py-3 capitalize">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${t.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : t.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-yellow-500/10 text-yellow-400'}`}>
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
            <div className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
                <span className="text-sm font-semibold text-white uppercase tracking-wider">Employee Queries</span>
              </div>
              {queries.length === 0 ? emptyState("No queries found", false) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                      <tr><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Message</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr>
                    </thead>
                    <tbody>
                      {queries.map(q => (
                        <tr key={q.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-5 py-3 text-white font-medium">{employees.find(e => e.id === q.employee)?.full_name || "—"}</td>
                          <td className="px-5 py-3">{q.subject}</td>
                          <td className="px-5 py-3 max-w-xs truncate">{q.message}</td>
                          <td className="px-5 py-3 capitalize">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${q.status === 'resolved' ? 'bg-green-500/10 text-green-400' : q.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right space-x-2">
                            {q.status === 'pending' && (
                              <>
                                <button onClick={() => handleResolveQuery(q.id)} className="p-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20"><CheckIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleRejectQuery(q.id)} className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"><XMarkIcon className="w-4 h-4" /></button>
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
            <div className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
                <span className="text-sm font-semibold text-white uppercase tracking-wider">Broadcast & Announcements</span>
                <button onClick={() => setNotificationModal(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-indigo-300 transition">
                  <PlusIcon className="h-3.5 w-3.5" /> Send Notification
                </button>
              </div>
              {notifications.length === 0 ? emptyState("No notifications sent yet", false) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
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
                        <tr key={n.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-5 py-3 text-indigo-300 font-medium">{n.employee_name || "All Employees (Broadcast)"}</td>
                          <td className="px-5 py-3 text-white font-medium">{n.title}</td>
                          <td className="px-5 py-3 max-w-sm truncate" title={n.message}>{n.message}</td>
                          <td className="px-5 py-3 text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</td>
                          <td className="px-5 py-3 text-right">
                            <button onClick={() => handleDeleteNotification(n.id)} className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition" title="Delete Notification">
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
      <LeaveModal isOpen={leaveModal} onClose={() => setLeaveModal(false)} onSuccess={fetchAll} employees={employees} leaveTypes={leaveTypes} />
      <TaskModal isOpen={taskModal} onClose={() => { setTaskModal(false); setTaskToEdit(null); }} onSuccess={fetchAll} employees={employees} task={taskToEdit} />
      <TaskDetailsModal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} task={selectedTask} employees={employees} onEdit={(t) => { setTaskToEdit(t); setTaskModal(true); }} onDelete={handleDeleteTask} />
      <NotificationModal isOpen={notificationModal} onClose={() => setNotificationModal(false)} onSuccess={fetchAll} employees={employees} />
      <SalaryIncrementModal isOpen={incrementModal.open} onClose={() => setIncrementModal({ open: false, employee: null })} onSuccess={fetchAll} employee={incrementModal.employee} />
    </>
  );
}
