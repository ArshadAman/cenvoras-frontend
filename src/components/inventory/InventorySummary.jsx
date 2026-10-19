import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts, getLowStockProducts, getStockValuation } from "../../api/inventory";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

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
          <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-xl animate-pulse space-y-2">
            <div className="h-4 bg-[var(--bg-primary)] rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-[var(--bg-primary)] rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Total Products</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] font-mono mt-1">{totalProducts}</p>
            </div>
            <div className="p-3 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Stock Value</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] font-mono mt-1">
                {getCurrencySymbol()}{totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success-border)] rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">In Stock</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] font-mono mt-1">{inStockProducts}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Out of stock: {outOfStockProducts}</p>
            </div>
            <div className="p-3 bg-[var(--status-info-bg)] text-[var(--status-info)] border border-[var(--status-info-border)] rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Low Stock Alert</p>
              <p className="text-2xl font-bold text-[var(--status-danger)] font-mono mt-1">{lowStockList.length}</p>
              {lowStockList.length > 0 && (
                <p className="text-xs text-[var(--status-danger)] mt-1 font-medium">Needs reorder!</p>
              )}
            </div>
            <div className="p-3 bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger-border)] rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockList.length > 0 && (
        <div className="bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] rounded-xl p-4">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-[var(--status-danger)] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-sm font-semibold text-[var(--status-danger)]">Low Stock Alert</h3>
          </div>
          <div className="space-y-2">
            {lowStockList.slice(0, 5).map(product => (
              <div key={product.id} className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-primary)] font-medium">{product.name}</span>
                <span className="font-mono font-medium text-[var(--status-danger)]">
                  {product.stock} {product.unit}
                </span>
              </div>
            ))}
            {lowStockList.length > 5 && (
              <p className="text-xs text-[var(--status-danger)] font-medium">
                +{lowStockList.length - 5} more products need reorder
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
