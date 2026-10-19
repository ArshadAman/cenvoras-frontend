import React from "react";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import { Link } from "react-router-dom";
import {
  DocumentTextIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  QrCodeIcon,
  TruckIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function GSTDashboard() {
  const features = [
    {
      title: "GST Shield & 2B Reconciliation",
      description: "Automated GSTR-2B matching, payment-withholding locks, vendor risk scores, and CA Audit Pack.",
      icon: ShieldCheckIcon,
      link: "/reports/gst-shield",
      color: "text-[var(--status-success)]",
      bg: "bg-[var(--status-success)]/10",
    },
    {
      title: "HSN Summary",
      description: "HSN/SAC-wise tax summary for GSTR-1 filing. View taxable value, CGST, SGST, IGST breakups.",
      icon: TableCellsIcon,
      link: "/reports/tax-register?tab=hsn",
      color: "text-[var(--status-info)]",
      bg: "bg-[var(--status-info)]/10",
    },
    {
      title: "GSTR-3B Monthly Return",
      description: "Auto-computed Table 3.1, 3.2, 4 (ITC), and 6.1 (Cash Tax Liability) summary with JSON export.",
      icon: DocumentTextIcon,
      link: "/reports/gstr-3b",
      color: "text-[var(--accent-primary)]",
      bg: "bg-[var(--accent-primary)]/10",
    },
    {
      title: "Tax Register",
      description: "Invoice-wise CGST/SGST/IGST breakup register for sales and purchases.",
      icon: DocumentTextIcon,
      link: "/reports/tax-register",
      color: "text-[var(--status-success)]",
      bg: "bg-[var(--status-success)]/10",
    },
    {
      title: "GSTR-1 JSON Export",
      description: "Generate NIC-compliant GSTR-1 JSON with B2B, B2CS, B2CL, and HSN sections.",
      icon: ArrowDownTrayIcon,
      link: "/reports/tax-register?tab=gstr1",
      color: "text-[var(--status-info)]",
      bg: "bg-[var(--status-info)]/10",
    },
    {
      title: "E-Invoice (IRN)",
      description: `Generate Invoice Reference Number for B2B invoices. Required for ${getCurrencySymbol()}5 Cr+ turnover.`,
      icon: QrCodeIcon,
      link: "/reports/tax-register?tab=einvoice",
      color: "text-[var(--status-warning)]",
      bg: "bg-[var(--status-warning)]/10",
    },
    {
      title: "E-Way Bill",
      description: `Generate E-Way Bills for goods movement above ${getCurrencySymbol()}50,000. Track vehicle and transporter details.`,
      icon: TruckIcon,
      link: "/reports/tax-register?tab=ewaybill",
      color: "text-[var(--status-warning)]",
      bg: "bg-[var(--status-warning)]/10",
    },
  ];

  return (
    <>
      <div className="p-6 md:p-10 animate-fade-up">
        <Link to="/reports" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group mb-6">
          <span className="p-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg group-hover:bg-[var(--bg-primary)] transition-colors"><ArrowLeftIcon className="w-4 h-4" /></span>
          <ChartBarIcon className="w-3.5 h-3.5" /> Back to Reports
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">GST Compliance</h1>
        <p className="text-[var(--text-secondary)] mb-8">Manage GST returns, tax registers, e-invoicing, and e-way bills.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const isComingSoon = ['E-Invoice (IRN)', 'E-Way Bill'].includes(feature.title);
            return (
              <Link
                key={index}
                to={isComingSoon ? "#" : feature.link}
                onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
                className={`bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 flex items-start gap-4 transition-all duration-300 shadow-sm ${
                  isComingSoon ? "opacity-75 cursor-default relative overflow-hidden group" : "hover:scale-[1.02] hover:border-[var(--accent-primary)]/40"
                }`}
              >
                {isComingSoon && (
                  <div className="absolute top-0 right-0 px-8 py-1 bg-[var(--status-warning)]/20 border border-[var(--status-warning)]/30 text-[9px] font-bold uppercase tracking-widest text-[var(--status-warning)] shadow-lg translate-x-[30%] translate-y-[50%] rotate-45 transition-colors">
                    Coming Soon
                  </div>
                )}
                <div className={`p-3 rounded-xl ${feature.bg} shrink-0`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <div className="flex-1 pr-6">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{feature.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
