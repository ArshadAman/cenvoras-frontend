import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react"; // Assuming headlessui is used for modals
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomers } from "../../api/sales";
import { getSalesInvoices } from "../../api/sales";
import { createCreditNote } from "../../api/gst";
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
    inv.invoice_number?.toLowerCase().includes(selectedInvoiceId.toLowerCase()) ||
    inv.invoice_number || inv.invoice_date
  );

  // Selected Invoice Details
  const selectedInvoice = invoiceList.find(inv => inv.id === selectedInvoiceId);

  useEffect(() => {
    if (selectedInvoice) {
      // Pre-fill items with 0 return quantity
      setReturnItems(selectedInvoice.items.map(item => ({
        ...item,
        return_qty: 0,
        original_qty: item.quantity, 
      })));
    }
  }, [selectedInvoice]);

  const createMutation = useMutation({
    mutationFn: createCreditNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
      await queryClient.refetchQueries({ queryKey: ["credit-notes"] });
      toast.success("Credit Note Created");
      handleClose();
    },
    onError: (err) => toast.error(err.message || "Failed to create credit note"),
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
          product: item.product_detail?.id || item.product_id || item.product,
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

    const payload = {
      date: getTodayKolkata(),
      customer: selectedCustomer,
      original_invoice: selectedInvoiceId,
      reason,
      notes,
      items: itemsToReturn,
      total_amount: totalAmt,
      warehouse: selectedInvoice.warehouse // Return to same warehouse
    };

    createMutation.mutate(payload);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedCustomer("");
    setSelectedInvoiceId("");
    setReturnItems([]);
    setNotes("");
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
                    onChange={(e) => setReason(e.target.value)}
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
                          <th className="px-4 py-3 text-right">Sold Qty</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3 text-right w-36">Return Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {returnItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[var(--bg-primary)]/40 transition-colors">
                            <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{item.product_detail?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-right text-[var(--text-secondary)]">{item.original_qty} {item.unit}</td>
                            <td className="px-4 py-3 text-right text-[var(--text-secondary)] tabular-nums">{getCurrencySymbol()}{item.price}</td>
                            <td className="px-4 py-3">
                              <input 
                                type="number"
                                min="0"
                                max={item.original_qty}
                                value={item.return_qty}
                                onChange={(e) => {
                                  const newQty = Math.min(parseFloat(e.target.value) || 0, item.original_qty);
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
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Sold Qty</label>
                            <div className="text-[var(--text-primary)] text-sm font-medium">{item.original_qty} {item.unit}</div>
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
                                max={item.original_qty}
                                value={item.return_qty}
                                onChange={(e) => {
                                  const newQty = Math.min(parseFloat(e.target.value) || 0, item.original_qty);
                                  const newItems = [...returnItems];
                                  newItems[idx].return_qty = newQty;
                                  setReturnItems(newItems);
                                }}
                                className="w-full bg-[var(--bg-surface)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none transition-all text-center font-bold text-lg"
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs uppercase font-semibold pointer-events-none">
                                max: {item.original_qty}
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
