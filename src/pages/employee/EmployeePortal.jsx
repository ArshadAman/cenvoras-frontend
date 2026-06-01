import React, { useState, useEffect, useCallback } from "react";
import { hrApi } from "../../api/hr";
import { toast } from "react-toastify";
import {
  UserIcon, ClockIcon, CalendarDaysIcon, BriefcaseIcon, 
  ChatBubbleLeftRightIcon, CheckCircleIcon, ArrowPathIcon, PlusIcon
} from '@heroicons/react/24/outline';

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

export default function EmployeePortal() {
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [queries, setQueries] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Forms
  const [leaveForm, setLeaveForm] = useState({ leave_type: "", start_date: "", end_date: "", reason: "" });
  const [queryForm, setQueryForm] = useState({ subject: "", message: "" });
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, attRes, lvRes, ltRes, tskRes, qryRes, nRes] = await Promise.allSettled([
        hrApi.getEmployees(),
        hrApi.getAttendance(),
        hrApi.getLeaveApplications(),
        hrApi.getLeaveTypes(),
        hrApi.getTasks(),
        hrApi.getQueries(),
        hrApi.getNotifications()
      ]);
      
      if (empRes.status === "fulfilled") {
        const emps = empRes.value.data?.results || empRes.value.data || [];
        setProfile(emps[0]); // Assuming backend returns only the logged-in employee's profile
      }
      if (attRes.status === "fulfilled") setAttendance(attRes.value.data?.results || attRes.value.data || []);
      if (lvRes.status === "fulfilled") setLeaves(lvRes.value.data?.results || lvRes.value.data || []);
      if (ltRes.status === "fulfilled") setLeaveTypes(ltRes.value.data?.results || ltRes.value.data || []);
      if (tskRes.status === "fulfilled") setTasks(tskRes.value.data?.results || tskRes.value.data || []);
      if (qryRes.status === "fulfilled") setQueries(qryRes.value.data?.results || qryRes.value.data || []);
      if (nRes.status === "fulfilled") setNotifications(nRes.value.data?.results || nRes.value.data || []);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Backend automatically maps 'employee' to current user if not provided, or we can pass profile.id
      await hrApi.createLeaveApplication({ ...leaveForm, employee: profile?.id });
      toast.success("Leave applied successfully");
      setShowLeaveModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to apply leave");
    } finally {
      setSaving(false);
    }
  };

  const handleRaiseQuery = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await hrApi.createTask({ ...queryForm, type: 'query', employee: profile?.id }); // Assuming queries endpoint
      toast.success("Query raised successfully");
      setShowQueryModal(false);
      fetchAll();
    } catch (err) {
      toast.error("Failed to raise query");
    } finally {
      setSaving(false);
    }
  };

  const handleRaiseQuerySubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await hrApi.createQuery({ ...queryForm, employee: profile?.id });
      toast.success("Query submitted successfully");
      setShowQueryModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit query");
    } finally {
      setSaving(false);
    }
  };
  
  const handleCompleteTask = async (task) => {
    try {
      await hrApi.updateTask(task.id, { ...task, status: 'completed' });
      toast.success("Task marked as completed");
      fetchAll();
    } catch (err) {
      toast.error("Failed to update task");
    }
  };

  if (loading && !profile) {
    return <div className="p-8 text-gray-400">Loading portal...</div>;
  }

  const ic = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500";

  return (
    <>
    <div className="relative p-6 md:p-8 space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-1">Welcome Back</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-3">
            {profile?.full_name || "Employee"} Portal
          </h1>
        </div>
        <button onClick={fetchAll} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BriefcaseIcon} iconBg="bg-indigo-500/20" iconColor="text-indigo-400" label="Total Tasks" value={tasks.length} />
        <StatCard icon={CheckCircleIcon} iconBg="bg-green-500/20" iconColor="text-green-400" label="Completed Tasks" value={tasks.filter(t => t.status === 'completed').length} />
        <StatCard icon={CalendarDaysIcon} iconBg="bg-purple-500/20" iconColor="text-purple-400" label="Total Leaves" value={leaves.length} />
        <StatCard icon={ClockIcon} iconBg="bg-amber-500/20" iconColor="text-amber-400" label="Pending Leaves" value={leaves.filter(l => l.status === 'pending').length} />
      </div>

      {/* Announcements */}
      {notifications.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden animate-fade-up">
          <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-sm font-semibold text-white uppercase tracking-wider">HR Announcements & Broadcasts</span>
          </div>
          <div className="p-5 space-y-4 max-h-[300px] overflow-y-auto divide-y divide-white/5">
            {notifications.map((n, idx) => (
              <div key={n.id} className="pt-4 first:pt-0">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-base font-semibold text-indigo-300">{n.title}</h3>
                  <span className="text-xs text-gray-500">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEAVES */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-white">Leave Applications</h2>
              <button onClick={() => setShowLeaveModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition">
                <PlusIcon className="w-4 h-4" /> Apply Leave
              </button>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
              {leaves.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No leave applications found.</div>
              ) : (
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                    <tr><th className="px-5 py-3">Type</th><th className="px-5 py-3">Duration</th><th className="px-5 py-3">Status</th></tr>
                  </thead>
                  <tbody>
                    {leaves.map(l => (
                      <tr key={l.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-5 py-3">
                          <div className="font-medium text-white">{l.leave_type_name || l.leave_type}</div>
                          {l.reason && <div className="text-xs text-gray-500 mt-1 max-w-xs break-words" title={l.reason}>{l.reason}</div>}
                        </td>
                        <td className="px-5 py-3">{l.start_date} to {l.end_date}</td>
                        <td className="px-5 py-3 capitalize">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            l.status === 'approved' ? 'bg-green-500/10 text-green-400' : 
                            l.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 
                            'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        {/* TASKS */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center">
                <span className="text-sm font-semibold text-white uppercase tracking-wider">My Assigned Tasks</span>
              </div>
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No tasks assigned to you.</div>
              ) : (
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                    <tr><th className="px-5 py-3">Title</th><th className="px-5 py-3">Description</th><th className="px-5 py-3">Deadline</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-5 py-3 font-medium text-white">{t.title}</td>
                        <td className="px-5 py-3 max-w-xs truncate">{t.description}</td>
                        <td className="px-5 py-3 text-indigo-300 font-mono text-xs">{t.deadline || "No deadline"}</td>
                        <td className="px-5 py-3 capitalize">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            t.status === 'completed' ? 'bg-green-500/10 text-green-400' : 
                            'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {t.status !== 'completed' && (
                            <button onClick={() => handleCompleteTask(t)} className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-500/30">
                              Mark Done
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        {/* QUERIES */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-white">HR Queries</h2>
              <button onClick={() => setShowQueryModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition">
                <PlusIcon className="w-4 h-4" /> Raise Query
              </button>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
              {queries.length === 0 ? (
                <div className="p-8 text-center text-gray-400">You have not raised any queries yet.</div>
              ) : (
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                    <tr><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Message</th><th className="px-5 py-3">Status</th></tr>
                  </thead>
                  <tbody>
                    {queries.map(q => (
                      <tr key={q.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-5 py-3 font-medium text-white">{q.subject}</td>
                        <td className="px-5 py-3 max-w-sm truncate">{q.message}</td>
                        <td className="px-5 py-3 capitalize">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            q.status === 'resolved' ? 'bg-green-500/10 text-green-400' : 
                            q.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 
                            'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {q.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        {/* ATTENDANCE */}
        <div className="space-y-6">
          <div className="flex justify-between items-center h-9">
            <h2 className="text-lg font-medium text-white">Attendance History</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
            {attendance.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No attendance records found.</div>
            ) : (
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                  <tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Status</th></tr>
                </thead>
                <tbody>
                  {attendance.map(a => (
                    <tr key={a.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-5 py-3">{a.date}</td>
                      <td className="px-5 py-3 capitalize">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${a.status === 'present' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {a.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* LEAVE MODAL */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Apply for Leave</h2>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Leave Type *</label>
                <select required value={leaveForm.leave_type} onChange={(e) => setLeaveForm({...leaveForm, leave_type: e.target.value})} className={ic}>
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Start Date *</label>
                  <input required type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm({...leaveForm, start_date: e.target.value})} className={ic} />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">End Date *</label>
                  <input required type="date" value={leaveForm.end_date} onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})} className={ic} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Reason</label>
                <textarea value={leaveForm.reason} onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})} rows={2} className={ic + " resize-none"} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowLeaveModal(false)} className="px-4 py-2 text-sm text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 disabled:opacity-50">{saving ? "Submitting..." : "Apply"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUERY MODAL */}
      {showQueryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Raise HR Query</h2>
            <form onSubmit={handleRaiseQuerySubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Subject *</label>
                <input required type="text" value={queryForm.subject} onChange={(e) => setQueryForm({...queryForm, subject: e.target.value})} className={ic} placeholder="e.g. Salary Discrepancy" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Message *</label>
                <textarea required value={queryForm.message} onChange={(e) => setQueryForm({...queryForm, message: e.target.value})} rows={4} className={ic + " resize-none"} placeholder="Describe your query..." />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowQueryModal(false)} className="px-4 py-2 text-sm text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 disabled:opacity-50">{saving ? "Submitting..." : "Submit"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
