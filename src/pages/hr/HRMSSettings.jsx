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

  const ic = "w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";
  const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1";

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-muted)]">
        Loading HRMS settings...
      </div>
    );
  }

  return (
    <div className="relative p-6 md:p-10 space-y-8 animate-fade-up max-w-5xl mx-auto">
      {/* Header */}
      <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 md:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)] mb-2 font-semibold">Configuration</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
              <AdjustmentsHorizontalIcon className="w-9 h-9 text-[var(--accent-primary)]" />
              HRMS & Payroll Settings
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-2">
              Configure LOP proration rules, overtime rate multipliers, and statutory contribution ceilings.
            </p>
          </div>
        </div>
      </section>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Payroll & LOP Calculation */}
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-3">
            Payroll & LOP Calculation Rules
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div>
              <label className={labelCls}>Weekend / Off Days</label>
              <select name="weekend_rule" value={settings.weekend_rule || 'sunday_only'} onChange={handleChange} className={ic}>
                <option value="sunday_only">Sunday Only (6-Day Work Week)</option>
                <option value="sat_sun">Saturday & Sunday (5-Day Work Week)</option>
              </select>
            </div>

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <div>
              <label className={labelCls}>Loss of Pay (LOP) Formula Base</label>
              <select name="lop_calculation_rule" value={settings.lop_calculation_rule || 'working_days'} onChange={handleChange} className={ic}>
                <option value="working_days">Working Days (Dynamic per Weekend Rule)</option>
                <option value="working_days_5">5-Day Work Week (Always Exclude Sat & Sun)</option>
                <option value="calendar_days">Total Calendar Days in Month (28-31)</option>
                <option value="fixed_30">Fixed 30 Days Standard</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Overtime Pay Multiplier</label>
              <input type="number" step="0.1" name="overtime_multiplier" value={settings.overtime_multiplier} onChange={handleChange} className={ic} />
            </div>

            <div>
              <label className={labelCls}>Net Salary Rounding</label>
              <select name="salary_rounding" value={settings.salary_rounding || 'nearest_one'} onChange={handleChange} className={ic}>
                <option value="nearest_one">Nearest ₹1 (Standard)</option>
                <option value="nearest_ten">Nearest ₹10</option>
                <option value="exact">Exact 2 Decimals (No Rounding)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="allow_negative_salary" checked={settings.allow_negative_salary} onChange={handleChange} className="w-4 h-4 rounded text-[var(--accent-primary)] bg-[var(--bg-primary)] border-[var(--border-subtle)] focus:ring-0" />
              <span className="text-sm text-[var(--text-primary)]">Allow negative net salary when deductions exceed gross earnings</span>
            </label>
          </div>
        </div>

        {/* Section 2: Statutory Contribution Rates */}
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-3">
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
                <input type="checkbox" name="pf_apply_ceiling" checked={settings.pf_apply_ceiling} onChange={handleChange} className="w-4 h-4 rounded text-[var(--accent-primary)] bg-[var(--bg-primary)] border-[var(--border-subtle)] focus:ring-0" />
                <span className="text-sm text-[var(--text-primary)]">Cap PF deduction at wage ceiling (₹15,000 max basic)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-[var(--border-subtle)]">
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

        {/* Section 3: Recruitment & Onboarding Communications */}
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-3">
            Onboarding & Offer Letter Automation
          </h2>

          <div className="p-4 rounded-2xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Automatic Offer Letter on Employee Onboarding</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xl">
                When enabled, an official corporate employment offer letter will automatically be emailed to newly created employees with their position, terms, and compensation, sent using your business name.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                name="auto_send_offer_letter"
                checked={!!settings.auto_send_offer_letter}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--border-subtle)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-primary)]"></div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
