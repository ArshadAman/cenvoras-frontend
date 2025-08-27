import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createProduct, updateProduct, getCategories, getUnits, getSuppliers } from "../../api/inventory";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const productSchema = Yup.object().shape({
  name: Yup.string()
    .required("Product name is required")
    .max(100, "Name must be 100 characters or less"),
  sku: Yup.string()
    .required("SKU is required")
    .max(50, "SKU must be 50 characters or less"),
  description: Yup.string()
    .max(500, "Description must be 500 characters or less"),
  category: Yup.string()
    .required("Category is required"),
  unit: Yup.string()
    .required("Unit is required"),
  unit_price: Yup.number()
    .required("Unit price is required")
    .min(0, "Price must be positive"),
  current_stock: Yup.number()
    .required("Current stock is required")
    .min(0, "Stock must be positive"),
  min_stock_level: Yup.number()
    .min(0, "Minimum stock must be positive"),
  max_stock_level: Yup.number()
    .min(0, "Maximum stock must be positive"),
  supplier: Yup.string(),
  location: Yup.string()
    .max(100, "Location must be 100 characters or less"),
  barcode: Yup.string()
    .max(50, "Barcode must be 50 characters or less"),
});

export default function ProductForm({ product, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!product;

  // Fetch reference data
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: getUnits,
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

  const categoriesList = Array.isArray(categories) ? categories : categories?.data || categories?.results || [];
  const unitsList = Array.isArray(units) ? units : units?.data || units?.results || [];
  const suppliersList = Array.isArray(suppliers) ? suppliers : suppliers?.data || suppliers?.results || [];

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
    sku: product?.sku || "",
    description: product?.description || "",
    category: product?.category || "",
    unit: product?.unit || "",
    unit_price: product?.unit_price || "",
    current_stock: product?.current_stock || "",
    min_stock_level: product?.min_stock_level || "",
    max_stock_level: product?.max_stock_level || "",
    supplier: product?.supplier || "",
    location: product?.location || "",
    barcode: product?.barcode || "",
  };

  const handleSubmit = (values, { setSubmitting }) => {
    const productData = {
      ...values,
      unit_price: parseFloat(values.unit_price),
      current_stock: parseFloat(values.current_stock),
      min_stock_level: values.min_stock_level ? parseFloat(values.min_stock_level) : null,
      max_stock_level: values.max_stock_level ? parseFloat(values.max_stock_level) : null,
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
                    SKU *
                  </label>
                  <Field
                    name="sku"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter SKU"
                  />
                  <ErrorMessage name="sku" component="div" className="text-red-500 text-xs mt-1" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <Field
                  name="description"
                  as="textarea"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product description"
                />
                <ErrorMessage name="description" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              {/* Category and Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <Field
                    name="category"
                    as="select"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categoriesList.map((category) => (
                      <option key={category.id || category.name} value={category.name || category}>
                        {category.name || category}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="category" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unit *
                  </label>
                  <Field
                    name="unit"
                    as="select"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Unit</option>
                    {unitsList.map((unit) => (
                      <option key={unit.id || unit.name} value={unit.name || unit}>
                        {unit.name || unit}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="unit" component="div" className="text-red-500 text-xs mt-1" />
                </div>
              </div>

              {/* Pricing and Stock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unit Price *
                  </label>
                  <Field
                    name="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                  <ErrorMessage name="unit_price" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Stock *
                  </label>
                  <Field
                    name="current_stock"
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  <ErrorMessage name="current_stock" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock Value
                  </label>
                  <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600">
                    ₹{(parseFloat(values.current_stock || 0) * parseFloat(values.unit_price || 0)).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Stock Levels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Stock Level
                  </label>
                  <Field
                    name="min_stock_level"
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter minimum stock level"
                  />
                  <ErrorMessage name="min_stock_level" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Maximum Stock Level
                  </label>
                  <Field
                    name="max_stock_level"
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter maximum stock level"
                  />
                  <ErrorMessage name="max_stock_level" component="div" className="text-red-500 text-xs mt-1" />
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Supplier
                  </label>
                  <Field
                    name="supplier"
                    as="select"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Supplier</option>
                    {suppliersList.map((supplier) => (
                      <option key={supplier.id || supplier.name} value={supplier.name || supplier}>
                        {supplier.name || supplier}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="supplier" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Storage Location
                  </label>
                  <Field
                    name="location"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Warehouse A, Shelf 1"
                  />
                  <ErrorMessage name="location" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Barcode
                  </label>
                  <Field
                    name="barcode"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter barcode"
                  />
                  <ErrorMessage name="barcode" component="div" className="text-red-500 text-xs mt-1" />
                </div>
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
