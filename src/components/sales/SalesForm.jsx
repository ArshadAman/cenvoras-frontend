import React, { useEffect, useRef, useState, useMemo } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createSalesInvoice, updateSalesInvoice, getProducts, getNextInvoiceNumber } from "../../api/sales";
import { getCustomers } from "../../api/customers";
import { createProduct, patchProduct } from "../../api/inventory";
import { getWarehouses, getStockPoints, getSchemes } from "../../api/inventory"; // Added imports
import { getInvoiceSettings, updateInvoiceSettings } from "../../api/invoice_settings";
import { getSubscriptionEntitlements } from "../../api/subscription";
import { getUserProfile } from "../../api/users";
import { INDIAN_STATES, GST_STATE_CODE_MAP } from "../../utils/constants"; // Added imports
import { getTaxType } from "../../utils/taxUtils";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // Added useQuery
import { getCurrencySymbol } from '../../utils/currency';
import { getAllUnits, saveCustomUnit } from '../../utils/units';
import { DocumentTextIcon, ArrowPathIcon, PlusIcon, Bars3Icon, DocumentPlusIcon, TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import DateInputField from "../common/DateInputField";
import CustomerForm from "../customers/CustomerForm";
import useEscKey from "../../hooks/useEscStack";

// Product Autocomplete Component
function ProductAutocomplete({ idx, values, setFieldValue, onInputChange, products, showDescription = true, showManufacturer = true, onCreateNewProduct, onSelectProduct }) {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(values.items[idx]?.product || "");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState(null);

  useEscKey(() => setShowDropdown(false), showDropdown, 30);

  // Sync inputValue with Formik values when items change or shift on deletion
  useEffect(() => {
    const formVal = values.items[idx]?.product || "";
    if (formVal !== inputValue) {
      setInputValue(formVal);
    }
  }, [values.items[idx]?.product]);

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

    if (!isFocused) {
      setShowDropdown(false);
    }
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
    setFieldValue(`items.${idx}.manufacturer`, product.manufacturer || "");
    setFieldValue(`items.${idx}.unit`, product.unit || 'pcs');
    const initialPrice = Number(product.sale_price ?? product.price ?? 0) || 0;
    setFieldValue(`items.${idx}.price`, initialPrice);
    // Calculate amount automatically
    const quantity = values.items[idx]?.quantity || 1;
    const amount = quantity * initialPrice;
    setFieldValue(`items.${idx}.amount`, amount);
    setFieldValue(`items.${idx}.hsn_sac_code`, product.hsn_code || product.hsn_sac_code || "");
    setFieldValue(`items.${idx}.description`, product.description || "");
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
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFieldValue(`items.${idx}.product`, value);
    setSelectedIndex(-1);

    if (!value.trim()) {
      setFieldValue(`items.${idx}.isExistingProduct`, false);
      setFieldValue(`items.${idx}.product_id`, null);
      setShowDropdown(false);
      return;
    }

    if (isFocused) {
      setShowDropdown(true);
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
                if (e.key === 'Tab') {
                  if (showDropdown && filteredProducts.length > 0 && selectedIndex >= 0) {
                    selectProduct(filteredProducts[selectedIndex]);
                  }
                  setShowDropdown(false);
                  setSelectedIndex(-1);
                  return;
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
                } else if (e.key === 'Escape') {
                  setShowDropdown(false);
                  setSelectedIndex(-1);
                }
              }}
            />
            {meta.touched && meta.error && (
              <div className="text-red-400 text-xs mt-1">{meta.error}</div>
            )}
            {showManufacturer && (values.items[idx]?.manufacturer || values.items[idx]?.product_detail?.manufacturer) && (
              <div className="text-[8px] text-gray-400 font-medium italic mt-0.5 tracking-wide">
                ({values.items[idx]?.manufacturer || values.items[idx]?.product_detail?.manufacturer})
              </div>
            )}
            {showDescription && (
              <div className="mt-1">
                <textarea
                  rows={1}
                  value={values.items[idx]?.description ?? values.items[idx]?.product_description ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFieldValue(`items.${idx}.description`, val);
                    setFieldValue(`items.${idx}.product_description`, val);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(22, e.target.scrollHeight)}px`;
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(22, e.target.scrollHeight)}px`;
                  }}
                  placeholder="Enter a description / note..."
                  className="w-full bg-transparent border-0 border-b border-transparent hover:border-white/10 focus:border-cyan-500/50 focus:bg-[#161616] rounded px-1.5 py-0.5 text-gray-300 placeholder-gray-600 focus:placeholder-gray-500 outline-none transition-all text-[11px] leading-relaxed resize-none italic"
                />
              </div>
            )}
          </div>
        )}
      </Field>
        {showDropdown && filteredProducts.length > 0 && dropdownStyle && typeof document !== "undefined" && createPortal(
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
                  Unit: {product.unit} | Price: {getCurrencySymbol()}{product.sale_price ?? product.price}
                </div>
              </div>
            ))}
            {filteredProducts.length > 50 && (
              <div className="border-t border-white/5 px-4 py-2 text-center text-xs italic text-gray-500">
                Showing top 50 results...
              </div>
            )}
            {inputValue.trim() && filteredProducts.length === 0 && onCreateNewProduct && (
              <button
                type="button"
                className="w-full border-t border-white/5 px-4 py-3 text-left text-sm text-cyan-300 transition-colors hover:bg-cyan-500/10 hover:text-cyan-200"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onCreateNewProduct(inputValue.trim(), idx);
                }}
              >
                + Add to inventory: "{inputValue.trim()}"
              </button>
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

  useEscKey(() => setShowDropdown(false), showDropdown, 30);
  useEscKey(() => setShowNewCustomerModal(false), showNewCustomerModal, 20);

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

    // Auto-fetch place of supply from GSTIN (first 2 digits)
    if (customer.gstin && customer.gstin.length >= 2) {
      const stateCode = customer.gstin.substring(0, 2);
      if (GST_STATE_CODE_MAP[stateCode]) {
        setFieldValue('place_of_supply', GST_STATE_CODE_MAP[stateCode]);
      }
    } else if (customer.state) {
      setFieldValue('place_of_supply', customer.state);
    }

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
      const query = value.toLowerCase();
      const filtered = (customers || []).filter(customer =>
        customer.name?.toLowerCase().includes(query) ||
        (customer.email && customer.email.toLowerCase().includes(query)) ||
        (customer.phone && customer.phone.includes(query)) ||
        (customer.gstin && customer.gstin.toLowerCase().includes(query))
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
              id="customer_name"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onFocus={() => {
                if (inputValue.trim()) {
                  setShowDropdown(true);
                }
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-1p-ignore="true"
              onKeyDown={(e) => {
                if (showDropdown) {
                  const isExactMatch = (customers || []).some(
                    (c) => c.name?.trim().toLowerCase() === inputValue.trim().toLowerCase()
                  );
                  const showAddNew = Boolean(inputValue.trim() && !isExactMatch);
                  const displayLimit = Math.min(filteredCustomers.length, 50);
                  const totalItems = displayLimit + (showAddNew ? 1 : 0);
                  
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
                    } else if (showAddNew) {
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
        <div className="absolute z-50 mt-1.5 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl w-full max-h-64 overflow-y-auto backdrop-blur-xl">
          {filteredCustomers.slice(0, 50).map((customer, index) => (
            <div
              key={customer.id}
              className={`px-4 py-3 cursor-pointer text-sm border-b border-white/5 last:border-0 transition-colors ${
                index === selectedIndex
                  ? 'bg-cyan-500/20 text-white' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                selectCustomer(customer);
              }}
            >
              <div className="font-semibold text-white flex items-center justify-between">
                <span>{customer.name}</span>
                {customer.gstin && (
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 font-mono">
                    GST: {customer.gstin}
                  </span>
                )}
              </div>
              <div className="text-gray-400 text-xs mt-1 flex items-center gap-3 truncate">
                {customer.phone && <span>📞 {customer.phone}</span>}
                {customer.email && <span className="truncate">✉️ {customer.email}</span>}
                {customer.address && <span className="truncate text-gray-500">📍 {customer.address}</span>}
              </div>
            </div>
          ))}
          {filteredCustomers.length > 50 && (
             <div className="px-4 py-2 text-xs text-gray-500 text-center italic border-t border-white/5">
                Showing top 50 results...
             </div>
          )}
          {inputValue.trim() && !(customers || []).some((c) => c.name?.trim().toLowerCase() === inputValue.trim().toLowerCase()) && (
            <div
              className={`px-4 py-3 cursor-pointer text-sm border-t border-white/10 ${
                selectedIndex === Math.min(filteredCustomers.length, 50)
                  ? 'bg-cyan-500/20 text-white' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
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

const isUUID = (s) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim());

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
  due_date: Yup.string().nullable().test(
    'not-past-date',
    'Due date cannot be in the past',
    (value) => !value || value >= new Date().toLocaleDateString('sv-SE')
  ),
  
  // Optional invoice fields
  gst_treatment: Yup.string().nullable(),
  journal: Yup.string().nullable(),
  total_amount: Yup.number().nullable(),
  
  // Items array - at least one item required
  items: Yup.array().of(
    Yup.object().shape({
      row_type: Yup.string().nullable(),
      // Required item fields for regular items
      product: Yup.string().when('row_type', {
        is: 'note',
        then: () => Yup.string().nullable(),
        otherwise: () => Yup.string().required("Product is required").min(1),
      }),
      quantity: Yup.number().when('row_type', {
        is: 'note',
        then: () => Yup.number().nullable(),
        otherwise: () => Yup.number().required("Quantity is required").min(0),
      }),
      free_quantity: Yup.number().nullable().min(0),
      batch: Yup.string().nullable(),
      price: Yup.number().when('row_type', {
        is: 'note',
        then: () => Yup.number().nullable(),
        otherwise: () => Yup.number().required("Price is required").min(0),
      }),
      amount: Yup.number().nullable(),
      description: Yup.string().nullable(),
      
      // Optional item fields
      hsn_sac_code: Yup.string().nullable(),
      unit: Yup.string().nullable(),
      discount: Yup.number().nullable().min(0),
      tax: Yup.number().nullable().min(0),
    })
  ).test(
    "has-positive-qty",
    "Each item must have either quantity or free quantity greater than 0",
    (items) => !items || items.every((i) => i?.row_type === 'note' || (Number(i?.quantity) || 0) + (Number(i?.free_quantity) || 0) > 0)
  ).min(1, "At least one item is required"),
});

const DEFAULT_ITEM_SETTINGS = {
  show_item_description: true,
  show_item_hsn: true,
  show_item_batch: true,
  require_item_batch: false,
  show_item_free_quantity: true,
  show_item_discount: true,
  show_item_tax: true,
  show_item_storage_condition: false,
  show_item_manufacturer: true,
};

export default function SalesForm({
  isOpen,
  onClose,
  editData,
  invoicePrefix = "INV-",
  documentType = "invoice",
  forceDraft = false,
  createDocument = createSalesInvoice,
  updateDocument = updateSalesInvoice,
  getNextNumber = getNextInvoiceNumber,
  finalSubmitStatus = 'final',
  aiDraftData = null,
}) {
  const isQuotation = documentType === "quotation";
  const isDeliveryChallan = documentType === "delivery_challan";

  const handleBeforeCloseRef = React.useRef(null);
  const [draggedRowIndex, setDraggedRowIndex] = useState(null);
  const [dragOverRowIndex, setDragOverRowIndex] = useState(null);

  // Register hierarchical ESC key navigation for this form (auto-saves draft if data entered)
  useEscKey(() => (handleBeforeCloseRef.current ? handleBeforeCloseRef.current() : onClose()), isOpen, 10);

  // Keyboard Shortcuts Logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F2 to Save
      if (e.key === "F2") {
        e.preventDefault();
        const submitBtn = document.querySelector('button[type="submit"]');
        if(submitBtn) {
            submitBtn.click();
            toast.info(`Saving ${isDeliveryChallan ? 'Delivery Challan' : isQuotation ? 'Quotation' : 'Invoice'} (F2)...`);
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
  const isEdit = !!editData && !!editData.id;
  const formikRef = React.useRef(null);
  const submitActionRef = React.useRef(forceDraft ? 'draft' : 'final');
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [roundOffApplied, setRoundOffApplied] = useState(false);
  const [productCreationState, setProductCreationState] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);

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

  const { data: subscriptionData } = useQuery({
    queryKey: ["subscription-entitlements"],
    queryFn: getSubscriptionEntitlements,
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });
  const entitlements = subscriptionData?.data || {};
  const currentPlanCode = String(entitlements?.plan?.code || entitlements?.plan_code || "starter").toLowerCase();
  const isStarterPlan = currentPlanCode === "starter" || currentPlanCode === "free";
  const canAccessInventory = Boolean(entitlements?.can?.inventory);
  
  const { data: warehousesResult } = useQuery({
    queryKey: ["warehouses"],
    queryFn: getWarehouses,
    enabled: isOpen && canAccessInventory,
  });
  const warehouses = Array.isArray(warehousesResult) ? warehousesResult : warehousesResult?.data || warehousesResult?.results || [];
  
  
  // Lifted state: Fetch products and customers once at top level
  const { data: productsResult } = useQuery({ 
      queryKey: ["products"], 
      queryFn: () => getProducts({
        ordering: "name",
      }),
      enabled: isOpen && canAccessInventory,
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
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(
    typeof editData?.warehouse === 'object' ? editData.warehouse?.id : (editData?.warehouse || "")
  );

  const { data: stockPointsResult } = useQuery({
    queryKey: ["stockPoints", selectedWarehouseId],
    queryFn: () => getStockPoints(selectedWarehouseId ? { warehouse: selectedWarehouseId } : {}),
    enabled: canAccessInventory,
  });
  const stockPoints = Array.isArray(stockPointsResult) ? stockPointsResult : stockPointsResult?.data || stockPointsResult?.results || [];

  const getProductBatchesForItem = (item) => {
    if (!item) return [];
    const prodId = item.product_id || item.product_detail?.id || (typeof item.product === 'object' ? item.product?.id : null);
    const prodName = (typeof item.product === 'string' ? item.product : item.product_name || item.product_detail?.name || "").trim().toLowerCase();

    return (Array.isArray(stockPoints) ? stockPoints : [])
      .filter((sp) => {
        if (!sp) return false;
        const spProdId = sp.product_id || sp.batch?.product || sp.product;
        const spProdName = (sp.product_name || "").trim().toLowerCase();
        const idMatch = prodId && spProdId && String(prodId) === String(spProdId);
        const nameMatch = prodName && spProdName && prodName === spProdName;
        return (idMatch || nameMatch) && Number(sp.quantity || 0) > 0;
      })
      .map((sp) => {
        const batchId = typeof sp.batch === 'object' ? sp.batch?.id : (sp.batch || sp.id);
        const batchNum = sp.batch_number || sp.batch?.batch_number || 'Batch';
        const qty = sp.quantity || 0;
        return { id: batchId, name: batchNum, qty };
      });
  };

  const { data: invoiceSettings } = useQuery({
    queryKey: ["invoiceSettings"],
    queryFn: getInvoiceSettings,
    staleTime: 5 * 60 * 1000,
  });

  const { data: userProfileData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
    staleTime: 10 * 60 * 1000,
    enabled: isOpen,
  });
  const sellerState =
    userProfileData?.billing_profile?.state ||
    userProfileData?.profile?.state ||
    userProfileData?.state ||
    null;

  const itemSettings = {
    ...DEFAULT_ITEM_SETTINGS,
    ...(invoiceSettings || {}),
  };

  const { data: schemesResult } = useQuery({
    queryKey: ["activeSchemes"],
    queryFn: () => getSchemes({ active_only: 'true' }),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });
  const activeSchemes = Array.isArray(schemesResult) ? schemesResult : schemesResult?.data || schemesResult?.results || [];

  const findMatchingScheme = (productId, qty) => {
    if (!productId || !activeSchemes || !activeSchemes.length) return null;
    const numericQty = parseFloat(qty) || 0;
    const matching = activeSchemes
      .filter((s) => (s.product === productId || s.product_id === productId) && s.is_active !== false)
      .sort((a, b) => (b.min_qty || 0) - (a.min_qty || 0));

    for (const s of matching) {
      if (numericQty >= (s.min_qty || 1)) {
        return s;
      }
    }
    return null;
  };

  const handleItemQuantityChange = (index, qtyValue, setFieldValue, currentValues) => {
    setFieldValue(`items.${index}.quantity`, qtyValue);
    const price = Number(currentValues.items[index]?.price) || 0;
    const numQty = parseFloat(qtyValue) || 0;
    setFieldValue(`items.${index}.amount`, price * numQty);

    const prodId = currentValues.items[index]?.product_id;
    if (prodId) {
      const scheme = findMatchingScheme(prodId, numQty);
      if (scheme && scheme.scheme_type === 'bogo') {
        const minQty = scheme.min_qty || 1;
        const freePerTier = scheme.free_qty || 0;
        const earnedFree = Math.floor(numQty / minQty) * freePerTier;
        if (!scheme.free_product || scheme.free_product === prodId) {
          setFieldValue(`items.${index}.free_quantity`, earnedFree);
        }
      } else if (scheme && scheme.scheme_type === 'percentage_discount') {
        const currDisc = Number(currentValues.items[index]?.discount) || 0;
        if (currDisc === 0 && Number(scheme.discount_percent) > 0) {
          setFieldValue(`items.${index}.discount`, Number(scheme.discount_percent));
        }
      } else if (currentValues.items[index]?.free_quantity > 0) {
        setFieldValue(`items.${index}.free_quantity`, 0);
      }
    }
  };

  const handleProductSelected = (idx, prod, setFieldValue, currentValues) => {
    if (prod?.manufacturer) {
      setFieldValue(`items.${idx}.manufacturer`, prod.manufacturer);
    }
    const qty = parseFloat(currentValues.items[idx]?.quantity) || 1;
    const scheme = findMatchingScheme(prod.id, qty);
    if (scheme && scheme.scheme_type === 'bogo') {
      const minQty = scheme.min_qty || 1;
      const freePerTier = scheme.free_qty || 0;
      const earnedFree = Math.floor(qty / minQty) * freePerTier;
      if (!scheme.free_product || scheme.free_product === prod.id) {
        setFieldValue(`items.${idx}.free_quantity`, earnedFree);
      }
    } else if (scheme && scheme.scheme_type === 'percentage_discount') {
      if (Number(scheme.discount_percent) > 0) {
        setFieldValue(`items.${idx}.discount`, Number(scheme.discount_percent));
      }
    }
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

  const [availableUnits, setAvailableUnits] = useState(getAllUnits);
  const [showDocNote, setShowDocNote] = useState(false);
  const [catalogSyncModal, setCatalogSyncModal] = useState(null);

  const handleAddCustomUnit = (unit) => {
    saveCustomUnit(unit);
    setAvailableUnits(getAllUnits());
  };

  const handleUpdateCatalogItem = async () => {
    if (!catalogSyncModal) return;
    try {
      const { product_id, name, price, hsn_sac_code, tax, description, unit } = catalogSyncModal;
      if (!product_id) {
        toast.info("This is a new custom item. Use 'Save as New Product' to add it to your catalog.");
        return;
      }
      await patchProduct(product_id, {
        name: name || undefined,
        sale_price: Number(price) || 0,
        hsn_sac_code: hsn_sac_code || null,
        tax: Number(tax) || 0,
        description: description || null,
        unit: unit || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (formikRef.current && typeof catalogSyncModal.idx === 'number') {
        const itemPath = `items.${catalogSyncModal.idx}`;
        if (name) formikRef.current.setFieldValue(`${itemPath}.product`, name);
      }
      toast.success("Catalog item updated successfully!");
      setCatalogSyncModal(null);
    } catch (err) {
      const data = err?.response?.data;
      const msg = data
        ? (typeof data === 'object'
            ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
            : String(data))
        : err.message || "Failed to update catalog product";
      toast.error(msg);
    }
  };

  const handleSaveAsNewCatalogItem = async () => {
    if (!catalogSyncModal) return;
    try {
      const { name, price, hsn_sac_code, tax, description, unit } = catalogSyncModal;
      const defaultName = name?.trim() ? name.trim() : "New Product";
      const newName = window.prompt("Enter product name to save in catalog:", defaultName);
      if (!newName || !newName.trim()) return;

      const created = await createProduct({
        name: newName.trim(),
        sale_price: Number(price) || 0,
        cost_price: Number(price) || 0,
        unit: unit || "pcs",
        tax: Number(tax) || 0,
        hsn_sac_code: hsn_sac_code || null,
        description: description || null,
        stock: 0,
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (formikRef.current && typeof catalogSyncModal.idx === 'number') {
        const itemPath = `items.${catalogSyncModal.idx}`;
        formikRef.current.setFieldValue(`${itemPath}.product`, created.name);
        formikRef.current.setFieldValue(`${itemPath}.product_id`, created.id);
        formikRef.current.setFieldValue(`${itemPath}.isExistingProduct`, true);
        if (created.hsn_sac_code) formikRef.current.setFieldValue(`${itemPath}.hsn_sac_code`, created.hsn_sac_code);
        if (created.unit) formikRef.current.setFieldValue(`${itemPath}.unit`, created.unit);
      }
      toast.success(`Saved new product "${created.name}" in catalog!`);
      setCatalogSyncModal(null);
    } catch (err) {
      const data = err?.response?.data;
      const msg = data
        ? (typeof data === 'object'
            ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
            : String(data))
        : err.message || "Failed to create new catalog product";
      toast.error(msg);
    }
  };

  const handleCreateInventoryProduct = (productName, idx) => {
    if (!canAccessInventory) {
      toast.info("Inventory browsing is locked on Starter. Enter item details manually to create this sales bill.");
      return;
    }

    setProductCreationState({
      idx,
      name: productName,
      sale_price: "",
      unit: "pcs",
      tax: "0",
      hsn_sac_code: "",
      description: "",
    });
  };

  const handleSaveInventoryProduct = async () => {
    if (!productCreationState) return;

    try {
      const salePrice = Number(productCreationState.sale_price || 0) || 0;
      const createdProduct = await createProduct({
        name: productCreationState.name,
        sale_price: salePrice,
        cost_price: salePrice,
        unit: productCreationState.unit || "pcs",
        tax: Number(productCreationState.tax || 0),
        hsn_sac_code: productCreationState.hsn_sac_code || null,
        description: productCreationState.description || null,
        stock: 0,
      });

      queryClient.invalidateQueries({ queryKey: ["products"] });

      if (formikRef.current && typeof productCreationState.idx === 'number') {
        const itemPath = `items.${productCreationState.idx}`;
        const quantity = Number(formikRef.current.values?.items?.[productCreationState.idx]?.quantity || 1);
        const normalizedPrice = Number(createdProduct.sale_price ?? salePrice) || 0;

        formikRef.current.setFieldValue(`${itemPath}.product`, createdProduct.name);
        formikRef.current.setFieldValue(`${itemPath}.product_id`, createdProduct.id);
        formikRef.current.setFieldValue(`${itemPath}.unit`, createdProduct.unit || productCreationState.unit || 'pcs');
        formikRef.current.setFieldValue(`${itemPath}.price`, normalizedPrice);
        formikRef.current.setFieldValue(`${itemPath}.amount`, quantity * normalizedPrice);
        formikRef.current.setFieldValue(`${itemPath}.hsn_sac_code`, createdProduct.hsn_sac_code || productCreationState.hsn_sac_code || "");
        formikRef.current.setFieldValue(`${itemPath}.product_description`, createdProduct.description || productCreationState.description || "");
        formikRef.current.setFieldValue(`${itemPath}.discount`, 0);
        formikRef.current.setFieldValue(`${itemPath}.tax`, Number(createdProduct.tax ?? productCreationState.tax ?? 0));
        formikRef.current.setFieldValue(`${itemPath}.isExistingProduct`, true);
      }

      toast.success(`Added ${createdProduct.name} to inventory.`);
      setProductCreationState(null);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to create inventory item");
    }
  };
  

  // Auto-focus removed: It scrolled the user to the bottom of the form which was disorienting
  
  const { data: nextInvData } = useQuery({
    queryKey: ["nextInvoiceNumber", invoicePrefix],
    queryFn: () => getNextNumber(invoicePrefix ?? ""),
    enabled: !isEdit && isOpen
  });

  useEffect(() => {
    if (!isEdit && nextInvData?.next_number && formikRef.current) {
      const currentVal = formikRef.current.values?.invoice_number;
      if (!currentVal) {
        formikRef.current.setFieldValue('invoice_number', nextInvData.next_number);
      }
    }
  }, [nextInvData?.next_number, isEdit]);

  const extractErrorMessage = (error, defaultMsg) => {
    const data = error.response?.data;
    if (!data) return error.message || defaultMsg;
    if (typeof data === "string") return data;
    if (data.detail) return typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    if (data.error) return typeof data.error === "string" ? data.error : JSON.stringify(data.error);
    if (data.message) return typeof data.message === "string" ? data.message : JSON.stringify(data.message);
    if (Array.isArray(data) && data.length > 0) {
      return typeof data[0] === "string" ? data[0] : JSON.stringify(data[0]);
    }
    if (typeof data === "object") {
      const messages = [];
      for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val)) {
          const itemErrors = val
            .map((v) => {
              if (typeof v === "object" && v !== null) {
                return Object.entries(v)
                  .map(([k, subv]) => `${k}: ${Array.isArray(subv) ? subv.join(", ") : subv}`)
                  .join("; ");
              }
              return String(v);
            })
            .filter(Boolean);
          messages.push(`${key !== "non_field_errors" ? key + ": " : ""}${itemErrors.join(", ")}`);
        } else if (typeof val === "string") {
          messages.push(`${key !== "non_field_errors" ? key + ": " : ""}${val}`);
        } else if (typeof val === "object" && val !== null) {
          messages.push(`${key}: ${JSON.stringify(val)}`);
        }
      }
      if (messages.length > 0) return messages.join(" | ");
    }
    return error.message || defaultMsg;
  };

  const createMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["deliveryChallans"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["smart-dashboard"] });
      if (submitActionRef.current === 'draft') {
        toast.success(`${isDeliveryChallan ? 'Delivery Challan' : isQuotation ? 'Quotation' : 'Invoice'} saved as draft`);
      } else {
        toast.success(`${isDeliveryChallan ? 'Delivery Challan' : isQuotation ? 'Quotation' : 'Sales bill'} created successfully!`);
      }
      onClose();
    },
    onError: (error) => {
      if (error.response?.status === 409) {
          toast.error(error.response?.data?.error || "Invoice number already exists!");
      } else {
          toast.error(
            extractErrorMessage(
              error,
              `Failed to create ${isDeliveryChallan ? 'delivery challan' : isQuotation ? 'quotation' : 'sales bill'}`
            )
          );
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateDocument(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["deliveryChallans"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["smart-dashboard"] });
      if (submitActionRef.current === 'draft') {
        toast.success(`${isDeliveryChallan ? 'Delivery Challan' : isQuotation ? 'Quotation' : 'Invoice'} saved as draft`);
      } else {
        toast.success(`${isDeliveryChallan ? 'Delivery Challan' : isQuotation ? 'Quotation' : 'Sales bill'} updated successfully!`);
      }
      onClose();
    },
    onError: (error) => {
      if (error.response?.status === 409) {
          toast.error(error.response?.data?.error || "Invoice number already exists!");
      } else {
          toast.error(
            extractErrorMessage(
              error,
              `Failed to update ${isDeliveryChallan ? 'delivery challan' : isQuotation ? 'quotation' : 'sales bill'}`
            )
          );
      }
    },
  });

  const handleBeforeClose = async () => {
    if (formikRef.current && !createMutation.isPending && !updateMutation.isPending) {
      const values = formikRef.current.values || {};
      const cleanedItems = (values.items || []).filter((item) =>
        item.row_type === 'note'
          ? Boolean(item?.description && item.description.trim())
          : ((item?.product && item.product.trim() !== '') || item?.product_id)
      );

      const hasCustomerName = !!(values.customer_name && values.customer_name.trim());
      const hasAtLeastOneItem = cleanedItems.length > 0;

      // Auto-save draft on close (Esc or backdrop click) whenever customer or item data has been entered
      if (hasCustomerName || hasAtLeastOneItem) {
        if (!hasCustomerName) {
          formikRef.current.setFieldValue('customer_name', 'Draft Customer');
        }
        submitActionRef.current = 'draft';
        await formikRef.current.submitForm();
        return;
      }
    }
    onClose();
  };
  handleBeforeCloseRef.current = handleBeforeClose;

  const safeDateStr = (raw) => {
    if (!raw) return "";
    try {
      if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
        return raw.trim();
      }
      const d = new Date(raw);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split('T')[0];
    } catch {
      return "";
    }
  };

  const initialValues = useMemo(() => {
    const rawInvoiceDate = editData?.invoice_date || editData?.quotation_date || editData?.challan_date || editData?.date;
    const parsedInvoiceDate = safeDateStr(rawInvoiceDate) || new Date().toLocaleDateString('sv-SE');

    return {
      // Required fields
      customer_name: editData?.customer_name || aiDraftData?.customer_name || "",
      // Use fetched next number or edit data
      invoice_number: editData?.quotation_number || editData?.invoice_number || editData?.challan_number || nextInvData?.next_number || "",
      invoice_date: parsedInvoiceDate,
      
      // Optional customer fields (for Customer record creation)
      customer_email: editData?.customer_email || aiDraftData?.customer_email || "",
      customer_phone: editData?.customer_phone || aiDraftData?.customer_phone || "",
      customer_address: editData?.customer_address || aiDraftData?.customer_address || "",
      customer_gstin: editData?.customer_gstin || "",
      delivery_address: editData?.delivery_address || "",
      vehicle_number: editData?.vehicle_number || "",
      transport_mode: editData?.transport_mode || "",
      eway_bill_number: editData?.eway_bill_number || "",
      
      // Optional invoice fields
      due_date: safeDateStr(editData?.due_date),
      po_number: editData?.po_number || "",
      po_date: safeDateStr(editData?.po_date),
      challan_number: editData?.challan_number || "",
      challan_date: safeDateStr(editData?.challan_date),
      delivery_challans: (() => {
        if (Array.isArray(editData?.delivery_challans) && editData.delivery_challans.length > 0) {
          return editData.delivery_challans.map(c => ({
            challan_number: c.challan_number || '',
            challan_date: safeDateStr(c.challan_date) || '',
          }));
        }
        if (editData?.challan_number) {
          const numbers = String(editData.challan_number).split(',').map(s => s.trim()).filter(Boolean);
          if (numbers.length > 1) {
            return numbers.map(num => ({
              challan_number: num,
              challan_date: safeDateStr(editData.challan_date) || '',
            }));
          }
          return [{
            challan_number: editData.challan_number,
            challan_date: safeDateStr(editData.challan_date) || '',
          }];
        }
        return [{ challan_number: '', challan_date: '' }];
      })(),
      gst_treatment: editData?.gst_treatment || "registered",
      place_of_supply: editData?.place_of_supply || "",
      warehouse: typeof editData?.warehouse === 'object' ? (editData.warehouse?.id || "") : (editData?.warehouse || ""),
      journal: editData?.journal || (isQuotation ? "Quotation" : isDeliveryChallan ? "Challan" : "Sales"),
      total_amount: editData?.total_amount || null,
      notes: editData?.notes || "",
      
      items: (editData?.items && editData.items.length > 0) ? editData.items.map((item, idx) => {
        const isNote = item.row_type === 'note' || (!item.product && !!item.description);
        const qty = Number(item.quantity) || (isNote ? 0 : 1);
        const price = Number(item.price || 0) || 0;
        const itemAmount = Number(item.amount) || (qty * price);
        const productId = item.product_id || item.product_detail?.id || (typeof item.product === 'object' ? item.product?.id : (isUUID(item.product) ? item.product : null));
        const productName = item.product_name || item.product_detail?.name || (typeof item.product === 'string' && !isUUID(item.product) ? item.product : (item.product_detail?.name || ""));
        const batchId = typeof item.batch === 'object' ? item.batch?.id : (item.batch || "");
        return {
          _key: item.id || `item-edit-${productId || idx}`,
          row_type: isNote ? 'note' : 'item',
          product: isNote ? "" : productName,
          product_id: isNote ? null : productId,
          description: item.description || item.product_description || item.product_detail?.description || "",
          product_description: item.description || item.product_description || item.product_detail?.description || "",
          quantity: isNote ? 0 : qty,
          free_quantity: isNote ? 0 : (Number(item.free_quantity) || 0),
          batch: isNote ? "" : batchId,
          price: isNote ? 0 : price,
          amount: isNote ? 0 : itemAmount,
          unit: isNote ? "" : (item.unit || "pcs"),
          hsn_sac_code: isNote ? "" : (item.hsn_sac_code || item.hsn_code || ""),
          discount: isNote ? 0 : (Number(item.discount) || 0),
          tax: isNote ? 0 : (Number(item.tax) || 0),
          manufacturer: isNote ? "" : (item.manufacturer || item.product_detail?.manufacturer || ""),
          isExistingProduct: !isNote && !!productId,
          id: item.id || null,
          source_item_id: item.source_item_id || null,
        };
      }) : (aiDraftData?.items && aiDraftData.items.length > 0) ? aiDraftData.items.map((item, idx) => {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price || 0) || 0;
          return {
              _key: `item-ai-${idx}`,
              product: item.product_name || "",
              product_id: null,
              description: item.description || item.product_description || "",
              product_description: item.description || item.product_description || "",
              quantity: qty,
              free_quantity: 0,
              batch: "",
              price: price,
              amount: qty * price,
              unit: "pcs",
              hsn_sac_code: "",
              discount: 0,
              tax: 0,
              manufacturer: item.manufacturer || "",
              isExistingProduct: false,
          };
      }) : [{
        _key: 'item-initial-0',
        product: "",
        product_id: null,
        description: "",
        product_description: "",
        quantity: 1,
        free_quantity: 0,
        batch: "",
        price: 0,
        amount: 0,
        unit: "pcs",
        hsn_sac_code: "",
        discount: 0,
        tax: 0,
        manufacturer: "",
        isExistingProduct: false,
      }],
    };
  }, [editData?.id, aiDraftData, nextInvData?.next_number]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleBeforeClose}></div>
      <div className="relative flex flex-col w-full h-full sm:h-[96vh] sm:max-h-[1200px] sm:max-w-[1600px] sm:w-[96vw] sm:rounded-[24px] shadow-2xl shadow-black/50 animate-fade-up sm:border border-white/10 bg-[#0c0c0e] overflow-hidden">
        <div className="flex-none flex justify-between items-center p-6 sm:px-8 sm:py-6 border-b border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl z-40">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              {isEdit
                ? `Edit ${isDeliveryChallan ? 'Delivery Challan' : isQuotation ? 'Quotation' : 'Sales Invoice'}`
                : `New ${isDeliveryChallan ? 'Delivery Challan' : isQuotation ? 'Quotation' : 'Sales Invoice'}`}
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
          initialValues={initialValues}
          enableReinitialize={isEdit}
          onSubmit={async (values, { setSubmitting, setErrors, setFieldError }) => {
            const isDraft = forceDraft || submitActionRef.current === "draft";
            
            // Clean up empty product rows before processing/validation
            const cleanedItems = values.items.filter(item => 
              item.row_type === 'note'
                ? Boolean(item.description && item.description.trim())
                : ((item.product && item.product.trim() !== '') || item.product_id)
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
                  const missingBatchRow = cleanedItems.findIndex((item) => item.row_type !== 'note' && !item.batch);
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
                  const docLabel = isDeliveryChallan ? 'Challan' : isQuotation ? 'Quotation' : 'Invoice';
                  err.inner?.forEach(e => {
                    let msg = e.message;
                    if (msg.includes('Invoice number')) {
                      msg = msg.replace('Invoice number', `${docLabel} number`);
                    }
                    if (msg.includes('Invoice date')) {
                      msg = msg.replace('Invoice date', `${docLabel} date`);
                    }
                    errors[e.path] = msg;
                  });
                  setErrors(errors);
                  
                  // Show the first error in a toast for better UX
                  if (err.inner?.length > 0) {
                    const firstMsg = Object.values(errors)[0] || err.inner[0].message;
                    toast.error(firstMsg);
                  }
                  
                  setSubmitting(false);
                  return;
                }
            }
            
            try {
              const processedItems = cleanedItems.map(item => {
                if (item.row_type === 'note') {
                  return {
                    row_type: 'note',
                    product: null,
                    product_name: 'Note',
                    quantity: 0,
                    free_quantity: 0,
                    price: 0,
                    amount: 0,
                    unit: null,
                    hsn_sac_code: null,
                    description: (item.description || item.product_description || "").trim(),
                    product_description: (item.description || item.product_description || "").trim(),
                    discount: 0,
                    tax: 0,
                  };
                }
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
                  row_type: 'item',
                  product: item.product_id || item.product, // Pass UUID if available, else name
                  product_name: (item.product || '').trim(),
                  quantity: quantity,
                  free_quantity: itemSettings.show_item_free_quantity ? (Number(item.free_quantity) || 0) : 0,
                  ...(itemSettings.show_item_batch && item.batch ? { batch: item.batch } : {}),
                  price: price,
                  amount: amount,
                  unit: item.unit || null,
                  hsn_sac_code: itemSettings.show_item_hsn ? (item.hsn_sac_code || null) : null,
                  description: (item.description || item.product_description || "").trim(),
                  product_description: (item.description || item.product_description || "").trim(),
                  discount: itemSettings.show_item_discount ? discount : 0,
                  tax: itemSettings.show_item_tax ? tax : 0,
                  ...(item.id ? { id: item.id } : {}),
                  ...(item.source_item_id ? { source_item_id: item.source_item_id } : {}),
                };
              });

              const totalAmount = processedItems.reduce((sum, item) => sum + item.amount, 0);
              const finalTotal = roundOffApplied ? computeRoundedTotal(totalAmount) : totalAmount;
              const roundOffValue = roundOffApplied
                ? Number((finalTotal - totalAmount).toFixed(2))
                : 0;

              const isFormalAutoSeq = values.invoice_number?.startsWith(invoicePrefix) ||
                values.invoice_number?.startsWith('INV-') ||
                values.invoice_number?.startsWith('QT-') ||
                values.invoice_number?.startsWith('DC-');

              const serializedChallanNumber = Array.isArray(values.delivery_challans)
                ? values.delivery_challans.map(c => c.challan_number?.trim()).filter(Boolean).join(', ')
                : (values.challan_number || null);
              const serializedChallanDate = Array.isArray(values.delivery_challans)
                ? (values.delivery_challans.find(c => c.challan_date)?.challan_date || values.challan_date || null)
                : (values.challan_date || null);

              const formData = {
                customer_name: values.customer_name,
                invoice_number: (!isEdit && isDraft && isFormalAutoSeq) ? "" : values.invoice_number,
                invoice_date: values.invoice_date,
                due_date: values.due_date || null,
                po_number: values.po_number || null,
                po_date: values.po_date || null,
                challan_number: serializedChallanNumber || null,
                challan_date: serializedChallanDate || null,
                delivery_address: values.delivery_address || null,
                gst_treatment: values.gst_treatment || null,
                place_of_supply: values.place_of_supply || (values.customer_gstin && values.customer_gstin.length >= 2 ? GST_STATE_CODE_MAP[values.customer_gstin.substring(0, 2)] : null) || null,
                journal: values.journal || "Sales",
                warehouse: values.warehouse || null,
                status: isDraft ? 'draft' : finalSubmitStatus,
                total_amount: Number(finalTotal).toFixed(2),
                round_off: Number(roundOffValue).toFixed(2),
                notes: values.notes || "",
                items: processedItems,
                // Optional customer fields for new record creation
                ...(values.customer_email && { customer_email: values.customer_email }),
                ...(values.customer_phone && { customer_phone: values.customer_phone }),
                ...(values.customer_address && { customer_address: values.customer_address }),
                ...(values.customer_gstin && { customer_gstin: values.customer_gstin }),
                // Delivery Challan specific fields
                ...(isDeliveryChallan && {
                  challan_number: values.invoice_number,
                  date: values.invoice_date,
                  vehicle_number: values.vehicle_number || null,
                  transport_mode: values.transport_mode || null,
                  eway_bill_number: values.eway_bill_number || null,
                }),
                // Quotation specific fields
                ...(isQuotation && {
                  quotation_number: values.invoice_number,
                  quotation_date: values.invoice_date,
                }),
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

            // Determine IGST vs CGST/SGST
            const taxType = getTaxType(
              { place_of_supply: values.place_of_supply },
              { state: sellerState }
            );
            const isIGST = taxType === 'igst';

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
                  {/* Top Document Meta Row: Invoice #, Date, Due Date, PO #, PO Date */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/5">
                      <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                        {isDeliveryChallan ? 'Challan Details' : isQuotation ? 'Quotation Details' : 'Invoice Details'}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {/* Document / Invoice Number */}
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                          {isDeliveryChallan ? 'Challan Number *' : isQuotation ? 'Quotation Number *' : 'Invoice Number *'}
                        </label>
                        <Field
                          name="invoice_number"
                          type="text"
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck="false"
                          data-1p-ignore="true"
                          className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all text-sm font-mono"
                          placeholder={isDeliveryChallan ? "e.g. DC-ABCD-001" : isQuotation ? "e.g. QT-ABCD-001" : "e.g. INV-ABCD-001"}
                        />
                        <ErrorMessage name="invoice_number" component="div" className="text-red-400 text-xs mt-1" />
                      </div>

                      {/* Document / Invoice Date */}
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                          {isDeliveryChallan ? 'Challan Date *' : isQuotation ? 'Quotation Date *' : 'Invoice Date *'}
                        </label>
                        <DateInputField
                          name="invoice_date"
                          value={values.invoice_date}
                          onChange={(e) => setFieldValue('invoice_date', e.target.value)}
                          placeholder="DD/MM/YYYY"
                        />
                        <ErrorMessage name="invoice_date" component="div" className="text-red-400 text-xs mt-1" />
                      </div>

                      {/* Due Date */}
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                          Due Date
                        </label>
                        <DateInputField
                          name="due_date"
                          value={values.due_date}
                          onChange={(e) => setFieldValue('due_date', e.target.value)}
                          placeholder="DD/MM/YYYY"
                        />
                      </div>

                      {/* PO Number */}
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">PO Number</label>
                        <Field
                          name="po_number"
                          type="text"
                          className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all text-sm font-mono"
                          placeholder="e.g. PO-8921"
                        />
                      </div>

                      {/* PO Date */}
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">PO Date</label>
                        <DateInputField
                          name="po_date"
                          value={values.po_date}
                          onChange={(e) => setFieldValue('po_date', e.target.value)}
                          placeholder="DD/MM/YYYY"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Header Columns: Billing Details & Shipping Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Column 1: Billing Details */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">Billing Details</h3>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">CUSTOMER</span>
                      </div>

                      {/* Customer Autocomplete */}
                      <div className="relative">
                        {(() => {
                          const matchedCustomer = (customers || []).find(
                            (c) =>
                              (values.customer && String(c.id) === String(values.customer)) ||
                              (values.customer_name &&
                                c.name?.trim().toLowerCase() === values.customer_name?.trim().toLowerCase())
                          );

                          return (
                            <>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">
                                  Customer *
                                </label>
                                {matchedCustomer && (
                                  <button
                                    type="button"
                                    onClick={() => setEditingCustomer(matchedCustomer)}
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                                  >
                                    <PencilSquareIcon className="w-3.5 h-3.5" />
                                    <span>Edit Customer</span>
                                  </button>
                                )}
                              </div>
                              <CustomerAutocomplete 
                                values={values} 
                                setFieldValue={setFieldValue} 
                                customers={customers} 
                              />
                            </>
                          );
                        })()}
                        <ErrorMessage name="customer_name" component="div" className="text-red-400 text-xs mt-1" />
                        {(values.customer_address || values.customer_email || values.customer_phone || values.customer_gstin) && (
                          <div className="mt-3 rounded-xl border border-white/10 bg-[#141416] p-3 text-xs text-gray-300 space-y-1.5">
                            {values.customer_gstin && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 font-medium">GSTIN:</span>
                                <span className="font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded text-[11px] font-semibold">{values.customer_gstin}</span>
                              </div>
                            )}
                            {values.customer_address && (
                              <div className="text-gray-400 flex items-start gap-1">
                                <span className="text-gray-500 shrink-0">Address:</span>
                                <span className="text-gray-300">{values.customer_address}</span>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-4 text-gray-400 pt-1 border-t border-white/5">
                              {values.customer_phone && <div><span className="text-gray-500">Phone:</span> {values.customer_phone}</div>}
                              {values.customer_email && <div><span className="text-gray-500">Email:</span> {values.customer_email}</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Shipping Details */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">Shipping Details</h3>
                        </div>
                        {values.customer_address && (
                          <button
                            type="button"
                            onClick={() => setFieldValue('delivery_address', values.customer_address)}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors flex items-center gap-1"
                          >
                            <span>Copy from Billing</span>
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                          Shipping Address
                        </label>
                        <Field
                          name="delivery_address"
                          as="textarea"
                          rows="2"
                          className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all text-sm"
                          placeholder="123 Shipping Address, City, State, PIN"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">
                            Place of Supply
                          </label>
                          {values.place_of_supply && values.customer_gstin && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              Auto-detected from GSTIN
                            </span>
                          )}
                        </div>
                        <Field
                          name="place_of_supply"
                          as="select"
                          className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all text-sm"
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map(s => (
                            <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                          ))}
                        </Field>
                      </div>

                      {/* Transport & Vehicle Details if Delivery Challan */}
                      {isDeliveryChallan && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-white/5">
                          <div>
                            <label className="block text-[11px] font-medium text-gray-400 mb-1 uppercase tracking-wide">Vehicle #</label>
                            <Field
                              name="vehicle_number"
                              type="text"
                              className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 outline-none"
                              placeholder="e.g. KA-01-1234"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-400 mb-1 uppercase tracking-wide">Transport</label>
                            <Field
                              name="transport_mode"
                              type="text"
                              className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 outline-none"
                              placeholder="e.g. Road / Tempo"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-400 mb-1 uppercase tracking-wide">E-Way Bill #</label>
                            <Field
                              name="eway_bill_number"
                              type="text"
                              className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 outline-none"
                              placeholder="E-Way Bill #"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Multiple Delivery Challans Section (For Invoices) */}
                  {!isDeliveryChallan && !isQuotation && (
                    <FieldArray name="delivery_challans">
                      {({ push: pushChallan, remove: removeChallan }) => (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-white/5">
                            <div className="flex items-center gap-2">
                              <DocumentPlusIcon className="w-4 h-4 text-cyan-400" />
                              <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
                                Delivery Challans
                              </span>
                              <span className="text-[11px] text-gray-500 font-mono">
                                ({values.delivery_challans?.length || 0} attached)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => pushChallan({ challan_number: '', challan_date: '' })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold border border-cyan-500/30 transition-colors"
                            >
                              <PlusIcon className="w-3.5 h-3.5" />
                              <span>Add Challan</span>
                            </button>
                          </div>

                          <div className="space-y-2.5">
                            {(values.delivery_challans || []).map((ch, chIdx) => (
                              <div key={chIdx} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-center bg-[#111]/60 p-3 rounded-xl border border-white/5">
                                <div>
                                  <label className="block text-[11px] font-medium text-gray-400 mb-1 uppercase tracking-wide">
                                    Challan Number #{chIdx + 1}
                                  </label>
                                  <Field
                                    name={`delivery_challans.${chIdx}.challan_number`}
                                    type="text"
                                    placeholder="e.g. DC-2026-001"
                                    className="w-full bg-[#161618] border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 outline-none font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium text-gray-400 mb-1 uppercase tracking-wide">
                                    Challan Date (DD/MM/YYYY)
                                  </label>
                                  <DateInputField
                                    name={`delivery_challans.${chIdx}.challan_date`}
                                    value={ch.challan_date}
                                    onChange={(e) => setFieldValue(`delivery_challans.${chIdx}.challan_date`, e.target.value)}
                                    placeholder="DD/MM/YYYY"
                                  />
                                </div>
                                <div className="sm:pt-5 flex items-center justify-end">
                                  <button
                                    type="button"
                                    onClick={() => removeChallan(chIdx)}
                                    disabled={values.delivery_challans.length <= 1}
                                    className="p-2 text-gray-400 hover:text-red-400 disabled:opacity-20 hover:bg-white/5 rounded-lg transition-colors"
                                    title="Remove Challan"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </FieldArray>
                  )}
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
                            ["show_item_manufacturer", "Manufacturer"],
                            ["show_item_hsn", "HSN/SAC"],
                            ["show_item_batch", "Batch"],
                            ["show_item_free_quantity", "Free Qty"],
                            ["show_item_storage_condition", "Storage Details"],
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
                  {!canAccessInventory && isStarterPlan && (
                    <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100">
                      Inventory browsing is locked on Starter. You can still create this sales bill by typing item name, quantity, and price manually.
                    </div>
                  )}
                  <FieldArray name="items">
                    {({ push, remove, swap, insert }) => {
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
                              _key: `item-${Math.random().toString(36).substring(2, 9)}`,
                              row_type: "item",
                              product: "",
                              product_name: "",
                              product_id: null,
                              description: "",
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
                              { key: "drag", label: "", show: true, width: "36px", minWidth: 36 },
                              { key: "product", label: "Product", show: true, width: "minmax(320px, 1fr)", minWidth: 320 },
                              { key: "hsn", label: "HSN/SAC Code", show: itemSettings.show_item_hsn, width: "120px", minWidth: 120 },
                              { key: "batch", label: "Batch", show: itemSettings.show_item_batch, width: "140px", minWidth: 140 },
                              { key: "quantity", label: "Quantity", show: true, width: "80px", minWidth: 80 },
                              { key: "free", label: "Free", show: itemSettings.show_item_free_quantity, width: "70px", minWidth: 70 },
                              { key: "unit", label: "Unit", show: true, width: "70px", minWidth: 70 },
                              { key: "price", label: "Price", show: true, width: "110px", minWidth: 110 },
                              { key: "discount", label: "Disc.%", show: itemSettings.show_item_discount, width: "80px", minWidth: 80 },
                              { key: "tax", label: "Taxes", show: itemSettings.show_item_tax, width: "90px", minWidth: 90 },
                              { key: "amount", label: "Amount", show: true, width: "130px", minWidth: 130 },
                              { key: "action", label: "", show: true, width: "70px", minWidth: 70 },
                            ].filter((col) => col.show);

                            const gridTemplateColumns = desktopColumns.map((col) => col.width).join(" ");
                            const totalMinWidth = desktopColumns.reduce((sum, col) => sum + (col.minWidth || 0), 0);

                            return (
                              <>
                                <div className="hidden md:block overflow-x-auto border-y border-white/10 bg-[#1b2030]">
                                  <div className="grid items-center gap-2 px-2 py-2 text-xs font-semibold text-gray-300" style={{ gridTemplateColumns, minWidth: `${totalMinWidth}px`, width: '100%' }}>
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
                                    if (item.row_type === 'note') {
                                      return (
                                        <div
                                          key={item._key || index}
                                          draggable
                                          onDragStart={(e) => {
                                            e.dataTransfer.setData('text/plain', String(index));
                                            e.dataTransfer.effectAllowed = 'move';
                                            setDraggedRowIndex(index);
                                          }}
                                          onDragOver={(e) => {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'move';
                                            if (dragOverRowIndex !== index) {
                                              setDragOverRowIndex(index);
                                            }
                                          }}
                                          onDragLeave={() => {
                                            if (dragOverRowIndex === index) {
                                              setDragOverRowIndex(null);
                                            }
                                          }}
                                          onDrop={(e) => {
                                            e.preventDefault();
                                            const fromIdx = draggedRowIndex !== null ? draggedRowIndex : parseInt(e.dataTransfer.getData('text/plain'), 10);
                                            if (!isNaN(fromIdx) && fromIdx !== index && fromIdx >= 0 && fromIdx < values.items.length) {
                                              swap(fromIdx, index);
                                            }
                                            setDraggedRowIndex(null);
                                            setDragOverRowIndex(null);
                                          }}
                                          onDragEnd={() => {
                                            setDraggedRowIndex(null);
                                            setDragOverRowIndex(null);
                                          }}
                                          className={[
                                            "border-b border-amber-500/20 bg-amber-500/5 px-3 py-2 flex items-center gap-2 transition-all duration-150",
                                            draggedRowIndex === index ? "opacity-35 bg-amber-950/40 ring-1 ring-amber-500/50" : "",
                                            dragOverRowIndex === index && draggedRowIndex !== index ? "border-t-2 border-t-amber-400 bg-amber-500/10" : "",
                                          ].join(" ")}
                                          style={{ minWidth: `${totalMinWidth}px`, width: '100%' }}
                                        >
                                          <div
                                            className="flex items-center justify-center cursor-grab active:cursor-grabbing text-amber-500/70 hover:text-amber-300 p-1 rounded hover:bg-white/10 transition-colors select-none shrink-0"
                                            title="Hold and drag to reorder row"
                                          >
                                            <Bars3Icon className="w-4 h-4" />
                                          </div>
                                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider shrink-0">
                                            <DocumentTextIcon className="w-3.5 h-3.5" />
                                            <span>Note</span>
                                          </div>
                                          <div className="flex-1">
                                            <Field
                                              as="textarea"
                                              name={`items.${index}.description`}
                                              rows={1}
                                              placeholder="Enter note or section title (e.g. Terms for items above, scope of work, warranty details...)"
                                              className="w-full bg-[#111] border border-amber-500/30 focus:border-amber-400 rounded-lg px-3 py-1.5 text-xs text-amber-100 placeholder-gray-500 focus:ring-1 focus:ring-amber-400 outline-none resize-y"
                                            />
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => insert(index + 1, {
                                                _key: `note-${Math.random().toString(36).substring(2, 9)}`,
                                                row_type: 'note',
                                                product: null,
                                                product_name: 'Note',
                                                description: '',
                                                product_description: '',
                                                quantity: 0,
                                                free_quantity: 0,
                                                batch: '',
                                                unit: '',
                                                price: 0,
                                                discount: 0,
                                                tax: 0,
                                                amount: 0,
                                              })}
                                              className="p-1 text-gray-400 hover:text-amber-300 transition-colors"
                                              title="Add Note Below"
                                              tabIndex={-1}
                                            >
                                              <DocumentPlusIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => remove(index)}
                                              disabled={values.items.length === 1}
                                              className="text-gray-500 hover:text-red-400 transition-colors p-1 disabled:opacity-30"
                                              title="Remove Note"
                                              tabIndex={-1}
                                            >
                                              <TrashIcon className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    }

                                    const productBatches = getProductBatchesForItem(item);

                                    return (
                                      <div
                                        key={item._key || index}
                                        draggable
                                        onDragStart={(e) => {
                                          e.dataTransfer.setData('text/plain', String(index));
                                          e.dataTransfer.effectAllowed = 'move';
                                          setDraggedRowIndex(index);
                                        }}
                                        onDragOver={(e) => {
                                          e.preventDefault();
                                          e.dataTransfer.dropEffect = 'move';
                                          if (dragOverRowIndex !== index) {
                                            setDragOverRowIndex(index);
                                          }
                                        }}
                                        onDragLeave={() => {
                                          if (dragOverRowIndex === index) {
                                            setDragOverRowIndex(null);
                                          }
                                        }}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          const fromIdx = draggedRowIndex !== null ? draggedRowIndex : parseInt(e.dataTransfer.getData('text/plain'), 10);
                                          if (!isNaN(fromIdx) && fromIdx !== index && fromIdx >= 0 && fromIdx < values.items.length) {
                                            swap(fromIdx, index);
                                          }
                                          setDraggedRowIndex(null);
                                          setDragOverRowIndex(null);
                                        }}
                                        onDragEnd={() => {
                                          setDraggedRowIndex(null);
                                          setDragOverRowIndex(null);
                                        }}
                                        className={[
                                          "border-b border-white/10 transition-all duration-150",
                                          draggedRowIndex === index ? "opacity-35 bg-cyan-950/40 ring-1 ring-cyan-500/50" : "hover:bg-white/[0.02]",
                                          dragOverRowIndex === index && draggedRowIndex !== index ? "border-t-2 border-t-cyan-400 bg-cyan-500/10" : "",
                                        ].join(" ")}
                                      >
                                        <div className="grid items-start gap-2 px-2 py-2" style={{ gridTemplateColumns, minWidth: `${totalMinWidth}px`, width: '100%' }}>
                                          {desktopColumns.map((col) => {
                                           if (col.key === "drag") {
                                             return (
                                               <div key={col.key} className="flex items-center justify-center pt-2.5">
                                                 <div
                                                   className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-cyan-400 p-1 rounded hover:bg-white/10 transition-colors select-none"
                                                   title="Hold and drag to reorder row"
                                                 >
                                                   <Bars3Icon className="w-4 h-4" />
                                                 </div>
                                               </div>
                                             );
                                           }
                                           if (col.key === "product") {
                                             const matchedScheme = findMatchingScheme(item.product_id, item.quantity);
                                             return (
                                               <div key={col.key}>
                                                 <ProductAutocomplete
                                                   idx={index}
                                                   values={values}
                                                   setFieldValue={setFieldValue}
                                                   products={products}
                                                   onInputChange={() => handleAutoAddRow(index)}
                                                   showDescription={itemSettings.show_item_description}
                                                   showManufacturer={itemSettings.show_item_manufacturer}
                                                   onCreateNewProduct={canAccessInventory ? handleCreateInventoryProduct : undefined}
                                                   onSelectProduct={(prod) => handleProductSelected(index, prod, setFieldValue, values)}
                                                 />
                                                 {canAccessInventory && item.product?.trim() && (
                                                   <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                                     {item.product_id ? (
                                                       <button
                                                         type="button"
                                                         onClick={() => setCatalogSyncModal({
                                                           idx: index,
                                                           product_id: item.product_id,
                                                           name: item.product,
                                                           price: item.price,
                                                           hsn_sac_code: item.hsn_sac_code,
                                                           tax: item.tax,
                                                           description: item.description || item.product_description || "",
                                                           unit: item.unit || "pcs",
                                                         })}
                                                         className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-1.5 py-0.5 rounded transition-colors"
                                                         title="Update master catalog item with these values"
                                                       >
                                                         <ArrowPathIcon className="w-3 h-3" />
                                                         <span>Update Catalog</span>
                                                       </button>
                                                     ) : (
                                                       <button
                                                         type="button"
                                                         onClick={() => setCatalogSyncModal({
                                                           idx: index,
                                                           product_id: null,
                                                           name: item.product,
                                                           price: item.price,
                                                           hsn_sac_code: item.hsn_sac_code,
                                                           tax: item.tax,
                                                           description: item.description || item.product_description || "",
                                                           unit: item.unit || "pcs",
                                                         })}
                                                         className="inline-flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.5 rounded transition-colors"
                                                         title="Save this line item as a new product in your catalog"
                                                       >
                                                         <PlusIcon className="w-3 h-3" />
                                                         <span>Save to Catalog</span>
                                                       </button>
                                                     )}
                                                   </div>
                                                 )}
                                                 {matchedScheme && (
                                                   <div className="mt-1 flex items-center gap-1 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded w-fit">
                                                     <span>🎁</span>
                                                     <span>{matchedScheme.name}</span>
                                                     {matchedScheme.scheme_type === 'bogo' && (
                                                       <span className="text-emerald-300">(Buy {matchedScheme.min_qty} Get {matchedScheme.free_qty} Free)</span>
                                                     )}
                                                     {matchedScheme.scheme_type === 'percentage_discount' && (
                                                       <span className="text-emerald-300">({matchedScheme.discount_percent}% Off)</span>
                                                     )}
                                                   </div>
                                                 )}
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
                                                   min="0"
                                                   className="w-full text-center bg-transparent border border-white/10 rounded px-2 py-2 text-xs text-gray-200"
                                                   onChange={(e) => handleItemQuantityChange(index, e.target.value, setFieldValue, values)}
                                                 />
                                               </div>
                                             );
                                           }

                                           if (col.key === "free") {
                                             const matchedScheme = findMatchingScheme(item.product_id, item.quantity);
                                             const freeQtyNum = Number(values.items[index]?.free_quantity) || 0;
                                             return (
                                               <div key={col.key} className="relative">
                                                 <Field
                                                   name={`items.${index}.free_quantity`}
                                                   type="number"
                                                   min="0"
                                                   className="w-full text-center bg-transparent border border-white/10 rounded px-2 py-2 text-xs text-green-300 font-bold focus:border-green-500"
                                                 />
                                                 {matchedScheme && matchedScheme.scheme_type === 'bogo' && freeQtyNum > 0 && (
                                                   <span
                                                     className="absolute -top-1.5 -right-1 bg-emerald-500/30 text-emerald-300 text-[8px] font-black px-1 rounded border border-emerald-400/40 pointer-events-none"
                                                     title={`${matchedScheme.name}: Buy ${matchedScheme.min_qty} Get ${matchedScheme.free_qty} Free`}
                                                   >
                                                     +{freeQtyNum}
                                                   </span>
                                                 )}
                                               </div>
                                             );
                                           }

                                          if (col.key === "unit") {
                                            return (
                                              <div key={col.key}>
                                                <select
                                                  value={item.unit || "pcs"}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === "__custom__") {
                                                      const custom = window.prompt("Enter custom unit name (e.g. roll, pkt, bundle):");
                                                      if (custom && custom.trim()) {
                                                        const clean = custom.trim().toLowerCase();
                                                        handleAddCustomUnit(clean);
                                                        setFieldValue(`items.${index}.unit`, clean);
                                                      }
                                                    } else {
                                                      setFieldValue(`items.${index}.unit`, val);
                                                    }
                                                  }}
                                                  className="w-full bg-transparent border border-white/10 rounded px-2 py-2 text-xs text-gray-200"
                                                >
                                                  {availableUnits.map((u) => <option key={u} value={u} className="bg-[#111]">{u}</option>)}
                                                  <option value="__custom__" className="bg-[#1a2341] text-cyan-400 font-bold">+ Custom Unit...</option>
                                                </select>
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
                                                   step="0.0001"
                                                   className="w-full text-right bg-transparent border border-white/10 rounded px-2 py-2 text-sm font-mono text-gray-100"
                                                   onChange={(e) => {
                                                     const price = e.target.value;
                                                     setFieldValue(`items.${index}.price`, price);
                                                     const qty = parseFloat(values.items[index]?.quantity) || 0;
                                                     const actualPrice = Number(price) || 0;
                                                     setFieldValue(`items.${index}.amount`, actualPrice * qty);
                                                     if (price && Number(price) > 0) handleAutoAddRow(index);
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
                                                <Field name={`items.${index}.tax`} type="number" step="1" className="w-full text-center bg-transparent border border-white/10 rounded px-2 py-2 text-xs text-gray-200" />
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
                                              <div key={col.key} className="flex items-center justify-center gap-0.5">
                                                <button
                                                  type="button"
                                                  onClick={() => insert(index + 1, {
                                                    _key: `note-${Math.random().toString(36).substring(2, 9)}`,
                                                    row_type: 'note',
                                                    product: null,
                                                    product_name: 'Note',
                                                    description: '',
                                                    product_description: '',
                                                    quantity: 0,
                                                    free_quantity: 0,
                                                    batch: '',
                                                    unit: '',
                                                    price: 0,
                                                    discount: 0,
                                                    tax: 0,
                                                    amount: 0,
                                                  })}
                                                  className="p-1 text-gray-400 hover:text-amber-300 transition-colors"
                                                  title="Add Note Below"
                                                  tabIndex={-1}
                                                >
                                                  <DocumentPlusIcon className="w-3.5 h-3.5" />
                                                </button>
                                                {canAccessInventory && item.product?.trim() && (
                                                  <button
                                                    type="button"
                                                    onClick={() => setCatalogSyncModal({
                                                      idx: index,
                                                      product_id: item.product_id || null,
                                                      name: item.product,
                                                      price: item.price,
                                                      hsn_sac_code: item.hsn_sac_code,
                                                      tax: item.tax,
                                                      description: item.description || item.product_description || "",
                                                      unit: item.unit || "pcs",
                                                    })}
                                                    className="text-gray-400 hover:text-cyan-400 transition-colors p-1"
                                                    title={item.product_id ? "Update Catalog Item" : "Save as New Product in Catalog"}
                                                    tabIndex={-1}
                                                  >
                                                    <ArrowPathIcon className="h-3.5 w-3.5" />
                                                  </button>
                                                )}
                                                <button
                                                  type="button"
                                                  onClick={() => remove(index)}
                                                  disabled={values.items.length === 1}
                                                  className="text-gray-500 hover:text-red-400 transition-colors p-1 disabled:opacity-30"
                                                  title="Remove Item"
                                                  tabIndex={-1}
                                                >
                                                  <TrashIcon className="h-3.5 w-3.5" />
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

                                <div className="lg:hidden space-y-4">
                                  {values.items.map((item, index) => {
                                    if (item.row_type === 'note') {
                                      return (
                                        <div
                                          key={item._key ? `mobile-${item._key}` : `mobile-${index}`}
                                          className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex flex-col gap-3"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                                              <DocumentTextIcon className="w-4 h-4 text-amber-400" />
                                              Note Row #{index + 1}
                                            </span>
                                            <div className="flex items-center gap-1">
                                              <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                disabled={values.items.length === 1}
                                                className="p-1.5 text-red-400 hover:text-red-300 disabled:opacity-20"
                                                title="Remove Note"
                                              >
                                                <TrashIcon className="w-4 h-4" />
                                              </button>
                                            </div>
                                          </div>
                                          <Field
                                            as="textarea"
                                            name={`items.${index}.description`}
                                            rows={2}
                                            placeholder="Enter section header, remarks, or notes..."
                                            className="w-full bg-[#0a0a0a] border border-amber-500/30 rounded-xl p-2.5 text-amber-100 placeholder-gray-500 text-xs focus:ring-1 focus:ring-amber-400 outline-none"
                                          />
                                        </div>
                                      );
                                    }

                                    const productBatches = getProductBatchesForItem(item);
                                    return (
                                      <div key={item._key ? `mobile-${item._key}` : `mobile-${index}`} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-4 hover:bg-white/10 transition-all">
                                      {/* Row 1: Product */}
                                      <div className="w-full">
                                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Product Name</label>
                                          <ProductAutocomplete
                                            idx={index}
                                            values={values}
                                            setFieldValue={setFieldValue}
                                            products={products}
                                            onInputChange={() => handleAutoAddRow(index)}
                                            showDescription={itemSettings.show_item_description}
                                            showManufacturer={itemSettings.show_item_manufacturer}
                                            onCreateNewProduct={canAccessInventory ? handleCreateInventoryProduct : undefined}
                                            onSelectProduct={(prod) => handleProductSelected(index, prod, setFieldValue, values)}
                                          />
                                          {canAccessInventory && item.product?.trim() && (
                                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                                              {item.product_id ? (
                                                <button
                                                  type="button"
                                                  onClick={() => setCatalogSyncModal({
                                                    idx: index,
                                                    product_id: item.product_id,
                                                    name: item.product,
                                                    price: item.price,
                                                    hsn_sac_code: item.hsn_sac_code,
                                                    tax: item.tax,
                                                    description: item.description || item.product_description || "",
                                                    unit: item.unit || "pcs",
                                                  })}
                                                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-2 py-1 rounded-lg transition-colors font-medium"
                                                >
                                                  <ArrowPathIcon className="w-3.5 h-3.5" />
                                                  <span>Update Catalog Item</span>
                                                </button>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => setCatalogSyncModal({
                                                    idx: index,
                                                    product_id: null,
                                                    name: item.product,
                                                    price: item.price,
                                                    hsn_sac_code: item.hsn_sac_code,
                                                    tax: item.tax,
                                                    description: item.description || item.product_description || "",
                                                    unit: item.unit || "pcs",
                                                  })}
                                                  className="inline-flex items-center gap-1.5 text-xs text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-2 py-1 rounded-lg transition-colors font-medium"
                                                >
                                                  <PlusIcon className="w-3.5 h-3.5" />
                                                  <span>Save to Catalog</span>
                                                </button>
                                              )}
                                            </div>
                                          )}
                                          {(() => {
                                            const matchedScheme = findMatchingScheme(item.product_id, item.quantity);
                                            if (!matchedScheme) return null;
                                            return (
                                              <div className="mt-1 flex items-center gap-1 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded w-fit">
                                                <span>🎁</span>
                                                <span>{matchedScheme.name}</span>
                                                {matchedScheme.scheme_type === 'bogo' && (
                                                  <span className="text-emerald-300">(Buy {matchedScheme.min_qty} Get {matchedScheme.free_qty} Free)</span>
                                                )}
                                                {matchedScheme.scheme_type === 'percentage_discount' && (
                                                  <span className="text-emerald-300">({matchedScheme.discount_percent}% Off)</span>
                                                )}
                                              </div>
                                            );
                                          })()}
                                      </div>
                                      
                                      {/* Settings Optional Fields: HSN & Batch */}
                                      {(itemSettings.show_item_hsn || itemSettings.show_item_batch) && (
                                          <div className="grid grid-cols-2 gap-4">
                                              {itemSettings.show_item_hsn && (
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">HSN/SAC</label>
                                                    <Field name={`items.${index}.hsn_sac_code`} type="text" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm" />
                                                </div>
                                              )}
                                              {itemSettings.show_item_batch && (
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Batch</label>
                                                    <Field name={`items.${index}.batch`}>
                                                      {({ field }) => (
                                                        <select {...field} className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm" disabled={!item.product_id}>
                                                          <option value="">Auto (FEFO)</option>
                                                          {productBatches.map((b) => (
                                                            <option key={b.id} value={b.id}>{b.name} ({b.qty})</option>
                                                          ))}
                                                        </select>
                                                      )}
                                                    </Field>
                                                </div>
                                              )}
                                          </div>
                                      )}

                                      {/* Row 2: Qty, Unit, Price */}
                                      <div className="grid grid-cols-3 gap-4">
                                          <div>
                                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Qty</label>
                                              <Field
                                                name={`items.${index}.quantity`}
                                                type="number"
                                                min="0"
                                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm text-center font-bold"
                                                onChange={(e) => handleItemQuantityChange(index, e.target.value, setFieldValue, values)}
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Unit</label>
                                              <select
                                                value={item.unit || "pcs"}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  if (val === "__custom__") {
                                                    const custom = window.prompt("Enter custom unit name (e.g. roll, pkt, bundle):");
                                                    if (custom && custom.trim()) {
                                                      const clean = custom.trim().toLowerCase();
                                                      handleAddCustomUnit(clean);
                                                      setFieldValue(`items.${index}.unit`, clean);
                                                    }
                                                  } else {
                                                    setFieldValue(`items.${index}.unit`, val);
                                                  }
                                                }}
                                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-2 py-2.5 text-white text-sm text-center"
                                              >
                                                {availableUnits.map((u) => <option key={u} value={u} className="bg-[#111]">{u}</option>)}
                                                <option value="__custom__" className="bg-[#1a2341] text-cyan-400 font-bold">+ Custom Unit...</option>
                                              </select>
                                          </div>
                                          <div>
                                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Price</label>
                                              <Field
                                                 name={`items.${index}.price`}
                                                 type="number"
                                                 min="0"
                                                 step="0.0001"
                                                 className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm text-right font-mono"
                                                 onChange={(e) => {
                                                   const price = e.target.value;
                                                   setFieldValue(`items.${index}.price`, price);
                                                   const qty = parseFloat(values.items[index]?.quantity) || 0;
                                                   const actualPrice = Number(price) || 0;
                                                   setFieldValue(`items.${index}.amount`, actualPrice * qty);
                                                   if (price && Number(price) > 0) handleAutoAddRow(index);
                                                 }}
                                               />
                                          </div>
                                      </div>

                                      {/* Row 3: Discounts and Taxes */}
                                      {(itemSettings.show_item_discount || itemSettings.show_item_tax || itemSettings.show_item_free_quantity) && (
                                          <div className="grid grid-cols-3 gap-4">
                                            {itemSettings.show_item_free_quantity && (
                                                <div className="relative">
                                                    <div className="flex items-center justify-between mb-2">
                                                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Free</label>
                                                      {(() => {
                                                        const matchedScheme = findMatchingScheme(item.product_id, item.quantity);
                                                        const freeQtyNum = Number(values.items[index]?.free_quantity) || 0;
                                                        if (matchedScheme && matchedScheme.scheme_type === 'bogo' && freeQtyNum > 0) {
                                                          return (
                                                            <span className="bg-emerald-500/30 text-emerald-300 text-[8px] font-black px-1.5 py-0.5 rounded border border-emerald-400/40">
                                                              +{freeQtyNum} Free
                                                            </span>
                                                          );
                                                        }
                                                        return null;
                                                      })()}
                                                    </div>
                                                    <Field name={`items.${index}.free_quantity`} type="number" min="0" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-green-300 font-bold text-sm text-center" />
                                                </div>
                                            )}
                                            {itemSettings.show_item_discount && (
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Disc %</label>
                                                    <Field name={`items.${index}.discount`} type="number" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm text-center" />
                                                </div>
                                            )}
                                            {itemSettings.show_item_tax && (
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Tax %</label>
                                                    <Field name={`items.${index}.tax`} type="number" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm text-center" />
                                                </div>
                                            )}
                                          </div>
                                      )}

                                      {/* Row 4: Amount & Actions */}
                                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                          <div>
                                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Subtotal</label>
                                              <div className="text-xl font-mono font-black text-cyan-400">
                                                  {getCurrencySymbol()}{Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                              </div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => insert(index + 1, {
                                                _key: `note-${Math.random().toString(36).substring(2, 9)}`,
                                                row_type: 'note',
                                                product: null,
                                                product_name: 'Note',
                                                description: '',
                                                product_description: '',
                                                quantity: 0,
                                                free_quantity: 0,
                                                batch: '',
                                                unit: '',
                                                price: 0,
                                                discount: 0,
                                                tax: 0,
                                                amount: 0,
                                              })}
                                              className="p-1.5 text-gray-400 hover:text-amber-300"
                                              title="Add Note Below"
                                            >
                                              <DocumentPlusIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => remove(index)}
                                              disabled={values.items.length === 1}
                                              className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl transition-all hover:bg-red-500/20 disabled:opacity-30 text-[10px] font-black uppercase tracking-widest"
                                              tabIndex={-1}
                                            >
                                              Remove
                                            </button>
                                          </div>
                                      </div>
                                     </div>
                                    );
                                  })}
                                </div>
                              </>
                            );
                          })()}
                        
                        <div className="mt-4 flex justify-start">
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => push({
                                product: "",
                                product_id: null,
                                description: "",
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
                            <button
                              type="button"
                              onClick={() => push({
                                _key: `note-${Math.random().toString(36).substring(2, 9)}`,
                                row_type: 'note',
                                product: null,
                                product_name: 'Note',
                                description: '',
                                product_description: '',
                                quantity: 0,
                                free_quantity: 0,
                                batch: '',
                                unit: '',
                                price: 0,
                                discount: 0,
                                tax: 0,
                                amount: 0,
                              })}
                              className="px-4 py-2 border border-amber-500/30 hover:border-amber-400/50 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl text-sm text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-2 cursor-pointer font-medium"
                            >
                              <DocumentPlusIcon className="w-4 h-4 text-amber-400" />
                              <span>+ Add Note</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDocNote(!showDocNote)}
                              className="px-3.5 py-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <DocumentTextIcon className="w-4 h-4 text-cyan-400" />
                              <span>{showDocNote ? "Hide Document Terms" : "+ Terms & Remarks"}</span>
                            </button>
                          </div>

                          {(showDocNote || values.notes) && (
                            <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-gray-300">Document Notes & Terms</label>
                                <span className="text-[10px] text-gray-500">Will appear in the printed bill footer</span>
                              </div>
                              <Field
                                as="textarea"
                                name="notes"
                                rows={2}
                                placeholder="Enter delivery instructions, terms & conditions, client reference, or remarks..."
                                className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                              />
                            </div>
                          )}
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
                      <span className="text-white font-medium">{getCurrencySymbol()}{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-400">
                      <span>Total Discount</span>
                      <span>-{getCurrencySymbol()}{totalDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span>Total Tax</span>
                      <span>{getCurrencySymbol()}{totalTax.toFixed(2)}</span>
                    </div>
                    {isIGST ? (
                      <div className="flex justify-between text-orange-400 text-xs pl-2">
                        <span>↳ IGST</span>
                        <span>{getCurrencySymbol()}{totalTax.toFixed(2)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-orange-400 text-xs pl-2">
                          <span>↳ CGST</span>
                          <span>{getCurrencySymbol()}{(totalTax / 2).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-orange-400 text-xs pl-2">
                          <span>↳ SGST</span>
                          <span>{getCurrencySymbol()}{(totalTax / 2).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="h-px bg-white/10 my-3"></div>
                    {roundOffApplied && (
                      <div className="flex justify-between text-amber-300">
                        <span>Round Off</span>
                        <span>{roundOffDelta >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOffDelta.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xl">
                      <span className="text-white">Grand Total</span>
                      <span className="text-cyan-400">{getCurrencySymbol()}{(roundOffApplied ? roundedGrandTotal : grandTotal).toFixed(2)}</span>
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
                      {grandTotal > 0 ? "Amount Payable" : ""}
                    </div>
                  </div>
                </div>
                </div>{/* End flex-1 scrollable */}

                {/* Actions */}
                <div className="flex-none p-6 sm:p-8 bg-[#0c0c0e]/95 backdrop-blur-xl border-t border-white/5 flex justify-end space-x-3 rounded-b-[24px] items-center z-40 relative">
                  <div className="text-gray-500 text-xs flex-1 mr-4 hidden sm:block">
                    Closing this window automatically saves as a draft. Or click Save Draft.
                  </div>
                  {!forceDraft && (
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
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 bg-white/5 border border-white/10 text-gray-300 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 rounded-[14px] transition-colors font-medium text-sm focus:ring-2 focus:ring-red-500/50 focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={() => {
                      submitActionRef.current = forceDraft ? 'draft' : 'final';
                    }}
                    className="btn-primary shadow-lg shadow-cyan-500/20 disabled:opacity-50 min-w-[150px] rounded-[14px] focus:ring-2 focus:ring-cyan-500/50 focus:outline-none"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                         Saving...
                      </span>
                    ) : isDeliveryChallan
                      ? (isEdit ? "Update Challan" : "Create Delivery Challan")
                      : isQuotation
                      ? (isEdit ? "Update Quotation" : "Create Quotation")
                      : forceDraft
                        ? (isEdit ? "Update Draft" : "Save Draft")
                        : (isEdit ? "Update Invoice" : "Create Invoice")}
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>

        {/* Catalog Sync Prompt Modal */}
        {catalogSyncModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#18181b] border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                  <ArrowPathIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Sync Catalog Product</h3>
                  <p className="text-xs text-gray-400">"{catalogSyncModal.name || 'Custom Product'}"</p>
                </div>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {catalogSyncModal.product_id
                  ? "You modified item details for this catalog line. Would you like to update the existing catalog master record or save this configuration as a new product in your inventory?"
                  : "This custom item is not yet in your inventory catalog. Would you like to save it as a new product in your catalog so you can reuse it in future invoices?"}
              </p>
              <div className="space-y-2 pt-2">
                {catalogSyncModal.product_id && (
                  <button
                    type="button"
                    onClick={handleUpdateCatalogItem}
                    className="w-full py-2.5 px-4 bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-xs rounded-xl transition-colors text-left flex items-center justify-between"
                  >
                    <span>Update Catalog Item</span>
                    <span className="text-[10px] text-cyan-400/70">Overwrites master name/price/HSN/tax</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveAsNewCatalogItem}
                  className="w-full py-2.5 px-4 bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30 text-purple-300 font-semibold text-xs rounded-xl transition-colors text-left flex items-center justify-between"
                >
                  <span>Save as New Product</span>
                  <span className="text-[10px] text-purple-400/70">Creates new catalog master product</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogSyncModal(null)}
                  className="w-full py-2 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white text-xs rounded-xl transition-colors text-center"
                >
                  Keep For This Document Only
                </button>
              </div>
            </div>
          </div>
        )}

        {productCreationState && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setProductCreationState(null)}></div>
            <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl shadow-cyan-950/40 animate-fade-up">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Add Inventory Item</h3>
                  <p className="mt-1 text-xs text-gray-400">Create the product first, then it will be inserted into this quotation row.</p>
                </div>
                <button type="button" onClick={() => setProductCreationState(null)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 hover:text-white">
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Product Name</label>
                  <input value={productCreationState.name} readOnly className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-2.5 text-white outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Sale Price</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={productCreationState.sale_price}
                    onChange={(e) => setProductCreationState((current) => ({ ...current, sale_price: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-2.5 text-white outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Unit</label>
                  <input
                    value={productCreationState.unit}
                    onChange={(e) => setProductCreationState((current) => ({ ...current, unit: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-2.5 text-white outline-none"
                    placeholder="pcs"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">GST %</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={productCreationState.tax}
                    onChange={(e) => setProductCreationState((current) => ({ ...current, tax: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-2.5 text-white outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">HSN/SAC</label>
                  <input
                    value={productCreationState.hsn_sac_code}
                    onChange={(e) => setProductCreationState((current) => ({ ...current, hsn_sac_code: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-2.5 text-white outline-none"
                    placeholder="Optional"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Description</label>
                  <textarea
                    rows={3}
                    value={productCreationState.description}
                    onChange={(e) => setProductCreationState((current) => ({ ...current, description: e.target.value }))}
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-2.5 text-white outline-none"
                    placeholder="Optional product description"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setProductCreationState(null)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 hover:text-white">
                  Cancel
                </button>
                <button type="button" onClick={handleSaveInventoryProduct} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-900/30 hover:from-cyan-400 hover:to-blue-400">
                  Create Product
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Customer Edit Modal */}
        {editingCustomer && (
          <CustomerForm
            isOpen={!!editingCustomer}
            onClose={() => setEditingCustomer(null)}
            editData={editingCustomer}
            onSaved={(updatedCustomer) => {
              if (updatedCustomer && formikRef.current) {
                if (updatedCustomer.name) formikRef.current.setFieldValue('customer_name', updatedCustomer.name);
                if (updatedCustomer.address) {
                  formikRef.current.setFieldValue('customer_address', updatedCustomer.address);
                  formikRef.current.setFieldValue('delivery_address', updatedCustomer.address);
                }
                if (updatedCustomer.gstin) formikRef.current.setFieldValue('customer_gstin', updatedCustomer.gstin);
                if (updatedCustomer.phone) formikRef.current.setFieldValue('customer_phone', updatedCustomer.phone);
                if (updatedCustomer.email) formikRef.current.setFieldValue('customer_email', updatedCustomer.email);
                if (updatedCustomer.gstin && updatedCustomer.gstin.length >= 2) {
                  const stateCode = updatedCustomer.gstin.substring(0, 2);
                  if (GST_STATE_CODE_MAP[stateCode]) {
                    formikRef.current.setFieldValue('place_of_supply', GST_STATE_CODE_MAP[stateCode]);
                  }
                } else if (updatedCustomer.state) {
                  formikRef.current.setFieldValue('place_of_supply', updatedCustomer.state);
                }
              }
              setEditingCustomer(null);
            }}
          />
        )}
      </div>
    </div>,
    document.body
  );
}