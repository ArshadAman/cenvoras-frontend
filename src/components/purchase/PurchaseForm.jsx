import React, { useEffect, useState, useRef } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createPurchaseBill, updatePurchaseBill, getProducts } from "../../api/purchase";
import { getVendors } from "../../api/vendors";
import { createPortal } from "react-dom";
import { getWarehouses } from "../../api/inventory";
import { toast } from "react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import { getAllUnits, saveCustomUnit } from '../../utils/units';
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import Button from "../common/Button";
import DateInputField from "../common/DateInputField";
import useEscKey from "../../hooks/useEscStack";
import useUnsavedPrompt from "../../hooks/useUnsavedPrompt";
import { getUserProfile } from "../../api/users";
import { getTodayKolkata } from "../../utils/date";
import { autofillTaxFromLearnedHsn } from "../../utils/hsnAutofill";

// Helper for Indian States (same as Sales)
const INDIAN_STATES = [
  { code: "37", name: "Andhra Pradesh" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "18", name: "Assam" },
  { code: "10", name: "Bihar" },
  { code: "22", name: "Chhattisgarh" },
  { code: "30", name: "Goa" },
  { code: "24", name: "Gujarat" },
  { code: "06", name: "Haryana" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "20", name: "Jharkhand" },
  { code: "29", name: "Karnataka" },
  { code: "32", name: "Kerala" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "27", name: "Maharashtra" },
  { code: "14", name: "Manipur" },
  { code: "17", name: "Meghalaya" },
  { code: "15", name: "Mizoram" },
  { code: "13", name: "Nagaland" },
  { code: "21", name: "Odisha" },
  { code: "03", name: "Punjab" },
  { code: "08", name: "Rajasthan" },
  { code: "11", name: "Sikkim" },
  { code: "33", name: "Tamil Nadu" },
  { code: "36", name: "Telangana" },
  { code: "16", name: "Tripura" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "05", name: "Uttarakhand" },
  { code: "19", name: "West Bengal" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "04", name: "Chandigarh" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "07", name: "Delhi" },
  { code: "01", name: "Jammu and Kashmir" },
  { code: "31", name: "Lakshadweep" },
  { code: "34", name: "Puducherry" },
  { code: "38", name: "Ladakh" }
];

// Recursive helper to parse nested error details from the backend
const parseErrorDetails = (details) => {
  if (!details) return null;
  if (typeof details === 'string') return details;
  if (Array.isArray(details)) {
    for (const item of details) {
      if (item) {
        const parsed = parseErrorDetails(item);
        if (parsed) return parsed;
      }
    }
  } else if (typeof details === 'object') {
    for (const key of Object.keys(details)) {
      const value = details[key];
      const parsed = parseErrorDetails(value);
      if (parsed) {
        // If the key is numeric (like index in an items array), omit it from the prefix
        return isNaN(Number(key)) ? `${key}: ${parsed}` : parsed;
      }
    }
  }
  return null;
};

// Product Autocomplete Component - Dark Theme
function ProductAutocomplete({ idx, values, setFieldValue, products, showManufacturer = true }) {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(values.items[idx]?.product_name || "");

  useEscKey(() => setShowDropdown(false), showDropdown, 30);

  useEffect(() => {
    setInputValue(values.items[idx]?.product_name || "");
  }, [values.items[idx]?.product_name]);

  const selectProduct = (product) => {
    setFieldValue(`items.${idx}.product_name`, product.name);
    setFieldValue(`items.${idx}.product_id`, product.id);
    setFieldValue(`items.${idx}.manufacturer`, product.manufacturer || "");
    setFieldValue(`items.${idx}.unit`, product.unit || 'pcs');
    setFieldValue(`items.${idx}.purchase_price`, product.purchase_price ?? product.price ?? 0);
    setFieldValue(`items.${idx}.hsn_code`, product.hsn_code || product.hsn_sac_code || "");
    setFieldValue(`items.${idx}.description`, product.description || "");
    setFieldValue(`items.${idx}.product_description`, product.description || "");
    setFieldValue(`items.${idx}.discount`, product.discount ?? 0);
    setFieldValue(`items.${idx}.tax`, product.tax ?? 0);
    setFieldValue(`items.${idx}.isExistingProduct`, true);
    setInputValue(product.name);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFieldValue(`items.${idx}.product_name`, value);
    setFieldValue(`items.${idx}.isExistingProduct`, false);
    setFieldValue(`items.${idx}.product_id`, null);
    setFieldValue(`items.${idx}.description`, "");
    setFieldValue(`items.${idx}.product_description`, "");

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
      <Field name={`items.${idx}.product_name`}>
        {({ field, meta }) => (
          <div>
            <input
              {...field}
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => {
                const query = (inputValue || "").trim().toLowerCase();
                const filtered = products.filter(product =>
                  (product.name || "").toLowerCase().includes(query)
                );
                setFilteredProducts(filtered);
                setShowDropdown(filtered.length > 0);
              }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Product name"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all text-xs font-bold"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  if (showDropdown && filteredProducts.length === 1) {
                    e.preventDefault();
                    selectProduct(filteredProducts[0]);
                  }
                  setShowDropdown(false);
                  return;
                }
                if (showDropdown && filteredProducts.length === 1 && e.key === 'Enter') {
                  e.preventDefault();
                  selectProduct(filteredProducts[0]);
                } else if (e.key === 'Escape') {
                  setShowDropdown(false);
                }
              }}
            />
            {showManufacturer && (values.items[idx]?.manufacturer || values.items[idx]?.product_detail?.manufacturer) && (
              <div className="text-[8px] text-[var(--text-muted)] font-medium italic mt-0.5 tracking-wide">
                ({values.items[idx]?.manufacturer || values.items[idx]?.product_detail?.manufacturer})
              </div>
            )}
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
              className="w-full bg-transparent border-0 border-b border-transparent hover:border-[var(--border-subtle)] focus:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] rounded px-1.5 py-0.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all text-[11px] leading-relaxed resize-none italic mt-1"
            />
          </div>
        )}
      </Field>
      {showDropdown && (
        <div className="absolute z-10 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md shadow-lg w-full max-h-40 overflow-y-auto mt-1">
          {filteredProducts.slice(0, 50).map(product => (
            <div
              key={product.id}
              className="px-3 py-2 hover:bg-[var(--bg-primary)] cursor-pointer text-sm border-b border-[var(--border-subtle)] last:border-0"
              onClick={() => selectProduct(product)}
            >
              <div className="font-medium text-[var(--text-primary)]">{product.name}</div>
              <div className="text-[var(--text-muted)] text-xs">
                Unit: {product.unit} | Price: {getCurrencySymbol()}{product.purchase_price}
              </div>
            </div>
          ))}
          {filteredProducts.length > 50 && (
             <div className="px-3 py-2 text-[10px] text-[var(--text-muted)] text-center italic border-t border-[var(--border-subtle)]">
                Showing top 50 results...
             </div>
          )}
        </div>
      )}
    </div>
  );
}

// Vendor Autocomplete Component - Smart Feature
function VendorAutocomplete({ values, setFieldValue, vendors }) {
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(values.vendor_name || "");

  useEscKey(() => setShowDropdown(false), showDropdown, 30);

  useEffect(() => {
    setInputValue(values.vendor_name || "");
  }, [values.vendor_name]);

  const selectVendor = (vendor) => {
    setFieldValue("vendor_name", vendor.name || "");
    setFieldValue("vendor_address", vendor.address || "");
    setFieldValue("vendor_gstin", vendor.gstin || "");
    setFieldValue("gst_treatment", vendor.meta?.gst_type || "registered");
    setInputValue(vendor.name || "");
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFieldValue("vendor_name", value);

    if (value.trim()) {
      const query = value.toLowerCase();
      const filtered = (vendors || []).filter(v =>
        v.name?.toLowerCase().includes(query) ||
        (v.gstin && v.gstin.toLowerCase().includes(query)) ||
        (v.email && v.email.toLowerCase().includes(query)) ||
        (v.phone && v.phone.includes(query))
      );
      setFilteredVendors(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <Field name="vendor_name">
        {({ field }) => (
          <div>
            <input
              {...field}
              id="vendor_name"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => {
                if (inputValue.trim()) {
                   const query = inputValue.toLowerCase();
                   const filtered = (vendors || []).filter(v => 
                     v.name?.toLowerCase().includes(query) ||
                     (v.gstin && v.gstin.toLowerCase().includes(query))
                   );
                   if (filtered.length > 0) {
                      setFilteredVendors(filtered);
                      setShowDropdown(true);
                   }
                }
              }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Enter vendor name to search or create new"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all text-xs font-bold"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-1p-ignore="true"
            />
          </div>
        )}
      </Field>
      {showDropdown && (
        <div className="absolute z-50 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl w-full max-h-64 overflow-y-auto mt-1.5 backdrop-blur-xl">
          {filteredVendors.slice(0, 50).map(vendor => (
            <div
              key={vendor.id}
              className="px-4 py-3 hover:bg-[var(--bg-primary)] cursor-pointer text-sm border-b border-[var(--border-subtle)] last:border-0 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                selectVendor(vendor);
              }}
            >
              <div className="font-semibold text-[var(--text-primary)] flex items-center justify-between">
                <span>{vendor.name}</span>
                {vendor.gstin && (
                  <span className="text-[10px] bg-[var(--bg-primary)] text-[var(--text-primary)] px-2 py-0.5 rounded border border-[var(--border-subtle)] font-mono">
                    GST: {vendor.gstin}
                  </span>
                )}
              </div>
              <div className="text-[var(--text-muted)] text-xs mt-1 flex items-center gap-3">
                 {vendor.phone && <span>📞 {vendor.phone}</span>}
                 {vendor.email && <span className="truncate">✉️ {vendor.email}</span>}
                 {vendor.address && <span className="truncate max-w-[250px] text-[var(--text-muted)]">📍 {vendor.address}</span>}
              </div>
            </div>
          ))}
          {filteredVendors.length === 0 && (
             <div className="px-4 py-3 text-sm text-[var(--text-muted)] italic">
                No saved vendors found. A new one will be created.
             </div>
          )}
        </div>
      )}
    </div>
  );
}

const PurchaseSchema = Yup.object().shape({
  bill_number: Yup.string().required().min(1).max(100),
  bill_date: Yup.string().required("Bill date is required"),
  warehouse: Yup.string().nullable(),
  due_date: Yup.string().nullable(),
  vendor_name: Yup.string().required().min(1).max(255),
  vendor_address: Yup.string().nullable(),
  vendor_gstin: Yup.string()
    .nullable()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format")
    .max(15, "GSTIN must be less than 15 characters"),
  gst_treatment: Yup.string().nullable().max(50),
  journal: Yup.string().required().min(1).max(50),
  total_amount: Yup.number().required(),
  items: Yup.array().of(
    Yup.object().shape({
      product_name: Yup.string().required().min(1),
      quantity: Yup.number().required().min(1),
      free_quantity: Yup.number().min(0),
      unit: Yup.string().required(),
    })
  ).min(1),
});

export default function PurchaseForm({ isOpen = true, bill, onClose, onSubmit }) {
  const queryClient = useQueryClient();
  const isEdit = !!bill;
  const [showManufacturer, setShowManufacturer] = useState(true);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [availableUnits, setAvailableUnits] = useState(getAllUnits);
  const [showDocNote, setShowDocNote] = useState(false);
  const { data: warehousesResult } = useQuery({ queryKey: ["warehouses"], queryFn: getWarehouses });
  const warehouses = Array.isArray(warehousesResult)
    ? warehousesResult
    : warehousesResult?.data || warehousesResult?.results || [];

  // Lifted state: Fetch products once at top level
  const { data: productsResult } = useQuery({ 
      queryKey: ["products"], 
      queryFn: getProducts,
      staleTime: 5 * 60 * 1000, 
  });
  const products = Array.isArray(productsResult) ? productsResult : productsResult?.data || productsResult?.results || [];

  const { data: vendorsResult } = useQuery({ 
      queryKey: ["vendors"], 
      queryFn: () => getVendors({ search: "", ordering: "name" }),
      staleTime: 5 * 60 * 1000, 
  });
  const vendors = Array.isArray(vendorsResult) ? vendorsResult : vendorsResult?.data || vendorsResult?.results || [];

  const { data: userProfileData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
    staleTime: 10 * 60 * 1000,
  });
  const companyGstin = (
    userProfileData?.billing_profile?.gstin ||
    userProfileData?.profile?.gstin ||
    userProfileData?.gstin ||
    ''
  ).trim();
  const companyState = (
    userProfileData?.billing_profile?.state ||
    userProfileData?.profile?.state ||
    userProfileData?.state ||
    ''
  ).trim();

  const formikRef = useRef(null);

  const handleBeforeClose = async () => {
    if (formikRef.current) {
      const values = formikRef.current.values || {};
      const validItems = (values.items || []).filter(item => 
        item.product_name && item.product_name.trim() !== ''
      );
      const vendorNameTrimmed = (values.vendor_name || '').trim().toLowerCase();
      const isSavedVendorInDb = Boolean(
        values.vendor_id ||
        (vendors || []).some(v => v.id && (v.name || '').trim().toLowerCase() === vendorNameTrimmed)
      );

      // Prevent autosaving draft if vendor is not saved in database
      if (!isSavedVendorInDb) {
        onClose();
        return;
      }

      const hasVendor = !!vendorNameTrimmed;
      const hasItems = validItems.length > 0;

      // Auto-save on exit if user entered bill details and vendor is in DB
      if (hasVendor && hasItems) {
        try {
          if (!values.bill_number) {
            formikRef.current.setFieldValue('bill_number', `PB-DRAFT-${Date.now().toString().slice(-4)}`);
          }
          await formikRef.current.submitForm();
          return;
        } catch {
          // If save fails, fallback to close
        }
      }
    }
    onClose();
  };

  useEscKey(handleBeforeClose, isOpen, 10);
  useEscKey(() => setShowColumnPicker(false), showColumnPicker, 30);

  const isFormDirty = Boolean(
    isOpen && formikRef.current?.dirty &&
    (formikRef.current?.values?.vendor_name || (formikRef.current?.values?.items && formikRef.current.values.items.some(it => it.product_name || it.quantity > 0)))
  );

  useUnsavedPrompt(isFormDirty, {
    storageKey: `purchase_bill_${bill?.id || 'new'}`,
    formData: formikRef.current?.values,
    message: 'You have an unsaved purchase bill. Leaving now will discard entered line items.',
  });

  // Keyboard Shortcuts Logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        const submitBtn = document.querySelector('button[type="submit"]');
        if(submitBtn) submitBtn.click();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleBeforeClose}></div>
      <div className="relative flex flex-col w-full h-full sm:h-[96vh] sm:max-h-[1200px] sm:max-w-[1600px] sm:w-[96vw] sm:rounded-[24px] shadow-2xl animate-fade-up sm:border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] overflow-hidden">
        
        {/* Header */}
        <div className="flex-none flex justify-between items-center p-6 sm:px-8 sm:py-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] z-40">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
              {isEdit ? "Edit Purchase Bill" : "New Purchase Bill"}
            </h2>
             <p className="text-xs text-[var(--text-muted)] flex items-center gap-2">
              <span>Press <kbd className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] px-1 rounded text-[var(--text-primary)]">F2</kbd> to save</span>
              <span>•</span>
              <span><kbd className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] px-1 rounded text-[var(--text-primary)]">Esc</kbd> to close</span>
            </p>
          </div>
          <button
            onClick={handleBeforeClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
          >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Formik
          innerRef={formikRef}
          initialValues={{
            bill_number: bill?.bill_number || "",
            bill_date: bill?.bill_date || getTodayKolkata(),
            due_date: bill?.due_date || "",
            warehouse: bill?.warehouse || "",
            vendor_name: bill?.vendor_name || "",
            vendor_address: bill?.vendor_address || "",
            vendor_gstin: bill?.vendor_gstin || "",
            gst_treatment: bill?.gst_treatment || "registered",
            is_reverse_charge: !!bill?.is_reverse_charge,
            journal: bill?.journal || "Purchase",
            total_amount: bill?.total_amount || "0.00",
            items: bill?.items?.map(item => ({
              product_name: item.product_name || item.product_detail?.name || (typeof item.product === 'object' ? item.product?.name : '') || (typeof item.product === 'string' && item.product.length < 32 ? item.product : "") || "",
              product_id: item.product_detail?.id || item.product_id || (typeof item.product === 'object' ? item.product?.id : (typeof item.product === 'string' && item.product.length >= 32 ? item.product : null)) || null,
              manufacturer: item.manufacturer || item.product_detail?.manufacturer || (typeof item.product === 'object' ? item.product?.manufacturer : "") || "",
              description: item.description || item.product_description || item.product_detail?.description || "",
              product_description: item.description || item.product_description || item.product_detail?.description || "",
              quantity: item.quantity || 1,
              free_quantity: item.free_quantity || 0,
              unit: item.unit || "pcs",
              batch_number: item.batch_number || item.batch?.batch_number || "",
              expiry_date: item.expiry_date || item.batch?.expiry_date || "",
              purchase_price: item.purchase_price ?? item.price ?? 0,
              discount: item.discount || 0,
              tax: item.tax || 0,
              hsn_code: item.hsn_code || item.hsn_sac_code || "",
              tax_rate: item.tax_rate || 0,
              low_stock_alert: item.low_stock_alert || 10,
              amount: item.amount || 0,
              isExistingProduct: !!(item.product_detail?.id || item.product_id || (typeof item.product === 'object' ? item.product?.id : (typeof item.product === 'string' && item.product.length >= 32))),
            })) || [{
              product_name: "",
              product_id: null,
              manufacturer: "",
              description: "",
              product_description: "",
              quantity: 1,
              free_quantity: 0,
              unit: "pcs",
              batch_number: "",
              expiry_date: "",
              purchase_price: 0,
              discount: 0,
              tax: 0,
              hsn_code: "",
              tax_rate: 0,
              low_stock_alert: 10,
              amount: 0,
              isExistingProduct: false,
            }]
          }}
          validationSchema={PurchaseSchema}
          enableReinitialize={true}
          onSubmit={async (values, { setSubmitting, setFieldError }) => {
             for (let i = 0; i < values.items.length; i++) {
               const item = values.items[i];
               if (!item.product_name || item.product_name.trim() === '') {
                 setFieldError(`items.${i}.product_name`, 'Product name is required');
                 toast.error(`Product name is required for item ${i + 1}`);
                 setSubmitting(false);
                 return;
               }
             }

             const validItems = values.items.filter(item => 
               item.product_name && item.product_name.trim() !== ''
             );
            
             if (validItems.length === 0) {
               toast.error('At least one item with a valid product name is required');
               setSubmitting(false);
               return;
             }
            
            try {
              const processedItems = validItems.map(item => {
                const quantity = Number(item.quantity) || 0;
                const free_quantity = Number(item.free_quantity) || 0;
                const price = Number(item.purchase_price) || 0;
                const discount = Number(item.discount) || 0;
                const tax = Number(item.tax) || 0;
                const discountAmount = ((quantity * price) * discount) / 100;
                const taxAmount = (((quantity * price) - discountAmount) * tax) / 100;
                const calculatedAmount = ((quantity * price) - discountAmount) + taxAmount;

                return {
                  product: item.isExistingProduct && item.product_id ? item.product_id : item.product_name.trim(),
                  hsn_sac_code: item.hsn_code || "",
                  unit: item.unit || "pcs",
                  description: (item.description || item.product_description || "").trim(),
                  product_description: (item.description || item.product_description || "").trim(),
                  quantity,
                  free_quantity,
                  price,
                  batch_number: item.batch_number || null,
                  expiry_date: item.expiry_date || null,
                  amount: Number(calculatedAmount.toFixed(2)),
                  discount,
                  tax,
                };
              });
              
              const totalAmount = validItems.reduce((sum, item) => {
                const quantity = Number(item.quantity) || 0;
                const price = Number(item.purchase_price) || 0;
                const discount = Number(item.discount) || 0;
                const tax = Number(item.tax) || 0;
                const discountAmount = ((quantity * price) * discount) / 100;
                const taxAmount = (((quantity * price) - discountAmount) * tax) / 100;
                const calculatedAmount = ((quantity * price) - discountAmount) + taxAmount;
                return sum + calculatedAmount;
              }, 0);

              const purchaseData = {
                bill_number: values.bill_number,
                bill_date: values.bill_date,
                due_date: values.due_date || null,
                warehouse: values.warehouse || null,
                vendor_name: values.vendor_name,
                vendor_address: values.vendor_address || null,
                vendor_gstin: values.vendor_gstin || null,
                gst_treatment: values.gst_treatment || null,
                is_reverse_charge: !!values.is_reverse_charge,
                journal: values.journal,
                total_amount: Number(Number(totalAmount).toFixed(2)),
                notes: values.notes || "",
                items: processedItems
              };
              
              if (isEdit) {
                await updatePurchaseBill(bill.id, purchaseData);
                toast.success("Purchase bill updated successfully!");
              } else {
                await createPurchaseBill(purchaseData);
                toast.success("Purchase bill created successfully!");
              }
              
              queryClient.invalidateQueries({ queryKey: ["purchaseBills"] });
              queryClient.invalidateQueries({ queryKey: ["products"] });
              queryClient.invalidateQueries({ queryKey: ["batches"] });
              queryClient.invalidateQueries({ queryKey: ["inventory"] });
              onClose();
            } catch (error) {
              console.error('Error saving purchase bill:', error);
              const parsedError = parseErrorDetails(error?.details);
              if (parsedError) {
                toast.error(`Error saving purchase bill: ${parsedError}`);
              } else {
                toast.error(`Error saving purchase bill: ${error.message}`);
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, isSubmitting, setFieldValue }) => {
            let taxableSubtotal = 0;
            let taxTotal = 0;
            values.items.forEach((item) => {
                const quantity = Number(item.quantity) || 0;
                const price = Number(item.purchase_price) || 0;
                const discount = Number(item.discount) || 0;
                const tax = Number(item.tax) || 0;
                const discountAmount = ((quantity * price) * discount) / 100;
                const taxable = (quantity * price) - discountAmount;
                const taxAmount = (taxable * tax) / 100;
                taxableSubtotal += taxable;
                taxTotal += taxAmount;
            });
            const grandTotal = taxableSubtotal + taxTotal;
            const vendorGstin = (values.vendor_gstin || '').trim();
            const vendorStateCode = vendorGstin.length >= 2 ? vendorGstin.slice(0, 2) : '';
            const companyStateCode = companyGstin.length >= 2
              ? companyGstin.slice(0, 2)
              : (INDIAN_STATES.find((s) => s.name.toLowerCase() === companyState.toLowerCase())?.code || '');
            const isInterstate = Boolean(
              vendorStateCode
              && companyStateCode
              && vendorStateCode !== companyStateCode
            );
            const cgst = isInterstate ? 0 : taxTotal / 2;
            const sgst = isInterstate ? 0 : taxTotal - cgst;
            const igst = isInterstate ? taxTotal : 0;

            return (
            <Form className="flex flex-col flex-1 overflow-hidden">
              
              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-0">
                <div className="p-6 sm:p-8 space-y-8">
                
                {/* Bill & Vendor Details Card */}
                <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 space-y-8">
                  {/* Bill Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="relative group">
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest group-focus-within:text-[var(--accent-primary)] transition-colors">
                        Bill Number <span className="text-red-500">*</span>
                      </label>
                      <Field
                        name="bill_number"
                        placeholder="e.g. PUR/2024/001"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        data-1p-ignore="true"
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all hover:border-[var(--border-subtle)] text-xs font-bold"
                      />
                      <ErrorMessage name="bill_number" component="div" className="text-red-400 text-[10px] mt-1.5 ml-1 font-medium" />
                    </div>
                    
                    <div className="relative group">
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest group-focus-within:text-[var(--accent-primary)] transition-colors">
                        Bill Date <span className="text-red-500">*</span>
                      </label>
                      <DateInputField
                        name="bill_date"
                        value={values.bill_date}
                        onChange={(e) => setFieldValue('bill_date', e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="!bg-[var(--bg-surface)] !py-3 !text-[var(--text-primary)]"
                      />
                    </div>

                    <div className="relative group">
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest group-focus-within:text-[var(--accent-primary)] transition-colors">
                        Warehouse
                      </label>
                      <div className="relative">
                        <Field
                          name="warehouse"
                          as="select"
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all hover:border-[var(--border-subtle)] appearance-none text-xs"
                        >
                          <option value="">Direct to Stock</option>
                          {warehouses?.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </Field>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="relative group">
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest group-focus-within:text-[var(--accent-primary)] transition-colors">
                        Due Date
                      </label>
                      <DateInputField
                        name="due_date"
                        value={values.due_date}
                        onChange={(e) => setFieldValue('due_date', e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="!bg-[var(--bg-surface)] !py-3 !text-[var(--text-primary)]"
                      />
                    </div>
                  </div>

                  {/* Vendor Info Section */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-8 border-t border-[var(--border-subtle)]">
                    <div className="md:col-span-4 space-y-6">
                      <div className="relative group">
                        <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest group-focus-within:text-[var(--accent-primary)] transition-colors">
                          Vendor Name <span className="text-red-500">*</span>
                        </label>
                        <VendorAutocomplete values={values} setFieldValue={setFieldValue} vendors={vendors} />
                        <ErrorMessage name="vendor_name" component="div" className="text-red-400 text-[10px] mt-1.5 ml-1 font-medium" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative group">
                          <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest group-focus-within:text-[var(--accent-primary)] transition-colors">
                            GSTIN
                          </label>
                          <Field
                            name="vendor_gstin"
                            placeholder="29AAAAA0000A1Z5"
                            className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all hover:border-[var(--border-subtle)] uppercase text-xs"
                          />
                        </div>
                        <div className="relative group">
                          <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest group-focus-within:text-[var(--accent-primary)] transition-colors">
                            Journal
                          </label>
                          <Field
                            name="journal"
                            className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all hover:border-[var(--border-subtle)] text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-8 flex flex-col">
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest">
                        Vendor Address & Treatment
                      </label>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                          name="vendor_address"
                          as="textarea"
                          placeholder="Registered office address..."
                          className="w-full h-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all hover:border-[var(--border-subtle)] resize-none text-xs"
                        />
                        <div className="space-y-4">
                           <div className="relative group">
                              <label className="block text-[8px] font-black text-[var(--text-muted)] mb-1 uppercase">GST Treatment</label>
                              <Field
                                name="gst_treatment"
                                as="select"
                                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all hover:border-[var(--border-subtle)] appearance-none text-xs"
                              >
                                <option value="registered">Registered Business</option>
                                <option value="unregistered">Unregistered Business</option>
                                <option value="consumer">Consumer</option>
                                <option value="overseas">Overseas</option>
                              </Field>
                           </div>
                           <label className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer">
                             <Field type="checkbox" name="is_reverse_charge" className="rounded border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--accent-primary)]" />
                             Reverse charge (RCM)
                           </label>
                           <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] leading-relaxed italic">
                             Address and GSTIN will be used to automatically calculate Intra-state (CGST/SGST) or Inter-state (IGST) taxes.
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Section Header */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Itemized Bill</h3>
                    <div className="h-px w-20 bg-[var(--border-subtle)]"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowColumnPicker((prev) => !prev)}
                        className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-primary)] text-xs text-[var(--text-primary)]"
                      >
                        Columns
                      </button>

                      {showColumnPicker && (
                        <div className="absolute right-0 top-10 z-20 w-48 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-2xl">
                          <div className="mb-2 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Show/Hide Columns</div>
                          <label className="flex items-center gap-2 py-1 text-sm text-[var(--text-primary)] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showManufacturer}
                              onChange={() => setShowManufacturer((prev) => !prev)}
                              className="h-3.5 w-3.5 rounded border-[var(--border-subtle)] bg-transparent text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                            />
                            <span>Manufacturer</span>
                          </label>
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest hidden sm:block">
                      {values.items.length} {values.items.length === 1 ? 'Item' : 'Items'} Listed
                    </div>
                  </div>
                </div>

                <FieldArray name="items">
                  {({ push, remove }) => (
                    <div className="space-y-4">
                      
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl font-black text-[9px] text-[var(--text-muted)] uppercase tracking-widest mb-3">
                            <div className="col-span-3">Product / HSN</div>
                            <div className="col-span-2">Batch Details</div>
                            <div className="col-span-1 text-center">Quantity</div>
                            <div className="col-span-1 text-center text-[var(--text-muted)]">Free</div>
                            <div className="col-span-1">Unit</div>
                            <div className="col-span-1 text-right">Unit Price</div>
                            <div className="col-span-1 text-center">Disc / Tax</div>
                            <div className="col-span-2 text-right">Net Amount</div>
                        </div>

                        {values.items.map((item, idx) => (
                           <PurchaseItemRow
                             key={idx}
                             item={item}
                             idx={idx}
                             values={values}
                             setFieldValue={setFieldValue}
                             remove={remove}
                             push={push}
                             isLastRow={idx === values.items.length - 1}
                             units={availableUnits}
                             onAddCustomUnit={(u) => {
                               saveCustomUnit(u);
                               setAvailableUnits(getAllUnits());
                             }}
                             products={products}
                             showManufacturer={showManufacturer}
                           />
                        ))}

                         <div className="pt-6 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => push({
                                  product_name: "",
                                  product_id: null,
                                  description: "",
                                  product_description: "",
                                  quantity: 1,
                                  free_quantity: 0,
                                  unit: "pcs",
                                  batch_number: "",
                                  expiry_date: "",
                                  purchase_price: 0,
                                  discount: 0,
                                  tax: 0,
                                  hsn_code: "",
                                  tax_rate: 0,
                                  amount: 0,
                                  isExistingProduct: false,
                              })}
                              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all text-xs font-bold uppercase tracking-widest"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-[var(--accent-primary)]">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                              Add New Line Item
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDocNote(!showDocNote)}
                              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all text-xs font-bold uppercase tracking-widest cursor-pointer"
                            >
                              <DocumentTextIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                              <span>{showDocNote ? "Hide Note" : "+ Add Note"}</span>
                            </button>
                         </div>

                         {(showDocNote || values.notes) && (
                           <div className="mt-4 p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl">
                             <div className="flex items-center justify-between mb-2">
                               <label className="text-xs font-semibold text-[var(--text-primary)]">Bill Notes & Remarks</label>
                               <span className="text-[10px] text-[var(--text-muted)]">Internal notes & vendor terms</span>
                             </div>
                             <Field
                               as="textarea"
                               name="notes"
                               rows={2}
                               placeholder="Enter purchase bill notes, delivery terms, payment terms, or remarks..."
                               className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none"
                             />
                           </div>
                         )}
                     </div>
                   )}
                 </FieldArray>

                {/* Totals Section */}
                <div className="flex justify-end pt-8">
                  <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-xl">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[var(--text-muted)] font-medium">Subtotal (ex-GST)</span>
                        <span className="text-[var(--text-primary)] font-black tabular-nums tracking-tight">{getCurrencySymbol()}{taxableSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      {isInterstate ? (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[var(--text-muted)] font-medium">IGST</span>
                          <span className="text-[var(--text-primary)] font-mono tabular-nums">{getCurrencySymbol()}{igst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-[var(--text-muted)] font-medium">CGST</span>
                            <span className="text-[var(--text-primary)] font-mono tabular-nums">{getCurrencySymbol()}{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-[var(--text-muted)] font-medium">SGST</span>
                            <span className="text-[var(--text-primary)] font-mono tabular-nums">{getCurrencySymbol()}{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      )}
                      <div className="h-px bg-[var(--border-subtle)]"></div>
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-widest">Payable Amount</span>
                          <span className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-tighter">Net Total (Inclusive of all taxes)</span>
                        </div>
                        <span className="text-3xl font-black text-[var(--text-primary)] tabular-nums drop-shadow-md">{getCurrencySymbol()}{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex-none p-6 sm:p-8 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-4 rounded-b-[24px] items-center z-40 relative">
                <div className="flex-1 text-[var(--text-muted)] text-[10px] font-medium uppercase tracking-[0.1em] hidden sm:block">
                  All changes are saved locally until finalized.
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="w-full sm:w-auto"
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto min-w-[180px]"
                >
                  {isSubmitting ? "Processing..." : (isEdit ? "Update Bill" : "Finalize Bill")}
                </Button>
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

function PurchaseItemRow({ item, idx, values, setFieldValue, remove, push, isLastRow = false, units, onAddCustomUnit, products, showManufacturer = true }) {
  const quantity = Number(item.quantity) || 0;
  const price = Number(item.purchase_price) || 0;
  const discount = Number(item.discount) || 0;
  const tax = Number(item.tax) || 0;

  const discountAmount = ((quantity * price) * discount) / 100;
  const taxAmount = (((quantity * price) - discountAmount) * tax) / 100;
  const calculatedAmount = ((quantity * price) - discountAmount) + taxAmount;

  return (
     <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-[20px] p-5 transition-all hover:border-[var(--accent-primary)] group mb-3 shadow-sm">
      
      {/* Product & HSN (3 cols) */}
      <div className="md:col-span-3 space-y-2.5">
         <div className="relative">
            <label className="block text-[9px] font-black text-[var(--text-muted)] mb-1.5 md:hidden uppercase tracking-widest">Product</label>
            <ProductAutocomplete idx={idx} values={values} setFieldValue={setFieldValue} products={products} showManufacturer={showManufacturer} />
         </div>
         <div className="flex items-center gap-2">
            <Field name={`items.${idx}.hsn_code`}>
                {({ field }) => (
                    <input 
                        {...field} 
                        placeholder="HSN/SAC Code" 
                        className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-[var(--text-primary)] text-[9px] font-bold focus:border-[var(--accent-primary)] outline-none uppercase tracking-wider"
                        onBlur={async (e) => {
                          field.onBlur(e);
                          await autofillTaxFromLearnedHsn(
                            e.target.value,
                            values.items[idx]?.tax,
                            (rate) => setFieldValue(`items.${idx}.tax`, rate)
                          );
                        }}
                    />
                )}
            </Field>
            <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]`}>
               {item.isExistingProduct ? "Master" : "New"}
            </div>
         </div>
      </div>

      {/* Batch & Expiry (2 cols) */}
      <div className="md:col-span-2 flex flex-col gap-2">
          <div className="relative">
            <label className="block text-[9px] font-black text-[var(--text-muted)] mb-1.5 md:hidden uppercase tracking-widest">Batch Number</label>
            <Field name={`items.${idx}.batch_number`}>
              {({ field }) => (
                <input {...field} placeholder="BATCH NO" className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-[var(--text-primary)] text-[10px] font-bold focus:border-[var(--accent-primary)] outline-none placeholder:text-[var(--text-muted)]" />
              )}
            </Field>
          </div>
          <div className="relative">
             <label className="block text-[9px] font-black text-[var(--text-muted)] mb-1.5 md:hidden uppercase tracking-widest">Expiry Date</label>
             <Field name={`items.${idx}.expiry_date`}>
               {({ field }) => (
                 <input {...field} type="date" className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-1.5 text-[var(--text-primary)] text-[10px] font-bold focus:border-[var(--accent-primary)] outline-none" />
               )}
             </Field>
          </div>
      </div>

      {/* Qty, Free, Unit (3 cols) */}
      <div className="md:col-span-3 grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
             <label className="block text-[9px] font-black text-[var(--text-muted)] md:hidden uppercase tracking-widest">Qty</label>
             <Field
                 name={`items.${idx}.quantity`}
                 type="number"
                 min="1"
                 className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-1 py-3 text-center text-[var(--text-primary)] font-black focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none text-xs tabular-nums"
             />
          </div>
          <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-[var(--text-muted)] md:hidden uppercase tracking-widest">Free</label>
              <Field
                  name={`items.${idx}.free_quantity`}
                  type="number"
                  min="0"
                  placeholder="0"
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-1 py-3 text-center text-[var(--text-primary)] font-bold focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none text-xs tabular-nums"
              />
          </div>
          <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-[var(--text-muted)] md:hidden uppercase tracking-widest">Unit</label>
              <select
                value={item.unit || "pcs"}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "__custom__") {
                    const custom = window.prompt("Enter custom unit name (e.g. roll, pkt, bundle):");
                    if (custom && custom.trim()) {
                      const clean = custom.trim().toLowerCase();
                      if (onAddCustomUnit) onAddCustomUnit(clean);
                      setFieldValue(`items.${idx}.unit`, clean);
                    }
                  } else {
                    setFieldValue(`items.${idx}.unit`, val);
                  }
                }}
                className="w-full h-[42px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-1 text-[var(--text-primary)] font-bold focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none text-[10px] uppercase text-center"
              >
                {units.map(u => <option key={u} value={u}>{u}</option>)}
                <option value="__custom__" className="text-[var(--accent-primary)] font-bold">+ Custom Unit...</option>
              </select>
          </div>
      </div>

      {/* Price, Disc, Tax (3 cols) */}
      <div className="md:col-span-3 grid grid-cols-12 gap-2">
          <div className="col-span-6 space-y-1.5">
              <label className="block text-[9px] font-black text-[var(--text-muted)] md:hidden uppercase tracking-widest">Unit Price</label>
              <Field
                  name={`items.${idx}.purchase_price`}
                  type="number"
                  min="0"
                  step="0.0001"
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-3 text-right text-[var(--text-primary)] font-black focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none text-xs tabular-nums"
              />
          </div>
          <div className="col-span-3 space-y-1.5">
              <label className="block text-[9px] font-black text-[var(--text-muted)] md:hidden uppercase tracking-widest">Disc%</label>
              <Field name={`items.${idx}.discount`} type="number" className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-1 py-3 text-center text-[var(--text-primary)] text-[10px] font-bold focus:border-[var(--accent-primary)] outline-none" placeholder="0" />
          </div>
          <div className="col-span-3 space-y-1.5">
              <label className="block text-[9px] font-black text-[var(--text-muted)] md:hidden uppercase tracking-widest">Tax%</label>
              <Field
                name={`items.${idx}.tax`}
                type="number"
                step="1"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-1 py-3 text-center text-[var(--text-primary)] text-[10px] font-bold focus:border-[var(--accent-primary)] outline-none"
                placeholder="0"
                onKeyDown={(e) => {
                  if (e.key === "Tab" && !e.shiftKey && isLastRow && typeof push === "function") {
                    e.preventDefault();
                    push({
                      product_name: "",
                      product_id: null,
                      description: "",
                      product_description: "",
                      quantity: 1,
                      free_quantity: 0,
                      unit: "pcs",
                      batch_number: "",
                      expiry_date: "",
                      purchase_price: 0,
                      discount: 0,
                      tax: 0,
                      hsn_code: "",
                      tax_rate: 0,
                      amount: 0,
                      isExistingProduct: false,
                    });
                    setTimeout(() => {
                      const nextInput = document.querySelector(`input[name="items.${idx + 1}.product_name"]`);
                      if (nextInput) {
                        nextInput.focus();
                        nextInput.select?.();
                      }
                    }, 60);
                  }
                }}
              />
          </div>
      </div>

      {/* Amount & Actions (1 col) */}
      <div className="md:col-span-1 flex flex-col items-end gap-2">
          <div className="text-right">
              <label className="block text-[9px] font-black text-[var(--text-muted)] md:hidden uppercase tracking-widest mb-1">Subtotal</label>
              <div className="font-black text-[var(--text-primary)] text-sm tabular-nums tracking-tighter">
                  {getCurrencySymbol()}{calculatedAmount.toFixed(2)}
              </div>
          </div>
          <button
              type="button"
              onClick={() => remove(idx)}
              disabled={values.items.length === 1}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-subtle)] transition-all p-2 disabled:opacity-0 hover:bg-[var(--bg-surface)] rounded-lg active:scale-90"
              title="Remove Item"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
          </button>
      </div>
    </div>
  );
}
