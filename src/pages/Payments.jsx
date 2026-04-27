import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLoadingPolicy } from '../hooks/useLoadingPolicy';
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
  CalendarIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api from '../api/api';
import Layout from '../components/Layout';

const roundTo3 = (value) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 1000) / 1000;
};

const formatAmount = (value) => roundTo3(value).toLocaleString('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

// Payment mode icons and colors
const PAYMENT_MODES = {
  cash: { label: 'Cash', icon: CurrencyRupeeIcon, color: 'text-green-400', bg: 'bg-green-500/10' },
  upi: { label: 'UPI', icon: DevicePhoneMobileIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  bank_transfer: { label: 'Bank Transfer', icon: BuildingLibraryIcon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  cheque: { label: 'Cheque', icon: DocumentTextIcon, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

// Payment card component
function PaymentCard({ payment, onEdit, onDelete }) {
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
          <div className="text-lg font-bold text-green-400">₹{formatAmount(payment.amount)}</div>
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
      
      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/5 transition-opacity">
        <button 
          onClick={() => onEdit(payment)} 
          className="p-2 bg-white/5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/20 rounded-lg transition-all border border-white/5" 
          title="Edit Payment"
        >
          <PencilSquareIcon className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onDelete(payment)} 
          className="p-2 bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all border border-white/5" 
          title="Delete Payment"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Payment Modal (Creates & Edits)
function PaymentModal({ isOpen, onClose, customers, onSuccess, editData }) {
  const [formData, setFormData] = useState({
    customer: '',
    invoice: '',
    amount: '',
    date: new Date().toLocaleDateString('sv-SE'),
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

  const extractApiErrorMessage = (err) => {
    const data = err?.response?.data;

    if (!data) {
      return err?.message || 'Failed to record payment';
    }

    if (typeof data === 'string') {
      return data;
    }

    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }

    if (Array.isArray(data?.amount) && data.amount.length > 0) {
      return String(data.amount[0]);
    }

    const firstField = Object.keys(data)[0];
    if (firstField) {
      const fieldError = data[firstField];
      if (Array.isArray(fieldError) && fieldError.length > 0) {
        return String(fieldError[0]);
      }
      if (typeof fieldError === 'string' && fieldError.trim()) {
        return fieldError;
      }
    }

    return err?.message || 'Failed to record payment';
  };

  useEffect(() => {
    if (isOpen && editData) {
      setFormData({
        customer: editData.customer || '',
        invoice: editData.invoice || '',
        amount: editData.amount || '',
        date: editData.date ? new Date(editData.date).toISOString().split('T')[0] : new Date().toLocaleDateString('sv-SE'),
        mode: editData.mode || 'cash',
        reference: editData.reference || '',
        notes: editData.notes || ''
      });
      setCustomerSearch(editData.customer_name || '');
    } else if (isOpen && !editData) {
      resetForm();
    }
  }, [isOpen, editData]);

  // Filter customers based on search
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.id.slice(0, 8).toLowerCase().includes(customerSearch.toLowerCase())
  );

  const selectedCustomer = customers.find(c => String(c.id) === String(formData.customer));

  // Fetch invoices when customer changes
  useEffect(() => {
    if (formData.customer) {
      fetchInvoices(formData.customer, formData.invoice || editData?.invoice || null);
    } else {
      setInvoices([]);
      setSelectedInvoice(null);
      setFormData(prev => ({ ...prev, invoice: '', amount: '' }));
    }
  }, [formData.customer, formData.invoice, editData?.invoice]);

  const fetchInvoices = async (customerId, currentInvoiceId = null) => {
    setIsLoadingInvoices(true);
    try {
      const res = await api.get(`/billing/sales-invoices/?customer=${customerId}`);
      // Handle array or object results
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      const openInvoices = data.filter((inv) => {
        if (inv?.status === 'draft') return false;
        const outstanding = roundTo3((inv?.total_amount || 0) - (inv?.amount_paid || 0));
        return outstanding > 0;
      });

      let invoiceOptions = openInvoices;
      if (currentInvoiceId) {
        const linkedInvoice = data.find((inv) => String(inv.id) === String(currentInvoiceId));
        const alreadyIncluded = openInvoices.some((inv) => String(inv.id) === String(currentInvoiceId));
        if (linkedInvoice && !alreadyIncluded) {
          invoiceOptions = [linkedInvoice, ...openInvoices];
        }
      }

      setInvoices(invoiceOptions);

      if (currentInvoiceId) {
        const current = invoiceOptions.find((inv) => String(inv.id) === String(currentInvoiceId));
        setSelectedInvoice(current || null);
      }
    } catch (err) {
      console.error("Failed to fetch invoices", err);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    setFormData({ ...formData, customer: customer.id, invoice: '', amount: '' });
    setCustomerSearch(customer.name);
    setSelectedInvoice(null);
    setShowCustomerDropdown(false);
  };

  const getInvoiceOutstanding = (invoice) => {
    const total = roundTo3(invoice?.total_amount || 0);
    const paid = roundTo3(invoice?.amount_paid || 0);
    return roundTo3(Math.max(total - paid, 0));
  };

  const handleSelectInvoice = (invoiceId) => {
    const inv = invoices.find(i => i.id === invoiceId);
    const outstanding = inv ? getInvoiceOutstanding(inv) : '';
    setSelectedInvoice(inv);
    setFormData({ 
      ...formData, 
      invoice: invoiceId, 
      amount: roundTo3(outstanding)
    });
  };

  const calculateRemainingDue = () => {
    if (!selectedInvoice) return null;
    const paid = roundTo3(formData.amount || 0);
    const outstanding = getInvoiceOutstanding(selectedInvoice);
    return roundTo3(outstanding - paid);
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

      const paymentPayload = {
        ...formData,
        customer: targetCustomerId,
        amount: roundTo3(formData.amount)
      };

      if (formData.invoice) {
        paymentPayload.invoice = formData.invoice;
      } else {
        delete paymentPayload.invoice;
      }

      if (editData) {
        await api.put(`/billing/payments/${editData.id}/`, paymentPayload);
        toast.success("Payment updated successfully");
      } else {
        await api.post('/billing/payments/', paymentPayload);
        toast.success("Payment recorded successfully");
      }
      
      onSuccess();
      onClose();
      if (!editData) resetForm();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer: '',
      invoice: '',
      amount: '',
      date: new Date().toLocaleDateString('sv-SE'),
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
            {editData ? "Edit Payment" : "Record Payment"}
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
                        ID: {c.id.slice(0, 8)} • Balance: ₹{formatAmount(c.current_balance)}
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
                  {inv.invoice_number} ({new Date(inv.invoice_date).toLocaleDateString()}) - Due ₹{formatAmount(getInvoiceOutstanding(inv))}
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
                  step="0.001"
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
                <div className="text-base font-bold text-white">₹{formatAmount(getInvoiceOutstanding(selectedInvoice))}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Remaining</div>
                <div className={`text-base font-bold ${calculateRemainingDue() <= 0 ? 'text-green-400' : 'text-amber-400'}`}>
                  ₹{formatAmount(calculateRemainingDue())}
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
                  {editData ? "Update Payment" : "Record Payment"}
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
  const [isDueModalOpen, setIsDueModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'month'

  const invalidatePaymentRelatedQueries = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['payments'] }),
    queryClient.invalidateQueries({ queryKey: ['customers'] }),
    queryClient.invalidateQueries({ queryKey: ['generalLedgerEntries'] }),
    queryClient.invalidateQueries({ queryKey: ['ledgerStats'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] }),
    queryClient.invalidateQueries({ queryKey: ['smart-dashboard'] }),
  ]);


  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/billing/payments/${id}/`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['payments'] });
      const previousPayments = queryClient.getQueryData(['payments']);

      queryClient.setQueryData(['payments'], (old) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.filter((payment) => payment.id !== id);
        }

        if (Array.isArray(old.results)) {
          return {
            ...old,
            results: old.results.filter((payment) => payment.id !== id),
            count: Math.max(Number(old.count || 0) - 1, 0),
          };
        }

        return old;
      });

      setIsDeleteModalOpen(false);
      setPaymentToDelete(null);
      return { previousPayments };
    },
    onSuccess: async () => {
      await invalidatePaymentRelatedQueries();
      toast.success("Payment deleted successfully");
      setIsDeleteModalOpen(false);
      setPaymentToDelete(null);
    },
    onError: (err, _id, context) => {
      if (context?.previousPayments) {
        queryClient.setQueryData(['payments'], context.previousPayments);
      }
      toast.error(err.response?.data?.detail || "Failed to delete payment");
    }
  });

  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleDelete = (payment) => {
    setPaymentToDelete(payment);
    setIsDeleteModalOpen(true);
  };
  
  
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
  const loadingPolicy = useLoadingPolicy(isLoading);
  
  // Filter and search payments
  const filteredPayments = (payments || []).filter(p => {
    const matchesSearch = p.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.reference?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = filterMode === 'all' || p.mode === filterMode;
    const paymentDate = new Date(p.date);
    const now = new Date();
    const matchesDate = dateFilter === 'all' ||
      (dateFilter === 'today' && p.date === new Date().toLocaleDateString('sv-SE')) ||
      (dateFilter === 'month' && paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear());
    return matchesSearch && matchesMode && matchesDate;
  });
  
  // Calculate stats
  const todayTotal = (payments || [])
    .filter(p => p.date === new Date().toLocaleDateString('sv-SE'))
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  const thisMonthTotal = (payments || [])
    .filter(p => {
      const paymentDate = new Date(p.date);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalCollection = (payments || [])
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  
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
            onClick={() => {
              setSelectedPayment(null);
              setIsModalOpen(true);
            }}
            className="btn-primary text-sm py-2.5 px-5 shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Record Payment
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}
            className={`bento-card !p-4 cursor-pointer transition-all hover:scale-[1.02] border ${dateFilter === 'today' ? 'border-green-500/50 bg-green-500/5' : 'border-white/5 hover:border-white/20'}`}
          >
            <div className="flex justify-between items-start mb-1">
              <div className="text-xs text-gray-500">Today's Collection</div>
              {dateFilter === 'today' && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
            </div>
            <div className="text-2xl font-bold text-green-400">₹{todayTotal.toLocaleString('en-IN')}</div>
          </div>
          <div
            onClick={() => setDateFilter(dateFilter === 'month' ? 'all' : 'month')}
            className={`bento-card !p-4 cursor-pointer transition-all hover:scale-[1.02] border ${dateFilter === 'month' ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/5 hover:border-white/20'}`}
          >
            <div className="flex justify-between items-start mb-1">
              <div className="text-xs text-gray-500">Monthly Collection</div>
              {dateFilter === 'month' && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
            </div>
            <div className="text-2xl font-bold text-cyan-400">₹{thisMonthTotal.toLocaleString('en-IN')}</div>
          </div>
          <div 
            onClick={() => setDateFilter('all')}
            className={`bento-card !p-4 cursor-pointer transition-all hover:scale-[1.02] border ${dateFilter === 'all' ? 'border-white/20 bg-white/5' : 'border-white/5 hover:border-white/20'}`}
          >
            <div className="text-xs text-gray-500 mb-1">Total Collection Till Date</div>
            <div className="text-2xl font-bold text-white">₹{totalCollection.toLocaleString('en-IN')}</div>
          </div>
          <div 
            onClick={() => setIsDueModalOpen(true)}
            className="bento-card !p-4 cursor-pointer transition-all hover:scale-[1.02] border border-white/5 hover:border-amber-500/30 group"
          >
            <div className="flex justify-between items-start mb-1">
              <div className="text-xs text-gray-500 group-hover:text-amber-400/80 transition-colors">Customers with Due</div>
              <PlusIcon className="w-4 h-4 text-gray-600 group-hover:text-amber-400 transition-colors" />
            </div>
            <div className="text-2xl font-bold text-amber-400">
              {customers?.filter(c => parseFloat(c.current_balance) > 0).length || 0}
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
        {loadingPolicy.visible ? (
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
              onClick={() => {
                setSelectedPayment(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-xl hover:opacity-90"
            >
              <PlusIcon className="w-5 h-5" />
              Record First Payment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPayments.map((payment) => (
              <PaymentCard 
                key={payment.id} 
                payment={payment} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
              />
            ))}
          </div>
        )}
        
        {/* Payment Modal */}
        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPayment(null);
          }}
          customers={customers}
          editData={selectedPayment}
          onSuccess={() => {
            invalidatePaymentRelatedQueries();
            setSelectedPayment(null);
          }}
        />

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
            <div className="relative bg-[#0a0a0a] border border-red-500/20 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <TrashIcon className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Delete Payment?</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Are you sure you want to delete this payment of <span className="text-white font-medium">₹{paymentToDelete?.amount}</span> from <span className="text-white font-medium">{paymentToDelete?.customer_name}</span>? This action cannot be undone.
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium border border-white/10"
                    disabled={deleteMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(paymentToDelete.id)}
                    className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors font-medium border border-red-500/30 flex justify-center items-center"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
        {/* Due Customers Modal */}
        {isDueModalOpen && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsDueModalOpen(false)} />
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserIcon className="w-6 h-6 text-amber-400" />
                  Customers with Due
                </h2>
                <button onClick={() => setIsDueModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {customers?.filter(c => parseFloat(c.current_balance) > 0).length > 0 ? (
                  customers
                    .filter(c => parseFloat(c.current_balance) > 0)
                    .sort((a, b) => b.current_balance - a.current_balance)
                    .map(c => (
                      <div 
                        key={c.id} 
                        className="p-4 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center hover:bg-white/10 transition-all cursor-default group"
                      >
                        <div>
                          <div className="text-white font-medium group-hover:text-amber-400 transition-colors">{c.name}</div>
                          <div className="text-xs text-gray-500">ID: {c.id.slice(0, 8)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-amber-500">₹{parseFloat(c.current_balance).toLocaleString()}</div>
                          <button 
                            onClick={() => {
                              setIsDueModalOpen(false);
                              setSearchQuery(c.name);
                            }}
                            className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold hover:underline"
                          >
                            View History
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-10 text-gray-500">No customers have outstanding balances.</div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                <button
                  onClick={() => setIsDueModalOpen(false)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium border border-white/10"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </Layout>
  );
}
