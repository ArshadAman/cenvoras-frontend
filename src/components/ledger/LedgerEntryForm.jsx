import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateLedgerEntry } from "../../api/ledger";
import { getCustomers } from "../../api/customers";
import { toast } from "react-toastify";
import { format } from "date-fns";

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
    
    // Only clear customer ID if user is actually typing (not just setting initial value)
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

  return (
    <div className="relative">
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
        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
      
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black dark:ring-gray-600 ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm"
              onClick={() => selectCustomer(customer)}
            >
              <div className="font-medium text-gray-900 dark:text-white">{customer.name}</div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                {customer.email && `${customer.email}`}
                {customer.phone && ` | ${customer.phone}`}
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

  // Set customer name from entry data (customer object is already included in the response)
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

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={ledgerEntrySchema}
      onSubmit={handleSubmit}
      enableReinitialize={true}
    >
      {({ values, setFieldValue, isSubmitting }) => (
        <Form className="space-y-4">
          {/* Customer Selection */}
          <div>
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Customer *
            </label>
            <LedgerCustomerAutocomplete 
              values={values} 
              setFieldValue={setFieldValue} 
              initialCustomer={customerName}
            />
            <Field name="customer" type="hidden" />
            <ErrorMessage name="customer" component="div" className="mt-1 text-sm text-red-600" />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date *
            </label>
            <Field
              name="date"
              type="date"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <ErrorMessage name="date" component="div" className="mt-1 text-sm text-red-600" />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <Field
              name="description"
              as="textarea"
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none"
              placeholder="Enter transaction description"
            />
            <ErrorMessage name="description" component="div" className="mt-1 text-sm text-red-600" />
          </div>

          {/* Invoice (optional) */}
          <div>
            <label htmlFor="invoice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Invoice ID (optional)
            </label>
            <Field
              name="invoice"
              type="text"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter invoice ID if applicable"
            />
            <ErrorMessage name="invoice" component="div" className="mt-1 text-sm text-red-600" />
          </div>

          {/* Debit and Credit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="debit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Debit Amount
              </label>
              <Field
                name="debit"
                type="number"
                step="0.01"
                min="0"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="0.00"
              />
              <ErrorMessage name="debit" component="div" className="mt-1 text-sm text-red-600" />
            </div>

            <div>
              <label htmlFor="credit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Credit Amount
              </label>
              <Field
                name="credit"
                type="number"
                step="0.01"
                min="0"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="0.00"
              />
              <ErrorMessage name="credit" component="div" className="mt-1 text-sm text-red-600" />
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            * Note: Either debit or credit must be greater than 0. Both cannot be zero.
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || updateEntryMutation.isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || updateEntryMutation.isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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