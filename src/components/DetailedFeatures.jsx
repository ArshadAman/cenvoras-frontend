import React, { useState } from 'react';
import { 
  BanknotesIcon, 
  ArchiveBoxIcon, 
  DocumentChartBarIcon, 
  UserGroupIcon, 
  Cog6ToothIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

const categories = [
  {
    id: 'sales',
    title: 'Sales & Invoicing',
    icon: BanknotesIcon,
    description: 'Create GST bills in seconds and track payments without manual effort.',
    features: [
      { name: 'Fast GST Invoices', desc: 'Generate accurate, professional tax invoices with auto-calculated CGST, SGST, and IGST.' },
      { name: 'Quotations & Estimates', desc: 'Create quotations, share them via WhatsApp or email, and turn them into invoices in one click.' },
      { name: 'Sales Orders', desc: 'Track pending customer orders and convert them directly into completed sales.' },
      { name: 'Credit Notes', desc: 'Easily issue credit notes for returned goods or rate differences.' },
      { name: 'Customer Balances & Dues', desc: 'See who owes you money, overdue dates, and record partial or full payments.' },
      { name: 'Warranty Tracking', desc: 'Keep track of product warranties, active coverage, and claim histories.' },
    ]
  },
  {
    id: 'inventory',
    title: 'Stock & Purchasing',
    icon: ArchiveBoxIcon,
    description: 'Keep your stock counts accurate with automated updates on every purchase and sale.',
    features: [
      { name: 'Live Stock Tracking', desc: 'Stock quantities update automatically whenever an invoice or purchase bill is created.' },
      { name: 'Purchase Bills & Orders', desc: 'Record incoming stock from suppliers and maintain clear purchase histories.' },
      { name: 'Supplier Management', desc: 'Store supplier details, payment terms, and purchase records in one clean list.' },
      { name: 'Low Stock Alerts', desc: 'Get clear notifications when items drop below your reorder level before running out.' },
      { name: 'Debit Notes & Returns', desc: 'Issue debit notes for returned goods or adjustments with suppliers.' },
      { name: 'Stock Adjustments', desc: 'Easily adjust quantities for damaged items, physical count checks, or write-offs.' },
    ]
  },
  {
    id: 'accounting',
    title: 'Accounting & GST Reports',
    icon: DocumentChartBarIcon,
    description: 'Simple financial statements and tax summaries without complex accounting rules.',
    features: [
      { name: 'Customer & Vendor Ledgers', desc: 'Clear running account statements showing every transaction, debit, credit, and balance.' },
      { name: 'GST Filing Reports', desc: 'Export GSTR-1 and GSTR-3B summaries ready for your CA or tax portal filing.' },
      { name: 'Profit & Loss Statement', desc: 'Know your exact gross and net profit across any date range with clear cost breakdowns.' },
      { name: 'Item-wise Profitability', desc: 'See which products make you the highest profit and which ones barely break even.' },
      { name: 'Stock Valuation', desc: 'Get accurate total stock values anytime for insurance or balance sheet purposes.' },
      { name: 'Payment Records', desc: 'Track cash, bank transfers, UPI, and cheques with automatic ledger entry.' },
    ]
  },
  {
    id: 'hr',
    title: 'Staff & Permissions',
    icon: UserGroupIcon,
    description: 'Control what your team can see and do while keeping operations smooth.',
    features: [
      { name: 'Role-Based Access', desc: 'Give billing staff access only to invoices, while keeping cost prices and profit hidden.' },
      { name: 'Staff Directory', desc: 'Manage your staff list, designations, phone numbers, and joining details.' },
      { name: 'Task Management', desc: 'Assign daily business tasks to staff members and check when they are completed.' },
      { name: 'Attendance & Leaves', desc: 'Track daily attendance records and approve employee leave requests easily.' },
      { name: 'Staff Self-Service', desc: 'Employees can log in with their own account to view assigned tasks and attendance.' },
      { name: 'Unlimited Staff Logins', desc: 'Add all your team members without paying extra monthly seat fees.' },
    ]
  },
  {
    id: 'admin',
    title: 'Business Controls',
    icon: Cog6ToothIcon,
    description: 'Daily overview, customer records, and complete history of every change.',
    features: [
      { name: 'Daily Business Summary', desc: 'See today’s total sales, collections, pending payments, and critical stock at a glance.' },
      { name: 'Customer Profiles', desc: 'Save customer GSTIN, billing addresses, phone numbers, and credit limits.' },
      { name: 'Audit History', desc: 'See who created, edited, or deleted any invoice or price, along with the exact timestamp.' },
      { name: 'Quick Search', desc: 'Find any invoice, customer, or product in milliseconds with instant keyboard search.' },
      { name: 'Data Export', desc: 'Download your customer lists, stock sheets, and invoices in standard Excel or CSV anytime.' },
      { name: 'Daily Backups', desc: 'Your database is backed up automatically so your business records stay safe.' },
    ]
  }
];

export default function DetailedFeatures() {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const activeData = categories.find(c => c.id === activeCategory);

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      {/* Category Navigation */}
      <div className="w-full lg:w-1/3 flex flex-col gap-2">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                isActive 
                  ? 'bg-zinc-900 border-zinc-700 text-white' 
                  : 'bg-zinc-950/60 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isActive ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
                <cat.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-sm font-semibold mb-0.5 ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                  {cat.title}
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Feature Details Panel */}
      <div className="w-full lg:w-2/3">
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 h-full">
          <div className="mb-6 pb-5 border-b border-zinc-800/80">
            <h3 className="text-xl font-bold text-white">{activeData?.title}</h3>
            <p className="text-zinc-400 text-sm mt-1">{activeData?.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeData?.features.map((feature, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40">
                <div className="flex items-start gap-2.5">
                  <CheckIcon className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                  <div>
                    <h5 className="text-white text-sm font-semibold mb-1">{feature.name}</h5>
                    <p className="text-xs text-zinc-400 leading-relaxed">{feature.desc}</p>
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
