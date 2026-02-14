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
      batch: Yup.string().required("Batch is required"),
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
      <input value={input} onChange={handleInput} placeholder="Search Item..." className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
      {show && (
        <ul className="absolute z-50 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl w-full max-h-48 overflow-y-auto">
          {filtered.slice(0, 20).map(p => (
            <li key={p.id} onClick={() => select(p)} className="px-4 py-2 hover:bg-white/5 cursor-pointer text-sm text-gray-300">
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
    // TODO: Ideally fetch batches for this product from API.
    // For now, we need to fetch all batches or filter them. 
    // Since we don't have a "getBatchesByProduct" API easily exposed here without refactoring, 
    // let's fetch all active batches and filter in JS (not scalable but okay for Phase 1 small data).
    // Better: Helper API component.
    
    // Let's assume we fetch all batches for now.
    const { data: batches } = useQuery({ 
        queryKey: ["batches", values.items[idx].product], 
        queryFn: () => getProductBatches({ product: values.items[idx].product }), 
        enabled: !!values.items[idx].product
    });

    // API now filters by product, so we can use the list directly
    const batchesList = Array.isArray(batches) ? batches : batches?.results || [];
    const productBatches = batchesList;

    return (
        <Field as="select" name={`items.${idx}.batch`} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
            <option value="">Select Batch</option>
            {productBatches.map(b => (
                <option key={b.id} value={b.id}>
                    {b.batch_number} (Exp: {b.expiry_date})
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
  
  // We need to fetch batches too. 
  // IMPORTANT: We need to make sure getProductBatches exists. 
  // I will check api/inventory.js in next step. For now assume it works or fail gracefully.

  const mutation = useMutation({
    mutationFn: createStockJournal,
    onSuccess: () => {
      queryClient.invalidateQueries(["stock-journals"]);
      toast.success("Journal Posted!");
      onClose();
    },
    onError: () => toast.error("Failed to post journal"),
  });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl bg-[#111] border border-white/10 rounded-xl shadow-2xl p-0 animate-fade-up">
        
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white">Stock Adjustment Journal</h2>
          <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-400" /></button>
        </div>

        <Formik
          initialValues={{
            date: new Date().toISOString().split('T')[0],
            warehouse: "",
            adjustment_type: "damage",
            notes: "",
            items: [{ product: "", product_name: "", batch: "", quantity: 1, unit: "" }]
          }}
          validationSchema={JournalSchema}
          onSubmit={(values, { setSubmitting }) => {
            // Transform quantity based on type
            const multiplier = ['excess', 'internal_return'].includes(values.adjustment_type) ? 1 : -1;
            
            const payload = {
                ...values,
                items: values.items.map(item => ({
                    product: item.product,
                    batch: item.batch,
                    quantity: Number(item.quantity) * multiplier
                }))
            };
            mutation.mutate(payload);
            setSubmitting(false);
          }}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Date</label>
                        <Field name="date" type="date" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Warehouse</label>
                        <Field as="select" name="warehouse" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-white">
                            <option value="">Select Warehouse</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </Field>
                        <ErrorMessage name="warehouse" component="div" className="text-red-400 text-xs" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Type</label>
                        <Field as="select" name="adjustment_type" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-white">
                            <option value="damage">Damage / Spoilage (Reduce)</option>
                            <option value="shortage">Shortage / Theft (Reduce)</option>
                            <option value="internal_use">Internal Consumption (Reduce)</option>
                            <option value="excess">Excess / Found (Increase)</option>
                            <option value="internal_return">Internal Return (Increase)</option>
                        </Field>
                    </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <FieldArray name="items">
                        {({ push, remove }) => (
                            <div className="space-y-3">
                                <div className="grid grid-cols-12 gap-3 text-xs text-gray-500 uppercase font-medium mb-2">
                                    <div className="col-span-5">Product</div>
                                    <div className="col-span-3">Batch</div>
                                    <div className="col-span-3">Quantity</div>
                                    <div className="col-span-1"></div>
                                </div>
                                {values.items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-3 items-start">
                                        <div className="col-span-5">
                                            <ProductAutocomplete idx={index} values={values} setFieldValue={setFieldValue} products={products} />
                                            <ErrorMessage name={`items.${index}.product`} component="div" className="text-red-400 text-xs" />
                                        </div>
                                        <div className="col-span-3">
                                            {/* We need a way to load batches. Using a simple placeholder if API is missing */}
                                            <BatchSelect idx={index} values={values} setFieldValue={setFieldValue} />
                                            <ErrorMessage name={`items.${index}.batch`} component="div" className="text-red-400 text-xs" />
                                        </div>
                                        <div className="col-span-3 flex gap-2">
                                            <Field name={`items.${index}.quantity`} type="number" className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white" />
                                            <span className="text-gray-500 self-center text-xs">{item.unit || 'pcs'}</span>
                                        </div>
                                        <div className="col-span-1 text-right">
                                            <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-white">
                                                <XMarkIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => push({ product: "", quantity: 1 })} className="text-purple-400 text-sm mt-2">
                                    + Add Item
                                </button>
                            </div>
                        )}
                    </FieldArray>
                </div>

                <div>
                    <label className="block text-xs text-gray-400 mb-1">Notes</label>
                    <Field as="textarea" name="notes" rows="2" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-white" />
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10">
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
