import React, { useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createPurchaseBill, updatePurchaseBill, getProducts } from "../../api/purchase";
import { getVendors } from "../../api/vendors";
import { createPortal } from "react-dom";
import { getWarehouses } from "../../api/inventory";
import { toast } from "react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
              className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/20 text-xs font-bold"
              autoComplete="off"
            />
          </div>
        )}
      </Field>
      {showDropdown && (
        <div className="absolute z-10 bg-[#1a1a1a] border border-white/10 rounded-md shadow-lg w-full max-h-40 overflow-y-auto mt-1">
          {filteredProducts.map(product => (
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
              className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/20 text-xs font-bold"
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

const units = ["pcs", "kg", "ltr", "box", "meter"];

export default function PurchaseForm({ bill, onClose, onSubmit }) {
  const queryClient = useQueryClient();
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
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative flex flex-col w-full h-full sm:h-[96vh] sm:max-h-[1200px] sm:max-w-[1600px] sm:w-[96vw] sm:rounded-[24px] shadow-2xl shadow-black/50 animate-fade-up sm:border border-white/10 bg-[#0c0c0e] overflow-hidden">
        
        {/* Header */}
        <div className="flex-none flex justify-between items-center p-6 sm:px-8 sm:py-6 border-b border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl z-40">
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
            bill_date: bill?.bill_date || new Date().toLocaleDateString('sv-SE'),
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
              
              queryClient.invalidateQueries({ queryKey: ["purchaseBills"] });
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
            <Form className="flex flex-col flex-1 overflow-hidden">
              
              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-0">
                <div className="p-6 sm:p-8 space-y-8">
                
                {/* Bill & Vendor Details Card */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-8 space-y-8">
                  {/* Bill Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="relative group">
                      <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest group-focus-within:text-cyan-500 transition-colors">
                        Bill Number <span className="text-red-500">*</span>
                      </label>
                      <Field
                        name="bill_number"
                        placeholder="e.g. PUR/2024/001"
                        className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/20"
                      />
                      <ErrorMessage name="bill_number" component="div" className="text-red-400 text-[10px] mt-1.5 ml-1 font-medium" />
                    </div>
                    
                    <div className="relative group">
                      <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest group-focus-within:text-cyan-500 transition-colors">
                        Bill Date <span className="text-red-500">*</span>
                      </label>
                      <Field
                        name="bill_date"
                        type="date"
                        className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/20 [color-scheme:dark]"
                      />
                    </div>

                    <div className="relative group">
                      <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest group-focus-within:text-cyan-500 transition-colors">
                        Warehouse
                      </label>
                      <div className="relative">
                        <Field
                          name="warehouse"
                          as="select"
                          className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/20 appearance-none"
                        >
                          <option value="" className="bg-[#111]">Direct to Stock</option>
                          {warehouses?.map(w => (
                            <option key={w.id} value={w.id} className="bg-[#111]">{w.name}</option>
                          ))}
                        </Field>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="relative group">
                      <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest group-focus-within:text-cyan-500 transition-colors">
                        Due Date
                      </label>
                      <Field
                        name="due_date"
                        type="date"
                        className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/20 [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  {/* Vendor Info Section */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-8 border-t border-white/5">
                    <div className="md:col-span-4 space-y-6">
                      <div className="relative group">
                        <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest group-focus-within:text-cyan-500 transition-colors">
                          Vendor Name <span className="text-red-500">*</span>
                        </label>
                        <VendorAutocomplete values={values} setFieldValue={setFieldValue} vendors={vendors} />
                        <ErrorMessage name="vendor_name" component="div" className="text-red-400 text-[10px] mt-1.5 ml-1 font-medium" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative group">
                          <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest group-focus-within:text-cyan-500 transition-colors">
                            GSTIN
                          </label>
                          <Field
                            name="vendor_gstin"
                            placeholder="29AAAAA0000A1Z5"
                            className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/20 uppercase text-xs"
                          />
                        </div>
                        <div className="relative group">
                          <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest group-focus-within:text-cyan-500 transition-colors">
                            Journal
                          </label>
                          <Field
                            name="journal"
                            className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/20 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-8 flex flex-col">
                      <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">
                        Vendor Address & Treatment
                      </label>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                          name="vendor_address"
                          as="textarea"
                          placeholder="Registered office address..."
                          className="w-full h-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/20 resize-none text-xs"
                        />
                        <div className="space-y-4">
                           <div className="relative group">
                              <label className="block text-[8px] font-black text-gray-600 mb-1 uppercase">GST Treatment</label>
                              <Field
                                name="gst_treatment"
                                as="select"
                                className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all hover:border-white/20 appearance-none text-xs"
                              >
                                <option value="registered">Registered Business</option>
                                <option value="unregistered">Unregistered Business</option>
                                <option value="consumer">Consumer</option>
                                <option value="overseas">Overseas</option>
                              </Field>
                           </div>
                           <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-[10px] text-cyan-500/70 leading-relaxed italic">
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
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Itemized Bill</h3>
                    <div className="h-px w-20 bg-gradient-to-r from-white/20 to-transparent"></div>
                  </div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {values.items.length} {values.items.length === 1 ? 'Item' : 'Items'} Listed
                  </div>
                </div>

                <FieldArray name="items">
                  {({ push, remove }) => (
                    <div className="space-y-4">
                      
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-black text-[9px] text-gray-500 uppercase tracking-widest mb-3">
                            <div className="col-span-3">Product / HSN</div>
                            <div className="col-span-2">Batch Details</div>
                            <div className="col-span-1 text-center">Quantity</div>
                            <div className="col-span-1 text-center text-green-500/70">Free</div>
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
                             units={units}
                             products={products}
                           />
                        ))}

                         <div className="pt-6">
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
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest"
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-cyan-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Add New Line Item
                            </button>
                         </div>
                     </div>
                   )}
                 </FieldArray>

                {/* Totals Section */}
                <div className="flex justify-end pt-8">
                  <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 font-medium">Subtotal</span>
                        <span className="text-white font-black tabular-nums tracking-tight">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="h-px bg-white/5"></div>
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Payable Amount</span>
                          <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter">Net Total (Inclusive of all taxes)</span>
                        </div>
                        <span className="text-3xl font-black text-white tabular-nums drop-shadow-md">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex-none p-6 sm:p-8 bg-[#0c0c0e]/95 backdrop-blur-xl border-t border-white/5 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-4 rounded-b-[24px] items-center z-40 relative">
                <div className="flex-1 text-gray-500 text-[10px] font-medium uppercase tracking-[0.1em] hidden sm:block">
                  All changes are saved locally until finalized.
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-4 sm:py-3 bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all font-bold text-xs uppercase tracking-widest text-center"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-10 py-4 bg-white text-black rounded-xl text-xs font-black uppercase tracking-[0.15em] hover:bg-cyan-500 transition-all shadow-xl shadow-cyan-500/10 active:scale-95 disabled:opacity-50 min-w-[180px] text-center flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (isEdit ? "Update Bill" : "Finalize Bill")}
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

function PurchaseItemRow({ item, idx, values, setFieldValue, remove, units, products }) {
  const quantity = Number(item.quantity) || 0;
  const price = Number(item.purchase_price) || 0;
  const discount = Number(item.discount) || 0;
  const tax = Number(item.tax) || 0;

  const discountAmount = ((quantity * price) * discount) / 100;
  const taxAmount = (((quantity * price) - discountAmount) * tax) / 100;
  const calculatedAmount = ((quantity * price) - discountAmount) + taxAmount;

  return (
     <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-white/[0.01] border border-white/5 rounded-[20px] p-5 transition-all hover:bg-white/[0.03] hover:border-white/10 group mb-3 shadow-sm">
      
      {/* Product & HSN (3 cols) */}
      <div className="md:col-span-3 space-y-2.5">
         <div className="relative">
            <label className="block text-[9px] font-black text-gray-600 mb-1.5 md:hidden uppercase tracking-widest">Product</label>
            <ProductAutocomplete idx={idx} values={values} setFieldValue={setFieldValue} products={products} />
         </div>
         <div className="flex items-center gap-2">
            <Field name={`items.${idx}.hsn_code`}>
                {({ field }) => (
                    <input 
                        {...field} 
                        placeholder="HSN/SAC CODE" 
                        className="flex-1 bg-black/20 border border-white/5 rounded-lg px-3 py-1.5 text-gray-500 text-[9px] font-bold focus:border-cyan-500/50 outline-none uppercase tracking-wider" 
                    />
                )}
            </Field>
            <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter border ${item.isExistingProduct ? "bg-cyan-500/5 border-cyan-500/10 text-cyan-500/50" : "bg-purple-500/5 border-purple-500/10 text-purple-500/50"}`}>
               {item.isExistingProduct ? "Master" : "New"}
            </div>
         </div>
      </div>

      {/* Batch & Expiry (2 cols) */}
      <div className="md:col-span-2 flex flex-col gap-2">
          <div className="relative">
            <label className="block text-[9px] font-black text-gray-600 mb-1.5 md:hidden uppercase tracking-widest">Batch Number</label>
            <Field name={`items.${idx}.batch_number`}>
              {({ field }) => (
                <input {...field} placeholder="BATCH NO" className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-3 py-2 text-white text-[10px] font-bold focus:border-cyan-500/50 outline-none placeholder:text-gray-700" />
              )}
            </Field>
          </div>
          <div className="relative">
             <label className="block text-[9px] font-black text-gray-600 mb-1.5 md:hidden uppercase tracking-widest">Expiry Date</label>
             <Field name={`items.${idx}.expiry_date`}>
               {({ field }) => (
                 <input {...field} type="date" className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-3 py-1.5 text-white text-[10px] font-bold focus:border-cyan-500/50 outline-none [color-scheme:dark]" />
               )}
             </Field>
          </div>
      </div>

      {/* Qty, Free, Unit (3 cols) */}
      <div className="md:col-span-3 grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
             <label className="block text-[9px] font-black text-gray-600 md:hidden uppercase tracking-widest">Qty</label>
             <Field
                 name={`items.${idx}.quantity`}
                 type="number"
                 min="1"
                 className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-1 py-3 text-center text-white font-black focus:ring-1 focus:ring-cyan-500 outline-none text-xs tabular-nums"
             />
          </div>
          <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-green-600/70 md:hidden uppercase tracking-widest">Free</label>
              <Field
                  name={`items.${idx}.free_quantity`}
                  type="number"
                  min="0"
                  placeholder="0"
                  className="w-full bg-green-500/5 border border-green-500/10 rounded-xl px-1 py-3 text-center text-green-500/70 font-bold focus:ring-1 focus:ring-green-500 outline-none text-xs tabular-nums"
              />
          </div>
          <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-gray-600 md:hidden uppercase tracking-widest">Unit</label>
              <Field name={`items.${idx}.unit`}>
                  {({ field }) => (
                  <select {...field} className="w-full h-[42px] bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-1 text-white font-bold focus:ring-1 focus:ring-cyan-500 outline-none text-[10px] uppercase appearance-none text-center">
                      {units.map(u => <option key={u} value={u} className="bg-[#111]">{u}</option>)}
                  </select>
                  )}
              </Field>
          </div>
      </div>

      {/* Price, Disc, Tax (3 cols) */}
      <div className="md:col-span-3 grid grid-cols-12 gap-2">
          <div className="col-span-6 space-y-1.5">
              <label className="block text-[9px] font-black text-gray-600 md:hidden uppercase tracking-widest">Unit Price</label>
              <Field
                  name={`items.${idx}.purchase_price`}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-3 py-3 text-right text-white font-black focus:ring-1 focus:ring-cyan-500 outline-none text-xs tabular-nums"
              />
          </div>
          <div className="col-span-3 space-y-1.5">
              <label className="block text-[9px] font-black text-gray-600 md:hidden uppercase tracking-widest">Disc%</label>
              <Field name={`items.${idx}.discount`} type="number" className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-1 py-3 text-center text-gray-400 text-[10px] font-bold focus:border-cyan-500/50 outline-none" placeholder="0" />
          </div>
          <div className="col-span-3 space-y-1.5">
              <label className="block text-[9px] font-black text-gray-600 md:hidden uppercase tracking-widest">Tax%</label>
              <Field name={`items.${idx}.tax`} type="number" className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-1 py-3 text-center text-gray-400 text-[10px] font-bold focus:border-cyan-500/50 outline-none" placeholder="0" />
          </div>
      </div>

      {/* Amount & Actions (1 col) */}
      <div className="md:col-span-1 flex flex-col items-end gap-2">
          <div className="text-right">
              <label className="block text-[9px] font-black text-gray-700 md:hidden uppercase tracking-widest mb-1">Subtotal</label>
              <div className="font-black text-cyan-400 text-sm tabular-nums tracking-tighter">
                  ₹{calculatedAmount.toFixed(2)}
              </div>
          </div>
          <button
              type="button"
              onClick={() => remove(idx)}
              disabled={values.items.length === 1}
              className="text-gray-800 hover:text-red-500 transition-all p-2 disabled:opacity-0 hover:bg-red-500/5 rounded-lg active:scale-90"
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
