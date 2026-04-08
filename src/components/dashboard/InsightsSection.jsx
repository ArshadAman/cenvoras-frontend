import React from 'react';
import { 
  TrophyIcon,
  ArrowTrendingDownIcon,
  ChartPieIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/**
 * InsightsSection - Profit Finder / Business Intelligence
 * Shows: Top 5 bestsellers, Slow movers, Profit margins, Peak hours
 */
export default function InsightsSection({ data, isLoading }) {
  if (isLoading) {
    return (
      <section className="bento-card !p-5 animate-pulse">
        <div className="h-6 w-40 bg-white/10 rounded mb-4" />
        <div className="h-48 bg-white/5 rounded-lg" />
      </section>
    );
  }

  const insights = data || {};
  const topProducts = insights.top_5_products || [];
  const slowMovers = insights.slow_movers || [];
  const peakHours = insights.peak_hours || { message: 'Analyzing your data...' };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '₹0';
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const colors = ['#22d3ee', '#a855f7', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <section className="bento-card !p-5">
      <div className="flex items-center gap-2 mb-5">
        <TrophyIcon className="w-5 h-5 text-amber-400" />
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Profit Finder</h2>
      </div>

      <div className="space-y-6">
        {/* Top 5 Bestsellers */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-500 rounded-full" />
            Top 5 Bestsellers (30 days)
          </h3>
          
          {topProducts.length === 0 ? (
            <p className="text-xs text-gray-600 italic">No sales data yet</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((product, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" 
                       style={{ backgroundColor: `${colors[i]}20`, color: colors[i] }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white truncate">{product.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{formatCurrency(product.revenue)}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 mt-1">
                      <div 
                        className="h-1.5 rounded-full" 
                        style={{ 
                          width: `${product.percent_of_total || 0}%`,
                          backgroundColor: colors[i] 
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-600 flex-shrink-0">
                    {product.percent_of_total?.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slow Movers */}
        {slowMovers.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              Slow Movers (Consider discounting)
            </h3>
            <div className="space-y-2">
              {slowMovers.slice(0, 3).map((product, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-white truncate">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-red-400">{formatCurrency(product.trapped_value)} stuck</div>
                    <div className="text-[10px] text-gray-600">{product.stock} units, {product.sales_30d} sold</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Peak Hours */}
        <div className="pt-3 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ClockIcon className="w-4 h-4" />
            <span>{peakHours.message}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
