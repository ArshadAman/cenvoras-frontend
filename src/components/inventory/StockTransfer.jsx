import React, { useState, useEffect } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWarehouses, getProducts, getStockPoints, createStockMovement } from "../../api/inventory";
import { toast } from "react-toastify";

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
  const [selectedProductStock, setSelectedProductStock] = useState({}); // Map product ID to available batches

  // Queries
  // Queries
  const { data: warehouses } = useQuery({ queryKey: ["warehouses"], queryFn: getWarehouses });
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: () => getProducts() });
  // We need stock points to filter batches valid for source warehouse
  // However, fetching ALL stock points might be heavy. 
  // Ideally, we fetch stock points for the selected Source Warehouse.
  const [sourceId, setSourceId] = useState(null);
  
  const { data: stockPoints } = useQuery({
    queryKey: ["stockPoints", sourceId], 
    queryFn: () => getStockPoints({ warehouse: sourceId }),
    enabled: !!sourceId
  });

  const createMutation = useMutation({
    mutationFn: createStockMovement,
    onSuccess: () => {
      queryClient.invalidateQueries(["stockPoints"]);
      queryClient.invalidateQueries(["stockMovements"]); // or "transfers" if we used that key
      toast.success("Stock Transfer created successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create transfer");
    }
  });

  const handleSubmit = (values) => {
    // Transform to backend format
    const payload = {
      source_warehouse: values.source_warehouse,
      destination_warehouse: values.destination_warehouse,
      status: 'completed', // Auto-complete for now
      items: values.items.map(item => ({
        product: item.product,
        batch: item.batch,
        quantity: item.quantity
      }))
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">New Stock Transfer</h2>
        
        <Formik
          initialValues={{
            source_warehouse: "",
            destination_warehouse: "",
            items: [{ product: "", batch: "", quantity: 1 }]
          }}
          validationSchema={transferSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => {
            // Update sourceId state when form value changes to trigger query
            useEffect(() => {
              if (values.source_warehouse !== sourceId) {
                setSourceId(values.source_warehouse);
              }
            }, [values.source_warehouse]);

            return (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Source Warehouse</label>
                    <Field as="select" name="source_warehouse" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border">
                      <option value="">Select Source</option>
                      {warehouses?.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </Field>
                    <ErrorMessage name="source_warehouse" component="div" className="text-red-500 text-sm" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Destination Warehouse</label>
                    <Field as="select" name="destination_warehouse" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border">
                      <option value="">Select Destination</option>
                      {warehouses?.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </Field>
                    <ErrorMessage name="destination_warehouse" component="div" className="text-red-500 text-sm" />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-2 dark:text-white">Items</h3>
                  <FieldArray name="items">
                    {({ push, remove }) => (
                      <div className="space-y-2">
                        {values.items.map((item, index) => {
                          // Filter batches for selected product available in source warehouse
                          const availableBatches = stockPoints?.filter(sp => 
                            sp.batch.product === item.product && sp.quantity > 0
                          ) || [];

                          return (
                            <div key={index} className="flex gap-2 items-start border p-2 rounded relative">
                              <div className="flex-1">
                                <Field as="select" name={`items.${index}.product`} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white">
                                  <option value="">Select Product</option>
                                  {products?.results?.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </Field>
                                <ErrorMessage name={`items.${index}.product`} component="div" className="text-red-500 text-xs" />
                              </div>

                              <div className="flex-1">
                                <Field as="select" name={`items.${index}.batch`} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" disabled={!item.product || !sourceId}>
                                  <option value="">Select Batch</option>
                                  {availableBatches.map(sp => (
                                    <option key={sp.batch.id} value={sp.batch.id}>
                                      {sp.batch.batch_number} (Qty: {sp.quantity})
                                    </option>
                                  ))}
                                </Field>
                                <ErrorMessage name={`items.${index}.batch`} component="div" className="text-red-500 text-xs" />
                              </div>

                              <div className="w-24">
                                <Field type="number" name={`items.${index}.quantity`} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Qty" />
                                <ErrorMessage name={`items.${index}.quantity`} component="div" className="text-red-500 text-xs" />
                              </div>

                              <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 p-2">
                                X
                              </button>
                            </div>
                          );
                        })}
                        <button type="button" onClick={() => push({ product: "", batch: "", quantity: 1 })} className="text-blue-500 hover:text-blue-700 text-sm">
                          + Add Item
                        </button>
                      </div>
                    )}
                  </FieldArray>
                  <ErrorMessage name="items" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={createMutation.isLoading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                    {createMutation.isLoading ? "Transferring..." : "Complete Transfer"}
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
}
