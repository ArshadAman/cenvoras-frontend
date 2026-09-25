import React, { useState, useEffect, useMemo } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordClientPayment } from "../../api/ledger";
import { getCustomers } from "../../api/customers";
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
  cash: { label: 'Cash', icon: BanknotesIcon, color: 'text-green-400', bg: 'bg-green-500/10' },
  upi: { label: 'UPI', icon: DevicePhoneMobileIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  bank_transfer: { label: 'Bank Transfer', icon: BuildingLibraryIcon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  cheque: { label: 'Cheque', icon: DocumentTextIcon, color: 'text-amber-400', bg: 'bg-amber-500/10' },
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

  const inputClass = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all";

  return (
    <div className="relative">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500 pointer-events-none" />
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
        <div className="absolute z-10 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl w-full max-h-40 overflow-y-auto mt-1">
          {filteredCustomers.map(customer => (
            <div
              key={customer.id}
              className="px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
              onClick={() => selectCustomer(customer)}
            >
              <div className="font-medium text-white">{customer.name}</div>
              <div className="text-gray-400 text-xs mt-0.5">
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

export default function PaymentForm({ onSuccess, onCancel, initialInvoice = null, initialCustomer = null }) {
  const queryClient = useQueryClient();

  const roundTo3 = (value) => Math.round((Number(value) || 0) * 1000) / 1000;
  const formatAmount = (value) => roundTo3(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });

  const resolvedCustomer = initialCustomer || initialInvoice?.customer_details || initialInvoice?.customer || null;
  const invoiceOutstanding = initialInvoice
    ? roundTo3(Math.max(roundTo3(initialInvoice.total_amount || 0) - roundTo3(initialInvoice.amount_paid || 0), 0))
    : '';

  const initialValues = useMemo(() => ({
    customer: resolvedCustomer?.id || '',
    customer_name: resolvedCustomer?.name || initialInvoice?.customer_name || '',
    amount: initialInvoice ? invoiceOutstanding : '',
    mode: 'cash',
    reference: '',
    description: initialInvoice
      ? `Payment for invoice ${initialInvoice.invoice_number}`
      : 'Payment received',
    date: format(new Date(), 'yyyy-MM-dd'),
    invoice: initialInvoice?.id || '',
  }), [resolvedCustomer, initialInvoice, invoiceOutstanding]);

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

  const handleSubmit = (values) => {
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

    recordPaymentMutation.mutate(paymentData);
  };

  const inputClass = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize
      validationSchema={paymentSchema}
      onSubmit={handleSubmit}
    >
      {({ values, setFieldValue, isSubmitting }) => (
        <Form className="space-y-4">
          {initialInvoice ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Selected Invoice</div>
                  <div className="text-white font-semibold">#{initialInvoice.invoice_number}</div>
                  <div className="text-xs text-gray-400 mt-1">{resolvedCustomer?.name || initialInvoice.customer_name || 'Customer'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Outstanding</div>
                  <div className="text-green-400 font-bold">{getCurrencySymbol()}{formatAmount(invoiceOutstanding)}</div>
                </div>
              </div>
              <div className="text-[11px] text-cyan-300/80">
                This payment will be linked directly to the selected invoice.
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClass}>Customer *</label>
              <PaymentCustomerAutocomplete values={values} setFieldValue={setFieldValue} />
            </div>
          )}

          <Field name="customer" type="hidden" />
          <Field name="invoice" type="hidden" />
          <ErrorMessage name="customer" component="div" className="mt-1 text-xs text-red-400" />

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Amount Paid *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">{getCurrencySymbol()}</span>
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
              <ErrorMessage name="amount" component="div" className="mt-1 text-xs text-red-400" />
            </div>

            <div>
              <label className={labelClass}>Date *</label>
              <Field
                id="date"
                name="date"
                type="date"
                className={inputClass}
              />
              <ErrorMessage name="date" component="div" className="mt-1 text-xs text-red-400" />
            </div>
          </div>

          {/* Total Due & Remaining Card */}
          {initialInvoice && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-white/5 rounded-xl border border-white/10 animate-fade-in">
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Total Due</div>
                <div className="text-base font-bold text-white">{getCurrencySymbol()}{formatAmount(invoiceOutstanding)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Remaining</div>
                <div className={`text-base font-bold ${Math.max(roundTo3(invoiceOutstanding) - roundTo3(values.amount || 0), 0) <= 0 ? 'text-green-400' : 'text-amber-400'}`}>
                  {getCurrencySymbol()}{formatAmount(Math.max(roundTo3(invoiceOutstanding) - roundTo3(values.amount || 0), 0))}
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
                      ? `${modeItem.bg} border-white/30 ring-2 ring-white/20`
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  {React.createElement(modeItem.icon, {
                    className: `w-5 h-5 mx-auto mb-1 ${values.mode === key ? modeItem.color : 'text-gray-400'}`
                  })}
                  <span className={`text-xs font-medium ${values.mode === key ? 'text-white' : 'text-gray-400'}`}>
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
            <ErrorMessage name="description" component="div" className="mt-1 text-xs text-red-400" />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || recordPaymentMutation.isLoading}
              className="btn-primary py-2.5 px-6 shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
            >
              {isSubmitting || recordPaymentMutation.isLoading ? (
                <span className="flex items-center gap-2">
                   <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Recording...
                </span>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 text-white" />
                  <span>Record Payment</span>
                </>
              )}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}