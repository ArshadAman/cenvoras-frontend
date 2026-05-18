import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getPurchaseBills } from "../../api/purchase";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

export default function PurchaseSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ["purchaseBills", "", "-bill_date", 1],
    queryFn: () => getPurchaseBills({ search: "", ordering: "-bill_date", page: 1 }),
  });

  const bills = Array.isArray(data) ? data : data?.data || data?.results || [];

  // Calculate metrics
  const totalBills = bills.length;
  const totalAmount = bills.reduce((sum, bill) => sum + parseFloat(bill.total_amount || 0), 0);
  const thisMonthBills = bills.filter(bill => {
    const billDate = new Date(bill.bill_date);
    const now = new Date();
    return billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear();
  });
  const thisMonthAmount = thisMonthBills.reduce((sum, bill) => sum + parseFloat(bill.total_amount || 0), 0);

  // Calculate overdue bills (assuming 30 days payment terms)
  const today = new Date();
  const overdueBills = bills.filter(bill => {
    const billDate = new Date(bill.bill_date);
    const dueDate = new Date(billDate.getTime() + (30 * 24 * 60 * 60 * 1000));
    return dueDate < today;
  });

  // Top vendors
  const vendorTotals = bills.reduce((acc, bill) => {
    const vendor = bill.vendor_name || 'Unknown';
    acc[vendor] = (acc[vendor] || 0) + parseFloat(bill.total_amount || 0);
    return acc;
  }, {});
  
  const topVendors = Object.entries(vendorTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Bills</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalBills}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getCurrencySymbol()}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{thisMonthBills.length}</p>
              <p className="text-xs text-gray-500">{getCurrencySymbol()}{thisMonthAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overdue Bills</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueBills.length}</p>
              {overdueBills.length > 0 && (
                <p className="text-xs text-red-500">Needs attention!</p>
              )}
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <svg className="w-6 h-6 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts and Top Vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        {overdueBills.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Overdue Bills Alert</h3>
            </div>
            <div className="space-y-2">
              {overdueBills.slice(0, 3).map(bill => (
                <div key={bill.id} className="flex justify-between items-center text-sm">
                  <span className="text-red-700 dark:text-red-300">{bill.bill_number} - {bill.vendor_name}</span>
                  <span className="font-medium text-red-800 dark:text-red-200">{getCurrencySymbol()}{parseFloat(bill.total_amount).toFixed(2)}</span>
                </div>
              ))}
              {overdueBills.length > 3 && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  +{overdueBills.length - 3} more overdue bills
                </p>
              )}
            </div>
          </div>
        )}

        {/* Top Vendors */}
        {topVendors.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Top Vendors</h3>
            </div>
            <div className="space-y-2">
              {topVendors.map(([vendor, amount], index) => (
                <div key={vendor} className="flex justify-between items-center text-sm">
                  <span className="text-blue-700 dark:text-blue-300">
                    {index + 1}. {vendor}
                  </span>
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    {getCurrencySymbol()}{amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
