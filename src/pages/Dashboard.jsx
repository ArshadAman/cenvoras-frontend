import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  PlusIcon, 
  SparklesIcon,
  ArrowPathIcon,
  CurrencyRupeeIcon,
  ShoppingBagIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'
import api from '../api/api'

// Smart Dashboard Components
import PulseSection from '../components/dashboard/PulseSection'
import WarningsSection from '../components/dashboard/WarningsSection'
import InsightsSection from '../components/dashboard/InsightsSection'
import GstShieldSection from '../components/dashboard/GstShieldSection'
import MLPredictionsSection from '../components/dashboard/MLPredictionsSection'
import ExpiryCard from '../components/dashboard/ExpiryCard'
import { getSubscriptionEntitlements } from '../api/subscription'
import { getKolkataMonthBounds } from '../utils/date'
import { getGSTR1Export } from '../api/gst'
import { getCurrencySymbol, formatCurrency } from '../utils/currency';

// Skeleton for loading
function SkeletonCard() {
  return (
    <div className="bento-card !p-6 flex flex-col justify-between h-40 animate-pulse bg-[var(--bg-surface)] border-[var(--border-subtle)]">
      <div className="flex justify-between items-start">
        <div className="h-10 w-10 bg-white/10 rounded-xl"></div>
      </div>
      <div className="space-y-3">
        <div className="h-8 w-32 bg-white/10 rounded-lg"></div>
        <div className="h-4 w-20 bg-white/5 rounded"></div>
      </div>
    </div>
  )
}

export default function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [activeStockIndex, setActiveStockIndex] = React.useState(null);

  // Refresh ALL dashboard data
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all(
        [
          refetchSmart(),
          refetchMetrics(),
          refetchSales(),
          refetchPurchases(),
          refetchLowStock(),
          refetchStockPoints(),
          refetchML(),
          queryClient.invalidateQueries({ queryKey: ['customers'] }),
          queryClient.invalidateQueries({ queryKey: ['customers-with-balance'] }),
          queryClient.invalidateQueries({ queryKey: ['profile'] }),
          queryClient.invalidateQueries({ queryKey: ['subscription-entitlements'] }),
        ]
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch Smart Dashboard Data (new)
  const { data: smartData, isLoading: loadingSmart, isError: smartError, refetch: refetchSmart } = useQuery({
    queryKey: ['smart-dashboard'],
    queryFn: () => api.get('/analytics/smart-dashboard/?refresh=true').then(res => res.data),
    refetchInterval: 60000,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  });

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/profile/').then(res => res.data),
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription-entitlements'],
    queryFn: getSubscriptionEntitlements,
    staleTime: 60_000,
  });

  // Fetch Legacy Dashboard Data (old metrics)
  const { data: metrics, isLoading: loadingMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get('/analytics/dashboard/?refresh=true').then(res => res.data)
  });
  
  const { data: sales, isLoading: loadingSales, refetch: refetchSales } = useQuery({
    queryKey: ['recent-sales'],
    queryFn: () => api.get('/billing/sales-invoices/?status=final&ordering=-invoice_date&limit=5').then(res => res.data)
  });
  
  const { data: purchases, isLoading: loadingPurchases, refetch: refetchPurchases } = useQuery({
    queryKey: ['recent-purchases'],
    queryFn: () => api.get('/billing/purchase-bills/?ordering=-bill_date&limit=5').then(res => res.data)
  });
  
  const { data: lowStock, refetch: refetchLowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.get('/analytics/inventory-summary/').then(res => res.data)
  });

  const { data: stockPointsRaw, refetch: refetchStockPoints } = useQuery({
    queryKey: ['stock-points-dashboard'],
    queryFn: () => api.get('/inventory/stock-points/').then(res => res.data),
    staleTime: 30000,
  });

  // Fetch ML Predictions
  const { data: mlData, isLoading: loadingML, refetch: refetchML } = useQuery({
    queryKey: ['ml-predictions'],
    queryFn: () => api.get('/analytics/ml-predictions/').then(res => res.data),
    staleTime: 60000, // Cache for 1 minute
  });

  // Navigation handlers
  const handleQuickAction = (action) => {
    if (action === 'sale') navigate('/sales');
    if (action === 'purchase') navigate('/purchase');
  };

  const handleDownloadReportForCA = async () => {
    const { from: fromDate, to: toDate } = getKolkataMonthBounds();

    try {
      const gstr1Data = await getGSTR1Export(fromDate, toDate);
      const blob = new Blob([JSON.stringify(gstr1Data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GSTR1_${gstr1Data?.fp || `${fromDate}_to_${toDate}`}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download GSTR-1 report for CA:', error);
      navigate('/reports/tax-register?tab=gstr1');
    }
  };

  // Financial Ticker Card Data
  const cardData = [
    {
      label: 'Total Sales',
      value: metrics?.total_sales != null ? `${getCurrencySymbol()}${Number(metrics.total_sales).toLocaleString('en-IN')}` : '--',
      icon: <CurrencyRupeeIcon className="w-6 h-6 text-[var(--status-info)]" />,
      color: 'text-[var(--status-info)]'
    },
    {
      label: 'Total Purchases',
      value: metrics?.total_purchases != null ? `${getCurrencySymbol()}${Number(metrics.total_purchases).toLocaleString('en-IN')}` : '--',
      icon: <ShoppingBagIcon className="w-6 h-6 text-[var(--accent-secondary)]" />,
      color: 'text-[var(--accent-secondary)]'
    },
    {
      label: 'Inventory Value',
      value: metrics?.total_inventory_value != null ? `${getCurrencySymbol()}${Number(metrics.total_inventory_value).toLocaleString('en-IN')}` : '--',
      icon: <CubeIcon className="w-6 h-6 text-[var(--accent-primary)]" />,
      color: 'text-[var(--accent-primary)]'
    },
    {
      label: 'Low Stock Items',
      value: metrics?.low_stock_count ?? '--',
      icon: <ExclamationTriangleIcon className="w-6 h-6 text-[var(--status-danger)]" />,
      color: 'text-[var(--status-danger)]'
    },
    {
      label: metrics?.gst_payable < 0 ? 'GST Credit' : 'GST Payable',
      value: metrics?.gst_payable != null
        ? `${getCurrencySymbol()}${Math.abs(Number(metrics.gst_payable)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '--',
      icon: <BanknotesIcon className="w-6 h-6 text-[var(--status-warning)]" />,
      color: metrics?.gst_payable < 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-warning)]'
    },
  ];

  const formatINR = (value) => `${getCurrencySymbol()}${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const salesChartData = React.useMemo(() => {
    const raw = Array.isArray(metrics?.sales_vs_purchases) ? metrics.sales_vs_purchases : [];
    return raw.map((row) => ({
      name: row?.name || row?.month || '-',
      Sales: Number(row?.Sales ?? row?.sales ?? 0),
      Purchases: Number(row?.Purchases ?? row?.purchases ?? 0),
    }));
  }, [metrics?.sales_vs_purchases]);

  const stockSplitData = React.useMemo(() => {
    const stockPoints = Array.isArray(stockPointsRaw)
      ? stockPointsRaw
      : stockPointsRaw?.data || stockPointsRaw?.results || [];

    // Use stock points as source of truth because product.stock can be stale with multi-batch/multi-warehouse inventory.
    if (stockPoints.length > 0) {
      const merged = stockPoints.reduce((acc, item) => {
        const key = item?.product_name || 'Unknown';
        const quantity = Number(item?.quantity || 0);
        if (!acc[key]) {
          acc[key] = { name: key, value: 0 };
        }
        acc[key].value += quantity;
        return acc;
      }, {});

      return Object.values(merged)
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 7);
    }

    const fallbackProducts = lowStock?.products || [];
    return fallbackProducts
      .map((p) => ({ name: p?.name || 'Unknown', value: Number(p?.stock || 0) }))
      .filter((p) => p.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [stockPointsRaw, lowStock]);

  const stockTotal = stockSplitData.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const stockColors = ['var(--accent-primary)', 'var(--accent-secondary)', 'var(--status-info)', 'var(--status-success)', 'var(--status-warning)', 'var(--status-danger)', 'var(--text-muted)'];
  const entitlements = subscriptionData?.data || {};
  const can = entitlements.can || {};
  const currentPlanName = entitlements.plan?.name || profileData?.profile?.plan_name || 'Starter';
  const mlDataWithEntitlements = React.useMemo(() => ({
    ...mlData,
    can,
  }), [mlData, can]);

  return (
    <>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1 flex items-center gap-3">
              <SparklesIcon className="w-8 h-8 text-[var(--accent-primary)]" />
              {(profileData?.profile?.business_name || profileData?.profile?.parent_business_name) 
                ? `${profileData.profile.business_name || profileData.profile.parent_business_name} Smart Dashboard` 
                : 'Smart Dashboard'}
            </h1>
            <p className="text-[var(--text-muted)] text-sm">Your intelligent business assistant</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-secondary)]">
              <span className="text-[var(--accent-primary)] font-semibold">{currentPlanName}</span>
              <span className="text-[var(--text-muted)]">plan active</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              onClick={() => handleQuickAction('sale')} 
              className="btn-primary text-sm py-2 px-4"
            >
              <PlusIcon className="w-4 h-4"/> Record Sales
            </button>
          </div>
        </div>

        {/* 1. TODAY'S PULSE (New Smart Feature) */}
        <PulseSection 
          data={smartData?.pulse} 
          isLoading={loadingSmart} 
        />

        {/* 2. LEGACY OVERVIEW CARDS (Total Sales, Purchases, etc.) */}
        <section>
          <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">Overall Financial Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {loadingMetrics
              ? Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : cardData.map((card, i) => (
                  <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 flex flex-col justify-between group hover:border-[var(--accent-primary)]/40 transition-all shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] ${card.color}`}>
                        {card.icon}
                      </div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[var(--text-primary)] mb-1 tracking-tight font-mono font-tabular">{card.value}</div>
                      <div className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">{card.label}</div>
                    </div>
                  </div>
              ))
            }
            {/* Expiry Card */}
            <ExpiryCard />
          </div>
        </section>

        {/* 3. WARNINGS + INSIGHTS + GST SHIELD Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <WarningsSection 
            data={smartData?.warnings} 
            healthStatus={smartData?.health_status}
            isLoading={loadingSmart} 
          />
          <InsightsSection 
            data={smartData?.insights} 
            isLoading={loadingSmart} 
          />
          <GstShieldSection 
            data={smartData?.gst_shield} 
            isLoading={loadingSmart} 
            onDownloadReport={handleDownloadReportForCA}
          />
        </div>

        {/* 4. ML PREDICTIONS - Sales Forecast & Restock */}
        <MLPredictionsSection 
          data={mlDataWithEntitlements} 
          isLoading={loadingML}
          onViewAllProducts={() => navigate('/inventory')}
        />

        {/* 5. CHARTS SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales vs Purchases Chart */}
          <div className="bento-card lg:col-span-2 !p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-[var(--text-muted)]" /> Sales vs Purchases
              </h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesChartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={86}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)' }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                    itemStyle={{ color: 'var(--text-secondary)' }}
                    formatter={(value, key) => [formatCurrency(value), key]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px', color: 'var(--text-secondary)' }} iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey="Sales"
                    stroke="var(--accent-primary)"
                    strokeWidth={3}
                    connectNulls
                    dot={{ r: 3, fill: 'var(--accent-primary)', strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: 'var(--accent-primary)', stroke: 'var(--bg-primary)', strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Purchases"
                    stroke="var(--accent-secondary)"
                    strokeWidth={3}
                    connectNulls
                    dot={{ r: 3, fill: 'var(--accent-secondary)', strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: 'var(--accent-secondary)', stroke: 'var(--bg-primary)', strokeWidth: 1 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stock Splits Pie */}
          <div className="bento-card !p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 mb-6">
              <CubeIcon className="w-5 h-5 text-[var(--text-muted)]" /> Stock Splits
            </h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockSplitData}
                    innerRadius={50}
                    outerRadius={76}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    onMouseEnter={(_, index) => setActiveStockIndex(index)}
                    onMouseLeave={() => setActiveStockIndex(null)}
                    label={({ name, percent }) => 
                      percent > 0.06 
                        ? `${name.slice(0, 8)}${name.length > 8 ? '...' : ''} ${(percent * 100).toFixed(0)}%`
                        : ''
                    }
                    labelLine={false}
                  >
                    {stockSplitData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={stockColors[index % stockColors.length]}
                        stroke={index === activeStockIndex ? 'var(--text-primary)' : 'rgba(0,0,0,0)'}
                        strokeWidth={index === activeStockIndex ? 1.4 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)' }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                    itemStyle={{ color: 'var(--text-secondary)' }}
                    formatter={(value, name) => {
                      const qty = Number(value || 0);
                      const pct = stockTotal > 0 ? ((qty / stockTotal) * 100).toFixed(1) : '0.0';
                      return [`${qty.toLocaleString('en-IN')} units (${pct}%)`, name || 'Product'];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* 5. RECENT ACTIVITY LISTS */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <div className="bento-card !p-0 overflow-hidden">
            <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Recent Sales</h3>
              <button onClick={() => navigate('/sales')} className="text-xs text-[var(--accent-primary)] hover:underline font-semibold">View All</button>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {(loadingSales ? Array(5).fill({}) : (Array.isArray(sales) ? sales : sales?.data || sales?.results || [])).slice(0, 5).map((invoice, i) =>
                loadingSales ? (
                  <div key={i} className="p-4 animate-pulse flex gap-4">
                    <div className="h-10 w-10 bg-[var(--border-subtle)] rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 bg-[var(--border-subtle)] rounded"></div>
                      <div className="h-3 w-1/4 bg-[var(--border-subtle)] rounded"></div>
                    </div>
                  </div>
                ) : (
                  <div key={invoice.id || i} className="p-4 flex justify-between items-center hover:bg-[var(--bg-primary)]/40 transition-colors cursor-pointer" onClick={() => navigate(`/sales/${invoice.id}`)}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--status-info)]">
                        <CurrencyRupeeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--text-primary)]">{invoice.customer_name || 'Walk-in Customer'}</div>
                        <div className="text-xs text-[var(--text-muted)]">{invoice.invoice_number}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(invoice.total_amount)}</div>
                      <div className="text-xs text-[var(--text-muted)]">{invoice.invoice_date}</div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Latest Purchases */}
          <div className="bento-card !p-0 overflow-hidden">
            <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Latest Purchases</h3>
              <button onClick={() => navigate('/purchase')} className="text-xs text-[var(--accent-primary)] hover:underline font-semibold">View All</button>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {(loadingPurchases ? Array(5).fill({}) : (Array.isArray(purchases) ? purchases : purchases?.data || purchases?.results || [])).slice(0, 5).map((bill, i) =>
                loadingPurchases ? (
                  <div key={i} className="p-4 animate-pulse flex gap-4">
                    <div className="h-10 w-10 bg-[var(--border-subtle)] rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 bg-[var(--border-subtle)] rounded"></div>
                      <div className="h-3 w-1/4 bg-[var(--border-subtle)] rounded"></div>
                    </div>
                  </div>
                ) : (
                  <div key={bill.id || i} className="p-4 flex justify-between items-center hover:bg-[var(--bg-primary)]/40 transition-colors cursor-pointer" onClick={() => navigate(`/purchases/${bill.id}`)}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-secondary)]">
                        <ShoppingBagIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--text-primary)]">{bill.vendor_name || 'Vendor'}</div>
                        <div className="text-xs text-[var(--text-muted)]">{bill.bill_number}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(bill.total_amount)}</div>
                      <div className="text-xs text-[var(--text-muted)]">{bill.bill_date}</div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

      </div>
    </>
  )
}