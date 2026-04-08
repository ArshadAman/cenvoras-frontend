import React from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { 
  ChartBarIcon, 
  PresentationChartLineIcon, 
  ClockIcon, 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ReceiptPercentIcon,
  ScaleIcon,
  BanknotesIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

export default function ReportsDashboard() {
  const reports = [
    {
      title: "Stock Valuation",
      description: "Current value of inventory based on weighted average cost.",
      icon: PresentationChartLineIcon,
      link: "/reports/stock-valuation",
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    {
      title: "Item-Wise P&L",
      description: "Gross profit analysis per product for a date range.",
      icon: ChartBarIcon,
      link: "/reports/profit-loss",
      color: "text-green-400",
      bg: "bg-green-500/10"
    },
    {
      title: "P&L Statement",
      description: "Full income statement — Revenue vs Expenses = Net Profit.",
      icon: BanknotesIcon,
      link: "/reports/profit-loss-statement",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Balance Sheet",
      description: "Assets = Liabilities + Equity. Financial position at a point in time.",
      icon: ScaleIcon,
      link: "/reports/balance-sheet",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10"
    },
    {
      title: "Tax Register",
      description: "Invoice-wise CGST/SGST/IGST breakup, HSN summary, and GSTR-1 export.",
      icon: TableCellsIcon,
      link: "/reports/tax-register",
      color: "text-purple-400",
      bg: "bg-purple-500/10"
    },
    {
      title: "GST Compliance",
      description: "HSN summary, GSTR-1 filing, E-Invoice, and E-Way Bill generation.",
      icon: ReceiptPercentIcon,
      link: "/gst",
      color: "text-amber-400",
      bg: "bg-amber-500/10"
    },
    {
      title: "Expiry Stock",
      description: "List of batches expiring soon or already expired.",
      icon: ClockIcon,
      link: "/reports/expiry",
      color: "text-red-400",
      bg: "bg-red-500/10"
    },
    {
      title: "Shortage Management",
      description: "Products below their low-stock alert threshold.",
      icon: ExclamationTriangleIcon,
      link: "/reports/shortage",
      color: "text-orange-400",
      bg: "bg-orange-500/10"
    },
    {
      title: "Stock Ledger",
      description: "Item-wise cardex showing chronological inbound/outbound transactions.",
      icon: DocumentTextIcon,
      link: "/reports/stock-ledger",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10"
    },
  ];

  return (
    <Layout>
      <div className="p-6 md:p-10 animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Reports & MIS</h1>
        <p className="text-gray-400 mb-8">Gain insights into your business performance and inventory health.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, index) => (
            <Link 
              key={index} 
              to={report.link}
              className="bento-card p-6 flex items-start gap-4 transition-all duration-300 hover:scale-[1.02] hover:bg-white/5"
            >
              <div className={`p-3 rounded-xl ${report.bg} shrink-0`}>
                <report.icon className={`w-8 h-8 ${report.color}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{report.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{report.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
