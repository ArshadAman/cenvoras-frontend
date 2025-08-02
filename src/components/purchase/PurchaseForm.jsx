import React, { useEffect } from "react";
import { Formik, Form, Field, FieldArray, useFormikContext } from "formik";
import * as Yup from "yup";
import { createPurchaseBill, updatePurchaseBill } from "../../api/purchase";
import { toast } from "react-toastify";

// Validation schema
const PurchaseSchema = Yup.object().shape({
  bill_number: Yup.string().required("Required"),
  bill_date: Yup.string().required("Required"),
  due_date: Yup.string().nullable(),
  vendor_name: Yup.string().required("Required"),
  vendor_address: Yup.string().nullable(),
  vendor_gstin: Yup.string().nullable(),
  gst_treatment: Yup.string().nullable(),
  journal: Yup.string().required("Required"),
  total_amount: Yup.string().required("Required"),
  created_by: Yup.string().required("Required"),
  items: Yup.array().of(
    Yup.object().shape({
      product: Yup.string().required("Required"),
      quantity: Yup.number().required("Required"),
      unit: Yup.string().required("Required"),
      price: Yup.number().required("Required"),
      discount: Yup.number().default(0),
      tax: Yup.number().default(0),
      amount: Yup.number().required("Required"),
    })
  ),
});

function ItemsFieldArray() {
  const { values, setFieldValue } = useFormikContext();

  // Auto-calculate item amount and total_amount
  useEffect(() => {
    const items = values.items.map(item => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const discount = Number(item.discount) || 0;
      const tax = Number(item.tax) || 0;
      const amount = (qty * price) - discount + tax;
      return { ...item, amount };
    });
    setFieldValue("items", items, false);
    const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    setFieldValue("total_amount", total.toFixed(2), false);
  }, [values.items, setFieldValue]);

  return (
    <FieldArray name="items">
      {({ remove, push }) => (
        <div>
          {values.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-7 gap-2 mb-2 items-end">
              <div>
                <label className="block text-xs font-medium mb-1">Product</label>
                <Field name={`items.${idx}.product`} placeholder="Product name" className="border rounded-md px-3 py-2 text-base w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Qty</label>
                <Field name={`items.${idx}.quantity`} type="number" placeholder="Quantity" className="border rounded-md px-3 py-2 text-base w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Unit</label>
                <Field name={`items.${idx}.unit`} placeholder="Unit" className="border rounded-md px-3 py-2 text-base w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Price</label>
                <Field name={`items.${idx}.price`} type="number" placeholder="Price" className="border rounded-md px-3 py-2 text-base w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Discount</label>
                <Field name={`items.${idx}.discount`} type="number" placeholder="Discount" className="border rounded-md px-3 py-2 text-base w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Tax</label>
                <Field name={`items.${idx}.tax`} type="number" placeholder="Tax" className="border rounded-md px-3 py-2 text-base w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Amount</label>
                <Field name={`items.${idx}.amount`} type="number" placeholder="Amount" className="border rounded-md px-3 py-2 text-base w-full bg-gray-100" disabled />
              </div>
              <button type="button" className="text-red-500 text-xl mt-6" onClick={() => remove(idx)}>✕</button>
            </div>
          ))}
          <button
            type="button"
            className="mt-2 px-2 py-1 bg-blue-100 rounded text-blue-700"
            onClick={() => push({ product: "", quantity: 1, unit: "", price: 0, discount: 0, tax: 0, amount: 0 })}
          >
            + Add Item
          </button>
        </div>
      )}
    </FieldArray>
  );
}

export default function PurchaseForm({ bill, onClose }) {
  const isEdit = !!bill;
  // Automatically get user id from localStorage or your auth context
  const userId = localStorage.getItem("user_id");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full"
        style={{ maxWidth: "70vw", minWidth: "350px" }}
      >
        <h2 className="text-xl font-bold mb-4">{isEdit ? "Edit" : "New"} Purchase Bill</h2>
        <Formik
          initialValues={{
            bill_number: bill?.bill_number || "",
            bill_date: bill?.bill_date || "",
            due_date: bill?.due_date || "",
            vendor_name: bill?.vendor_name || "",
            vendor_address: bill?.vendor_address || "",
            vendor_gstin: bill?.vendor_gstin || "",
            gst_treatment: bill?.gst_treatment || "",
            journal: bill?.journal || "Purchases",
            total_amount: bill?.total_amount || "0.00",
            created_by: bill?.created_by || userId || "",
            items: bill?.items || [
              { product: "", quantity: 1, unit: "", price: 0, discount: 0, tax: 0, amount: 0 },
            ],
          }}
          validationSchema={PurchaseSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              // Always set created_by to current user before submit
              values.created_by = userId;
              if (isEdit) {
                await updatePurchaseBill(bill.id, values);
                toast.success("Purchase bill updated!");
              } else {
                await createPurchaseBill(values);
                toast.success("Purchase bill created!");
              }
              onClose();
            } catch (err) {
              toast.error("Error saving purchase bill");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, errors, touched, isSubmitting }) => (
            <Form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Bill Number</label>
                  <Field name="bill_number" placeholder="Enter bill number" className="w-full border rounded-md px-3 py-2 text-base" />
                  {errors.bill_number && touched.bill_number && (
                    <div className="text-red-500 text-xs">{errors.bill_number}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bill Date</label>
                  <Field name="bill_date" type="date" placeholder="Select bill date" className="w-full border rounded-md px-3 py-2 text-base" />
                  {errors.bill_date && touched.bill_date && (
                    <div className="text-red-500 text-xs">{errors.bill_date}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <Field name="due_date" type="date" placeholder="Select due date" className="w-full border rounded-md px-3 py-2 text-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor Name</label>
                  <Field name="vendor_name" placeholder="Enter vendor name" className="w-full border rounded-md px-3 py-2 text-base" />
                  {errors.vendor_name && touched.vendor_name && (
                    <div className="text-red-500 text-xs">{errors.vendor_name}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor Address</label>
                  <Field name="vendor_address" placeholder="Enter vendor address" className="w-full border rounded-md px-3 py-2 text-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor GSTIN</label>
                  <Field name="vendor_gstin" placeholder="Enter vendor GSTIN" className="w-full border rounded-md px-3 py-2 text-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">GST Treatment</label>
                  <Field name="gst_treatment" placeholder="Enter GST treatment" className="w-full border rounded-md px-3 py-2 text-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Journal</label>
                  <Field name="journal" placeholder="Journal" className="w-full border rounded-md px-3 py-2 text-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Created By</label>
                  <Field
                    name="created_by"
                    placeholder="User ID"
                    className="w-full border rounded-md px-3 py-2 text-base bg-gray-100"
                    disabled
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Items</label>
                <ItemsFieldArray />
              </div>
              <div className="flex justify-end gap-4 mt-8 items-center">
                <span className="font-bold text-lg">Total: ₹{values.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toFixed(2)}</span>
                <button type="button" className="px-3 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
                <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white" disabled={isSubmitting}>
                  {isEdit ? "Update" : "Create"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}