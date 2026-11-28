import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts, getLowStockProducts, getStockValuation } from "../../api/inventory";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import {
  CubeIcon,
  CurrencyRupeeIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

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
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Total Products</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] font-mono font-tabular tabular-nums mt-1">{totalProducts}</p>
            </div>
            <div className="p-3 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 rounded-xl">
              <CubeIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Stock Value</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] font-mono font-tabular tabular-nums mt-1">
                {getCurrencySymbol()}{totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success-border)] rounded-xl">
              <CurrencyRupeeIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">In Stock</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] font-mono font-tabular tabular-nums mt-1">{inStockProducts}</p>
              <p className="text-xs text-[var(--text-muted)] tabular-nums mt-1">Out of stock: {outOfStockProducts}</p>
            </div>
            <div className="p-3 bg-[var(--status-info-bg)] text-[var(--status-info)] border border-[var(--status-info-border)] rounded-xl">
              <ClipboardDocumentCheckIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Low Stock Alert</p>
              <p className="text-2xl font-bold text-[var(--status-danger)] font-mono font-tabular tabular-nums mt-1">{lowStockList.length}</p>
              {lowStockList.length > 0 && (
                <p className="text-xs text-[var(--status-danger)] mt-1 font-medium">Needs reorder!</p>
              )}
            </div>
            <div className="p-3 bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger-border)] rounded-xl">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockList.length > 0 && (
        <div className="bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] rounded-2xl p-5">
          <div className="flex items-center mb-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-[var(--status-danger)] mr-2 shrink-0" />
            <h3 className="text-sm font-semibold text-[var(--status-danger)]">Low Stock Alert</h3>
          </div>
          <div className="space-y-2">
            {lowStockList.slice(0, 5).map(product => (
              <div key={product.id} className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-primary)] font-medium">{product.name}</span>
                <span className="font-mono font-tabular tabular-nums font-medium text-[var(--status-danger)]">
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
