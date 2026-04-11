import React, { useEffect, useRef, useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createSalesInvoice, updateSalesInvoice, getProducts, getNextInvoiceNumber } from "../../api/sales";
import { getCustomers } from "../../api/customers";
import { getWarehouses, getStockPoints } from "../../api/inventory"; // Added imports
import { getInvoiceSettings, updateInvoiceSettings } from "../../api/invoice_settings";
import { INDIAN_STATES } from "../../utils/constants"; // Added imports
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // Added useQuery

// Product Autocomplete Component
function ProductAutocomplete({ idx, values, setFieldValue, onInputChange, products, onProductSearchChange, showDescription = true }) {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(values.items[idx]?.product || "");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState(null);

  const updateDropdownPosition = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: `${rect.bottom + 6}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: 9999,
    });
  };

  useEffect(() => {
    const query = (inputValue || "").trim().toLowerCase();
    if (!query) {
      setFilteredProducts([]);
      setShowDropdown(false);
      return;
    }

    const filtered = (products || []).filter((product) =>
      (product?.name || "").toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
    setShowDropdown(isFocused && filtered.length > 0);
  }, [inputValue, products, isFocused]);

  useEffect(() => {
    if (!showDropdown) return;

    updateDropdownPosition();

    const handleReposition = () => updateDropdownPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [showDropdown, inputValue, filteredProducts.length]);

  const selectProduct = (product) => {
    setFieldValue(`items.${idx}.product`, product.name);
    setFieldValue(`items.${idx}.product_id`, product.id);
    setFieldValue(`items.${idx}.unit`, product.unit || 'pcs');
    setFieldValue(`items.${idx}.price`, product.price ?? 0);
    // Calculate amount automatically
    const quantity = values.items[idx]?.quantity || 1;
    const amount = quantity * (product.price ?? 0);
    setFieldValue(`items.${idx}.amount`, amount);
    setFieldValue(`items.${idx}.hsn_sac_code`, product.hsn_code || product.hsn_sac_code || "");
    setFieldValue(`items.${idx}.product_description`, product.description || "");
    setFieldValue(`items.${idx}.discount`, 0);
    setFieldValue(`items.${idx}.tax`, product.tax || 0);
    setFieldValue(`items.${idx}.isExistingProduct`, true);
    setInputValue(product.name);
    setShowDropdown(false);
    setSelectedIndex(-1);
    
    // Trigger auto-add row functionality after product selection
    if (onInputChange) {
      onInputChange();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (onProductSearchChange) {
      onProductSearchChange(value.trim());
    }
    setFieldValue(`items.${idx}.product`, value);
    setFieldValue(`items.${idx}.isExistingProduct`, false);
    setFieldValue(`items.${idx}.product_id`, null);
    setFieldValue(`items.${idx}.product_description`, "");
    setSelectedIndex(-1);
    if (!value.trim()) {
      setShowDropdown(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Field name={`items.${idx}.product`}>
        {({ field, meta }) => (
          <div>
            <input
              {...field}
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => {
                setIsFocused(true);
                if ((inputValue || "").trim() && filteredProducts.length > 0) {
                  setShowDropdown(true);
                }
              }}
              onBlur={() => {
                setIsFocused(false);
                setTimeout(() => setShowDropdown(false), 100);
              }}
              placeholder="Product name"
              className="w-full bg-[#111] border border-white/10 rounded px-2 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all text-xs"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'Tab' || (e.key === 'Enter' && !showDropdown)) {
                  e.preventDefault();
                  const nextInput = e.target.closest('.grid').querySelector(`input[name="items.${idx}.quantity"]`);
                  if (nextInput) nextInput.focus();
                }
                // Handle dropdown navigation
                if (showDropdown && filteredProducts.length > 0) {
                  const displayLimit = Math.min(filteredProducts.length, 50);
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev < displayLimit - 1) ? prev + 1 : 0);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev > 0) ? prev - 1 : displayLimit - 1);
                  } else if (e.key === 'Enter' && selectedIndex >= 0) {
                    e.preventDefault();
                    selectProduct(filteredProducts[selectedIndex]);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowDropdown(false);
                    setSelectedIndex(-1);
                  }
                }
              }}
            />
            {meta.touched && meta.error && (
              <div className="text-red-400 text-xs mt-1">{meta.error}</div>
            )}
            {showDescription && !!values.items[idx]?.product_description && (
              <small className="block mt-1 text-[11px] text-gray-500 leading-tight">
                {values.items[idx].product_description}
              </small>
            )}
          </div>
        )}
      </Field>
        {showDropdown && dropdownStyle && typeof document !== "undefined" && createPortal(
          <div
            style={dropdownStyle}
            className="max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl backdrop-blur-xl"
          >
            {filteredProducts.slice(0, 50).map((product, index) => (
              <div
                key={product.id}
                className={`cursor-pointer border-b border-white/5 px-4 py-3 text-sm transition-colors last:border-0 ${
                  index === selectedIndex
                    ? 'bg-cyan-500/20 text-white'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  selectProduct(product);
                }}
              >
                <div className="font-medium">{product.name}</div>
                <div className="mt-0.5 text-xs text-gray-500">
                  Unit: {product.unit} | Price: ₹{product.price}
                </div>
              </div>
            ))}
            {filteredProducts.length > 50 && (
              <div className="border-t border-white/5 px-4 py-2 text-center text-xs italic text-gray-500">
                Showing top 50 results...
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

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
    // Auto-fill delivery address same as customer address
    setFieldValue('delivery_address', customer.address || '');
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
        {({ meta }) => (
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
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
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
                  ? 'bg-cyan-500/20 text-white' 
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
                  ? 'bg-cyan-500/20 text-white' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => {
                setShowNewCustomerModal(true);
                setShowDropdown(false);
              }}
            >
              <div className="font-medium text-cyan-400 flex items-center gap-2">
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
          <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl shadow-blue-900/30 animate-fade-up overflow-hidden">
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
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  id="new-customer-name"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  id="new-customer-email"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Phone</label>
                <input
                  type="tel"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  id="new-customer-phone"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Address</label>
                <textarea
                  rows={2}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all resize-none"
                  id="new-customer-address"
                  placeholder="Full address"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">GSTIN</label>
                <input
                  type="text"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  id="new-customer-gstin"
                  placeholder="e.g., 29AAKCG6382L1ZU"
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
                  const address = document.getElementById('new-customer-address').value;
                  const gstin = document.getElementById('new-customer-gstin').value;
                  
                  setFieldValue('customer_name', name);
                  setFieldValue('customer_email', email);
                  setFieldValue('customer_phone', phone);
                  setFieldValue('customer_address', address);
                  setFieldValue('customer_gstin', gstin);
                  setFieldValue('delivery_address', address);
                  setInputValue(name);
                  setShowNewCustomerModal(false);
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg transition-all shadow-lg shadow-blue-900/30 text-sm font-medium"
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

const SalesSchema = Yup.object().shape({
  // Required fields
  customer_name: Yup.string().required("Customer name is required").min(1).max(255),
  invoice_number: Yup.string().required("Invoice number is required").min(1).max(100),
  warehouse: Yup.string().nullable(),
  invoice_date: Yup.string().required("Invoice date is required"),
  
  // Optional fields for customer record creation
  customer_email: Yup.string().email("Invalid email format").nullable(),
  customer_phone: Yup.string().nullable(),
  customer_address: Yup.string().nullable(),
  customer_gstin: Yup.string().nullable(),
  delivery_address: Yup.string().nullable(),
  
  // Optional invoice fields
  due_date: Yup.string().nullable(),
  gst_treatment: Yup.string().nullable(),
  journal: Yup.string().nullable(),
  total_amount: Yup.number().nullable(),
  
  // Items array - at least one item required
  items: Yup.array().of(
    Yup.object().shape({
      // Required item fields
      product: Yup.string().required("Product is required").min(1),
      quantity: Yup.number().required("Quantity is required").min(1),
      batch: Yup.string().nullable(), // Make batch optional for now, or required if needed
      price: Yup.number().required("Price is required").min(0),
      amount: Yup.number().required("Amount is required").min(0),
      
      // Optional item fields
      hsn_sac_code: Yup.string().nullable(),
      unit: Yup.string().nullable(),
      discount: Yup.number().nullable().min(0),
      tax: Yup.number().nullable().min(0),
    })
  ).min(1, "At least one item is required"),
});

const units = ["pcs", "kg", "ltr", "box", "meter"];

const DEFAULT_ITEM_SETTINGS = {
  show_item_description: true,
  show_item_hsn: true,
  show_item_batch: true,
  require_item_batch: false,
  show_item_free_quantity: true,
  show_item_discount: true,
  show_item_tax: true,
};

export default function SalesForm({ isOpen, onClose, editData, invoicePrefix = "INV-" }) {
  // Keyboard Shortcuts Logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F2 to Save
      if (e.key === "F2") {
        e.preventDefault();
        const submitBtn = document.querySelector('button[type="submit"]');
        if(submitBtn) {
            submitBtn.click();
            toast.info("Saving Invoice (F2)...");
        }
      }
      
      // Esc to Close
      if (e.key === "Escape") {
        const isDropdownOpen = document.querySelector('.absolute.z-10'); // Basic check if any autocomplete is open
        if (!isDropdownOpen) {
             e.preventDefault();
             onClose();
        }
      }

      // Enter Navigation (Enter acts like Tab)
      if (e.key === "Enter") {
        const target = e.target;
        // Only if it's an input or select, and NOT a button/textarea
        if ((target.tagName === "INPUT" || target.tagName === "SELECT") && !target.dataset.noEnter) {
          e.preventDefault();
          const form = target.form;
          if (form) {
              const index = Array.prototype.indexOf.call(form, target);
              // Find next navigable element
              let nextIndex = index + 1;
              while (form.elements[nextIndex]) {
                 const next = form.elements[nextIndex];
                 // Skip hidden, disabled, or readOnly that shouldn't be focused
                 if (next.tagName !== "FIELDSET" && !next.hidden && !next.disabled && next.offsetParent !== null && next.tabIndex >= 0) {
                     next.focus();
                     break;
                 }
                 nextIndex++;
              }
              // If last element, maybe add row? For now just stop.
          }
        }
      }
    };

    if (isOpen) {
        window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
  const queryClient = useQueryClient();
  const isEdit = !!editData;
  const formikRef = React.useRef(null);
  const submitActionRef = React.useRef('final');
  const [productSearch, setProductSearch] = useState("");
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [roundOffApplied, setRoundOffApplied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const existingRoundOff = Number(editData?.round_off || 0);
    setRoundOffApplied(existingRoundOff !== 0);
  }, [isOpen, editData?.id, editData?.round_off]);

  const computeRoundedTotal = (amount) => {
    const integerPart = Math.floor(amount);
    const fraction = amount - integerPart;
    return fraction >= 0.5 ? Math.ceil(amount) : Math.floor(amount);
  };
  
  const { data: warehousesResult } = useQuery({ queryKey: ["warehouses"], queryFn: getWarehouses });
  const warehouses = Array.isArray(warehousesResult) ? warehousesResult : warehousesResult?.data || warehousesResult?.results || [];
  
  
  // Lifted state: Fetch products and customers once at top level
  const { data: productsResult } = useQuery({ 
      queryKey: ["products", productSearch], 
      queryFn: () => getProducts({
        ...(productSearch ? { search: productSearch } : {}),
        ordering: "name",
      }),
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  const products = Array.isArray(productsResult) ? productsResult : productsResult?.data || productsResult?.results || [];

  const { data: customersResult } = useQuery({ 
      queryKey: ["customers"], 
      queryFn: getCustomers,
      staleTime: 5 * 60 * 1000, 
  });
  const customers = Array.isArray(customersResult) ? customersResult : customersResult?.data || customersResult?.results || [];
  
  // State to track selected warehouse for stock filtering
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(editData?.warehouse || "");

  const { data: stockPointsResult } = useQuery({
    queryKey: ["stockPoints", selectedWarehouseId],
    queryFn: () => getStockPoints({ warehouse: selectedWarehouseId }),
    enabled: !!selectedWarehouseId
  });
  const stockPoints = Array.isArray(stockPointsResult) ? stockPointsResult : stockPointsResult?.data || stockPointsResult?.results || [];

  const { data: invoiceSettings } = useQuery({
    queryKey: ["invoiceSettings"],
    queryFn: getInvoiceSettings,
    staleTime: 5 * 60 * 1000,
  });

  const itemSettings = {
    ...DEFAULT_ITEM_SETTINGS,
    ...(invoiceSettings || {}),
  };

  const updateInvoiceSettingsMutation = useMutation({
    mutationFn: updateInvoiceSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoiceSettings"] });
    },
  });

  const handleToggleItemSetting = (key) => {
    const nextValue = !itemSettings[key];
    updateInvoiceSettingsMutation.mutate({
      ...invoiceSettings,
      [key]: nextValue,
    });
  };
  

  // Auto-focus removed: It scrolled the user to the bottom of the form which was disorienting
  
  const { data: nextInvData } = useQuery({
    queryKey: ["nextInvoiceNumber"],
    queryFn: () => getNextInvoiceNumber(invoicePrefix || "INV-"),
    enabled: !isEdit && isOpen
  });

  const createMutation = useMutation({
    mutationFn: createSalesInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      toast.success("Sales bill created successfully!");
      onClose();
    },
    onError: (error) => {
      if (error.response?.status === 409) {
          toast.error(error.response?.data?.error || "Invoice number already exists!");
      } else {
          toast.error(error.response?.data?.message || error.message || "Failed to create sales bill");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateSalesInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      toast.success("Sales bill updated successfully!");
      onClose();
    },
    onError: (error) => {
      if (error.response?.status === 409) {
          toast.error(error.response?.data?.error || "Invoice number already exists!");
      } else {
          toast.error(error.response?.data?.message || error.message || "Failed to update sales bill");
      }
    },
  });

  const handleBeforeClose = async () => {
    if (formikRef.current && formikRef.current.dirty && !createMutation.isPending && !updateMutation.isPending) {
      const values = formikRef.current.values || {};
      const cleanedItems = (values.items || []).filter((item) =>
        (item?.product && item.product.trim() !== '') || item?.product_id
      );

      const hasCustomerName = !!(values.customer_name && values.customer_name.trim());
      const hasAtLeastOneItem = cleanedItems.length > 0;

      // Only auto-save draft on close when minimum draft payload is available.
      if (hasCustomerName && hasAtLeastOneItem) {
        submitActionRef.current = 'draft';
        await formikRef.current.submitForm();
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleBeforeClose}></div>
      <div className="relative flex flex-col w-full h-full sm:h-[96vh] sm:max-h-[1200px] sm:max-w-[1600px] sm:w-[96vw] sm:rounded-[24px] shadow-2xl shadow-black/50 animate-fade-up sm:border border-white/10 bg-[#0c0c0e] overflow-hidden">
        <div className="flex-none flex justify-between items-center p-6 sm:px-8 sm:py-6 border-b border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl z-40">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              {isEdit ? "Edit Sales Invoice" : "New Sales Invoice"}
            </h2>
             <p className="text-xs text-gray-400 flex items-center gap-2">
              <span>Press <kbd className="bg-white/10 px-1 rounded text-white">F2</kbd> to save</span>
              <span>•</span>
              <span><kbd className="bg-white/10 px-1 rounded text-white">Esc</kbd> to close</span>
            </p>
          </div>
          <button
            onClick={handleBeforeClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <Formik
          innerRef={formikRef}
          initialValues={{
            // Required fields
            customer_name: editData?.customer_name || "",
            // Use fetched next number or edit data
            invoice_number: editData?.invoice_number || nextInvData?.next_number || "",
            invoice_date: editData?.invoice_date ? new Date(editData.invoice_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            
            // Optional customer fields (for Customer record creation)
            customer_email: editData?.customer_email || "",
            customer_phone: editData?.customer_phone || "",
            customer_address: editData?.customer_address || "",
            customer_gstin: editData?.customer_gstin || "",
            delivery_address: editData?.delivery_address || "",
            
            // Optional invoice fields
            due_date: editData?.due_date || "",
            po_number: editData?.po_number || "",
            po_date: editData?.po_date || "",
            challan_number: editData?.challan_number || "",
            challan_date: editData?.challan_date || "",
            gst_treatment: editData?.gst_treatment || "registered",
            place_of_supply: editData?.place_of_supply || "", // New field
            warehouse: editData?.warehouse || "", // New field
            journal: editData?.journal || "Sales",
            total_amount: editData?.total_amount || null,
            
            items: (editData?.items && editData.items.length > 0) ? editData.items.map(item => {
              const qty = item.quantity || 1;
              const price = item.price || 0;
              const itemAmount = qty * price; // Always calculate fresh: quantity * price, no tax/discount
              return {
                product: item.product || item.product_name || "",
                product_id: item.product_id || null,
                product_description: item.product_detail?.description || item.product_description || "",
                quantity: qty,
                free_quantity: item.free_quantity || 0,
                batch: item.batch || "",
                price: price,
                amount: itemAmount, // This should always be qty * price before tax/discount
                unit: item.unit || "pcs",
                hsn_sac_code: item.hsn_sac_code || item.hsn_code || "",
                discount: item.discount || 0,
                tax: item.tax || 0,
                isExistingProduct: !!(item.product_id),
              };
            }) : [{
              product: "",
              product_id: null,
              product_description: "",
              quantity: 1,
              free_quantity: 0,
              batch: "",
              price: 0,
              amount: 0, // Required field
              unit: "pcs",
              hsn_sac_code: "",
              discount: 0,
              tax: 0,
              isExistingProduct: false,
            }]
          }}
          enableReinitialize={true}
          onSubmit={async (values, { setSubmitting, setErrors, setFieldError }) => {
            const isDraft = submitActionRef.current === "draft";
            
            // Clean up empty product rows before processing/validation
            const cleanedItems = values.items.filter(item => 
              (item.product && item.product.trim() !== '') || item.product_id
            );
            const valuesToValidate = { ...values, items: cleanedItems };

            // Drafts only require customer name
            if (isDraft) {
               if (!values.customer_name || values.customer_name.trim() === '') {
                   setFieldError('customer_name', 'Customer name is required');
                   toast.error('Customer name is required to save a draft');
                   setSubmitting(false);
                   return;
               }
            } else {
                // Final Invoices require at least one item
                if (cleanedItems.length === 0) {
                   toast.error('At least one item is required to create an invoice');
                   setSubmitting(false);
                   return;
                }

                if (itemSettings.show_item_batch && itemSettings.require_item_batch) {
                  const missingBatchRow = cleanedItems.findIndex((item) => !item.batch);
                  if (missingBatchRow >= 0) {
                    toast.error(`Batch is required for row ${missingBatchRow + 1}.`);
                    setSubmitting(false);
                    return;
                  }
                }
                
                // Perform validation manually for Final invoices using the cleaned items
                try {
                  await SalesSchema.validate(valuesToValidate, { abortEarly: false });
                } catch (err) {
                  const errors = {};
                  err.inner?.forEach(e => {
                    errors[e.path] = e.message;
                  });
                  setErrors(errors);
                  
                  // Show the first error in a toast for better UX
                  if (err.inner?.length > 0) {
                    toast.error(err.inner[0].message);
                  }
                  
                  setSubmitting(false);
                  return;
                }
            }
            
            try {
              const processedItems = cleanedItems.map(item => {
                const quantity = Number(item.quantity) || 1;
                const price = Number(item.price) || 0;
                const discount = Number(item.discount) || 0;
                const tax = Number(item.tax) || 0;
                const baseAmount = quantity * price;
                const discountAmount = (baseAmount * discount) / 100;
                const taxableAmount = baseAmount - discountAmount;
                const taxAmount = (taxableAmount * tax) / 100;
                const amount = Number((taxableAmount + taxAmount).toFixed(2));
                
                return {
                  product: item.product_id || item.product, // Pass UUID if available, else name
                  quantity: quantity,
                  free_quantity: itemSettings.show_item_free_quantity ? (Number(item.free_quantity) || 0) : 0,
                  ...(itemSettings.show_item_batch && item.batch ? { batch: item.batch } : {}),
                  price: price,
                  amount: amount,
                  unit: item.unit || null,
                  hsn_sac_code: itemSettings.show_item_hsn ? (item.hsn_sac_code || null) : null,
                  discount: itemSettings.show_item_discount ? discount : 0,
                  tax: itemSettings.show_item_tax ? tax : 0,
                };
              });

              const totalAmount = processedItems.reduce((sum, item) => sum + item.amount, 0);
              const finalTotal = roundOffApplied ? computeRoundedTotal(totalAmount) : totalAmount;
              const roundOffValue = roundOffApplied
                ? Number((finalTotal - totalAmount).toFixed(2))
                : 0;

              const formData = {
                customer_name: values.customer_name,
                invoice_number: values.invoice_number,
                invoice_date: values.invoice_date,
                due_date: values.due_date || null,
                po_number: values.po_number || null,
                po_date: values.po_date || null,
                challan_number: values.challan_number || null,
                challan_date: values.challan_date || null,
                delivery_address: values.delivery_address || null,
                gst_treatment: values.gst_treatment || null,
                place_of_supply: values.place_of_supply || null,
                journal: values.journal || "Sales",
                warehouse: values.warehouse || null,
                status: isDraft ? 'draft' : 'final',
                total_amount: finalTotal.toString(),
                round_off: roundOffValue.toString(),
                items: processedItems,
                // Optional customer fields for new record creation
                ...(values.customer_email && { customer_email: values.customer_email }),
                ...(values.customer_phone && { customer_phone: values.customer_phone }),
                ...(values.customer_address && { customer_address: values.customer_address }),
                ...(values.customer_gstin && { customer_gstin: values.customer_gstin }),
              };

              console.log("DEBUG: Submitting Sales Invoice:", formData);

              if (isEdit) {
                updateMutation.mutate({ id: editData.id, data: formData });
              } else {
                createMutation.mutate(formData);
              }
            } catch (error) {
              toast.error("Error processing form data");
              console.error(error);
            }
            setSubmitting(false);
          }}
        >
          {({ values, setFieldValue, isSubmitting, handleSubmit }) => {
            // Calculate totals
            const subtotal = values.items.reduce((sum, item) => {
              const quantity = Number(item.quantity) || 0;
              const price = Number(item.price) || 0;
              return sum + (quantity * price);
            }, 0);

            const totalDiscount = values.items.reduce((sum, item) => {
              const quantity = Number(item.quantity) || 0;
              const price = Number(item.price) || 0;
              const discount = Number(item.discount) || 0;
              return sum + ((quantity * price * discount) / 100);
            }, 0);

            const totalTax = values.items.reduce((sum, item) => {
              const quantity = Number(item.quantity) || 0;
              const price = Number(item.price) || 0;
              const discount = Number(item.discount) || 0;
              const tax = Number(item.tax) || 0;
              const taxableAmount = (quantity * price) - ((quantity * price * discount) / 100);
              return sum + ((taxableAmount * tax) / 100);
            }, 0);

            const grandTotal = subtotal - totalDiscount + totalTax;
            const roundedGrandTotal = computeRoundedTotal(grandTotal);
            const roundOffDelta = Number((roundedGrandTotal - grandTotal).toFixed(2));

            return (
              <Form 
                className="flex flex-col flex-1 overflow-hidden"
                onKeyDown={(e) => {
                  // Handle global keyboard shortcuts
                  if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    e.stopPropagation();
                    // Submit the form instead of saving HTML
                    handleSubmit();
                    return false;
                  }
                  if (e.key === 'Escape') {
                    onClose();
                  }
                }}
              >
                <div className="flex-1 overflow-y-auto p-0">
                  <div className="p-6 sm:p-8 space-y-8">
                  {/* Header Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  
                    {/* Customer Autocomplete */}
                    <div className="relative">
                       <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                        Customer *
                      </label>
                      <CustomerAutocomplete 
                          values={values} 
                          setFieldValue={setFieldValue} 
                          customers={customers} 
                      />
                      <ErrorMessage name="customer_name" component="div" className="text-red-400 text-xs mt-1" />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                        Invoice Number *
                      </label>
                      <Field
                        name="invoice_number"
                        type="text"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                        placeholder="e.g. INV-ABCD-001"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                        Invoice Date *
                      </label>
                      <Field
                        name="invoice_date"
                        type="date"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                         Warehouse
                      </label>
                      <Field
                        name="warehouse"
                        as="select"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                        onChange={(e) => {
                          const val = e.target.value;
                          setFieldValue('warehouse', val);
                          setSelectedWarehouseId(val);
                        }}
                      >
                        <option value="">Select Warehouse</option>
                        {warehouses?.map(w => (
                           <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </Field>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                        Place of Supply
                      </label>
                      <Field
                        name="place_of_supply"
                        as="select"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(s => (
                          <option key={s.code} value={s.code}>{s.name}</option>
                        ))}
                      </Field>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                        Due Date
                      </label>
                      <Field
                        name="due_date"
                        type="date"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Address & Additional Fields */}
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                        Shipping Address
                      </label>
                      <Field
                        name="delivery_address"
                        as="textarea"
                        rows="3"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                        placeholder="123 Shipping Address, City, State"
                      />
                    </div>
                  </div>

                  {/* Optional PO / Challan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Purchase Order</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">PO</label>
                          <Field
                            name="po_number"
                            as="textarea"
                            rows="1"
                            className="w-full resize-y min-h-[40px] max-h-32 bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                            placeholder="Enter PO"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">PO Date</label>
                          <Field
                            name="po_date"
                            type="date"
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Delivery Challan</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Challan</label>
                          <Field
                            name="challan_number"
                            as="textarea"
                            rows="1"
                            className="w-full resize-y min-h-[40px] max-h-32 bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                            placeholder="Enter challan details"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Challan Date</label>
                          <Field
                            name="challan_date"
                            type="date"
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="p-8 bg-[#151515] border-t border-b border-white/5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className="text-lg font-bold text-white">Items</h3>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowColumnPicker((prev) => !prev)}
                        className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-gray-300"
                      >
                        Columns
                      </button>

                      {showColumnPicker && (
                        <div className="absolute right-0 top-10 z-20 w-56 rounded-xl border border-white/10 bg-[#1a1a1f] p-3 shadow-2xl">
                          <div className="mb-2 text-[11px] uppercase tracking-wide text-gray-400">Show/Hide Columns</div>
                          {[
                            ["show_item_description", "Description"],
                            ["show_item_hsn", "HSN/SAC"],
                            ["show_item_batch", "Batch"],
                            ["show_item_free_quantity", "Free Qty"],
                            ["show_item_discount", "Discount"],
                            ["show_item_tax", "Taxes"],
                            ["require_item_batch", "Require Batch"],
                          ].map(([key, label]) => {
                            if (key === "require_item_batch" && !itemSettings.show_item_batch) return null;
                            return (
                              <label key={key} className="flex items-center gap-2 py-1 text-sm text-gray-200 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!itemSettings[key]}
                                  onChange={() => handleToggleItemSetting(key)}
                                  className="h-3.5 w-3.5 rounded border-white/30 bg-transparent text-cyan-400 focus:ring-cyan-400"
                                />
                                <span>{label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <FieldArray name="items">
                    {({ push, remove }) => {
                      // Function to auto-add new row when user starts typing in the last row
                      const handleAutoAddRow = (currentIndex) => {
                        const isLastRow = currentIndex === values.items.length - 1;
                        const currentItem = values.items[currentIndex];
                        
                        // Check if current row has meaningful data (product name or any other field)
                        const hasData = currentItem?.product?.trim() || 
                                       (currentItem?.quantity && currentItem.quantity > 1) || 
                                       (currentItem?.price && currentItem.price > 0) || 
                                       currentItem?.hsn_sac_code?.trim();
                        
                        if (isLastRow && hasData) {
                          // Only add if there isn't already an empty row at the end
                          const nextRowExists = values.items[currentIndex + 1];
                          if (!nextRowExists) {
                            // Add new empty row
                            push({
                              product_name: "",
                              product_id: null,
                              product_description: "",
                              quantity: 1,
                              free_quantity: 0,
                              batch: "",
                              unit: "pcs", 
                              price: 0,
                              discount: 0,
                              tax: 0,
                              hsn_sac_code: "",
                              tax_rate: 0,
                              amount: 0,
                              isExistingProduct: false,
                            });
                          }
                        }
                      };

                      return (
                        <div className="space-y-2">
                          {(() => {
                            const desktopColumns = [
                              { key: "product", label: "Product", show: true, width: "minmax(340px, 1fr)", minWidth: 340 },
                              { key: "hsn", label: "HSN/SAC Code", show: itemSettings.show_item_hsn, width: "120px", minWidth: 120 },
                              { key: "batch", label: "Batch", show: itemSettings.show_item_batch, width: "140px", minWidth: 140 },
                              { key: "quantity", label: "Quantity", show: true, width: "80px", minWidth: 80 },
                              { key: "free", label: "Free", show: itemSettings.show_item_free_quantity, width: "70px", minWidth: 70 },
                              { key: "unit", label: "Unit", show: true, width: "70px", minWidth: 70 },
                              { key: "price", label: "Price", show: true, width: "110px", minWidth: 110 },
                              { key: "discount", label: "Disc.%", show: itemSettings.show_item_discount, width: "80px", minWidth: 80 },
                              { key: "tax", label: "Taxes", show: itemSettings.show_item_tax, width: "90px", minWidth: 90 },
                              { key: "amount", label: "Amount", show: true, width: "130px", minWidth: 130 },
                              { key: "action", label: "", show: true, width: "44px", minWidth: 44 },
                            ].filter((col) => col.show);

                            const gridTemplateColumns = desktopColumns.map((col) => col.width).join(" ");
                            const totalMinWidth = desktopColumns.reduce((sum, col) => sum + (col.minWidth || 0), 0);

                            return (
                              <>
                                <div className="hidden md:block overflow-x-auto border-y border-white/10 bg-[#1b2030]">
                                  <div className="grid items-center px-2 py-2 text-xs font-semibold text-gray-300" style={{ gridTemplateColumns, minWidth: `${totalMinWidth}px`, width: '100%' }}>
                                    {desktopColumns.map((col) => (
                                      <div
                                        key={col.key}
                                        className={[
                                          col.key === "amount" || col.key === "price" ? "text-right" : "",
                                          col.key === "quantity" || col.key === "free" || col.key === "unit" || col.key === "discount" || col.key === "tax" ? "text-center" : "",
                                        ].join(" ")}
                                      >
                                        {col.label}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="hidden md:block overflow-x-auto">
                                  {values.items.map((item, index) => {
                                    const productBatches = stockPoints
                                      ?.filter((sp) => sp.batch.product === item.product_id && sp.quantity > 0)
                                      ?.map((sp) => ({ id: sp.batch.id, name: sp.batch.batch_number, qty: sp.quantity })) || [];

                                    return (
                                      <div key={index} className="border-b border-white/10">
                                        <div className="grid items-start gap-2 px-2 py-2" style={{ gridTemplateColumns, minWidth: `${totalMinWidth}px`, width: '100%' }}>
                                          {desktopColumns.map((col) => {
                                          if (col.key === "product") {
                                            return (
                                              <div key={col.key}>
                                                <ProductAutocomplete
                                                  idx={index}
                                                  values={values}
                                                  setFieldValue={setFieldValue}
                                                  products={products}
                                                  onInputChange={() => handleAutoAddRow(index)}
                                                  onProductSearchChange={setProductSearch}
                                                  showDescription={itemSettings.show_item_description}
                                                />
                                              </div>
                                            );
                                          }

                                          if (col.key === "hsn") {
                                            return (
                                              <div key={col.key}>
                                                <Field name={`items.${index}.hsn_sac_code`} type="text" className="w-full bg-transparent border border-white/10 rounded px-2 py-2 text-xs text-gray-200" />
                                              </div>
                                            );
                                          }

                                          if (col.key === "batch") {
                                            return (
                                              <div key={col.key}>
                                                <Field name={`items.${index}.batch`}>
                                                  {({ field }) => (
                                                    <select {...field} className="w-full bg-transparent border border-white/10 rounded px-2 py-2 text-xs text-gray-200" disabled={!item.product_id}>
                                                      <option value="">Auto (FEFO)</option>
                                                      {productBatches.map((b) => (
                                                        <option key={b.id} value={b.id}>{b.name} ({b.qty})</option>
                                                      ))}
                                                    </select>
                                                  )}
                                                </Field>
                                              </div>
                                            );
                                          }

                                          if (col.key === "quantity") {
                                            return (
                                              <div key={col.key}>
                                                <Field
                                                  name={`items.${index}.quantity`}
                                                  type="number"
                                                  min="1"
                                                  className="w-full text-center bg-transparent border border-white/10 rounded px-2 py-2 text-xs text-gray-200"
                                                  onChange={(e) => {
                                                    const qty = e.target.value;
                                                    setFieldValue(`items.${index}.quantity`, qty);
                                                    const price = parseFloat(values.items[index]?.price) || 0;
                                                    setFieldValue(`items.${index}.amount`, price * (parseFloat(qty) || 0));
                                                  }}
                                                />
                                              </div>
                                            );
                                          }

                                          if (col.key === "free") {
                                            return (
                                              <div key={col.key}>
                                                <Field name={`items.${index}.free_quantity`} type="number" min="0" className="w-full text-center bg-transparent border border-white/10 rounded px-2 py-2 text-xs text-green-300" />
                                              </div>
                                            );
                                          }

                                          if (col.key === "unit") {
                                            return (
                                              <div key={col.key}>
                                                <Field name={`items.${index}.unit`}>
                                                  {({ field }) => (
                                                    <select {...field} className="w-full bg-transparent border border-white/10 rounded px-2 py-2 text-xs text-gray-200">
                                                      {units.map((u) => <option key={u} value={u}>{u}</option>)}
                                                    </select>
                                                  )}
                                                </Field>
                                              </div>
                                            );
                                          }

                                          if (col.key === "price") {
                                            return (
                                              <div key={col.key}>
                                                <Field
                                                  name={`items.${index}.price`}
                                                  type="number"
                                                  min="0"
                                                  className="w-full text-right bg-transparent border border-white/10 rounded px-2 py-2 text-sm font-mono text-gray-100"
                                                  onChange={(e) => {
                                                    const price = e.target.value;
                                                    setFieldValue(`items.${index}.price`, price);
                                                    const qty = parseFloat(values.items[index]?.quantity) || 0;
                                                    setFieldValue(`items.${index}.amount`, (parseFloat(price) || 0) * qty);
                                                    if (price && parseFloat(price) > 0) handleAutoAddRow(index);
                                                  }}
                                                />
                                              </div>
                                            );
                                          }

                                          if (col.key === "discount") {
                                            return (
                                              <div key={col.key}>
                                                <Field name={`items.${index}.discount`} type="number" className="w-full text-center bg-transparent border border-white/10 rounded px-2 py-2 text-xs text-gray-200" />
                                              </div>
                                            );
                                          }

                                          if (col.key === "tax") {
                                            return (
                                              <div key={col.key}>
                                                <Field name={`items.${index}.tax`} type="number" className="w-full text-center bg-transparent border border-white/10 rounded px-2 py-2 text-xs text-gray-200" />
                                              </div>
                                            );
                                          }

                                          if (col.key === "amount") {
                                            return (
                                              <div key={col.key} className="text-right px-1 py-2 font-semibold text-cyan-300 text-sm">
                                                {item.amount?.toFixed(2) || "0.00"}
                                              </div>
                                            );
                                          }

                                          if (col.key === "action") {
                                            return (
                                              <div key={col.key} className="flex justify-center">
                                                <button
                                                  type="button"
                                                  onClick={() => remove(index)}
                                                  disabled={values.items.length === 1}
                                                  className="text-gray-500 hover:text-red-400 transition-colors p-1.5 disabled:opacity-30"
                                                  title="Remove Item"
                                                >
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                  </svg>
                                                </button>
                                              </div>
                                            );
                                          }

                                          return null;
                                          })}
                                        </div>

                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="md:hidden space-y-3">
                                  {values.items.map((item, index) => (
                                    <div key={`mobile-${index}`} className="border-b border-white/10 pb-3">
                                      <div className="grid grid-cols-2 gap-3 py-3">
                                        <div className="col-span-2">
                                          <label className="text-xs text-gray-400">Product</label>
                                          <ProductAutocomplete
                                            idx={index}
                                            values={values}
                                            setFieldValue={setFieldValue}
                                            products={products}
                                            onInputChange={() => handleAutoAddRow(index)}
                                            onProductSearchChange={setProductSearch}
                                            showDescription={itemSettings.show_item_description}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                        
                        <div className="mt-4 flex justify-start">
                          <button
                            type="button"
                            onClick={() => push({
                              product_name: "",
                              product_id: null,
                              product_description: "",
                              quantity: 1,
                              free_quantity: 0,
                              batch: "",
                              unit: "pcs",
                              price: 0,
                              discount: 0,
                              tax: 0,
                              hsn_sac_code: "",
                              tax_rate: 0,
                              amount: 0,
                              isExistingProduct: false,
                            })}
                            className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Add Item
                          </button>
                        </div>
                        </div>
                      );
                    }}
                  </FieldArray>
                </div>

                {/* Totals */}
                <div className="bg-[#111] border border-white/10 p-8 rounded-xl shadow-inner">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal</span>
                      <span className="text-white font-medium">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-400">
                      <span>Total Discount</span>
                      <span>-₹{totalDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span>Total Tax</span>
                      <span>₹{totalTax.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-white/10 my-3"></div>
                    {roundOffApplied && (
                      <div className="flex justify-between text-amber-300">
                        <span>Round Off</span>
                        <span>{roundOffDelta >= 0 ? '+' : ''}₹{roundOffDelta.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xl">
                      <span className="text-white">Grand Total</span>
                      <span className="text-cyan-400">₹{(roundOffApplied ? roundedGrandTotal : grandTotal).toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      {!roundOffApplied ? (
                        <button
                          type="button"
                          onClick={() => setRoundOffApplied(true)}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 underline"
                        >
                          Apply round off
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRoundOffApplied(false)}
                          className="text-[11px] text-gray-400 hover:text-white underline"
                        >
                          Revert round off
                        </button>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500 mt-1 uppercase tracking-wide">
                      {grandTotal > 0 ? "Amount Payble" : ""}
                    </div>
                  </div>
                </div>
                </div>{/* End flex-1 scrollable */}

                {/* Actions */}
                <div className="flex-none p-6 sm:p-8 bg-[#0c0c0e]/95 backdrop-blur-xl border-t border-white/5 flex justify-end space-x-3 rounded-b-[24px] items-center z-40 relative">
                  <div className="text-gray-500 text-xs flex-1 mr-4 hidden sm:block">
                    Closing modal automatically saves as draft. Or use Save Draft.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                        submitActionRef.current = 'draft';
                        handleSubmit();
                    }}
                    className="px-6 py-3 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 rounded-[14px] transition-colors font-medium border-dashed text-sm focus:ring-2 focus:ring-gray-500/50 focus:outline-none"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                        handleBeforeClose();
                    }}
                    className="px-6 py-3 bg-white/5 border border-white/10 text-gray-300 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 rounded-[14px] transition-colors font-medium text-sm focus:ring-2 focus:ring-red-500/50 focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={() => { submitActionRef.current = 'final'; }}
                    className="btn-primary shadow-lg shadow-cyan-500/20 disabled:opacity-50 min-w-[150px] rounded-[14px] focus:ring-2 focus:ring-cyan-500/50 focus:outline-none"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                         Saving...
                      </span>
                    ) : (isEdit ? "Update Invoice" : "Create Invoice")}
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>,
    document.body
  );
}