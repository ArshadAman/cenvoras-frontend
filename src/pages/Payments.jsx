import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BanknotesIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  CurrencyRupeeIcon,
  DevicePhoneMobileIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import api from '../api/api';
import Layout from '../components/Layout';

// Payment mode icons and colors
const PAYMENT_MODES = {
  cash: { label: 'Cash', icon: CurrencyRupeeIcon, color: 'text-green-400', bg: 'bg-green-500/10' },
  upi: { label: 'UPI', icon: DevicePhoneMobileIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  bank_transfer: { label: 'Bank Transfer', icon: BuildingLibraryIcon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  cheque: { label: 'Cheque', icon: DocumentTextIcon, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

// Payment card component
function PaymentCard({ payment }) {
  const mode = PAYMENT_MODES[payment.mode] || PAYMENT_MODES.cash;
  const ModeIcon = mode.icon;
  
  return (
    <div className="bento-card !p-4 group hover:border-white/20 transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${mode.bg}`}>
            <ModeIcon className={`w-5 h-5 ${mode.color}`} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{payment.customer_name}</div>
            <div className="text-xs text-gray-500">{mode.label}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-400">₹{parseFloat(payment.amount).toLocaleString('en-IN')}</div>
          <div className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>
      
      {payment.reference && (
        <div className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded inline-block">
          Ref: {payment.reference}
        </div>
      )}
      
      {payment.notes && (
        <div className="text-xs text-gray-500 mt-2 line-clamp-1">{payment.notes}</div>
      )}
    </div>
  );
}

// Add Payment Modal
function AddPaymentModal({ isOpen, onClose, customers, onSuccess }) {
  const [formData, setFormData] = useState({
    customer: '',
    invoice: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    mode: 'cash',
    reference: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Search & Invoice Logic
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  // Filter customers based on search
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.id.slice(0, 8).toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Fetch invoices when customer changes
  useEffect(() => {
    if (formData.customer) {
      fetchInvoices(formData.customer);
    } else {
      setInvoices([]);
      setSelectedInvoice(null);
      setFormData(prev => ({ ...prev, invoice: '', amount: '' }));
    }
  }, [formData.customer]);

  const fetchInvoices = async (customerId) => {
    setIsLoadingInvoices(true);
    try {
      const res = await api.get(`/billing/sales-invoices/?customer=${customerId}`);
      // Handle array or object results
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setInvoices(data);
    } catch (err) {
      console.error("Failed to fetch invoices", err);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    setFormData({ ...formData, customer: customer.id });
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  };

  const handleSelectInvoice = (invoiceId) => {
    const inv = invoices.find(i => i.id === invoiceId);
    setSelectedInvoice(inv);
    setFormData({ 
      ...formData, 
      invoice: invoiceId, 
      amount: inv ? inv.total_amount : '' 
    });
  };

  const calculateRemainingDue = () => {
    if (!selectedInvoice) return null;
    const paid = parseFloat(formData.amount) || 0;
    return parseFloat(selectedInvoice.total_amount) - paid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    let targetCustomerId = formData.customer;

    try {
      // Handle manual entry for new customer if no UUID selected
      if (!targetCustomerId && customerSearch.trim()) {
        const custRes = await api.post('/billing/customers/', {
          name: customerSearch.trim()
        });
        targetCustomerId = custRes.data.id;
      }

      if (!targetCustomerId) {
        throw new Error("Please select or enter a customer name");
      }

      await api.post('/billing/payments/', {
        ...formData,
        customer: targetCustomerId,
        amount: parseFloat(formData.amount)
      });
      
      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer: '',
      invoice: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      mode: 'cash',
      reference: '',
      notes: ''
    });
    setCustomerSearch('');
    setSelectedInvoice(null);
    setInvoices([]);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BanknotesIcon className="w-6 h-6 text-green-400" />
            Record Payment
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Searchable Customer Selection */}
          <div className="relative">
            <label className="block text-sm text-gray-400 mb-1">Customer *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search name or ID, or type new..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                  if (formData.customer) setFormData({ ...formData, customer: '' });
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              />
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
            
            {showCustomerDropdown && customerSearch && (
              <div className="absolute z-50 w-full mt-1 bg-[#111] border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto overflow-x-hidden">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full text-left p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className="text-sm font-medium text-white">{c.name}</div>
                      <div className="text-xs text-gray-500">
                        ID: {c.id.slice(0, 8)} • Balance: ₹{parseFloat(c.current_balance).toLocaleString()}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500 italic">
                    New customer will be created
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Optional Invoice Selection */}
          <div className={`transition-all duration-300 ${formData.customer ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <label className="block text-sm text-gray-400 mb-1">Link to Invoice (Optional)</label>
            <select
              value={formData.invoice}
              onChange={(e) => handleSelectInvoice(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              disabled={isLoadingInvoices}
            >
              <option value="" className="bg-gray-900 text-white">Select an invoice...</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id} className="bg-gray-900 text-white">
                  {inv.invoice_number} ({new Date(inv.invoice_date).toLocaleDateString()}) - ₹{inv.total_amount}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Amount Paid *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="5,000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full p-3 pl-7 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
            
            {/* Date */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Info Fields (Non-gate/Display only) */}
          {selectedInvoice && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-white/5 rounded-xl border border-white/10 animate-fade-in">
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Total Due</div>
                <div className="text-base font-bold text-white">₹{parseFloat(selectedInvoice.total_amount).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Remaining</div>
                <div className={`text-base font-bold ${calculateRemainingDue() <= 0 ? 'text-green-400' : 'text-amber-400'}`}>
                  ₹{calculateRemainingDue().toLocaleString()}
                </div>
              </div>
            </div>
          )}
          
          {/* Payment Mode */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Payment Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(PAYMENT_MODES).map(([key, { label, icon: Icon, color, bg }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, mode: key })}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    formData.mode === key
                      ? `${bg} border-white/30 ring-2 ring-white/20`
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${formData.mode === key ? color : 'text-gray-400'}`} />
                  <span className={`text-xs ${formData.mode === key ? 'text-white' : 'text-gray-500'}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Reference (Optional)</label>
              <input
                type="text"
                placeholder="Cheque No / UPI Transaction ID"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Notes (Optional)</label>
              <textarea
                placeholder="Any additional details..."
                rows={1}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none resize-none"
              />
            </div>
          </div>
          
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              {error}
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Record Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// Main Payments Page
export default function Payments({ onLogout }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  
  // Fetch payments
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get('/billing/payments/').then(res => res.data)
  });
  const payments = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.results || []);
  
  // Fetch customers (for the form)
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/billing/customers/').then(res => res.data)
  });
  const customers = Array.isArray(customersData) ? customersData : (customersData?.results || []);
  
  // Filter and search payments
  const filteredPayments = (payments || []).filter(p => {
    const matchesSearch = p.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.reference?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = filterMode === 'all' || p.mode === filterMode;
    return matchesSearch && matchesMode;
  });
  
  // Calculate stats
  const todayTotal = (payments || [])
    .filter(p => p.date === new Date().toISOString().split('T')[0])
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  const thisMonthTotal = (payments || [])
    .filter(p => {
      const paymentDate = new Date(p.date);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  return (
    <Layout onLogout={onLogout}>
      <div className="p-6 md:p-10 space-y-6 animate-fade-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
              <BanknotesIcon className="w-8 h-8 text-green-400" />
              Payments
            </h1>
            <p className="text-gray-400 text-sm">Record and track customer payments</p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary text-sm py-2.5 px-5 shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Record Payment
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bento-card !p-4">
            <div className="text-xs text-gray-500 mb-1">Today's Collection</div>
            <div className="text-2xl font-bold text-green-400">₹{todayTotal.toLocaleString('en-IN')}</div>
          </div>
          <div className="bento-card !p-4">
            <div className="text-xs text-gray-500 mb-1">This Month</div>
            <div className="text-2xl font-bold text-white">₹{thisMonthTotal.toLocaleString('en-IN')}</div>
          </div>
          <div className="bento-card !p-4">
            <div className="text-xs text-gray-500 mb-1">Total Payments</div>
            <div className="text-2xl font-bold text-white">{payments?.length || 0}</div>
          </div>
          <div className="bento-card !p-4">
            <div className="text-xs text-gray-500 mb-1">Customers with Due</div>
            <div className="text-2xl font-bold text-amber-400">
              {customers?.filter(c => c.current_balance > 0).length || 0}
            </div>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filterMode === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            {Object.entries(PAYMENT_MODES).map(([key, { label, color }]) => (
              <button
                key={key}
                onClick={() => setFilterMode(key)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filterMode === key ? `bg-white/10 ${color}` : 'text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Payments List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bento-card !p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    <div className="h-3 w-20 bg-white/5 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-16">
            <BanknotesIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No payments found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterMode !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start recording customer payments to track cash flow'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-xl hover:opacity-90"
            >
              <PlusIcon className="w-5 h-5" />
              Record First Payment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPayments.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} />
            ))}
          </div>
        )}
        
        {/* Add Payment Modal */}
        <AddPaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          customers={customers}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['payments'] })}
        />
      </div>
    </Layout>
  );
}
