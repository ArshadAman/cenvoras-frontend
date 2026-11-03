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
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-4xl shadow-2xl my-4 sm:my-8 overflow-hidden text-[var(--text-secondary)]">
        
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
              <DocumentTextIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                  Employee Payroll & Compliance Audit Report
                </h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase border ${
                  record.status === 'locked' || record.status === 'paid'
                    ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border-[var(--status-success)]/30'
                    : 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/30'
                }`}>
                  {record.status || 'Draft'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Cycle: <span className="text-[var(--accent-primary)] font-medium">{monthName} {year}</span> • Comprehensive Record
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            {record.payslip_id && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="btn-secondary text-xs"
                title="Download Official PDF Payslip"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" /> PDF
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary text-xs"
              title="Print Full Audit Report"
            >
              <PrinterIcon className="w-3.5 h-3.5" /> Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Scrollable Report Content */}
        <div ref={printRef} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto print:max-h-none print:p-0">
          
          {/* Employee Identity Card */}
          <div className="p-4 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Profile */}
              <div className="md:col-span-2 flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] border border-[var(--accent-primary)]/40 flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md">
                  {record.employee_name?.charAt(0) || 'E'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">{record.employee_name}</h3>
                  <div className="text-xs text-[var(--text-muted)] space-x-2 mt-0.5">
                    <span className="font-mono text-[var(--accent-primary)] font-semibold">{record.employee_code}</span>
                    <span>•</span>
                    <span>{record.designation || 'Staff'}</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span>Dept: <strong className="text-[var(--text-primary)]">{record.department || '—'}</strong></span>
                    <span>Branch: <strong className="text-[var(--text-primary)]">{record.branch || 'Head Office'}</strong></span>
                    <span>State: <strong className="text-[var(--text-primary)]">{record.work_state || '—'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Status & Tax Scheme */}
              <div className="space-y-1 text-xs">
                <span className="text-[var(--text-muted)] uppercase tracking-wider text-xs block font-semibold">Tax Regime</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded font-semibold border ${
                  record.tax_regime === 'old'
                    ? 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border-[var(--status-warning)]/30'
                    : 'bg-[var(--status-success)]/15 text-[var(--status-success)] border-[var(--status-success)]/30'
                }`}>
                  {record.tax_regime === 'old' ? 'Old Tax Regime' : 'New Regime (Sec 115BAC)'}
                </span>
                <div className="text-xs text-[var(--text-muted)] pt-1">
                  Type: <span className="capitalize text-[var(--text-primary)]">{record.employment_type?.replace('_', ' ') || 'Full Time'}</span>
                </div>
                {record.date_of_joining && (
                  <div className="text-xs text-[var(--text-muted)]">
                    Joined: <span className="text-[var(--text-primary)]">{record.date_of_joining}</span>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-1 text-xs">
                <span className="text-[var(--text-muted)] uppercase tracking-wider text-xs block font-semibold">Direct Contact</span>
                <div className="text-[var(--text-primary)] truncate" title={record.personal_email}>
                  {record.personal_email || '—'}
                </div>
                <div className="text-[var(--text-primary)] font-mono">
                  {record.personal_phone || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* High Level Financial KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)]">
              <span className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] block">Gross Earnings</span>
              <span className="text-xl font-bold text-[var(--text-primary)] mt-1 block">
                ₹{grossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-[var(--text-muted)]">Prorated monthly total</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)]">
              <span className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] block">Total Deductions</span>
              <span className="text-xl font-bold text-[var(--status-danger)] mt-1 block">
                -₹{totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-[var(--text-muted)]">Statutory + recoveries</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--status-success)]/10 border border-[var(--status-success)]/30">
              <span className="text-xs uppercase font-bold tracking-wider text-[var(--status-success)] block">Net Take-Home Pay</span>
              <span className="text-xl font-bold text-[var(--status-success)] mt-1 block">
                ₹{netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-[var(--status-success)] opacity-80">Disbursed to bank</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)]">
              <span className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] block">Total Employer Cost</span>
              <span className="text-xl font-bold text-[var(--accent-primary)] mt-1 block">
                ₹{totalCtc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-[var(--text-muted)]">Gross + Employer PF/ESI</span>
            </div>
          </div>

          {/* Attendance & Proration Audit */}
          <div className="p-4 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Attendance & Proration Audit
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                Proration Days: <strong className="text-[var(--text-primary)]">{record.working_days} Days</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] text-xs block">Working Days</span>
                <span className="text-sm font-bold text-[var(--text-primary)] mt-0.5 block">{record.working_days}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--status-success)]/10 border border-[var(--status-success)]/30">
                <span className="text-[var(--status-success)] text-xs block">Present Days</span>
                <span className="text-sm font-bold text-[var(--status-success)] mt-0.5 block">{record.present_days || record.working_days}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--status-info)]/10 border border-[var(--status-info)]/30">
                <span className="text-[var(--status-info)] text-xs block">Paid Leaves</span>
                <span className="text-sm font-bold text-[var(--status-info)] mt-0.5 block">{record.paid_leave_days || '0.0'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30">
                <span className="text-[var(--status-warning)] text-xs block">Unpaid / LOP</span>
                <span className="text-sm font-bold text-[var(--status-warning)] mt-0.5 block">{record.lop_days || '0.0'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30">
                <span className="text-[var(--status-danger)] text-xs block">Absent Days</span>
                <span className="text-sm font-bold text-[var(--status-danger)] mt-0.5 block">{record.absent_days || '0.0'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30">
                <span className="text-[var(--accent-primary)] text-xs block">Overtime Hours</span>
                <span className="text-sm font-bold text-[var(--accent-primary)] mt-0.5 block">
                  {Number(record.overtime_hours || 0) > 0 ? `${record.overtime_hours} hrs` : '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Earnings vs Deductions Itemized Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Earnings Itemized Table */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Itemized Earnings (₹)
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">Prorated Payout</span>
              </div>

              <div className="space-y-2 text-xs">
                {Object.entries(earningsMap).map(([compName, amt]) => (
                  <div key={compName} className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-secondary)]">{compName}</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      ₹{Number(amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                {Number(record.overtime_amount || 0) > 0 && !earningsMap['Overtime'] && (
                  <div className="flex justify-between py-1 border-b border-[var(--border-subtle)] text-[var(--accent-primary)]">
                    <span>Overtime Payout</span>
                    <span className="font-semibold">
                      ₹{Number(record.overtime_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-[var(--border-subtle)] text-sm font-bold text-[var(--accent-primary)]">
                  <span>Gross Salary Paid</span>
                  <span>₹{grossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Deductions Itemized Table */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Itemized Deductions (₹)
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">Recoveries</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Employee PF */}
                <div className="py-1 border-b border-[var(--border-subtle)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Provident Fund (Employee PF 12%)</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      ₹{Number(record.employee_pf || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {deductionReasons['PF'] && (
                    <span className="text-xs text-[var(--text-muted)] block">{typeof deductionReasons['PF'] === 'object' ? deductionReasons['PF'].reason : deductionReasons['PF']}</span>
                  )}
                </div>

                {/* Employee ESI */}
                <div className="py-1 border-b border-[var(--border-subtle)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Employee State Insurance (ESI 0.75%)</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      ₹{Number(record.employee_esi || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {deductionReasons['ESI'] && (
                    <span className="text-xs text-[var(--text-muted)] block">{typeof deductionReasons['ESI'] === 'object' ? deductionReasons['ESI'].reason : deductionReasons['ESI']}</span>
                  )}
                </div>

                {/* Professional Tax */}
                <div className="py-1 border-b border-[var(--border-subtle)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Professional Tax (PT)</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      ₹{Number(record.professional_tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {deductionReasons['PT'] && (
                    <span className="text-xs text-[var(--text-muted)] block">{typeof deductionReasons['PT'] === 'object' ? deductionReasons['PT'].reason : deductionReasons['PT']}</span>
                  )}
                </div>

                {/* Income Tax (TDS) */}
                <div className="py-1 border-b border-[var(--border-subtle)]">
                  <div className="flex justify-between">
                    <div>
                      <span className="text-[var(--text-secondary)]">Income Tax (TDS Sec 192)</span>
                      {Number(record.tds || 0) === 0 && (
                        <span className="ml-2 text-xs px-1 py-0.2 rounded bg-[var(--status-success)]/15 text-[var(--status-success)] font-semibold">
                          Rebate Applied
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-[var(--status-danger)]">
                      ₹{Number(record.tds || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {deductionReasons['TDS'] && (
                    <span className="text-xs text-[var(--text-muted)] block pt-0.5">
                      {typeof deductionReasons['TDS'] === 'object' ? deductionReasons['TDS'].reason : deductionReasons['TDS']}
                    </span>
                  )}
                </div>

                {/* Advance & Loan Recoveries */}
                {Number(record.advance_recovery || 0) > 0 && (
                  <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-secondary)]">Salary Advance Recovery</span>
                    <span className="font-semibold text-[var(--status-danger)]">
                      ₹{Number(record.advance_recovery).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {Number(record.loan_recovery || 0) > 0 && (
                  <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-secondary)]">Loan Principal Recovery</span>
                    <span className="font-semibold text-[var(--status-danger)]">
                      ₹{Number(record.loan_recovery).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* Custom deductions from deductions map */}
                {Object.entries(deductionsMap).map(([k, v]) => {
                  if (['PF', 'ESI', 'PT', 'TDS', 'Provident Fund (PF)', 'Income Tax (TDS)', 'Professional Tax (PT)'].includes(k)) return null;
                  return (
                    <div key={k} className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-secondary)]">{k}</span>
                      <span className="font-semibold text-[var(--status-danger)]">
                        ₹{Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}

                <div className="flex justify-between pt-2 border-t border-[var(--border-subtle)] text-sm font-bold text-[var(--status-danger)]">
                  <span>Total Deductions</span>
                  <span>-₹{totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statutory Identifiers & Banking Records */}
          <div className="p-4 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
              <ShieldCheckIcon className="w-4 h-4 text-[var(--status-success)]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Statutory Identifiers & Banking Coordinates
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[var(--text-muted)] uppercase text-xs block font-semibold">PAN Card</span>
                <span className="font-mono text-[var(--text-primary)] font-medium">{record.pan || '—'}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] uppercase text-xs block font-semibold">UAN (EPFO)</span>
                <span className="font-mono text-[var(--text-primary)] font-medium">{record.uan || '—'}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] uppercase text-xs block font-semibold">Aadhaar</span>
                <span className="font-mono text-[var(--text-primary)] font-medium">{record.aadhaar || '—'}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] uppercase text-xs block font-semibold">ESIC IP Number</span>
                <span className="font-mono text-[var(--text-primary)] font-medium">{record.esi_ip_number || '—'}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] uppercase text-xs block font-semibold">Bank Name</span>
                <span className="text-[var(--text-primary)] font-medium">{record.bank_name || '—'}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] uppercase text-xs block font-semibold">Bank Account</span>
                <span className="font-mono text-[var(--text-primary)] font-medium">{record.bank_account || '—'}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] uppercase text-xs block font-semibold">IFSC Code</span>
                <span className="font-mono text-[var(--text-primary)] font-medium">{record.ifsc || '—'}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] uppercase text-xs block font-semibold">UPI ID / VPA</span>
                <span className="font-mono text-[var(--text-primary)] font-medium">{record.upi_id || '—'}</span>
              </div>
            </div>
          </div>

          {/* Employer Statutory Remittance Table */}
          <div className="p-4 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center gap-2">
                <BanknotesIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Employer Compliance & Statutory Remittance Liability
                </span>
              </div>
              <span className="text-xs text-[var(--accent-primary)] font-semibold">
                Total: ₹{employerContr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] text-xs block">Employer EPF (3.67%)</span>
                <span className="text-sm font-semibold text-[var(--text-primary)] mt-0.5 block">
                  ₹{Number(record.employer_epf || (record.employer_pf ? Number(record.employer_pf) * 0.3058 : 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] text-xs block">Employer EPS Pension (8.33%)</span>
                <span className="text-sm font-semibold text-[var(--text-primary)] mt-0.5 block">
                  ₹{Number(record.employer_eps || (record.employer_pf ? Number(record.employer_pf) * 0.6942 : 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] text-xs block">Employer ESI (3.25%)</span>
                <span className="text-sm font-semibold text-[var(--text-primary)] mt-0.5 block">
                  ₹{Number(record.employer_esi || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30">
                <span className="text-[var(--accent-primary)] text-xs block">Total Statutory Liability</span>
                <span className="text-sm font-bold text-[var(--accent-primary)] mt-0.5 block">
                  ₹{employerContr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--border-subtle)] flex flex-wrap justify-between items-center bg-[var(--bg-primary)]/40">
          <div className="text-xs text-[var(--text-muted)]">
            System Generated Audit Report • Cenvora HRMS Compliance Engine
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}
