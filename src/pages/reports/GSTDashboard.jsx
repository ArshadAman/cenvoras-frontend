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
} from '@heroicons/react/24/outline';

export default function GSTDashboard() {
  const features = [
    {
      title: "HSN Summary",
      description: "HSN/SAC-wise tax summary for GSTR-1 filing. View taxable value, CGST, SGST, IGST breakups.",
      icon: TableCellsIcon,
      link: "/reports/tax-register?tab=hsn",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Tax Register",
      description: "Invoice-wise CGST/SGST/IGST breakup register for sales and purchases.",
      icon: DocumentTextIcon,
      link: "/reports/tax-register",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "GSTR-1 JSON Export",
      description: "Generate NIC-compliant GSTR-1 JSON with B2B, B2CS, B2CL, and HSN sections.",
      icon: ArrowDownTrayIcon,
      link: "/reports/tax-register?tab=gstr1",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      title: "E-Invoice (IRN)",
      description: "Generate Invoice Reference Number for B2B invoices. Required for {getCurrencySymbol()}5 Cr+ turnover.",
      icon: QrCodeIcon,
      link: "/reports/tax-register?tab=einvoice",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      title: "E-Way Bill",
      description: "Generate E-Way Bills for goods movement above {getCurrencySymbol()}50,000. Track vehicle and transporter details.",
      icon: TruckIcon,
      link: "/reports/tax-register?tab=ewaybill",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <>
      <div className="p-6 md:p-10 animate-fade-up">
        <Link to="/reports" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group mb-6">
          <span className="p-1.5 bg-white/5 border border-white/10 rounded-lg group-hover:bg-white/10 transition-colors"><ArrowLeftIcon className="w-4 h-4" /></span>
          <ChartBarIcon className="w-3.5 h-3.5" /> Back to Reports
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">GST Compliance</h1>
        <p className="text-gray-400 mb-8">Manage GST returns, tax registers, e-invoicing, and e-way bills.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const isComingSoon = ['E-Invoice (IRN)', 'E-Way Bill'].includes(feature.title);
            return (
              <Link
                key={index}
                to={isComingSoon ? "#" : feature.link}
                onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
                className={`bento-card p-6 flex items-start gap-4 transition-all duration-300 ${
                  isComingSoon ? "opacity-75 cursor-default relative overflow-hidden group" : "hover:scale-[1.02] hover:bg-white/5"
                }`}
              >
                {isComingSoon && (
                  <div className="absolute top-0 right-0 px-8 py-1 bg-gradient-to-r from-pink-500/80 to-orange-500/80 text-[9px] font-bold uppercase tracking-widest text-white shadow-lg translate-x-[30%] translate-y-[50%] rotate-45 group-hover:from-pink-500 group-hover:to-orange-500 transition-colors">
                    Coming Soon
                  </div>
                )}
                <div className={`p-3 rounded-xl ${feature.bg} shrink-0`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <div className="flex-1 pr-6">
                  <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
