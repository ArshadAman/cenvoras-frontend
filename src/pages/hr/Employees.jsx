import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import {
  UserGroupIcon, PlusIcon, PencilIcon, TrashIcon,
  CurrencyRupeeIcon, ClockIcon, XMarkIcon, ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import EmployeeFormModal from "./EmployeeFormModal";

// ─── Salary Increment Modal ──────────────────────────────────────────────────
// ─── Salary Increment Modal ──────────────────────────────────────────────────
function SalaryIncrementModal({ isOpen, onClose, employee, onSuccess }) {
  const [form, setForm] = useState({ new_salary: '', reason: '', effective_date: '' });
  const [currentSalary, setCurrentSalary] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && employee) {
      const initial = parseFloat(employee.current_ctc || 0);
      setCurrentSalary(initial);
      setForm({
        new_salary: '',
        reason: '',
        effective_date: new Date().toISOString().split('T')[0]
      });

      // Proactively fetch latest salary history to ensure freshest data
      hrApi.getSalaryHistories({ employee: employee.id })
        .then(res => {
          const list = res.data?.results || res.data || [];
          if (list.length > 0 && parseFloat(list[0].new_salary) > 0) {
            setCurrentSalary(parseFloat(list[0].new_salary));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, employee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await hrApi.incrementSalary(employee.id, {
        new_salary: form.new_salary,
        reason: form.reason,
        effective_from: form.effective_date,
        effective_date: form.effective_date,
      });
      toast.success(`Salary revision logged for ${employee.full_name}`);
      onSuccess();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Failed to update salary';
      if (typeof data === 'string') {
        msg = data;
      } else if (data?.error) {
        msg = data.error;
      } else if (data?.detail) {
        msg = data.detail;
      } else if (Array.isArray(data)) {
        msg = data[0];
      } else if (data && typeof data === 'object') {
        msg = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
          .join('; ');
      } else if (err.message) {
        msg = err.message;
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !employee) return null;
  const ic = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500";
  const numNew = parseFloat(form.new_salary || 0);
  const diff = currentSalary > 0 && numNew > 0 ? numNew - currentSalary : 0;
  const diffPct = currentSalary > 0 && numNew > 0 ? ((diff / currentSalary) * 100).toFixed(1) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Salary Revision</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-400">{employee.full_name} ({employee.employee_code})</p>
              {currentSalary > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Current: ₹{currentSalary.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Current vs Proposed Salary Card */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-gray-400 block">Current Monthly CTC</span>
              <span className="text-base font-bold text-white">
                {currentSalary > 0 ? `₹${currentSalary.toLocaleString('en-IN')}` : 'Not Assigned (₹0.00)'}
              </span>
            </div>
            {diffPct !== null && diff !== 0 && (
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-gray-400 block">Proposed Change</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  diff > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {diff > 0 ? `+₹${diff.toLocaleString('en-IN')} (+${diffPct}%)` : `-₹${Math.abs(diff).toLocaleString('en-IN')} (${diffPct}%)`}
                </span>
              </div>
            )}
          </div>

          {/* Quick Increment Percentage Buttons */}
          {currentSalary > 0 && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Quick Percentage Increment</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map(pct => {
                  const val = Math.round(currentSalary * (1 + pct / 100));
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setForm(p => ({
                        ...p,
                        new_salary: val,
                        reason: p.reason || `${pct}% annual revision`
                      }))}
                      className="py-1 px-1.5 text-xs font-medium rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition text-center"
                    >
                      +{pct}%
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-300 mb-1">New Monthly Gross CTC (₹) *</label>
            <input
              required
              type="number"
              step="0.01"
              name="new_salary"
              value={form.new_salary}
              onChange={e => setForm(p => ({ ...p, new_salary: e.target.value }))}
              className={ic}
              placeholder={currentSalary > 0 ? `Current: ₹${currentSalary.toLocaleString('en-IN')}` : "e.g. 65000"}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Effective Date *</label>
            <input required type="date" name="effective_date" value={form.effective_date} onChange={e => setForm(p => ({ ...p, effective_date: e.target.value }))} className={ic} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Reason for Revision *</label>
            <textarea required rows={3} name="reason" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} className={ic + ' resize-none'} placeholder="e.g. Annual Appraisal / Promotion" />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 bg-white/5 rounded-xl hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 disabled:opacity-50">
              {saving ? 'Saving...' : 'Apply Revision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Salary History Drawer ──────────────────────────────────────────────────
function SalaryHistoryModal({ isOpen, onClose, employee }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && employee) {
      setLoading(true);
      hrApi.getSalaryHistories({ employee: employee.id })
        .then(res => setHistory(res.data?.results || res.data || []))
        .catch(() => toast.error('Failed to load salary history'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, employee]);

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Salary Revision History</h2>
              <p className="text-xs text-gray-400">{employee.full_name} ({employee.employee_code})</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-center py-8 text-gray-400 text-sm">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">No revisions recorded for this employee.</p>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <div key={item.id} className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Effective: {item.effective_date}</span>
                    <span className="text-xs text-indigo-300 font-medium">{item.approved_by_name ? `Approved by ${item.approved_by_name}` : 'Direct Revision'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 line-through">₹{parseFloat(item.previous_salary).toLocaleString('en-IN')}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-emerald-400 font-bold">₹{parseFloat(item.new_salary).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-xs text-gray-300 pt-1">Reason: {item.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [incrementEmp, setIncrementEmp] = useState(null);
  const [historyEmp, setHistoryEmp] = useState(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getEmployees();
      setEmployees(res.data?.results || res.data);
    } catch (error) {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
                <UserGroupIcon className="w-9 h-9 text-indigo-300" />
                Employees
              </h1>
              <p className="text-white/65 text-sm mt-2">Manage employee profiles, branches, statutory info, and salary revisions.</p>
            </div>

            <button onClick={() => { setSelectedEmployee(null); setIsModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300">
              <PlusIcon className="h-4 w-4" />
              Add Employee
            </button>
          </div>
        </section>

        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Employee Directory</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Department / Branch</th>
                  <th className="px-6 py-4">Designation</th>
                  <th className="px-6 py-4">Monthly CTC</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="px-6 py-4 text-center">Loading...</td></tr>
                ) : employees.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-4 text-center">No employees found</td></tr>
                ) : (
                  employees.map(emp => (
                    <tr key={emp.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">{emp.employee_code}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{emp.full_name}</p>
                          <p className="text-xs text-gray-400">{emp.personal_email || emp.personal_phone || 'No direct contact'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white">{emp.department_name || '—'}</p>
                          <p className="text-xs text-indigo-300">{emp.branch_name || 'Head Office'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{emp.designation_name || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-emerald-400 whitespace-nowrap">
                          {parseFloat(emp.current_ctc || 0) > 0 ? (
                            `₹${parseFloat(emp.current_ctc).toLocaleString('en-IN')}`
                          ) : (
                            <span className="text-gray-500 font-normal text-xs">Not Set</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase ${
                          emp.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          emp.status === 'on_leave' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          title="Revise / Increment Salary"
                          onClick={() => setIncrementEmp(emp)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition inline-flex items-center"
                        >
                          <CurrencyRupeeIcon className="w-4 h-4" />
                        </button>
                        <button
                          title="Salary Revision Audit Trail"
                          onClick={() => setHistoryEmp(emp)}
                          className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition inline-flex items-center"
                        >
                          <ClockIcon className="w-4 h-4" />
                        </button>
                        <button
                          title="Edit Profile"
                          onClick={() => { setSelectedEmployee(emp); setIsModalOpen(true); }}
                          className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition inline-flex items-center"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          title="Delete Employee"
                          onClick={async () => {
                            if(window.confirm(`Are you sure you want to delete ${emp.full_name}?`)) {
                              try {
                                await hrApi.deleteEmployee(emp.id);
                                toast.success('Employee deleted');
                                fetchEmployees();
                              } catch(e){
                                toast.error('Failed to delete employee');
                              }
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition inline-flex items-center"
                        >
                          <TrashIcon className="w-4 h-4" />
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

      <EmployeeFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        employee={selectedEmployee} 
        onSuccess={fetchEmployees} 
      />

      <SalaryIncrementModal
        isOpen={!!incrementEmp}
        onClose={() => setIncrementEmp(null)}
        employee={incrementEmp}
        onSuccess={fetchEmployees}
      />

      <SalaryHistoryModal
        isOpen={!!historyEmp}
        onClose={() => setHistoryEmp(null)}
        employee={historyEmp}
      />
    </>
  );
}
