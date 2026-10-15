/**
 * Passthrough. Each template renders its own header in the preview.
 * Print and PDF must use that same markup — do not inject another header.
 */
export default function InvoicePrintShell({ children }) {
  return children;
}
