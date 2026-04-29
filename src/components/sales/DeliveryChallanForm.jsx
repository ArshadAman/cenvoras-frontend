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
function ProductAutocomplete({ idx, values, setFieldValue, onInputChange, products }) {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(values.items[idx]?.product || "");

  const selectProduct = (product) => {
    setFieldValue(`items.${idx}.product`, product.name);
    setFieldValue(`items.${idx}.product_id`, product.id);
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
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
              autoComplete="off"
            />
          </div>
        )}
      </Field>
      {showDropdown && (
        <div className="absolute z-50 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl w-full max-h-60 overflow-y-auto">
          {filteredProducts.slice(0, 50).map((product) => (
            <div
              key={product.id}
              className="px-4 py-3 cursor-pointer text-sm border-b border-white/5 hover:bg-white/5 text-gray-300"
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-7xl max-h-[95vh] overflow-y-auto bento-card !p-0 shadow-2xl shadow-blue-900/20 animate-fade-up border border-white/10 bg-[#111]">
        <div className="flex justify-between items-center p-8 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? "Edit Delivery Challan" : "New Delivery Challan"}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">×</button>
        </div>
        
        <Formik
          initialValues={{
            customer_name: editData?.customer_name || "",
            challan_number: editData?.challan_number || `DC-${Date.now()}`,
            date: editData?.date || new Date().toLocaleDateString('sv-SE'),
            vehicle_number: editData?.vehicle_number || "", // Extra field for DC
            notes: editData?.notes || "",
            items: editData?.items?.map(item => ({
              product: item.product_name || item.product || "",
              product_id: item.product || null,
              quantity: item.quantity || 1,
              unit: item.unit || "pcs",
            })) || [{ product: "", quantity: 1, unit: "pcs" }]
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
                    product: item.product_id || item.product,
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
                <div className="p-8 space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                           <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Customer</label>
                           <Field name="customer_name" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white" />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Challan No.</label>
                           <Field name="challan_number" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white" />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Date</label>
                           <Field name="date" type="date" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white" />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Vehicle No.</label>
                           <Field name="vehicle_number" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white" />
                        </div>
                   </div>

                   <FieldArray name="items">
                    {({ push, remove }) => (
                        <div className="space-y-4">
                            {values.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-4 items-end bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="col-span-6">
                                        <label className="block text-xs text-gray-400 mb-1">Product</label>
                                        <ProductAutocomplete idx={index} values={values} setFieldValue={setFieldValue} products={products} />
                                    </div>
                                    <div className="col-span-4">
                                        <label className="block text-xs text-gray-400 mb-1">Qty</label>
                                        <Field name={`items.${index}.quantity`} type="number" className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white" />
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-300">Remove</button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={() => push({ product: "", quantity: 1, unit: "pcs" })} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                                + Add Item
                            </button>
                        </div>
                    )}
                   </FieldArray>

                   <div className="flex justify-end pt-6 border-t border-white/10">
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
