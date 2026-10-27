import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getPurchaseBills, getPurchaseBill } from "../../api/purchase";
import { getVendors } from "../../api/vendors";
import { createDebitNote, getBillReturnRemaining } from "../../api/gst";
import { extractServerMessage, lineProductId, remainingQtyFor } from "../../utils/fieldErrors";
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import { getCurrencySymbol } from '../../utils/currency';
import { getTodayKolkata } from '../../utils/date';

export default function DebitNoteForm({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [vendorName, setVendorName] = useState("");
  const [vendorGstin, setVendorGstin] = useState("");
  const [originalBillId, setOriginalBillId] = useState("");

  const [reason, setReason] = useState("return");
  const [notes, setNotes] = useState("");
  const [returnItems, setReturnItems] = useState([]);

  // Fetch Vendors for Autocomplete
  const { data: vendorsResult } = useQuery({ 
      queryKey: ["vendors"], 
      queryFn: () => getVendors({ search: "", ordering: "name" }),
      staleTime: 5 * 60 * 1000, 
  });
  const vendors = Array.isArray(vendorsResult) ? vendorsResult : vendorsResult?.data || vendorsResult?.results || [];

  const { data: billsResult } = useQuery({
    queryKey: ["purchase-bills-for-dn", vendorName],
    queryFn: () => getPurchaseBills({ search: vendorName, page_size: 50 }),
    enabled: isOpen && !!vendorName,
  });
  const billList = (Array.isArray(billsResult) ? billsResult : billsResult?.results || [])
    .filter((b) => !vendorName || (b.vendor_name || '').toLowerCase().includes(vendorName.toLowerCase()));

  const handleBillSelect = async (billId) => {
    setOriginalBillId(billId);
    const bill = billList.find((b) => String(b.id) === String(billId));
    if (bill) {
      if (bill.vendor_name) setVendorName(bill.vendor_name);
      if (bill.vendor_gstin) setVendorGstin(bill.vendor_gstin);
    }
    if (!billId) {
      setReturnItems([]);
      return;
    }
    try {
      const [detail, remaining] = await Promise.all([getPurchaseBill(billId), getBillReturnRemaining(billId)]);
      const lines = detail?.items || [];
      const remainingMap = remaining?.remaining_qty || null;
      setReturnItems(lines.map((item) => ({
        // `product` on a bill line is the product NAME; the API needs the UUID.
        product_id: lineProductId(item),
        remaining_qty: remainingQtyFor(lineProductId(item), item.quantity, remainingMap),
        product_name: item.product_name || item.product_detail?.name || item.description || 'Item',
        hsn_sac_code: item.hsn_sac_code,
        unit: item.unit,
        price: parseFloat(item.price || 0),
        return_qty: 0,
        original_qty: parseFloat(item.quantity || 0),
        discount: parseFloat(item.discount || 0),
        tax: parseFloat(item.tax || 0),
        amount: 0,
      })));
    } catch (err) {
      toast.error('Could not load bill lines');
    }
  };

  const createMutation = useMutation({
    mutationFn: createDebitNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["debit-notes"] });
      await queryClient.refetchQueries({ queryKey: ["debit-notes"] });
      toast.success("Debit Note Created");
      handleClose();
    },
    onError: (err) => toast.error(extractServerMessage(err, "Failed to create debit note")),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const itemsToReturn = returnItems
      .filter(item => item.return_qty > 0)
      .map(item => {
        const qty = parseFloat(item.return_qty) || 0;
        const itemPrice = parseFloat(item.price) || 0;
        const discount = parseFloat(item.discount || 0);
        const taxRate = parseFloat(item.tax || 0);
        const base = qty * itemPrice;
        const discAmt = base * (discount / 100);
        const taxable = base - discAmt;
        const taxAmt = taxable * (taxRate / 100);
        const grossAmount = Math.round((taxable + taxAmt) * 100) / 100;
        return {
          product: item.product_id,
          batch: null, // Default batch to null as there's no original bill
          hsn_sac_code: item.hsn_sac_code,
          quantity: qty,
          unit: item.unit,
          price: itemPrice,
          discount: discount,
          tax: taxRate,
          amount: grossAmount
        };
      });

    if (itemsToReturn.length === 0) {
      toast.error("Please add at least one product to return");
      return;
    }

    const totalAmt = Math.round(itemsToReturn.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;

    if (!originalBillId) {
      toast.error("Please link this debit note to an original purchase bill");
      return;
    }

    const payload = {
      date: getTodayKolkata(),
      original_bill: originalBillId,
      vendor_name: vendorName,
      vendor_gstin: vendorGstin,
      reason,
      notes,
      items: itemsToReturn,
      total_amount: totalAmt,
      warehouse: null
    };

    createMutation.mutate(payload);
  };

  const handleClose = () => {
    setVendorName("");
    setVendorGstin("");
    setOriginalBillId("");
    setReturnItems([]);
    setNotes("");
    onClose();
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 text-left align-middle shadow-xl transition-all">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-[var(--text-primary)]">
                New Debit Note (Purchase Return)
              </Dialog.Title>
              <button onClick={handleClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 relative">
                <div className="relative">
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Vendor Name (Type to search)</label>
                  <VendorAutocomplete 
                     vendorName={vendorName} 
                     setVendorName={setVendorName} 
                     vendorGstin={vendorGstin}
                     setVendorGstin={setVendorGstin}
                     vendors={vendors} 
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Vendor GSTIN (Auto-filled on selection)</label>
                   <input
                     type="text"
                     value={vendorGstin}
                     onChange={(e) => setVendorGstin(e.target.value)}
                     className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                     placeholder="Enter GSTIN"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Original Purchase Bill *</label>
                   <select
                     value={originalBillId}
                     onChange={(e) => handleBillSelect(e.target.value)}
                     className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                     required
                   >
                     <option value="">{vendorName ? "Select bill..." : "Enter vendor first..."}</option>
                     {billList.map((b) => (
                       <option key={b.id} value={b.id}>
                         {b.bill_number} — {b.bill_date} — ₹{parseFloat(b.total_amount || 0).toLocaleString('en-IN')}
                       </option>
                     ))}
                   </select>
                </div>
              </div>

              {/* Step 2: Return Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Reason</label>
                  <select 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="return">Goods Returned</option>
                    <option value="defective">Defective</option>
                    <option value="rate_diff">Rate Difference</option>
                    <option value="shortage">Short Supply</option>
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

              <div className="border border-[var(--border-subtle)] rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-medium text-[var(--text-primary)]">Return items from the selected bill</h4>
                {!originalBillId && (
                  <p className="text-xs text-[var(--text-muted)]">Select an original purchase bill to load its lines.</p>
                )}

                {returnItems.length > 0 && (
                  <div className="mt-4 border border-[var(--border-subtle)] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[var(--bg-primary)] text-[var(--text-muted)]">
                        <tr>
                          <th className="p-3">Product</th>
                          <th className="p-3 text-right">Price</th>
                          <th className="p-3 text-right">Can return</th>
                          <th className="p-3 text-right w-32">Return Qty</th>
                          <th className="p-3 text-right w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {returnItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-3 text-[var(--text-primary)]">{item.product_name}</td>
                            <td className="p-3 text-right text-[var(--text-muted)]">{getCurrencySymbol()}{item.price}</td>
                            <td className="p-3 text-right text-[var(--text-muted)]">{item.remaining_qty} of {item.original_qty}</td>
                            <td className="p-3">
                              <input 
                                type="number"
                                min="0"
                                max={item.remaining_qty}
                                disabled={item.remaining_qty <= 0}
                                value={item.return_qty}
                                onChange={(e) => {
                                  const maxQty = item.remaining_qty ?? item.original_qty ?? 0;
                                  const newQty = Math.min(Math.max(parseFloat(e.target.value) || 0, 0), maxQty);
                                  const newItems = [...returnItems];
                                  newItems[idx].return_qty = newQty;
                                  newItems[idx].amount = newItems[idx].price * newQty;
                                  setReturnItems(newItems);
                                }}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded px-2 py-1 text-right text-[var(--text-primary)] focus:border-[var(--accent-primary)]"
                              />
                            </td>
                            <td className="p-3 text-right text-[var(--text-primary)]">{getCurrencySymbol()}{item.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg btn-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || returnItems.length === 0 || !vendorName}
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

// Inline Vendor Autocomplete Component for DebitNoteForm (Simplified for raw State hooks)
function VendorAutocomplete({ vendorName, setVendorName, vendorGstin, setVendorGstin, vendors }) {
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const selectVendor = (vendor) => {
    setVendorName(vendor.name || "");
    setVendorGstin(vendor.gstin || "");
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setVendorName(value);

    if (value.trim()) {
      const filtered = vendors.filter(v =>
        v.name?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredVendors(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <input
        value={vendorName}
        onChange={handleInputChange}
        onFocus={() => {
          if (vendorName.trim()) {
             const filtered = vendors.filter(v => v.name?.toLowerCase().includes(vendorName.toLowerCase()));
             if (filtered.length > 0) {
                setFilteredVendors(filtered);
                setShowDropdown(true);
             }
          }
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder="Search for vendor..."
        className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
        autoComplete="off"
        required
      />
      
      {showDropdown && (
        <div className="absolute z-50 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md shadow-2xl w-full max-h-48 overflow-y-auto mt-1">
          {filteredVendors.slice(0, 50).map(vendor => (
            <div
              key={vendor.id}
              className="px-3 py-3 hover:bg-[var(--bg-primary)] cursor-pointer text-sm border-b border-[var(--border-subtle)] last:border-0 transition-colors"
              onClick={() => selectVendor(vendor)}
            >
              <div className="font-bold text-[var(--accent-primary)]">{vendor.name}</div>
              <div className="text-[var(--text-muted)] text-xs mt-1 flex gap-3">
                 {vendor.gstin && <span>GSTIN: {vendor.gstin}</span>}
              </div>
            </div>
          ))}
          {filteredVendors.length === 0 && (
             <div className="px-3 py-3 text-sm text-[var(--text-muted)] italic">
                No saved vendors found. 
             </div>
          )}
        </div>
      )}
    </div>
  );
}
