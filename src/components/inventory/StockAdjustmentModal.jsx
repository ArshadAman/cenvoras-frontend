import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createStockAdjustment } from "../../api/inventory";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const stockAdjustmentSchema = Yup.object().shape({
  adjustment_type: Yup.string()
    .required("Adjustment type is required")
    .oneOf(["add", "remove", "set"], "Invalid adjustment type"),
  quantity: Yup.number()
    .required("Quantity is required")
    .min(0, "Quantity must be positive"),
  reason: Yup.string()
    .required("Reason is required")
    .max(200, "Reason must be 200 characters or less"),
  notes: Yup.string()
    .max(500, "Notes must be 500 characters or less"),
});

export default function StockAdjustmentModal({ product, onClose }) {
  const queryClient = useQueryClient();

  const stockAdjustmentMutation = useMutation({
    mutationFn: createStockAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Stock adjustment recorded successfully!");
      onClose();
    },
    onError: (error) => {
      console.error("Error creating stock adjustment:", error);
      toast.error(error.response?.data?.message || "Failed to record stock adjustment");
    },
  });

  const initialValues = {
    product_id: product?.id || "",
    adjustment_type: "add",
    quantity: "",
    reason: "",
    notes: "",
  };

  const handleSubmit = (values, { setSubmitting }) => {
    const adjustmentData = {
      ...values,
      quantity: parseFloat(values.quantity),
    };

    stockAdjustmentMutation.mutate(adjustmentData);
    setSubmitting(false);
  };

  const getNewStockLevel = (adjustmentType, quantity, currentStock) => {
    const qty = parseFloat(quantity || 0);
    const current = parseFloat(currentStock || 0);
    
    switch (adjustmentType) {
      case "add":
        return current + qty;
      case "remove":
        return Math.max(0, current - qty);
      case "set":
        return qty;
      default:
        return current;
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Stock Adjustment
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

        {/* Product Info */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-800 dark:text-gray-200">{product.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">SKU: {product.sku}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Current Stock: <span className="font-medium">{product.current_stock} {product.unit}</span>
          </p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={stockAdjustmentSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values }) => (
            <Form className="space-y-4">
              {/* Adjustment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adjustment Type *
                </label>
                <Field
                  name="adjustment_type"
                  as="select"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="add">Add Stock</option>
                  <option value="remove">Remove Stock</option>
                  <option value="set">Set Stock Level</option>
                </Field>
                <ErrorMessage name="adjustment_type" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity *
                </label>
                <Field
                  name="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter quantity"
                />
                <ErrorMessage name="quantity" component="div" className="text-red-500 text-xs mt-1" />
                
                {/* New Stock Level Preview */}
                {values.quantity && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                    <span className="text-blue-700 dark:text-blue-300">
                      New stock level: {getNewStockLevel(values.adjustment_type, values.quantity, product.current_stock)} {product.unit}
                    </span>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason *
                </label>
                <Field
                  name="reason"
                  as="select"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select reason</option>
                  <option value="received_shipment">Received Shipment</option>
                  <option value="damaged_goods">Damaged Goods</option>
                  <option value="theft_loss">Theft/Loss</option>
                  <option value="expired_goods">Expired Goods</option>
                  <option value="inventory_count">Inventory Count Adjustment</option>
                  <option value="return_from_customer">Return from Customer</option>
                  <option value="return_to_supplier">Return to Supplier</option>
                  <option value="production_consumption">Production Consumption</option>
                  <option value="other">Other</option>
                </Field>
                <ErrorMessage name="reason" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <Field
                  name="notes"
                  as="textarea"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes (optional)"
                />
                <ErrorMessage name="notes" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || stockAdjustmentMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting || stockAdjustmentMutation.isLoading
                    ? "Recording..."
                    : "Record Adjustment"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
