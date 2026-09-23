import React, { useRef } from 'react';
import { hrApi } from '../../api/hr';
import {
  XMarkIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ClockIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

export default function EmployeeDetailedReportModal({ isOpen, onClose, record, monthName, year }) {
  const printRef = useRef(null);

  if (!isOpen || !record) return null;

  const handleDownloadPdf = async () => {
    if (!record.payslip_id) {
      toast.info('No payslip document generated for this cycle.');
      return;
    }
    try {
      const res = await hrApi.downloadPayslipPdf(record.payslip_id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${record.employee_code}_${monthName || ''}_${year || ''}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download payslip PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const grossSalary = Number(record.gross_salary || 0);
  const totalDeductions = Number(record.total_deductions || 0);
  const netSalary = Number(record.net_salary || 0);
  const employerContr = Number(record.employer_contribution || 0);
  const totalCtc = grossSalary + employerContr;

  // Earnings dictionary
  const earningsMap = record.earnings || {};
  // If earnings dictionary is empty, populate fallback
  if (Object.keys(earningsMap).length === 0 && grossSalary > 0) {
    earningsMap['Base Gross'] = grossSalary;
  }

  // Deductions dictionary
  const deductionsMap = record.deductions || {};
  const deductionReasons = record.deduction_reasons || {};

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl my-4 sm:my-8 overflow-hidden text-gray-200">
        
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between p-5 border-b border-white/10 bg-white/[0.02] sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <DocumentTextIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Employee Payroll & Compliance Audit Report
                </h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase border ${
                  record.status === 'locked' || record.status === 'paid'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                }`}>
                  {record.status || 'Draft'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Cycle: <span className="text-indigo-300 font-medium">{monthName} {year}</span> • Comprehensive Record
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            {record.payslip_id && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                title="Download Official PDF Payslip"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" /> PDF
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
              title="Print Full Audit Report"
            >
              <PrinterIcon className="w-3.5 h-3.5" /> Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Scrollable Report Content */}
        <div ref={printRef} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto print:max-h-none print:p-0">
          
          {/* Employee Identity Card */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Profile */}
              <div className="md:col-span-2 flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                  {record.employee_name?.charAt(0) || 'E'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{record.employee_name}</h3>
                  <div className="text-xs text-gray-400 space-x-2 mt-0.5">
                    <span className="font-mono text-indigo-300 font-medium">{record.employee_code}</span>
                    <span>•</span>
                    <span>{record.designation || 'Staff'}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span>Dept: <strong className="text-gray-200">{record.department || '—'}</strong></span>
                    <span>Branch: <strong className="text-gray-200">{record.branch || 'Head Office'}</strong></span>
                    <span>State: <strong className="text-gray-200">{record.work_state || '—'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Status & Tax Scheme */}
              <div className="space-y-1 text-xs">
                <span className="text-gray-500 uppercase tracking-wider text-[10px] block font-semibold">Tax Regime</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${
                  record.tax_regime === 'old'
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                }`}>
                  {record.tax_regime === 'old' ? 'Old Tax Regime' : 'New Regime (Sec 115BAC)'}
                </span>
                <div className="text-[11px] text-gray-400 pt-1">
                  Type: <span className="capitalize text-gray-200">{record.employment_type?.replace('_', ' ') || 'Full Time'}</span>
                </div>
                {record.date_of_joining && (
                  <div className="text-[11px] text-gray-400">
                    Joined: <span className="text-gray-200">{record.date_of_joining}</span>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-1 text-xs">
                <span className="text-gray-500 uppercase tracking-wider text-[10px] block font-semibold">Direct Contact</span>
                <div className="text-gray-300 truncate" title={record.personal_email}>
                  {record.personal_email || '—'}
                </div>
                <div className="text-gray-300 font-mono">
                  {record.personal_phone || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* High Level Financial KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Gross Earnings</span>
              <span className="text-xl font-bold text-white mt-1 block">
                ₹{grossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-gray-500">Prorated monthly total</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Total Deductions</span>
              <span className="text-xl font-bold text-red-400 mt-1 block">
                -₹{totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-gray-500">Statutory + recoveries</span>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/10 border border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">Net Take-Home Pay</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                ₹{netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-emerald-200/70">Disbursed to bank</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Total Employer Cost</span>
              <span className="text-xl font-bold text-indigo-300 mt-1 block">
                ₹{totalCtc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-gray-500">Gross + Employer PF/ESI</span>
            </div>
          </div>

          {/* Attendance & Proration Audit */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Attendance & Proration Audit
                </span>
              </div>
              <span className="text-xs text-gray-400">
                Proration Days: <strong className="text-white">{record.working_days} Days</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-gray-400 text-[10px] block">Working Days</span>
                <span className="text-sm font-bold text-white mt-0.5 block">{record.working_days}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <span className="text-emerald-400 text-[10px] block">Present Days</span>
                <span className="text-sm font-bold text-emerald-300 mt-0.5 block">{record.present_days || record.working_days}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <span className="text-blue-400 text-[10px] block">Paid Leaves</span>
                <span className="text-sm font-bold text-blue-300 mt-0.5 block">{record.paid_leave_days || '0.0'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <span className="text-amber-400 text-[10px] block">Unpaid / LOP</span>
                <span className="text-sm font-bold text-amber-300 mt-0.5 block">{record.lop_days || '0.0'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
                <span className="text-red-400 text-[10px] block">Absent Days</span>
                <span className="text-sm font-bold text-red-300 mt-0.5 block">{record.absent_days || '0.0'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <span className="text-purple-400 text-[10px] block">Overtime Hours</span>
                <span className="text-sm font-bold text-purple-300 mt-0.5 block">
                  {Number(record.overtime_hours || 0) > 0 ? `${record.overtime_hours} hrs` : '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Earnings vs Deductions Itemized Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Earnings Itemized Table */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Itemized Earnings (₹)
                </span>
                <span className="text-xs font-medium text-gray-500">Prorated Payout</span>
              </div>

              <div className="space-y-2 text-xs">
                {Object.entries(earningsMap).map(([compName, amt]) => (
                  <div key={compName} className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-300">{compName}</span>
                    <span className="font-semibold text-white">
                      ₹{Number(amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                {Number(record.overtime_amount || 0) > 0 && !earningsMap['Overtime'] && (
                  <div className="flex justify-between py-1 border-b border-white/5 text-purple-300">
                    <span>Overtime Payout</span>
                    <span className="font-semibold">
                      ₹{Number(record.overtime_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-bold text-indigo-300">
                  <span>Gross Salary Paid</span>
                  <span>₹{grossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Deductions Itemized Table */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Itemized Deductions (₹)
                </span>
                <span className="text-xs font-medium text-gray-500">Recoveries</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Employee PF */}
                <div className="py-1 border-b border-white/5">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Provident Fund (Employee PF 12%)</span>
                    <span className="font-semibold text-white">
                      ₹{Number(record.employee_pf || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {deductionReasons['PF'] && (
                    <span className="text-[10px] text-gray-500 block">{typeof deductionReasons['PF'] === 'object' ? deductionReasons['PF'].reason : deductionReasons['PF']}</span>
                  )}
                </div>

                {/* Employee ESI */}
                <div className="py-1 border-b border-white/5">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Employee State Insurance (ESI 0.75%)</span>
                    <span className="font-semibold text-white">
                      ₹{Number(record.employee_esi || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {deductionReasons['ESI'] && (
                    <span className="text-[10px] text-gray-500 block">{typeof deductionReasons['ESI'] === 'object' ? deductionReasons['ESI'].reason : deductionReasons['ESI']}</span>
                  )}
                </div>

                {/* Professional Tax */}
                <div className="py-1 border-b border-white/5">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Professional Tax (PT)</span>
                    <span className="font-semibold text-white">
                      ₹{Number(record.professional_tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {deductionReasons['PT'] && (
                    <span className="text-[10px] text-gray-500 block">{typeof deductionReasons['PT'] === 'object' ? deductionReasons['PT'].reason : deductionReasons['PT']}</span>
                  )}
                </div>

                {/* Income Tax (TDS) */}
                <div className="py-1 border-b border-white/5">
                  <div className="flex justify-between">
                    <div>
                      <span className="text-gray-300">Income Tax (TDS Sec 192)</span>
                      {Number(record.tds || 0) === 0 && (
                        <span className="ml-2 text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                          Rebate Applied
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-red-400">
                      ₹{Number(record.tds || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {deductionReasons['TDS'] && (
                    <span className="text-[10px] text-gray-400 block pt-0.5">
                      {typeof deductionReasons['TDS'] === 'object' ? deductionReasons['TDS'].reason : deductionReasons['TDS']}
                    </span>
                  )}
                </div>

                {/* Advance & Loan Recoveries */}
                {Number(record.advance_recovery || 0) > 0 && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-300">Salary Advance Recovery</span>
                    <span className="font-semibold text-red-400">
                      ₹{Number(record.advance_recovery).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {Number(record.loan_recovery || 0) > 0 && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-300">Loan Principal Recovery</span>
                    <span className="font-semibold text-red-400">
                      ₹{Number(record.loan_recovery).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* Custom deductions from deductions map */}
                {Object.entries(deductionsMap).map(([k, v]) => {
                  if (['PF', 'ESI', 'PT', 'TDS', 'Provident Fund (PF)', 'Income Tax (TDS)', 'Professional Tax (PT)'].includes(k)) return null;
                  return (
                    <div key={k} className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-300">{k}</span>
                      <span className="font-semibold text-red-400">
                        ₹{Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}

                <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-bold text-red-400">
                  <span>Total Deductions</span>
                  <span>-₹{totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statutory Identifiers & Banking Records */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Statutory Identifiers & Banking Coordinates
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-500 uppercase text-[10px] block font-semibold">PAN Card</span>
                <span className="font-mono text-white font-medium">{record.pan || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 uppercase text-[10px] block font-semibold">UAN (EPFO)</span>
                <span className="font-mono text-white font-medium">{record.uan || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 uppercase text-[10px] block font-semibold">Aadhaar</span>
                <span className="font-mono text-white font-medium">{record.aadhaar || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 uppercase text-[10px] block font-semibold">ESIC IP Number</span>
                <span className="font-mono text-white font-medium">{record.esi_ip_number || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 uppercase text-[10px] block font-semibold">Bank Name</span>
                <span className="text-white font-medium">{record.bank_name || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 uppercase text-[10px] block font-semibold">Bank Account</span>
                <span className="font-mono text-white font-medium">{record.bank_account || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 uppercase text-[10px] block font-semibold">IFSC Code</span>
                <span className="font-mono text-white font-medium">{record.ifsc || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 uppercase text-[10px] block font-semibold">UPI ID / VPA</span>
                <span className="font-mono text-white font-medium">{record.upi_id || '—'}</span>
              </div>
            </div>
          </div>

          {/* Employer Statutory Remittance Table */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <BanknotesIcon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Employer Compliance & Statutory Remittance Liability
                </span>
              </div>
              <span className="text-xs text-indigo-300 font-semibold">
                Total: ₹{employerContr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-gray-400 text-[10px] block">Employer EPF (3.67%)</span>
                <span className="text-sm font-semibold text-white mt-0.5 block">
                  ₹{Number(record.employer_epf || (record.employer_pf ? Number(record.employer_pf) * 0.3058 : 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-gray-400 text-[10px] block">Employer EPS Pension (8.33%)</span>
                <span className="text-sm font-semibold text-white mt-0.5 block">
                  ₹{Number(record.employer_eps || (record.employer_pf ? Number(record.employer_pf) * 0.6942 : 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-gray-400 text-[10px] block">Employer ESI (3.25%)</span>
                <span className="text-sm font-semibold text-white mt-0.5 block">
                  ₹{Number(record.employer_esi || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-indigo-300 text-[10px] block">Total Statutory Liability</span>
                <span className="text-sm font-bold text-indigo-300 mt-0.5 block">
                  ₹{employerContr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 flex flex-wrap justify-between items-center bg-white/[0.01]">
          <div className="text-xs text-gray-500">
            System Generated Audit Report • Cenvoras HRMS Compliance Engine
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}
