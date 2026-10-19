import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { PaperAirplaneIcon, PlusIcon, CheckIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import { showErrorToast, showSuccessToast } from "../../utils/toastUtils";

import LeaveTypeModal from "./LeaveTypeModal";

function LeaveApplicationModal({ isOpen, onClose, onSuccess, employees, leaveTypes, onLeaveTypeAdded }) {
  const [form, setForm] = useState({ employee: '', leave_type: '', start_date: '', end_date: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [showAddLeaveType, setShowAddLeaveType] = useState(false);
  const [balances, setBalances] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setForm({ employee: '', leave_type: '', start_date: '', end_date: '', reason: '' });
      setShowAddLeaveType(false);
      hrApi.getLeaveBalances().then(res => setBalances(res.data?.results || res.data || [])).catch(() => {});
    }
  }, [isOpen]);

  const handleChange = (e) => {
    if (e.target.name === 'leave_type' && e.target.value === '__add_new__') {
      setShowAddLeaveType(true);
      return;
    }
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLeaveTypeCreated = (newLt) => {
    if (onLeaveTypeAdded) onLeaveTypeAdded(newLt);
    setForm((prev) => ({ ...prev, leave_type: newLt.id }));
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
      showErrorToast("Paid leave quota is fully exhausted. Additional paid leave cannot be taken.");
      return;
    }
    setSaving(true);
    try {
      await hrApi.createLeaveApplication(form);
      showSuccessToast("Leave application submitted successfully");
      onSuccess();
      onClose();
    } catch (err) {
      showErrorToast(err, "Failed to submit leave application");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = "w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";
  const labelCls = "block text-sm font-medium text-[var(--text-secondary)] mb-1";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/30">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Apply for Leave</h2>
            <button type="button" onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition">
              <XMarkIcon className="w-5 h-5" />
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Leave Type *</label>
                <button
                  type="button"
                  onClick={() => setShowAddLeaveType(true)}
                  className="text-xs text-[var(--accent-primary)] hover:underline font-medium inline-flex items-center gap-1 transition"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              <select required name="leave_type" value={form.leave_type} onChange={handleChange} className={inputCls}>
                <option value="">Select Leave Type</option>
                {leaveTypes.map((lt) => (
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
                    <span className="text-[var(--status-danger)] font-semibold uppercase text-[10px] tracking-wider bg-[var(--status-danger)]/10 px-1.5 py-0.5 rounded border border-[var(--status-danger)]/30">
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
              <textarea name="reason" value={form.reason} onChange={handleChange} rows={3} className={inputCls + " resize-none"} placeholder="State reason for taking leave..." />
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
              <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl hover:text-[var(--text-primary)] transition">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || isQuotaExhausted}
                className="btn-primary px-5 py-2 text-sm font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Submitting...' : isQuotaExhausted ? 'Quota Exhausted' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <LeaveTypeModal
        isOpen={showAddLeaveType}
        onClose={() => setShowAddLeaveType(false)}
        onSuccess={handleLeaveTypeCreated}
      />
    </>
  );
}

// ─── Leave Request Details Modal ───────────────────────────────────────────────
function LeaveDetailsModal({ isOpen, onClose, application, onApprove, onReject }) {
  if (!isOpen || !application) return null;

  const STATUS_STYLES = {
    pending: 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border-[var(--status-warning)]/30',
    approved: 'bg-[var(--status-success)]/15 text-[var(--status-success)] border-[var(--status-success)]/30',
    rejected: 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border-[var(--status-danger)]/30',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)]">
              <PaperAirplaneIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Leave Application Details</h2>
              <p className="text-xs text-[var(--text-muted)]">Review employee leave request, reason, and approval status</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Employee & Status Card */}
          <div className="p-4 rounded-xl bg-[var(--bg-primary)]/60 border border-[var(--border-subtle)] flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">{application.employee_name || application.employee}</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Leave Type: <span className="font-semibold text-[var(--accent-primary)]">{application.leave_type_name || application.leave_type}</span>
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${STATUS_STYLES[application.status] || 'bg-[var(--bg-primary)] text-[var(--text-muted)]'}`}>
              {application.status}
            </span>
          </div>

          {/* Duration & Impact Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)]">
              <p className="text-[11px] text-[var(--text-muted)]">Start Date</p>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">{application.start_date}</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)]">
              <p className="text-[11px] text-[var(--text-muted)]">End Date</p>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">{application.end_date}</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 col-span-2 sm:col-span-1">
              <p className="text-[11px] text-[var(--accent-primary)] font-semibold">Total Duration</p>
              <p className="text-sm font-bold text-[var(--accent-primary)] mt-1">{application.computed_days} Days</p>
            </div>
          </div>

          {/* Excess / LWP notice */}
          {parseFloat(application.lwp_days || 0) > 0 && (
            <div className="p-3 rounded-xl bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30 text-xs text-[var(--status-warning)] flex items-start gap-2">
              <span className="font-bold">⚠️ Loss of Pay (LOP):</span>
              <span>{application.lwp_days} of these days exceed the available quota and will be deducted as unpaid leave.</span>
            </div>
          )}

          {/* Stated Reason */}
          <div className="p-4 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Stated Reason</h4>
              <span className="text-[11px] text-[var(--text-muted)]">Submitted by employee</span>
            </div>
            {application.reason ? (
              <p className="text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-subtle)] leading-relaxed whitespace-pre-wrap">
                {application.reason}
              </p>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-subtle)]">No reason specified for this application.</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl transition"
          >
            Close
          </button>
          {application.status === 'pending' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onReject(application.id);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-[var(--status-danger)] bg-[var(--status-danger)]/10 hover:bg-[var(--status-danger)]/20 border border-[var(--status-danger)]/30 rounded-xl transition inline-flex items-center gap-1.5"
              >
                <XMarkIcon className="w-4 h-4" /> Reject Leave
              </button>
              <button
                type="button"
                onClick={() => {
                  onApprove(application.id);
                  onClose();
                }}
                className="btn-primary px-4 py-2 text-xs font-semibold rounded-xl transition inline-flex items-center gap-1.5 shadow-sm"
              >
                <CheckIcon className="w-4 h-4" /> Approve Leave
              </button>
            </div>
          )}
        </div>
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
  const [selectedLeave, setSelectedLeave] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getLeaveApplications();
      setApplications(res.data?.results || res.data || []);
    } catch (error) {
      showErrorToast(error, "Failed to load leave applications");
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
      showSuccessToast("Leave application approved successfully");
      fetchApplications();
      hrApi.getLeaveBalances().then(() => {}).catch(() => {});
    } catch (error) {
      showErrorToast(error, "Failed to approve leave application");
    }
  };

  const handleReject = async (id) => {
    try {
      await hrApi.rejectLeave(id);
      showSuccessToast("Leave application marked as rejected");
      fetchApplications();
    } catch (error) {
      showErrorToast(error, "Failed to reject leave application");
    }
  };

  const STATUS_COLORS = {
    pending: 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30',
    approved: 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30',
    rejected: 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30',
  };

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent-primary)] mb-2 font-semibold">Leave Management</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                <PaperAirplaneIcon className="w-9 h-9 text-[var(--accent-primary)]" />
                Leave Applications
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">
                Review employee leave reasons, approve or reject requests, and view full details by clicking any request.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition shadow-sm"
            >
              <PlusIcon className="h-4 w-4" />
              Apply for Leave
            </button>
          </div>
        </section>

        <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]/30">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Leave Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[var(--text-secondary)]">
              <thead className="text-xs uppercase bg-[var(--bg-primary)]/60 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Duration & Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-4 text-center text-[var(--text-muted)]">Loading...</td></tr>
                ) : applications.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-[var(--text-muted)]">No leave applications found</td></tr>
                ) : (
                  applications.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedLeave(app)}
                      className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors"
                      title="Click to view full application details and stated reason"
                    >
                      <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                        {app.employee_name || app.employee}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-[var(--text-primary)]">{app.leave_type_name || app.leave_type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-[var(--text-secondary)]">
                            {app.start_date} → {app.end_date} <span className="text-xs text-[var(--accent-primary)] font-medium">({app.computed_days} {parseFloat(app.computed_days) === 1 ? 'day' : 'days'})</span>
                          </p>
                          {app.reason ? (
                            <p className="text-xs text-[var(--text-muted)] italic truncate max-w-xs mt-0.5">
                              “{app.reason}”
                            </p>
                          ) : (
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">No reason stated</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${STATUS_COLORS[app.status] || 'bg-[var(--bg-primary)] text-[var(--text-muted)]'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeave(app);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/25 border border-[var(--accent-primary)]/30 text-xs font-medium inline-flex items-center gap-1 transition"
                          title="View complete reason & details"
                        >
                          <EyeIcon className="w-3.5 h-3.5" /> Details
                        </button>
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(app.id);
                              }}
                              className="p-1.5 rounded-xl bg-[var(--status-success)]/15 text-[var(--status-success)] hover:bg-[var(--status-success)]/25 border border-[var(--status-success)]/30 transition inline-flex items-center"
                              title="Approve Leave"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(app.id);
                              }}
                              className="p-1.5 rounded-xl bg-[var(--status-danger)]/15 text-[var(--status-danger)] hover:bg-[var(--status-danger)]/25 border border-[var(--status-danger)]/30 transition inline-flex items-center"
                              title="Reject Leave"
                            >
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
        onLeaveTypeAdded={(newLt) => setLeaveTypes((prev) => [...prev, newLt])}
      />

      <LeaveDetailsModal
        isOpen={!!selectedLeave}
        onClose={() => setSelectedLeave(null)}
        application={selectedLeave}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}
