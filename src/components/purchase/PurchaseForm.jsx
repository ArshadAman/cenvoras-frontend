import React, { useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createPurchaseBill, updatePurchaseBill, getProducts } from "../../api/purchase";
import { getVendors } from "../../api/vendors";
import { createPortal } from "react-dom";
import { getWarehouses } from "../../api/inventory";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";

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

// Product Autocomplete Component - Dark Theme
// Product Autocomplete Component - Dark Theme
function ProductAutocomplete({ idx, values, setFieldValue, products }) {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(values.items[idx]?.product_name || "");

  const selectProduct = (product) => {
    setFieldValue(`items.${idx}.product_name`, product.name);
    setFieldValue(`items.${idx}.product_id`, product.id);
    setFieldValue(`items.${idx}.unit`, product.unit || 'pcs');
    setFieldValue(`items.${idx}.purchase_price`, product.purchase_price ?? product.price ?? 0);
    setFieldValue(`items.${idx}.hsn_code`, product.hsn_code || product.hsn_sac_code || "");
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
              placeholder="Product name"
              className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/10 text-xs font-bold"
              autoComplete="off"
            />
          </div>
        )}
      </Field>
      {showDropdown && (
        <div className="absolute z-10 bg-[#1a1a1a] border border-white/10 rounded-md shadow-lg w-full max-h-40 overflow-y-auto mt-1">
          {filteredProducts.slice(0, 50).map(product => (
            <div
              key={product.id}
              className="px-3 py-2 hover:bg-white/5 cursor-pointer text-sm border-b border-white/5 last:border-0"
              onClick={() => selectProduct(product)}
            >
              <div className="font-medium text-white">{product.name}</div>
              <div className="text-gray-500 text-xs">
                Unit: {product.unit} | Price: ₹{product.purchase_price}
              </div>
            </div>
          ))}
          {filteredProducts.length > 50 && (
             <div className="px-3 py-2 text-[10px] text-gray-500 text-center italic border-t border-white/5">
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
      const filtered = vendors.filter(v =>
        v.name?.toLowerCase().includes(value.toLowerCase())
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
        {({ field, meta }) => (
          <div>
            <input
              {...field}
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => {
                if (inputValue.trim()) {
                   const filtered = vendors.filter(v => v.name?.toLowerCase().includes(inputValue.toLowerCase()));
                   if (filtered.length > 0) {
                      setFilteredVendors(filtered);
                      setShowDropdown(true);
                   }
                }
              }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Enter vendor name to search or create new"
              className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/10 text-xs font-bold"
              autoComplete="off"
            />
          </div>
        )}
      </Field>
      {showDropdown && (
        <div className="absolute z-10 bg-[#1a1a1a] border border-white/10 rounded-md shadow-lg w-full max-h-40 overflow-y-auto mt-1">
          {filteredVendors.slice(0, 50).map(vendor => (
            <div
              key={vendor.id}
              className="px-3 py-3 hover:bg-white/5 cursor-pointer text-sm border-b border-white/5 last:border-0 transition-colors"
              onClick={() => selectVendor(vendor)}
            >
              <div className="font-bold text-cyan-400">{vendor.name}</div>
              <div className="text-gray-500 text-xs mt-1 flex gap-3">
                 {vendor.gstin && <span>GSTIN: {vendor.gstin}</span>}
                 {vendor.address && <span className="truncate max-w-[200px]">{vendor.address}</span>}
              </div>
            </div>
          ))}
          {filteredVendors.length === 0 && (
             <div className="px-3 py-3 text-sm text-gray-500 italic">
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
  warehouse: Yup.string().required("Warehouse is required"),
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

const units = ["pcs", "kg", "ltr", "box", "meter"];

export default function PurchaseForm({ bill, onClose, onSubmit }) {
  const isEdit = !!bill;
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

  // Keyboard Shortcuts Logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        const submitBtn = document.querySelector('button[type="submit"]');
        if(submitBtn) submitBtn.click();
      }
      if (e.key === "Escape") {
        const isDropdownOpen = document.querySelector('.absolute.z-10');
        if (!isDropdownOpen) {
           e.preventDefault();
           onClose();
        }
      }
      // Enter Navigation
      if (e.key === "Enter") {
        const target = e.target;
        if ((target.tagName === "INPUT" || target.tagName === "SELECT") && !target.dataset.noEnter) {
            e.preventDefault();
            const form = target.form;
            if (form) {
                const index = Array.prototype.indexOf.call(form, target);
                let nextIndex = index + 1;
                while (form.elements[nextIndex]) {
                   const next = form.elements[nextIndex];
                   if (next.tagName !== "FIELDSET" && !next.hidden && !next.disabled && next.offsetParent !== null && next.tabIndex >= 0) {
                       next.focus();
                       break;
                   }
                   nextIndex++;
                }
            }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-7xl max-h-[95vh] overflow-y-auto bento-card !p-0 shadow-2xl shadow-cyan-900/20 animate-fade-up border border-white/10 bg-[#111]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              {isEdit ? "Edit Purchase Bill" : "New Purchase Bill"}
            </h2>
             <p className="text-xs text-gray-400 flex items-center gap-2">
              <span>Press <kbd className="bg-white/10 px-1 rounded text-white">F2</kbd> to save</span>
              <span>•</span>
              <span><kbd className="bg-white/10 px-1 rounded text-white">Esc</kbd> to close</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Formik
          initialValues={{
            bill_number: bill?.bill_number || "",
            bill_date: bill?.bill_date || new Date().toISOString().split('T')[0],
            due_date: bill?.due_date || "",
            warehouse: bill?.warehouse || "",
            vendor_name: bill?.vendor_name || "",
            vendor_address: bill?.vendor_address || "",
            vendor_gstin: bill?.vendor_gstin || "",
            gst_treatment: bill?.gst_treatment || "registered",
            journal: bill?.journal || "Purchase",
            total_amount: bill?.total_amount || "0.00",
            items: bill?.items?.map(item => ({
              product_name: item.product_detail?.name || item.product_name || "",
              product_id: item.product_detail?.id || item.product_id || null,
              quantity: item.quantity || 1,
              free_quantity: item.free_quantity || 0,
              unit: item.unit || "pcs",
              batch_number: item.batch_number || "",
              expiry_date: item.expiry_date || "",
              purchase_price: item.purchase_price || 0,
              discount: item.discount || 0,
              tax: item.tax || 0,
              hsn_code: item.hsn_code || "",
              tax_rate: item.tax_rate || 0,
              low_stock_alert: item.low_stock_alert || 10,
              amount: item.amount || 0,
              isExistingProduct: !!(item.product_detail?.id || item.product_id),
            })) || [{
              product_name: "",
              product_id: null,
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
                journal: values.journal,
                total_amount: Number(totalAmount.toFixed(2)),
                items: processedItems
              };
              
              if (isEdit) {
                await updatePurchaseBill(bill.id, purchaseData);
                toast.success("Purchase bill updated successfully!");
              } else {
                await createPurchaseBill(purchaseData);
                toast.success("Purchase bill created successfully!");
              }
              
              onClose();
            } catch (error) {
              console.error('Error saving purchase bill:', error);
              const details = error?.details;
              if (details && typeof details === 'object') {
                const firstField = Object.keys(details)[0];
                const firstMessage = Array.isArray(details[firstField]) ? details[firstField][0] : details[firstField];
                toast.error(`Error saving purchase bill: ${firstField} - ${firstMessage}`);
              } else {
                toast.error(`Error saving purchase bill: ${error.message}`);
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, isSubmitting, setFieldValue }) => {
            const grandTotal = values.items.reduce((sum, item) => {
                const quantity = Number(item.quantity) || 0;
                const price = Number(item.purchase_price) || 0;
                const discount = Number(item.discount) || 0;
                const tax = Number(item.tax) || 0;
                const discountAmount = ((quantity * price) * discount) / 100;
                const taxAmount = (((quantity * price) - discountAmount) * tax) / 100;
                return sum + ((quantity * price) - discountAmount + taxAmount);
            }, 0);

            return (
            <Form className="p-0">
              
              {/* Form Content */}
              <div className="p-8 space-y-8">
                
                {/* Bill Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="relative group">
                   <label className="block text-[10px] font-bold text-cyan-500/70 mb-2 uppercase tracking-widest">
                     Bill Number <span className="text-red-500">*</span>
                   </label>
                   <Field
                     name="bill_number"
                     placeholder="e.g. PUR/2024/001"
                     className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/10"
                   />
                   <ErrorMessage name="bill_number" component="div" className="text-red-500/80 text-[10px] mt-1.5 ml-1 font-medium italic" />
                </div>
                <div className="relative group">
                  <label className="block text-[10px] font-bold text-cyan-500/70 mb-2 uppercase tracking-widest">
                     Bill Date <span className="text-red-500">*</span>
                  </label>
                  <Field
                    name="bill_date"
                    type="date"
                    className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/10"
                  />
                  <ErrorMessage name="bill_date" component="div" className="text-red-500/80 text-[10px] mt-1.5 ml-1 font-medium italic" />
                </div>
                <div className="relative group">
                  <label className="block text-[10px] font-bold text-cyan-500/70 mb-2 uppercase tracking-widest">
                     Warehouse <span className="text-red-500">*</span>
                   </label>
                   <Field
                     name="warehouse"
                     as="select"
                     className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/10 appearance-none"
                   >
                     <option value="" className="bg-[#111]">Select Warehouse</option>
                     {warehouses?.map(w => (
                       <option key={w.id} value={w.id} className="bg-[#111]">{w.name}</option>
                     ))}
                   </Field>
                   <ErrorMessage name="warehouse" component="div" className="text-red-500/80 text-[10px] mt-1.5 ml-1 font-medium italic" />
                   <div className="absolute right-4 top-[38px] pointer-events-none text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                   </div>
                </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="relative group">
                    <label className="block text-[10px] font-bold text-cyan-500/70 mb-2 uppercase tracking-widest">
                       Journal <span className="text-red-500">*</span>
                    </label>
                    <Field
                       name="journal"
                       placeholder="Purchases"
                       className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/10"
                    />
                 </div>
                 <div className="relative group">
                    <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">
                       Due Date
                    </label>
                    <Field
                       name="due_date"
                       type="date"
                       className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/10"
                    />
                 </div>
               </div>

              {/* Vendor Info */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
                 <div className="md:col-span-2 relative group">
                    <label className="block text-[10px] font-bold text-cyan-500/70 mb-2 uppercase tracking-widest">
                       Vendor Name <span className="text-red-500">*</span>
                    </label>
                    <VendorAutocomplete values={values} setFieldValue={setFieldValue} vendors={vendors} />
                    <ErrorMessage name="vendor_name" component="div" className="text-red-500/80 text-[10px] mt-1.5 ml-1 font-medium italic" />
                 </div>
                 
                 <div className="relative group">
                    <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">
                       Vendor Address
                    </label>
                    <Field
                       name="vendor_address"
                       as="textarea"
                       rows="2"
                       placeholder="Full registered address of the vendor..."
                       className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/10 resize-none"
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                        <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">
                           Vendor GSTIN
                        </label>
                        <Field
                           name="vendor_gstin"
                           placeholder="29AAAAA0000A1Z5"
                           className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/10 uppercase"
                        />
                        <ErrorMessage name="vendor_gstin" component="div" className="text-red-500/80 text-[10px] mt-1.5 ml-1 font-medium italic" />
                    </div>
                    <div className="relative group">
                       <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">
                          GST Treatment
                       </label>
                       <div className="relative">
                        <Field
                            name="gst_treatment"
                            as="select"
                            className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/10 appearance-none"
                        >
                            <option value="" className="bg-[#111]">Select Treatment</option>
                            <option value="registered" className="bg-[#111]">Registered</option>
                            <option value="unregistered" className="bg-[#111]">Unregistered</option>
                            <option value="export" className="bg-[#111]">Export</option>
                            <option value="consumer" className="bg-[#111]">Consumer</option>
                        </Field>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </div>
                       </div>
                    </div>
                 </div>
               </div>
              </div> {/* End of p-8 space-y-8 div */}

              {/* Items Section */}
              <div className="p-8 bg-[#0a0a0a] border-y border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-cyan-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Invoice Items</h3>
                  </div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {values.items.length} {values.items.length === 1 ? 'Item' : 'Items'} Listed
                  </div>
                </div>
                
                <FieldArray name="items">
                  {({ push, remove }) => (
                    <div className="space-y-4">
                      
                      {/* Desktop Header */}
                      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 bg-white/5 border border-white/10 rounded-lg font-black text-[9px] text-gray-500 uppercase tracking-widest mb-2">
                        <div className="col-span-3">Product Description <span className="text-red-500">*</span></div>
                        <div className="col-span-2">Batch / Expiry</div>
                           <div className="col-span-1 text-center">Qty <span className="text-red-500">*</span></div>
                           <div className="col-span-1 text-center text-green-500/70">Free</div>
                           <div className="col-span-1">Unit <span className="text-red-500">*</span></div>
                           <div className="col-span-1 text-right">Price <span className="text-red-500">*</span></div>
                           <div className="col-span-1 text-center">Tax (%)</div>
                           <div className="col-span-1 text-right">Total</div>
                           <div className="col-span-1"></div>
                        </div>

                        {values.items.map((item, idx) => (
                          <PurchaseItemRow
                             key={idx}
                             item={item}
                             idx={idx}
                             values={values}
                             setFieldValue={setFieldValue}
                             remove={remove}
                             units={units}
                             products={products}
                          />
                        ))}
                        
                        <div className="pt-2">
                            <button
                            type="button"
                            onClick={() => push({
                                product_name: "",
                                product_id: null,
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
                            className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider"
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Add New Line
                            </button>
                        </div>
                     </div>
                   )}
                 </FieldArray>
              </div>

               {/* Totals & Footer */}
               <div className="p-8 bg-[#111] border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div className="hidden md:block">
                        <div className="p-4 rounded-xl border border-white/5 bg-white/2 text-[10px] text-gray-500 space-y-2 max-w-sm">
                            <p className="font-bold text-gray-400 uppercase tracking-widest">Notes & Terms</p>
                            <p>Items will be added to selected warehouse stock immediately upon save. New products will be created automatically if not found in master.</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-6 py-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Payable Amount</span>
                            <span className="text-3xl font-black text-white tabular-nums drop-shadow-md">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-4 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-10 py-3.5 bg-white text-black rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-xl shadow-white/5 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                        Processing...
                                    </span>
                                ) : (isEdit ? "Update Bill" : "Finalize Bill")}
                            </button>
                        </div>
                    </div>
                </div>
               </div>

            </Form>
          )} }
        </Formik>
      </div>
    </div>,
    document.body
  );
}

function PurchaseItemRow({ item, idx, values, setFieldValue, remove, units, products }) {
  const quantity = Number(item.quantity) || 0;
  const price = Number(item.purchase_price) || 0;
  const discount = Number(item.discount) || 0;
  const tax = Number(item.tax) || 0;

  const discountAmount = ((quantity * price) * discount) / 100;
  const taxAmount = (((quantity * price) - discountAmount) * tax) / 100;
  const calculatedAmount = ((quantity * price) - discountAmount) + taxAmount;

  return (
     <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-[#0a0a0a] border border-white/5 rounded-xl p-4 transition-all hover:bg-white/[0.02] hover:border-white/10 group">
      
      {/* Product (3 cols) */}
      <div className="md:col-span-3">
         <label className="block text-[9px] font-black text-gray-600 mb-1.5 md:hidden uppercase tracking-widest">Product</label>
         <ProductAutocomplete idx={idx} values={values} setFieldValue={setFieldValue} products={products} />
         <div className="flex gap-2 mt-2">
            <Field name={`items.${idx}.hsn_code`}>
                {({ field }) => (
                    <input 
                        {...field} 
                        placeholder="HSN CODE" 
                        className="w-1/2 bg-white/2 border border-white/5 rounded-md px-2 py-1.5 text-gray-500 text-[9px] font-bold focus:border-cyan-500/50 outline-none uppercase" 
                    />
                )}
            </Field>
            <div className="w-1/2 flex items-center justify-center bg-white/2 border border-white/5 rounded-md text-[9px] font-bold text-gray-600">
               {item.isExistingProduct ? "Master Sync" : "New Entry"}
            </div>
         </div>
      </div>

      {/* Batch Info (2 cols) */}
      <div className="md:col-span-2 space-y-2">
          <div className="relative">
            <label className="block text-[9px] font-black text-gray-600 mb-1.5 md:hidden uppercase tracking-widest">Batch</label>
            <Field name={`items.${idx}.batch_number`}>
              {({ field }) => (
                <input {...field} placeholder="BATCH NO" className="w-full bg-white/2 border border-white/5 rounded-lg px-3 py-2 text-white text-[10px] font-bold focus:border-cyan-500/50 outline-none" />
              )}
            </Field>
          </div>
          <div className="relative">
             <label className="block text-[9px] font-black text-gray-600 mb-1.5 md:hidden uppercase tracking-widest">Expiry</label>
             <Field name={`items.${idx}.expiry_date`}>
               {({ field }) => (
                 <input {...field} type="date" className="w-full bg-white/2 border border-white/5 rounded-lg px-3 py-2 text-white text-[10px] font-bold focus:border-cyan-500/50 outline-none" />
               )}
             </Field>
          </div>
      </div>

      {/* Qty (1 col) */}
      <div className="md:col-span-1">
         <label className="block text-[9px] font-black text-gray-600 mb-1.5 md:hidden uppercase tracking-widest">Qty</label>
         <Field
             name={`items.${idx}.quantity`}
             type="number"
             min="1"
             className="w-full bg-white/2 border border-white/10 rounded-lg px-2 py-2 text-center text-white font-black focus:ring-1 focus:ring-cyan-500 outline-none text-[11px] tabular-nums"
         />
      </div>

      {/* Free (1 col) */}
      <div className="md:col-span-1">
          <label className="block text-[9px] font-black text-green-600/70 mb-1.5 md:hidden uppercase tracking-widest">Free</label>
          <Field
              name={`items.${idx}.free_quantity`}
              type="number"
              min="0"
              placeholder="0"
              className="w-full bg-green-500/5 border border-green-500/20 rounded-lg px-2 py-2 text-center text-green-500 font-bold focus:ring-1 focus:ring-green-500 outline-none text-[11px] tabular-nums"
          />
      </div>

      {/* Unit (1 col) */}
      <div className="md:col-span-1">
          <label className="block text-[9px] font-black text-gray-600 mb-1.5 md:hidden uppercase tracking-widest">Unit</label>
          <Field name={`items.${idx}.unit`}>
              {({ field }) => (
              <select {...field} className="w-full bg-white/2 border border-white/10 rounded-lg px-2 py-2 text-white font-bold focus:ring-1 focus:ring-cyan-500 outline-none text-[10px] uppercase">
                  {units.map(u => <option key={u} value={u} className="bg-[#111]">{u}</option>)}
              </select>
              )}
          </Field>
      </div>

      {/* Price (1 col) */}
      <div className="md:col-span-1">
          <label className="block text-[9px] font-black text-gray-600 mb-1.5 md:hidden uppercase tracking-widest">Price</label>
          <Field
              name={`items.${idx}.purchase_price`}
              type="number"
              min="0"
              step="0.01"
              className="w-full bg-white/2 border border-white/10 rounded-lg px-2 py-2 text-right text-white font-black focus:ring-1 focus:ring-cyan-500 outline-none text-[11px] tabular-nums"
          />
      </div>

      {/* Tax/Disc (1 col) */}
      <div className="md:col-span-1 space-y-1">
         <div className="flex items-center gap-1">
             <label className="text-[8px] font-bold text-gray-500 w-6 uppercase">Disc</label>
             <Field name={`items.${idx}.discount`} type="number" className="w-full bg-white/2 border border-white/5 rounded px-1 py-1 text-center text-gray-400 text-[10px] font-bold focus:border-cyan-500/50 outline-none" placeholder="0" />
         </div>
         <div className="flex items-center gap-1">
             <label className="text-[8px] font-bold text-gray-500 w-6 uppercase">Tax</label>
             <Field name={`items.${idx}.tax`} type="number" className="w-full bg-white/2 border border-white/5 rounded px-1 py-1 text-center text-gray-400 text-[10px] font-bold focus:border-cyan-500/50 outline-none" placeholder="0" />
         </div>
      </div>

      {/* Amount (1 col) */}
      <div className="md:col-span-1">
          <label className="block text-[9px] font-black text-gray-600 mb-1.5 md:hidden uppercase tracking-widest">Total</label>
          <div className="w-full px-2 py-2 text-right font-black text-cyan-400 text-[11px] tabular-nums">
              {calculatedAmount.toFixed(2)}
          </div>
      </div>

      {/* Remove (1 col) */}
      <div className="md:col-span-1 flex justify-center pt-1">
          <button
              type="button"
              onClick={() => remove(idx)}
              disabled={values.items.length === 1}
              className="text-gray-600 hover:text-red-500 transition-all p-2 disabled:opacity-10 hover:bg-red-500/5 rounded-lg active:scale-90"
              title="Remove Item"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
          </button>
      </div>
      </div>

    </div>
  );
}