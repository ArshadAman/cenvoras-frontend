import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getSalesInvoices } from "../../api/sales";
import { 
  CurrencyRupeeIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  ShoppingBagIcon,
  ExclamationTriangleIcon 
} from "@heroicons/react/24/outline";

export default function SalesSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ["salesInvoices", "", "-invoice_date", 1],
    queryFn: () => getSalesInvoices({ search: "", ordering: "-invoice_date", page: 1 }),
  });

  const invoices = Array.isArray(data) ? data : data?.data || data?.results || [];

  // Calculate metrics
  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0);
  const thisMonthInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.invoice_date);
    const now = new Date();
    return invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = thisMonthInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0);

  // Payment status functionality removed - not supported by backend

  // Calculate overdue invoices (assuming 30 days payment terms)
  const today = new Date();
  const overdueInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.invoice_date);
    const dueDate = new Date(invoiceDate.getTime() + (30 * 24 * 60 * 60 * 1000));
    return dueDate < today;  // All invoices are considered pending
  });

  // Top customers
  const customerTotals = invoices.reduce((acc, invoice) => {
    const customer = invoice.customer_name || 'Unknown';
    acc[customer] = (acc[customer] || 0) + parseFloat(invoice.total_amount || 0);
    return acc;
  }, {});
  
  const topCustomers = Object.entries(customerTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bento-card p-5 animate-pulse">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/10 rounded-xl"></div>
              <div className="ml-4 flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
                <div className="h-6 bg-white/10 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const summaryCards = [
    {
      label: 'Total Sales',
      value: totalInvoices,
      subValue: `₹${totalRevenue.toLocaleString()}`,
      icon: <CurrencyRupeeIcon className="w-6 h-6 text-cyan-400" />,
      color: 'cyan'
    },
    {
      label: 'This Month',
      value: thisMonthInvoices.length,
      subValue: `₹${thisMonthRevenue.toLocaleString()}`,
      icon: <CalendarIcon className="w-6 h-6 text-green-400" />,
      color: 'green'
    },
    {
      label: 'Avg. Invoice Value',
      value: `₹${totalInvoices > 0 ? (totalRevenue / totalInvoices).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}`,
      subValue: 'Per invoice',
      icon: <ChartBarIcon className="w-6 h-6 text-blue-400" />,
      color: 'blue'
    },
    {
      label: 'Total Items Sold',
      value: invoices.reduce((sum, invoice) => sum + (invoice.items?.length || 0), 0),
      subValue: 'Across all invoices',
      icon: <ShoppingBagIcon className="w-6 h-6 text-purple-400" />,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6 mb-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, i) => (
          <div key={i} className="bento-card p-6 flex flex-col justify-between group hover:border-white/20 transition-colors">
            <div className="flex justify-between items-start mb-4">
               <div className={`p-3 rounded-xl bg-${card.color}-400/10 border border-${card.color}-400/20`}>
                  {card.icon}
               </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white mb-1 tracking-tight">{card.value}</div>
              <div className="text-sm font-medium text-cyan-300 mb-1">{card.subValue}</div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Customers */}
        <div className="lg:col-span-2 bento-card p-6">
          <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-2">Top Customers</h3>
          <div className="space-y-4">
            {topCustomers.length > 0 ? (
              topCustomers.map(([customer, amount], index) => (
                <div key={customer} className="flex justify-between items-center p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${
                      index === 0 ? 'bg-yellow-500/80' : index === 1 ? 'bg-gray-400/80' : 'bg-orange-400/80'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white block">{customer}</span>
                      <span className="text-xs text-gray-400">Customer</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-cyan-400">
                    ₹{amount.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No customer data available</div>
            )}
          </div>
        </div>

        {/* Overdue Alerts */}
        <div className="bento-card p-6">
           <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-2 flex items-center gap-2">
             <ExclamationTriangleIcon className="w-5 h-5 text-red-400" /> Action Required
           </h3>
           
           {overdueInvoices.length > 0 ? (
             <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
               <div className="flex items-start gap-3">
                 <div className="flex-1">
                   <p className="text-red-200 font-medium mb-1">Overdue Invoices</p>
                   <p className="text-red-300/70 text-sm">
                     You have <span className="font-bold text-white">{overdueInvoices.length}</span> invoices that are overdue.
                   </p>
                 </div>
               </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-3">
                  <CurrencyRupeeIcon className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-white font-medium">All caught up!</p>
                <p className="text-gray-400 text-sm mt-1">No overdue invoices found.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}