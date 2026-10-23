import React, { useEffect, useRef, useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createPurchaseOrder, updatePurchaseOrder } from "../../api/purchase_orders";
import { getProducts } from "../../api/purchase";
import { getVendors } from "../../api/vendors";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

// Product Autocomplete Component (Reused logic)
function ProductAutocomplete({ idx, values, setFieldValue, onInputChange, products, showManufacturer = true }) {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(values.items[idx]?.product || "");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const descRef = useRef(null);
  const descValue = values.items[idx]?.description ?? values.items[idx]?.product_description ?? "";
  const hasDescription = Boolean(String(descValue).trim());
  const [descExpanded, setDescExpanded] = useState(hasDescription);
  const [focusDesc, setFocusDesc] = useState(false);

  useEffect(() => {
    if (hasDescription) setDescExpanded(true);
  }, [hasDescription]);

  useEffect(() => {
    if (focusDesc && descExpanded && descRef.current) {
      descRef.current.focus();
      setFocusDesc(false);
    }
  }, [focusDesc, descExpanded]);

  useEffect(() => {
    setInputValue(values.items[idx]?.product || "");
  }, [values.items[idx]?.product]);

  const selectProduct = (product) => {
    setFieldValue(`items.${idx}.product`, product.name);
    setFieldValue(`items.${idx}.product_id`, product.id);
    setFieldValue(`items.${idx}.manufacturer`, product.manufacturer || "");
    setFieldValue(`items.${idx}.unit`, product.unit || 'pcs');
    setFieldValue(`items.${idx}.price`, product.purchase_price ?? product.price ?? 0);
    setFieldValue(`items.${idx}.tax`, product.tax ?? 0);
    setFieldValue(`items.${idx}.description`, product.description || "");
    setFieldValue(`items.${idx}.product_description`, product.description || "");
    const quantity = values.items[idx]?.quantity || 1;
    const price = product.purchase_price ?? product.price ?? 0;
    const tax = Number(product.tax ?? 0);
    const taxable = quantity * price;
    const amount = taxable + (taxable * tax) / 100;
    setFieldValue(`items.${idx}.amount`, amount);
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
    setFieldValue(`items.${idx}.description`, "");
    setFieldValue(`items.${idx}.product_description`, "");
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
            <div className="relative">
              <input
                {...field}
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Product name"
                className={`w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none transition-all text-sm ${!descExpanded && !hasDescription ? "!pr-7" : ""}`}
                autoComplete="off"
              />
              {!descExpanded && !hasDescription && (
                <button
                  type="button"
                  tabIndex={-1}
                  title="Add note"
                  aria-label="Add note"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setDescExpanded(true);
                    setFocusDesc(true);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-sm leading-none px-1"
                >
                  +
                </button>
              )}
            </div>
            {(descExpanded || hasDescription) && (
              <textarea
                ref={descRef}
                rows={1}
                value={descValue}
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
                onBlur={(e) => {
                  if (!e.target.value.trim()) setDescExpanded(false);
                }}
                placeholder="Enter a description / note..."
                className="w-full bg-transparent border-0 border-b border-transparent hover:border-[var(--border-subtle)] focus:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] rounded px-1.5 py-0.5 text-[var(--text-muted)] placeholder-[var(--text-muted)] outline-none transition-all text-xs leading-relaxed resize-none italic mt-1"
              />
            )}
            {meta.touched && meta.error && (
              <div className="text-[var(--text-primary)] text-xs mt-1">{meta.error}</div>
            )}
            {showManufacturer && (values.items[idx]?.manufacturer || values.items[idx]?.product_detail?.manufacturer) && (
              <div className="text-xs text-[var(--text-muted)] font-medium italic mt-0.5 tracking-wide">
                ({values.items[idx]?.manufacturer || values.items[idx]?.product_detail?.manufacturer})
              </div>
            )}
          </div>
        )}
      </Field>
      {showDropdown && (
        <div className="absolute z-50 mt-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl w-full max-h-60 overflow-y-auto backdrop-blur-xl">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className={`px-4 py-3 cursor-pointer text-sm border-b border-[var(--border-subtle)] last:border-0 transition-colors ${
                index === selectedIndex 
                  ? 'bg-[var(--bg-primary)] text-[var(--accent-primary)] font-bold' 
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
              }`}
              onClick={() => selectProduct(product)}
            >
              <div className="font-medium">{product.name}</div>
              <div className="text-[var(--text-muted)] text-xs mt-0.5">
                Unit: {product.unit} | Price: {getCurrencySymbol()}{product.purchase_price ?? product.price}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Vendor Autocomplete Component
function VendorAutocomplete({ values, setFieldValue, vendors }) {
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(values.vendor_name || "");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    setInputValue(values.vendor_name || "");
  }, [values.vendor_name]);

  const selectVendor = (vendor) => {
    setFieldValue('vendor_name', vendor.name);
    setFieldValue('vendor_id', vendor.id);
    setInputValue(vendor.name);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFieldValue('vendor_name', value);
    setFieldValue('vendor_id', null);
    setSelectedIndex(-1);

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
              name="vendor_name"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onFocus={() => {
                if (inputValue.trim()) {
                  setShowDropdown(true);
                }
              }}
              placeholder="Vendor name"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none transition-all"
            />
            {meta.touched && meta.error && (
              <div className="text-[var(--text-primary)] text-sm mt-1">{meta.error}</div>
            )}
          </div>
        )}
      </Field>
      {showDropdown && (
        <div className="absolute z-50 mt-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl w-full max-h-60 overflow-y-auto backdrop-blur-xl">
          {filteredVendors.slice(0, 50).map((vendor, index) => (
            <div
              key={vendor.id}
              className={`px-4 py-3 cursor-pointer text-sm border-b border-[var(--border-subtle)] last:border-0 transition-colors ${
                index === selectedIndex
                  ? 'bg-[var(--bg-primary)] text-[var(--accent-primary)] font-bold' 
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
              }`}
              onClick={() => selectVendor(vendor)}
            >
              <div className="font-medium">{vendor.name}</div>
              <div className="text-[var(--text-muted)] text-xs mt-0.5">
                {vendor.email && `${vendor.email} | `}
                {vendor.address} {vendor.gstin && `| GSTIN: ${vendor.gstin}`}
              </div>
            </div>
          ))}
          {filteredVendors.length === 0 && (
            <div className="px-4 py-2 text-xs text-[var(--text-muted)] text-center italic border-t border-[var(--border-subtle)]">
              No matching vendors found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PurchaseOrderSchema = Yup.object().shape({
  vendor_name: Yup.string().required("Vendor name is required"),
  po_number: Yup.string(),
  expected_date: Yup.string().required("Expected date is required"),
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

export default function PurchaseOrderForm({ isOpen, onClose, editData }) {
  const queryClient = useQueryClient();
  const isEdit = !!editData;
  const submitLockRef = useRef(false);
  const [showManufacturer, setShowManufacturer] = useState(true);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  
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

  const createMutation = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      toast.success("Purchase Order created successfully!");
      onClose();
    },
    onError: (error) => {
      console.error("Create PO Error:", error.response?.data || error);
      const errors = error.response?.data?.errors;
      const errorMsg = errors ? JSON.stringify(errors) : error.message;
      toast.error(errorMsg || "Failed to create purchase order");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePurchaseOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      toast.success("Purchase Order updated successfully!");
      onClose();
    },
    onError: (error) => {
      console.error("Update PO Error:", error.response?.data || error);
      const errors = error.response?.data?.errors;
      const errorMsg = errors ? JSON.stringify(errors) : error.message;
      toast.error(errorMsg || "Failed to update purchase order");
    },
  });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-7xl max-h-[95vh] overflow-y-auto bento-card !p-0 shadow-2xl animate-fade-up border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex justify-between items-center p-8 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
              {isEdit ? "Edit Purchase Order" : "New Purchase Order"}
            </h2>
             <p className="text-xs text-[var(--text-muted)]">
               Create a new purchase order for a vendor.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors">
           <span className="text-2xl">×</span>
          </button>
        </div>
        
        <Formik
          initialValues={{
            vendor_id: editData?.vendor?.id || editData?.vendor || null,
            vendor_name: editData?.vendor_display_name || editData?.vendor_name || "",
            po_number: editData?.po_number || "",
            expected_date: editData?.expected_date || new Date().toLocaleDateString('sv-SE'),
            notes: editData?.notes || "",
            
            items: editData?.items?.map(item => ({
              id: item.id,
              source_item_id: item.source_item_id || null,
              product: item.product_display_name || item.product_name || item.product || "",
              product_id: item.product || null,
              manufacturer: item.manufacturer || item.product_detail?.manufacturer || "",
              description: item.description || item.product_description || "",
              product_description: item.description || item.product_description || "",
              quantity: item.quantity || 1,
              price: item.price || 0,
              tax: item.tax ?? 0,
              amount: item.amount || (item.quantity * item.price) || 0,
              unit: item.unit || "pcs",
              isExistingProduct: !!(item.product),
            })) || [{
              product: "",
              product_id: null,
              manufacturer: "",
              description: "",
              product_description: "",
              quantity: 1,
              price: 0,
              tax: 0,
              amount: 0,
              unit: "pcs",
              isExistingProduct: false,
            }]
          }}
          validationSchema={PurchaseOrderSchema}
          onSubmit={async (values, { setSubmitting }) => {
            if (submitLockRef.current || createMutation.isPending || updateMutation.isPending) {
              return;
            }
            submitLockRef.current = true;
            try {
               const processedItems = values.items.map(item => {
                  const qty = Math.max(1, Number(item.quantity) || 1);
                  const price = Number(item.price) || 0;
                  const tax = Number(item.tax) || 0;
                  const taxable = qty * price;
                  const amount = Number((taxable + (taxable * tax) / 100).toFixed(2));
                  return {
                  ...(item.id ? { id: item.id } : {}),
                  ...(item.source_item_id ? { source_item_id: item.source_item_id } : {}),
                  product: item.product_id, // PrimaryKeyRelatedField expects ID
                  product_name: item.product,
                  description: (item.description || item.product_description || "").trim(),
                  product_description: (item.description || item.product_description || "").trim(),
                  quantity: qty,
                  price: price,
                  amount: amount,
                  unit: item.unit,
                  discount: 0,
                  tax: tax,
               };
               });
               
               const totalAmount = processedItems.reduce((sum, item) => sum + item.amount, 0);

               const formData = {
                   vendor_name: values.vendor_name,
                   vendor_id: values.vendor_id,
                   po_number: values.po_number,
                   expected_date: values.expected_date,
                   total_amount: totalAmount,
                   notes: values.notes,
                   items: processedItems
               };

               if (isEdit) {
                 await updateMutation.mutateAsync({ id: editData.id, data: formData });
               } else {
                 await createMutation.mutateAsync(formData);
               }
            } catch (error) {
               console.error(error);
            } finally {
               submitLockRef.current = false;
               setSubmitting(false);
            }
          }}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="p-0">
                <div className="p-8 space-y-8">
                     {/* Header */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                           <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase">Vendor *</label>
                           <VendorAutocomplete values={values} setFieldValue={setFieldValue} vendors={vendors} />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase">PO Number</label>
                           <Field name="po_number" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]" />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase">Expected Date</label>
                           <Field name="expected_date" type="date" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]" />
                        </div>
                   </div>

                   {/* Items Header */}
                   <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                     <h3 className="text-base font-bold text-[var(--text-primary)]">Order Items</h3>
                     <div className="relative">
                       <button
                         type="button"
                         onClick={() => setShowColumnPicker((prev) => !prev)}
                         className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                       >
                         Columns
                       </button>

                       {showColumnPicker && (
                         <div className="absolute right-0 top-10 z-20 w-48 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-2xl">
                           <div className="mb-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">Show/Hide Columns</div>
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
                   </div>

                   {/* Items */}
                   <FieldArray name="items">
                    {({ push, remove }) => (
                        <div className="space-y-4">
                            {values.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 items-end bg-[var(--bg-primary)] py-2 rounded-xl border border-[var(--border-subtle)] [&>div]:border-r [&>div]:border-[var(--border-subtle)] [&>div:last-child]:border-r-0 [&>div]:px-2">
                                    <div className="col-span-4">
                                        <label className="block text-xs text-[var(--text-muted)] mb-1 text-center">Product</label>
                                        <ProductAutocomplete idx={index} values={values} setFieldValue={setFieldValue} products={products} showManufacturer={showManufacturer} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs text-[var(--text-muted)] mb-1 text-center">Qty</label>
                                        <Field name={`items.${index}.quantity`} type="number" min="1" className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-center text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]" 
                                            onChange={e => {
                                            const qty = Math.max(1, Number(e.target.value) || 1);
                                            const price = Number(values.items[index].price || 0);
                                            const tax = Number(values.items[index].tax || 0);
                                            const taxable = qty * price;
                                                setFieldValue(`items.${index}.quantity`, qty);
                                                setFieldValue(`items.${index}.amount`, taxable + (taxable * tax) / 100);
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs text-[var(--text-muted)] mb-1 text-center">Price</label>
                                        <Field name={`items.${index}.price`} type="number" className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-center text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                                            onChange={e => {
                                                const price = Number(e.target.value) || 0;
                                                const qty = Number(values.items[index].quantity || 0);
                                                const tax = Number(values.items[index].tax || 0);
                                                const taxable = qty * price;
                                                setFieldValue(`items.${index}.price`, price);
                                                setFieldValue(`items.${index}.amount`, taxable + (taxable * tax) / 100);
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs text-[var(--text-muted)] mb-1 text-center">GST %</label>
                                        <Field name={`items.${index}.tax`} type="number" min="0" className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-center text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                                            onChange={e => {
                                                const tax = Number(e.target.value) || 0;
                                                const qty = Number(values.items[index].quantity || 0);
                                                const price = Number(values.items[index].price || 0);
                                                const taxable = qty * price;
                                                setFieldValue(`items.${index}.tax`, tax);
                                                setFieldValue(`items.${index}.amount`, taxable + (taxable * tax) / 100);
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs text-[var(--text-muted)] mb-1 text-right">Amount</label>
                                        <div className="px-3 py-2 text-right text-[var(--text-primary)] font-mono bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg">
                                            {Number(values.items[index].amount || 0).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <button type="button" onClick={() => remove(index)} className="btn-secondary text-xs px-3 py-2 rounded-lg transition-colors">
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={() => push({ product: "", product_id: null, manufacturer: "", description: "", product_description: "", quantity: 1, price: 0, tax: 0, amount: 0, unit: "pcs", isExistingProduct: false })} className="text-[var(--accent-primary)] hover:underline text-sm font-medium mt-2">
                                + Add Item
                            </button>
                        </div>
                    )}
                   </FieldArray>

                   <div className="pt-4 border-t border-[var(--border-subtle)]">
                     <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase">Notes</label>
                     <Field name="notes" as="textarea" rows="2" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]" placeholder="Optional notes for this purchase order..." />
                   </div>

                   {/* Footer Actions */}
                   <div className="flex justify-between items-center pt-6 border-t border-[var(--border-subtle)]">
                        <div className="text-xl font-bold text-[var(--text-primary)]">
                          Total: {getCurrencySymbol()}{values.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toFixed(2)}
                        </div>
                        <button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending} className="btn-primary px-8 py-3 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50">
                          {(isSubmitting || createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Purchase Order"}
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
