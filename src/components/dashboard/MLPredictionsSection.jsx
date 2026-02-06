import React from 'react';
import { 
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

/**
 * MLPredictionsSection - Machine Learning Powered Predictions
 * Shows: Sales Forecast (7-day) and Restock Predictions
 */
export default function MLPredictionsSection({ data, isLoading, onViewAllProducts }) {
  if (isLoading) {
    return (
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bento-card !p-5 animate-pulse">
          <div className="h-6 w-48 bg-white/10 rounded mb-4" />
          <div className="h-48 bg-white/5 rounded-lg" />
        </div>
        <div className="bento-card !p-5 animate-pulse">
          <div className="h-6 w-48 bg-white/10 rounded mb-4" />
          <div className="h-48 bg-white/5 rounded-lg" />
        </div>
      </section>
    );
  }

  const salesForecast = data?.sales_forecast || {};
  const restockData = data?.restock_predictions || {};
  const forecast = salesForecast.forecast || [];
  const restockItems = restockData.predictions || [];

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '₹0';
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${Math.round(value).toLocaleString('en-IN')}`;
  };

  const TrendIcon = salesForecast.trend === 'growing' ? ArrowTrendingUpIcon :
                    salesForecast.trend === 'declining' ? ArrowTrendingDownIcon : MinusIcon;
  
  const trendColor = salesForecast.trend === 'growing' ? 'text-green-400' :
                     salesForecast.trend === 'declining' ? 'text-red-400' : 'text-gray-400';

  const urgencyColors = {
    critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
    high: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
    medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    low: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales Forecast Card */}
      <div className="bento-card !p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Sales Forecast
            </h2>
            <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
              ML Powered
            </span>
          </div>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-xs capitalize">{salesForecast.trend || 'analyzing'}</span>
          </div>
        </div>

        {forecast.length === 0 ? (
          <div className="text-center py-8">
            <SparklesIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{salesForecast.message || 'Not enough data yet'}</p>
            <p className="text-xs text-gray-600 mt-1">We need at least 7 days of sales data</p>
          </div>
        ) : (
          <>
            {/* Prediction Summary */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Next 7 Days</div>
                <div className="text-xl font-bold text-purple-400">
                  {formatCurrency(salesForecast.predicted_total)}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Daily Average</div>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(salesForecast.daily_average)}
                </div>
              </div>
            </div>

            {/* Forecast Chart */}
            <div className="h-32 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast}>
                  <XAxis 
                    dataKey="day_name" 
                    stroke="#333" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => val.slice(0, 3)}
                  />
                  <YAxis 
                    stroke="#333" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `₹${(val/1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#000', 
                      border: '1px solid #a855f7', 
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`₹${Math.round(value).toLocaleString()}`, 'Predicted']}
                    labelFormatter={(label) => label}
                  />
                  <ReferenceLine 
                    y={salesForecast.historical_avg} 
                    stroke="#444" 
                    strokeDasharray="3 3"
                    label={{ value: 'Avg', position: 'right', fill: '#666', fontSize: 10 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted_sales" 
                    stroke="#a855f7" 
                    strokeWidth={2} 
                    dot={{ fill: '#a855f7', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, stroke: '#a855f7', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Confidence Badge */}
            <div className="mt-4 text-center">
              <span className={`text-xs px-2 py-1 rounded-full ${
                salesForecast.confidence === 'high' ? 'bg-green-500/20 text-green-400' :
                salesForecast.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {salesForecast.confidence === 'high' ? '🎯 High Confidence' :
                 salesForecast.confidence === 'medium' ? '📊 Medium Confidence' :
                 '📈 Building Prediction Model'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Restock Predictions Card */}
      <div className="bento-card !p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TruckIcon className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Restock Predictions
            </h2>
          </div>
          {restockData.critical_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
              <ExclamationTriangleIcon className="w-3 h-3" />
              {restockData.critical_count} Critical
            </span>
          )}
        </div>

        {restockItems.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
            <p className="text-sm text-gray-500">All products are well-stocked!</p>
            <p className="text-xs text-gray-600 mt-1">No urgent restocking needed</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {restockItems.slice(0, 5).map((item, i) => {
              const colors = urgencyColors[item.urgency] || urgencyColors.low;
              
              return (
                <div 
                  key={i}
                  className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{item.product_name}</div>
                      <div className="text-xs text-gray-500">
                        Stock: {item.current_stock} • Sells {item.avg_daily_sales}/day
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${colors.text}`}>
                        {item.days_to_reorder <= 0 ? 'NOW!' : `${item.days_to_reorder}d`}
                      </div>
                      <div className="text-[10px] text-gray-500">to reorder</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <ClockIcon className="w-3 h-3" />
                      Stockout: {new Date(item.stockout_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className={`text-xs ${colors.text}`}>
                      Order: {item.suggested_qty} units
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {restockItems.length > 5 && (
          <div className="mt-3 text-center">
            <button 
              onClick={() => onViewAllProducts ? onViewAllProducts() : window.location.href = '/inventory'}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              View all {restockItems.length} products →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
