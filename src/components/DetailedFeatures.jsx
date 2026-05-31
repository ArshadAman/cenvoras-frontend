import React, { useState } from 'react';
import { 
  BanknotesIcon, 
  ArchiveBoxIcon, 
  DocumentChartBarIcon, 
  UserGroupIcon, 
  Cog6ToothIcon,
  CheckCircleIcon,
  PresentationChartLineIcon,
  ClipboardDocumentCheckIcon,
  TruckIcon,
  ReceiptRefundIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const categories = [
  {
    id: 'sales',
    title: 'Sales & Billing',
    icon: BanknotesIcon,
    description: 'Fast, compliant billing and end-to-end sales management.',
    features: [
      { name: 'Sales Invoices', desc: 'Create Tax ready sales invoices with beautiful inbuilt professional templates.' },
      { name: 'Quotations', desc: 'Create quotations, send to customers, and convert to sales orders in one click.' },
      { name: 'Sales Orders', desc: 'Manage orders created from quotations, and convert them to invoices seamlessly.' },
      { name: 'Credit Notes', desc: 'Generate and manage credit notes for returned goods or billing errors.' },
      { name: 'Warranty Management', desc: 'View active, expiring, and critical warranty counts. Search by invoice or customer.' },
      { name: 'Payment Collection', desc: 'Track todays collection, monthly, till date. Record payments against invoices and see dues.' },
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory & Purchasing',
    icon: ArchiveBoxIcon,
    description: 'Complete stock control, purchasing, and vendor management.',
    features: [
      { name: 'Inventory Control', desc: 'Add/update inventory, bulk upload, check stocks, and auto-update on sales/purchases.' },
      { name: 'Purchase Bills & Orders', desc: 'Create purchase orders and bills. Auto-updates your inventory instantly.' },
      { name: 'Vendors Management', desc: 'Add, view, and update vendors. Auto-add vendors while creating purchase bills.' },
      { name: 'Multi-Warehouse', desc: 'Add and manage multiple warehouses across different locations.' },
      { name: 'Debit Notes', desc: 'Create and view debit notes for purchase returns or adjustments.' },
      { name: 'Stock Journal', desc: 'Create stock journals for internal transfers or adjustments.' },
    ]
  },
  {
    id: 'accounting',
    title: 'Accounting & Reports',
    icon: DocumentChartBarIcon,
    description: 'Deep insights, ledgers, and automated compliance.',
    features: [
      { name: 'Business Ledger', desc: 'Check business Ledger and make manual journal adjustments easily.' },
      { name: 'GST & Tax Compliance', desc: 'Built-in Tax Registers and GST Compliance reports.' },
      { name: 'Financial Statements', desc: 'Generate P&L statements, Item-wise P&L, and Balance Sheets in a click.' },
      { name: 'Stock Valuation', desc: 'Get accurate stock valuations and detailed stock ledgers.' },
      { name: 'Inventory Reports', desc: 'Track expiry stock, shortage management, and dead stocks.' },
    ]
  },
  {
    id: 'hr',
    title: 'HR & Team',
    icon: UserGroupIcon,
    description: 'Manage employees, salaries, tasks, and attendance.',
    features: [
      { name: 'Employee Management', desc: 'Create employees, assign salary structures, and give increments.' },
      { name: 'Departments & Roles', desc: 'Create and organize Departments and Designations.' },
      { name: 'Task Assignment', desc: 'Assign tasks to employees. Employees receive email updates and can mark tasks as completed.' },
      { name: 'Leaves & Attendance', desc: 'Accept/reject leave applications via email. Employees can mark attendance.' },
      { name: 'Employee Portal', desc: 'Employees login to check attendance, apply for leaves, and raise queries to HR.' },
      { name: 'Query Management', desc: 'View, resolve, or reject employee queries with automated email updates.' },
    ]
  },
  {
    id: 'admin',
    title: 'Business Administration',
    icon: Cog6ToothIcon,
    description: 'Intelligent dashboards, access control, and business tools.',
    features: [
      { name: 'Intelligent Dashboard', desc: 'Todays pulse, overall summary, low stock alerts, and expiring items count.' },
      { name: 'Profit & Forecast', desc: 'Profit Finder (Top 5 best sellers), Sales Forecasts, and Restock Predictions.' },
      { name: 'Customer Management', desc: 'Add, view, and edit customers. Auto-add customers during invoice creation.' },
      { name: 'Access Control', desc: 'Super admin can add team members and assign specific permissions (sales, inventory).' },
      { name: 'Business Tools', desc: 'Send email notifications and automated payment reminders for outstanding balances.' },
      { name: 'Audit Logs', desc: 'Track every action: who did it, when, what changed (e.g., creating/deleting invoices).' },
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
                  ? 'bg-gradient-to-r from-cyan-900/20 to-purple-900/10 border-purple-500/30 shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)] transform translate-x-2' 
                  : 'bg-[#0a0a0a] border-white/5 hover:border-white/10 hover:bg-[#111]'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
                <cat.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className={`text-lg font-bold mb-1 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                  {cat.title}
                </h4>
                <p className={`text-sm transition-colors ${isActive ? 'text-gray-300' : 'text-gray-600'}`}>
                  {cat.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="w-full lg:w-2/3">
        <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/5 p-8 md:p-10 h-full relative overflow-hidden group">
          
          {/* Subtle Glow Background */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          
          <div className="mb-10 flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              {activeData && <activeData.icon className="w-8 h-8 text-cyan-400" />}
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white">{activeData?.title}</h3>
              <p className="text-gray-500 mt-1">{activeData?.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {activeData?.features.map((feature, idx) => (
              <div key={idx} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-white font-semibold mb-2">{feature.name}</h5>
                    <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
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
