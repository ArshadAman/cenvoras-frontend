import React, { useState } from 'react';
import { 
  BanknotesIcon, 
  ArchiveBoxIcon, 
  DocumentChartBarIcon, 
  UserGroupIcon, 
  Cog6ToothIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const categories = [
  {
    id: 'sales',
    title: 'Sales & Billing',
    icon: BanknotesIcon,
    description: 'Fast, compliant billing and end-to-end sales management.',
    features: [
      { name: 'GST & VAT Sales Invoices', desc: 'Generate dual-tax compliant invoices in under 10 seconds with thermal & PDF print presets.' },
      { name: 'Quotations & Proformas', desc: 'Draft client quotations, WhatsApp delivery links, and convert directly to sales orders.' },
      { name: 'Sales Orders', desc: 'Manage pipeline orders from quotations and fulfill directly to confirmed invoices seamlessly.' },
      { name: 'Credit Notes & Adjustments', desc: 'Issue credit notes for returned goods, price adjustments, and auto-settle client ledgers.' },
      { name: 'Warranty & Serial Tracking', desc: 'Monitor active, expiring, and critical warranties searchable by invoice or customer.' },
      { name: 'Payment Collections', desc: 'Track daily, monthly, and overdue collections with partial payments and QR code settlements.' },
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory & Purchasing',
    icon: ArchiveBoxIcon,
    description: 'Real-time stock valuation, batch intelligence, and vendor procurement.',
    features: [
      { name: 'Live Stock Control', desc: 'Real-time stock levels, bulk CSV catalog upload, and automated reduction upon sales billing.' },
      { name: 'Purchase Bills & POs', desc: 'Generate purchase orders and register incoming vendor bills to update stock counts instantly.' },
      { name: 'Vendor Ledger Management', desc: 'Complete supplier profiles, payment terms, and outstanding purchase ledger balances.' },
      { name: 'Batch & Expiry Intelligence', desc: 'Track stock lots by batch numbers, manufacturing dates, and automated near-expiry alerts.' },
      { name: 'Debit Notes & Returns', desc: 'Create debit notes for supplier returns or defective item rate adjustments.' },
      { name: 'Stock Reconciliation Journals', desc: 'Record periodic physical audits, wastage adjustments, and stock corrections.' },
    ]
  },
  {
    id: 'accounting',
    title: 'Accounting & Reports',
    icon: DocumentChartBarIcon,
    description: 'Deep financial audit trails, ledgers, and automated tax reconciliation.',
    features: [
      { name: 'Customer & Vendor Ledgers', desc: 'Automated double-entry journals, statement exports, and running balance tracking.' },
      { name: 'GST & Tax Compliance', desc: 'One-click GSTR-1, GSTR-3B summaries, and UAE FTA VAT return calculations.' },
      { name: 'Profit & Loss and Balance Sheets', desc: 'Real-time financial statements, net margin calculations, and item-wise profit breakdown.' },
      { name: 'Stock Valuation (FIFO / Avg)', desc: 'Accurate inventory valuation metrics, cost of goods sold, and closing stock statements.' },
      { name: 'Dead Stock & Movement Analytics', desc: 'Identify slow-moving capital, fast-churn SKUs, and aging inventory.' },
    ]
  },
  {
    id: 'hr',
    title: 'HR & Team Access',
    icon: UserGroupIcon,
    description: 'Manage staff, attendance, role-based controls, and task assignments.',
    features: [
      { name: 'Staff Management', desc: 'Staff directory, role designations, salary structures, and department tagging.' },
      { name: 'Role-Based Permissions', desc: 'Restrict staff permissions: billing only, read-only ledgers, inventory-only, or full admin.' },
      { name: 'Task Management', desc: 'Assign internal operational tasks to employees with automated status notifications.' },
      { name: 'Attendance & Leaves', desc: 'Employee check-in logging and manager approval workflows for employee leave requests.' },
      { name: 'Staff Self-Service Portal', desc: 'Dedicated portal for team members to check shifts, view attendance, and submit requests.' },
      { name: 'Staff Query Escalation', desc: 'Internal ticketing to log and resolve employee queries with resolution tracking.' },
    ]
  },
  {
    id: 'admin',
    title: 'Business Administration',
    icon: Cog6ToothIcon,
    description: 'Command center dashboards, predictive trends, and tamper-proof audit trails.',
    features: [
      { name: 'Executive Command Center', desc: 'Daily revenue pulse, gross margins, outstanding dues, and critical stock warnings at a glance.' },
      { name: 'Sales Forecast & Trend Signals', desc: 'Algorithmic top-seller highlights, sales velocity forecasting, and restocking recommendations.' },
      { name: 'Client CRM & Credit Limits', desc: 'Store customer billing profiles, GSTIN/TRN verifications, and custom credit day thresholds.' },
      { name: 'WhatsApp & Email Automation', desc: 'Dispatch invoice PDFs and overdue payment reminders automatically via WhatsApp and Email.' },
      { name: 'Tamper-Proof Audit Trail', desc: 'Track every action: who modified an invoice, what prices changed, and when.' },
      { name: 'Zero Per-Seat License Limit', desc: 'Deploy across your entire organization with no extra per-user monthly subscription fees.' },
    ]
  }
];

export default function DetailedFeatures() {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const activeData = categories.find(c => c.id === activeCategory);

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 opacity-0 animate-fade-up delay-200 scroll-animate w-full">
      {/* Sidebar / Vertical Tabs */}
      <div className="w-full lg:w-1/3 flex flex-col gap-2">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 group ${
                isActive 
                  ? 'bg-gradient-to-r from-cyan-950/40 via-cyan-900/20 to-transparent border-cyan-500/40 shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)] transform translate-x-2' 
                  : 'bg-[#0d1117]/80 border-white/5 hover:border-white/10 hover:bg-[#131922]'
              }`}
            >
              <div className={`p-2.5 rounded-xl transition-colors ${isActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
                <cat.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className={`text-base font-bold mb-1 transition-colors ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                  {cat.title}
                </h4>
                <p className={`text-xs leading-relaxed transition-colors ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                  {cat.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="w-full lg:w-2/3">
        <div className="bg-[#0d1117] rounded-[2rem] border border-white/10 p-8 md:p-10 h-full relative overflow-hidden group shadow-2xl">
          {/* Subtle Ambient Light */}
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-cyan-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          
          <div className="mb-8 flex items-center gap-4 border-b border-white/5 pb-6">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400">
              {activeData && <activeData.icon className="w-7 h-7" />}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{activeData?.title}</h3>
              <p className="text-gray-400 text-sm mt-0.5">{activeData?.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {activeData?.features.map((feature, idx) => (
              <div key={idx} className="p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-cyan-500/20 transition-all">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-white text-sm font-semibold mb-1">{feature.name}</h5>
                    <p className="text-xs text-gray-400 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
