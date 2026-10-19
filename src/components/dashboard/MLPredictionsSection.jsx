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
import UpgradePromptModal from '../subscription/UpgradePromptModal';
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

/**
 * MLPredictionsSection - Machine Learning Powered Predictions
 * Shows: Sales Forecast (7-day) and Restock Predictions
 */
export default function MLPredictionsSection({ data, isLoading, onViewAllProducts }) {
  const [upgradeModal, setUpgradeModal] = React.useState({ open: false, featureName: '', targetPlanName: 'Business', targetPlanCode: 'business', description: '' });

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
  const restockItems = (restockData.predictions || []).filter(item => item.days_to_reorder <= 30 && item.suggested_qty > 0);

  const formatCurrency = (value) => {
    if (!value) return `${getCurrencySymbol()}0`;
    if (value >= 100000) return `${getCurrencySymbol()}${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${getCurrencySymbol()}${(value / 1000).toFixed(1)}K`;
    return `${getCurrencySymbol()}${Math.round(value).toLocaleString('en-IN')}`;
  };

  const TrendIcon = salesForecast.trend === 'growing' ? ArrowTrendingUpIcon :
                    salesForecast.trend === 'declining' ? ArrowTrendingDownIcon : MinusIcon;
  
  const trendColor = salesForecast.trend === 'growing' ? 'text-[var(--status-success)]' :
                     salesForecast.trend === 'declining' ? 'text-[var(--status-danger)]' : 'text-[var(--text-muted)]';

  const isForecastLocked = data?.can?.forecast === false;
  const isRestockLocked = data?.can?.restock === false;

  const promptUpgrade = (featureName, description, targetPlanName = 'Business') => {
    setUpgradeModal({
      open: true,
      featureName,
      description,
      targetPlanName,
      targetPlanCode: String(targetPlanName).toLowerCase() === 'business' ? 'business' : 'pro',
    });
  };

  const urgencyColors = {
    critical: { bg: 'bg-[var(--status-danger)]/10', border: 'border-[var(--status-danger)]/30', text: 'text-[var(--status-danger)]' },
    high: { bg: 'bg-[var(--status-warning)]/10', border: 'border-[var(--status-warning)]/30', text: 'text-[var(--status-warning)]' },
    medium: { bg: 'bg-[var(--status-warning)]/10', border: 'border-[var(--status-warning)]/30', text: 'text-[var(--status-warning)]' },
    low: { bg: 'bg-[var(--status-success)]/10', border: 'border-[var(--status-success)]/30', text: 'text-[var(--status-success)]' },
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales Forecast Card */}
      <div className="bento-card !p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Sales Forecast
            </h2>
            <span className="text-[10px] px-2 py-0.5 bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-semibold rounded-full">
              ML Powered
            </span>
          </div>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-xs capitalize font-semibold">{salesForecast.trend || 'analyzing'}</span>
          </div>
        </div>

        {isForecastLocked ? (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 p-5 min-h-[240px] flex flex-col justify-center items-center text-center">
            <SparklesIcon className="w-12 h-12 text-[var(--accent-primary)]/60 mb-3" />
            <p className="text-[var(--text-primary)] font-semibold mb-1">Sales Forecast locked</p>
            <p className="text-sm text-[var(--text-muted)] max-w-sm">
              Upgrade to unlock sales forecasting and the predictive growth view.
            </p>
            <button
              type="button"
              onClick={() => promptUpgrade('Sales Forecast', 'Sales forecasting is available on the higher tier that includes predictive growth insights.')}
              className="btn-secondary mt-4 text-xs px-3 py-2 rounded-lg"
            >
              Unlock Forecast
            </button>
          </div>
        ) : forecast.length === 0 ? (
          <div className="text-center py-8">
            <SparklesIcon className="w-12 h-12 text-[var(--text-muted)]/40 mx-auto mb-3" />
            <p className="text-sm text-[var(--text-muted)]">{salesForecast.message || 'Not enough data yet'}</p>
            <p className="text-xs text-[var(--text-muted)]/80 mt-1">We need at least 7 days of sales data</p>
          </div>
        ) : (
          <>
            {/* Prediction Summary */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-3">
                <div className="text-xs text-[var(--text-muted)] mb-1">Next 7 Days</div>
                <div className="text-xl font-bold text-[var(--accent-primary)] font-mono font-tabular">
                  {formatCurrency(salesForecast.predicted_total)}
                </div>
              </div>
              <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-3">
                <div className="text-xs text-[var(--text-muted)] mb-1">Daily Average</div>
                <div className="text-xl font-bold text-[var(--text-primary)] font-mono font-tabular">
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
                    stroke="var(--text-muted)" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => val.slice(0, 3)}
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `${getCurrencySymbol()}${(val/1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--bg-surface)', 
                      border: '1px solid var(--border-subtle)', 
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`${getCurrencySymbol()}${Math.round(value).toLocaleString()}`, 'Predicted']}
                    labelFormatter={(label) => label}
                  />
                  <ReferenceLine 
                    y={salesForecast.historical_avg} 
                    stroke="var(--border-subtle)" 
                    strokeDasharray="3 3"
                    label={{ value: 'Avg', position: 'right', fill: 'var(--text-muted)', fontSize: 10 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted_sales" 
                    stroke="var(--accent-primary)" 
                    strokeWidth={2} 
                    dot={{ fill: 'var(--accent-primary)', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, stroke: 'var(--accent-primary)', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Confidence Badge */}
            <div className="mt-4 text-center">
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                salesForecast.confidence === 'high' ? 'bg-[var(--status-success)]/15 text-[var(--status-success)]' :
                salesForecast.confidence === 'medium' ? 'bg-[var(--status-warning)]/15 text-[var(--status-warning)]' :
                'bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
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
            <TruckIcon className="w-5 h-5 text-[var(--status-info)]" />
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Restock Predictions
            </h2>
          </div>
          {restockData.critical_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-[var(--status-danger)] bg-[var(--status-danger)]/10 px-2 py-1 rounded-full font-semibold">
              <ExclamationTriangleIcon className="w-3 h-3" />
              {restockData.critical_count} Critical
            </span>
          )}
        </div>

        {isRestockLocked ? (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 p-5 min-h-[240px] flex flex-col justify-center items-center text-center">
            <TruckIcon className="w-12 h-12 text-[var(--status-info)]/60 mb-3" />
            <p className="text-[var(--text-primary)] font-semibold mb-1">Restock Predictions locked</p>
            <p className="text-sm text-[var(--text-muted)] max-w-sm">
              Upgrade to unlock restock predictions and automated replenishment insights.
            </p>
            <button
              type="button"
              onClick={() => promptUpgrade('Restock Predictions', 'Restock predictions are available on the higher tier that includes inventory intelligence.')}
              className="btn-secondary mt-4 text-xs px-3 py-2 rounded-lg"
            >
              Unlock Restock
            </button>
          </div>
        ) : restockItems.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="w-12 h-12 text-[var(--status-success)]/40 mx-auto mb-3" />
            <p className="text-sm text-[var(--text-muted)]">All products are well-stocked!</p>
            <p className="text-xs text-[var(--text-muted)]/80 mt-1">No urgent restocking needed</p>
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
                      <div className="text-sm font-medium text-[var(--text-primary)]">{item.product_name}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        Stock: {item.current_stock} • Sells {item.avg_daily_sales}/day
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${colors.text}`}>
                        {item.days_to_reorder <= 0 ? 'NOW!' : `${item.days_to_reorder}d`}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">to reorder</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <ClockIcon className="w-3 h-3" />
                      Stockout: {new Date(item.stockout_date).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        ...(new Date(item.stockout_date).getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {})
                      })}
                    </div>
                    <div className={`text-xs font-semibold ${colors.text}`}>
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
              className="text-xs text-[var(--accent-primary)] hover:underline font-semibold"
            >
              View all {restockItems.length} products →
            </button>
          </div>
        )}

        <UpgradePromptModal
          isOpen={upgradeModal.open}
          onClose={() => setUpgradeModal({ open: false, featureName: '', targetPlanName: 'Business', targetPlanCode: 'business', description: '' })}
          title="Upgrade to unlock"
          featureName={upgradeModal.featureName}
          targetPlanName={upgradeModal.targetPlanName}
          targetPlanCode={upgradeModal.targetPlanCode}
          description={upgradeModal.description}
        />
      </div>
    </section>
  );
}
