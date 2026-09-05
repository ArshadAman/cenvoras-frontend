import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import {
  AdjustmentsHorizontalIcon, CheckBadgeIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

export default function HRMSSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getHRMSSettings();
      setSettings(res.data);
    } catch (err) {
      toast.error("Failed to load HRMS configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await hrApi.updateHRMSSettings(settings);
      toast.success("HRMS settings updated successfully");
      fetchSettings();
    } catch (err) {
      toast.error("Failed to update HRMS settings");
    } finally {
      setSaving(false);
    }
  };

  const ic = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500";
  const labelCls = "block text-sm font-medium text-gray-300 mb-1";

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        Loading HRMS settings...
      </div>
    );
  }

  return (
    <div className="relative p-6 md:p-10 space-y-8 animate-fade-up max-w-5xl mx-auto">
      {/* Header */}
      <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/40 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">Configuration</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
              <AdjustmentsHorizontalIcon className="w-9 h-9 text-indigo-300" />
              HRMS & Payroll Settings
            </h1>
            <p className="text-white/65 text-sm mt-2">
              Configure LOP proration rules, overtime rate multipliers, and statutory contribution ceilings.
            </p>
          </div>
        </div>
      </section>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Payroll & LOP Calculation */}
        <div className="rounded-3xl border border-white/10 bg-black/25 p-6 backdrop-blur-xl space-y-4">
          <h2 className="text-base font-semibold text-white uppercase tracking-wider border-b border-white/10 pb-3">
            Payroll & LOP Calculation Rules
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelCls}>Payroll Frequency</label>
              <select name="payroll_frequency" value={settings.payroll_frequency} onChange={handleChange} className={ic}>
                <option value="monthly">Monthly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Payroll Cutoff Day</label>
              <input type="number" min="1" max="31" name="payroll_cutoff_day" value={settings.payroll_cutoff_day} onChange={handleChange} className={ic} />
            </div>

            <div>
              <label className={labelCls}>Default Working Days</label>
              <input type="number" min="15" max="31" name="default_working_days" value={settings.default_working_days} onChange={handleChange} className={ic} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div>
              <label className={labelCls}>Loss of Pay (LOP) Formula Base</label>
              <select name="lop_calculation_rule" value={settings.lop_calculation_rule} onChange={handleChange} className={ic}>
                <option value="working_days">Working Days (Excluding Sundays)</option>
                <option value="calendar_days">Total Calendar Days in Month (28-31)</option>
                <option value="fixed_30">Fixed 30 Days Standard</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Overtime Pay Multiplier</label>
              <input type="number" step="0.1" name="overtime_multiplier" value={settings.overtime_multiplier} onChange={handleChange} className={ic} />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="allow_negative_salary" checked={settings.allow_negative_salary} onChange={handleChange} className="w-4 h-4 rounded text-indigo-500 bg-white/5 border-white/20" />
              <span className="text-sm text-gray-300">Allow negative net salary when deductions exceed gross earnings</span>
            </label>
          </div>
        </div>

        {/* Section 2: Statutory Contribution Rates */}
        <div className="rounded-3xl border border-white/10 bg-black/25 p-6 backdrop-blur-xl space-y-4">
          <h2 className="text-base font-semibold text-white uppercase tracking-wider border-b border-white/10 pb-3">
            Statutory Rates (Provident Fund & ESI)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Employee PF Rate (%)</label>
              <input type="number" step="0.01" name="pf_employee_rate" value={settings.pf_employee_rate} onChange={handleChange} className={ic} />
            </div>
            <div>
              <label className={labelCls}>Employer PF Rate (%)</label>
              <input type="number" step="0.01" name="pf_employer_rate" value={settings.pf_employer_rate} onChange={handleChange} className={ic} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>PF Statutory Wage Ceiling (₹)</label>
              <input type="number" step="100" name="pf_wage_ceiling" value={settings.pf_wage_ceiling} onChange={handleChange} className={ic} />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="pf_apply_ceiling" checked={settings.pf_apply_ceiling} onChange={handleChange} className="w-4 h-4 rounded text-indigo-500 bg-white/5 border-white/20" />
                <span className="text-sm text-gray-300">Cap PF deduction at wage ceiling (₹15,000 max basic)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-white/10">
            <div>
              <label className={labelCls}>Employee ESI Rate (%)</label>
              <input type="number" step="0.01" name="esi_employee_rate" value={settings.esi_employee_rate} onChange={handleChange} className={ic} />
            </div>
            <div>
              <label className={labelCls}>Employer ESI Rate (%)</label>
              <input type="number" step="0.01" name="esi_employer_rate" value={settings.esi_employer_rate} onChange={handleChange} className={ic} />
            </div>
            <div>
              <label className={labelCls}>ESI Wage Threshold (₹)</label>
              <input type="number" step="100" name="esi_wage_ceiling" value={settings.esi_wage_ceiling} onChange={handleChange} className={ic} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-semibold text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 shadow-lg shadow-indigo-500/20 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
