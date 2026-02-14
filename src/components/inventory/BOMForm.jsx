import React, { useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createBOM, updateBOM } from "../../api/bom";
import { getProducts } from "../../api/inventory"; // Reusing getProducts
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { XMarkIcon } from '@heroicons/react/24/outline';

const BOMSchema = Yup.object().shape({
  name: Yup.string().required("BOM Name is required"),
  finished_good: Yup.string().required("Finished Good is required"),
  components: Yup.array().of(
    Yup.object().shape({
      product: Yup.string().required("Raw Material is required"),
      quantity: Yup.number().required("Qty is required").min(0.001),
    })
  ).min(1, "At least one component is required"),
});

// Reusing ProductAutocomplete logic (simplified)
function ProductAutocomplete({ idx, values, setFieldValue, products, fieldNamePrefix = "components" }) {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(values[fieldNamePrefix][idx]?.product_name || "");

  const selectProduct = (product) => {
    setFieldValue(`${fieldNamePrefix}.${idx}.product_name`, product.name);
    setFieldValue(`${fieldNamePrefix}.${idx}.product`, product.id); 
    setFieldValue(`${fieldNamePrefix}.${idx}.unit`, product.unit);
    setInputValue(product.name);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFieldValue(`${fieldNamePrefix}.${idx}.product_name`, value);
    
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
      <input
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Search Item..."
        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
      />
      {showDropdown && (
        <div className="absolute z-50 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl w-full max-h-60 overflow-y-auto">
          {filteredProducts.slice(0, 50).map((product) => (
            <div
              key={product.id}
              className="px-4 py-2 cursor-pointer text-sm border-b border-white/5 hover:bg-white/5 text-gray-300"
              onClick={() => selectProduct(product)}
            >
              <div className="font-medium">{product.name}</div>
              <div className="text-xs text-gray-500">Stock: {product.stock} {product.unit}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Finished Good Autocomplete
function FinishedGoodAutocomplete({ values, setFieldValue, products }) {
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [inputValue, setInputValue] = useState(values.finished_good_name || "");
  
    const selectProduct = (product) => {
      setFieldValue('finished_good', product.id);
      setFieldValue('finished_good_name', product.name);
      setInputValue(product.name);
      setShowDropdown(false);
    };
  
    const handleInputChange = (e) => {
      const value = e.target.value;
      setInputValue(value);
      
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
        <input
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Select Finished Good..."
          className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white"
        />
        {showDropdown && (
          <div className="absolute z-50 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl w-full max-h-60 overflow-y-auto">
            {filteredProducts.slice(0, 50).map((product) => (
              <div
                key={product.id}
                className="px-4 py-2 cursor-pointer text-sm border-b border-white/5 hover:bg-white/5 text-gray-300"
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

export default function BOMForm({ isOpen, onClose, editData }) {
  const queryClient = useQueryClient();
  const isEdit = !!editData;

  const { data: productsResult } = useQuery({ 
      queryKey: ["products"], 
      queryFn: getProducts,
      staleTime: 5 * 60 * 1000 
  });
  const products = Array.isArray(productsResult) ? productsResult : productsResult?.data || productsResult?.results || [];

  const createMutation = useMutation({
    mutationFn: createBOM,
    onSuccess: () => {
      queryClient.invalidateQueries(["boms"]);
      toast.success("BOM Created!");
      onClose();
    },
    onError: (err) => toast.error("Failed to create BOM"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateBOM(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["boms"]);
      toast.success("BOM Updated!");
      onClose();
    },
    onError: (err) => toast.error("Failed to update BOM"),
  });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bento-card !p-0 shadow-2xl animate-fade-up bg-[#111] border border-white/10">
        
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? "Edit Bill of Material" : "New Bill of Material"}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <Formik
          initialValues={{
            name: editData?.name || "",
            finished_good: editData?.finished_good || "",
            finished_good_name: editData?.finished_good_name || "",
            is_active: editData?.is_active ?? true,
            components: editData?.components?.map(c => ({
                product: c.product, // UUID
                product_name: c.product_name || products.find(p => p.id === c.product)?.name || "", // Lookup name if missing
                quantity: c.quantity,
                unit: c.unit || "pcs"
            })) || [{ product: "", product_name: "", quantity: 1, unit: "pcs" }]
          }}
          validationSchema={BOMSchema}
          onSubmit={(values, { setSubmitting }) => {
            const payload = {
                name: values.name,
                finished_good: values.finished_good,
                is_active: values.is_active,
                components: values.components.map(c => ({
                    product: c.product,
                    quantity: Number(c.quantity)
                }))
            };

            if (isEdit) {
                updateMutation.mutate({ id: editData.id, data: payload });
            } else {
                createMutation.mutate(payload);
            }
            setSubmitting(false);
          }}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="p-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">BOM Name</label>
                        <Field name="name" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white" placeholder="e.g. Standard 1kg Pack" />
                        <ErrorMessage name="name" component="div" className="text-red-400 text-xs mt-1" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Finished Good (Output)</label>
                        <FinishedGoodAutocomplete values={values} setFieldValue={setFieldValue} products={products} />
                        <ErrorMessage name="finished_good" component="div" className="text-red-400 text-xs mt-1" />
                    </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <h3 className="text-sm font-bold text-white mb-4">Raw Materials (Input)</h3>
                    <FieldArray name="components">
                        {({ push, remove }) => (
                            <div className="space-y-3">
                                {values.components.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-3 items-end">
                                        <div className="col-span-7">
                                            <label className="block text-xs text-gray-500 mb-1">Raw Material</label>
                                            <ProductAutocomplete idx={index} values={values} setFieldValue={setFieldValue} products={products} />
                                        </div>
                                        <div className="col-span-3">
                                            <label className="block text-xs text-gray-500 mb-1">Qty Required</label>
                                            <div className="flex items-center gap-2">
                                                <Field name={`components.${index}.quantity`} type="number" className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white" />
                                                <span className="text-xs text-gray-500">{item.unit}</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 flex justify-end pb-2">
                                            <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => push({ product: "", product_name: "", quantity: 1, unit: "pcs" })} className="text-purple-400 hover:text-purple-300 text-sm font-medium mt-2">
                                    + Add Material
                                </button>
                            </div>
                        )}
                    </FieldArray>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10">
                    <button type="submit" disabled={isSubmitting} className="btn-primary">
                        {isSubmitting ? "Saving..." : "Save BOM"}
                    </button>
                </div>

            </Form>
          )}
        </Formik>
      </div>
    </div>,
    document.body
  );
}
