import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLoadingPolicy } from '../hooks/useLoadingPolicy';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  TrashIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api from '../api/api';
import { allocatePayment } from '../api/ledger';
import { getCurrencySymbol } from '../utils/currency';
import { getTodayKolkata } from '../utils/date';

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
  cash: { label: 'Cash', icon: CurrencyRupeeIcon, color: 'text-[var(--status-success)]', bg: 'bg-[var(--status-success)]/10' },
  upi: { label: 'UPI', icon: DevicePhoneMobileIcon, color: 'text-[var(--accent-primary)]', bg: 'bg-[var(--accent-primary)]/10' },
  bank_transfer: { label: 'Bank Transfer', icon: BuildingLibraryIcon, color: 'text-[var(--status-info)]', bg: 'bg-[var(--status-info)]/10' },
  cheque: { label: 'Cheque', icon: DocumentTextIcon, color: 'text-[var(--status-warning)]', bg: 'bg-[var(--status-warning)]/10' },
};

// Payment card component
function PaymentCard({ payment, onEdit, onDelete, onAllocate }) {
  const mode = PAYMENT_MODES[payment.mode] || PAYMENT_MODES.cash;
  const ModeIcon = mode.icon;
  
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 group hover:border-[var(--accent-primary)]/40 transition-all shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${mode.bg}`}>
            <ModeIcon className={`w-5 h-5 ${mode.color}`} />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">{payment.customer_name}</div>
            <div className="text-xs text-[var(--text-muted)]">{mode.label}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-[var(--status-success)]">{getCurrencySymbol()}{formatAmount(payment.amount)}</div>
          <div className="text-xs text-[var(--text-muted)]">{new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {payment.invoice_number ? (
          <span className="text-xs font-medium text-[var(--status-info)] bg-[var(--status-info)]/10 border border-[var(--status-info)]/20 px-2 py-0.5 rounded-md">
            Invoice #{payment.invoice_number}
          </span>
        ) : (
          <span className="text-xs font-medium text-[var(--status-warning)] bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/20 px-2 py-0.5 rounded-md">
            Customer Advance
          </span>
        )}
        {payment.reference && (
          <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-md border border-[var(--border-subtle)]">
            Ref: {payment.reference}
          </span>
        )}
      </div>
      
      {payment.notes && (
        <div className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-1">{payment.notes}</div>
      )}
      
      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)] transition-opacity">
        {!payment.invoice && !payment.invoice_number && (
          <button 
            onClick={() => onAllocate(payment)} 
            className="p-2 bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--status-success)] hover:bg-[var(--status-success)]/10 rounded-lg transition-all border border-[var(--border-subtle)]" 
            title="Allocate Advance to Invoices"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        )}
        <button 
          onClick={() => onEdit(payment)} 
          className="p-2 bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-all border border-[var(--border-subtle)]" 
          title="Edit Payment"
        >
          <PencilSquareIcon className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onDelete(payment)} 
          className="p-2 bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10 rounded-lg transition-all border border-[var(--border-subtle)]" 
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
    date: getTodayKolkata(),
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
        date: editData.date
          ? (typeof editData.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(editData.date)
            ? editData.date.slice(0, 10)
            : getTodayKolkata(new Date(editData.date)))
          : getTodayKolkata(),
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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BanknotesIcon className="w-6 h-6 text-[var(--status-success)]" />
            {editData ? "Edit Payment" : "Record Payment"}
          </h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Searchable Customer Selection */}
          <div className="relative">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Customer *</label>
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
                className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
              />
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            </div>
            
            {showCustomerDropdown && customerSearch && (
              <div className="absolute z-50 w-full mt-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-xl max-h-48 overflow-y-auto overflow-x-hidden">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full text-left p-3 hover:bg-[var(--bg-primary)] transition-colors border-b border-[var(--border-subtle)] last:border-0"
                    >
                      <div className="text-sm font-medium text-[var(--text-primary)]">{c.name}</div>
                      <div className="text-xs text-[var(--text-muted)] font-mono">
                        ID: {c.id.slice(0, 8)} • Balance: {getCurrencySymbol()}{formatAmount(c.current_balance)}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-sm text-[var(--text-muted)] italic">
                    New customer will be created
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Optional Invoice Selection */}
          <div className={`transition-all duration-300 ${formData.customer ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Link to Invoice (Optional)</label>
            <select
              value={formData.invoice}
              onChange={(e) => handleSelectInvoice(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none text-sm"
              disabled={isLoadingInvoices}
            >
              <option value="" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Select an invoice...</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                  {inv.invoice_number} ({new Date(inv.invoice_date).toLocaleDateString()}) - Due {getCurrencySymbol()}{formatAmount(getInvoiceOutstanding(inv))}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Amount Paid *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">{getCurrencySymbol()}</span>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.001"
                  placeholder="5,000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2.5 pl-7 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
                />
              </div>
            </div>
            
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
              />
            </div>
          </div>

          {/* Info Fields (Non-gate/Display only) */}
          {selectedInvoice && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] animate-fade-in">
              <div>
                <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-1">Total Due</div>
                <div className="text-base font-bold text-[var(--text-primary)]">{getCurrencySymbol()}{formatAmount(getInvoiceOutstanding(selectedInvoice))}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-1">Remaining</div>
                <div className={`text-base font-bold ${calculateRemainingDue() <= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-warning)]'}`}>
                  {getCurrencySymbol()}{formatAmount(calculateRemainingDue())}
                </div>
              </div>
            </div>
          )}
          
          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Payment Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(PAYMENT_MODES).map(([key, { label, icon: Icon, color, bg }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, mode: key })}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    formData.mode === key
                      ? `${bg} border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20`
                      : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${formData.mode === key ? color : 'text-[var(--text-muted)]'}`} />
                  <span className={`text-xs ${formData.mode === key ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)] font-medium'}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Reference (Optional)</label>
              <input
                type="text"
                placeholder="Cheque No / UPI Transaction ID"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Notes (Optional)</label>
              <textarea
                placeholder="Any additional details..."
                rows={1}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm resize-none"
              />
            </div>
          </div>
          
          {error && (
            <div className="text-sm text-[var(--status-danger)] bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30 rounded-xl p-3">
              {error}
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-2.5 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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

// Modal to allocate an unlinked payment / customer advance
function AllocatePaymentModal({ isOpen, onClose, payment, onSuccess }) {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !payment?.customer) return;
    setLoading(true);
    api.get(`/billing/sales-invoices/?customer=${payment.customer}`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        const unpaid = data.filter(inv => {
          if (inv?.status === 'draft') return false;
          const outstanding = Math.max((Number(inv?.total_amount) || 0) - (Number(inv?.amount_paid) || 0), 0);
          return outstanding > 0.01;
        });
        setInvoices(unpaid);
      })
      .catch(err => {
        console.error('Failed to load invoices for allocation', err);
      })
      .finally(() => setLoading(false));
  }, [isOpen, payment]);

  if (!isOpen || !payment) return null;

  const handleAllocate = async () => {
    setSubmitting(true);
    try {
      await allocatePayment(payment.id, selectedInvoice || null);
      toast.success('Payment successfully allocated to invoice(s)!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to allocate payment');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-[var(--accent-primary)]" />
            Allocate Payment / Advance
          </h3>
          <button onClick={onClose} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-[var(--bg-primary)] rounded-xl p-3 border border-[var(--border-subtle)] mb-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Customer:</span>
            <span className="text-[var(--text-primary)] font-semibold">{payment.customer_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Payment Amount:</span>
            <span className="text-[var(--status-success)] font-bold">{getCurrencySymbol()}{formatAmount(payment.amount)}</span>
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>Date:</span>
            <span>{new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            Select Invoice to Apply
          </label>
          {loading ? (
            <div className="py-4 text-center text-xs text-[var(--text-muted)]">Loading open invoices...</div>
          ) : (
            <select
              value={selectedInvoice}
              onChange={(e) => setSelectedInvoice(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none"
            >
              <option value="" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Auto-apply to oldest open invoices (FIFO)</option>
              {invoices.map(inv => {
                const outstanding = Math.max((Number(inv.total_amount) || 0) - (Number(inv.amount_paid) || 0), 0);
                return (
                  <option key={inv.id} value={inv.id} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    #{inv.invoice_number} — Due: {getCurrencySymbol()}{formatAmount(outstanding)} ({inv.invoice_date || ''})
                  </option>
                );
              })}
            </select>
          )}
          <p className="text-xs text-[var(--text-muted)]">
            {selectedInvoice
              ? 'This unlinked payment will pay down the selected invoice.'
              : 'Auto-apply will automatically knock off the oldest unpaid invoices for this customer.'}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1 py-2.5 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleAllocate}
            disabled={submitting}
            className="btn-primary flex-1 py-2.5 text-sm flex justify-center items-center gap-2"
          >
            {submitting ? 'Allocating...' : 'Allocate Now'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Main Payments Page
export default function Payments() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDueModalOpen, setIsDueModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [paymentToAllocate, setPaymentToAllocate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'month'
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc', 'date-asc', 'amount-desc', 'amount-asc', 'customer-asc'

  const invalidatePaymentRelatedQueries = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['payments'] }),
    queryClient.invalidateQueries({ queryKey: ['customers'] }),
    queryClient.invalidateQueries({ queryKey: ['salesInvoices'] }),
    queryClient.invalidateQueries({ queryKey: ['salesAnalytics'] }),
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

  const handleAllocate = (payment) => {
    setPaymentToAllocate(payment);
    setIsAllocateModalOpen(true);
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

  const sortedAndFilteredPayments = useMemo(() => {
    return [...filteredPayments].sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'amount-desc') {
        return Number(b.amount || 0) - Number(a.amount || 0);
      }
      if (sortBy === 'amount-asc') {
        return Number(a.amount || 0) - Number(b.amount || 0);
      }
      if (sortBy === 'customer-asc') {
        return (a.customer_name || '').localeCompare(b.customer_name || '');
      }
      return 0;
    });
  }, [filteredPayments, sortBy]);
  
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
    <>
      <div className="p-6 md:p-10 space-y-6 animate-fade-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1 flex items-center gap-3">
              <BanknotesIcon className="w-8 h-8 text-[var(--status-success)]" />
              Payments
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">Record and track customer payments</p>
          </div>
          
          <button
            onClick={() => {
              setSelectedPayment(null);
              setIsModalOpen(true);
            }}
            className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Record Payment
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}
            className={`bg-[var(--bg-surface)] border rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] shadow-sm ${
              dateFilter === 'today' 
                ? 'border-[var(--status-success)]/40 bg-[var(--status-success)]/5' 
                : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Today's Collection</div>
              {dateFilter === 'today' && <div className="w-2 h-2 rounded-full bg-[var(--status-success)] animate-pulse" />}
            </div>
            <div className="text-2xl font-bold text-[var(--status-success)]">{getCurrencySymbol()}{todayTotal.toLocaleString('en-IN')}</div>
          </div>
          <div
            onClick={() => setDateFilter(dateFilter === 'month' ? 'all' : 'month')}
            className={`bg-[var(--bg-surface)] border rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] shadow-sm ${
              dateFilter === 'month' 
                ? 'border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/5' 
                : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Monthly Collection</div>
              {dateFilter === 'month' && <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />}
            </div>
            <div className="text-2xl font-bold text-[var(--accent-primary)]">{getCurrencySymbol()}{thisMonthTotal.toLocaleString('en-IN')}</div>
          </div>
          <div 
            onClick={() => setDateFilter('all')}
            className={`bg-[var(--bg-surface)] border rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] shadow-sm ${
              dateFilter === 'all' 
                ? 'border-[var(--accent-primary)]/40 bg-[var(--bg-surface)]' 
                : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
            }`}
          >
            <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Total Collection Till Date</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{getCurrencySymbol()}{totalCollection.toLocaleString('en-IN')}</div>
          </div>
          <div 
            onClick={() => setIsDueModalOpen(true)}
            className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] hover:border-[var(--status-warning)]/40 group shadow-sm"
          >
            <div className="flex justify-between items-start mb-1">
              <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider group-hover:text-[var(--status-warning)] transition-colors">Customers with Due</div>
              <PlusIcon className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--status-warning)] transition-colors" />
            </div>
            <div className="text-2xl font-bold text-[var(--status-warning)]">
              {customers?.filter(c => parseFloat(c.current_balance) > 0).length || 0}
            </div>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by customer or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none text-sm"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-subtle)]">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterMode === 'all' ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] font-semibold shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All
              </button>
              {Object.entries(PAYMENT_MODES).map(([key, { label, color }]) => (
                <button
                  key={key}
                  onClick={() => setFilterMode(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterMode === key ? `bg-[var(--bg-primary)] ${color} font-semibold shadow-sm` : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-[var(--text-secondary)] hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="amount-desc">Amount (High to Low)</option>
                <option value="amount-asc">Amount (Low to High)</option>
                <option value="customer-asc">Customer (A to Z)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Payments List */}
        {loadingPolicy.visible ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-[var(--bg-primary)] rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-[var(--bg-primary)] rounded" />
                    <div className="h-3 w-20 bg-[var(--bg-primary)]/50 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedAndFilteredPayments.length === 0 ? (
          <div className="text-center py-16 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl">
            <BanknotesIcon className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No payments found</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              {searchQuery || filterMode !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start recording customer payments to track cash flow'}
            </p>
            <button
              onClick={() => {
                setSelectedPayment(null);
                setIsModalOpen(true);
              }}
              className="btn-primary text-sm py-2.5 px-6 inline-flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Record First Payment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedAndFilteredPayments.map((payment) => (
              <PaymentCard 
                key={payment.id} 
                payment={payment} 
                onEdit={handleEdit} 
                onDelete={handleDelete}
                onAllocate={handleAllocate}
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

        {/* Allocate Payment Modal */}
        <AllocatePaymentModal
          isOpen={isAllocateModalOpen}
          onClose={() => {
            setIsAllocateModalOpen(false);
            setPaymentToAllocate(null);
          }}
          payment={paymentToAllocate}
          onSuccess={() => {
            invalidatePaymentRelatedQueries();
            setPaymentToAllocate(null);
          }}
        />

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
            <div className="relative bg-[var(--bg-surface)] border border-[var(--status-danger)]/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--status-danger)]/10 flex items-center justify-center mb-4">
                  <TrashIcon className="w-6 h-6 text-[var(--status-danger)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Delete Payment?</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  Are you sure you want to delete this payment of <span className="text-[var(--text-primary)] font-semibold">{getCurrencySymbol()}{paymentToDelete?.amount}</span> from <span className="text-[var(--text-primary)] font-semibold">{paymentToDelete?.customer_name}</span>? This action cannot be undone.
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="btn-secondary flex-1 py-2.5 text-sm"
                    disabled={deleteMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(paymentToDelete.id)}
                    className="btn-danger flex-1 py-2.5 text-sm flex justify-center items-center"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsDueModalOpen(false)} />
            <div className="relative bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <UserIcon className="w-6 h-6 text-[var(--status-warning)]" />
                  Customers with Due
                </h2>
                <button onClick={() => setIsDueModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
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
                        className="p-4 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl flex justify-between items-center hover:border-[var(--accent-primary)]/40 transition-all cursor-default group"
                      >
                        <div>
                          <div className="text-[var(--text-primary)] font-semibold group-hover:text-[var(--status-warning)] transition-colors">{c.name}</div>
                          <div className="text-xs text-[var(--text-muted)] font-mono">ID: {c.id.slice(0, 8)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[var(--status-warning)]">{getCurrencySymbol()}{parseFloat(c.current_balance).toLocaleString()}</div>
                          <button 
                            onClick={() => {
                              setIsDueModalOpen(false);
                              setSearchQuery(c.name);
                            }}
                            className="text-xs text-[var(--accent-primary)] uppercase tracking-wider font-bold hover:underline"
                          >
                            View History
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-10 text-[var(--text-muted)] font-medium">No customers have outstanding balances.</div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  onClick={() => setIsDueModalOpen(false)}
                  className="btn-secondary w-full py-2.5 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </>
  );
}
