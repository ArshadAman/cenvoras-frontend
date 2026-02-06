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
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import api from '../api/api'
import Layout from '../components/Layout'

// Smart Dashboard Components
import PulseSection from '../components/dashboard/PulseSection'
import WarningsSection from '../components/dashboard/WarningsSection'
import InsightsSection from '../components/dashboard/InsightsSection'
import GstShieldSection from '../components/dashboard/GstShieldSection'
import MLPredictionsSection from '../components/dashboard/MLPredictionsSection'

// Skeleton for loading
function SkeletonCard() {
  return (
    <div className="bento-card !p-6 flex flex-col justify-between h-40 animate-pulse bg-white/5 border-white/5">
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

  // Refresh ALL dashboard data
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['smart-dashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    await queryClient.invalidateQueries({ queryKey: ['recent-sales'] });
    await queryClient.invalidateQueries({ queryKey: ['recent-purchases'] });
    await queryClient.invalidateQueries({ queryKey: ['low-stock'] });
    await queryClient.invalidateQueries({ queryKey: ['ml-predictions'] });
    setIsRefreshing(false);
  };

  // Fetch Smart Dashboard Data (new)
  const { data: smartData, isLoading: loadingSmart, isError: smartError, refetch } = useQuery({
    queryKey: ['smart-dashboard'],
    queryFn: () => api.get('/analytics/smart-dashboard/').then(res => res.data),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Fetch Legacy Dashboard Data (old metrics)
  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get('/analytics/dashboard/').then(res => res.data)
  });
  
  const { data: sales, isLoading: loadingSales } = useQuery({
    queryKey: ['recent-sales'],
    queryFn: () => api.get('/billing/sales-invoices/?ordering=-invoice_date&limit=5').then(res => res.data)
  });
  
  const { data: purchases, isLoading: loadingPurchases } = useQuery({
    queryKey: ['recent-purchases'],
    queryFn: () => api.get('/billing/purchase-bills/?ordering=-bill_date&limit=5').then(res => res.data)
  });
  
  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.get('/analytics/inventory-summary/').then(res => res.data)
  });

  // Fetch ML Predictions
  const { data: mlData, isLoading: loadingML } = useQuery({
    queryKey: ['ml-predictions'],
    queryFn: () => api.get('/analytics/ml-predictions/').then(res => res.data),
    staleTime: 60000, // Cache for 1 minute
  });

  // Navigation handlers
  const handleQuickAction = (action) => {
    if (action === 'sale') navigate('/sales');
    if (action === 'purchase') navigate('/purchase');
  };

  // Legacy card data
  const cardData = [
    {
      label: 'Total Sales',
      value: metrics?.total_sales ?? '--',
      icon: <CurrencyRupeeIcon className="w-6 h-6 text-cyan-400" />,
      color: 'text-cyan-400'
    },
    {
      label: 'Total Purchases',
      value: metrics?.total_purchases ?? '--',
      icon: <ShoppingBagIcon className="w-6 h-6 text-purple-400" />,
      color: 'text-purple-400'
    },
    {
      label: 'Inventory Value',
      value: metrics?.total_inventory_value ?? '--',
      icon: <CubeIcon className="w-6 h-6 text-blue-400" />,
      color: 'text-blue-400'
    },
    {
      label: 'Low Stock Items',
      value: metrics?.low_stock_count ?? '--',
      icon: <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />,
      color: 'text-red-400'
    },
    {
      label: metrics?.gst_payable < 0 ? 'GST Credit' : 'GST Payable',
      value: metrics?.gst_payable != null ? (metrics.gst_payable < 0 ? `₹${Math.abs(metrics.gst_payable).toLocaleString()}` : `₹${metrics.gst_payable.toLocaleString()}`) : '--',
      icon: <BanknotesIcon className="w-6 h-6 text-yellow-400" />,
      color: metrics?.gst_payable < 0 ? 'text-green-400' : 'text-yellow-400'
    },
  ];

  return (
    <Layout onLogout={onLogout}>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
              <SparklesIcon className="w-8 h-8 text-cyan-400" />
              Smart Dashboard
            </h1>
            <p className="text-gray-400 text-sm">Your intelligent business assistant</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleRefreshAll}
              disabled={isRefreshing || loadingSmart}
              className="btn-secondary text-sm py-2 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white disabled:opacity-50 flex items-center gap-2"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              onClick={() => handleQuickAction('sale')} 
              className="btn-secondary text-sm py-2 px-4 shadow-sm bg-white/5 border border-white/10 hover:bg-white/10 text-white"
            >
              <PlusIcon className="w-4 h-4"/> New Sale
            </button>
            <button 
              onClick={() => handleQuickAction('purchase')} 
              className="btn-primary text-sm py-2 px-4 shadow-lg shadow-cyan-500/20"
            >
              <PlusIcon className="w-4 h-4"/> New Purchase
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
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Overall Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {loadingMetrics
              ? Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : cardData.map((card, i) => (
                  <div key={i} className="bento-card !p-6 flex flex-col justify-between group hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl bg-white/5 ${card.color}`}>
                        {card.icon}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white mb-1 tracking-tight">{card.value}</div>
                      <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{card.label}</div>
                    </div>
                  </div>
              ))
            }
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
          />
        </div>

        {/* 4. ML PREDICTIONS - Sales Forecast & Restock */}
        <MLPredictionsSection 
          data={mlData} 
          isLoading={loadingML}
          onViewAllProducts={() => navigate('/inventory')}
        />

        {/* 5. CHARTS SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales vs Purchases Chart */}
          <div className="bento-card lg:col-span-2 !p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-gray-400" /> Sales vs Purchases
              </h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics?.sales_vs_purchases || []}>
                  <XAxis dataKey="name" stroke="#333" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#333" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    contentStyle={{ background: '#000', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} iconType="circle" />
                  <Line type="monotone" dataKey="Sales" stroke="#22d3ee" strokeWidth={2} dot={false} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="Purchases" stroke="#a855f7" strokeWidth={2} dot={false} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stock Splits Pie */}
          <div className="bento-card !p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <CubeIcon className="w-5 h-5 text-gray-400" /> Stock Splits
            </h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={(lowStock?.products || [])
                      .filter(p => p.stock > 0)
                      .slice(0, 5)
                      .map(p => ({ name: p.name, value: p.stock }))}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => 
                      percent > 0.05 
                        ? `${name.slice(0, 8)}${name.length > 8 ? '...' : ''} ${(percent * 100).toFixed(0)}%`
                        : ''
                    }
                    labelLine={false}
                  >
                    {(lowStock?.products || [])
                      .filter(p => p.stock > 0)
                      .slice(0, 5)
                      .map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#22d3ee', '#a855f7', '#3b82f6', '#f43f5e', '#10b981'][index % 5]} stroke="rgba(0,0,0,0)" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#000', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
                    formatter={(value, name) => [`${value} units`, name]}
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
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Recent Sales</h3>
              <button onClick={() => navigate('/sales')} className="text-xs text-cyan-400 hover:text-cyan-300">View All</button>
            </div>
            <div className="divide-y divide-white/5">
              {(loadingSales ? Array(5).fill({}) : (Array.isArray(sales) ? sales : sales?.data || sales?.results || [])).slice(0, 5).map((invoice, i) =>
                loadingSales ? (
                  <div key={i} className="p-4 animate-pulse flex gap-4">
                    <div className="h-10 w-10 bg-white/5 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 bg-white/5 rounded"></div>
                      <div className="h-3 w-1/4 bg-white/5 rounded"></div>
                    </div>
                  </div>
                ) : (
                  <div key={invoice.id || i} className="p-4 flex justify-between items-center hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => navigate(`/sales/${invoice.id}`)}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        <CurrencyRupeeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{invoice.customer_name || 'Walk-in Customer'}</div>
                        <div className="text-xs text-gray-500">{invoice.invoice_number}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">₹{invoice.total_amount}</div>
                      <div className="text-xs text-gray-500">{invoice.invoice_date}</div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Latest Purchases */}
          <div className="bento-card !p-0 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Latest Purchases</h3>
              <button onClick={() => navigate('/purchase')} className="text-xs text-purple-400 hover:text-purple-300">View All</button>
            </div>
            <div className="divide-y divide-white/5">
              {(loadingPurchases ? Array(5).fill({}) : (Array.isArray(purchases) ? purchases : purchases?.data || purchases?.results || [])).slice(0, 5).map((bill, i) =>
                loadingPurchases ? (
                  <div key={i} className="p-4 animate-pulse flex gap-4">
                    <div className="h-10 w-10 bg-white/5 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 bg-white/5 rounded"></div>
                      <div className="h-3 w-1/4 bg-white/5 rounded"></div>
                    </div>
                  </div>
                ) : (
                  <div key={bill.id || i} className="p-4 flex justify-between items-center hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => navigate(`/purchases/${bill.id}`)}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <ShoppingBagIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{bill.vendor_name || 'Vendor'}</div>
                        <div className="text-xs text-gray-500">{bill.bill_number}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">₹{bill.total_amount}</div>
                      <div className="text-xs text-gray-500">{bill.bill_date}</div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

      </div>
    </Layout>
  )
}