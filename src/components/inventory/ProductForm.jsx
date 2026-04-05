import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createProduct, updateProduct } from "../../api/inventory";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { XMarkIcon } from '@heroicons/react/24/outline';

const productSchema = Yup.object().shape({
  name: Yup.string()
    .required("Product name is required")
    .max(255, "Name must be 255 characters or less"),
  description: Yup.string().nullable(),
  tax: Yup.number()
    .min(0, "Tax cannot be negative")
    .max(100, "Tax cannot exceed 100%")
    .nullable(),
  hsn_sac_code: Yup.string()
    .max(20, "HSN/SAC code must be 20 characters or less"),
  unit: Yup.string()
    .required("Unit is required")
    .max(20, "Unit must be 20 characters or less"),
  secondary_unit: Yup.string()
    .max(20, "Secondary unit must be 20 characters or less")
    .nullable(),
  conversion_factor: Yup.number()
    .integer("Conversion factor must be a whole number")
    .min(1, "Conversion factor must be at least 1")
    .nullable(),
  price: Yup.string()
    .required("Price is required")
    .matches(/^\d+(\.\d{1,2})?$/, "Price must be a valid decimal number"),
  stock: Yup.number()
    .required("Stock is required")
    .integer("Stock must be a whole number")
    .min(0, "Stock must be positive"),
  low_stock_alert: Yup.number()
    .integer("Low stock alert must be a whole number")
    .min(0, "Low stock alert must be positive"),
  warranty_months: Yup.number()
    .integer("Warranty must be a whole number")
    .min(0, "Warranty must be positive"),
  meta: Yup.object().shape({
    expiry_date: Yup.date().nullable().typeError("Invalid date"),
    secondary_stock: Yup.number().nullable(),
    mandi_tax: Yup.number().nullable(),
    is_h1: Yup.boolean(),
    is_narcotic: Yup.boolean(),
    is_new_launch: Yup.boolean(),
  }),
});

export default function ProductForm({ product, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Product created successfully!");
      onClose();
    },
    onError: (error) => {
      console.error("Error creating product:", error);
      toast.error(error.response?.data?.message || "Failed to create product");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Product updated successfully!");
      onClose();
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      toast.error(error.response?.data?.message || "Failed to update product");
    },
  });

  const initialValues = {
    name: product?.name || "",
    description: product?.description || "",
    tax: product?.tax || "",
    hsn_sac_code: product?.hsn_sac_code || product?.hsn_code || "",
    unit: product?.unit || "",
    secondary_unit: product?.secondary_unit || "",
    conversion_factor: product?.conversion_factor || 1,
    price: product?.price || product?.purchase_price || product?.unit_price || "",
    stock: product?.stock || product?.current_stock || "",
    low_stock_alert: product?.low_stock_alert || product?.min_stock_level || "",
    warranty_months: product?.warranty_months || 0,
    meta: {
      barcode: product?.barcode || product?.meta?.barcode || "",
      expiry_date: product?.meta?.expiry_date || "",
      secondary_stock: product?.meta?.secondary_stock || "",
      mandi_tax: product?.meta?.mandi_tax || "",
      is_h1: product?.meta?.is_h1 || false,
      is_narcotic: product?.meta?.is_narcotic || false,
      is_new_launch: product?.meta?.is_new_launch || false,
    },
  };

  const handleSubmit = (values, { setSubmitting }) => {
    const metaData = {
      is_h1: values.meta.is_h1,
      is_narcotic: values.meta.is_narcotic,
      is_new_launch: values.meta.is_new_launch,
    };

    if (values.meta.barcode?.trim()) metaData.barcode = values.meta.barcode;
    if (values.meta.expiry_date) metaData.expiry_date = values.meta.expiry_date;
    if (values.meta.secondary_stock !== "" && values.meta.secondary_stock !== null) {
      metaData.secondary_stock = parseFloat(values.meta.secondary_stock);
    }
    if (values.meta.mandi_tax !== "" && values.meta.mandi_tax !== null) {
      metaData.mandi_tax = parseFloat(values.meta.mandi_tax);
    }

    const productData = {
      name: values.name,
      description: values.description || null,
      tax: values.tax ? parseFloat(values.tax) : 0,
      hsn_sac_code: values.hsn_sac_code || null,
      unit: values.unit,
      secondary_unit: values.secondary_unit || null,
      conversion_factor: values.conversion_factor ? parseInt(values.conversion_factor) : 1,
      price: values.price,
      stock: parseInt(values.stock),
      low_stock_alert: parseInt(values.low_stock_alert) || 0,
      warranty_months: parseInt(values.warranty_months) || 0,
      meta: metaData,
    };

    if (isEdit) {
      updateMutation.mutate({ id: product.id, data: productData });
    } else {
      createMutation.mutate(productData);
    }
    setSubmitting(false);
  };

  const inputClass = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bento-card !p-0 shadow-2xl shadow-purple-900/20 animate-fade-up">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? "Edit Product" : "New Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={productSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, values }) => (
            <Form className="p-6 md:p-8 space-y-8">
              {/* Section 1: Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Product Name *</label>
                  <Field
                    name="name"
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Wireless Headphones"
                  />
                  <ErrorMessage name="name" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <div>
                  <label className={labelClass}>HSN/SAC Code</label>
                  <Field
                    name="hsn_sac_code"
                    type="text"
                    className={inputClass}
                    placeholder="e.g. 8518"
                  />
                  <ErrorMessage name="hsn_sac_code" component="div" className="text-red-400 text-xs mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Description / Notes</label>
                  <Field
                    as="textarea"
                    name="description"
                    className={`${inputClass} resize-none h-[52px]`}
                    placeholder="Optional description"
                  />
                  <ErrorMessage name="description" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <div>
                  <label className={labelClass}>GST Tax Rate (%)</label>
                  <Field
                    name="tax"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className={inputClass}
                    placeholder="e.g. 18.00"
                  />
                  <ErrorMessage name="tax" component="div" className="text-red-400 text-xs mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Expiry Date (Optional)</label>
                  <Field
                    name="meta.expiry_date"
                    type="date"
                    className={inputClass}
                  />
                  <ErrorMessage name="meta.expiry_date" component="div" className="text-red-400 text-xs mt-1" />
                </div>
              </div>

              {/* Section 2: Units */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Primary Unit *</label>
                  <Field
                    name="unit"
                    type="text"
                    className={inputClass}
                    placeholder="e.g. pcs"
                  />
                  <ErrorMessage name="unit" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <div>
                  <label className={labelClass}>Secondary Unit</label>
                  <Field
                    name="secondary_unit"
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Box"
                  />
                  <ErrorMessage name="secondary_unit" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <div>
                  <label className={labelClass}>Conversion Factor</label>
                  <Field
                    name="conversion_factor"
                    type="number"
                    min="1"
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    1 {values.secondary_unit || 'Box'} = {values.conversion_factor || 1} {values.unit || 'pcs'}
                  </p>
                </div>
              </div>

              {/* Section 3: Pricing & Stock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Price (₹) *</label>
                  <Field
                    name="price"
                    type="text"
                    className={inputClass}
                    placeholder="0.00"
                  />
                  <ErrorMessage name="price" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <div>
                  <label className={labelClass}>Opening Stock *</label>
                  <Field
                    name="stock"
                    type="number"
                    min="0"
                    className={inputClass}
                    placeholder="0"
                  />
                  <ErrorMessage name="stock" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <div>
                  <label className={labelClass}>Stock Value</label>
                  <div className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-gray-400 cursor-not-allowed">
                    ₹{(parseFloat(values.stock || 0) * parseFloat(values.price || 0)).toFixed(2)}
                  </div>
                </div>
              </div>

               {/* Section 4: Alerts & Warranty */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Low Stock Alert</label>
                  <Field
                    name="low_stock_alert"
                    type="number"
                    min="0"
                    className={inputClass}
                    placeholder="e.g. 10"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Get notified when stock falls below this level.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Warranty (Months)</label>
                  <Field
                    name="warranty_months"
                    type="number"
                    min="0"
                    className={inputClass}
                    placeholder="e.g. 12"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Warranty duration from sale date. 0 = no warranty.
                  </p>
                </div>
               </div>

               {/* Section 5: Advanced Details (Sidecar) */}
               <div className="pt-6 border-t border-white/10">
                 <h3 className="text-sm font-bold text-white mb-4">Advanced Details</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className={labelClass}>Secondary Stock</label>
                      <Field
                        name="meta.secondary_stock"
                        type="number"
                        className={inputClass}
                        placeholder="e.g. 50"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Mandi Tax (₹)</label>
                      <Field
                        name="meta.mandi_tax"
                        type="number"
                        className={inputClass}
                        placeholder="0.00"
                      />
                    </div>
                 </div>

                 <div className="flex flex-wrap gap-6">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <Field type="checkbox" name="meta.is_h1" className="w-5 h-5 rounded bg-[#111] border border-white/10 text-purple-600 focus:ring-purple-500/50 transition-colors" />
                      <span className="text-gray-300 group-hover:text-white transition-colors">H1 Drug</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <Field type="checkbox" name="meta.is_narcotic" className="w-5 h-5 rounded bg-[#111] border border-white/10 text-purple-600 focus:ring-purple-500/50 transition-colors" />
                      <span className="text-gray-300 group-hover:text-white transition-colors">Narcotic</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <Field type="checkbox" name="meta.is_new_launch" className="w-5 h-5 rounded bg-[#111] border border-white/10 text-purple-600 focus:ring-purple-500/50 transition-colors" />
                      <span className="text-gray-300 group-hover:text-white transition-colors">New Launch</span>
                    </label>
                 </div>
               </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-gray-300 hover:text-white font-medium hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || createMutation.isLoading || updateMutation.isLoading}
                  className="btn-primary shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
