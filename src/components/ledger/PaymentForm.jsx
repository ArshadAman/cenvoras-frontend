import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordClientPayment } from "../../api/ledger";
import { getCustomers } from "../../api/customers";
import api from "../../api/api";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { 
  MagnifyingGlassIcon, 
  BanknotesIcon, 
  DevicePhoneMobileIcon, 
  BuildingLibraryIcon, 
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { getCurrencySymbol } from '../../utils/currency';

const PAYMENT_MODES = {
  cash: { label: 'Cash', icon: BanknotesIcon },
  upi: { label: 'UPI', icon: DevicePhoneMobileIcon },
  bank_transfer: { label: 'Bank Transfer', icon: BuildingLibraryIcon },
  cheque: { label: 'Cheque', icon: DocumentTextIcon },
};

// Customer Autocomplete for payment form
function PaymentCustomerAutocomplete({ setFieldValue }) {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await getCustomers();
        const customerList = Array.isArray(response) ? response : response.data || response.results || [];
        setCustomers(customerList);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  const selectCustomer = (customer) => {
    setFieldValue('customer', customer.id);
    setFieldValue('customer_name', customer.name);
    setInputValue(customer.name);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFieldValue('customer_name', value);
    setFieldValue('customer', ''); // Clear customer ID if typing manually

    if (value.trim()) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(value.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(value.toLowerCase()))
      );
      setFilteredCustomers(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setShowDropdown(false);
    }
  };

  const inputClass = "w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 pl-10 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all text-sm";

  return (
    <div className="relative">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-[var(--text-muted)] pointer-events-none" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          onFocus={() => {
            if (inputValue.trim() && filteredCustomers.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder="Search and select customer"
          className={inputClass}
          required
        />
      </div>
      {showDropdown && (
        <div className="absolute z-10 bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--border-subtle)] rounded-xl shadow-2xl w-full max-h-40 overflow-y-auto mt-1">
          {filteredCustomers.map(customer => (
            <div
              key={customer.id}
              className="px-4 py-2.5 hover:bg-[var(--bg-primary)] cursor-pointer transition-colors border-b border-[var(--border-subtle)] last:border-0"
              onClick={() => selectCustomer(customer)}
            >
              <div className="font-medium text-[var(--text-primary)]">{customer.name}</div>
              <div className="text-[var(--text-muted)] text-xs mt-0.5">
                {customer.email && `${customer.email}`}
                {customer.phone && ` • ${customer.phone}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const paymentSchema = Yup.object().shape({
  customer: Yup.string().required("Please select a customer"),
  amount: Yup.number()
    .required("Amount is required")
    .positive("Amount must be positive")
    .max(999999999, "Amount is too large"),
  description: Yup.string().max(255, "Description must be less than 255 characters"),
  date: Yup.string().required("Date is required"),
});

function CustomerInvoicesWatcher({ customerId, initialInvoice, onInvoicesLoaded }) {
  useEffect(() => {
    if (!customerId || initialInvoice) {
      onInvoicesLoaded([]);
      return;
    }
    let isMounted = true;
    api.get(`/billing/sales-invoices/?customer=${customerId}`)
      .then(res => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        const unpaid = list.filter(inv => {
          if (inv?.status === 'draft') return false;
          const outstanding = Math.max((Number(inv?.total_amount) || 0) - (Number(inv?.amount_paid) || 0), 0);
          return outstanding > 0.01;
        });
        onInvoicesLoaded(unpaid);
      })
      .catch(() => {
        if (isMounted) onInvoicesLoaded([]);
      });
    return () => { isMounted = false; };
  }, [customerId, initialInvoice, onInvoicesLoaded]);
  return null;
}

export default function PaymentForm({ onSuccess, onCancel, initialInvoice = null, initialCustomer = null }) {
  const queryClient = useQueryClient();
  const [openInvoices, setOpenInvoices] = useState([]);

  const roundTo3 = (value) => Math.round((Number(value) || 0) * 1000) / 1000;
  const formatAmount = (value) => roundTo3(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });

  const customerId = typeof initialCustomer === 'string'
    ? initialCustomer
    : (initialCustomer?.id || initialInvoice?.customer_details?.id || initialInvoice?.customer_id || (typeof initialInvoice?.customer === 'string' ? initialInvoice.customer : initialInvoice?.customer?.id) || '');
  const customerName = typeof initialCustomer === 'object'
    ? (initialCustomer?.name || initialInvoice?.customer_name || '')
    : (initialInvoice?.customer_name || '');

  const invoiceOutstanding = initialInvoice
    ? roundTo3(Math.max(roundTo3(initialInvoice.total_amount || 0) - roundTo3(initialInvoice.amount_paid || 0), 0))
    : '';

  const initialValues = useMemo(() => ({
    customer: customerId,
    customer_name: customerName,
    amount: initialInvoice ? invoiceOutstanding : '',
    mode: 'cash',
    reference: '',
    description: initialInvoice
      ? `Payment for invoice ${initialInvoice.invoice_number}`
      : 'Payment received',
    date: format(new Date(), 'yyyy-MM-dd'),
    invoice: initialInvoice?.id || '',
  }), [customerId, customerName, initialInvoice, invoiceOutstanding]);

  const handleInvoicesLoaded = useCallback((invoices) => {
    setOpenInvoices(invoices);
  }, []);

  const recordPaymentMutation = useMutation({
    mutationFn: recordClientPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      queryClient.invalidateQueries({ queryKey: ["salesAnalytics"] });
      queryClient.invalidateQueries({ queryKey: ["overdueSalesInvoicesSummary"] });
      queryClient.invalidateQueries({ queryKey: ["clientLedger"] });
      queryClient.invalidateQueries({ queryKey: ["ledgerStats"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment recorded successfully!");
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record payment");
    },
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    // Clean up the data for submission
    const paymentData = {
      customer: values.customer,
      amount: parseFloat(values.amount),
      mode: values.mode || 'cash',
      reference: values.reference || '',
      description: values.description || "Payment received",
      date: values.date,
      invoice: values.invoice || undefined,
    };

    try {
      await recordPaymentMutation.mutateAsync(paymentData);
    } catch {
      // handled in onError
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all text-sm";
  const labelClass = "block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide";

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize
      validationSchema={paymentSchema}
      onSubmit={handleSubmit}
    >
      {({ values, setFieldValue, isSubmitting }) => {
        const activeInvoice = initialInvoice || openInvoices.find(i => String(i.id) === String(values.invoice));
        const activeOutstanding = activeInvoice
          ? roundTo3(Math.max((Number(activeInvoice.total_amount) || 0) - (Number(activeInvoice.amount_paid) || 0), 0))
          : null;

        return (
          <Form className="space-y-4">
            <CustomerInvoicesWatcher
              customerId={values.customer}
              initialInvoice={initialInvoice}
              onInvoicesLoaded={handleInvoicesLoaded}
            />

            {initialInvoice ? (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold mb-1">Selected Invoice</div>
                    <div className="text-[var(--text-primary)] font-semibold">#{initialInvoice.invoice_number}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">{customerName || 'Customer'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold mb-1">Outstanding</div>
                    <div className="text-[var(--status-success)] font-bold">{getCurrencySymbol()}{formatAmount(invoiceOutstanding)}</div>
                  </div>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  This payment will be linked directly to the selected invoice.
                </div>
              </div>
            ) : (
              <div>
                <label className={labelClass}>Customer *</label>
                <PaymentCustomerAutocomplete values={values} setFieldValue={setFieldValue} />
              </div>
            )}

            {!initialInvoice && values.customer && openInvoices.length > 0 && (
              <div>
                <label className={labelClass}>Apply To Invoice</label>
                <select
                  id="invoice"
                  name="invoice"
                  value={values.invoice || ''}
                  onChange={(e) => {
                    const invId = e.target.value;
                    setFieldValue('invoice', invId);
                    if (invId) {
                      const inv = openInvoices.find(i => String(i.id) === String(invId));
                      if (inv) {
                        const out = roundTo3(Math.max((Number(inv.total_amount) || 0) - (Number(inv.amount_paid) || 0), 0));
                        setFieldValue('amount', out);
                        setFieldValue('description', `Payment for invoice ${inv.invoice_number}`);
                      }
                    } else {
                      setFieldValue('description', 'Payment received');
                    }
                  }}
                  className={inputClass}
                >
                  <option value="">Auto-apply to oldest open invoices (FIFO)</option>
                  {openInvoices.map((inv) => {
                    const out = roundTo3(Math.max((Number(inv.total_amount) || 0) - (Number(inv.amount_paid) || 0), 0));
                    return (
                      <option key={inv.id} value={inv.id}>
                        #{inv.invoice_number} — Due: {getCurrencySymbol()}{formatAmount(out)} ({inv.invoice_date || ''})
                      </option>
                    );
                  })}
                </select>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  {values.invoice
                    ? 'Payment will be applied directly to the selected invoice.'
                    : 'If no invoice is selected, payment automatically knocks off oldest unpaid invoices first (FIFO).'}
                </p>
              </div>
            )}

            <Field name="customer" type="hidden" />
            <Field name="invoice" type="hidden" />
            <ErrorMessage name="customer" component="div" className="mt-1 text-xs text-[var(--status-danger)]" />

            {/* Amount and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Amount Paid *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[var(--text-muted)]">{getCurrencySymbol()}</span>
                  <Field
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={`${inputClass} pl-7`}
                    placeholder="0.00"
                  />
                </div>
                <ErrorMessage name="amount" component="div" className="mt-1 text-xs text-[var(--status-danger)]" />
              </div>

              <div>
                <label className={labelClass}>Date *</label>
                <Field
                  id="date"
                  name="date"
                  type="date"
                  className={inputClass}
                />
                <ErrorMessage name="date" component="div" className="mt-1 text-xs text-[var(--status-danger)]" />
              </div>
            </div>

            {/* Total Due & Remaining Card */}
            {activeInvoice && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] animate-fade-in">
                <div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Total Due</div>
                  <div className="text-base font-bold text-[var(--text-primary)]">{getCurrencySymbol()}{formatAmount(activeOutstanding)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Remaining</div>
                  <div className={`text-base font-bold ${Math.max(roundTo3(activeOutstanding) - roundTo3(values.amount || 0), 0) <= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-warning)]'}`}>
                    {getCurrencySymbol()}{formatAmount(Math.max(roundTo3(activeOutstanding) - roundTo3(values.amount || 0), 0))}
                  </div>
                </div>
              </div>
            )}

          {/* Payment Mode Selection */}
          <div>
            <label className={labelClass}>Payment Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(PAYMENT_MODES).map(([key, modeItem]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFieldValue('mode', key)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    values.mode === key
                      ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-[var(--accent-primary)] shadow-md'
                      : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]'
                  }`}
                >
                  {React.createElement(modeItem.icon, {
                    className: `w-5 h-5 mx-auto mb-1 ${values.mode === key ? 'text-[var(--text-on-accent)]' : 'text-[var(--text-muted)]'}`
                  })}
                  <span className={`text-xs font-semibold ${values.mode === key ? 'text-[var(--text-on-accent)]' : 'text-[var(--text-secondary)]'}`}>
                    {modeItem.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Reference (Optional) */}
          <div>
            <label className={labelClass}>Reference (Optional)</label>
            <Field
              id="reference"
              name="reference"
              type="text"
              className={inputClass}
              placeholder="Cheque No / UPI Transaction ID"
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className={labelClass}>Notes (Optional)</label>
            <Field
              id="description"
              name="description"
              as="textarea"
              rows={2}
              className={inputClass}
              placeholder="Any additional details..."
            />
            <ErrorMessage name="description" component="div" className="mt-1 text-xs text-[var(--status-danger)]" />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary text-sm px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || recordPaymentMutation.isPending}
              className="btn-primary py-2.5 px-6 font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isSubmitting || recordPaymentMutation.isPending ? (
                <span className="flex items-center gap-2">
                   <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Recording...
                </span>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Record Payment</span>
                </>
              )}
            </button>
          </div>
        </Form>
        );
      }}
    </Formik>
  );
}