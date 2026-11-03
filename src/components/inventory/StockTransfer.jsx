import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWarehouses, getProducts, getStockPoints, createStockMovement, previewStockTransfer, printTransferChallan } from "../../api/inventory";
import { toast } from "react-toastify";
import { 
  XMarkIcon, 
  ArrowsRightLeftIcon, 
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

// Schema
const transferSchema = Yup.object().shape({
  source_warehouse: Yup.string().required("Source Warehouse is required"),
  destination_warehouse: Yup.string()
    .required("Destination Warehouse is required")
    .notOneOf([Yup.ref('source_warehouse')], "Source and Destination cannot be the same"),
  items: Yup.array().of(
    Yup.object().shape({
      product: Yup.string().required("Product is required"),
      batch: Yup.string().required("Batch is required"),
      quantity: Yup.number()
        .required("Quantity is required")
        .min(1, "Quantity must be at least 1")
    })
  ).min(1, "At least one item is required")
});

export default function StockTransfer({ onClose }) {
  const queryClient = useQueryClient();
  const [sourceId, setSourceId] = useState(null);
  // Pre-save warnings (e.g. e-way bill above ₹50k); the second click confirms.
  const [preview, setPreview] = useState(null);

  // Queries
  const { data: warehousesData } = useQuery({ 
    queryKey: ["warehouses"], 
    queryFn: getWarehouses 
  });
  
  const { data: productsData } = useQuery({ 
    queryKey: ["products"], 
    queryFn: () => getProducts() 
  });
  
  const { data: stockPointsData } = useQuery({
    queryKey: ["stockPoints", sourceId], 
    queryFn: () => getStockPoints({ warehouse: sourceId }),
    enabled: !!sourceId
  });

  // Safe data extraction
  const warehouses = Array.isArray(warehousesData) ? warehousesData : warehousesData?.results || warehousesData?.data || [];
  const products = Array.isArray(productsData) ? productsData : productsData?.results || productsData?.data || [];
  const stockPoints = Array.isArray(stockPointsData) ? stockPointsData : stockPointsData?.results || stockPointsData?.data || [];

  const createMutation = useMutation({
    mutationFn: createStockMovement,
    onSuccess: (data) => {
      if (data?.id) printTransferChallan(data.id).catch(() => {});
      queryClient.invalidateQueries(["stockPoints"]);
      queryClient.invalidateQueries(["stockMovements"]);
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["warehouses"]);
      toast.success(data?.challan_number
        ? `Stock transferred. Delivery challan ${data.challan_number} (no GST).`
        : "Stock Transfer completed successfully!");
      onClose();
    },
    onError: (error) => {
      const d = error?.response?.data;
      const itemErr = Array.isArray(d?.items) ? d.items.filter(x => typeof x === 'string').join(' ') : '';
      toast.error(itemErr || d?.detail || d?.message || error?.message || "Failed to create transfer");
    }
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    const payload = {
      source_warehouse: values.source_warehouse,
      destination_warehouse: values.destination_warehouse,
      status: 'completed',
      items: values.items.map(item => ({
        product: item.product,
        batch: item.batch,
        quantity: item.quantity
      }))
    };
    const key = JSON.stringify(payload);
    if (!preview || preview.key !== key) {
      try {
        const p = await previewStockTransfer(payload);
        if (p?.warnings?.length) {
          setPreview({ key, warnings: p.warnings, total: p.total_value });
          if (setSubmitting) setSubmitting(false);
          return; // show the warning first; clicking again confirms
        }
      } catch (error) {
        const d = error?.response?.data;
        const itemErr = Array.isArray(d?.items) ? d.items.filter(x => typeof x === 'string').join(' ') : '';
        toast.error(itemErr || d?.error || "Couldn't check this transfer");
        if (setSubmitting) setSubmitting(false);
        return;
      }
    }
    try {
      await createMutation.mutateAsync(payload);
    } catch {
      // handled in onError
    } finally {
      if (setSubmitting) setSubmitting(false);
    }
  };

  // Get batches for a product at the SOURCE location (stock-point API returns
  // batch as an id and product as product_id).
  const getBatchesForProduct = (productId) => {
    if (!productId || !stockPoints.length) return [];
    return stockPoints.filter(sp => {
      const spProductId = sp?.product_id ?? sp?.batch?.product ?? sp?.product;
      const spWarehouse = sp?.warehouse?.id ?? sp?.warehouse;
      return String(spProductId) === String(productId)
        && (!sourceId || String(spWarehouse) === String(sourceId))
        && Number(sp?.quantity || 0) > 0;
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bento-card !p-0 border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-primary)]/15 rounded-xl border border-[var(--accent-primary)]/30">
              <ArrowsRightLeftIcon className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Stock Transfer</h2>
              <p className="text-xs text-[var(--text-secondary)]">Move inventory between warehouses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <Formik
          initialValues={{
            source_warehouse: "",
            destination_warehouse: "",
            items: [{ product: "", batch: "", quantity: 1 }]
          }}
          validationSchema={transferSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form>
              <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
                
                {/* Warehouse Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Source Warehouse</label>
                    <Field
                      as="select"
                      name="source_warehouse"
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none"
                      onChange={(e) => {
                        setFieldValue('source_warehouse', e.target.value);
                        setSourceId(e.target.value || null);
                        // Clear product selections when warehouse changes
                        values.items.forEach((_, idx) => {
                          setFieldValue(`items.${idx}.product`, "");
                          setFieldValue(`items.${idx}.batch`, "");
                        });
                      }}
                    >
                      <option value="" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Select Source</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{w.name}</option>
                      ))}
                    </Field>
                    <ErrorMessage name="source_warehouse" component="div" className="text-rose-500 text-xs mt-1" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Destination Warehouse</label>
                    <Field
                      as="select"
                      name="destination_warehouse"
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none"
                    >
                      <option value="" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Select Destination</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{w.name}</option>
                      ))}
                    </Field>
                    <ErrorMessage name="destination_warehouse" component="div" className="text-rose-500 text-xs mt-1" />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">Items to Transfer</label>
                  
                  <FieldArray name="items">
                    {({ push, remove }) => (
                      <div className="space-y-3">
                        {values.items.map((item, index) => {
                          const batches = getBatchesForProduct(item.product);
                          
                          return (
                            <div key={index} className="flex gap-3 items-start p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg">
                              {/* Product */}
                              <div className="flex-1">
                                <Field
                                  as="select"
                                  name={`items.${index}.product`}
                                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm"
                                  onChange={(e) => {
                                    setFieldValue(`items.${index}.product`, e.target.value);
                                    setFieldValue(`items.${index}.batch`, "");
                                  }}
                                >
                                  <option value="" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Select Product</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">{p.name}</option>
                                  ))}
                                </Field>
                                <ErrorMessage name={`items.${index}.product`} component="div" className="text-rose-500 text-xs mt-1" />
                              </div>

                              {/* Batch */}
                              <div className="flex-1">
                                <Field
                                  as="select"
                                  name={`items.${index}.batch`}
                                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm disabled:opacity-50"
                                  disabled={!item.product || !sourceId}
                                >
                                  <option value="" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                                    {!sourceId ? 'Select source first' : !item.product ? 'Select product' : 'Select Batch'}
                                  </option>
                                  {batches.map(sp => (
                                    <option key={sp?.id} value={sp?.batch?.id ?? sp?.batch} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                                      {sp?.batch?.batch_number || sp?.batch_number || 'Batch'} (Qty: {sp?.quantity || 0})
                                    </option>
                                  ))}
                                </Field>
                                <ErrorMessage name={`items.${index}.batch`} component="div" className="text-rose-500 text-xs mt-1" />
                              </div>

                              {/* Quantity */}
                              <div className="w-20">
                                <Field
                                  type="number"
                                  name={`items.${index}.quantity`}
                                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm text-center"
                                  min="1"
                                />
                                <ErrorMessage name={`items.${index}.quantity`} component="div" className="text-rose-500 text-xs mt-1" />
                              </div>

                              {/* Remove */}
                              <button
                                type="button"
                                onClick={() => values.items.length > 1 && remove(index)}
                                disabled={values.items.length === 1}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => push({ product: "", batch: "", quantity: 1 })}
                          className="w-full py-2 border border-dashed border-[var(--border-subtle)] rounded-lg text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--accent-primary)]/5 text-sm flex items-center justify-center gap-2"
                        >
                          <PlusIcon className="w-4 h-4" />
                          Add Item
                        </button>
                      </div>
                    )}
                  </FieldArray>
                </div>
              </div>

              {preview?.warnings?.length > 0 && (
                <div className="mx-5 mb-2 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-600 text-sm">
                  {preview.warnings.map((w, i) => <p key={i}>{w}</p>)}
                  <p className="mt-1 text-xs">Value at weighted-average cost: ₹{Number(preview.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Click "Complete Transfer" again to save.</p>
                </div>
              )}

              {/* Footer */}
              <div className="p-5 border-t border-[var(--border-subtle)] flex justify-end gap-3 bg-[var(--bg-surface)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || isSubmitting}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--text-on-accent)]/30 border-t-[var(--text-on-accent)]" />
                      Transferring...
                    </>
                  ) : (
                    <>
                      <ArrowsRightLeftIcon className="w-4 h-4" />
                      Complete Transfer
                    </>
                  )}
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
