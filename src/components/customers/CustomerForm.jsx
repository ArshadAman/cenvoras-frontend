import React from "react";
import { createPortal } from "react-dom";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCustomer, updateCustomer } from "../../api/customers";
import { toast } from "react-toastify";
import { INDIAN_STATES, GST_STATE_CODE_MAP } from "../../utils/constants";
import { XMarkIcon, PlusIcon, TrashIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import useEscKey from "../../hooks/useEscStack";
import { yupGstinOptional } from "../../utils/gstin";
import { extractFieldErrors } from "../../utils/fieldErrors";
import { formatErrorMessage } from "../../utils/toastUtils";

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
  gstin: yupGstinOptional(Yup).max(15, "GSTIN must be less than 15 characters"),
  address: Yup.string()
    .max(500, "Address must be less than 500 characters"),
  meta: Yup.object().shape({
    shipping_addresses: Yup.array().of(
      Yup.string().max(500, "Shipping address must be less than 500 characters")
    ),
  }),
});

export default function CustomerForm({
  isOpen,
  onClose,
  editData = null,
  onSaved = null,
  initialName = "",
  escPriority = 20,
}) {
  useEscKey(onClose, isOpen, escPriority);
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
      toast.error(formatErrorMessage(error, "Failed to create customer"));
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
      toast.error(formatErrorMessage(error, "Failed to update customer"));
    },
  });

  const handleSubmit = async (values, { setSubmitting, setFieldError, setStatus }) => {
    setStatus(undefined);

    const seenAddresses = new Set();
    const cleanedShipping = [];
    for (const raw of values.meta?.shipping_addresses || []) {
      const trimmed = String(raw || "").trim();
      if (!trimmed) continue;
      const key = trimmed.replace(/\s+/g, " ").toLowerCase();
      if (!seenAddresses.has(key)) {
        seenAddresses.add(key);
        cleanedShipping.push(trimmed);
      }
    }

    const cleanMeta = {
      ...(values.meta || {}),
      shipping_addresses: cleanedShipping,
    };

    // Clean up empty top-level values while retaining normalized meta.shipping_addresses
    const cleanValues = Object.fromEntries(
      Object.entries({ ...values, meta: cleanMeta }).filter(([key, value]) => {
        if (key === "meta") return true;
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
      // Toast is raised in onError; also show the backend's field errors inline (e.g. invalid GSTIN).
      const fieldErrors = extractFieldErrors(e);
      Object.entries(fieldErrors).forEach(([f, m]) => setFieldError(f, m));
      setStatus({ formError: fieldErrors.gstin || Object.values(fieldErrors)[0] || formatErrorMessage(e, 'Could not save customer') });
    } finally {
      setSubmitting(false);
    }
  };

  const existingShipping = Array.isArray(editData?.meta?.shipping_addresses)
    ? editData.meta.shipping_addresses.filter((a) => typeof a === "string" && a.trim() !== "")
    : (Array.isArray(editData?.shipping_addresses)
        ? editData.shipping_addresses.filter((a) => typeof a === "string" && a.trim() !== "")
        : []);

  const initialValues = {
    name: editData?.name || initialName || "",
    email: editData?.email || "",
    phone: editData?.phone || "",
    gstin: editData?.gstin || "",
    state: editData?.state || "",
    address: editData?.address || "",
    meta: {
      party_category: editData?.meta?.party_category || "consumer",
      gst_type: editData?.meta?.gst_type || "unregistered",
      shipping_addresses: existingShipping,
    }
  };

  if (!isOpen) return null;

  const inputClass = "form-input";
  const labelClass = "form-label uppercase tracking-wider";

  const modalNode = (
    <div
      className="fixed inset-0 z-[10020] flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
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
            type="button"
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
          {({ isSubmitting, status, values }) => (
            <Form className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {status?.formError && (
                <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {status.formError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Name */}
                <div className="md:col-span-2 form-field">
                  <label htmlFor="customer-form-name" className={labelClass}>Customer Name *</label>
                  <Field
                    id="customer-form-name"
                    name="name"
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Acme Corp"
                  />
                  <ErrorMessage name="name" component="div" className="mt-1 text-xs text-red-400" />
                </div>

                {/* Email */}
                <div className="form-field">
                  <label htmlFor="customer-form-email" className={labelClass}>Email Address</label>
                  <Field
                    id="customer-form-email"
                    name="email"
                    type="email"
                    className={inputClass}
                    placeholder="john@example.com"
                  />
                  <ErrorMessage name="email" component="div" className="mt-1 text-xs text-red-400" />
                </div>

                {/* Phone */}
                <div className="form-field">
                  <label htmlFor="customer-form-phone" className={labelClass}>Phone Number</label>
                  <Field
                    id="customer-form-phone"
                    name="phone"
                    type="tel"
                    className={inputClass}
                    placeholder="+91 98765 43210"
                  />
                  <ErrorMessage name="phone" component="div" className="mt-1 text-xs text-red-400" />
                </div>

                {/* State */}
                <div className="form-field">
                  <label htmlFor="customer-form-state" className={labelClass}>State (Place of Supply)</label>
                  <Field
                    as="select"
                    id="customer-form-state"
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
                <div className="form-field">
                  <label htmlFor="customer-form-gstin" className={labelClass}>GSTIN</label>
                  <Field name="gstin">
                    {({ field, form }) => (
                      <input
                        {...field}
                        id="customer-form-gstin"
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
                <div className="form-field">
                  <label htmlFor="customer-form-gst-type" className={labelClass}>GST Type</label>
                  <Field
                    as="select"
                    id="customer-form-gst-type"
                    name="meta.gst_type"
                    className={inputClass}
                  >
                    <option value="unregistered">Unregistered</option>
                    <option value="registered">Registered</option>
                    <option value="composite">Composite</option>
                  </Field>
                </div>

                {/* Party Category */}
                <div className="form-field">
                  <label htmlFor="customer-form-party-category" className={labelClass}>Category</label>
                  <Field
                    as="select"
                    id="customer-form-party-category"
                    name="meta.party_category"
                    className={inputClass}
                  >
                    <option value="consumer">End Consumer</option>
                    <option value="retailer">Retailer</option>
                    <option value="wholesaler">Wholesaler</option>
                    <option value="distributor">Distributor</option>
                  </Field>
                </div>

                {/* Billing Address */}
                <div className="md:col-span-2 form-field">
                  <label htmlFor="customer-form-address" className={labelClass}>Address</label>
                  <Field
                    id="customer-form-address"
                    name="address"
                    as="textarea"
                    rows={3}
                    className={inputClass}
                    placeholder="Full billing address..."
                  />
                  <ErrorMessage name="address" component="div" className="mt-1 text-xs text-red-400" />
                </div>

                {/* Saved Shipping Addresses */}
                <div className="md:col-span-2">
                  <FieldArray name="meta.shipping_addresses">
                    {({ push, remove, move }) => {
                      const addresses = values.meta?.shipping_addresses || [];
                      return (
                        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)]/50 p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                                Saved Shipping Addresses ({addresses.length})
                              </span>
                              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                Add or edit delivery locations different from billing address.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => push("")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--accent-primary)]/35 bg-[var(--action-primary-bg)] text-xs font-semibold text-[var(--accent-primary)] hover:brightness-110 transition-all cursor-pointer shrink-0"
                            >
                              <PlusIcon className="w-3.5 h-3.5" />
                              Add Shipping Address
                            </button>
                          </div>

                          {addresses.length === 0 ? (
                            <p className="text-xs text-[var(--text-muted)] italic">
                              No separate shipping addresses saved yet.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {addresses.map((_, idx) => (
                                <div key={idx} className="form-field space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <label
                                      htmlFor={`customer-shipping-${idx}`}
                                      className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider"
                                    >
                                      Shipping Address #{idx + 1} {idx === 0 && "(Primary)"}
                                    </label>
                                    <div className="flex items-center gap-2">
                                      {idx > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => move(idx, 0)}
                                          title="Set as primary shipping address"
                                          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:underline cursor-pointer"
                                        >
                                          <ArrowUpIcon className="w-3 h-3" />
                                          Make Primary
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => remove(idx)}
                                        title="Remove shipping address"
                                        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--status-danger)] hover:underline cursor-pointer"
                                      >
                                        <TrashIcon className="w-3.5 h-3.5" />
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                  <Field
                                    id={`customer-shipping-${idx}`}
                                    name={`meta.shipping_addresses.${idx}`}
                                    as="textarea"
                                    rows={2}
                                    className={inputClass}
                                    placeholder="Full shipping address, city, state, PIN..."
                                  />
                                  <ErrorMessage
                                    name={`meta.shipping_addresses.${idx}`}
                                    component="div"
                                    className="text-xs text-red-400"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  </FieldArray>
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

  if (typeof document !== "undefined") {
    return createPortal(modalNode, document.body);
  }
  return modalNode;
}
