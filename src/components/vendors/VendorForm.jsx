import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createVendor, updateVendor } from "../../api/vendors";
import { toast } from "react-toastify";
import { INDIAN_STATES } from "../../utils/constants";
import { XMarkIcon } from '@heroicons/react/24/outline';

const vendorSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .required("Vendor name is required"),
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

export default function VendorForm({ isOpen, onClose, editData = null }) {
  const queryClient = useQueryClient();
  const isEdit = !!editData;

  const createMutation = useMutation({
    mutationFn: createVendor,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success(response?.message || "Vendor created successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create vendor");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateVendor(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success(response?.message || "Vendor updated successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update vendor");
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

  const inputClass = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bento-card !p-0 shadow-2xl shadow-blue-900/20 animate-fade-up">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? "Edit Vendor" : "New Vendor"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={vendorSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting }) => (
            <Form className="p-6 md:p-8 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vendor Name */}
                <div className="md:col-span-2">
                  <label htmlFor="name" className={labelClass}>Vendor Name *</label>
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
                  <Field
                    id="gstin"
                    name="gstin"
                    type="text"
                    className={inputClass}
                    placeholder="22AAAAA0000A1Z5"
                  />
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
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                  className="btn-primary w-full sm:w-auto py-3 sm:py-2.5 px-8 text-sm font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    isEdit ? "Update Vendor" : "Create Vendor"
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