import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createStockAdjustment } from "../../api/inventory";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { XMarkIcon } from '@heroicons/react/24/outline';

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

  const inputClass = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-20 sm:pt-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md bento-card !p-0 shadow-2xl shadow-purple-900/20 animate-fade-up">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white">
            Stock Adjustment
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Product Info */}
        <div className="bg-purple-500/10 border-b border-white/5 p-4">
          <div className="flex justify-between items-center gap-2">
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base break-words">{product.name}</h3>
              <p className="text-xs text-purple-300 mt-0.5">SKU: {product.sku}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="block text-xl sm:text-2xl font-mono text-white">{product.current_stock}</span>
              <span className="text-xs text-gray-400">{product.unit}</span>
            </div>
          </div>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={stockAdjustmentSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values }) => (
            <Form className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              
              {/* Adjustment Type */}
              <div>
                <label className={labelClass}>Adjustment Type *</label>
                <Field
                  name="adjustment_type"
                  as="select"
                  className={inputClass}
                >
                  <option value="add">Add Stock (+)</option>
                  <option value="remove">Remove Stock (-)</option>
                  <option value="set">Set Stock Level (=)</option>
                </Field>
                <ErrorMessage name="adjustment_type" component="div" className="text-red-400 text-xs mt-1" />
              </div>

              {/* Quantity */}
              <div>
                <label className={labelClass}>Quantity to Adjust *</label>
                <Field
                  name="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  placeholder="0.00"
                />
                <ErrorMessage name="quantity" component="div" className="text-red-400 text-xs mt-1" />
                
                {/* New Stock Level Preview */}
                {values.quantity && (
                  <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center">
                    <span className="text-xs text-gray-400">New Stock Level:</span>
                    <span className="font-mono text-purple-400 font-bold">
                       {getNewStockLevel(values.adjustment_type, values.quantity, product.current_stock)} {product.unit}
                    </span>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className={labelClass}>Reason *</label>
                <Field
                  name="reason"
                  as="select"
                  className={inputClass}
                >
                  <option value="">Select reason...</option>
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
                <ErrorMessage name="reason" component="div" className="text-red-400 text-xs mt-1" />
              </div>

              {/* Notes */}
              <div>
                <label className={labelClass}>Notes</label>
                <Field
                  name="notes"
                  as="textarea"
                  rows={2}
                  className={inputClass}
                  placeholder="Optional details..."
                />
                <ErrorMessage name="notes" component="div" className="text-red-400 text-xs mt-1" />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || stockAdjustmentMutation.isLoading}
                  className="btn-primary py-2 px-6 shadow-lg shadow-purple-500/20"
                >
                  {isSubmitting || stockAdjustmentMutation.isLoading
                    ? "Saving..."
                    : "Confirm Adjustment"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
