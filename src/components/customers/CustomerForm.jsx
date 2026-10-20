import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCustomer, updateCustomer } from "../../api/customers";
import { toast } from "react-toastify";
import { INDIAN_STATES, GST_STATE_CODE_MAP } from "../../utils/constants";
import { XMarkIcon } from '@heroicons/react/24/outline';
import useEscKey from "../../hooks/useEscStack";

const customerSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .required("Customer name is required"),
  email: Yup.string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters"),
  phone: Yup.string()
    .max(20, "Phone number must be less than 20 characters"),
  gstin: Yup.string()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format")
    .max(15, "GSTIN must be less than 15 characters"),
  address: Yup.string()
    .max(500, "Address must be less than 500 characters"),
  meta: Yup.object().shape({
  }),
});

export default function CustomerForm({ isOpen, onClose, editData = null, onSaved = null }) {
  useEscKey(onClose, isOpen, 10);
  const queryClient = useQueryClient();
  const isEdit = !!editData;

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(response?.message || "Customer created successfully!");
      if (onSaved) onSaved(response?.data || response);
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create customer");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCustomer(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(response?.message || "Customer updated successfully!");
      if (onSaved) onSaved(response?.data || response);
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update customer");
    },
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    // Clean up empty values
    const cleanValues = Object.fromEntries(
      Object.entries(values).filter(([_, value]) => {
        if (typeof value === 'string') return value.trim() !== "";
        return value !== null && value !== undefined;
      })
    );

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: editData.id, data: cleanValues });
      } else {
        await createMutation.mutateAsync(cleanValues);
      }
    } catch (e) {
      // Error is handled in the mutation onError callback
    } finally {
      setSubmitting(false);
    }
  };

  const initialValues = {
    name: editData?.name || "",
    email: editData?.email || "",
    phone: editData?.phone || "",
    gstin: editData?.gstin || "",
    state: editData?.state || "",
    address: editData?.address || "",
    meta: {
      party_category: editData?.meta?.party_category || "consumer",
      gst_type: editData?.meta?.gst_type || "unregistered",
    }
  };

  if (!isOpen) return null;

  const inputClass = "form-input";
  const labelClass = "form-label uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl animate-fade-up border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky top-0 z-20">
          <h2 className="text-lg font-bold text-[var(--text-primary)] font-display">
            {isEdit ? "Edit Customer" : "New Customer"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={customerSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting }) => (
            <Form className="p-6 md:p-8 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Name */}
                <div className="md:col-span-2">
                  <label htmlFor="name" className={labelClass}>Customer Name *</label>
                  <Field
                    id="name"
                    name="name"
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Acme Corp"
                  />
                  <ErrorMessage name="name" component="div" className="mt-1 text-xs text-red-400" />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className={labelClass}>Email Address</label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    className={inputClass}
                    placeholder="john@example.com"
                  />
                  <ErrorMessage name="email" component="div" className="mt-1 text-xs text-red-400" />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className={labelClass}>Phone Number</label>
                  <Field
                    id="phone"
                    name="phone"
                    type="tel"
                    className={inputClass}
                    placeholder="+91 98765 43210"
                  />
                  <ErrorMessage name="phone" component="div" className="mt-1 text-xs text-red-400" />
                </div>

                {/* State */}
                <div>
                  <label htmlFor="state" className={labelClass}>State (Place of Supply)</label>
                  <Field
                    as="select"
                    id="state"
                    name="state"
                    className={inputClass}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="state" component="div" className="mt-1 text-xs text-red-400" />
                </div>

                {/* GSTIN */}
                <div>
                  <label htmlFor="gstin" className={labelClass}>GSTIN</label>
                  <Field name="gstin">
                    {({ field, form }) => (
                      <input
                        {...field}
                        id="gstin"
                        type="text"
                        className={inputClass}
                        placeholder="22AAAAA0000A1Z5"
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          form.setFieldValue('gstin', val);
                          if (val.length >= 2) {
                            const code = val.substring(0, 2);
                            const mappedState = GST_STATE_CODE_MAP[code];
                            if (mappedState) {
                              form.setFieldValue('state', mappedState);
                            }
                            form.setFieldValue('meta.gst_type', 'registered');
                          }
                        }}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="gstin" component="div" className="mt-1 text-xs text-red-400" />
                </div>

                {/* GST Type */}
                <div>
                  <label htmlFor="meta.gst_type" className={labelClass}>GST Type</label>
                  <Field
                    as="select"
                    id="meta.gst_type"
                    name="meta.gst_type"
                    className={inputClass}
                  >
                    <option value="unregistered">Unregistered</option>
                    <option value="registered">Registered</option>
                    <option value="composite">Composite</option>
                  </Field>
                </div>

                {/* Party Category */}
                <div>
                  <label htmlFor="meta.party_category" className={labelClass}>Category</label>
                  <Field
                    as="select"
                    id="meta.party_category"
                    name="meta.party_category"
                    className={inputClass}
                  >
                    <option value="consumer">End Consumer</option>
                    <option value="retailer">Retailer</option>
                    <option value="wholesaler">Wholesaler</option>
                    <option value="distributor">Distributor</option>
                  </Field>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className={labelClass}>Address</label>
                  <Field
                    id="address"
                    name="address"
                    as="textarea"
                    rows={3}
                    className={inputClass}
                    placeholder="Full billing address..."
                  />
                  <ErrorMessage name="address" component="div" className="mt-1 text-xs text-red-400" />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary w-full sm:w-auto px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                  className="btn-primary w-full sm:w-auto py-2.5 px-8 text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting || createMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {isEdit ? "Updating..." : "Creating..."}
                    </span>
                  ) : (
                    isEdit ? "Update Customer" : "Create Customer"
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}