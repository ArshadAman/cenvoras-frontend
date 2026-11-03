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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl p-6 animate-fade-up">
        
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Invoice Print Configuration</h2>

        {isLoading ? (
             <div className="text-center text-[var(--text-secondary)]">Loading settings...</div>
        ) : (
            <Formik
            enableReinitialize
            initialValues={{
                print_offset_x: settings?.print_offset_x || 0,
                print_offset_y: settings?.print_offset_y || 0,
                template_name: settings?.template_name || 'standard_a4',
                header_text: settings?.header_text || '',
                footer_text: settings?.footer_text || '',
                terms_conditions: settings?.terms_conditions || '',
                show_cenvora_footer: settings?.show_cenvora_footer !== false,
            }}
            onSubmit={(values) => {
                const payload = { ...values };
                if (!settings?.allow_cenvora_footer_toggle) {
                  delete payload.show_cenvora_footer;
                }
                mutation.mutate(payload);
            }}
            >
            {({ isSubmitting }) => (
                <Form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Offset X (mm)</label>
                            <Field name="print_offset_x" type="number" className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Offset Y (mm)</label>
                            <Field name="print_offset_y" type="number" className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Template</label>
                        <Field name="template_name" as="select" className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm cursor-pointer">
                            <option value="standard_a4">Standard A4</option>
                            <option value="compact_a5">Compact A5</option>
                            <option value="thermal">Thermal (POS)</option>
                        </Field>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Header Text</label>
                        <Field name="header_text" as="textarea" rows="2" className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm" placeholder="Text to appear at top" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Footer Text</label>
                        <Field name="footer_text" as="textarea" rows="2" className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm" placeholder="Text to appear at bottom" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Default Terms</label>
                        <Field name="terms_conditions" as="textarea" rows="3" className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm" placeholder="Payment terms etc." />
                    </div>

                    {settings?.allow_cenvora_footer_toggle ? (
                      <label className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)]/40 px-3 py-3 cursor-pointer">
                        <Field
                          name="show_cenvora_footer"
                          type="checkbox"
                          className="h-4 w-4 rounded border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/40"
                        />
                        <span className="text-sm text-[var(--text-primary)]">
                          Show &ldquo;Made with Cenvora&rdquo; on invoices
                        </span>
                      </label>
                    ) : null}

                    <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-default)]">
                        <button type="button" onClick={onClose} className="btn-secondary !text-sm">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary !text-sm">
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
