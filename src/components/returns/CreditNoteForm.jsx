import React, { useState, useEffect, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react"; // Assuming headlessui is used for modals
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomers } from "../../api/sales";
import { getSalesInvoices } from "../../api/sales";
import { createCreditNote, getInvoiceReturnRemaining } from "../../api/gst";
import { extractServerMessage, lineProductId, remainingQtyFor } from "../../utils/fieldErrors";
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import { getTodayKolkata } from '../../utils/date';

export default function CreditNoteForm({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [reason, setReason] = useState("return");
  const [notes, setNotes] = useState("");
  const [noteDate, setNoteDate] = useState(getTodayKolkata());
  const [returnItems, setReturnItems] = useState([]);

  // Fetch Customers
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
    enabled: isOpen && step === 1,
  });

  // Fetch Invoices for Customer
  const { data: invoices } = useQuery({
    queryKey: ["sales-invoices", selectedCustomer],
    queryFn: () => getSalesInvoices({ customer: selectedCustomer }),
    enabled: !!selectedCustomer,
  });

  // Check for paginated vs unpaginated results
  const customerList = Array.isArray(customers) ? customers : customers?.results || [];
  const invoiceList = Array.isArray(invoices) ? invoices : invoices?.results || [];
  const filteredInvoiceList = invoiceList.filter(inv =>
    (inv.status || 'final') === 'final' && (
      inv.invoice_number?.toLowerCase().includes(selectedInvoiceId.toLowerCase()) ||
      inv.invoice_number || inv.invoice_date
    )
  );

  // Selected Invoice Details
  const selectedInvoice = invoiceList.find(inv => inv.id === selectedInvoiceId);

  const { data: invoiceRemaining } = useQuery({
    queryKey: ["cn-remaining", selectedInvoiceId],
    queryFn: () => getInvoiceReturnRemaining(selectedInvoiceId),
    enabled: isOpen && !!selectedInvoice,
    // R21: never show a stale "X of Y" after a credit note is created.
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (selectedInvoice) {
      const remainingMap = invoiceRemaining?.remaining_qty || null;
      // Pre-fill items with 0 return quantity; cap at what is still creditable
      setReturnItems(selectedInvoice.items.map(item => ({
        ...item,
        return_qty: 0,
        original_qty: parseFloat(item.quantity || 0),
        remaining_qty: remainingQtyFor(lineProductId(item), item.quantity, remainingMap),
      })));
    }
  }, [selectedInvoice, invoiceRemaining]);

  const lastPayloadRef = useRef(null);
  const wholeUnits = reason === 'return' || reason === 'defective';
  const createMutation = useMutation({
    mutationFn: createCreditNote,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
      await queryClient.invalidateQueries({ queryKey: ["cn-remaining"] });
      await queryClient.refetchQueries({ queryKey: ["credit-notes"] });
      toast.success(data?.gst_time_barred ? "Credit note without GST (time-barred under s.34) created" : "Credit Note Created");
      if (data?.section34_warning) {
        toast.warn(data.section34_warning);
      }
      handleClose();
    },
    onError: (err) => {
      // Rudra CA s.34(2): past the deadline the API refuses a GST credit note and offers a commercial one.
      const body = err?.response?.data;
      const raw = JSON.stringify(body || {});
      if (raw.includes('offer_without_gst') && lastPayloadRef.current) {
        const find = (o) => (o && typeof o === 'object'
          ? (o.section34 ? [].concat(o.section34)[0] : Object.values(o).map(find).find(Boolean))
          : null);
        const msg = find(body) || 'The s.34(2) deadline has passed for this invoice.';
        if (window.confirm(`${msg}\n\nIssue as 'Credit note without GST (time-barred under s.34)'?`)) {
          const p = lastPayloadRef.current;
          const items = p.items.map((it) => {
            const taxable = Math.round(it.quantity * it.price * (1 - (it.discount || 0) / 100) * 100) / 100;
            return { ...it, tax: 0, amount: taxable };
          });
          const total = Math.round(items.reduce((t, it) => t + it.amount, 0) * 100) / 100;
          createMutation.mutate({ ...p, items, total_amount: total, without_gst: true });
        }
        return;
      }
      // s.34 tax cap / zero-GST invoice: show every message, keep it on screen.
      const findTax = (o) => (o && typeof o === 'object'
        ? (Array.isArray(o.tax) && raw.includes('cn_tax_cap') ? o.tax : Object.values(o).map(findTax).find(Boolean))
        : null);
      const taxErrors = findTax(body);
      if (taxErrors && taxErrors.length) {
        toast.error(taxErrors.join('\n'), { autoClose: false, toastId: 'cn-tax-cap', style: { whiteSpace: 'pre-line' } });
        return;
      }
      toast.error(extractServerMessage(err, "Failed to create credit note"));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const itemsToReturn = returnItems
      .filter(item => item.return_qty > 0)
      .map(item => {
        const qty = parseFloat(item.return_qty) || 0;
        const price = parseFloat(item.price) || 0;
        const discount = parseFloat(item.discount || 0);
        const taxRate = parseFloat(item.tax || 0);
        const base = qty * price;
        const discAmt = base * (discount / 100);
        const taxable = base - discAmt;
        const taxAmt = taxable * (taxRate / 100);
        const lineGross = Math.round((taxable + taxAmt) * 100) / 100;
        return {
          product: lineProductId(item),
          batch: item.batch_id || item.batch || null,
          hsn_sac_code: item.hsn_sac_code,
          description: item.description || item.product_description || "",
          quantity: qty,
          unit: item.unit,
          price: price,
          discount: discount,
          tax: taxRate,
          amount: lineGross
        };
      });

    if (itemsToReturn.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    const totalAmt = Math.round(itemsToReturn.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
    const hasTax = itemsToReturn.some((item) => parseFloat(item.tax || 0) > 0);
    if (hasTax && selectedInvoice?.invoice_date) {
      const invDate = new Date(`${selectedInvoice.invoice_date}T00:00:00`);
      const fyEndYear = invDate.getMonth() >= 3 ? invDate.getFullYear() + 1 : invDate.getFullYear();
      const deadline = new Date(fyEndYear, 9, 31); // Rudra CA: prior-FY CNs dated by 31 Oct (monthly), declared by 30 Nov
      const cnDate = new Date(`${noteDate}T00:00:00`);
      if (cnDate > deadline) {
        toast.warn(`GST Act s.34(2): tax credit notes for this invoice's FY must be dated by 31 Oct ${fyEndYear} and declared by 30 Nov ${fyEndYear}.`);
      }
    }

    const payload = {
      date: noteDate,
      customer: selectedCustomer,
      original_invoice: selectedInvoiceId,
      reason,
      notes,
      items: itemsToReturn,
      total_amount: totalAmt,
      warehouse: selectedInvoice.warehouse // Return to same warehouse
    };

    lastPayloadRef.current = payload;
    createMutation.mutate(payload);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedCustomer("");
    setSelectedInvoiceId("");
    setReturnItems([]);
    setNotes("");
    setNoteDate(getTodayKolkata());
    onClose();
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
          <Dialog.Panel className="w-full max-w-2xl max-h-[95vh] overflow-y-auto transform rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 sm:p-8 text-left align-middle shadow-2xl transition-all">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-[var(--text-primary)]">
                New Credit Note (Sales Return)
              </Dialog.Title>
              <button onClick={handleClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Select Customer & Invoice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Customer</label>
                  <select 
                    value={selectedCustomer}
                    onChange={(e) => { setSelectedCustomer(e.target.value); setSelectedInvoiceId(""); }}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customerList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Original Invoice</label>
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-hidden">
                    <div className="px-3 py-2 border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                      Select an invoice below. The list scrolls inside this box.
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {selectedCustomer ? (
                        filteredInvoiceList.length > 0 ? (
                          filteredInvoiceList.map((inv) => {
                            const isSelected = selectedInvoiceId === inv.id;
                            return (
                              <button
                                key={inv.id}
                                type="button"
                                onClick={() => setSelectedInvoiceId(inv.id)}
                                className={`w-full text-left px-3 py-2 border-b border-[var(--border-subtle)] last:border-0 transition-colors ${isSelected ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'}`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="font-medium">{inv.invoice_number}</span>
                                  <span className="text-xs text-[var(--text-muted)]">{inv.invoice_date}</span>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3 py-4 text-sm text-[var(--text-muted)]">No invoices found for this customer.</div>
                        )
                      ) : (
                        <div className="px-3 py-4 text-sm text-[var(--text-muted)]">Select a customer first.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Return Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Reason</label>
                  <select 
                    value={reason}
                    onChange={(e) => {
                      const next = e.target.value;
                      setReason(next);
                      if (next === 'return' || next === 'defective') {
                        setReturnItems((rows) => rows.map((it) => ({ ...it, return_qty: Math.floor(Number(it.return_qty) || 0) })));
                      }
                    }}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="return">Goods Returned</option>
                    <option value="defective">Defective</option>
                    <option value="discount">Post-Sale Discount</option>
                    <option value="rate_diff">Rate Difference</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Credit note date</label>
                  <input
                    type="date"
                    value={noteDate}
                    min={selectedInvoice?.invoice_date ? String(selectedInvoice.invoice_date).slice(0, 10) : undefined}
                    max={getTodayKolkata()}
                    onChange={(e) => setNoteDate(e.target.value || getTodayKolkata())}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Not before the invoice date or in a month whose GSTR-1 is filed.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Notes</label>
                  <input 
                    type="text" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    placeholder="Optional remarks"
                  />
                </div>
              </div>

              {/* Step 3: Items Table (Responsive) */}
              {selectedInvoice && (
                <div className="space-y-4">
                  {/* Desktop Table */}
                  <div className="hidden lg:block border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[var(--bg-primary)] text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3 text-right">Can credit</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3 text-right w-36">Return Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {returnItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[var(--bg-primary)]/40 transition-colors">
                            <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{item.product_detail?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-right text-[var(--text-secondary)]">{item.remaining_qty} of {item.original_qty} {item.unit}</td>
                            <td className="px-4 py-3 text-right text-[var(--text-secondary)] tabular-nums">{getCurrencySymbol()}{item.price}</td>
                            <td className="px-4 py-3">
                              <input 
                                type="number"
                                min="0"
                                step={wholeUnits ? 1 : 0.01}
                                max={item.remaining_qty}
                                value={item.return_qty}
                                onChange={(e) => {
                                  const raw = parseFloat(e.target.value) || 0;
                                  // R21: whole units for returns (stock), up to 2 decimals for value credits.
                                  const stepped = wholeUnits ? Math.floor(raw) : Math.round(raw * 100) / 100;
                                  const newQty = Math.max(0, Math.min(stepped, item.remaining_qty));
                                  const newItems = [...returnItems];
                                  newItems[idx].return_qty = newQty;
                                  setReturnItems(newItems);
                                }}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--input-border)] rounded-xl px-3 py-1.5 text-right text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Item Cards */}
                  <div className="lg:hidden space-y-4">
                    {returnItems.map((item, idx) => (
                      <div key={idx} className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-4">
                        <div className="text-[var(--text-primary)] font-semibold text-base">{item.product_detail?.name || 'N/A'}</div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Can credit</label>
                            <div className="text-[var(--text-primary)] text-sm font-medium">{item.remaining_qty} of {item.original_qty} {item.unit}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Price</label>
                            <div className="text-[var(--text-primary)] text-sm font-medium tabular-nums">{getCurrencySymbol()}{item.price}</div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[var(--border-subtle)]">
                           <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Quantity to Return</label>
                           <div className="relative">
                              <input 
                                type="number" 
                                min="0" 
                                step={wholeUnits ? 1 : 0.01}
                                max={item.remaining_qty}
                                value={item.return_qty}
                                onChange={(e) => {
                                  const raw = parseFloat(e.target.value) || 0;
                                  // R21: whole units for returns (stock), up to 2 decimals for value credits.
                                  const stepped = wholeUnits ? Math.floor(raw) : Math.round(raw * 100) / 100;
                                  const newQty = Math.max(0, Math.min(stepped, item.remaining_qty));
                                  const newItems = [...returnItems];
                                  newItems[idx].return_qty = newQty;
                                  setReturnItems(newItems);
                                }}
                                className="w-full bg-[var(--bg-surface)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none transition-all text-center font-bold text-lg"
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs uppercase font-semibold pointer-events-none">
                                max: {item.remaining_qty}
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl btn-secondary transition-all text-sm font-bold uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !selectedInvoiceId}
                  className="btn-primary w-full sm:w-auto py-3 px-8 text-sm font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Credit Note'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}
