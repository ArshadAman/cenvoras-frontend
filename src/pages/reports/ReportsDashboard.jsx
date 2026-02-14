import React from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { 
  ChartBarIcon, 
  PresentationChartLineIcon, 
  ClockIcon, 
  DocumentTextIcon 
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
      title: "Expiry Stock",
      description: "List of batches expiring soon or already expired.",
      icon: ClockIcon,
      link: "/reports/expiry",
      color: "text-red-400",
      bg: "bg-red-500/10"
    },
    // Future Reports
    {
      title: "GSTR-1 Summary",
      description: "Sales summary for GST filing (Coming Soon).",
      icon: DocumentTextIcon,
      link: "#",
      color: "text-gray-400",
      bg: "bg-gray-500/10",
      disabled: true
    }
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
              to={report.disabled ? '#' : report.link}
              className={`bento-card p-6 flex items-start gap-4 transition-all duration-300 ${report.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:bg-white/5'}`}
            >
              <div className={`p-3 rounded-xl ${report.bg}`}>
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
