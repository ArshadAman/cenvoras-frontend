import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getProducts, getVendorProducts } from "../../api/purchase";
import { getCustomers } from "../../api/customers";
import { createDebitNote } from "../../api/gst";
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

export default function DebitNoteForm({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [vendorName, setVendorName] = useState("");
  const [vendorGstin, setVendorGstin] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [returnQty, setReturnQty] = useState(1);
  const [price, setPrice] = useState(0);

  const [reason, setReason] = useState("return");
  const [notes, setNotes] = useState("");
  const [returnItems, setReturnItems] = useState([]);

  // Fetch Vendors for Autocomplete
  const { data: vendorsResult } = useQuery({ 
      queryKey: ["vendors"], 
      queryFn: () => getCustomers({ search: "", ordering: "name" }),
      staleTime: 5 * 60 * 1000, 
  });
  const vendors = Array.isArray(vendorsResult) ? vendorsResult : vendorsResult?.data || vendorsResult?.results || [];

  // Fetch Products constrained by Vendor instead of all products
  const { data: products } = useQuery({
    queryKey: ["vendorProducts", vendorName],
    queryFn: () => vendorName ? getVendorProducts(vendorName) : Promise.resolve([]),
    enabled: isOpen && step === 1 && !!vendorName,
  });

  const productList = Array.isArray(products) ? products : products?.results || [];

  const handleAddProduct = () => {
    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }
    const product = productList.find(p => p.id === selectedProductId);
    if (!product) return;
    
    const existingIndex = returnItems.findIndex(item => item.product_id === product.id);
    if (existingIndex >= 0) {
      const newItems = [...returnItems];
      newItems[existingIndex].return_qty += parseFloat(returnQty);
      newItems[existingIndex].amount = newItems[existingIndex].price * newItems[existingIndex].return_qty;
      setReturnItems(newItems);
    } else {
      const itemPrice = parseFloat(price) || parseFloat(product.price || 0);
      setReturnItems([...returnItems, {
        product_id: product.id,
        product_name: product.name,
        hsn_sac_code: product.hsn_sac_code,
        unit: product.unit,
        price: itemPrice,
        return_qty: parseFloat(returnQty),
        discount: 0,
        tax: product.tax || 0,
        amount: itemPrice * parseFloat(returnQty)
      }]);
    }
    
    setSelectedProductId("");
    setReturnQty(1);
    setPrice(0);
  };

  const handleRemoveProduct = (index) => {
    setReturnItems(returnItems.filter((_, i) => i !== index));
  };

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
        product: item.product_id,
        batch: null, // Default batch to null as there's no original bill
        hsn_sac_code: item.hsn_sac_code,
        quantity: parseFloat(item.return_qty),
        unit: item.unit,
        price: parseFloat(item.price),
        discount: parseFloat(item.discount || 0),
        tax: parseFloat(item.tax || 0),
        amount: parseFloat(item.amount)
      }));

    if (itemsToReturn.length === 0) {
      toast.error("Please add at least one product to return");
      return;
    }

    const payload = {
      date: new Date().toISOString().split('T')[0],
      original_bill: null,
      vendor_name: vendorName,
      vendor_gstin: vendorGstin,
      reason,
      notes,
      items: itemsToReturn,
      total_amount: itemsToReturn.reduce((sum, item) => sum + item.amount, 0),
      warehouse: null
    };

    createMutation.mutate(payload);
  };

  const handleClose = () => {
    setStep(1);
    setVendorName("");
    setVendorGstin("");
    setSelectedProductId("");
    setReturnQty(1);
    setPrice(0);
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
              <div className="grid grid-cols-1 gap-4 relative">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Vendor Name (Type to search)</label>
                  <VendorAutocomplete 
                     vendorName={vendorName} 
                     setVendorName={setVendorName} 
                     vendorGstin={vendorGstin}
                     setVendorGstin={setVendorGstin}
                     vendors={vendors} 
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-400 mb-1">Vendor GSTIN (Auto-filled on selection)</label>
                   <input
                     type="text"
                     value={vendorGstin}
                     onChange={(e) => setVendorGstin(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                     placeholder="Enter GSTIN"
                   />
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

              {/* Step 3: Add Items */}
              <div className="border border-white/10 rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-medium text-gray-300">Return Items</h4>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Product</label>
                    <select 
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
                    >
                      <option value="">{vendorName ? "Select Product..." : "Please enter a Vendor first..."}</option>
                      {productList.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-gray-400 mb-1">Price</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-gray-400 mb-1">Qty</label>
                    <input 
                      type="number" 
                      min="1"
                      value={returnQty}
                      onChange={(e) => setReturnQty(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddProduct}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>

                {returnItems.length > 0 && (
                  <div className="mt-4 border border-white/10 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/5 text-gray-400">
                        <tr>
                          <th className="p-3">Product</th>
                          <th className="p-3 text-right">Price</th>
                          <th className="p-3 text-right w-32">Return Qty</th>
                          <th className="p-3 text-right w-24">Total</th>
                          <th className="p-3 text-center w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {returnItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-3 text-white">{item.product_name}</td>
                            <td className="p-3 text-right text-gray-400">₹{item.price}</td>
                            <td className="p-3">
                              <input 
                                type="number"
                                min="1"
                                value={item.return_qty}
                                onChange={(e) => {
                                  const newQty = Math.max(parseFloat(e.target.value) || 1, 1);
                                  const newItems = [...returnItems];
                                  newItems[idx].return_qty = newQty;
                                  newItems[idx].amount = newItems[idx].price * newQty;
                                  setReturnItems(newItems);
                                }}
                                className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-right text-white focus:border-purple-500"
                              />
                            </td>
                            <td className="p-3 text-right text-white">₹{item.amount.toFixed(2)}</td>
                            <td className="p-3 text-center">
                              <button type="button" onClick={() => handleRemoveProduct(idx)} className="text-red-400 hover:text-red-300">
                                <XMarkIcon className="w-4 h-4 mx-auto" />
                              </button>
                            </td>
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
                  className="px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors"
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
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-all"
        autoComplete="off"
        required
      />
      
      {showDropdown && (
        <div className="absolute z-50 bg-[#1a1a1a] border border-white/10 rounded-md shadow-2xl w-full max-h-48 overflow-y-auto mt-1">
          {filteredVendors.slice(0, 50).map(vendor => (
            <div
              key={vendor.id}
              className="px-3 py-3 hover:bg-white/5 cursor-pointer text-sm border-b border-white/5 last:border-0 transition-colors"
              onClick={() => selectVendor(vendor)}
            >
              <div className="font-bold text-cyan-400">{vendor.name}</div>
              <div className="text-gray-500 text-xs mt-1 flex gap-3">
                 {vendor.gstin && <span>GSTIN: {vendor.gstin}</span>}
              </div>
            </div>
          ))}
          {filteredVendors.length === 0 && (
             <div className="px-3 py-3 text-sm text-gray-500 italic">
                No saved vendors found. 
             </div>
          )}
        </div>
      )}
    </div>
  );
}
