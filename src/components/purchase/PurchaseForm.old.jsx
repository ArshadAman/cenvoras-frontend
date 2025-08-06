import React, { useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray, useFormikContext } from "formik";
import * as Yup from "yup";
import { createPurchaseBill, updatePurchaseBill, getProducts, createProduct, updateProduct } from "../../api/purchase";
import { toast } from "react-toastify";

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
    setFieldValue(`items.${idx}.purchase_price`, product.purchase_price || 0);
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
              className="border rounded-md px-3 py-2 text-base w-full"
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
                Unit: {product.unit} | Price: ₹{product.purchase_price}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Validation schema
const PurchaseSchema = Yup.object().shape({
  bill_number: Yup.string().required("Required"),
  bill_date: Yup.string().required("Required"),
  vendor_name: Yup.string().required("Required"),
  journal: Yup.string().required("Required"),
  total_amount: Yup.string().required("Required"),
  items: Yup.array().of(
    Yup.object().shape({
      product_name: Yup.string().trim().required("Product name is required").min(1, "Product name cannot be empty"),
      quantity: Yup.number().required("Required").min(1, "Must be at least 1"),
      unit: Yup.string().required("Required"),
      purchase_price: Yup.number().required("Required").min(0, "Must be non-negative"),
    })
  ).min(1, "At least one item is required"),
});

export default function PurchaseForm({ bill, onClose }) {
  const isEdit = !!bill;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-h-[90vh] overflow-y-auto" style={{ maxWidth: "70vw", minWidth: "350px" }}>
        <h2 className="text-xl font-bold mb-4">
          {isEdit ? "Edit Purchase Bill" : "New Purchase Bill"}
        </h2>
        
        <Formik
          initialValues={{
            bill_number: bill?.bill_number || "",
            bill_date: bill?.bill_date || new Date().toISOString().split('T')[0],
            due_date: bill?.due_date || "",
            vendor_name: bill?.vendor_name || "",
            vendor_address: bill?.vendor_address || "",
            vendor_gstin: bill?.vendor_gstin || "",
            gst_treatment: bill?.gst_treatment || "",
            journal: bill?.journal || "",
            total_amount: bill?.total_amount || "",
            items: bill?.items?.map(item => ({
              product_name: item.product_detail?.name || item.product_name || "",
              product_id: item.product_detail?.id || item.product_id || null,
              quantity: item.quantity || 1,
              unit: item.unit || "pcs",
              purchase_price: item.purchase_price || 0,
              discount: item.discount || 0,
              tax: item.tax || 0,
              amount: item.amount || 0,
              isExistingProduct: !!(item.product_detail?.id || item.product_id),
            })) || [{
              product_name: "",
              product_id: null,
              quantity: 1,
              unit: "pcs",
              purchase_price: 0,
              discount: 0,
              tax: 0,
              amount: 0,
              isExistingProduct: false,
            }]
          }}
          validationSchema={PurchaseSchema}
          enableReinitialize={true}
          onSubmit={async (values, { setSubmitting, setFieldError }) => {
            // Validate that all items have valid product names
            for (let i = 0; i < values.items.length; i++) {
              const item = values.items[i];
              if (!item.product_name || item.product_name.trim() === '') {
                setFieldError(`items.${i}.product_name`, 'Product name is required');
                toast.error(`Product name is required for item ${i + 1}`);
                setSubmitting(false);
                return;
              }
            }
            
            // Filter out any items that might be empty
            const validItems = values.items.filter(item => 
              item.product_name && item.product_name.trim() !== ''
            );
            
            if (validItems.length === 0) {
              toast.error('At least one item with a valid product name is required');
              setSubmitting(false);
              return;
            }
            
            try {
              // Handle product creation/updates first
              const processedItems = [];
              
              for (const item of validItems) {
                let productId = item.product_id;
                const trimmedProductName = item.product_name.trim();
                
                if (!trimmedProductName) {
                  throw new Error(`Product name cannot be empty for item ${validItems.indexOf(item) + 1}`);
                }
                
                if (!item.isExistingProduct && trimmedProductName) {
                  // Create new product
                  try {
                    const newProductData = {
                      name: trimmedProductName,
                      unit: item.unit || 'pcs',
                      purchase_price: parseFloat(item.purchase_price) || 0,
                      selling_price: parseFloat(item.purchase_price) || 0,
                      hsn_code: '',
                      tax_rate: 0,
                      low_stock_alert: 10
                    };
                    
                    const newProduct = await createProduct(newProductData);
                    productId = newProduct.id;
                  } catch (error) {
                    console.error('Error creating product:', error);
                    toast.error(`Error creating product "${trimmedProductName}": ${error.message}`);
                    setSubmitting(false);
                    return;
                  }
                }
                
                processedItems.push({
                  product_id: productId,
                  quantity: parseInt(item.quantity) || 1,
                  unit: item.unit || 'pcs',
                  purchase_price: parseFloat(item.purchase_price) || 0,
                  discount: parseFloat(item.discount) || 0,
                  tax: parseFloat(item.tax) || 0,
                  amount: parseFloat(item.amount) || 0,
                });
              }
              
              const purchaseData = {
                bill_number: values.bill_number,
                bill_date: values.bill_date,
                due_date: values.due_date || null,
                vendor_name: values.vendor_name,
                vendor_address: values.vendor_address || null,
                vendor_gstin: values.vendor_gstin || null,
                gst_treatment: values.gst_treatment || null,
                journal: values.journal,
                total_amount: parseFloat(values.total_amount) || 0,
                items: processedItems
              };
              
              if (isEdit) {
                await updatePurchaseBill(bill.id, purchaseData);
                toast.success("Purchase bill updated successfully!");
              } else {
                await createPurchaseBill(purchaseData);
                toast.success("Purchase bill created successfully!");
              }
              
              onClose();
            } catch (error) {
              console.error('Error saving purchase bill:', error);
              toast.error(`Error saving purchase bill: ${error.message}`);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, isValid, values, setFieldValue }) => (
            <Form className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bill Number *</label>
                  <Field name="bill_number">
                    {({ field, meta }) => (
                      <div>
                        <input {...field} className="border rounded-md px-3 py-2 text-base w-full" placeholder="Enter bill number" />
                        {meta.touched && meta.error && <div className="text-red-500 text-xs mt-1">{meta.error}</div>}
                      </div>
                    )}
                  </Field>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Bill Date *</label>
                  <Field name="bill_date">
                    {({ field, meta }) => (
                      <div>
                        <input {...field} type="date" className="border rounded-md px-3 py-2 text-base w-full" />
                        {meta.touched && meta.error && <div className="text-red-500 text-xs mt-1">{meta.error}</div>}
                      </div>
                    )}
                  </Field>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor Name *</label>
                  <Field name="vendor_name">
                    {({ field, meta }) => (
                      <div>
                        <input {...field} className="border rounded-md px-3 py-2 text-base w-full" placeholder="Enter vendor name" />
                        {meta.touched && meta.error && <div className="text-red-500 text-xs mt-1">{meta.error}</div>}
                      </div>
                    )}
                  </Field>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Journal *</label>
                  <Field name="journal">
                    {({ field, meta }) => (
                      <div>
                        <input {...field} className="border rounded-md px-3 py-2 text-base w-full" placeholder="Enter journal" />
                        {meta.touched && meta.error && <div className="text-red-500 text-xs mt-1">{meta.error}</div>}
                      </div>
                    )}
                  </Field>
                </div>
              </div>

              {/* Items Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Items</h3>
                <FieldArray name="items">
                  {({ remove, push }) => (
                    <div>
                      <div className="grid grid-cols-6 gap-2 mb-2 font-semibold text-xs">
                        <div>Product</div>
                        <div>Qty</div>
                        <div>Unit</div>
                        <div>Price</div>
                        <div>Amount</div>
                        <div>Action</div>
                      </div>
                      
                      {values.items.map((item, idx) => {
                        const amount = (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0);
                        
                        // Update amount if it changed
                        if (amount !== item.amount) {
                          setFieldValue(`items.${idx}.amount`, amount, false);
                        }
                        
                        return (
                          <div key={idx} className="grid grid-cols-6 gap-2 mb-2 items-end">
                            <div>
                              <ProductAutocomplete idx={idx} values={values} setFieldValue={setFieldValue} />
                            </div>
                            
                            <div>
                              <Field name={`items.${idx}.quantity`}>
                                {({ field }) => (
                                  <input {...field} type="number" min="1" placeholder="Qty" className="border rounded-md px-3 py-2 text-base w-full" />
                                )}
                              </Field>
                            </div>
                            
                            <div>
                              <Field name={`items.${idx}.unit`}>
                                {({ field }) => (
                                  <select {...field} className="border rounded-md px-3 py-2 text-base w-full">
                                    <option value="pcs">Pcs</option>
                                    <option value="kg">Kg</option>
                                    <option value="ltr">Ltr</option>
                                    <option value="box">Box</option>
                                  </select>
                                )}
                              </Field>
                            </div>
                            
                            <div>
                              <Field name={`items.${idx}.purchase_price`}>
                                {({ field }) => (
                                  <input {...field} type="number" step="0.01" min="0" placeholder="Price" className="border rounded-md px-3 py-2 text-base w-full" />
                                )}
                              </Field>
                            </div>
                            
                            <div>
                              <input type="number" value={amount.toFixed(2)} readOnly className="border rounded-md px-3 py-2 text-base w-full bg-gray-50" />
                            </div>
                            
                            <div>
                              <button type="button" onClick={() => remove(idx)} className="px-2 py-2 bg-red-500 text-white rounded text-xs" disabled={values.items.length === 1}>
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      
                      <div className="mt-4">
                        <button type="button" className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => push({ product_name: "", product_id: null, quantity: 1, unit: "pcs", purchase_price: 0, discount: 0, tax: 0, amount: 0, isExistingProduct: false })}>
                          + Add Item
                        </button>
                      </div>
                    </div>
                  )}
                </FieldArray>
              </div>

              {/* Total Amount */}
              <div className="mt-6">
                <div className="flex justify-end">
                  <div className="w-48">
                    <label className="block text-sm font-medium mb-1">Total Amount *</label>
                    <Field name="total_amount">
                      {({ field, meta }) => {
                        const total = values.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                        if (total !== Number(field.value)) {
                          setFieldValue("total_amount", total.toFixed(2), false);
                        }
                        return (
                          <div>
                            <input {...field} type="number" step="0.01" readOnly className="border rounded-md px-3 py-2 text-base w-full bg-gray-50 text-right font-semibold" value={total.toFixed(2)} />
                            {meta.touched && meta.error && <div className="text-red-500 text-xs mt-1">{meta.error}</div>}
                          </div>
                        );
                      }}
                    </Field>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white disabled:bg-gray-400" disabled={isSubmitting || !isValid}>
                  {isSubmitting ? "Saving..." : (isEdit ? "Update" : "Create")}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
