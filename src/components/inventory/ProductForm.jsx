import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createProduct, updateProduct } from "../../api/inventory";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const productSchema = Yup.object().shape({
  name: Yup.string()
    .required("Product name is required")
    .max(255, "Name must be 255 characters or less"),
  hsn_sac_code: Yup.string()
    .max(20, "HSN/SAC code must be 20 characters or less"),
  unit: Yup.string()
    .required("Unit is required")
    .max(20, "Unit must be 20 characters or less"),
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
    hsn_sac_code: product?.hsn_sac_code || product?.hsn_code || "",
    unit: product?.unit || "",
    price: product?.price || product?.purchase_price || product?.unit_price || "",
    stock: product?.stock || product?.current_stock || "",
    low_stock_alert: product?.low_stock_alert || product?.min_stock_level || "",
  };

  const handleSubmit = (values, { setSubmitting }) => {
    const productData = {
      name: values.name,
      hsn_sac_code: values.hsn_sac_code || null,
      unit: values.unit,
      price: values.price,
      stock: parseInt(values.stock),
      low_stock_alert: parseInt(values.low_stock_alert) || 0,
    };

    if (isEdit) {
      updateMutation.mutate({ id: product.id, data: productData });
    } else {
      createMutation.mutate(productData);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={productSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, values, setFieldValue }) => (
            <Form className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Name *
                  </label>
                  <Field
                    name="name"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter product name"
                  />
                  <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    HSN/SAC Code
                  </label>
                  <Field
                    name="hsn_sac_code"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter HSN or SAC code"
                  />
                  <ErrorMessage name="hsn_sac_code" component="div" className="text-red-500 text-xs mt-1" />
                </div>
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unit *
                </label>
                <Field
                  name="unit"
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., pcs, kg, liters, meters"
                />
                <ErrorMessage name="unit" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              {/* Pricing and Stock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price *
                  </label>
                  <Field
                    name="price"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                  <ErrorMessage name="price" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock *
                  </label>
                  <Field
                    name="stock"
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  <ErrorMessage name="stock" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock Value
                  </label>
                  <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600">
                    ₹{(parseFloat(values.stock || 0) * parseFloat(values.price || 0)).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Low Stock Alert */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Low Stock Alert Level
                </label>
                <Field
                  name="low_stock_alert"
                  type="number"
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter low stock alert threshold (0 to disable)"
                />
                <ErrorMessage name="low_stock_alert" component="div" className="text-red-500 text-xs mt-1" />
                <p className="text-xs text-gray-500 mt-1">
                  You'll receive alerts when stock falls below this level
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || createMutation.isLoading || updateMutation.isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting || createMutation.isLoading || updateMutation.isLoading
                    ? "Saving..."
                    : isEdit
                    ? "Update Product"
                    : "Create Product"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
