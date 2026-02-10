import React, { useEffect } from "react";
import { Formik, Form, Field } from "formik";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInvoiceSettings, updateInvoiceSettings } from "../../api/invoice_settings";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";

export default function InvoicePrintSettings({ isOpen, onClose }) {
  const queryClient = useQueryClient();

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["invoiceSettings"],
    queryFn: getInvoiceSettings,
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: updateInvoiceSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoiceSettings"] });
      toast.success("Print settings saved/updated!");
      onClose();
    },
    onError: () => toast.error("Failed to save settings"),
  });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-xl shadow-2xl p-6 animate-fade-up">
        
        <h2 className="text-xl font-bold text-white mb-6">Invoice Print Configuration</h2>

        {isLoading ? (
             <div className="text-center text-gray-400">Loading settings...</div>
        ) : (
            <Formik
            initialValues={{
                print_offset_x: settings?.print_offset_x || 0,
                print_offset_y: settings?.print_offset_y || 0,
                template_name: settings?.template_name || 'standard_a4',
                header_text: settings?.header_text || '',
                footer_text: settings?.footer_text || '',
                terms_conditions: settings?.terms_conditions || '',
            }}
            onSubmit={(values) => {
                mutation.mutate(values);
            }}
            >
            {({ isSubmitting }) => (
                <Form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Offset X (mm)</label>
                            <Field name="print_offset_x" type="number" className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Offset Y (mm)</label>
                            <Field name="print_offset_y" type="number" className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2 text-white" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Template</label>
                        <Field name="template_name" as="select" className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2 text-white">
                            <option value="standard_a4">Standard A4</option>
                            <option value="compact_a5">Compact A5</option>
                            <option value="thermal">Thermal (POS)</option>
                        </Field>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Header Text</label>
                        <Field name="header_text" as="textarea" rows="2" className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2 text-white" placeholder="Text to appear at top" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Footer Text</label>
                        <Field name="footer_text" as="textarea" rows="2" className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2 text-white" placeholder="Text to appear at bottom" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Default Terms</label>
                        <Field name="terms_conditions" as="textarea" rows="3" className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2 text-white" placeholder="Payment terms etc." />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary">
                            {isSubmitting ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                </Form>
            )}
            </Formik>
        )}
      </div>
    </div>,
    document.body
  ); // Portal to body
}
