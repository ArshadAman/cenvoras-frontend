import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateLedgerEntry } from "../../api/ledger";
import { getCustomers } from "../../api/customers";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Customer Autocomplete for ledger entry form
function LedgerCustomerAutocomplete({ values, setFieldValue, initialCustomer }) {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(initialCustomer || "");

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
    
    if (value !== initialCustomer) {
      setFieldValue('customer', '');
    }

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
          onFocus={() => {
            if (filteredCustomers.length > 0 && inputValue.trim()) {
              setShowDropdown(true);
            }
          }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Type to search customers..."
          className={inputClass}
        />
      </div>
      
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 shadow-2xl max-h-60 rounded-xl py-1 overflow-auto">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
              onClick={() => selectCustomer(customer)}
            >
              <div className="font-bold text-white">{customer.name}</div>
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

const ledgerEntrySchema = Yup.object().shape({
  customer: Yup.string().required("Please select a customer"),
  date: Yup.string().required("Date is required"),
  description: Yup.string()
    .required("Description is required")
    .min(1, "Description must be at least 1 character")
    .max(255, "Description must be less than 255 characters"),
  debit: Yup.number()
    .min(0, "Debit must be positive or zero")
    .test('debit-credit-validation', 'Either debit or credit must be greater than 0', function(value) {
      const { credit } = this.parent;
      const debitValue = parseFloat(value) || 0;
      const creditValue = parseFloat(credit) || 0;
      return debitValue > 0 || creditValue > 0;
    }),
  credit: Yup.number()
    .min(0, "Credit must be positive or zero")
    .test('credit-debit-validation', 'Either debit or credit must be greater than 0', function(value) {
      const { debit } = this.parent;
      const creditValue = parseFloat(value) || 0;
      const debitValue = parseFloat(debit) || 0;
      return creditValue > 0 || debitValue > 0;
    }),
  invoice: Yup.string().nullable()
});

export default function LedgerEntryForm({ entry, onSuccess, onCancel }) {
  const queryClient = useQueryClient();
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    if (entry?.customer?.name) {
      setCustomerName(entry.customer.name);
    }
  }, [entry?.customer]);

  const updateEntryMutation = useMutation({
    mutationFn: ({ id, data }) => updateLedgerEntry(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["clientLedger"] });
      queryClient.invalidateQueries({ queryKey: ["ledgerStats"] });
      toast.success("Ledger entry updated successfully!");
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update ledger entry");
    },
  });

  const handleSubmit = (values) => {
    const entryData = {
      customer: values.customer,
      date: values.date,
      description: values.description,
      invoice: values.invoice || null,
      debit: parseFloat(values.debit) || 0,
      credit: parseFloat(values.credit) || 0,
    };

    updateEntryMutation.mutate({ id: entry.id, data: entryData });
  };

  const initialValues = {
    customer: entry?.customer_id || "",
    customer_name: customerName,
    date: entry?.date || format(new Date(), 'yyyy-MM-dd'),
    description: entry?.description || "",
    invoice: entry?.invoice || "",
    debit: entry?.debit || "",
    credit: entry?.credit || "",
  };

  const inputClass = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={ledgerEntrySchema}
      onSubmit={handleSubmit}
      enableReinitialize={true}
    >
      {({ values, setFieldValue, isSubmitting }) => (
        <Form className="space-y-5">
          {/* Customer Selection */}
          <div>
            <label className={labelClass}>Customer *</label>
            <LedgerCustomerAutocomplete 
              values={values} 
              setFieldValue={setFieldValue} 
              initialCustomer={customerName}
            />
            <Field name="customer" type="hidden" />
            <ErrorMessage name="customer" component="div" className="mt-1 text-xs text-red-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Date */}
            <div>
              <label className={labelClass}>Date *</label>
              <Field
                name="date"
                type="date"
                className={inputClass}
              />
              <ErrorMessage name="date" component="div" className="mt-1 text-xs text-red-400" />
            </div>

            {/* Invoice (optional) */}
            <div>
              <label className={labelClass}>Invoice ID (Optional)</label>
              <Field
                name="invoice"
                type="text"
                className={inputClass}
                placeholder="INV-..."
              />
              <ErrorMessage name="invoice" component="div" className="mt-1 text-xs text-red-400" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description *</label>
            <Field
              name="description"
              as="textarea"
              rows={2}
              className={inputClass}
              placeholder="Enter transaction description..."
            />
            <ErrorMessage name="description" component="div" className="mt-1 text-xs text-red-400" />
          </div>

          {/* Debit and Credit */}
          <div className="grid grid-cols-2 gap-5 p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <label className={labelClass}>Debit (Receivable)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <Field
                  name="debit"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`${inputClass} pl-7`}
                  placeholder="0.00"
                />
              </div>
              <ErrorMessage name="debit" component="div" className="mt-1 text-xs text-red-400" />
            </div>

            <div>
              <label className={labelClass}>Credit (Received)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <Field
                  name="credit"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`${inputClass} pl-7`}
                  placeholder="0.00"
                />
              </div>
              <ErrorMessage name="credit" component="div" className="mt-1 text-xs text-red-400" />
            </div>
          </div>

          <div className="text-xs text-cyan-400/80 italic text-center">
            * Either debit or credit must be greater than 0.
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
              disabled={isSubmitting || updateEntryMutation.isLoading}
              className="btn-primary py-2 px-6 shadow-lg shadow-blue-500/20"
            >
              {isSubmitting || updateEntryMutation.isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating...
                </span>
              ) : (
                "Update Entry"
              )}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}