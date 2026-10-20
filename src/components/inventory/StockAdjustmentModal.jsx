import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createStockAdjustment } from "../../api/inventory";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { XMarkIcon } from '@heroicons/react/24/outline';
import useEscKey from "../../hooks/useEscStack";

const stockAdjustmentSchema = Yup.object().shape({
  adjustment_type: Yup.string()
    .required("Adjustment type is required")
    .oneOf(["add", "remove", "set"], "Invalid adjustment type"),
  quantity: Yup.number()
    .required("Quantity is required"),
  reason: Yup.string()
    .required("Reason is required")
    .max(200, "Reason must be 200 characters or less"),
  notes: Yup.string()
    .max(500, "Notes must be 500 characters or less"),
});

export default function StockAdjustmentModal({ product, onClose }) {
  useEscKey(onClose, Boolean(product), 20);
  const queryClient = useQueryClient();

  const stockAdjustmentMutation = useMutation({
    mutationFn: createStockAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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

  const handleSubmit = async (values, { setSubmitting }) => {
    const adjustmentData = {
      ...values,
      quantity: parseFloat(values.quantity),
    };

    try {
      await stockAdjustmentMutation.mutateAsync(adjustmentData);
    } catch {
      // handled in onError
    } finally {
      setSubmitting(false);
    }
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

  const inputClass = "w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none transition-all";
  const labelClass = "block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xl animate-fade-up overflow-hidden my-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3.5 sm:px-6 sm:py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-display tracking-tight">
            Stock Adjustment
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Product Info */}
        <div className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] px-5 py-3.5 shrink-0">
          <div className="flex justify-between items-center gap-2">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-sm sm:text-base break-words">{product.name}</h3>
              <p className="text-xs text-[var(--accent-primary)] mt-0.5">SKU: {product.sku}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="block text-xl sm:text-2xl font-mono text-[var(--text-primary)] font-bold">{product.current_stock ?? product.stock ?? 0}</span>
              <span className="text-xs text-[var(--text-secondary)]">{product.unit}</span>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 sm:p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={stockAdjustmentSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, values }) => (
              <Form className="space-y-4">
              
              {/* Adjustment Type */}
              <div>
                <label className={labelClass}>Adjustment Type *</label>
                <Field
                  name="adjustment_type"
                  as="select"
                  className={inputClass}
                >
                  <option value="add" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Add Stock (+)</option>
                  <option value="remove" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Remove Stock (-)</option>
                  <option value="set" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Set Stock Level (=)</option>
                </Field>
                <ErrorMessage name="adjustment_type" component="div" className="text-rose-500 text-xs mt-1" />
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
                <ErrorMessage name="quantity" component="div" className="text-rose-500 text-xs mt-1" />
                
                {/* New Stock Level Preview */}
                {values.quantity && (
                  <div className="mt-3 p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)] flex justify-between items-center">
                    <span className="text-xs text-[var(--text-secondary)]">New Stock Level:</span>
                    <span className="font-mono text-[var(--accent-primary)] font-bold">
                       {getNewStockLevel(values.adjustment_type, values.quantity, product.current_stock ?? product.stock ?? 0)} {product.unit}
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
                  <option value="" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Select reason...</option>
                  <option value="received_shipment" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Received Shipment</option>
                  <option value="damaged_goods" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Damaged Goods</option>
                  <option value="theft_loss" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Theft/Loss</option>
                  <option value="expired_goods" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Expired Goods</option>
                  <option value="inventory_count" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Inventory Count Adjustment</option>
                  <option value="return_from_customer" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Return from Customer</option>
                  <option value="return_to_supplier" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Return to Supplier</option>
                  <option value="production_consumption" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Production Consumption</option>
                  <option value="other" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Other</option>
                </Field>
                <ErrorMessage name="reason" component="div" className="text-rose-500 text-xs mt-1" />
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
                <ErrorMessage name="notes" component="div" className="text-rose-500 text-xs mt-1" />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || stockAdjustmentMutation.isPending}
                  className="btn-primary py-2 px-6 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {isSubmitting || stockAdjustmentMutation.isPending
                    ? "Saving..."
                    : "Confirm Adjustment"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
        </div>
      </div>
    </div>
  );
}
