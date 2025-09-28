import React, { useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createSalesInvoice, updateSalesInvoice, getProducts } from "../../api/sales";
import { getCustomers } from "../../api/customers";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Product Autocomplete Component
function ProductAutocomplete({ idx, values, setFieldValue }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(values.items[idx]?.product || "");

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
    setFieldValue(`items.${idx}.product`, product.name);
    setFieldValue(`items.${idx}.product_id`, product.id);
    setFieldValue(`items.${idx}.unit`, product.unit || 'pcs');
    setFieldValue(`items.${idx}.price`, product.price ?? 0);
    // Calculate amount automatically
    const quantity = values.items[idx]?.quantity || 1;
    const amount = quantity * (product.price ?? 0);
    setFieldValue(`items.${idx}.amount`, amount);
    setFieldValue(`items.${idx}.hsn_sac_code`, product.hsn_code || product.hsn_sac_code || "");
    setFieldValue(`items.${idx}.discount`, 0);
    setFieldValue(`items.${idx}.tax`, 0);
    setFieldValue(`items.${idx}.isExistingProduct`, true);
    setInputValue(product.name);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFieldValue(`items.${idx}.product`, value);
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
      <Field name={`items.${idx}.product`}>
        {({ field, meta }) => (
          <div>
            <input
              {...field}
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Product name"
              className="w-full p-2 border rounded text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
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

  // Sync inputValue with Formik values
  useEffect(() => {
    setInputValue(values.customer_name || "");
  }, [values.customer_name]);

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
    // New API: set customer_name directly, optionally set email for Customer record creation
    setFieldValue('customer_name', customer.name);
    setFieldValue('customer_email', customer.email || '');
    setFieldValue('customer_phone', customer.phone || '');
    setFieldValue('customer_address', customer.address || '');
    setInputValue(customer.name);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFieldValue('customer_name', value);  // For manual entry, store the name

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
      <Field name="customer_name">
        {({ field, meta }) => (
          <div>
            <input
              name="customer_name"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onFocus={() => {
                if (inputValue.trim() && filteredCustomers.length > 0) {
                  setShowDropdown(true);
                }
              }}
              placeholder="Customer name"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            {meta.touched && meta.error && (
              <div className="text-red-500 text-sm mt-1">{meta.error}</div>
            )}
          </div>
        )}
      </Field>
      {showDropdown && (
        <div className="absolute z-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg w-full max-h-40 overflow-y-auto">
          {filteredCustomers.map(customer => (
            <div
              key={customer.id}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm"
              onClick={() => selectCustomer(customer)}
            >
              <div className="font-medium text-gray-900 dark:text-white">{customer.name}</div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                {customer.email && `${customer.email} | `}
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
  // Required fields
  customer_name: Yup.string().required("Customer name is required").min(1).max(255),
  invoice_number: Yup.string().required("Invoice number is required").min(1).max(100),
  invoice_date: Yup.string().required("Invoice date is required"),
  
  // Optional fields for customer record creation
  customer_email: Yup.string().email("Invalid email format").nullable(),
  customer_phone: Yup.string().nullable(),
  customer_address: Yup.string().nullable(),
  
  // Optional invoice fields
  due_date: Yup.string().nullable(),
  delivery_address: Yup.string().nullable(),
  gst_treatment: Yup.string().nullable(),
  journal: Yup.string().nullable(),
  total_amount: Yup.number().nullable(),
  
  // Items array - at least one item required
  items: Yup.array().of(
    Yup.object().shape({
      // Required item fields
      product: Yup.string().required("Product is required").min(1),
      quantity: Yup.number().required("Quantity is required").min(1),
      price: Yup.number().required("Price is required").min(0),
      amount: Yup.number().required("Amount is required").min(0),
      
      // Optional item fields
      hsn_sac_code: Yup.string().nullable(),
      unit: Yup.string().nullable(),
      discount: Yup.number().nullable().min(0),
      tax: Yup.number().nullable().min(0),
    })
  ).min(1, "At least one item is required"),
});

const units = ["pcs", "kg", "ltr", "box", "meter"];

export default function SalesForm({ isOpen, onClose, editData }) {
  const queryClient = useQueryClient();
  const isEdit = !!editData;

  const createMutation = useMutation({
    mutationFn: createSalesInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
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
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
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
            // Required fields
            customer_name: editData?.customer_name || "",
            invoice_number: editData?.invoice_number || "",
            invoice_date: editData?.invoice_date || new Date().toISOString().split('T')[0],
            
            // Optional customer fields (for Customer record creation)
            customer_email: editData?.customer_email || "",
            customer_phone: editData?.customer_phone || "",
            customer_address: editData?.customer_address || "",
            
            // Optional invoice fields
            due_date: editData?.due_date || "",
            delivery_address: editData?.delivery_address || "",
            gst_treatment: editData?.gst_treatment || "registered",
            journal: editData?.journal || "Sales",
            total_amount: editData?.total_amount || null,
            
            items: editData?.items?.map(item => ({
              product: item.product || item.product_name || "",
              product_id: item.product_id || null,
              quantity: item.quantity || 1,
              price: item.price || 0,
              amount: item.amount || (item.quantity * item.price) || 0,
              unit: item.unit || "pcs",
              hsn_sac_code: item.hsn_sac_code || item.hsn_code || "",
              discount: item.discount || 0,
              tax: item.tax || 0,
              isExistingProduct: !!(item.product_id),
            })) || [{
              product: "",
              product_id: null,
              quantity: 1,
              price: 0,
              amount: 0, // Required field
              unit: "pcs",
              hsn_sac_code: "",
              discount: 0,
              tax: 0,
              isExistingProduct: false,
            }]
          }}
          validationSchema={SalesSchema}
          enableReinitialize={true}
          onSubmit={async (values, { setSubmitting, setFieldError }) => {
            // Validate items
            for (let i = 0; i < values.items.length; i++) {
              const item = values.items[i];
              if (!item.product || item.product.trim() === '') {
                setFieldError(`items.${i}.product`, 'Product is required');
                toast.error(`Product is required for item ${i + 1}`);
                setSubmitting(false);
                return;
              }
            }
            
            const validItems = values.items.filter(item => 
              item.product && item.product.trim() !== ''
            );
            
            if (validItems.length === 0) {
              toast.error('At least one item with a valid product is required');
              setSubmitting(false);
              return;
            }
            
            try {
                            const processedItems = values.items.map(item => {
                const quantity = Number(item.quantity) || 1;
                const price = Number(item.price) || 0;
                const amount = Number(item.amount) || (quantity * price);
                
                return {
                  product: item.product, // Use product field instead of product_name
                  quantity: quantity,
                  price: price,
                  amount: amount, // Required field in new schema
                  unit: item.unit || null,
                  hsn_sac_code: item.hsn_sac_code || null,
                  discount: Number(item.discount) || null,
                  tax: Number(item.tax) || null,
                };
              });

              const totalAmount = processedItems.reduce((sum, item) => sum + item.amount, 0);

              let formData;

              if (isEdit) {
                // Edit API expects different structure with UUIDs
                formData = {
                  customer: editData.customer || editData.customer_id, // Use original customer UUID
                  invoice_number: values.invoice_number,
                  invoice_date: values.invoice_date,
                  due_date: values.due_date || null,
                  delivery_address: values.delivery_address || null,
                  gst_treatment: values.gst_treatment || null,
                  journal: values.journal || "Sales",
                  total_amount: totalAmount.toString(),
                  created_by: editData.created_by, // Use original created_by UUID
                  items: processedItems.map(item => ({
                    product: item.product_id || item.product, // Use product UUID if available
                    quantity: item.quantity,
                    unit: item.unit || null,
                    price: item.price.toString(),
                    discount: item.discount ? item.discount.toString() : null,
                    tax: item.tax ? item.tax.toString() : null,
                    amount: item.amount.toString(),
                  }))
                };
              } else {
                // Create API expects customer_name structure
                formData = {
                  // Required fields
                  customer_name: values.customer_name,
                  invoice_number: values.invoice_number,
                  invoice_date: values.invoice_date,
                  items: processedItems,
                  
                  // Optional customer fields (for Customer record creation)
                  ...(values.customer_email && { customer_email: values.customer_email }),
                  ...(values.customer_phone && { customer_phone: values.customer_phone }),
                  ...(values.customer_address && { customer_address: values.customer_address }),
                  
                  // Optional invoice fields
                  ...(values.due_date && { due_date: values.due_date }),
                  ...(values.delivery_address && { delivery_address: values.delivery_address }),
                  ...(values.gst_treatment && { gst_treatment: values.gst_treatment }),
                  ...(values.journal && { journal: values.journal }),
                  ...(totalAmount && { total_amount: totalAmount }),
                };
              }

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
                    <ErrorMessage name="customer_name" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Customer Email <span className="text-xs text-gray-500">(optional - creates customer record)</span>
                    </label>
                    <Field
                      name="customer_email"
                      type="email"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="customer@example.com"
                    />
                  </div>
                </div>

                {/* Additional Customer Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Customer Phone
                    </label>
                    <Field
                      name="customer_phone"
                      type="tel"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Customer Address
                    </label>
                    <Field
                      name="customer_address"
                      as="textarea"
                      rows="2"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Customer's address"
                    />
                  </div>
                </div>

                {/* Address & Additional Fields */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Delivery Address
                    </label>
                    <Field
                      name="delivery_address"
                      as="textarea"
                      rows="3"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="123 Delivery Address, City, State"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      GST Treatment
                    </label>
                    <Field
                      name="gst_treatment"
                      as="select"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="registered">Registered</option>
                      <option value="unregistered">Unregistered</option>
                      <option value="export">Export</option>
                    </Field>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Journal
                    </label>
                    <Field
                      name="journal"
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
                              <Field name={`items.${index}.quantity`}>
                                {({ field }) => (
                                  <input
                                    {...field}
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    className="w-full p-2 border rounded text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                    onChange={(e) => {
                                      const quantity = e.target.value;
                                      setFieldValue(`items.${index}.quantity`, quantity);
                                      
                                      // Calculate amount when both quantity and price exist
                                      if (quantity && values.items[index]?.price) {
                                        const price = parseFloat(values.items[index].price) || 0;
                                        const amount = parseFloat(quantity) * price;
                                        setFieldValue(`items.${index}.amount`, amount);
                                      }
                                    }}
                                  />
                                )}
                              </Field>
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
                            <div className="col-span-1">
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Price</label>
                              <Field name={`items.${index}.price`}>
                                {({ field }) => (
                                  <input
                                    {...field}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full p-2 border rounded text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                    onChange={(e) => {
                                      const price = e.target.value;
                                      setFieldValue(`items.${index}.price`, price);
                                      
                                      // Calculate amount when both price and quantity exist
                                      if (price && values.items[index]?.quantity) {
                                        const quantity = parseFloat(values.items[index].quantity) || 0;
                                        const amount = parseFloat(price) * quantity;
                                        setFieldValue(`items.${index}.amount`, amount);
                                      }
                                    }}
                                  />
                                )}
                              </Field>
                            </div>

                            {/* Amount */}
                            <div className="col-span-1">
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Amount *</label>
                              <Field
                                name={`items.${index}.amount`}
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full p-2 border rounded text-sm bg-gray-100 dark:bg-gray-500 dark:border-gray-400 dark:text-white"
                                readOnly
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
                            
                            {/* HSN/SAC */}
                            <div className="col-span-1">
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">HSN/SAC</label>
                              <Field
                                name={`items.${index}.hsn_sac_code`}
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