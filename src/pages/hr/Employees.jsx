import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import {
  UserGroupIcon, PlusIcon, PencilIcon, TrashIcon,
  CurrencyRupeeIcon, ClockIcon, XMarkIcon, ArrowTrendingUpIcon,
  EyeIcon, InformationCircleIcon, CalculatorIcon
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import EmployeeFormModal from "./EmployeeFormModal";
import SalaryBreakdownCalculator from "../../components/hr/SalaryBreakdownCalculator";
import { getTodayKolkata } from "../../utils/date";

// ─── Salary Increment Modal ──────────────────────────────────────────────────
function SalaryIncrementModal({ isOpen, onClose, employee, onSuccess }) {
  const [form, setForm] = useState({ new_salary: '', reason: '', effective_date: '' });
  const [currentSalary, setCurrentSalary] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen && employee) {
      const initial = parseFloat(employee.current_ctc || 0);
      setCurrentSalary(initial);
      setForm({
        new_salary: '',
        reason: '',
        effective_date: getTodayKolkata()
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
  const ic = "w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";
  const numNew = parseFloat(form.new_salary || 0);
  const diff = currentSalary > 0 && numNew > 0 ? numNew - currentSalary : 0;
  const diffPct = currentSalary > 0 && numNew > 0 ? ((diff / currentSalary) * 100).toFixed(1) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-2xl shadow-2xl my-8">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Salary Revision & Tax Impact</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-[var(--text-muted)]">{employee.full_name} ({employee.employee_code})</p>
              {currentSalary > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30 font-semibold">
                  Current: ₹{currentSalary.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Current vs Proposed Salary Card */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)] flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] block">Current Monthly CTC</span>
              <span className="text-base font-bold text-[var(--text-primary)]">
                {currentSalary > 0 ? `₹${currentSalary.toLocaleString('en-IN')}` : 'Not Assigned (₹0.00)'}
              </span>
            </div>
            {diffPct !== null && diff !== 0 && (
              <div className="text-right">
                <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] block">Proposed Change</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  diff > 0 ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30' : 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30'
                }`}>
                  {diff > 0 ? `+₹${diff.toLocaleString('en-IN')} (+${diffPct}%)` : `-₹${Math.abs(diff).toLocaleString('en-IN')} (${diffPct}%)`}
                </span>
              </div>
            )}
          </div>

          {/* Quick Increment Percentage Buttons */}
          {currentSalary > 0 && (
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">Quick Percentage Increment</label>
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
                      className="py-1 px-1.5 text-xs font-medium rounded-lg bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 transition text-center"
                    >
                      +{pct}%
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">New Monthly Gross CTC (₹) *</label>
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
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Effective Date *</label>
              <input required type="date" name="effective_date" value={form.effective_date} onChange={e => setForm(p => ({ ...p, effective_date: e.target.value }))} className={ic} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Reason for Revision *</label>
            <textarea required rows={2} name="reason" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} className={ic + ' resize-none'} placeholder="e.g. Annual Appraisal / Promotion" />
          </div>

          {/* Interactive Live Breakdown Preview */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-1.5"
            >
              <CalculatorIcon className="w-4 h-4" />
              {showPreview ? 'Hide Salary & TDS Impact Breakdown' : 'Preview Detailed Salary & TDS Breakdown →'}
            </button>

            {showPreview && numNew > 0 && (
              <div className="mt-3 p-3 bg-[var(--bg-primary)]/30 border border-[var(--border-subtle)] rounded-xl">
                <SalaryBreakdownCalculator
                  initialMonthlyCtc={numNew}
                  initialTaxRegime={employee.tax_regime || 'new'}
                  initialWorkState={employee.work_state || ''}
                  onChange={(calc) => {
                    // sync changes if user adjusts inside calculator
                  }}
                />
              </div>
            )}
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm rounded-xl">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm font-semibold rounded-xl disabled:opacity-50">
              {saving ? 'Saving...' : 'Apply Revision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Salary Breakdown Modal ──────────────────────────────────────────────────
function SalaryBreakdownModal({ isOpen, onClose, employee }) {
  if (!isOpen || !employee) return null;
  const [loading, setLoading] = useState(false);
  const [computedDetails, setComputedDetails] = useState(employee.salary_details || null);

  useEffect(() => {
    if (isOpen && employee) {
      if (employee.salary_details) {
        setComputedDetails(employee.salary_details);
      } else if (parseFloat(employee.current_ctc || 0) > 0) {
        setLoading(true);
        const monthly = parseFloat(employee.current_ctc);
        const basic = Math.round(monthly * 0.5 * 100) / 100;
        const hra = Math.round(basic * 0.5 * 100) / 100;
        const special = Math.max(0, Math.round((monthly - (basic + hra)) * 100) / 100);
        hrApi.calculateSalaryBreakdown({
          monthly_ctc: monthly,
          tax_regime: employee.tax_regime || 'new',
          work_state: employee.work_state || '',
          components: {
            Basic: basic,
            HRA: hra,
            'Special Allowance': special,
          }
        }).then(res => {
          setComputedDetails(res.data);
        }).catch(() => {}).finally(() => setLoading(false));
      } else {
        setComputedDetails(null);
      }
    }
  }, [isOpen, employee]);

  const sd = computedDetails;
  const formatInr = (val, decimals = 2) => {
    const n = Number(val);
    if (isNaN(n) || !isFinite(n)) return '0.00';
    return n.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const monthlyNet = (sd && !isNaN(Number(sd.monthly_net_take_home || sd.net_take_home_monthly)))
    ? Number(sd.monthly_net_take_home || sd.net_take_home_monthly)
    : 0;
  const annualNet = (sd && !isNaN(Number(sd.annual_net_take_home || sd.net_take_home_annual)))
    ? Number(sd.annual_net_take_home || sd.net_take_home_annual)
    : monthlyNet * 12;
  const monthlyGross = (sd && !isNaN(Number(sd.monthly_gross || sd.gross_salary)))
    ? Number(sd.monthly_gross || sd.gross_salary)
    : 0;
  const annualGross = (sd && !isNaN(Number(sd.annual_ctc || sd.annual_gross)))
    ? Number(sd.annual_ctc || sd.annual_gross)
    : monthlyGross * 12;
  const projectedAnnualGross = Number(sd?.tds_details?.projected_annual_gross || sd?.projected_annual_gross || 0);
  const totalDeductions = Number(sd?.employee_deductions?.total_deductions || 0);
  const monthlyTds = Number(sd?.tds_details?.monthly_tds || 0);
  const employeePf = Number(sd?.employee_deductions?.employee_pf || 0);
  const employeeEsi = Number(sd?.employee_deductions?.employee_esi || 0);
  const pt = Number(sd?.employee_deductions?.professional_tax || 0);
  const annualNetTax = Number(sd?.tds_details?.annual_net_tax || sd?.tds_details?.annual_tax || 0);
  // Only show 87A Nil when backend engine sets the flag — never infer from rebate alone
  const nilTax87a = Boolean(sd?.tds_details?.nil_tax_87a);
  const marginalRelief = Boolean(sd?.tds_details?.marginal_relief);
  const tdsReason = sd?.tds_details?.reason || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Salary Breakdown & Tax Projection</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase border ${
                employee.tax_regime === 'old'
                  ? 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border-[var(--status-warning)]/30'
                  : 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/30'
              }`}>
                {employee.tax_regime === 'old' ? 'Old Regime' : 'New Regime (Default)'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{employee.full_name} ({employee.employee_code}) • {employee.designation_name || 'Staff'}</p>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              Calculating salary breakdown and tax liability...
            </div>
          ) : !sd ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              No active salary assignment configured for this employee.
            </div>
          ) : (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[var(--status-success)]/10 border border-[var(--status-success)]/25 text-[var(--text-primary)]">
                  <span className="text-xs uppercase font-bold tracking-wider text-[var(--status-success)] block">Monthly Take-Home</span>
                  <span className="text-xl font-bold text-[var(--status-success)]">
                    ₹{formatInr(monthlyNet)}
                  </span>
                  <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                    Annual: ₹{formatInr(annualNet, 0)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)] text-[var(--text-primary)]">
                  <span className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] block">Monthly CTC / Gross</span>
                  <span className="text-xl font-bold text-[var(--text-primary)]">
                    ₹{formatInr(monthlyGross)}
                  </span>
                  <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                    Annual CTC: ₹{formatInr(annualGross, 0)}
                    {projectedAnnualGross > 0 && projectedAnnualGross !== annualGross && (
                      <> · FY projected: ₹{formatInr(projectedAnnualGross, 0)}</>
                    )}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)] text-[var(--text-primary)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] block">Monthly Deductions</span>
                    {nilTax87a && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--status-success)]/20 text-[var(--status-success)] font-medium">87A Nil Tax</span>
                    )}
                    {marginalRelief && !nilTax87a && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--status-warning)]/20 text-[var(--status-warning)] font-medium">87A Marginal Relief</span>
                    )}
                  </div>
                  <span className="text-xl font-bold text-[var(--status-danger)]">
                    -₹{formatInr(totalDeductions)}
                  </span>
                  <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                    TDS: ₹{formatInr(monthlyTds, 0)}
                  </span>
                </div>
              </div>

              {/* TDS Projection Details */}
              <div className="p-3.5 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-xs text-[var(--accent-primary)] space-y-1">
                <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <InformationCircleIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                  Statutory TDS Withholding Rationale (Sec 192)
                </div>
                <div className="text-[var(--text-secondary)]">{tdsReason || 'Calculated based on projected annual gross liability.'}</div>
                <div className="text-xs text-[var(--text-muted)] pt-1">
                  Projected Annual Tax: ₹{formatInr(annualNetTax, 0)} | Tax Regime: {employee.tax_regime === 'old' ? 'OLD REGIME' : 'NEW REGIME'}
                </div>
              </div>

              {/* Itemized Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="bg-[var(--bg-primary)]/30 border border-[var(--border-subtle)] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">Earnings Breakdown</span>
                    <span className="text-xs text-[var(--text-muted)]">Monthly</span>
                  </div>
                  {(() => {
                    const seen = new Set();
                    const entries = [];
                    for (const [comp, val] of Object.entries(sd.earnings || {})) {
                      const norm = comp.toLowerCase().replace(/_/g, ' ').trim();
                      if (seen.has(norm)) continue;
                      seen.add(norm);

                      let displayName = comp;
                      if (norm === 'basic') displayName = 'Basic';
                      else if (norm === 'hra') displayName = 'HRA';
                      else if (norm === 'da') displayName = 'DA';
                      else if (norm === 'special allowance') displayName = 'Special Allowance';

                      entries.push({ comp: displayName, val });
                    }
                    return entries.map(({ comp, val }) => (
                      <div key={comp} className="flex justify-between text-xs py-1 border-b border-[var(--border-subtle)]">
                        <span className={comp.startsWith('[Ad-hoc]') || comp.startsWith('[Variable]') ? 'text-[var(--status-success)] font-medium' : 'text-[var(--text-muted)]'}>
                          {comp}
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">₹{formatInr(val)}</span>
                      </div>
                    ));
                  })()}
                  <div className="flex justify-between text-xs pt-2 font-bold text-[var(--accent-primary)]">
                    <span>Total Gross</span>
                    <span>₹{formatInr(monthlyGross)}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-[var(--bg-primary)]/30 border border-[var(--border-subtle)] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">Deductions Breakdown</span>
                    <span className="text-xs text-[var(--text-muted)]">Monthly</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Provident Fund (PF)</span>
                    <span className="font-medium text-[var(--text-primary)]">₹{formatInr(employeePf)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Employee ESI</span>
                    <span className="font-medium text-[var(--text-primary)]">₹{formatInr(employeeEsi)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Professional Tax (PT)</span>
                    <span className="font-medium text-[var(--text-primary)]">₹{formatInr(pt)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Income Tax (TDS)</span>
                    <span className="font-medium text-[var(--status-danger)]">₹{formatInr(monthlyTds)}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 font-bold text-[var(--status-danger)]">
                    <span>Total Deductions</span>
                    <span>-₹{formatInr(totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-[var(--border-subtle)] flex justify-end bg-[var(--bg-primary)]/20">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-4 py-2 text-sm rounded-xl"
          >
            Close
          </button>
        </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-[var(--accent-primary)]" />
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Salary Revision History</h2>
              <p className="text-xs text-[var(--text-muted)]">{employee.full_name} ({employee.employee_code})</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-center py-8 text-[var(--text-muted)] text-sm">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-center py-8 text-[var(--text-muted)] text-sm">No revisions recorded for this employee.</p>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <div key={item.id} className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[var(--text-muted)]">Effective: {item.effective_date}</span>
                    <span className="text-xs text-[var(--accent-primary)] font-medium">{item.approved_by_name ? `Approved by ${item.approved_by_name}` : 'Direct Revision'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--text-muted)] line-through">₹{parseFloat(item.previous_salary).toLocaleString('en-IN')}</span>
                    <span className="text-[var(--text-muted)] font-bold">→</span>
                    <span className="text-[var(--status-success)] font-bold">₹{parseFloat(item.new_salary).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] pt-1">Reason: {item.reason}</p>
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
  const [breakdownEmp, setBreakdownEmp] = useState(null);

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
        <section className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)] mb-2">HR Management</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                <UserGroupIcon className="w-9 h-9 text-[var(--accent-primary)]" />
                Employees
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">Manage employee profiles, branches, statutory info, and salary revisions.</p>
            </div>

            <button onClick={() => { setSelectedEmployee(null); setIsModalOpen(true); }} className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
              <PlusIcon className="h-4 w-4" />
              Add Employee
            </button>
          </div>
        </section>

        <section className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]/40">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Employee Directory</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[var(--text-secondary)]">
              <thead className="text-xs uppercase bg-[var(--bg-primary)]/60 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
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
                  <tr><td colSpan="7" className="px-6 py-4 text-center text-[var(--text-muted)]">Loading...</td></tr>
                ) : employees.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-4 text-center text-[var(--text-muted)]">No employees found</td></tr>
                ) : (
                  employees.map(emp => (
                    <tr
                      key={emp.id}
                      onClick={() => setBreakdownEmp(emp)}
                      className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4 font-medium text-[var(--accent-primary)] font-mono text-xs">{emp.employee_code}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">{emp.full_name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{emp.personal_email || emp.personal_phone || 'No direct contact'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-[var(--text-primary)] font-medium">{emp.department_name || '—'}</p>
                          <p className="text-xs text-[var(--accent-primary)]">{emp.branch_name || 'Head Office'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{emp.designation_name || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[var(--status-success)] whitespace-nowrap">
                            {parseFloat(emp.current_ctc || 0) > 0 ? (
                              `₹${parseFloat(emp.current_ctc).toLocaleString('en-IN')}`
                            ) : (
                              <span className="text-[var(--text-muted)] font-normal text-xs">Not Set</span>
                            )}
                          </span>
                          <button
                            type="button"
                            title="View Salary Breakdown & Tax"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBreakdownEmp(emp);
                            }}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-[var(--text-muted)]">
                            {emp.tax_regime === 'old' ? 'Old Regime' : 'New Regime'}
                          </span>
                          {emp.salary_details?.tds_details?.nil_tax_87a === true && (
                            <span className="text-xs px-1.5 py-0.5 bg-[var(--status-success)]/15 text-[var(--status-success)] rounded font-medium">
                              87A Nil Tax
                            </span>
                          )}
                          {emp.salary_details?.tds_details?.marginal_relief
                            && !emp.salary_details?.tds_details?.nil_tax_87a
                            && Number(emp.salary_details?.tds_details?.monthly_tds || 0) > 0 && (
                            <span className="text-xs px-1.5 py-0.5 bg-[var(--status-warning)]/15 text-[var(--status-warning)] rounded font-medium">
                              87A Marginal Relief
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase ${
                          emp.status === 'active' ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30' :
                          emp.status === 'on_leave' ? 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30' :
                          'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          title="View Detailed Salary & Tax Report"
                          onClick={() => setBreakdownEmp(emp)}
                          className="p-1.5 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/25 transition inline-flex items-center"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          title="Revise / Increment Salary"
                          onClick={() => setIncrementEmp(emp)}
                          className="p-1.5 rounded-lg bg-[var(--status-success)]/15 text-[var(--status-success)] hover:bg-[var(--status-success)]/25 transition inline-flex items-center"
                        >
                          <CurrencyRupeeIcon className="w-4 h-4" />
                        </button>
                        <button
                          title="Salary Revision Audit Trail"
                          onClick={() => setHistoryEmp(emp)}
                          className="p-1.5 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/25 transition inline-flex items-center"
                        >
                          <ClockIcon className="w-4 h-4" />
                        </button>
                        <button
                          title="Edit Profile"
                          onClick={() => { setSelectedEmployee(emp); setIsModalOpen(true); }}
                          className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition inline-flex items-center"
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
                                toast.error(e.response?.data?.detail || 'Failed to delete employee');
                              }
                            }
                          }}
                          className="p-1.5 rounded-lg bg-[var(--status-danger)]/15 text-[var(--status-danger)] hover:bg-[var(--status-danger)]/25 transition inline-flex items-center"
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
        key={selectedEmployee?.id || 'new-employee'}
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

      <SalaryBreakdownModal
        isOpen={!!breakdownEmp}
        onClose={() => setBreakdownEmp(null)}
        employee={breakdownEmp}
      />
    </>
  );
}
