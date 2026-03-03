import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSuppliers } from "../../api/inventory"; // Assuming getSuppliers exists
import { getPurchaseBills } from "../../api/purchase"; // Assuming getPurchaseBills exists
import { createDebitNote } from "../../api/gst";
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

export default function DebitNoteForm({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedBillId, setSelectedBillId] = useState("");
  const [reason, setReason] = useState("return");
  const [notes, setNotes] = useState("");
  const [returnItems, setReturnItems] = useState([]);

  // Fetch Vendors
  const { data: vendors } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
    enabled: isOpen && step === 1,
  });

  // Fetch Bills for Vendor
  const { data: bills } = useQuery({
    queryKey: ["purchase-bills", selectedVendor],
    queryFn: () => getPurchaseBills({ vendor: selectedVendor }),
    enabled: !!selectedVendor,
  });

  // Selected Bill Details
  const selectedBill = bills?.results?.find(b => b.id === selectedBillId);

  useEffect(() => {
    if (selectedBill) {
      setReturnItems(selectedBill.items.map(item => ({
        ...item,
        return_qty: 0,
        original_qty: item.quantity, 
      })));
    }
  }, [selectedBill]);

  const createMutation = useMutation({
    mutationFn: createDebitNote,
    onSuccess: () => {
      queryClient.invalidateQueries(["debit-notes"]);
      toast.success("Debit Note Created");
      handleClose();
    },
    onError: (err) => toast.error(err.message || "Failed to create debit note"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const itemsToReturn = returnItems
      .filter(item => item.return_qty > 0)
      .map(item => ({
        product: item.product_id || item.product,
        batch: item.batch_id || item.batch,
        hsn_sac_code: item.hsn_sac_code,
        quantity: parseFloat(item.return_qty),
        unit: item.unit,
        price: parseFloat(item.price),
        discount: parseFloat(item.discount || 0),
        tax: parseFloat(item.tax || 0),
        amount: (parseFloat(item.price) * parseFloat(item.return_qty))
      }));

    if (itemsToReturn.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    const payload = {
      date: new Date().toISOString().split('T')[0],
      original_bill: selectedBillId,
      vendor_name: selectedBill.vendor_name, // Assuming backend handles linking via bill ID or name
      vendor_gstin: selectedBill.vendor_gstin,
      reason,
      notes,
      items: itemsToReturn,
      total_amount: itemsToReturn.reduce((sum, item) => sum + item.amount, 0),
      warehouse: selectedBill.warehouse
    };

    createMutation.mutate(payload);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedVendor("");
    setSelectedBillId("");
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
                New Debit Note (Purchase Return)
              </Dialog.Title>
              <button onClick={handleClose} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Select Vendor & Bill */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Vendor</label>
                  <select 
                    value={selectedVendor}
                    onChange={(e) => { setSelectedVendor(e.target.value); setSelectedBillId(""); }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    required
                  >
                    <option value="">Select Vendor</option>
                    {vendors?.results?.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Original Bill</label>
                  <select 
                    value={selectedBillId}
                    onChange={(e) => setSelectedBillId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    disabled={!selectedVendor}
                    required
                  >
                    <option value="">Select Bill</option>
                    {bills?.results?.map(b => (
                      <option key={b.id} value={b.id}>{b.bill_number} ({b.date})</option>
                    ))}
                  </select>
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
                    <option value="rate_diff">Rate Difference</option>
                    <option value="shortage">Short Supply</option>
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
              {selectedBill && (
                <div className="border border-white/10 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-400">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3 text-right">Billed Qty</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right w-32">Return Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {returnItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3 text-white">{item.product_name}</td>
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
                  disabled={createMutation.isPending || !selectedBillId}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Debit Note'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}
