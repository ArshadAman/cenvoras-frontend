import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react"; // Assuming headlessui is used for modals
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomers } from "../../api/sales";
import { getSalesInvoices } from "../../api/sales";
import { createCreditNote } from "../../api/gst";
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

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
    onSuccess: () => {
      queryClient.invalidateQueries(["credit-notes"]);
      toast.success("Credit Note Created");
      handleClose();
    },
    onError: (err) => toast.error(err.message || "Failed to create credit note"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const itemsToReturn = returnItems
      .filter(item => item.return_qty > 0)
      .map(item => ({
        product: item.product_detail?.id || item.product_id || item.product, // Extract exact UUID
        batch: item.batch_id || item.batch || null,
        hsn_sac_code: item.hsn_sac_code,
        quantity: parseFloat(item.return_qty),
        unit: item.unit,
        price: parseFloat(item.price),
        discount: parseFloat(item.discount || 0),
        tax: parseFloat(item.tax || 0),
        amount: (parseFloat(item.price) * parseFloat(item.return_qty)) // Simplified calculation
      }));

    if (itemsToReturn.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    const payload = {
      date: new Date().toISOString().split('T')[0],
      customer: selectedCustomer,
      original_invoice: selectedInvoiceId,
      reason,
      notes,
      items: itemsToReturn,
      total_amount: itemsToReturn.reduce((sum, item) => sum + item.amount, 0),
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
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#0F0F12] border border-white/10 p-6 text-left align-middle shadow-xl transition-all">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                New Credit Note (Sales Return)
              </Dialog.Title>
              <button onClick={handleClose} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Select Customer & Invoice */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Customer</label>
                  <select 
                    value={selectedCustomer}
                    onChange={(e) => { setSelectedCustomer(e.target.value); setSelectedInvoiceId(""); }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customerList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Original Invoice</label>
                  <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                    <div className="px-3 py-2 border-b border-white/10 text-xs text-gray-500">
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
                                className={`w-full text-left px-3 py-2 border-b border-white/5 last:border-0 transition-colors ${isSelected ? 'bg-purple-500/20 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="font-medium">{inv.invoice_number}</span>
                                  <span className="text-xs text-gray-500">{inv.invoice_date}</span>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3 py-4 text-sm text-gray-500">No invoices found for this customer.</div>
                        )
                      ) : (
                        <div className="px-3 py-4 text-sm text-gray-500">Select a customer first.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Return Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Reason</label>
                  <select 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="return">Goods Returned</option>
                    <option value="defective">Defective</option>
                    <option value="discount">Post-Sale Discount</option>
                    <option value="rate_diff">Rate Difference</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
                  <input 
                    type="text" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="Optional remarks"
                  />
                </div>
              </div>

              {/* Step 3: Items Table */}
              {selectedInvoice && (
                <div className="border border-white/10 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-400">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3 text-right">Sold Qty</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right w-32">Return Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {returnItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3 text-white">{item.product_detail?.name || 'N/A'}</td>
                          <td className="p-3 text-right text-gray-400">{item.original_qty} {item.unit}</td>
                          <td className="p-3 text-right text-gray-400">₹{item.price}</td>
                          <td className="p-3">
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
                              className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-right text-white focus:border-purple-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !selectedInvoiceId}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
