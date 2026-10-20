import React, { useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createDeliveryChallan, updateDeliveryChallan } from "../../api/delivery_challan";
import { getProducts } from "../../api/sales";
import { getCustomers } from "../../api/customers";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Reuse ProductAutocomplete and CustomerAutocomplete from SalesOrderForm logic (duplicated for now for independence)
// Ideally these should be shared components
function ProductAutocomplete({ idx, values, setFieldValue, onInputChange, products, showManufacturer = true }) {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(values.items[idx]?.product || "");

  useEffect(() => {
    setInputValue(values.items[idx]?.product || "");
  }, [values.items[idx]?.product]);

  const selectProduct = (product) => {
    setFieldValue(`items.${idx}.product`, product.name);
    setFieldValue(`items.${idx}.product_id`, product.id);
    setFieldValue(`items.${idx}.manufacturer`, product.manufacturer || "");
    setFieldValue(`items.${idx}.description`, product.description || "");
    setFieldValue(`items.${idx}.product_description`, product.description || "");
    setFieldValue(`items.${idx}.unit`, product.unit || 'pcs');
    setFieldValue(`items.${idx}.price`, product.price ?? 0); // Optional for Challan but good to have
    setFieldValue(`items.${idx}.isExistingProduct`, true);
    setInputValue(product.name);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFieldValue(`items.${idx}.product`, value);
    
    if (value.trim()) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFieldValue(`items.${idx}.isExistingProduct`, false);
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <Field name={`items.${idx}.product`}>
        {({ field }) => (
          <div>
            <input
              {...field}
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Product name"
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  if (showDropdown && filteredProducts.length === 1) {
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
              <div className="text-xs text-[var(--text-muted)] font-medium italic mt-0.5 tracking-wide">
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
              className="w-full bg-transparent border-0 border-b border-transparent hover:border-[var(--border-subtle)] focus:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)]/40 rounded px-1.5 py-0.5 text-[var(--text-secondary)] placeholder-[var(--text-muted)] outline-none transition-all text-xs leading-relaxed resize-none italic mt-1"
            />
          </div>
        )}
      </Field>
      {showDropdown && (
        <div className="absolute z-50 mt-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl w-full max-h-60 overflow-y-auto">
          {filteredProducts.slice(0, 50).map((product) => (
            <div
              key={product.id}
              className="px-4 py-3 cursor-pointer text-sm border-b border-[var(--border-subtle)] hover:bg-[var(--bg-primary)]/40 text-[var(--text-primary)]"
              onClick={() => selectProduct(product)}
            >
              {product.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DeliveryChallanSchema = Yup.object().shape({
  customer_name: Yup.string().required("Customer name is required"),
  challan_number: Yup.string().required("Challan number is required"),
  date: Yup.string().required("Date is required"),
  items: Yup.array().of(
    Yup.object().shape({
      product: Yup.string().required("Product is required"),
      quantity: Yup.number().required("Quantity is required").min(1),
    })
  ).min(1, "At least one item is required"),
});

export default function DeliveryChallanForm({ isOpen, onClose, editData }) {
  const queryClient = useQueryClient();
  const isEdit = !!editData;
  const [showManufacturer, setShowManufacturer] = useState(true);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  
  const { data: productsResult } = useQuery({ 
      queryKey: ["products"], 
      queryFn: getProducts, 
      staleTime: 5 * 60 * 1000 
  });
  const products = Array.isArray(productsResult) ? productsResult : productsResult?.data || productsResult?.results || [];

  const createMutation = useMutation({
    mutationFn: createDeliveryChallan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveryChallans"] });
      toast.success("Delivery Challan created!");
      onClose();
    },
    onError: (error) => toast.error("Failed to create challan"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateDeliveryChallan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveryChallans"] });
      toast.success("Delivery Challan updated!");
      onClose();
    },
    onError: (error) => toast.error("Failed to update challan"),
  });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative w-full max-w-7xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl animate-fade-up border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {isEdit ? "Edit Delivery Challan" : "New Delivery Challan"}
          </h2>
          <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">×</button>
        </div>
        
        <Formik
          initialValues={{
            customer_name: editData?.customer_name || "",
            challan_number: editData?.challan_number || `DC-${Date.now()}`,
            date: editData?.date || new Date().toLocaleDateString('sv-SE'),
            vehicle_number: editData?.vehicle_number || "", // Extra field for DC
            notes: editData?.notes || "",
            items: editData?.items?.map(item => ({
              id: item.id,
              source_item_id: item.source_item_id || null,
              product: item.product_name || item.product || "",
              product_id: item.product || null,
              manufacturer: item.manufacturer || item.product_detail?.manufacturer || "",
              description: item.description || item.product_description || "",
              product_description: item.description || item.product_description || "",
              quantity: item.quantity || 1,
              unit: item.unit || "pcs",
            })) || [{ product: "", product_id: null, manufacturer: "", description: "", product_description: "", quantity: 1, unit: "pcs" }]
          }}
          validationSchema={DeliveryChallanSchema}
          onSubmit={async (values, { setSubmitting }) => {
            const formData = {
                customer_name: values.customer_name,
                challan_number: values.challan_number,
                date: values.date,
                vehicle_number: values.vehicle_number,
                notes: values.notes,
                items: values.items.map(item => ({
                    ...(item.id ? { id: item.id } : {}),
                    ...(item.source_item_id ? { source_item_id: item.source_item_id } : {}),
                    product: item.product_id || item.product,
                    description: (item.description || item.product_description || "").trim(),
                    product_description: (item.description || item.product_description || "").trim(),
                    quantity: Number(item.quantity),
                    unit: item.unit
                }))
            };

            if (isEdit) {
                updateMutation.mutate({ id: editData.id, data: formData });
            } else {
                createMutation.mutate(formData);
            }
            setSubmitting(false);
          }}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="p-0">
                <div className="p-6 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                           <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Customer</label>
                           <Field name="customer_name" className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
                        </div>
                        <div>
                           <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Challan No.</label>
                           <Field name="challan_number" className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
                        </div>
                        <div>
                           <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Date</label>
                           <Field name="date" type="date" className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
                        </div>
                        <div>
                           <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Vehicle No.</label>
                           <Field name="vehicle_number" className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
                        </div>
                   </div>

                   {/* Items Header */}
                   <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                     <h3 className="text-base font-bold text-[var(--text-primary)]">Challan Items</h3>
                     <div className="relative">
                       <button
                         type="button"
                         onClick={() => setShowColumnPicker((prev) => !prev)}
                         className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-primary)]/40 text-xs text-[var(--text-secondary)]"
                       >
                         Columns
                       </button>

                       {showColumnPicker && (
                         <div className="absolute right-0 top-10 z-20 w-48 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-2xl">
                           <div className="mb-2 text-xs uppercase tracking-wide text-[var(--text-secondary)]">Show/Hide Columns</div>
                           <label className="flex items-center gap-2 py-1 text-sm text-[var(--text-secondary)] cursor-pointer">
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

                   <FieldArray name="items">
                    {({ push, remove }) => (
                        <div className="space-y-4">
                            {values.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-4 items-end bg-[var(--bg-primary)]/20 p-4 rounded-xl border border-[var(--border-subtle)]">
                                    <div className="col-span-6">
                                        <label className="block text-xs text-[var(--text-secondary)] mb-1">Product</label>
                                        <ProductAutocomplete idx={index} values={values} setFieldValue={setFieldValue} products={products} showManufacturer={showManufacturer} />
                                    </div>
                                    <div className="col-span-4">
                                        <label className="block text-xs text-[var(--text-secondary)] mb-1">Qty</label>
                                        <Field name={`items.${index}.quantity`} type="number" className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <button type="button" onClick={() => remove(index)} className="text-[var(--status-danger)] hover:underline text-xs font-semibold">Remove</button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={() => push({ product: "", product_id: null, manufacturer: "", description: "", product_description: "", quantity: 1, unit: "pcs" })} className="text-[var(--accent-primary)] hover:underline text-sm font-medium">
                                + Add Item
                            </button>
                        </div>
                    )}
                   </FieldArray>

                   <div className="flex justify-end pt-6 border-t border-[var(--border-subtle)]">
                        <button type="submit" disabled={isSubmitting} className="btn-primary">
                            {isSubmitting ? "Saving..." : "Save Challan"}
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
