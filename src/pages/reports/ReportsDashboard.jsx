import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
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
import { getSubscriptionEntitlements } from '../../api/subscription';
import UpgradePromptModal from '../../components/subscription/UpgradePromptModal';

export default function ReportsDashboard() {
  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription-entitlements'],
    queryFn: getSubscriptionEntitlements,
    staleTime: 60_000,
  });
  const entitlements = subscriptionData?.data || {};
  const can = entitlements.can || {};
  const currentPlanName = entitlements.plan?.name || 'Free';
  const [upgradeModal, setUpgradeModal] = React.useState({ open: false, featureName: '', description: '', targetPlanName: 'Business' });

  const reports = [
    {
      title: "Stock Valuation",
      description: "Current value of inventory based on weighted average cost.",
      icon: PresentationChartLineIcon,
      link: "/reports/stock-valuation",
      color: "text-[var(--status-info)]",
      bg: "bg-[var(--status-info)]/10",
      featureKey: 'inventory',
    },
    {
      title: "Item-Wise P&L",
      description: "Gross profit analysis per product for a date range.",
      icon: ChartBarIcon,
      link: "/reports/profit-loss",
      color: "text-[var(--status-success)]",
      bg: "bg-[var(--status-success)]/10",
      featureKey: 'item_pnl',
    },
    {
      title: "P&L Statement",
      description: "Full income statement — Revenue vs Expenses = Net Profit.",
      icon: BanknotesIcon,
      link: "/reports/profit-loss-statement",
      color: "text-[var(--status-success)]",
      bg: "bg-[var(--status-success)]/10"
    },
    {
      title: "Trial Balance",
      description: "Double-entry verification: debit and credit balances across all accounts.",
      icon: ScaleIcon,
      link: "/reports/trial-balance",
      color: "text-[var(--accent-primary)]",
      bg: "bg-[var(--accent-primary)]/10"
    },
    {
      title: "Balance Sheet",
      description: "Assets = Liabilities + Equity. Financial position at a point in time.",
      icon: ScaleIcon,
      link: "/reports/balance-sheet",
      color: "text-[var(--accent-primary)]",
      bg: "bg-[var(--accent-primary)]/10"
    },
    {
      title: "GSTR-3B Summary",
      description: "Monthly summary return: outward taxable supplies, ITC, and cash tax payable.",
      icon: DocumentTextIcon,
      link: "/reports/gstr-3b",
      color: "text-[var(--status-info)]",
      bg: "bg-[var(--status-info)]/10"
    },
    {
      title: "Tax Register",
      description: "Invoice-wise CGST/SGST/IGST breakup, HSN summary, and GSTR-1 export.",
      icon: TableCellsIcon,
      link: "/reports/tax-register",
      color: "text-[var(--status-info)]",
      bg: "bg-[var(--status-info)]/10"
    },
    {
      title: "GST Compliance",
      description: "HSN summary, GSTR-1 filing, E-Invoice, and E-Way Bill generation.",
      icon: ReceiptPercentIcon,
      link: "/gst",
      color: "text-[var(--status-warning)]",
      bg: "bg-[var(--status-warning)]/10"
    },
    {
      title: "Expiry Stock",
      description: "List of batches expiring soon or already expired.",
      icon: ClockIcon,
      link: "/reports/expiry",
      color: "text-[var(--status-danger)]",
      bg: "bg-[var(--status-danger)]/10"
    },
    {
      title: "Shortage Management",
      description: "Products below their low-stock alert threshold.",
      icon: ExclamationTriangleIcon,
      link: "/reports/shortage",
      color: "text-[var(--status-warning)]",
      bg: "bg-[var(--status-warning)]/10",
      featureKey: 'shortage_management',
    },
    {
      title: "Stock Ledger",
      description: "Item-wise cardex showing chronological inbound/outbound transactions.",
      icon: DocumentTextIcon,
      link: "/reports/stock-ledger",
      color: "text-[var(--accent-primary)]",
      bg: "bg-[var(--accent-primary)]/10",
      featureKey: 'stock_ledger',
    },
  ];

  const isLocked = (report) => report.featureKey && can[report.featureKey] === false;

  const openUpgrade = (report) => {
    setUpgradeModal({
      open: true,
      featureName: report.title,
      description: report.description,
      targetPlanName: 'Business',
    });
  };

  return (
    <>
      <div className="p-6 md:p-10 animate-fade-up">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Reports & MIS</h1>
          <div className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-secondary)]">
            <span className="text-[var(--accent-primary)] font-semibold">{currentPlanName}</span> plan
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-8">Gain insights into your business performance and inventory health.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, index) => (
            isLocked(report) ? (
              <button
                key={index}
                type="button"
                onClick={() => openUpgrade(report)}
                className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 flex items-start gap-4 transition-all duration-300 hover:scale-[1.02] hover:border-[var(--accent-primary)]/40 text-left w-full relative overflow-hidden shadow-sm"
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className={`p-3 rounded-xl ${report.bg} shrink-0 relative z-10`}>
                  <report.icon className={`w-8 h-8 ${report.color}`} />
                </div>
                <div className="relative z-10 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{report.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30 uppercase tracking-wider font-semibold">Locked</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{report.description}</p>
                  <p className="mt-3 text-xs text-[var(--accent-primary)] font-semibold">Click to unlock on Business</p>
                </div>
              </button>
            ) : (
              <Link 
                key={index} 
                to={report.link}
                className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 flex items-start gap-4 transition-all duration-300 hover:scale-[1.02] hover:border-[var(--accent-primary)]/40 shadow-sm"
              >
                <div className={`p-3 rounded-xl ${report.bg} shrink-0`}>
                  <report.icon className={`w-8 h-8 ${report.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{report.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{report.description}</p>
                </div>
              </Link>
            )
          ))}
        </div>

        <UpgradePromptModal
          isOpen={upgradeModal.open}
          onClose={() => setUpgradeModal({ open: false, featureName: '', description: '', targetPlanName: 'Business' })}
          title="Business feature"
          featureName={upgradeModal.featureName}
          targetPlanName={upgradeModal.targetPlanName}
          targetPlanCode="business"
          description={upgradeModal.description}
        />
      </div>
    </>
  );
}
