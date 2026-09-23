import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { hrApi } from '../../api/hr';
import {
  CurrencyRupeeIcon,
  CalculatorIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const INDIAN_STATES = [
  'Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana',
  'West Bengal', 'Gujarat', 'Uttar Pradesh', 'Kerala', 'Rajasthan',
  'Haryana', 'Andhra Pradesh', 'Madhya Pradesh', 'Punjab', 'Bihar'
];

export default function SalaryBreakdownCalculator({
  initialMonthlyCtc = 50000,
  initialTaxRegime = 'new',
  initialWorkState = 'Karnataka',
  initialComponents = null,
  initialTaxDeclarations = null,
  onChange = null,
  readOnly = false,
}) {
  const [monthlyCtc, setMonthlyCtc] = useState(initialMonthlyCtc || 50000);
  const [annualCtc, setAnnualCtc] = useState(
    initialMonthlyCtc ? Math.round(Number(initialMonthlyCtc) * 12) : 600000
  );
  const [taxRegime, setTaxRegime] = useState(initialTaxRegime || 'new');
  const [workState, setWorkState] = useState(initialWorkState || 'Karnataka');
  const [basicPct, setBasicPct] = useState(50);
  const [hraPctOfBasic, setHraPctOfBasic] = useState(50); // 50% of basic = 25% CTC

  // Old regime deductions
  const [showOldRegimeFields, setShowOldRegimeFields] = useState(false);
  const [sec80c, setSec80c] = useState(initialTaxDeclarations?.section_80c || 0);
  const [sec80d, setSec80d] = useState(initialTaxDeclarations?.section_80d || 0);
  const [sec24b, setSec24b] = useState(initialTaxDeclarations?.home_loan_interest_24b || 0);

  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync when initial props change
  useEffect(() => {
    if (initialMonthlyCtc) {
      setMonthlyCtc(Number(initialMonthlyCtc));
      setAnnualCtc(Math.round(Number(initialMonthlyCtc) * 12));
    }
  }, [initialMonthlyCtc]);

  useEffect(() => {
    if (initialTaxRegime) {
      setTaxRegime(initialTaxRegime);
    }
  }, [initialTaxRegime]);

  // Handle monthly change
  const handleMonthlyChange = (e) => {
    const val = parseFloat(e.target.value) || 0;
    setMonthlyCtc(val);
    setAnnualCtc(Math.round(val * 12));
  };

  // Handle annual change
  const handleAnnualChange = (e) => {
    const val = parseFloat(e.target.value) || 0;
    setAnnualCtc(val);
    setMonthlyCtc(Math.round((val / 12) * 100) / 100);
  };

  // Quick preset CTCs
  const applyPreset = (lpa) => {
    const annual = lpa * 100000;
    setAnnualCtc(annual);
    setMonthlyCtc(Math.round((annual / 12) * 100) / 100);
  };

  // Fetch / Compute breakdown from backend
  const calculateBreakdown = useCallback(async () => {
    if (!monthlyCtc || monthlyCtc <= 0) {
      setBreakdown(null);
      return;
    }

    setLoading(true);
    try {
      const basicVal = Math.round(monthlyCtc * (basicPct / 100) * 100) / 100;
      const hraVal = Math.round(basicVal * (hraPctOfBasic / 100) * 100) / 100;
      const specialAllowanceVal = Math.max(0, Math.round((monthlyCtc - (basicVal + hraVal)) * 100) / 100);

      const payload = {
        monthly_ctc: monthlyCtc,
        tax_regime: taxRegime,
        work_state: workState,
        components: {
          'Basic': basicVal,
          'HRA': hraVal,
          'Special Allowance': specialAllowanceVal,
        },
      };

      if (taxRegime === 'old') {
        payload.tax_declaration = {
          section_80c: Number(sec80c) || 0,
          section_80d: Number(sec80d) || 0,
          home_loan_interest_24b: Number(sec24b) || 0,
        };
      }

      const res = await hrApi.calculateSalaryBreakdown(payload);
      setBreakdown(res.data);

      if (onChange) {
        onChange({
          monthly_ctc: monthlyCtc,
          annual_ctc: annualCtc,
          tax_regime: taxRegime,
          work_state: workState,
          components: {
            Basic: basicVal,
            HRA: hraVal,
            'Special Allowance': specialAllowanceVal,
          },
          tax_declaration: taxRegime === 'old' ? {
            regime: 'old',
            section_80c: Number(sec80c) || 0,
            section_80d: Number(sec80d) || 0,
            home_loan_interest_24b: Number(sec24b) || 0,
          } : {
            regime: 'new',
          },
          breakdown: res.data,
        });
      }
    } catch (err) {
      console.error('Failed to calculate breakdown:', err);
    } finally {
      setLoading(false);
    }
  }, [monthlyCtc, annualCtc, taxRegime, workState, basicPct, hraPctOfBasic, sec80c, sec80d, sec24b, onChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateBreakdown();
    }, 250);
    return () => clearTimeout(timer);
  }, [calculateBreakdown]);

  // Safe calculated numbers to prevent NaN
  const monthlyNet = Number(breakdown?.monthly_net_take_home ?? breakdown?.net_take_home_monthly ?? 0);
  const annualNet = Number(breakdown?.annual_net_take_home ?? breakdown?.net_take_home_annual ?? (monthlyNet * 12));
  const monthlyGross = Number(breakdown?.monthly_gross ?? breakdown?.gross_salary ?? 0);
  const annualGross = Number(breakdown?.annual_gross ?? (monthlyGross * 12));
  const totalDeductions = Number(breakdown?.employee_deductions?.total_deductions ?? 0);
  const monthlyTds = Number(breakdown?.tds_details?.monthly_tds ?? 0);
  const employeePf = Number(breakdown?.employee_deductions?.employee_pf ?? 0);
  const employeeEsi = Number(breakdown?.employee_deductions?.employee_esi ?? 0);
  const pt = Number(breakdown?.employee_deductions?.professional_tax ?? 0);
  const basic = Number(breakdown?.earnings?.basic ?? 0);
  const hra = Number(breakdown?.earnings?.hra ?? 0);
  const da = Number(breakdown?.earnings?.da ?? 0);
  const specialAllowance = Number(breakdown?.earnings?.special_allowance ?? 0);
  const stdDeduction = Number(breakdown?.tds_details?.standard_deduction ?? 0);
  const taxableIncome = Number(breakdown?.tds_details?.taxable_income ?? breakdown?.tds_details?.net_taxable_income ?? 0);
  const annualNetTax = Number(breakdown?.tds_details?.annual_net_tax ?? breakdown?.tds_details?.annual_tax ?? 0);
  const rebateApplied = Boolean(breakdown?.tds_details?.rebate_applied);
  const tdsReason = breakdown?.tds_details?.reason || '';

  const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors";
  const labelCls = "block text-xs font-semibold text-gray-300 mb-1.5";

  return (
    <div className="space-y-6">
      {/* Controls Card */}
      {!readOnly && (
        <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/10 shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <CalculatorIcon className="w-5 h-5 text-indigo-400" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Compensation & Tax Configuration
              </h3>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400 mr-1">Presets:</span>
              {[3, 6, 9, 12, 18, 25].map((lpa) => (
                <button
                  key={lpa}
                  type="button"
                  onClick={() => applyPreset(lpa)}
                  className={`px-2.5 py-1 rounded-lg border font-medium text-xs transition-all ${
                    annualCtc === lpa * 100000
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-sm'
                      : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
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
                  <span className="text-gray-400 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="500"
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
                  <span className="text-gray-400 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="10000"
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
                      ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 shadow-sm'
                      : 'text-gray-400 hover:text-white'
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
                      ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Old Regime
                </button>
              </div>
            </div>
          </div>

          {/* Component Sliders & Work State */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-medium text-gray-300">Basic Salary</span>
                <span className="font-semibold text-indigo-400">{basicPct}% of CTC</span>
              </div>
              <input
                type="range"
                min="30"
                max="60"
                step="5"
                value={basicPct}
                onChange={(e) => setBasicPct(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                ₹{Math.round((monthlyCtc * basicPct) / 100).toLocaleString('en-IN')}/mo
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-medium text-gray-300">HRA (% of Basic)</span>
                <span className="font-semibold text-indigo-400">{hraPctOfBasic}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="50"
                step="5"
                value={hraPctOfBasic}
                onChange={(e) => setHraPctOfBasic(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                ₹{Math.round(((monthlyCtc * basicPct) / 100) * (hraPctOfBasic / 100)).toLocaleString('en-IN')}/mo
              </span>
            </div>

            <div>
              <label className={labelCls}>
                Work State (PT Slabs)
              </label>
              <select
                value={workState}
                onChange={(e) => setWorkState(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st} className="bg-slate-900 text-white">
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Old Regime Deductions Section */}
          {taxRegime === 'old' && (
            <div className="mt-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                  <ShieldCheckIcon className="w-4 h-4 text-amber-400" />
                  Old Regime Deductions & Exemptions (Annual ₹)
                </div>
                <button
                  type="button"
                  onClick={() => setShowOldRegimeFields(!showOldRegimeFields)}
                  className="text-xs text-amber-400 underline hover:text-amber-300"
                >
                  {showOldRegimeFields ? 'Hide' : 'Configure'}
                </button>
              </div>

              {showOldRegimeFields && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-amber-200/90 mb-1">
                      Section 80C (Max ₹1.5L)
                    </label>
                    <input
                      type="number"
                      max="150000"
                      value={sec80c}
                      onChange={(e) => setSec80c(e.target.value)}
                      placeholder="e.g. 150000"
                      className="w-full text-xs rounded-lg bg-black/40 border border-white/10 py-1.5 px-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-amber-200/90 mb-1">
                      Section 80D (Health Ins.)
                    </label>
                    <input
                      type="number"
                      max="75000"
                      value={sec80d}
                      onChange={(e) => setSec80d(e.target.value)}
                      placeholder="e.g. 25000"
                      className="w-full text-xs rounded-lg bg-black/40 border border-white/10 py-1.5 px-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-amber-200/90 mb-1">
                      Sec 24(b) Home Loan Interest
                    </label>
                    <input
                      type="number"
                      max="200000"
                      value={sec24b}
                      onChange={(e) => setSec24b(e.target.value)}
                      placeholder="e.g. 200000"
                      className="w-full text-xs rounded-lg bg-black/40 border border-white/10 py-1.5 px-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
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
            <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-2xl p-4 shadow-xl border border-emerald-400/20 relative overflow-hidden">
              <div className="text-xs uppercase font-semibold tracking-wider text-emerald-100">
                Monthly Net Take-Home
              </div>
              <div className="text-2xl font-bold mt-1 tracking-tight text-white">
                ₹{monthlyNet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-emerald-100/90 mt-1 font-medium">
                Annual: ₹{annualNet.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>

            {/* Monthly Gross */}
            <div className="bg-white/[0.04] rounded-2xl p-4 border border-white/10 shadow-lg backdrop-blur-xl">
              <div className="text-xs uppercase font-semibold tracking-wider text-gray-400">
                Monthly Gross Pay
              </div>
              <div className="text-2xl font-bold mt-1 text-white tracking-tight">
                ₹{monthlyGross.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Annual Gross: ₹{annualGross.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>

            {/* Total Monthly Deductions */}
            <div className="bg-white/[0.04] rounded-2xl p-4 border border-white/10 shadow-lg backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold tracking-wider text-gray-400">
                  Monthly Deductions
                </span>
                {rebateApplied && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    87A Nil Tax
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold mt-1 text-rose-400 tracking-tight">
                -₹{totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                TDS: ₹{monthlyTds.toLocaleString('en-IN')} | PF: ₹{employeePf.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Dynamic TDS Banner Explanation */}
          <div className={`p-4 rounded-2xl border backdrop-blur-xl flex items-start gap-3 ${
            rebateApplied
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : monthlyTds > 0
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
          }`}>
            <InformationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-semibold text-sm text-white">
                TDS Projection (Section 192): {taxRegime === 'new' ? 'New Tax Regime (Sec 115BAC)' : 'Old Tax Regime'}
              </div>
              <div className="text-gray-300">{tdsReason}</div>
              <div className="text-[11px] text-gray-400 pt-0.5">
                Standard Deduction: ₹{stdDeduction.toLocaleString('en-IN')} | Taxable Income: ₹{taxableIncome.toLocaleString('en-IN')} | Net Annual Tax: ₹{annualNetTax.toLocaleString('en-IN')} (incl. 4% Cess)
              </div>
            </div>
          </div>

          {/* Detailed Itemized Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Earnings Breakdown */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-4 shadow-lg backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Earnings Breakdown
                </span>
                <span className="text-xs font-medium text-gray-400">Monthly (₹)</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Basic Pay</span>
                  <span className="font-semibold text-white">
                    ₹{basic.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">House Rent Allowance (HRA)</span>
                  <span className="font-semibold text-white">
                    ₹{hra.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {da > 0 && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Dearness Allowance (DA)</span>
                    <span className="font-semibold text-white">
                      ₹{da.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Special Allowance (Balancing)</span>
                  <span className="font-semibold text-white">
                    ₹{specialAllowance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-2 font-bold text-white text-sm">
                  <span>Gross Salary</span>
                  <span className="text-indigo-400">
                    ₹{monthlyGross.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-4 shadow-lg backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Statutory Deductions (Employee)
                </span>
                <span className="text-xs font-medium text-gray-400">Monthly (₹)</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <div>
                    <span className="text-gray-400">Employee PF (12%)</span>
                    <span className="block text-[10px] text-gray-500">On Basic Salary</span>
                  </div>
                  <span className="font-semibold text-white">
                    ₹{employeePf.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <div>
                    <span className="text-gray-400">Employee ESI (0.75%)</span>
                    <span className="block text-[10px] text-gray-500">If gross ≤ ₹21,000</span>
                  </div>
                  <span className="font-semibold text-white">
                    ₹{employeeEsi.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <div>
                    <span className="text-gray-400">Professional Tax (PT)</span>
                    <span className="block text-[10px] text-gray-500">{workState} Slab</span>
                  </div>
                  <span className="font-semibold text-white">
                    ₹{pt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <div>
                    <span className="text-gray-400">Income Tax (TDS - Sec 192)</span>
                    <span className="block text-[10px] text-gray-500">
                      {rebateApplied ? 'Nil (Sec 87A Rebate)' : 'Projected Tax'}
                    </span>
                  </div>
                  <span className={`font-semibold ${monthlyTds > 0 ? 'text-rose-400' : 'text-white'}`}>
                    ₹{monthlyTds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-2 font-bold text-white text-sm">
                  <span>Total Deductions</span>
                  <span className="text-rose-400">
                    ₹{totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
