import React, { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react"; // Assuming headlessui is used for modals
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomers, getSalesInvoices } from "../../api/sales";
import { createCreditNote, getInvoiceReturnRemaining } from "../../api/gst";
import { extractServerMessage, exceedsRemainingQty, lineProductId, remainingQtyFor } from "../../utils/fieldErrors";
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import { getTodayKolkata, formatDMY } from '../../utils/date';
import { quantityError, isMeasuredUnit } from '../../utils/uqc';

export default function CreditNoteForm({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [reason, setReason] = useState("return");
  const [notes, setNotes] = useState("");
  const [noteDate, setNoteDate] = useState(getTodayKolkata());
  const [dismissedDateError, setDismissedDateError] = useState(false);
  const [returnItems, setReturnItems] = useState([]);

  // Fetch Customers
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
    enabled: isOpen && step === 1,
  });

  // Fetch Invoices for Customer
  const { data: invoices, isLoading: invoicesLoading, isFetching: invoicesFetching } = useQuery({
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

  const {
    data: invoiceRemaining,
    isFetched: remainingFetched,
    isPending: remainingPending,
    isError: remainingError,
  } = useQuery({
    queryKey: ["cn-remaining", selectedInvoiceId],
    queryFn: () => getInvoiceReturnRemaining(selectedInvoiceId),
    enabled: isOpen && !!selectedInvoiceId,
    // R21: never show a stale "X of Y" after a credit note is created.
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const remainingReady = Boolean(selectedInvoice && remainingFetched && invoiceRemaining?.remaining_qty);

  useEffect(() => {
    setReturnItems([]);
  }, [selectedInvoiceId]);

  useEffect(() => {
    if (!selectedInvoice || !remainingReady) return;
    const remainingMap = invoiceRemaining.remaining_qty;
    // Pre-fill items only after remaining has settled — never flash original qty as remaining.
    setReturnItems((selectedInvoice.items || []).map(item => ({
      ...item,
      return_qty: 0,
      original_qty: parseFloat(item.quantity || 0),
      remaining_qty: remainingQtyFor(lineProductId(item), item.quantity, remainingMap),
    })));
  }, [selectedInvoice, invoiceRemaining, remainingReady]);

  const lastPayloadRef = useRef(null);
  const wholeUnits = reason === 'return' || reason === 'defective';
  const createMutation = useMutation({
    mutationFn: createCreditNote,
    onSuccess: (data) => {
      // R22: don't hold the save button on list refetches. It used to await the credit-note list twice
      // (invalidate + refetch) and cn-remaining before the toast. Refresh in the background instead,
      // including the inventory list, whose stock the CN may have changed.
      queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
      queryClient.invalidateQueries({ queryKey: ["cn-remaining"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(data?.gst_time_barred ? "Credit note without GST (time-barred under s.34) created" : "Credit Note Created", { autoClose: 3500 });
      if (data?.back_dated?.message) {
        toast.warn(`Back-dated entry: dated ${formatDMY(data.date)}, entered on ${formatDMY(data.back_dated.entered_on)}.`, { autoClose: 5000 });
      }
      if (data?.section34_warning) {
        toast.warn(data.section34_warning, { autoClose: 3500 });
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
        toast.error(taxErrors.join('\n'), { autoClose: 5000, toastId: 'cn-tax-cap', style: { whiteSpace: 'pre-line' } });
        return;
      }
      toast.error(extractServerMessage(err, "Failed to create credit note"), { autoClose: 3500 });
    },
  });

  // R22: the app's own messages for dates/quantities (not only the browser's picker limits).
  const today = getTodayKolkata();
  const invDateStr = selectedInvoice?.invoice_date ? String(selectedInvoice.invoice_date).slice(0, 10) : '';
  const dateError = useMemo(() => {
    if (!noteDate) return 'Enter the credit note date.';
    if (invDateStr && noteDate < invDateStr) {
      return `The credit note date can't be before the invoice date (${formatDMY(invDateStr)}).`;
    }
    if (noteDate > today) {
      return `The credit note date can't be in the future (today is ${formatDMY(today)}).`;
    }
    const hasTax = returnItems.some((item) => parseFloat(item.tax || 0) > 0);
    if (hasTax && selectedInvoice?.invoice_date) {
      const invDate = new Date(`${selectedInvoice.invoice_date}T00:00:00`);
      const fyEndYear = invDate.getMonth() >= 3 ? invDate.getFullYear() + 1 : invDate.getFullYear();
      const deadline = new Date(fyEndYear, 10, 30);
      const cnDate = new Date(`${noteDate}T00:00:00`);
      if (cnDate > deadline) {
        return `GST Act Section 34: Tax credit notes for this invoice's FY can only be issued until 30 Nov ${fyEndYear}.`;
      }
    }
    return '';
  }, [noteDate, invDateStr, today, returnItems, selectedInvoice]);

  useEffect(() => {
    setDismissedDateError(false);
  }, [dateError]);

  // UAT P1 item 5: precision by UQC; typed quantities are kept as typed, never rounded.
  const qtyErrorFor = (it) => quantityError(it.return_qty, it.unit || it.product_detail?.unit, { stockReturn: wholeUnits });
  const firstQtyError = returnItems.map(qtyErrorFor).find(Boolean) || '';
  const fractionalReturn = Boolean(firstQtyError);
  const WHOLE_UNITS_MSG = firstQtyError;

  const hasExcessQty = returnItems.some(item => {
    const qty = parseFloat(item.return_qty) || 0;
    const maxAllowed = item.remaining_qty !== undefined ? item.remaining_qty : (item.original_qty ?? 0);
    return qty > maxAllowed;
  });

  const activeReturnItems = returnItems.filter(item => (parseFloat(item.return_qty) || 0) > 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (dateError) {
      toast.error(dateError, { toastId: 'cn-date-error', autoClose: 3500 });
      return;
    }
    if (fractionalReturn) {
      toast.error(WHOLE_UNITS_MSG, { toastId: 'cn-qty-error', autoClose: 3500 });
      return;
    }
    if (!remainingReady) {
      toast.error("Wait for remaining quantities to load before creating a credit note.", { autoClose: 3500 });
      return;
    }
    for (const item of returnItems) {
      const qty = parseFloat(item.return_qty) || 0;
      const maxAllowed = item.remaining_qty !== undefined ? item.remaining_qty : (item.original_qty ?? 0);
      if (qty > maxAllowed) {
        const prodName = item.product_detail?.name || item.product || 'item';
        toast.error(`Return quantity for ${prodName} cannot exceed remaining quantity (${maxAllowed})`, {
          toastId: `excess-qty-${item.id || prodName}`,
          autoClose: 3500,
        });
        return;
      }
    }

    const itemsToReturn = returnItems
      .filter(item => (parseFloat(item.return_qty) || 0) > 0)
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

    if (!selectedCustomer) {
      toast.error("Save this customer first before creating a credit note.", { autoClose: 3500 });
      return;
    }

    if (itemsToReturn.length === 0) {
      toast.error("Please select at least one item to return", { autoClose: 3500 });
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
        toast.warn(`GST Act s.34(2): tax credit notes for this invoice's FY must be dated by 31 Oct ${fyEndYear} and declared by 30 Nov ${fyEndYear}.`, { autoClose: 5000 });
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
    setDismissedDateError(false);
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
              <button
                type="button"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
                onClick={handleClose}
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Customer & Invoice Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {customerList.length === 0 && (
                    <p className="text-xs text-[var(--text-muted)] mt-1.5">Save a customer first before creating a credit note.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Original Invoice</label>
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-hidden">
                    <div className="px-3 py-2 border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                      Select an invoice below. The list scrolls inside this box.
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {selectedCustomer ? (
                        (invoicesLoading || (invoicesFetching && invoiceList.length === 0)) ? (
                          <div className="px-3 py-4 text-sm text-[var(--text-muted)] flex items-center gap-2">
                            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Loading invoices…
                          </div>
                        ) : filteredInvoiceList.length > 0 ? (
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Credit note date</label>
                  <input 
                    type="date" 
                    value={noteDate}
                    onChange={(e) => setNoteDate(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    aria-invalid={!!dateError}
                    required
                  />
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Not before the invoice date or in a month whose GSTR-1 is filed.</p>
                  {dateError && (
                    <p className="mt-1 text-xs font-medium text-red-400" role="alert">{dateError}</p>
                  )}
                  {!dateError && noteDate < today && (
                    <p className="mt-1 text-xs font-medium text-amber-500">Back-dated entry: this credit note is dated {formatDMY(noteDate)}, before today ({formatDMY(today)}). You can still save it; the entry date and your name are recorded.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Reason</label>
                  <select 
                    value={reason}
                    onChange={(e) => {
                      const next = e.target.value;
                      setReason(next);
                    }}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="return">Goods Returned</option>
                    <option value="defective">Defective</option>
                    <option value="discount">Post-Sale Discount</option>
                    <option value="rate_diff">Price Correction / Rate Difference</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Notes / Internal Reference</label>
                  <input 
                    type="text" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={reason === 'other' ? "Please specify the return / credit reason" : "e.g. Return of damaged stock"}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              {/* Step 3: Items to Return */}
              {selectedInvoice && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Invoice Items
                    </h4>
                    <span className="text-xs text-[var(--text-muted)]">
                      {'Count units (pcs, nos, box…) take whole numbers; kg, ltr, mtr and other measured units take up to 3 decimals.'}
                    </span>
                  </div>

                  {!remainingReady ? (
                    <div className="p-6 text-center text-sm text-[var(--text-muted)] border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-primary)]/40 flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Loading remaining returnable quantities…
                    </div>
                  ) : (
                  <>
                  {/* Desktop Items Table */}
                  <div className="hidden lg:block overflow-hidden rounded-xl border border-[var(--border-subtle)]">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[var(--bg-primary)] text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3 text-right">Can credit</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3 text-right w-44">Return Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {returnItems.map((item, idx) => {
                          const maxAllowed = item.remaining_qty !== undefined ? item.remaining_qty : item.original_qty;
                          const isExcess = (parseFloat(item.return_qty) || 0) > maxAllowed;
                          return (
                            <tr key={idx} className="hover:bg-[var(--bg-primary)]/40 transition-colors">
                              <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{item.product_detail?.name || 'N/A'}</td>
                              <td className="px-4 py-3 text-right text-[var(--text-secondary)]">
                                <span className="font-medium text-[var(--text-primary)]">{item.remaining_qty}</span>
                                <span className="text-xs text-[var(--text-muted)]"> of {item.original_qty} {item.unit}</span>
                              </td>
                              <td className="px-4 py-3 text-right text-[var(--text-secondary)] tabular-nums">{getCurrencySymbol()}{item.price}</td>
                              <td className="px-4 py-3">
                                <input 
                                  type="number"
                                  min="0"
                                  step={isMeasuredUnit(item.unit || item.product_detail?.unit) ? "0.001" : "1"}
                                  value={item.return_qty === 0 ? '' : item.return_qty}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const valStr = e.target.value;
                                    const newItems = [...returnItems];
                                    newItems[idx].return_qty = valStr === '' ? 0 : valStr;
                                    setReturnItems(newItems);
                                  }}
                                  className={`w-full bg-[var(--bg-primary)] border ${
                                    isExcess
                                      ? 'border-[var(--status-danger)] focus:border-[var(--status-danger)] ring-1 ring-[var(--status-danger)]'
                                      : 'border-[var(--input-border)] focus:border-[var(--accent-primary)]'
                                  } rounded-xl px-3 py-1.5 text-right text-sm text-[var(--text-primary)] focus:outline-none`}
                                />
                                {isExcess && (
                                  <div className="text-[11px] text-[var(--status-danger)] text-right mt-1 font-semibold">
                                    Max returnable is {maxAllowed}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {fractionalReturn && (<p className="px-4 py-2 text-xs font-medium text-red-400" role="alert">{WHOLE_UNITS_MSG}</p>)}
                  </div>

                  {/* Mobile Item Cards */}
                  <div className="lg:hidden space-y-4">
                    {returnItems.map((item, idx) => {
                      const maxAllowed = item.remaining_qty !== undefined ? item.remaining_qty : item.original_qty;
                      const isExcess = (parseFloat(item.return_qty) || 0) > maxAllowed;
                      return (
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
                             <div className="flex justify-between items-center mb-1">
                               <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Quantity to Return</label>
                               <span className="text-xs text-[var(--text-muted)] font-medium">Available: {maxAllowed} {item.unit || ''}</span>
                             </div>
                             <div className="relative">
                                <input 
                                  type="number" 
                                  min="0"
                                  step={isMeasuredUnit(item.unit || item.product_detail?.unit) ? "0.001" : "1"}
                                  value={item.return_qty === 0 ? '' : item.return_qty}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const valStr = e.target.value;
                                    const newItems = [...returnItems];
                                    newItems[idx].return_qty = valStr === '' ? 0 : valStr;
                                    setReturnItems(newItems);
                                  }}
                                  className={`w-full bg-[var(--bg-surface)] border ${
                                    isExcess
                                      ? 'border-[var(--status-danger)] focus:border-[var(--status-danger)] ring-1 ring-[var(--status-danger)]'
                                      : 'border-[var(--input-border)] focus:border-[var(--accent-primary)]'
                                  } rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none transition-all text-center font-bold text-lg`}
                                />
                             </div>
                             {isExcess && (
                               <div className="text-xs text-[var(--status-danger)] text-center mt-1 font-semibold">
                                 Max returnable is {maxAllowed}
                               </div>
                             )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  </>
                  )}
                </div>
              )}

              {/* Dismissible Date Error Banner */}
              {dateError && !dismissedDateError && (
                <div className="rounded-xl border border-[var(--status-danger)]/40 bg-[var(--status-danger)]/10 p-4 flex items-start justify-between gap-3 text-sm text-[var(--status-danger)]">
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-base leading-none">⚠</span>
                    <span>{dateError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDismissedDateError(true)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-semibold px-2 py-0.5 rounded border border-[var(--status-danger)]/30 hover:bg-[var(--status-danger)]/20 transition-colors"
                  >
                    Dismiss
                  </button>
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
                  disabled={
                    Boolean(dateError) ||
                    hasExcessQty ||
                    fractionalReturn ||
                    createMutation.isPending ||
                    !selectedInvoiceId ||
                    !remainingReady ||
                    activeReturnItems.length === 0
                  }
                  aria-busy={createMutation.isPending}
                  className="btn-primary w-full sm:w-auto py-3 px-8 text-sm font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : 'Create Credit Note'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}
