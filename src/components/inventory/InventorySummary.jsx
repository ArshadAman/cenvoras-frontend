import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts, getLowStockProducts, getStockValuation } from "../../api/inventory";

export default function InventorySummary() {
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery({
    queryKey: ["lowStockProducts"],
    queryFn: () => getLowStockProducts(),
  });

  const { data: stockValuation, isLoading: valuationLoading } = useQuery({
    queryKey: ["stockValuation"],
    queryFn: () => getStockValuation(),
  });

  const productsList = Array.isArray(products) ? products : products?.data || products?.results || [];
  const lowStockList = Array.isArray(lowStockProducts) ? lowStockProducts : lowStockProducts?.data || lowStockProducts?.results || [];
  
  // Calculate metrics
  const totalProducts = productsList.length;
  const totalStockValue = stockValuation?.total_value || productsList.reduce((sum, product) => {
    return sum + (parseFloat(product.stock || 0) * parseFloat(product.purchase_price || product.price || 0));
  }, 0);
  
  const inStockProducts = productsList.filter(product => parseFloat(product.stock || 0) > 0).length;
  const outOfStockProducts = productsList.filter(product => parseFloat(product.stock || 0) === 0).length;

  if (productsLoading) {
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalProducts}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stock Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ₹{totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">In Stock</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{inStockProducts}</p>
              <p className="text-xs text-gray-500">Out of stock: {outOfStockProducts}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock Alert</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{lowStockList.length}</p>
              {lowStockList.length > 0 && (
                <p className="text-xs text-red-500">Needs reorder!</p>
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

      {/* Low Stock Alerts */}
      {lowStockList.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Low Stock Alert</h3>
          </div>
          <div className="space-y-2">
            {lowStockList.slice(0, 5).map(product => (
              <div key={product.id} className="flex justify-between items-center text-sm">
                <span className="text-red-700 dark:text-red-300">{product.name}</span>
                <span className="font-medium text-red-800 dark:text-red-200">
                  {product.stock} {product.unit}
                </span>
              </div>
            ))}
            {lowStockList.length > 5 && (
              <p className="text-xs text-red-600 dark:text-red-400">
                +{lowStockList.length - 5} more products need reorder
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
