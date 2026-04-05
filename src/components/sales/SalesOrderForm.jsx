import React, { useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createSalesOrder, updateSalesOrder } from "../../api/sales_order";
import { getProducts } from "../../api/sales";
import { getCustomers } from "../../api/customers";
import { getWarehouses, getStockPoints } from "../../api/inventory";
import { INDIAN_STATES } from "../../utils/constants";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Product Autocomplete Component (Reused logic)
function ProductAutocomplete({ idx, values, setFieldValue, onInputChange, products }) {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(values.items[idx]?.product || "");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const selectProduct = (product) => {
    setFieldValue(`items.${idx}.product`, product.name);
    setFieldValue(`items.${idx}.product_id`, product.id);
    setFieldValue(`items.${idx}.unit`, product.unit || 'pcs');
    setFieldValue(`items.${idx}.price`, product.price ?? 0);
    const quantity = values.items[idx]?.quantity || 1;
    const amount = quantity * (product.price ?? 0);
    setFieldValue(`items.${idx}.amount`, amount);
    // setFieldValue(`items.${idx}.hsn_sac_code`, product.hsn_code || product.hsn_sac_code || ""); // Not strictly needed for Order
    setFieldValue(`items.${idx}.isExistingProduct`, true);
    setInputValue(product.name);
    setShowDropdown(false);
    setSelectedIndex(-1);
    
    if (onInputChange) {
      onInputChange();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFieldValue(`items.${idx}.product`, value);
    setFieldValue(`items.${idx}.isExistingProduct`, false);
    setFieldValue(`items.${idx}.product_id`, null);
    setSelectedIndex(-1);

    if (value.trim()) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <Field name={`items.${idx}.product`}>
        {({ field, meta }) => (
          <div>
            <input
              {...field}
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Product name"
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all text-sm"
              autoComplete="off"
            />
            {meta.touched && meta.error && (
              <div className="text-red-400 text-xs mt-1">{meta.error}</div>
            )}
          </div>
        )}
      </Field>
      {showDropdown && (
        <div className="absolute z-50 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl w-full max-h-60 overflow-y-auto backdrop-blur-xl">
          {filteredProducts.slice(0, 50).map((product, index) => (
            <div
              key={product.id}
              className={`px-4 py-3 cursor-pointer text-sm border-b border-white/5 last:border-0 transition-colors ${
                index === selectedIndex 
                  ? 'bg-purple-500/20 text-white' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => selectProduct(product)}
            >
              <div className="font-medium">{product.name}</div>
              <div className="text-gray-500 text-xs mt-0.5">
                Unit: {product.unit} | Price: ₹{product.price}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Customer Autocomplete Component (Reused logic)
// Customer Autocomplete Component  
function CustomerAutocomplete({ values, setFieldValue, customers }) {
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(values.customer_name || "");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

  // Sync inputValue with Formik values
  useEffect(() => {
    setInputValue(values.customer_name || "");
  }, [values.customer_name]);

  const selectCustomer = (customer) => {
    // New API: set customer_name directly, optionally set email for Customer record creation
    setFieldValue('customer_name', customer.name);
    setFieldValue('customer_email', customer.email || '');
    setFieldValue('customer_phone', customer.phone || '');
    setFieldValue('customer_address', customer.address || '');
    setFieldValue('customer_gstin', customer.gstin || '');
    setInputValue(customer.name);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFieldValue('customer_name', value);  // For manual entry, store the name
    setSelectedIndex(-1);

    if (value.trim()) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCustomers(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <Field name="customer_name">
        {({ field, meta }) => (
          <div>
            <input
              name="customer_name"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onFocus={() => {
                if (inputValue.trim()) {
                  setShowDropdown(true);
                }
              }}
              onKeyDown={(e) => {
                if (showDropdown) {
                  const displayLimit = Math.min(filteredCustomers.length, 50);
                  const totalItems = displayLimit + (inputValue.trim() ? 1 : 0); // +1 for "Add New"
                  
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev < totalItems - 1) ? prev + 1 : 0);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev > 0) ? prev - 1 : totalItems - 1);
                  } else if (e.key === 'Enter' && selectedIndex >= 0) {
                    e.preventDefault();
                    if (selectedIndex < displayLimit) {
                      selectCustomer(filteredCustomers[selectedIndex]);
                    } else {
                      // "Add New Customer" option
                      setShowNewCustomerModal(true);
                       setShowDropdown(false);
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowDropdown(false);
                    setSelectedIndex(-1);
                  }
                }
              }}
              placeholder="Customer name"
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
            />
            {meta.touched && meta.error && (
              <div className="text-red-400 text-sm mt-1">{meta.error}</div>
            )}
          </div>
        )}
      </Field>
      {showDropdown && (
        <div className="absolute z-50 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl w-full max-h-60 overflow-y-auto backdrop-blur-xl">
          {filteredCustomers.slice(0, 50).map((customer, index) => (
            <div
              key={customer.id}
              className={`px-4 py-3 cursor-pointer text-sm border-b border-white/5 last:border-0 transition-colors ${
                index === selectedIndex
                  ? 'bg-purple-500/20 text-white' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => selectCustomer(customer)}
            >
              <div className="font-medium">{customer.name}</div>
              <div className="text-gray-500 text-xs mt-0.5">
                {customer.email && `${customer.email} | `}
                {customer.address} {customer.gstin && `| GSTIN: ${customer.gstin}`}
              </div>
            </div>
          ))}
          {filteredCustomers.length > 50 && (
             <div className="px-4 py-2 text-xs text-gray-500 text-center italic border-t border-white/5">
                Showing top 50 results...
             </div>
          )}
          {inputValue.trim() && (
            <div
              className={`px-4 py-3 cursor-pointer text-sm border-t border-white/10 ${
                selectedIndex === Math.min(filteredCustomers.length, 50)
                  ? 'bg-purple-500/20 text-white' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => {
                setShowNewCustomerModal(true);
                setShowDropdown(false);
              }}
            >
              <div className="font-medium text-purple-400 flex items-center gap-2">
                <span>➕</span> Add New Customer: "{inputValue}"
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Add New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowNewCustomerModal(false)}></div>
          <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl shadow-purple-900/30 animate-fade-up overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Add New Customer</h3>
              <button
                type="button"
                onClick={() => setShowNewCustomerModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Form */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Name *</label>
                <input
                  type="text"
                  defaultValue={inputValue}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                  id="new-customer-name"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                  id="new-customer-email"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Phone</label>
                <input
                  type="tel"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                  id="new-customer-phone"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-5 pt-0 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowNewCustomerModal(false)}
                className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const name = document.getElementById('new-customer-name').value;
                  const email = document.getElementById('new-customer-email').value;
                  const phone = document.getElementById('new-customer-phone').value;
                  
                  setFieldValue('customer_name', name);
                  setFieldValue('customer_email', email);
                  setFieldValue('customer_phone', phone);
                  setInputValue(name);
                  setShowNewCustomerModal(false);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white rounded-lg transition-all shadow-lg shadow-purple-900/30 text-sm font-medium"
              >
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SalesOrderSchema = Yup.object().shape({
  customer_name: Yup.string().required("Customer name is required"),
  customer_email: Yup.string().email("Invalid email format").nullable(),
  customer_phone: Yup.string().nullable(),
  order_number: Yup.string().required("Order number is required"),
  date: Yup.string().required("Date is required"),
  items: Yup.array().of(
    Yup.object().shape({
      product_id: Yup.string().nullable(),
      product: Yup.string().required("Product is required"),
      quantity: Yup.number().required("Quantity is required").min(1),
      price: Yup.number().required("Price is required").min(0),
      amount: Yup.number().required("Amount is required"),
    })
  ).min(1, "At least one item is required"),
});

export default function SalesOrderForm({ isOpen, onClose, editData }) {
  const queryClient = useQueryClient();
  const isEdit = !!editData;
  
  const { data: productsResult } = useQuery({ 
      queryKey: ["products"], 
      queryFn: getProducts,
      staleTime: 5 * 60 * 1000, 
  });
  const products = Array.isArray(productsResult) ? productsResult : productsResult?.data || productsResult?.results || [];

  const { data: customersResult } = useQuery({ 
      queryKey: ["customers"], 
      queryFn: getCustomers,
      staleTime: 5 * 60 * 1000, 
  });
  const customers = Array.isArray(customersResult) ? customersResult : customersResult?.data || customersResult?.results || [];

  const createMutation = useMutation({
    mutationFn: createSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      toast.success("Sales Order created successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create sales order");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateSalesOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      toast.success("Sales Order updated successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update sales order");
    },
  });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-7xl max-h-[95vh] overflow-y-auto bento-card !p-0 shadow-2xl shadow-purple-900/20 animate-fade-up border border-white/10 bg-[#111]">
        <div className="flex justify-between items-center p-8 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              {isEdit ? "Edit Sales Order" : "New Sales Order"}
            </h2>
             <p className="text-xs text-gray-400">
               Create a new sales order for a customer.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
           <span className="text-2xl">×</span>
          </button>
        </div>
        
        <Formik
          initialValues={{
            customer: editData?.customer || "",
            customer_name: editData?.customer_display_name || editData?.customer_name || "",
            customer_email: editData?.customer_email || "",
            customer_phone: editData?.customer_phone || "",
            order_number: editData?.order_number || `SO-${Date.now()}`,
            date: editData?.date || new Date().toISOString().split('T')[0],
            notes: editData?.notes || "",
            
            items: editData?.items?.map(item => ({
              product: item.product_name || item.product || "",
              product_id: item.product || null,
              quantity: item.quantity || 1,
              price: item.price || 0,
              amount: item.amount || (item.quantity * item.price) || 0,
              unit: item.unit || "pcs",
              isExistingProduct: !!(item.product),
            })) || [{
              product: "",
              product_id: null,
              quantity: 1,
              price: 0,
              amount: 0,
              unit: "pcs",
              isExistingProduct: false,
            }]
          }}
          validationSchema={SalesOrderSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
               const processedItems = values.items.map(item => ({
                  product: item.product_id, // Must be UUID
                  quantity: Number(item.quantity),
                  price: Number(item.price),
                  amount: Number(item.amount),
               }));
               
               const totalAmount = processedItems.reduce((sum, item) => sum + item.amount, 0);

               const formData = {
                   customer_name: values.customer_name,
                   customer_email: values.customer_email || null,
                   customer_phone: values.customer_phone || null,
                   order_number: values.order_number,
                   date: values.date,
                   total_amount: totalAmount,
                   notes: values.notes,
                   items: processedItems
               };

               if (isEdit) {
                 updateMutation.mutate({ id: editData.id, data: formData });
               } else {
                 createMutation.mutate(formData);
               }
            } catch (error) {
               console.error(error);
            }
            setSubmitting(false);
          }}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="p-0">
                <div className="p-8 space-y-8">
                     {/* Header */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                           <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Customer *</label>
                           <CustomerAutocomplete values={values} setFieldValue={setFieldValue} customers={customers} />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Order Number</label>
                           <Field name="order_number" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white" />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Date</label>
                           <Field name="date" type="date" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white" />
                        </div>
                   </div>

                   {/* Items */}
                   <FieldArray name="items">
                    {({ push, remove }) => (
                        <div className="space-y-4">
                            {values.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-4 items-end bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="col-span-4">
                                        <label className="block text-xs text-gray-400 mb-1">Product</label>
                                        <ProductAutocomplete idx={index} values={values} setFieldValue={setFieldValue} products={products} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs text-gray-400 mb-1">Qty</label>
                                        <Field name={`items.${index}.quantity`} type="number" className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white" 
                                            onChange={e => {
                                                const qty = e.target.value;
                                                setFieldValue(`items.${index}.quantity`, qty);
                                                setFieldValue(`items.${index}.amount`, qty * (values.items[index].price || 0));
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs text-gray-400 mb-1">Price</label>
                                        <Field name={`items.${index}.price`} type="number" className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white"
                                            onChange={e => {
                                                const price = e.target.value;
                                                setFieldValue(`items.${index}.price`, price);
                                                setFieldValue(`items.${index}.amount`, (values.items[index].quantity || 0) * price);
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs text-gray-400 mb-1">Amount</label>
                                        <div className="px-3 py-2 text-white font-mono">
                                            {values.items[index].amount}
                                        </div>
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-300">Remove</button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={() => push({ product: "", quantity: 1, price: 0, amount: 0 })} className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                                + Add Item
                            </button>
                        </div>
                    )}
                   </FieldArray>

                   {/* Footer Actions */}
                   <div className="flex justify-end pt-6 border-t border-white/10">
                        <button type="submit" disabled={isSubmitting} className="btn-primary">
                            {isSubmitting ? "Saving..." : "Save Order"}
                        </button>
                   </div>
                </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>,
    document.body
  );
}
