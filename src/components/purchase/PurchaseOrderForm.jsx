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
function ProductAutocomplete({ idx, values, setFieldValue, onInputChange, products }) {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(values.items[idx]?.product || "");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const selectProduct = (product) => {
    setFieldValue(`items.${idx}.product`, product.name);
    setFieldValue(`items.${idx}.product_id`, product.id);
    setFieldValue(`items.${idx}.unit`, product.unit || 'pcs');
    setFieldValue(`items.${idx}.price`, product.purchase_price ?? product.price ?? 0);
    const quantity = values.items[idx]?.quantity || 1;
    const amount = quantity * (product.purchase_price ?? product.price ?? 0);
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
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all text-sm"
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
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className={`px-4 py-3 cursor-pointer text-sm border-b border-white/5 last:border-0 transition-colors ${
                index === selectedIndex 
                  ? 'bg-cyan-500/20 text-white' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => selectProduct(product)}
            >
              <div className="font-medium">{product.name}</div>
              <div className="text-gray-500 text-xs mt-0.5">
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
          {filteredVendors.slice(0, 50).map((vendor, index) => (
            <div
              key={vendor.id}
              className={`px-4 py-3 cursor-pointer text-sm border-b border-white/5 last:border-0 transition-colors ${
                index === selectedIndex
                  ? 'bg-cyan-500/20 text-white' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => selectVendor(vendor)}
            >
              <div className="font-medium">{vendor.name}</div>
              <div className="text-gray-500 text-xs mt-0.5">
                {vendor.email && `${vendor.email} | `}
                {vendor.address} {vendor.gstin && `| GSTIN: ${vendor.gstin}`}
              </div>
            </div>
          ))}
          {filteredVendors.length === 0 && (
            <div className="px-4 py-2 text-xs text-gray-500 text-center italic border-t border-white/5">
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
  po_number: Yup.string().required("PO number is required"),
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-7xl max-h-[95vh] overflow-y-auto bento-card !p-0 shadow-2xl shadow-cyan-900/20 animate-fade-up border border-white/10 bg-[#111]">
        <div className="flex justify-between items-center p-8 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              {isEdit ? "Edit Purchase Order" : "New Purchase Order"}
            </h2>
             <p className="text-xs text-gray-400">
               Create a new purchase order for a vendor.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
           <span className="text-2xl">×</span>
          </button>
        </div>
        
        <Formik
          initialValues={{
            vendor_id: editData?.vendor?.id || editData?.vendor || null,
            vendor_name: editData?.vendor_display_name || editData?.vendor_name || "",
            po_number: editData?.po_number || `PO-${Date.now()}`,
            expected_date: editData?.expected_date || new Date().toLocaleDateString('sv-SE'),
            notes: editData?.notes || "",
            
            items: editData?.items?.map(item => ({
              product: item.product_display_name || item.product_name || item.product || "",
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
          validationSchema={PurchaseOrderSchema}
          onSubmit={async (values, { setSubmitting }) => {
            if (submitLockRef.current || createMutation.isPending || updateMutation.isPending) {
              return;
            }
            submitLockRef.current = true;
            try {
               const processedItems = values.items.map(item => ({
                  product: item.product_id, // PrimaryKeyRelatedField expects ID
                  product_name: item.product,
                  quantity: Math.max(1, Number(item.quantity) || 1),
                  price: Number(item.price),
                  amount: Number(item.amount),
                  unit: item.unit,
                  discount: 0,
                  tax: 0,
               }));
               
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
                           <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Vendor *</label>
                           <VendorAutocomplete values={values} setFieldValue={setFieldValue} vendors={vendors} />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">PO Number</label>
                           <Field name="po_number" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white" />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Expected Date</label>
                           <Field name="expected_date" type="date" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white [color-scheme:dark]" />
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
                                        <Field name={`items.${index}.quantity`} type="number" min="1" className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white" 
                                            onChange={e => {
                                            const qty = Math.max(1, Number(e.target.value) || 1);
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
                                        <div className="px-3 py-2 text-white font-mono bg-[#111]/50 border border-white/5 rounded-lg">
                                            {Number(values.items[index].amount || 0).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={() => push({ product: "", quantity: 1, price: 0, amount: 0, unit: "pcs" })} className="text-cyan-400 hover:text-cyan-300 text-sm font-medium mt-2">
                                + Add Item
                            </button>
                        </div>
                    )}
                   </FieldArray>

                   <div className="pt-4 border-t border-white/10">
                     <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Notes</label>
                     <Field name="notes" as="textarea" rows="2" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white" placeholder="Optional notes for this purchase order..." />
                   </div>

                   {/* Footer Actions */}
                   <div className="flex justify-between items-center pt-6 border-t border-white/10">
                        <div className="text-xl font-bold text-white">
                          Total: {getCurrencySymbol()}{values.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toFixed(2)}
                        </div>
                        <button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50">
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
