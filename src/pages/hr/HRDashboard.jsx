import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import {
  ChartBarIcon, UserGroupIcon, CalendarDaysIcon,
  CurrencyRupeeIcon, BuildingOfficeIcon, BriefcaseIcon,
  ClockIcon, CheckCircleIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

function StatCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md flex items-start gap-4 hover:bg-white/[0.08] transition">
      <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-white truncate">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function HRDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dashRes, empRes, deptRes, leaveRes, attRes] = await Promise.allSettled([
        hrApi.getHRDashboard(),
        hrApi.getEmployees({ status: 'active' }),
        hrApi.getDepartments(),
        hrApi.getLeaveApplications({ status: 'pending' }),
        hrApi.getAttendance(),
      ]);

      if (dashRes.status === 'fulfilled') setMetrics(dashRes.value.data);
      if (empRes.status === 'fulfilled') setEmployees(empRes.value.data?.results || empRes.value.data || []);
      if (deptRes.status === 'fulfilled') setDepartments(deptRes.value.data?.results || deptRes.value.data || []);
      if (leaveRes.status === 'fulfilled') {
        const all = leaveRes.value.data?.results || leaveRes.value.data || [];
        setPendingLeaves(all.filter(l => l.status === 'pending').slice(0, 5));
      }
      if (attRes.status === 'fulfilled') {
        setRecentAttendance((attRes.value.data?.results || attRes.value.data || []).slice(0, 6));
      }
    } catch (e) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const STATUS_COLORS = {
    present: 'bg-green-500/10 text-green-400',
    absent: 'bg-red-500/10 text-red-400',
    half_day: 'bg-yellow-500/10 text-yellow-400',
    leave: 'bg-blue-500/10 text-blue-400',
    holiday: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
      {/* Header */}
      <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">Overview</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
              <ChartBarIcon className="w-9 h-9 text-indigo-300" />
              HR Dashboard
            </h1>
            <p className="text-white/65 text-sm mt-2">Live snapshot of your workforce, attendance, and payroll.</p>
          </div>
          <button
            onClick={fetchAll}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </section>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Loading dashboard...</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              icon={UserGroupIcon}
              iconBg="bg-blue-500/20"
              iconColor="text-blue-400"
              label="Active Employees"
              value={metrics?.total_active_employees ?? employees.length}
              sub={`Across ${departments.length} departments`}
            />
            <StatCard
              icon={CheckCircleIcon}
              iconBg="bg-green-500/20"
              iconColor="text-green-400"
              label="Present Today"
              value={metrics?.present_today ?? 0}
            />
            <StatCard
              icon={CalendarDaysIcon}
              iconBg="bg-orange-500/20"
              iconColor="text-orange-400"
              label="On Leave Today"
              value={metrics?.on_leave_today ?? 0}
              sub={`${pendingLeaves.length} pending approval`}
            />
            <StatCard
              icon={CurrencyRupeeIcon}
              iconBg="bg-indigo-500/20"
              iconColor="text-indigo-400"
              label="Last Payroll Net"
              value={metrics?.last_payroll_net ? `₹${parseFloat(metrics.last_payroll_net).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'N/A'}
              sub="Most recent finalised run"
            />
          </div>

          {/* Departments & Pending Leaves side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Departments */}
            <section className="rounded-3xl border border-white/10 bg-black/25 overflow-hidden backdrop-blur-xl">
              <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-white/[0.02]">
                <BuildingOfficeIcon className="w-4 h-4 text-indigo-300" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Departments</h2>
              </div>
              {departments.length === 0 ? (
                <p className="p-6 text-sm text-gray-400">No departments set up yet.</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {departments.map((dept) => {
                    const count = employees.filter(e => e.department === dept.id).length;
                    return (
                      <li key={dept.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/5 transition">
                        <span className="text-sm text-white">{dept.name}</span>
                        <span className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
                          {count} {count === 1 ? 'employee' : 'employees'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Pending Leaves */}
            <section className="rounded-3xl border border-white/10 bg-black/25 overflow-hidden backdrop-blur-xl">
              <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-white/[0.02]">
                <ClockIcon className="w-4 h-4 text-yellow-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Pending Leave Approvals</h2>
              </div>
              {pendingLeaves.length === 0 ? (
                <p className="p-6 text-sm text-gray-400">No pending leave applications.</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {pendingLeaves.map((leave) => (
                    <li key={leave.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/5 transition">
                      <div>
                        <p className="text-sm text-white">{leave.employee_name || leave.employee}</p>
                        <p className="text-xs text-gray-500">{leave.leave_type_name} · {leave.start_date} → {leave.end_date}</p>
                      </div>
                      <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">{leave.computed_days}d</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Recent Attendance */}
          <section className="rounded-3xl border border-white/10 bg-black/25 overflow-hidden backdrop-blur-xl">
            <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-white/[0.02]">
              <CalendarDaysIcon className="w-4 h-4 text-indigo-300" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Recent Attendance</h2>
            </div>
            {recentAttendance.length === 0 ? (
              <p className="p-6 text-sm text-gray-400">No attendance records yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-3">Employee</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttendance.map((rec) => (
                      <tr key={rec.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-6 py-3">
                          <span className="text-white font-medium">{rec.employee_name || '—'}</span>
                          {rec.employee_code && <span className="ml-2 text-xs text-gray-500">{rec.employee_code}</span>}
                        </td>
                        <td className="px-6 py-3 text-gray-400">{rec.date}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[rec.status] || 'bg-white/10 text-white'}`}>
                            {rec.status?.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
