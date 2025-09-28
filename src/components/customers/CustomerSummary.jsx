import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "../../api/customers";
import { format } from "date-fns";

export default function CustomerSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ["customers", "", "-created_at", 1],
    queryFn: () => getCustomers({ search: "", ordering: "-created_at", page: 1 }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const customers = data?.results || data || [];
  const totalCount = data?.count || customers.length;

  // Calculate statistics
  const recentCustomers = customers.slice(0, 5); // Most recent 5 customers
  
  // Customers with email
  const customersWithEmail = customers.filter(customer => customer.email && customer.email.trim() !== '').length;
  
  // Customers with phone
  const customersWithPhone = customers.filter(customer => customer.phone && customer.phone.trim() !== '').length;
  
  // Customers with GSTIN
  const customersWithGSTIN = customers.filter(customer => customer.gstin && customer.gstin.trim() !== '').length;

  // Calculate completion rates
  const emailCompletionRate = totalCount > 0 ? ((customersWithEmail / totalCount) * 100).toFixed(1) : 0;
  const phoneCompletionRate = totalCount > 0 ? ((customersWithPhone / totalCount) * 100).toFixed(1) : 0;
  const gstinCompletionRate = totalCount > 0 ? ((customersWithGSTIN / totalCount) * 100).toFixed(1) : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Customers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Total Customers
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {totalCount.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Email Completion */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  With Email
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {customersWithEmail} ({emailCompletionRate}%)
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Phone Completion */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  With Phone
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {customersWithPhone} ({phoneCompletionRate}%)
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* GSTIN Completion */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  With GSTIN
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {customersWithGSTIN} ({gstinCompletionRate}%)
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Customers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Customers</h3>
        </div>
        <div className="px-6 py-4">
          {recentCustomers.length > 0 ? (
            <div className="space-y-4">
              {recentCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {customer.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {customer.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {customer.email || 'No email'}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(customer.created_at), 'MMM dd')}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {format(new Date(customer.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No customers yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}