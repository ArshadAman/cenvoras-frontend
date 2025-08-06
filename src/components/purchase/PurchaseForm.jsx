import React, { useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray } from "formik";
import * as Yup from "yup";
import { createPurchaseBill, updatePurchaseBill, getProducts, createProduct } from "../../api/purchase";
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
    setFieldValue(`items.${idx}.price`, product.purchase_price || 0);
    setFieldValue(`items.${idx}.hsn_code`, product.hsn_code || "");
    setFieldValue(`items.${idx}.discount`, 0);
    setFieldValue(`items.${idx}.tax`, product.tax || 0);
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
                Unit: {product.unit} | Price: ₹{product.purchase_price}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PurchaseSchema = Yup.object().shape({
  bill_number: Yup.string().required().min(1).max(100),
  bill_date: Yup.string().required(),
  due_date: Yup.string().nullable(),
  vendor_name: Yup.string().required().min(1).max(255),
  vendor_address: Yup.string().nullable(),
  vendor_gstin: Yup.string().nullable().max(15),
  gst_treatment: Yup.string().nullable().max(50),
  journal: Yup.string().required().min(1).max(50),
  total_amount: Yup.number().required(),
  items: Yup.array().of(
    Yup.object().shape({
      product_name: Yup.string().required().min(1),
      quantity: Yup.number().required().min(1),
      unit: Yup.string().required(),
      amount: Yup.number().required().min(0),
    })
  ).min(1),
});

const units = ["pcs", "kg", "ltr", "box", "meter"];

export default function PurchaseForm({ bill, onClose, onSubmit }) {
  const isEdit = !!bill;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">
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
            total_amount: bill?.total_amount || "0.00",
            items: bill?.items?.map(item => ({
              product_name: item.product_detail?.name || item.product_name || "",
              product_id: item.product_detail?.id || item.product_id || null,
              quantity: item.quantity || 1,
              unit: item.unit || "pcs",
              purchase_price: item.purchase_price || 0,
              discount: item.discount || 0,
              tax: item.tax || 0,
              hsn_code: item.hsn_code || "",
              tax_rate: item.tax_rate || 0,
              low_stock_alert: item.low_stock_alert || 10,
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
              hsn_code: "",
              tax_rate: 0,
              low_stock_alert: 10,
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
              const processedItems = validItems.map(item => {
                const trimmedProductName = item.product_name.trim();
                let productValue;
                if (item.isExistingProduct && item.product_id) {
                  productValue = item.product_id;
                } else {
                  productValue = trimmedProductName;
                }
                return {
                  product: productValue,
                  hsn_sac_code: item.hsn_code || "",
                  unit: item.unit || "pcs",
                  quantity: parseInt(item.quantity) || 1,
                  price: parseFloat(item.price) || 0,
                  amount: parseFloat(item.amount) || 0,
                  discount: parseFloat(item.discount) || 0,
                  tax: parseFloat(item.tax) || 0,
                };
              });
              
              const totalAmount = values.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

              const purchaseData = {
                bill_number: values.bill_number,
                bill_date: values.bill_date,
                due_date: values.due_date || null,
                vendor_name: values.vendor_name,
                vendor_address: values.vendor_address || null,
                vendor_gstin: values.vendor_gstin || null,
                gst_treatment: values.gst_treatment || null,
                journal: values.journal,
                total_amount: totalAmount,
                items: processedItems
              };
              
              console.log("Purchase Data Sent to Backend:", purchaseData);

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
          {({ values, isSubmitting, setFieldValue }) => (
            <Form className="space-y-4">
              
              {/* Bill Number */}
              <Field name="bill_number">
                {({ field, meta }) => (
                  <div>
                    <label className="block text-sm font-medium mb-1">Bill Number *</label>
                    <input {...field} placeholder="Enter bill number" className="w-full p-2 border rounded" maxLength={100} />
                    {meta.touched && meta.error && <div className="text-red-500 text-xs mt-1">{meta.error}</div>}
                  </div>
                )}
              </Field>

              {/* Bill Date */}
              <Field name="bill_date">
                {({ field, meta }) => (
                  <div>
                    <label className="block text-sm font-medium mb-1">Bill Date *</label>
                    <input {...field} type="date" className="w-full p-2 border rounded" />
                    {meta.touched && meta.error && <div className="text-red-500 text-xs mt-1">{meta.error}</div>}
                  </div>
                )}
              </Field>

              {/* Due Date - Optional */}
              <Field name="due_date">
                {({ field }) => (
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input {...field} type="date" placeholder="Due Date (Optional)" className="w-full p-2 border rounded" />
                  </div>
                )}
              </Field>

              {/* Journal */}
              <Field name="journal">
                {({ field, meta }) => (
                  <div>
                    <label className="block text-sm font-medium mb-1">Journal *</label>
                    <input {...field} placeholder="Enter journal" className="w-full p-2 border rounded" maxLength={50} />
                    {meta.touched && meta.error && <div className="text-red-500 text-xs mt-1">{meta.error}</div>}
                  </div>
                )}
              </Field>

              {/* Vendor Name */}
              <Field name="vendor_name">
                {({ field, meta }) => (
                  <div>
                    <label className="block text-sm font-medium mb-1">Vendor Name *</label>
                    <input {...field} placeholder="Enter vendor name" className="w-full p-2 border rounded" maxLength={255} />
                    {meta.touched && meta.error && <div className="text-red-500 text-xs mt-1">{meta.error}</div>}
                  </div>
                )}
              </Field>

              {/* Vendor Address - Optional */}
              <Field name="vendor_address">
                {({ field }) => (
                  <div>
                    <label className="block text-sm font-medium mb-1">Vendor Address</label>
                    <input {...field} placeholder="Vendor Address (Optional)" className="w-full p-2 border rounded" />
                  </div>
                )}
              </Field>

              {/* Vendor GSTIN - Optional */}
              <Field name="vendor_gstin">
                {({ field, meta }) => (
                  <div>
                    <label className="block text-sm font-medium mb-1">Vendor GSTIN</label>
                    <input {...field} placeholder="Vendor GSTIN (Optional)" className="w-full p-2 border rounded" maxLength={15} />
                    {meta.touched && meta.error && <div className="text-red-500 text-xs mt-1">{meta.error}</div>}
                  </div>
                )}
              </Field>

              {/* GST Treatment - Optional */}
              <Field name="gst_treatment">
                {({ field, meta }) => (
                  <div>
                    <label className="block text-sm font-medium mb-1">GST Treatment</label>
                    <select {...field} className="w-full p-2 border rounded">
                      <option value="">GST Treatment (Optional)</option>
                      <option value="taxable">Taxable</option>
                      <option value="exempt">Exempt</option>
                      <option value="nil_rated">Nil Rated</option>
                    </select>
                    {meta.touched && meta.error && <div className="text-red-500 text-xs mt-1">{meta.error}</div>}
                  </div>
                )}
              </Field>

              {/* Items Section */}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Items</label>
                <FieldArray name="items">
                  {({ remove, push }) => (
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="grid grid-cols-9 gap-2 text-sm font-medium text-gray-700 pb-2 border-b">
                        <div>Product</div>
                        <div>HSN/SAC</div>
                        <div>Qty</div>
                        <div>Unit</div>
                        <div>Price</div>
                        <div>Discount %</div>
                        <div>Tax %</div>
                        <div>Amount</div>
                        <div>Action</div>
                      </div>
                      
                      {values.items.map((item, idx) => {
                        // Parse numbers safely
                        const quantity = Number(item.quantity) || 0;
                        const price = Number(item.price) || 0;
                        const discount = Number(item.discount) || 0;
                        const tax = Number(item.tax) || 0;

                        // Calculate discount and tax as percentages
                        const discountAmount = ((quantity * price) * discount) / 100;
                        const taxAmount = (((quantity * price) - discountAmount) * tax) / 100;
                        const amount = ((quantity * price) - discountAmount) + taxAmount;

                        // Update amount if changed
                        if (amount !== item.amount) {
                          setFieldValue(`items.${idx}.amount`, amount, false);
                        }

                        return (
                          <div key={idx} className="grid grid-cols-9 gap-2 items-end bg-gray-50 rounded p-2">
                            <div>
                              <ProductAutocomplete idx={idx} values={values} setFieldValue={setFieldValue} />
                            </div>
                            <Field name={`items.${idx}.hsn_code`}>
                              {({ field }) => (
                                <input {...field} placeholder="HSN/SAC" className="w-full p-2 border rounded text-sm" />
                              )}
                            </Field>
                            <Field name={`items.${idx}.quantity`}>
                              {({ field }) => (
                                <input {...field} type="number" min="1" placeholder="Qty" className="w-full p-2 border rounded text-sm" />
                              )}
                            </Field>
                            <Field name={`items.${idx}.unit`}>
                              {({ field }) => (
                                <select {...field} className="w-full p-2 border rounded text-sm">
                                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                              )}
                            </Field>
                            <Field name={`items.${idx}.price`}>
                              {({ field }) => (
                                <input {...field} type="number" min="0" step="0.01" placeholder="Price" className="w-full p-2 border rounded text-sm" />
                              )}
                            </Field>
                            <Field name={`items.${idx}.discount`}>
                              {({ field }) => (
                                <input {...field} type="number" min="0" max="100" step="0.01" placeholder="Discount %" className="w-full p-2 border rounded text-sm" />
                              )}
                            </Field>
                            <Field name={`items.${idx}.tax`}>
                              {({ field }) => (
                                <input {...field} type="number" min="0" max="100" step="0.01" placeholder="Tax %" className="w-full p-2 border rounded text-sm" />
                              )}
                            </Field>
                            <div>
                              <input type="number" value={item.amount?.toFixed(2) || "0.00"} readOnly className="w-full p-2 border rounded text-sm bg-gray-100" />
                            </div>
                            <button type="button" className="text-red-500 px-2 py-1 text-sm" onClick={() => remove(idx)} disabled={values.items.length === 1}>
                              Remove
                            </button>
                          </div>
                        );
                      })}
                      
                      <button
                        type="button"
                        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
                        onClick={() => push({ 
                          product_name: "", 
                          product_id: null, 
                          hsn_code: "",
                          quantity: 1, 
                          unit: "pcs", 
                          price: 0, 
                          discount: 0, 
                          tax: 0, 
                          amount: 0, 
                          isExistingProduct: false 
                        })}
                      >
                        + Add Item
                      </button>
                    </div>
                  )}
                </FieldArray>
              </div>

              {/* Total Amount */}
              <div className="flex justify-end mt-4">
                <div className="w-48">
                  <label className="block text-sm font-medium mb-1">Total Amount *</label>
                  <Field name="total_amount">
                    {({ field, form }) => {
                      const total = values.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                      if (total !== Number(field.value)) {
                        form.setFieldValue("total_amount", total.toFixed(2), false);
                      }
                      return (
                        <input
                          {...field}
                          value={total.toFixed(2)}
                          readOnly
                          className="w-full p-2 border rounded text-right font-semibold bg-gray-100"
                        />
                      );
                    }}
                  </Field>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 mt-6 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={isSubmitting}>
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