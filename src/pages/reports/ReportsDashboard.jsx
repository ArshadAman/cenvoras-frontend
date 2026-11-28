import React from "react";
import { getUserProfile } from '../../api/users';
import { gstReturnsAvailable, isGstReturnLink } from '../../utils/gstStatus';
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
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { getSubscriptionEntitlements } from '../../api/subscription';
import UpgradePromptModal from '../../components/subscription/UpgradePromptModal';
import EmptyState from '../../components/common/EmptyState';

export default function ReportsDashboard() {
  // UAT P1 #13 rework (Rudra CA): GST returns hidden for Composition / Not registered.
  const { data: gstProfileData } = useQuery({ queryKey: ['userProfile'], queryFn: getUserProfile, staleTime: 10 * 60 * 1000 });
  const gstReturnsOk = gstReturnsAvailable(gstProfileData?.billing_profile || gstProfileData?.profile || {});
  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription-entitlements'],
    queryFn: getSubscriptionEntitlements,
    staleTime: 60_000,
  });
  const entitlements = subscriptionData?.data || {};
  const can = entitlements.can || {};
  const currentPlanName = entitlements.plan?.name || 'Free';
  const [upgradeModal, setUpgradeModal] = React.useState({ open: false, featureName: '', description: '', targetPlanName: 'Business' });
  const [searchQuery, setSearchQuery] = React.useState('');

  const reports = [
    {
      title: "Item-Wise P&L",
      description: "Gross profit analysis per product for a date range.",
      icon: ChartBarIcon,
      link: "/reports/profit-loss",
      color: "text-[var(--status-success)]",
      bg: "bg-[var(--status-success)]/10",
      category: "Financial Statements",
      featureKey: 'item_pnl',
    },
    {
      title: "P&L Statement",
      description: "Full income statement — Revenue vs Expenses = Net Profit.",
      icon: BanknotesIcon,
      link: "/reports/profit-loss-statement",
      color: "text-[var(--status-success)]",
      bg: "bg-[var(--status-success)]/10",
      category: "Financial Statements",
    },
    {
      title: "Trial Balance",
      description: "Double-entry verification: debit and credit balances across all accounts.",
      icon: ScaleIcon,
      link: "/reports/trial-balance",
      color: "text-[var(--accent-primary)]",
      bg: "bg-[var(--accent-primary)]/10",
      category: "Financial Statements",
    },
    {
      title: "Balance Sheet",
      description: "Assets = Liabilities + Equity. Financial position at a point in time.",
      icon: ScaleIcon,
      link: "/reports/balance-sheet",
      color: "text-[var(--accent-primary)]",
      bg: "bg-[var(--accent-primary)]/10",
      category: "Financial Statements",
    },
    {
      title: "GSTR-3B Summary",
      description: "Monthly summary return: outward taxable supplies, ITC, and cash tax payable.",
      icon: DocumentTextIcon,
      link: "/reports/gstr-3b",
      color: "text-[var(--status-info)]",
      bg: "bg-[var(--status-info)]/10",
      category: "GST & Tax Compliance",
    },
    {
      title: "Tax Register",
      description: "Invoice-wise CGST/SGST/IGST breakup, HSN summary, and GSTR-1 export.",
      icon: TableCellsIcon,
      link: "/reports/tax-register",
      color: "text-[var(--status-info)]",
      bg: "bg-[var(--status-info)]/10",
      category: "GST & Tax Compliance",
    },
    {
      title: "GST Compliance",
      description: "HSN summary, GSTR-1 filing, E-Invoice, and E-Way Bill generation.",
      icon: ReceiptPercentIcon,
      link: "/gst",
      color: "text-[var(--status-warning)]",
      bg: "bg-[var(--status-warning)]/10",
      category: "GST & Tax Compliance",
    },
    {
      title: "Stock Valuation",
      description: "Current value of inventory based on weighted average cost.",
      icon: PresentationChartLineIcon,
      link: "/reports/stock-valuation",
      color: "text-[var(--status-info)]",
      bg: "bg-[var(--status-info)]/10",
      category: "Inventory & Stock Health",
      featureKey: 'inventory',
    },
    {
      title: "Expiry Stock",
      description: "List of batches expiring soon or already expired.",
      icon: ClockIcon,
      link: "/reports/expiry",
      color: "text-[var(--status-danger)]",
      bg: "bg-[var(--status-danger)]/10",
      category: "Inventory & Stock Health",
    },
    {
      title: "Shortage Management",
      description: "Products below their low-stock alert threshold.",
      icon: ExclamationTriangleIcon,
      link: "/reports/shortage",
      color: "text-[var(--status-warning)]",
      bg: "bg-[var(--status-warning)]/10",
      category: "Inventory & Stock Health",
      featureKey: 'shortage_management',
    },
    {
      title: "Stock Ledger",
      description: "Item-wise cardex showing chronological inbound/outbound transactions.",
      icon: DocumentTextIcon,
      link: "/reports/stock-ledger",
      color: "text-[var(--accent-primary)]",
      bg: "bg-[var(--accent-primary)]/10",
      category: "Inventory & Stock Health",
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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleReports = reports.filter((r) => {
    if (!gstReturnsOk && isGstReturnLink(r.link)) return false;
    if (!normalizedQuery) return true;
    return (
      r.title.toLowerCase().includes(normalizedQuery) ||
      r.description.toLowerCase().includes(normalizedQuery) ||
      r.category.toLowerCase().includes(normalizedQuery)
    );
  });

  const categories = ["Financial Statements", "GST & Tax Compliance", "Inventory & Stock Health"];
  const groupedReports = categories
    .map((category) => ({
      category,
      items: visibleReports.filter((r) => r.category === category),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <div className="p-6 md:p-10 animate-fade-up">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Reports & MIS</h1>
          <div className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-secondary)]">
            <span className="text-[var(--accent-primary)] font-semibold">{currentPlanName}</span> plan
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <p className="text-[var(--text-secondary)]">Gain insights into your business performance, tax compliance, and inventory health.</p>
          <div className="relative w-full sm:w-72 shrink-0">
            <MagnifyingGlassIcon className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter reports..."
              aria-label="Filter reports"
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-8 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-colors duration-150"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear report filter"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {groupedReports.length === 0 ? (
          <EmptyState
            icon={MagnifyingGlassIcon}
            title="No matching reports"
            description={`No reports match "${searchQuery}". Clear the filter to view all financial, tax, and inventory reports.`}
            action={{
              label: "Clear Filter",
              onClick: () => setSearchQuery(''),
            }}
          />
        ) : (
          <div className="space-y-8">
            {groupedReports.map((group) => (
              <section key={group.category} aria-labelledby={`report-group-${group.category}`}>
                <div className="flex items-center gap-3 mb-4">
                  <h2
                    id={`report-group-${group.category}`}
                    className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
                  >
                    {group.category}
                  </h2>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                    {group.items.length}
                  </span>
                  <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.items.map((report) => (
                    isLocked(report) ? (
                      <button
                        key={report.link}
                        type="button"
                        onClick={() => openUpgrade(report)}
                        className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 flex items-start gap-4 transition-colors duration-150 hover:border-[var(--accent-primary)]/50 active:scale-[0.98] text-left w-full relative overflow-hidden shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:outline-none"
                      >
                        <div className="absolute inset-0 bg-black/20" />
                        <div className={`p-3 rounded-xl ${report.bg} shrink-0 relative z-10`}>
                          <report.icon className={`w-7 h-7 ${report.color}`} />
                        </div>
                        <div className="relative z-10 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-bold text-[var(--text-primary)]">{report.title}</h3>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30 uppercase tracking-wider font-semibold">Locked</span>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{report.description}</p>
                          <p className="mt-3 text-xs text-[var(--accent-primary)] font-semibold">Click to unlock on Business</p>
                        </div>
                      </button>
                    ) : (
                      <Link 
                        key={report.link} 
                        to={report.link}
                        className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 flex items-start gap-4 transition-colors duration-150 hover:border-[var(--accent-primary)]/50 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:outline-none"
                      >
                        <div className={`p-3 rounded-xl ${report.bg} shrink-0`}>
                          <report.icon className={`w-7 h-7 ${report.color}`} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">{report.title}</h3>
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{report.description}</p>
                        </div>
                      </Link>
                    )
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

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
