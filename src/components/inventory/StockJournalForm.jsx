import React, { useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createStockJournal } from "../../api/stock_journal";
import { getProducts, getWarehouses, getProductBatches } from "../../api/inventory";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { XMarkIcon } from '@heroicons/react/24/outline';

const JournalSchema = Yup.object().shape({
  date: Yup.date().required("Date is required"),
  warehouse: Yup.string().required("Warehouse is required"),
  adjustment_type: Yup.string().required("Type is required"),
  items: Yup.array().of(
    Yup.object().shape({
      product: Yup.string().required("Product is required"),
      batch: Yup.string().nullable(),
      quantity: Yup.number().required("Qty is required").min(1, "Qty must be at least 1"),
    })
  ).min(1, "At least one item is required"),
});

// Product Autocomplete
function ProductAutocomplete({ idx, values, setFieldValue, products }) {
  const [filtered, setFiltered] = useState([]);
  const [show, setShow] = useState(false);
  const [input, setInput] = useState(values.items[idx]?.product_name || "");

  const select = (p) => {
    setFieldValue(`items.${idx}.product`, p.id);
    setFieldValue(`items.${idx}.product_name`, p.name);
    setFieldValue(`items.${idx}.unit`, p.unit);
    setInput(p.name);
    setShow(false);
    // Reset batch when product changes
    setFieldValue(`items.${idx}.batch`, ""); 
  };

  const handleInput = (e) => {
    const v = e.target.value;
    setInput(v);
    setFieldValue(`items.${idx}.product_name`, v);
    if (v.trim()) {
      setFiltered(products.filter(p => p.name.toLowerCase().includes(v.toLowerCase())));
      setShow(true);
    } else {
      setShow(false);
    }
  };

  return (
    <div className="relative">
      <input
        value={input}
        onChange={handleInput}
        placeholder="Search Item..."
        className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none"
      />
      {show && (
        <ul className="absolute z-50 mt-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl w-full max-h-48 overflow-y-auto">
          {filtered.slice(0, 20).map(p => (
            <li
              key={p.id}
              onClick={() => select(p)}
              className="px-4 py-2 hover:bg-[var(--bg-primary)] cursor-pointer text-sm text-[var(--text-primary)]"
            >
              {p.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Batch Dropdown (Dependent on Product)
function BatchSelect({ idx, values, setFieldValue }) {
    const { data: batches } = useQuery({ 
        queryKey: ["batches", values.items[idx].product], 
        queryFn: () => getProductBatches({ product: values.items[idx].product }), 
        enabled: !!values.items[idx].product
    });

    const batchesList = Array.isArray(batches) ? batches : batches?.results || [];
    const productBatches = batchesList;

    return (
        <Field
          as="select"
          name={`items.${idx}.batch`}
          className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none"
        >
            <option value="" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
              {productBatches.length === 0 ? 'No batch (DEFAULT)' : 'Optional — or DEFAULT'}
            </option>
            {productBatches.map(b => (
                <option key={b.id} value={b.id} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
                    {b.batch_number}{b.expiry_date ? ` (Exp: ${b.expiry_date})` : ''}
                </option>
            ))}
        </Field>
    );
}


export default function StockJournalForm({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { data: productsData } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const products = Array.isArray(productsData) ? productsData : productsData?.results || [];

  const { data: warehousesData } = useQuery({ queryKey: ["warehouses"], queryFn: getWarehouses });
  const warehouses = Array.isArray(warehousesData) ? warehousesData : warehousesData?.results || [];

  const mutation = useMutation({
    mutationFn: createStockJournal,
    onSuccess: () => {
      queryClient.invalidateQueries(["stock-journals"]);
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["stockPoints"]);
      queryClient.invalidateQueries(["warehouses"]);
      toast.success("Journal posted — warehouse & product stock updated");
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.product || err?.response?.data?.detail || "Failed to post journal"),
  });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl bento-card !p-0 border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
        
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Stock Adjustment Journal</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <Formik
          initialValues={{
            date: new Date().toLocaleDateString('sv-SE'),
            warehouse: "",
            adjustment_type: "damage",
            notes: "",
            items: [{ product: "", product_name: "", batch: "", quantity: 1, unit: "" }]
          }}
          validationSchema={JournalSchema}
          onSubmit={(values, { setSubmitting }) => {
            const multiplier = ['excess', 'internal_return'].includes(values.adjustment_type) ? 1 : -1;
            
            const payload = {
                ...values,
                items: values.items.map(item => ({
                    product: item.product,
                    ...(item.batch ? { batch: item.batch } : {}),
                    quantity: Number(item.quantity) * multiplier
                }))
            };
            mutation.mutate(payload);
            setSubmitting(false);
          }}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Date</label>
                        <Field name="date" type="date" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Warehouse</label>
                        <Field as="select" name="warehouse" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none">
                            <option value="" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Select Warehouse</option>
                            {warehouses.map(w => <option key={w.id} value={w.id} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{w.name}</option>)}
                        </Field>
                        <ErrorMessage name="warehouse" component="div" className="text-rose-500 text-xs" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Type</label>
                        <Field as="select" name="adjustment_type" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none">
                            <option value="damage" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Damage / Spoilage (Reduce)</option>
                            <option value="shortage" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Shortage / Theft (Reduce)</option>
                            <option value="internal_use" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Internal Consumption (Reduce)</option>
                            <option value="excess" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Excess / Found (Increase)</option>
                            <option value="internal_return" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Internal Return (Increase)</option>
                        </Field>
                    </div>
                </div>

                <div className="bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-subtle)]">
                    <FieldArray name="items">
                        {({ push, remove }) => (
                            <div className="space-y-3">
                                <div className="grid grid-cols-12 gap-3 text-xs text-[var(--text-secondary)] uppercase font-semibold mb-2">
                                    <div className="col-span-5">Product</div>
                                    <div className="col-span-3">Batch</div>
                                    <div className="col-span-3">Quantity</div>
                                    <div className="col-span-1"></div>
                                </div>
                                {values.items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-3 items-start">
                                        <div className="col-span-5">
                                            <ProductAutocomplete idx={index} values={values} setFieldValue={setFieldValue} products={products} />
                                            <ErrorMessage name={`items.${index}.product`} component="div" className="text-rose-500 text-xs" />
                                        </div>
                                        <div className="col-span-3">
                                            <BatchSelect idx={index} values={values} setFieldValue={setFieldValue} />
                                            <ErrorMessage name={`items.${index}.batch`} component="div" className="text-rose-500 text-xs" />
                                        </div>
                                        <div className="col-span-3 flex gap-2">
                                            <Field name={`items.${index}.quantity`} type="number" className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none" />
                                            <span className="text-[var(--text-secondary)] self-center text-xs">{item.unit || 'pcs'}</span>
                                        </div>
                                        <div className="col-span-1 text-right">
                                            <button type="button" onClick={() => remove(index)} className="text-rose-500 hover:text-rose-600 p-1">
                                                <XMarkIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => push({ product: "", quantity: 1 })} className="text-[var(--accent-primary)] hover:underline text-sm font-medium mt-2 flex items-center gap-1">
                                    + Add Item
                                </button>
                            </div>
                        )}
                    </FieldArray>
                </div>

                <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Notes</label>
                    <Field as="textarea" name="notes" rows="2" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none" />
                </div>

                <div className="flex justify-end pt-4 border-t border-[var(--border-subtle)]">
                    <button type="submit" disabled={isSubmitting} className="btn-primary">
                        {isSubmitting ? "Posting..." : "Post Journal"}
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
