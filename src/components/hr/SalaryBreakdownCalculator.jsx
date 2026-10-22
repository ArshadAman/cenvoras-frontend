import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { hrApi } from '../../api/hr';
import {
  CurrencyRupeeIcon,
  CalculatorIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// All 28 States and 8 Union Territories of India
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

function derivePctsFromComponents(components, monthlyCtc, fallbackBasic = 50, fallbackHra = 50) {
  if (!components || !monthlyCtc || monthlyCtc <= 0) {
    return { basicPct: fallbackBasic, hraPct: fallbackHra };
  }
  const metaBasic = Number(components._basic_pct ?? components.basic_pct);
  const metaHra = Number(components._hra_pct ?? components.hra_pct);
  if (!isNaN(metaBasic) && metaBasic > 0) {
    return {
      basicPct: Math.min(90, Math.max(40, Math.round(metaBasic))),
      hraPct: !isNaN(metaHra) ? Math.min(50, Math.max(0, Math.round(metaHra))) : fallbackHra,
    };
  }
  const basicVal = Number(components.Basic || components.basic || 0);
  const hraVal = Number(
    components.HRA !== undefined ? components.HRA : (components.hra !== undefined ? components.hra : -1)
  );
  if (basicVal > 0) {
    const basicPct = Math.min(90, Math.max(40, Math.round((basicVal / monthlyCtc) * 100)));
    let hraPct = fallbackHra;
    if (hraVal === 0) hraPct = 0;
    else if (hraVal > 0) hraPct = Math.min(50, Math.max(0, Math.round((hraVal / basicVal) * 100)));
    return { basicPct, hraPct };
  }
  return { basicPct: fallbackBasic, hraPct: fallbackHra };
}

export default function SalaryBreakdownCalculator({
  initialMonthlyCtc = 50000,
  initialTaxRegime = 'new',
  initialWorkState = 'Karnataka',
  initialComponents = null,
  initialBasicPct = null,
  initialHraPct = null,
  initialTaxDeclarations = null,
  dateOfJoining = null,
  onChange = null,
  readOnly = false,
}) {
  const startCtc = Number(initialMonthlyCtc) || 50000;
  const startPcts = derivePctsFromComponents(
    initialComponents,
    startCtc,
    initialBasicPct != null ? Number(initialBasicPct) : 50,
    initialHraPct != null ? Number(initialHraPct) : 50,
  );

  const [monthlyCtc, setMonthlyCtc] = useState(startCtc);
  const [annualCtc, setAnnualCtc] = useState(Math.round(startCtc * 12 * 100) / 100);
  const [taxRegime, setTaxRegime] = useState(initialTaxRegime || 'new');
  const [workState, setWorkState] = useState(initialWorkState || 'Karnataka');
  const workStateTouched = useRef(false);
  // Company state can arrive after mount (profile query); follow it until the user picks a state.
  useEffect(() => {
    if (!workStateTouched.current && initialWorkState) setWorkState(initialWorkState);
  }, [initialWorkState]);
  
  // Basic pay configuration (Wage Code: typically ≥50%; UI allows 40–85)
  const [basicPct, setBasicPct] = useState(startPcts.basicPct);
  const [hraPctOfBasic, setHraPctOfBasic] = useState(startPcts.hraPct);

  // Allowances Section (Fixed recurring components inside CTC)
  const [showAllowancesSection, setShowAllowancesSection] = useState(false);
  const [conveyance, setConveyance] = useState(0);
  const [medical, setMedical] = useState(0);
  const [customAllowances, setCustomAllowances] = useState([]);

  // Ad-hoc / Variable Additions Section (Outside Contracted Fixed CTC: Spot Bonus, Overtime)
  const [showAdHocSection, setShowAdHocSection] = useState(false);
  const [adHocAdditions, setAdHocAdditions] = useState([]);

  // Old tax regime declarations
  const [showOldRegimeFields, setShowOldRegimeFields] = useState(false);
  const [sec80c, setSec80c] = useState(initialTaxDeclarations?.section_80c || 0);
  const [sec80d, setSec80d] = useState(initialTaxDeclarations?.section_80d || 0);
  const [sec24b, setSec24b] = useState(initialTaxDeclarations?.home_loan_interest_24b || 0);

  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync when initial props change
  useEffect(() => {
    if (initialMonthlyCtc !== undefined && initialMonthlyCtc !== null) {
      const num = Number(initialMonthlyCtc);
      if (!isNaN(num) && num > 0) {
        setMonthlyCtc(num);
        setAnnualCtc(Math.round(num * 12));
      }
    }
  }, [initialMonthlyCtc]);

  useEffect(() => {
    if (initialTaxRegime) {
      setTaxRegime(initialTaxRegime);
    }
  }, [initialTaxRegime]);

  useEffect(() => {
    if (initialBasicPct != null && !isNaN(Number(initialBasicPct))) {
      setBasicPct(Math.min(90, Math.max(40, Math.round(Number(initialBasicPct)))));
    }
    if (initialHraPct != null && !isNaN(Number(initialHraPct))) {
      setHraPctOfBasic(Math.min(50, Math.max(0, Math.round(Number(initialHraPct)))));
    }
    if (initialComponents) {
      const derived = derivePctsFromComponents(
        initialComponents,
        monthlyCtc || Number(initialMonthlyCtc) || 0,
        initialBasicPct != null ? Number(initialBasicPct) : basicPct,
        initialHraPct != null ? Number(initialHraPct) : hraPctOfBasic,
      );
      setBasicPct(derived.basicPct);
      setHraPctOfBasic(derived.hraPct);
    }
    // Intentionally sync when employee/salary props change (open modal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialComponents, initialBasicPct, initialHraPct, initialMonthlyCtc]);

  // Handle monthly change — accept any rupees/paise (no ₹500 step)
  const handleMonthlyChange = (e) => {
    const val = parseFloat(e.target.value);
    const safeVal = isNaN(val) ? 0 : val;
    setMonthlyCtc(safeVal);
    setAnnualCtc(Math.round(safeVal * 12 * 100) / 100);
  };

  // Handle annual change — accept any rupees/paise (no ₹10,000 step)
  const handleAnnualChange = (e) => {
    const val = parseFloat(e.target.value);
    const safeVal = isNaN(val) ? 0 : val;
    setAnnualCtc(safeVal);
    setMonthlyCtc(Math.round((safeVal / 12) * 100) / 100);
  };

  // Quick preset CTCs
  const applyPreset = (lpa) => {
    const annual = lpa * 100000;
    setAnnualCtc(annual);
    setMonthlyCtc(Math.round((annual / 12) * 100) / 100);
  };

  // Custom Allowances management
  const addCustomAllowance = () => {
    setCustomAllowances(prev => [
      ...prev,
      { id: Date.now().toString(), name: 'Special Benefit', amount: 1000 }
    ]);
  };

  const updateCustomAllowance = (id, field, value) => {
    setCustomAllowances(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeCustomAllowance = (id) => {
    setCustomAllowances(prev => prev.filter(item => item.id !== id));
  };

  // Ad-hoc Additions management
  const addAdHocAddition = () => {
    setAdHocAdditions(prev => [
      ...prev,
      { id: Date.now().toString(), name: 'Spot Bonus', amount: 5000 }
    ]);
  };

  const updateAdHocAddition = (id, field, value) => {
    setAdHocAdditions(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeAdHocAddition = (id) => {
    setAdHocAdditions(prev => prev.filter(item => item.id !== id));
  };

  const calcRequestIdRef = useRef(0);

  // Fetch / Compute breakdown from backend
  const calculateBreakdown = useCallback(async () => {
    if (!monthlyCtc || monthlyCtc <= 0) {
      setBreakdown(null);
      return;
    }

    const requestId = ++calcRequestIdRef.current;
    setLoading(true);
    try {
      const basicVal = Math.round(monthlyCtc * (basicPct / 100) * 100) / 100;
      const hraVal = Math.round(basicVal * (hraPctOfBasic / 100) * 100) / 100;

      const components = {
        'Basic': basicVal,
        'HRA': hraVal,
      };

      if (Number(conveyance) > 0) {
        components['Conveyance Allowance'] = Number(conveyance);
      }
      if (Number(medical) > 0) {
        components['Medical Allowance'] = Number(medical);
      }

      customAllowances.forEach(ca => {
        if (ca.name && Number(ca.amount) > 0) {
          components[ca.name] = Number(ca.amount);
        }
      });

      const adHocEarnings = {};
      adHocAdditions.forEach(ah => {
        if (ah.name && Number(ah.amount) > 0) {
          adHocEarnings[ah.name] = Number(ah.amount);
        }
      });

      const payload = {
        monthly_ctc: monthlyCtc,
        tax_regime: taxRegime,
        work_state: workState,
        basic_pct: basicPct,
        hra_pct: hraPctOfBasic,
        components: components,
        ad_hoc_earnings: adHocEarnings,
      };
      if (dateOfJoining) {
        payload.date_of_joining = dateOfJoining;
      }

      if (taxRegime === 'old') {
        payload.declarations = {
          section_80c: Number(sec80c) || 0,
          section_80d: Number(sec80d) || 0,
          section_24b_home_loan: Number(sec24b) || 0,
        };
      }

      const res = await hrApi.calculateSalaryBreakdown(payload);
      // Ignore stale responses from an earlier calc / unmounted session
      if (requestId !== calcRequestIdRef.current) return;
      setBreakdown(res.data);

      if (onChange) {
        // Prefer absolute amounts computed from current sliders (stable keys)
        // so save always persists the split the user sees.
        onChange({
          monthly_ctc: monthlyCtc,
          annual_ctc: annualCtc,
          tax_regime: taxRegime,
          work_state: workState,
          basic_pct: basicPct,
          hra_pct: hraPctOfBasic,
          components: {
            Basic: basicVal,
            HRA: hraVal,
            ...Object.fromEntries(
              Object.entries(components).filter(([k]) => !['Basic', 'HRA'].includes(k))
            ),
          },
          ad_hoc_earnings: adHocEarnings,
          breakdown: res.data,
        });
      }
    } catch (err) {
      if (requestId !== calcRequestIdRef.current) return;
      console.error('Failed to calculate breakdown:', err);
    } finally {
      if (requestId === calcRequestIdRef.current) setLoading(false);
    }
  }, [
    monthlyCtc, annualCtc, taxRegime, workState, basicPct, hraPctOfBasic,
    conveyance, medical, customAllowances, adHocAdditions,
    sec80c, sec80d, sec24b, dateOfJoining, onChange
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateBreakdown();
    }, 250);
    return () => clearTimeout(timer);
  }, [calculateBreakdown]);

  // Safe formatting helper to guarantee NaN never displays
  const formatInr = (val, decimals = 2) => {
    const n = Number(val);
    if (isNaN(n) || !isFinite(n)) return '0.00';
    return n.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Safe computed figures
  const monthlyNet = (breakdown && !isNaN(Number(breakdown.monthly_net_take_home || breakdown.net_take_home_monthly)))
    ? Number(breakdown.monthly_net_take_home || breakdown.net_take_home_monthly)
    : 0;
  const annualNet = (breakdown && !isNaN(Number(breakdown.annual_net_take_home || breakdown.net_take_home_annual)))
    ? Number(breakdown.annual_net_take_home || breakdown.net_take_home_annual)
    : monthlyNet * 12;
  const monthlyGross = (breakdown && !isNaN(Number(breakdown.monthly_gross || breakdown.gross_salary)))
    ? Number(breakdown.monthly_gross || breakdown.gross_salary)
    : 0;
  const annualGross = (breakdown && !isNaN(Number(breakdown.annual_gross)))
    ? Number(breakdown.annual_gross)
    : monthlyGross * 12;
  const totalDeductions = (breakdown?.employee_deductions && !isNaN(Number(breakdown.employee_deductions.total_deductions)))
    ? Number(breakdown.employee_deductions.total_deductions)
    : 0;
  const monthlyTds = (breakdown?.tds_details && !isNaN(Number(breakdown.tds_details.monthly_tds)))
    ? Number(breakdown.tds_details.monthly_tds)
    : 0;
  const employeePf = Number(breakdown?.employee_deductions?.employee_pf || 0);
  const employeeEsi = Number(breakdown?.employee_deductions?.employee_esi || 0);
  const pt = Number(breakdown?.employee_deductions?.professional_tax || 0);
  const stdDeduction = Number(breakdown?.tds_details?.standard_deduction || 0);
  const taxableIncome = Number(breakdown?.tds_details?.taxable_income || breakdown?.tds_details?.net_taxable_income || 0);
  const annualNetTax = Number(breakdown?.tds_details?.annual_net_tax || breakdown?.tds_details?.annual_tax || 0);
  const rebateApplied = Boolean(breakdown?.tds_details?.rebate_applied);
  const tdsReason = breakdown?.tds_details?.reason || '';
  const adHocTotal = Number(breakdown?.ad_hoc_monthly_total || 0);

  const inputCls = "w-full rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors";
  const labelCls = "block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      {/* Controls Card */}
      {!readOnly && (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <CalculatorIcon className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                Compensation & Tax Configuration
              </h3>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[var(--text-muted)] mr-1">Presets:</span>
              {[3, 6, 9, 12, 18, 25].map((lpa) => (
                <button
                  key={lpa}
                  type="button"
                  onClick={() => applyPreset(lpa)}
                  className={`px-2.5 py-1 rounded-lg border font-medium text-xs transition-all ${
                    annualCtc === lpa * 100000
                      ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/30 text-[var(--accent-primary)] font-semibold shadow-sm'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
                  }`}
                >
                  ₹{lpa}L
                </button>
              ))}
            </div>
          </div>

          {/* CTC Inputs & Regime */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>
                Monthly CTC (₹) <span className="text-rose-400">*</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <span className="text-[var(--text-muted)] sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={monthlyCtc || ''}
                  onChange={handleMonthlyChange}
                  className={`${inputCls} pl-8 font-semibold`}
                  placeholder="50000"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>
                Annual CTC (₹)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <span className="text-[var(--text-muted)] sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={annualCtc || ''}
                  onChange={handleAnnualChange}
                  className={`${inputCls} pl-8 font-semibold`}
                  placeholder="600000"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>
                Tax Regime <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setTaxRegime('new')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    taxRegime === 'new'
                      ? 'bg-[var(--action-primary-bg)] text-[var(--accent-primary)] border border-[var(--action-primary-border)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  New (Default)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTaxRegime('old');
                    setShowOldRegimeFields(true);
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    taxRegime === 'old'
                      ? 'bg-[var(--action-primary-bg)] text-[var(--accent-primary)] border border-[var(--action-primary-border)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Old Regime
                </button>
              </div>
            </div>
          </div>

          {/* Basic Pay & State Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Basic Salary Slider & Compliance */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-medium text-[var(--text-secondary)]">Basic Salary</span>
                <span className="font-semibold text-[var(--accent-primary)]">{basicPct}% of CTC</span>
              </div>
              <input
                type="range"
                min="40"
                max="85"
                step="5"
                value={basicPct}
                onChange={(e) => setBasicPct(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
              />
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-400">
                  ₹{Math.round((monthlyCtc * basicPct) / 100).toLocaleString('en-IN')}/mo
                </span>
                {basicPct >= 50 ? (
                  <span className="text-[var(--status-success)] font-medium">✓ Wage Code Compliant (≥50%)</span>
                ) : (
                  <span className="text-[var(--status-warning)] font-medium">⚠ Below 50% Wage Code Floor</span>
                )}
              </div>
              {/* Quick Basic Presets */}
              <div className="flex items-center gap-1 mt-1.5 text-xs">
                <span className="text-[var(--text-muted)]">Quick:</span>
                {[50, 60, 70, 80].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setBasicPct(pct)}
                    className={`px-1.5 py-0.5 rounded border transition-colors ${
                      basicPct === pct
                        ? 'border-[var(--action-primary-border)] bg-[var(--action-primary-bg)] text-[var(--accent-primary)]'
                        : 'border-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* HRA (% of Basic) */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-[var(--text-secondary)]">HRA (% of Basic)</span>
                <span className="font-semibold text-[var(--accent-primary)]">
                  {hraPctOfBasic}% {hraPctOfBasic === 0 ? '(No HRA)' : hraPctOfBasic === 50 ? '(Metro)' : '(Non-Metro)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={hraPctOfBasic}
                onChange={(e) => setHraPctOfBasic(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                <span className="font-semibold text-[var(--text-primary)]">₹{Math.round(((monthlyCtc * basicPct) / 100) * (hraPctOfBasic / 100)).toLocaleString('en-IN')}/mo</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setHraPctOfBasic(0)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      hraPctOfBasic === 0 ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow-sm' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    0% (No HRA)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHraPctOfBasic(40)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      hraPctOfBasic === 40 ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow-sm' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    40% (Non-Metro)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHraPctOfBasic(50)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      hraPctOfBasic === 50 ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow-sm' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    50% (Metro)
                  </button>
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed pt-1 border-t border-[var(--border-subtle)]">
                💡 While HRA is not part of your basic salary, it directly depends on it. Section 10(13A) tax exemptions calculate allowable tax-free HRA strictly based on Basic Salary (not gross pay or overall CTC). If your company does not provide HRA, set it to 0% and the remaining amount automatically balances into Special Allowance.
              </p>
            </div>

            {/* Work State (All 36 States & UTs) */}
            <div>
              <label className={labelCls}>
                Work State (Professional Tax)
              </label>
              <select
                value={workState}
                onChange={(e) => { workStateTouched.current = true; setWorkState(e.target.value); }}
                className="w-full rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expandable Allowances Section */}
          <div className="border-t border-white/10 pt-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAllowancesSection(!showAllowancesSection)}
                className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition"
              >
                <PlusIcon className={`w-3.5 h-3.5 transition-transform ${showAllowancesSection ? 'rotate-45' : ''}`} />
                {showAllowancesSection ? 'Hide Fixed Allowances Configuration' : 'Configure Additional Fixed Allowances (Conveyance, Medical, Custom)'}
              </button>
              <span className="text-xs text-[var(--text-muted)]">
                Special Allowance absorbs remainder to 100% CTC
              </span>
            </div>

            {showAllowancesSection && (
              <div className="mt-3 p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Conveyance Allowance (₹/mo)</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={conveyance || ''}
                      onChange={(e) => setConveyance(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 1600"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Medical Allowance (₹/mo)</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={medical || ''}
                      onChange={(e) => setMedical(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 1250"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Custom Allowances List */}
                {customAllowances.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] block">Custom Recurring Allowances:</span>
                    {customAllowances.map((ca) => (
                      <div key={ca.id} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={ca.name}
                          onChange={(e) => updateCustomAllowance(ca.id, 'name', e.target.value)}
                          placeholder="Allowance Name (e.g. Internet Allowance)"
                          className="flex-1 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)]"
                        />
                        <div className="relative w-36">
                          <span className="absolute left-2.5 top-1.5 text-[var(--text-muted)] text-xs">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={ca.amount || ''}
                            onChange={(e) => updateCustomAllowance(ca.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] pl-6 pr-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] font-mono"
                            placeholder="Amount"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCustomAllowance(ca.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addCustomAllowance}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--action-primary-bg)] border border-[var(--action-primary-border)] text-[var(--accent-primary)] hover:brightness-110 text-xs font-medium transition"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Add Custom Allowance
                </button>
              </div>
            )}
          </div>

          {/* Ad-hoc / Variable Additions Section (Decoupled from Fixed CTC) */}
          <div className="border-t border-white/10 pt-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAdHocSection(!showAdHocSection)}
                className="flex items-center gap-2 text-xs font-semibold text-[var(--status-success)] hover:brightness-110 transition"
              >
                <SparklesIcon className="w-3.5 h-3.5" />
                {showAdHocSection ? 'Hide Ad-hoc / Variable Additions' : 'Add Ad-hoc / Variable Payout (Spot Bonus, Retention Bonus, Overtime)'}
              </button>
              <span className="text-xs text-[var(--text-muted)]">
                Injected into monthly gross without modifying contractual base CTC
              </span>
            </div>

            {showAdHocSection && (
              <div className="mt-3 p-4 bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl space-y-3">
                <p className="text-xs text-emerald-200/90">
                  Ad-hoc earnings add to the employee's monthly gross earnings and are subjected to Section 192 TDS withholding, keeping the underlying contract CTC untouched.
                </p>

                {adHocAdditions.map((ah) => (
                  <div key={ah.id} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={ah.name}
                      onChange={(e) => updateAdHocAddition(ah.id, 'name', e.target.value)}
                      placeholder="e.g. Spot Bonus, Retention Bonus"
                      className="flex-1 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)]"
                    />
                    <div className="relative w-36">
                      <span className="absolute left-2.5 top-1.5 text-[var(--text-muted)] text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={ah.amount || ''}
                        onChange={(e) => updateAdHocAddition(ah.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] pl-6 pr-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] font-mono"
                        placeholder="Amount"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAdHocAddition(ah.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addAdHocAddition}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-medium transition"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Add Ad-hoc Earning
                </button>
              </div>
            )}
          </div>

          {/* Optional Old Regime Deductions Section */}
          {taxRegime === 'old' && (
            <div className="mt-3 p-3.5 bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--status-warning)]">
                  <ShieldCheckIcon className="w-4 h-4 text-[var(--status-warning)]" />
                  Old Regime Deductions & Exemptions (Annual ₹)
                </div>
                <button
                  type="button"
                  onClick={() => setShowOldRegimeFields(!showOldRegimeFields)}
                  className="text-xs text-[var(--status-warning)] underline hover:opacity-80"
                >
                  {showOldRegimeFields ? 'Hide' : 'Configure'}
                </button>
              </div>

              {showOldRegimeFields && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-[var(--status-warning)] mb-1 opacity-80">
                      Section 80C (Max ₹1.5L)
                    </label>
                    <input
                      type="number"
                      max="150000"
                      value={sec80c}
                      onChange={(e) => setSec80c(e.target.value)}
                      placeholder="e.g. 150000"
                      className="w-full text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] py-1.5 px-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--status-warning-text)] mb-1">
                      Section 80D (Health Ins.)
                    </label>
                    <input
                      type="number"
                      max="75000"
                      value={sec80d}
                      onChange={(e) => setSec80d(e.target.value)}
                      placeholder="e.g. 25000"
                      className="w-full text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] py-1.5 px-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--status-warning-text)] mb-1">
                      Sec 24(b) Home Loan Interest
                    </label>
                    <input
                      type="number"
                      max="200000"
                      value={sec24b}
                      onChange={(e) => setSec24b(e.target.value)}
                      placeholder="e.g. 200000"
                      className="w-full text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] py-1.5 px-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Live Calculated Breakdown Cards */}
      {breakdown && (
        <div className="space-y-4">
          {/* Top Level Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Take-Home Net Pay */}
            <div className="bg-[var(--status-success-bg)] border border-[var(--status-success-border)] rounded-2xl p-4 shadow-xl relative overflow-hidden">
              <div className="text-xs uppercase font-semibold tracking-wider text-[var(--status-success)] opacity-80">
                Monthly Net Take-Home
              </div>
              <div className="text-2xl font-bold mt-1 tracking-tight text-[var(--status-success)]">
                ₹{formatInr(monthlyNet)}
              </div>
              <div className="text-xs text-[var(--status-success)] mt-1 font-medium opacity-80">
                Annual: ₹{formatInr(annualNet, 0)}
              </div>
            </div>

            {/* Monthly Gross */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold tracking-wider text-[var(--text-muted)]">
                  Monthly Gross Pay
                </span>
                {adHocTotal > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success-border)] font-semibold">
                    +₹{formatInr(adHocTotal, 0)} Ad-hoc
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold mt-1 text-[var(--text-primary)] tabular-nums tracking-tight">
                ₹{formatInr(monthlyGross)}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                Annual Gross: ₹{formatInr(annualGross, 0)}
              </div>
            </div>

            {/* Total Monthly Deductions */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold tracking-wider text-[var(--text-muted)]">
                  Monthly Deductions
                </span>
                {rebateApplied && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success-border)]">
                    87A Nil Tax
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold mt-1 text-[var(--status-danger)] tabular-nums tracking-tight">
                -₹{formatInr(totalDeductions)}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                TDS: ₹{formatInr(monthlyTds, 0)} | PF: ₹{formatInr(employeePf, 0)}
              </div>
            </div>
          </div>

          {/* Contracted CTC vs Actual Realized CTC Banner if ad-hoc additions exist */}
          {adHocTotal > 0 && (
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-[var(--status-success)]" />
                <span className="text-[var(--text-secondary)]">
                  Contracted Fixed CTC: <strong className="text-[var(--text-primary)]">₹{formatInr(breakdown.contracted_monthly_ctc || monthlyCtc)}/mo</strong>
                </span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="text-[var(--status-success)]">
                  Ad-hoc Variable Additions: <strong className="text-[var(--status-success)]">+₹{formatInr(adHocTotal)}</strong>
                </span>
              </div>
              <div className="text-[var(--text-muted)]">
                Actual Payout Cost: <strong className="text-[var(--text-primary)]">₹{formatInr(Number(breakdown.contracted_monthly_ctc || monthlyCtc) + adHocTotal)}</strong>
              </div>
            </div>
          )}

          {/* Dynamic TDS Banner Explanation */}
          <div className={`p-4 rounded-2xl border backdrop-blur-xl flex items-start gap-3 ${
            rebateApplied
              ? 'bg-[var(--status-success-bg)] border-[var(--status-success-border)] text-[var(--status-success)]'
              : monthlyTds > 0
              ? 'bg-[var(--status-warning-bg)] border-[var(--status-warning-border)] text-[var(--status-warning)]'
              : 'bg-[var(--action-primary-bg)] border-[var(--action-primary-border)] text-[var(--accent-primary)]'
          }`}>
            <InformationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-semibold text-sm text-[var(--text-primary)]">
                TDS Projection (Section 192): {taxRegime === 'new' ? 'New Tax Regime (Sec 115BAC)' : 'Old Tax Regime'}
              </div>
              <div className="text-[var(--text-secondary)]">{tdsReason}</div>
              <div className="text-xs text-[var(--text-muted)] pt-0.5">
                Standard Deduction: ₹{formatInr(stdDeduction, 0)} | Taxable Income: ₹{formatInr(taxableIncome, 0)} | Net Annual Tax: ₹{formatInr(annualNetTax, 0)} (incl. 4% Cess)
              </div>
            </div>
          </div>

          {/* Detailed Itemized Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Earnings Breakdown */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Earnings Breakdown
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">Monthly (₹)</span>
              </div>
              <div className="space-y-2 text-xs">
                {(() => {
                  const seen = new Set();
                  const entries = [];
                  for (const [key, val] of Object.entries(breakdown.earnings || {})) {
                    const norm = key.toLowerCase().replace(/_/g, ' ').trim();
                    if (seen.has(norm)) continue;
                    seen.add(norm);

                    let displayName = key;
                    if (norm === 'basic') displayName = 'Basic';
                    else if (norm === 'hra') displayName = 'HRA';
                    else if (norm === 'da') displayName = 'DA';
                    else if (norm === 'special allowance') displayName = 'Special Allowance';

                    entries.push({ key: displayName, val });
                  }
                  return entries.map(({ key, val }) => (
                    <div key={key} className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                      <span className={key.startsWith('[Ad-hoc]') ? 'text-[var(--status-success)] font-medium' : 'text-[var(--text-secondary)]'}>
                        {key}
                      </span>
                      <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                        ₹{formatInr(val)}
                      </span>
                    </div>
                  ));
                })()}
                <div className="flex justify-between pt-2 font-bold text-[var(--text-primary)] text-sm">
                  <span>Gross Salary</span>
                  <span className="text-[var(--accent-primary)] tabular-nums">
                    ₹{formatInr(monthlyGross)}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Statutory Deductions (Employee)
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">Monthly (₹)</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                  <div>
                    <span className="text-[var(--text-secondary)]">Employee PF (12%)</span>
                    <span className="block text-xs text-[var(--text-muted)]">On Basic Salary</span>
                  </div>
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                    ₹{formatInr(employeePf)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                  <div>
                    <span className="text-[var(--text-secondary)]">Employee ESI (0.75%)</span>
                    <span className="block text-xs text-[var(--text-muted)]">If gross ≤ ₹21,000</span>
                  </div>
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                    ₹{formatInr(employeeEsi)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                  <div>
                    <span className="text-[var(--text-secondary)]">Professional Tax (PT)</span>
                    <span className="block text-xs text-[var(--text-muted)]">{workState} Slab</span>
                  </div>
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                    ₹{formatInr(pt)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                  <div>
                    <span className="text-[var(--text-secondary)]">Income Tax (TDS - Sec 192)</span>
                    <span className="block text-xs text-[var(--text-muted)]">
                      {rebateApplied ? 'Nil (Sec 87A Rebate)' : 'Projected Tax'}
                    </span>
                  </div>
                  <span className={`font-semibold tabular-nums ${monthlyTds > 0 ? 'text-[var(--status-danger)]' : 'text-[var(--text-primary)]'}`}>
                    ₹{formatInr(monthlyTds)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 font-bold text-[var(--text-primary)] text-sm">
                  <span>Total Deductions</span>
                  <span className="text-[var(--status-danger)] tabular-nums">
                    ₹{formatInr(totalDeductions)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
