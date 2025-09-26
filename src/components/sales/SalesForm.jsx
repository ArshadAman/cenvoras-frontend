import React, { useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray } from "formik";
import * as Yup from "yup";
import { createSalesInvoice, updateSalesInvoice, getProducts, getCustomers } from "../../api/sales";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Product Autocomplete Component
function ProductAutocomplete({ idx, values, setFieldValue }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(values.items[idx]?.product_name || "");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();
        const productList = Array.isArray(response) ? response : response.data || response.results || [];
        setProducts(productList);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  const selectProduct = (product) => {
    setFieldValue(`items.${idx}.product_name`, product.name);
    setFieldValue(`items.${idx}.product_id`, product.id);
    setFieldValue(`items.${idx}.unit`, product.unit || 'pcs');
    setFieldValue(`items.${idx}.price`, product.price ?? 0);
    setFieldValue(`items.${idx}.hsn_code`, product.hsn_code || product.hsn_sac_code || "");
    setFieldValue(`items.${idx}.discount`, 0);
    setFieldValue(`items.${idx}.tax`, 0);
    setFieldValue(`items.${idx}.isExistingProduct`, true);
    setInputValue(product.name);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFieldValue(`items.${idx}.product_name`, value);
    setFieldValue(`items.${idx}.isExistingProduct`, false);
    setFieldValue(`items.${idx}.product_id`, null);

    if (value.trim()) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <Field name={`items.${idx}.product_name`}>
        {({ field, meta }) => (
          <div>
            <input
              {...field}
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Product name"
              className="w-full p-2 border rounded text-sm"
              autoComplete="off"
            />
            {meta.touched && meta.error && (
              <div className="text-red-500 text-xs mt-1">{meta.error}</div>
            )}
          </div>
        )}
      </Field>
      {showDropdown && (
        <div className="absolute z-10 bg-white border rounded-md shadow-lg w-full max-h-40 overflow-y-auto">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => selectProduct(product)}
            >
              <div className="font-medium">{product.name}</div>
              <div className="text-gray-500 text-xs">
                Unit: {product.unit} | Price: ₹{product.price}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Customer Autocomplete Component
function CustomerAutocomplete({ values, setFieldValue }) {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(values.customer_name || "");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await getCustomers();
        const customerList = Array.isArray(response) ? response : response.data || response.results || [];
        setCustomers(customerList);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  const selectCustomer = (customer) => {
    // Backend expects customer ID, not name
    setFieldValue('customer', customer.id);
    setFieldValue('customer_address', customer.address || '');
    setFieldValue('customer_gstin', customer.gstin || '');
    setInputValue(customer.name);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFieldValue('customer', value);  // For manual entry, store the name

    if (value.trim()) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCustomers(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <Field name="customer">
        {({ field, meta }) => (
          <div>
            <input
              {...field}
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Customer name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {meta.touched && meta.error && (
              <div className="text-red-500 text-sm mt-1">{meta.error}</div>
            )}
          </div>
        )}
      </Field>
      {showDropdown && (
        <div className="absolute z-10 bg-white border rounded-md shadow-lg w-full max-h-40 overflow-y-auto">
          {filteredCustomers.map(customer => (
            <div
              key={customer.id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => selectCustomer(customer)}
            >
              <div className="font-medium">{customer.name}</div>
              <div className="text-gray-500 text-xs">
                {customer.address} {customer.gstin && `| GSTIN: ${customer.gstin}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const SalesSchema = Yup.object().shape({
  invoice_number: Yup.string().required().min(1).max(100),
  invoice_date: Yup.string().required(),
  due_date: Yup.string().nullable(),
  customer: Yup.string().required(),
  customer_address: Yup.string().nullable(),
  customer_gstin: Yup.string().nullable().max(15),
  payment_terms: Yup.string().nullable().max(50),
  total_amount: Yup.number().required(),
  items: Yup.array().of(
    Yup.object().shape({
      product_name: Yup.string().required().min(1),
      quantity: Yup.number().required().min(1),
      unit: Yup.string().required(),
    })
  ).min(1),
});

const units = ["pcs", "kg", "ltr", "box", "meter"];

export default function SalesForm({ isOpen, onClose, editData }) {
  const queryClient = useQueryClient();
  const isEdit = !!editData;

  const createMutation = useMutation({
    mutationFn: createSalesInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesBills"] });
      toast.success("Sales bill created successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create sales bill");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateSalesInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesBills"] });
      toast.success("Sales bill updated successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update sales bill");
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-400">
          {isEdit ? "Edit Sales Bill" : "New Sales Bill"}
        </h2>
        
        <Formik
          initialValues={{
            invoice_number: editData?.invoice_number || "",
            invoice_date: editData?.invoice_date || new Date().toISOString().split('T')[0],
            due_date: editData?.due_date || "",
            customer: editData?.customer || "",
            customer_address: editData?.customer_address || "",
            customer_gstin: editData?.customer_gstin || "",
            payment_terms: editData?.payment_terms || "",
            total_amount: editData?.total_amount || "0.00",
            items: editData?.items?.map(item => ({
              product_name: item.product_detail?.name || item.product_name || "",
              product_id: item.product_detail?.id || item.product_id || null,
              quantity: item.quantity || 1,
              unit: item.unit || "pcs",
              price: item.price || 0,
              discount: item.discount || 0,
              tax: item.tax || 0,
              hsn_code: item.hsn_code || "",
              tax_rate: item.tax_rate || 0,
              amount: item.amount || 0,
              isExistingProduct: !!(item.product_detail?.id || item.product_id),
            })) || [{
              product_name: "",
              product_id: null,
              quantity: 1,
              unit: "pcs",
              price: 0,
              discount: 0,
              tax: 0,
              hsn_code: "",
              tax_rate: 0,
              amount: 0,
              isExistingProduct: false,
            }]
          }}
          validationSchema={SalesSchema}
          enableReinitialize={true}
          onSubmit={async (values, { setSubmitting, setFieldError }) => {
            // Validate items
            for (let i = 0; i < values.items.length; i++) {
              const item = values.items[i];
              if (!item.product_name || item.product_name.trim() === '') {
                setFieldError(`items.${i}.product_name`, 'Product name is required');
                toast.error(`Product name is required for item ${i + 1}`);
                setSubmitting(false);
                return;
              }
            }
            
            const validItems = values.items.filter(item => 
              item.product_name && item.product_name.trim() !== ''
            );
            
            if (validItems.length === 0) {
              toast.error('At least one item with a valid product name is required');
              setSubmitting(false);
              return;
            }
            
            try {
              const processedItems = validItems.map(item => {
                const quantity = Number(item.quantity) || 0;
                const price = Number(item.price) || 0;
                const discount = Number(item.discount) || 0;
                const tax = Number(item.tax) || 0;
                const discountAmount = ((quantity * price) * discount) / 100;
                const taxableAmount = (quantity * price) - discountAmount;
                const taxAmount = (taxableAmount * tax) / 100;
                const totalAmount = taxableAmount + taxAmount;
                
                return {
                  product_name: item.product_name,
                  product_id: item.isExistingProduct ? item.product_id : null,
                  quantity: quantity,
                  unit: item.unit,
                  price: price,
                  discount: discount,
                  tax: tax,
                  hsn_code: item.hsn_code,
                  tax_rate: item.tax_rate || 0,
                  amount: totalAmount,
                };
              });

              const totalAmount = processedItems.reduce((sum, item) => sum + item.amount, 0);

              const formData = {
                ...values,
                total_amount: totalAmount.toFixed(2),
                items: processedItems,
              };

              if (isEdit) {
                updateMutation.mutate({ id: editData.id, data: formData });
              } else {
                createMutation.mutate(formData);
              }
            } catch (error) {
              toast.error("Error processing form data");
              console.error(error);
            }
            setSubmitting(false);
          }}
        >
          {({ values, setFieldValue, isSubmitting }) => {
            // Calculate totals
            const subtotal = values.items.reduce((sum, item) => {
              const quantity = Number(item.quantity) || 0;
              const price = Number(item.price) || 0;
              return sum + (quantity * price);
            }, 0);

            const totalDiscount = values.items.reduce((sum, item) => {
              const quantity = Number(item.quantity) || 0;
              const price = Number(item.price) || 0;
              const discount = Number(item.discount) || 0;
              return sum + ((quantity * price * discount) / 100);
            }, 0);

            const totalTax = values.items.reduce((sum, item) => {
              const quantity = Number(item.quantity) || 0;
              const price = Number(item.price) || 0;
              const discount = Number(item.discount) || 0;
              const tax = Number(item.tax) || 0;
              const taxableAmount = (quantity * price) - ((quantity * price * discount) / 100);
              return sum + ((taxableAmount * tax) / 100);
            }, 0);

            const grandTotal = subtotal - totalDiscount + totalTax;

            return (
              <Form className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Invoice Number *
                    </label>
                    <Field
                      name="invoice_number"
                      type="text"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Invoice Date *
                    </label>
                    <Field
                      name="invoice_date"
                      type="date"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Date
                    </label>
                    <Field
                      name="due_date"
                      type="date"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Customer Name *
                    </label>
                    <CustomerAutocomplete values={values} setFieldValue={setFieldValue} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Customer GSTIN
                    </label>
                    <Field
                      name="customer_gstin"
                      type="text"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Customer Address
                    </label>
                    <Field
                      name="customer_address"
                      as="textarea"
                      rows="3"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Terms
                    </label>
                    <Field
                      name="payment_terms"
                      type="text"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />

                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Items</h3>
                  <FieldArray name="items">
                    {({ push, remove }) => (
                      <div>
                        {values.items.map((item, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 items-start mb-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                            {/* Product Name */}
                            <div className="col-span-3">
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Product *</label>
                              <ProductAutocomplete idx={index} values={values} setFieldValue={setFieldValue} />
                            </div>
                            
                            {/* Quantity */}
                            <div className="col-span-1">
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Qty *</label>
                              <Field
                                name={`items.${index}.quantity`}
                                type="number"
                                min="1"
                                step="0.01"
                                className="w-full p-2 border rounded text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                              />
                            </div>
                            
                            {/* Unit */}
                            <div className="col-span-1">
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Unit</label>
                              <Field
                                name={`items.${index}.unit`}
                                as="select"
                                className="w-full p-2 border rounded text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                              >
                                {units.map(unit => (
                                  <option key={unit} value={unit}>{unit}</option>
                                ))}
                              </Field>
                            </div>
                            
                            {/* Price */}
                            <div className="col-span-2">
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Price</label>
                              <Field
                                name={`items.${index}.price`}
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full p-2 border rounded text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                              />
                            </div>
                            
                            {/* Discount */}
                            <div className="col-span-1">
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Disc %</label>
                              <Field
                                name={`items.${index}.discount`}
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className="w-full p-2 border rounded text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                              />
                            </div>
                            
                            {/* Tax */}
                            <div className="col-span-1">
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Tax %</label>
                              <Field
                                name={`items.${index}.tax`}
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full p-2 border rounded text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                              />
                            </div>
                            
                            {/* HSN */}
                            <div className="col-span-2">
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">HSN</label>
                              <Field
                                name={`items.${index}.hsn_code`}
                                type="text"
                                className="w-full p-2 border rounded text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                              />
                            </div>
                            
                            {/* Remove Button */}
                            <div className="col-span-1 flex items-end">
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                disabled={values.items.length === 1}
                                className="w-full p-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={() => push({
                            product_name: "",
                            product_id: null,
                            quantity: 1,
                            unit: "pcs",
                            price: 0,
                            discount: 0,
                            tax: 0,
                            hsn_code: "",
                            tax_rate: 0,
                            amount: 0,
                            isExistingProduct: false,
                          })}
                          className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          + Add Item
                        </button>
                      </div>
                    )}
                  </FieldArray>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Total Discount:</span>
                      <span>-₹{totalDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Total Tax:</span>
                      <span>₹{totalTax.toFixed(2)}</span>
                    </div>
                    <hr className="border-gray-300 dark:border-gray-600" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Grand Total:</span>
                      <span>₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : isEdit ? "Update Bill" : "Create Bill"}
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