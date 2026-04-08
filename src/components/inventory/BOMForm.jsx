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
  finished_good_name: Yup.string().required("Finished Good Name is required"),
  batch_size: Yup.number().required("Batch size is required").min(0.01, "Batch size must be at least 0.01"),
  components: Yup.array().of(
    Yup.object().shape({
      product: Yup.string().required("Material is required"),
      quantity: Yup.number().required("Qty is required").min(0.001, "Qty must be > 0"),
    })
  ).min(1, "At least one material is required"),
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
      setFieldValue('finished_good_name', value);
      // Clear the UUID if they are typing manually, unless it matches exactly later
      setFieldValue('finished_good', ''); 
      
      if (value.trim()) {
        const filtered = products.filter(product =>
          product.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredProducts(filtered);
        // Only show dropdown if there are matches or we want to offer creation
        // But per user request "don't force to create", we'll just let them type.
        setShowDropdown(filtered.length > 0);
      } else {
        setShowDropdown(false);
      }
    };

    const handleCreateGeneric = async () => {
        try {
            // Import api function
            const { createProduct } = await import('../../api/inventory');
            // Create a basic product
            const res = await createProduct({ 
                name: inputValue, 
                unit: 'pcs', 
                price: 0, 
                sale_price: 0,
                stock: 0 
            });
            const newProduct = res.data || res;
            selectProduct(newProduct);
            toast.success(`Created Generic Product: ${newProduct.name}`);
        } catch (err) {
            toast.error("Failed to create product");
        }
    };
  
    return (
      <div className="relative">
        <input
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Select or Type New Finished Good..."
          className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white"
        />
        {showDropdown && filteredProducts.length > 0 && (
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
    onError: (err) => {
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : "Failed to create BOM";
      toast.error(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateBOM(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["boms"]);
      toast.success("BOM Updated!");
      onClose();
    },
    onError: (err) => {
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : "Failed to update BOM";
      toast.error(errorMsg);
    },
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
            finished_good_name: editData?.finished_good_name || editData?.finished_good_display || "",
            is_active: editData?.is_active ?? true,
            production_time: editData?.production_time || "",
            batch_size: editData?.batch_size || 1,
            testing_notes: editData?.testing_notes || "",
            components: editData?.components?.map(c => ({
                product: c.product, // UUID
                product_name: c.product_name || products.find(p => p.id === c.product)?.name || "", // Lookup name if missing
                quantity: c.quantity,
                unit: c.unit || "pcs"
            })) || [{ product: "", product_name: "", quantity: 1, unit: "pcs" }]
          }}
          validationSchema={BOMSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
                const payload = {
                    name: values.name,
                    finished_good: values.finished_good || null,
                    finished_good_name: values.finished_good_name,
                    is_active: values.is_active,
                    production_time: values.production_time,
                    batch_size: Number(values.batch_size),
                    testing_notes: values.testing_notes,
                    components: values.components.map(c => ({
                        product: c.product,
                        quantity: Number(c.quantity)
                    }))
                };

                console.log("Submitting BOM Payload:", payload);

                if (isEdit) {
                    await updateMutation.mutateAsync({ id: editData.id, data: payload });
                } else {
                    await createMutation.mutateAsync(payload);
                }
            } catch (err) {
                console.error("BOM Submission Error:", err);
            } finally {
                setSubmitting(false);
            }
          }}
        >
          {({ values, setFieldValue, isSubmitting, errors, status }) => {
            // Enhanced debugging: Log errors if any
            if (Object.keys(errors).length > 0) {
                console.warn("BOM Form Validation Errors:", errors);
            }

            return (
            <Form className="p-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">BOM Name</label>
                        <Field name="name" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white" placeholder="e.g. Standard 1kg Pack" />
                        <ErrorMessage name="name" component="div" className="text-red-400 text-[10px] mt-1" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Finished Good (Output)</label>
                        <FinishedGoodAutocomplete values={values} setFieldValue={setFieldValue} products={products} />
                        <ErrorMessage name="finished_good_name" component="div" className="text-red-400 text-[10px] mt-1" />
                    </div>
                </div>

                {/* Additional Manufacturing Process Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Default Batch Size</label>
                        <Field name="batch_size" type="number" min="0.01" step="0.01" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white" />
                        <ErrorMessage name="batch_size" component="div" className="text-red-400 text-[10px] mt-1" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Est. Production Time</label>
                        <Field name="production_time" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white" placeholder="e.g. 2 Hours, 1 Day" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-medium text-gray-400 mb-1">QA / Testing Notes</label>
                        <Field as="textarea" name="testing_notes" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white h-20 resize-none" placeholder="Quality checks required before marking as ready..." />
                    </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-white">Raw Materials (Input)</h3>
                        {/* Safe rendering of top-level components error (like min length) */}
                        {typeof errors.components === 'string' && (
                            <div className="text-red-400 text-[10px]">{errors.components}</div>
                        )}
                    </div>
                    <FieldArray name="components">
                        {({ push, remove }) => (
                            <div className="space-y-4">
                                {values.components.map((item, index) => (
                                    <div key={index} className="space-y-1">
                                        <div className="grid grid-cols-12 gap-3 items-end">
                                            <div className="col-span-7">
                                                <label className="block text-[10px] text-gray-500 mb-1">Raw Material</label>
                                                <ProductAutocomplete idx={index} values={values} setFieldValue={setFieldValue} products={products} />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="block text-[10px] text-gray-500 mb-1">Qty Required</label>
                                                <div className="flex items-center gap-2">
                                                    <Field name={`components.${index}.quantity`} type="number" className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                                    <span className="text-xs text-gray-500">{item.unit}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-2 flex justify-end pb-2">
                                                <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-12 gap-3">
                                            <div className="col-span-7">
                                                <ErrorMessage name={`components.${index}.product`} component="div" className="text-red-400 text-[9px]" />
                                            </div>
                                            <div className="col-span-3">
                                                <ErrorMessage name={`components.${index}.quantity`} component="div" className="text-red-400 text-[9px]" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => push({ product: "", product_name: "", quantity: 1, unit: "pcs" })} className="text-purple-400 hover:text-purple-300 text-sm font-medium mt-2 flex items-center gap-1">
                                    <span>+</span> Add Material
                                </button>
                            </div>
                        )}
                    </FieldArray>
                </div>

                {/* Validation Error Summary - Safer Rendering */}
                {Object.keys(errors).length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-4">
                    <p className="text-red-400 text-[10px] font-bold mb-1 uppercase tracking-wider">Please fix the following issues:</p>
                    <ul className="list-disc list-inside text-red-300 text-[10px] space-y-1">
                      {Object.entries(errors).map(([key, value]) => {
                         if (key === 'components' && Array.isArray(value)) {
                             return <li key={key}>Raw Materials: Incomplete entries found</li>;
                         }
                         if (typeof value === 'string') {
                            return (
                                <li key={key}>
                                    {key === 'finished_good_name' ? 'Finished Good' : 
                                     key === 'components' ? 'Raw Materials' : 
                                     key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                                </li>
                             );
                         }
                         return null;
                      })}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-white/10">
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className={`btn-primary flex items-center justify-center min-w-[120px] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Saving...</span>
                            </>
                        ) : "Save BOM"}
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
