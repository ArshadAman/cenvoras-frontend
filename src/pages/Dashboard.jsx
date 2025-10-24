import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, CurrencyRupeeIcon, ShoppingBagIcon, CubeIcon, ExclamationTriangleIcon, BanknotesIcon, PlusIcon, ArrowUpTrayIcon, ChartBarIcon, UsersIcon } from '@heroicons/react/24/outline'
import api from '../api/api'
import Loader from '../components/Loader'
import Layout from '../components/Layout'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useNavigate } from 'react-router-dom'

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl h-40 flex flex-col justify-between" />
  )
}

export default function Dashboard({ onLogout }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateRange, setDateRange] = useState('month');
  const [purchaseDateFrom, setPurchaseDateFrom] = useState('');
  const [purchaseDateTo, setPurchaseDateTo] = useState('');
  const navigate = useNavigate();

  // Add clean theme CSS without distracting animations
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      .gradient-text {
        background: linear-gradient(-45deg, #7fd3f7, #b6e0f7, #eaf6fa, #7fd3f7);
        background-size: 400% 400%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .dashboard-bg {
        background: linear-gradient(135deg, #1a2341 0%, #2d3561 50%, #1a2341 100%);
        min-height: 100vh;
      }
      
      .glass-card {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 24px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
      }
      
      .glass-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 35px 70px rgba(0, 0, 0, 0.25);
        border-color: rgba(127, 211, 247, 0.3);
      }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  // Fetch metrics
  const { data: metrics, isLoading: loadingMetrics, error } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get('/analytics/dashboard/').then(res => res.data)
  })
  const { data: sales, isLoading: loadingSales } = useQuery({
    queryKey: ['recent-sales'],
    queryFn: () => api.get('/billing/sales-invoices/?ordering=-invoice_date&limit=5').then(res => res.data)
  })
  const { data: purchases, isLoading: loadingPurchases } = useQuery({
    queryKey: ['recent-purchases'],
    queryFn: () => api.get('/billing/purchase-bills/?ordering=-bill_date&limit=5').then(res => res.data)
  })
  const { data: lowStock, isLoading: loadingLowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.get('/analytics/inventory-summary/').then(res => res.data)
  })
  const { data: gstSummary, isLoading: loadingGstSummary } = useQuery({
    queryKey: ['gst-summary', dateFrom, dateTo],
    queryFn: () =>
      api
        .get('/analytics/gst-summary/', {
          params: {
            ...(dateFrom && { date_from: dateFrom }),
            ...(dateTo && { date_to: dateTo }),
          },
        })
        .then(res => res.data),
  })
  const { data: purchaseSummary, isLoading: loadingPurchaseSummary } = useQuery({
    queryKey: ['purchase-summary'],
    queryFn: () => api.get('/analytics/purchase-summary/').then(res => res.data)
  })
  const { data: salesSummary, isLoading: loadingSalesSummary } = useQuery({
    queryKey: ['sales-summary', dateFrom, dateTo],
    queryFn: () =>
      api.get('/analytics/sales-summary/', {
        params: {
          ...(dateFrom && { date_from: dateFrom }),
          ...(dateTo && { date_to: dateTo }),
        },
      }).then(res => res.data)
});

  // Quick Actions
  const handleQuickAction = (action) => {
    toast.info(`${action} clicked!`)
  }

  // Add this function
  const handleLogout = () => {
    localStorage.removeItem('token')
    if (onLogout) onLogout() // update auth state in App
    navigate('/login')
  }

  // Card data mapping with new gradient theme
  const cardData = [
    {
      label: 'Total Sales',
      value: metrics?.total_sales ?? '--',
      icon: <CurrencyRupeeIcon className="w-10 h-10" />,
      gradient: 'from-[#7fd3f7] to-[#b6e0f7]',
      bgGradient: 'bg-gradient-to-br from-[#7fd3f7]/20 to-[#b6e0f7]/20'
    },
    {
      label: 'Total Purchases',
      value: metrics?.total_purchases ?? '--',
      icon: <ShoppingBagIcon className="w-10 h-10" />,
      gradient: 'from-[#b6e0f7] to-[#eaf6fa]',
      bgGradient: 'bg-gradient-to-br from-[#b6e0f7]/20 to-[#eaf6fa]/20'
    },
    {
      label: 'Total Inventory Value',
      value: metrics?.total_inventory_value ?? '--',
      icon: <CubeIcon className="w-10 h-10" />,
      gradient: 'from-[#eaf6fa] to-[#7fd3f7]',
      bgGradient: 'bg-gradient-to-br from-[#eaf6fa]/20 to-[#7fd3f7]/20'
    },
    {
      label: 'Low Stock Products',
      value: metrics?.low_stock_count ?? '--',
      icon: <ExclamationTriangleIcon className="w-10 h-10" />,
      gradient: 'from-[#ff6b6b] to-[#ffa8a8]',
      bgGradient: 'bg-gradient-to-br from-[#ff6b6b]/20 to-[#ffa8a8]/20'
    },
    {
      label: 'GST Payable',
      value: metrics?.gst_payable ?? '--',
      icon: <BanknotesIcon className="w-10 h-10" />,
      gradient: 'from-[#ffd93d] to-[#6bcf7f]',
      bgGradient: 'bg-gradient-to-br from-[#ffd93d]/20 to-[#6bcf7f]/20'
    },
  ]

  // New function for exporting GST summary as CSV
  const handleExportGstCsv = async () => {
    try {
      const response = await api.get('/analytics/gst-summary/', {
        params: {
          ...(dateFrom && { date_from: dateFrom }),
          ...(dateTo && { date_to: dateTo }),
          export: 'csv',
        },
        responseType: 'blob', // Important for file download
      });
      // Create a link to download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'gst-summary.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to export GST summary.');
    }
  };

  // New function for exporting Inventory summary as CSV
  const handleExportInventoryCsv = async () => {
    try {
      const response = await api.get('/analytics/inventory-summary/', {
        params: { export: 'csv' },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory-summary.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to export inventory summary.');
    }
  };

  // New function for exporting Purchase summary as CSV
  const handleExportPurchaseCsv = async () => {
    try {
      const response = await api.get('/analytics/purchase-summary/', {
        params: {
          ...(dateFrom && { date_from: dateFrom }),
          ...(dateTo && { date_to: dateTo }),
          export: 'csv',
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'purchase-summary.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to export purchase summary.');
    }
  };

  // New function for exporting Sales summary as CSV
  const handleExportSalesCsv = async () => {
    try {
      const response = await api.get('/analytics/sales-summary/', {
        params: {
          ...(dateFrom && { date_from: dateFrom }),
          ...(dateTo && { date_to: dateTo }),
          export: 'csv',
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sales-summary.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to export sales summary.');
    }
  };

  // Combine sales and purchase data by date for the chart
  const salesVsPurchasesData = useMemo(() => {
    // Assume salesSummary.sales_by_date and purchaseSummary.purchases_by_date are arrays like [{date: '2024-07-01', total_sales: 1000}]
    const salesByDate = salesSummary?.sales_by_date || [];
    const purchasesByDate = purchaseSummary?.purchases_by_date || [];

    // Create a map for quick lookup
    const salesMap = Object.fromEntries(salesByDate.map(item => [item.date, item.total_sales]));
    const purchasesMap = Object.fromEntries(purchasesByDate.map(item => [item.date, item.total_purchases]));

    // Get all unique dates
    const allDates = Array.from(new Set([...salesByDate.map(i => i.date), ...purchasesByDate.map(i => i.date)])).sort();

    // Build the combined array
    return allDates.map(date => ({
      date,
      Sales: salesMap[date] || 0,
      Purchases: purchasesMap[date] || 0,
    }));
  }, [salesSummary, purchaseSummary]);

  return (
    <Layout onLogout={onLogout}>
      <main className="dashboard-bg flex-1">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
          {/* Dashboard Header */}
          <div className="text-center mb-8 lg:mb-12">
            <h1 className="gradient-text text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4">
              Business Dashboard
            </h1>
            <p className="text-[#b6e0f7]/80 text-sm sm:text-base lg:text-lg xl:text-xl max-w-2xl mx-auto px-4">
              Monitor your business performance with real-time insights and analytics
            </p>
            <div className="w-16 sm:w-20 lg:w-24 h-1 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] rounded-full mx-auto mt-4"></div>
          </div>

          {/* Metric Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
            {loadingMetrics
              ? Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : cardData.map((card, i) => (
                  <div
                    key={card.label}
                    className={`glass-card p-4 sm:p-6 relative overflow-hidden group cursor-pointer ${card.bgGradient}`}
                  >
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-2 sm:p-3 rounded-2xl bg-gradient-to-r ${card.gradient} shadow-lg`}>
                          <div className="text-white">
                            {card.icon}
                          </div>
                        </div>
                        <ArrowTrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#7fd3f7]/60" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                          {card.value}
                        </div>
                        <div className="text-[#b6e0f7]/80 text-xs sm:text-sm font-medium">
                          {card.label}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            }
          </section>

          {/* Analytics Charts */}
          <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Sales vs Purchases */}
            <div className="glass-card p-4 sm:p-6 group">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
                  <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#7fd3f7]" />
                  Sales vs Purchases
                </h3>
                <select
                  value={dateRange}
                  onChange={e => setDateRange(e.target.value)}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50"
                >
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-2 sm:p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={metrics?.sales_vs_purchases || []}>
                    <XAxis dataKey="name" stroke="#b6e0f7" fontSize={10} />
                    <YAxis stroke="#b6e0f7" fontSize={10} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: '#ffffff'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Sales" stroke="#7fd3f7" strokeWidth={2} dot={{fill: '#7fd3f7', strokeWidth: 1, r: 3}} />
                    <Line type="monotone" dataKey="Purchases" stroke="#b6e0f7" strokeWidth={2} dot={{fill: '#b6e0f7', strokeWidth: 1, r: 3}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Inventory Distribution */}
            <div className="glass-card p-4 sm:p-6 group">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
                  <CubeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#7fd3f7]" />
                  Inventory Distribution
                </h3>
                <button
                  onClick={handleExportInventoryCsv}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] text-[#1a2341] font-semibold rounded-xl hover:from-[#6bc9f2] hover:to-[#a8d8f4] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-xs sm:text-sm"
                >
                  Export CSV
                </button>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-2 sm:p-4 flex justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={(lowStock?.products || []).map(product => ({
                        name: product.name,
                        value: product.stock,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#7fd3f7"
                      label={{fill: '#ffffff', fontSize: 10}}
                    >
                      {(lowStock?.products || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#7fd3f7', '#b6e0f7', '#eaf6fa', '#ffd93d', '#6bcf7f'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: '#ffffff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GST Collected/Paid */}
            <div className="glass-card p-4 sm:p-6 group">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
                  <BanknotesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#7fd3f7]" />
                  GST Collected / Paid
                </h3>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-2 sm:p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={metrics?.gst_collected_paid || []}>
                    <XAxis dataKey="name" stroke="#b6e0f7" fontSize={10} />
                    <YAxis stroke="#b6e0f7" fontSize={10} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: '#ffffff'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Collected" fill="#ffd93d" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Paid" fill="#7fd3f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="mb-8">
            <div className="text-center mb-8">
              <h2 className="gradient-text text-3xl lg:text-4xl font-bold mb-2">
                Quick Actions
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] rounded-full mx-auto"></div>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => handleQuickAction('Add Sale')}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] text-[#1a2341] font-bold rounded-2xl hover:from-[#6bc9f2] hover:to-[#a8d8f4] transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
              >
                <PlusIcon className="w-5 h-5" /> Add Sale
              </button>
              <button
                onClick={() => handleQuickAction('Add Purchase')}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#6bcf7f] to-[#51cf66] text-white font-bold rounded-2xl hover:from-[#5cbf73] hover:to-[#47c462] transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
              >
                <PlusIcon className="w-5 h-5" /> Add Purchase
              </button>
              <button
                onClick={() => handleQuickAction('Add Product')}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] text-white font-bold rounded-2xl hover:from-[#9c88fc] hover:to-[#8047f8] transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
              >
                <PlusIcon className="w-5 h-5" /> Add Product
              </button>
              <button
                onClick={() => handleQuickAction('Upload CSV')}
                className="flex items-center gap-3 px-6 py-3 glass-card text-white font-bold hover:bg-white/20 transition-all duration-300"
              >
                <ArrowUpTrayIcon className="w-5 h-5" /> Upload CSV
              </button>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Sales */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <CurrencyRupeeIcon className="w-6 h-6 text-[#7fd3f7]" />
                <h3 className="text-xl font-bold text-white">Recent Sales Invoices</h3>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 space-y-3">
                {(loadingSales ? Array(5).fill({}) : sales?.results || []).map((invoice, i) =>
                  loadingSales ? (
                    <div key={i} className="animate-pulse h-16 bg-white/10 rounded-xl" />
                  ) : (
                    <div key={invoice.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300">
                      <div>
                        <div className="text-white font-semibold">{invoice.invoice_number || 'INV-XXX'}</div>
                        <div className="text-[#b6e0f7]/70 text-sm">{invoice.invoice_date}</div>
                      </div>
                      <a href={`/sales/${invoice.id}`} className="px-3 py-1 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] text-[#1a2341] font-semibold rounded-lg hover:from-[#6bc9f2] hover:to-[#a8d8f4] transition-all duration-300 text-sm">
                        View
                      </a>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Recent Purchases */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <ShoppingBagIcon className="w-6 h-6 text-[#7fd3f7]" />
                <h3 className="text-xl font-bold text-white">Recent Purchase Bills</h3>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 space-y-3">
                {(loadingPurchases ? Array(5).fill({}) : purchases?.results || []).map((bill, i) =>
                  loadingPurchases ? (
                    <div key={i} className="animate-pulse h-16 bg-white/10 rounded-xl" />
                  ) : (
                    <div key={bill.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300">
                      <div>
                        <div className="text-white font-semibold">{bill.bill_number || 'BILL-XXX'}</div>
                        <div className="text-[#b6e0f7]/70 text-sm">{bill.bill_date}</div>
                      </div>
                      <a href={`/purchases/${bill.id}`} className="px-3 py-1 bg-gradient-to-r from-[#6bcf7f] to-[#51cf66] text-white font-semibold rounded-lg hover:from-[#5cbf73] hover:to-[#47c462] transition-all duration-300 text-sm">
                        View
                      </a>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <ExclamationTriangleIcon className="w-6 h-6 text-[#ff6b6b]" />
                <h3 className="text-xl font-bold text-white">Low Stock Alerts</h3>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 space-y-3">
                {(loadingLowStock ? Array(5).fill({}) : lowStock?.low_stock_alerts || []).map((item, i) =>
                  loadingLowStock ? (
                    <div key={i} className="animate-pulse h-16 bg-white/10 rounded-xl" />
                  ) : (
                    <div key={item.id || i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300">
                      <div>
                        <div className="text-white font-semibold">
                          {item.name || 'Product'}
                        </div>
                        <div className="text-[#b6e0f7]/70 text-sm">HSN: {item.hsn_code}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#ff6b6b] font-bold text-lg">
                          {item.stock} {item.unit}
                        </div>
                        <div className="text-[#ff6b6b]/70 text-sm">remaining</div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>

          {/* Export Actions */}
          <section className="text-center">
            <div className="glass-card p-8 inline-block">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center justify-center gap-3">
                <ArrowUpTrayIcon className="w-7 h-7 text-[#7fd3f7]" />
                Export Reports
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={handleExportGstCsv}
                  className="px-6 py-3 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] text-[#1a2341] font-bold rounded-2xl hover:from-[#6bc9f2] hover:to-[#a8d8f4] transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
                >
                  Export GST Summary
                </button>
                <button
                  onClick={handleExportSalesCsv}
                  className="px-6 py-3 bg-gradient-to-r from-[#6bcf7f] to-[#51cf66] text-white font-bold rounded-2xl hover:from-[#5cbf73] hover:to-[#47c462] transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
                >
                  Export Sales Report
                </button>
                <button
                  onClick={handleExportInventoryCsv}
                  className="px-6 py-3 bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] text-white font-bold rounded-2xl hover:from-[#9c88fc] hover:to-[#8047f8] transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
                >
                  Export Inventory
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>
    </Layout>
  )
}