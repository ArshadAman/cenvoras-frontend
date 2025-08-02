import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, CurrencyRupeeIcon, ShoppingBagIcon, CubeIcon, ExclamationTriangleIcon, BanknotesIcon, PlusIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import api from '../api/api'
import Loader from '../components/Loader'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useNavigate, Link } from 'react-router-dom'

const cardIcons = [
  <CurrencyRupeeIcon className="w-8 h-8 text-blue-500" />,
  <ShoppingBagIcon className="w-8 h-8 text-green-500" />,
  <CubeIcon className="w-8 h-8 text-purple-500" />,
  <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />,
  <BanknotesIcon className="w-8 h-8 text-yellow-500" />,
]

const cardColors = [
  "bg-blue-100 dark:bg-blue-900",
  "bg-green-100 dark:bg-green-900",
  "bg-purple-100 dark:bg-purple-900",
  "bg-red-100 dark:bg-red-900",
  "bg-yellow-100 dark:bg-yellow-900",
]

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg p-6 bg-gray-200 dark:bg-gray-700 h-32 flex flex-col justify-between" />
  )
}

export default function Dashboard({ onLogout }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateRange, setDateRange] = useState('month'); // <-- Add this line
  const [purchaseDateFrom, setPurchaseDateFrom] = useState('');
  const [purchaseDateTo, setPurchaseDateTo] = useState('');
  const navigate = useNavigate();

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

  // Card data mapping
  const cardData = [
    {
      label: 'Total Sales',
      value: metrics?.total_sales ?? '--',
      icon: <CurrencyRupeeIcon className="w-8 h-8 text-blue-500" />,
      color: "bg-blue-100 dark:bg-blue-900",
    },
    {
      label: 'Total Purchases',
      value: metrics?.total_purchases ?? '--',
      icon: <ShoppingBagIcon className="w-8 h-8 text-green-500" />,
      color: "bg-green-100 dark:bg-green-900",
    },
    {
      label: 'Total Inventory Value',
      value: metrics?.total_inventory_value ?? '--',
      icon: <CubeIcon className="w-8 h-8 text-purple-500" />,
      color: "bg-purple-100 dark:bg-purple-900",
    },
    {
      label: 'Low Stock Products',
      value: metrics?.low_stock_count ?? '--',
      icon: <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />,
      color: "bg-red-100 dark:bg-red-900",
    },
    {
      label: 'GST Payable',
      value: metrics?.gst_payable ?? '--',
      icon: <BanknotesIcon className="w-8 h-8 text-yellow-500" />,
      color: "bg-yellow-100 dark:bg-yellow-900",
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
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="h-16 flex items-center justify-center font-bold text-xl text-blue-600 dark:text-blue-400">ERP</div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link to="/" className="block px-4 py-2 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold">Dashboard</Link>
          <a href="#" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Sales</a>
          <Link
            to="/purchase"
            className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Purchases
          </Link>
          <a href="#" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Inventory</a>
          <a href="#" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Clients</a>
          <a href="#" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Analytics</a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
              <span className="sr-only">Open sidebar</span>
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="font-bold text-lg text-gray-900 dark:text-white">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Dark mode toggle */}
            <button
              onClick={() => document.documentElement.classList.toggle('dark')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Toggle dark mode"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 4.66l-.71-.71M4.05 4.05l-.71-.71" /></svg>
            </button>
            {/* Notifications */}
            <button className="relative p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
            {/* User avatar */}
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200">A</div>
          </div>
        </header>

        {/* Main Dashboard */}
        <main className="flex-1 p-6 space-y-8">
          {/* Metric Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {loadingMetrics
              ? Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : cardData.map((card, i) => (
                  <div
                    key={card.label}
                    className={`rounded-lg p-6 shadow transition-transform duration-200 hover:scale-105 cursor-pointer flex flex-col gap-2 ${card.color}`}
                  >
                    <div className="flex items-center gap-3">
                      {card.icon}
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 dark:text-gray-200">{card.label}</span>
                    </div>
                  </div>
                ))
            }
          </section>

          {/* Charts */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales vs Purchases */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">Sales vs Purchases</span>
                <select
                  value={dateRange}
                  onChange={e => setDateRange(e.target.value)}
                  className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-sm"
                >
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={metrics?.sales_vs_purchases || []}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Sales" stroke="#2563eb" strokeWidth={2} />
                  <Line type="monotone" dataKey="Purchases" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Inventory Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center">
              <div className="flex w-full justify-between items-center mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">Inventory Distribution</span>
                <button
                  onClick={handleExportInventoryCsv}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  title="Export Inventory as CSV"
                >
                  Export CSV
                </button>
              </div>
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
                    outerRadius={70}
                    fill="#6366f1"
                    label
                  >
                    {(lowStock?.products || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#6366f1', '#22d3ee', '#f59e42', '#f43f5e', '#22c55e'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* GST Collected/Paid */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <span className="font-semibold text-gray-900 dark:text-white mb-2 block">GST Collected / Paid</span>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics?.gst_collected_paid || []}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Collected" fill="#f59e42" />
                  <Bar dataKey="Paid" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="flex flex-wrap gap-4">
            <button
              onClick={() => handleQuickAction('Add Sale')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              <PlusIcon className="w-5 h-5" /> Add Sale
            </button>
            <button
              onClick={() => handleQuickAction('Add Purchase')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              <PlusIcon className="w-5 h-5" /> Add Purchase
            </button>
            <button
              onClick={() => handleQuickAction('Add Product')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              <PlusIcon className="w-5 h-5" /> Add Product
            </button>
            <button
              onClick={() => handleQuickAction('Upload CSV')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition"
            >
              <ArrowUpTrayIcon className="w-5 h-5" /> Upload CSV
            </button>
          </section>

          {/* Tables/Lists */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Sales */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <span className="font-semibold text-gray-900 dark:text-white mb-2 block">Recent Sales Invoices</span>
              <ul>
                {(loadingSales ? Array(5).fill({}) : sales?.results || []).map((invoice, i) =>
                  loadingSales ? (
                    <li key={i} className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded my-2" />
                  ) : (
                    <li key={invoice.id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span>{invoice.invoice_number || 'INV-XXX'}</span>
                      <span className="text-sm text-gray-500">{invoice.invoice_date}</span>
                      <a href={`/sales/${invoice.id}`} className="text-blue-600 hover:underline text-sm">Details</a>
                    </li>
                  )
                )}
              </ul>
            </div>
            {/* Recent Purchases */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <span className="font-semibold text-gray-900 dark:text-white mb-2 block">Recent Purchase Bills</span>
              <ul>
                {(loadingPurchases ? Array(5).fill({}) : purchases?.results || []).map((bill, i) =>
                  loadingPurchases ? (
                    <li key={i} className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded my-2" />
                  ) : (
                    <li key={bill.id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span>{bill.bill_number || 'BILL-XXX'}</span>
                      <span className="text-sm text-gray-500">{bill.bill_date}</span>
                      <a href={`/purchases/${bill.id}`} className="text-blue-600 hover:underline text-sm">Details</a>
                    </li>
                  )
                )}
              </ul>
            </div>
            {/* Low Stock Alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <span className="font-semibold text-gray-900 dark:text-white mb-2 block">Low Stock Alerts</span>
              <ul>
                {(loadingLowStock ? Array(5).fill({}) : lowStock?.low_stock_alerts || []).map((item, i) =>
                  loadingLowStock ? (
                    <li key={i} className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded my-2" />
                  ) : (
                    <li key={item.id || i} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span>
                        {item.name || 'Product'} 
                        <span className="ml-2 text-xs text-gray-500">({item.hsn_code})</span>
                      </span>
                      <span className="text-sm text-red-600">
                        {item.stock} {item.unit} left
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </section>

          {/* GST Summary Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">GST Summary</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="ml-2 px-2 py-1 rounded border text-sm"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="px-2 py-1 rounded border text-sm"
                  placeholder="To"
                />
                <button
                  onClick={handleExportGstCsv}
                  className="ml-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  title="Export GST Summary as CSV"
                >
                  Export CSV
                </button>
              </div>
              {loadingGstSummary ? (
                <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded my-2 w-1/2" />
              ) : gstSummary ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>GST Collected:</span>
                    <span className="font-bold text-green-600">{gstSummary.gst_collected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST Paid:</span>
                    <span className="font-bold text-red-600">{gstSummary.gst_paid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST Payable:</span>
                    <span className="font-bold text-blue-600">{gstSummary.gst_payable}</span>
                  </div>
                </div>
              ) : (
                <div className="text-red-500">Failed to load GST summary.</div>
              )}
            </div>

            {/* GST by Product Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <span className="font-semibold text-gray-900 dark:text-white mb-2 block">GST by Product</span>
              {loadingGstSummary ? (
                <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded my-2 w-1/2" />
              ) : gstSummary?.gst_by_product?.length ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-1">Product</th>
                      <th className="text-right py-1">Total GST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gstSummary.gst_by_product.map((row, i) => (
                      <tr key={i}>
                        <td className="py-1">{row.product__name}</td>
                        <td className="py-1 text-right">{row.total_gst}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-gray-500 py-2">No GST data available for products.</div>
              )}
            </div>
          </section>

          {/* GST by Month Chart */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mt-6">
            <span className="font-semibold text-gray-900 dark:text-white mb-2 block">GST by Month</span>
            {loadingGstSummary ? (
              <div className="animate-pulse h-32 bg-gray-200 dark:bg-gray-700 rounded my-2" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={gstSummary?.gst_by_month || []}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_gst" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </section>

          {/* Total Purchases */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Total Purchases */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <span className="font-semibold text-gray-900 dark:text-white mb-2 block">Total Purchases</span>
              {loadingPurchaseSummary ? (
                <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded my-2 w-1/2" />
              ) : purchaseSummary ? (
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {purchaseSummary.total_purchases}
                </div>
              ) : (
                <div className="text-red-500">Failed to load purchase summary.</div>
              )}
            </div>

            {/* Purchases by Vendor */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <span className="font-semibold text-gray-900 dark:text-white mb-2 block">Purchases by Vendor</span>
              {loadingPurchaseSummary ? (
                <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded my-2 w-1/2" />
              ) : purchaseSummary?.purchases_by_vendor?.length ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-1">Vendor</th>
                      <th className="text-right py-1">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseSummary.purchases_by_vendor.map((row, i) => (
                      <tr key={i}>
                        <td className="py-1">{row.vendor_name}</td>
                        <td className="py-1 text-right">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-gray-500 py-2">No vendor purchase data.</div>
              )}
            </div>
          </section>

          {/* Total Sales */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Total Sales */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <span className="font-semibold text-gray-900 dark:text-white mb-2 block">Total Sales</span>
              {loadingSalesSummary ? (
                <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded my-2 w-1/2" />
              ) : salesSummary ? (
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {salesSummary.total_sales}
                </div>
              ) : (
                <div className="text-red-500">Failed to load sales summary.</div>
              )}
            </div>

            {/* Sales by Product */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <span className="font-semibold text-gray-900 dark:text-white mb-2 block">Sales by Product</span>
              {loadingSalesSummary ? (
                <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded my-2 w-1/2" />
              ) : salesSummary?.sales_by_product?.length ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-1">Product</th>
                      <th className="text-right py-1">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesSummary.sales_by_product.map((row, i) => (
                      <tr key={i}>
                        <td className="py-1">{row.product__name}</td>
                        <td className="py-1 text-right">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-gray-500 py-2">No product sales data.</div>
              )}
            </div>

            {/* Sales by Customer */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <span className="font-semibold text-gray-900 dark:text-white mb-2 block">Sales by Customer</span>
              {loadingSalesSummary ? (
                <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded my-2 w-1/2" />
              ) : salesSummary?.sales_by_customer?.length ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-1">Customer</th>
                      <th className="text-right py-1">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesSummary.sales_by_customer.map((row, i) => (
                      <tr key={i}>
                        <td className="py-1">{row.customer__name}</td>
                        <td className="py-1 text-right">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-gray-500 py-2">No customer sales data.</div>
              )}
            </div>
          </section>

          {/* Sales by Date */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mt-6">
            <span className="font-semibold text-gray-900 dark:text-white mb-2 block">Sales by Date</span>
            {loadingSalesSummary ? (
              <div className="animate-pulse h-32 bg-gray-200 dark:bg-gray-700 rounded my-2" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={salesSummary?.sales_by_date || []}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_sales" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </section>

          {/* Sales vs Purchases by Date */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mt-6">
            <span className="font-semibold text-gray-900 dark:text-white mb-2 block">Sales vs Purchases (by Date)</span>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesVsPurchasesData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Sales" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="Purchases" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </section>
        </main>
      </div>
    </div>
  )
}