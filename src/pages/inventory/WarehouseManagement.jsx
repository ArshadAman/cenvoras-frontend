import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { getWarehouses, createWarehouse, getStockPoints } from "../../api/inventory";
import { updateWarehouse, deleteWarehouse } from "../../api/reports";
import {
  BuildingStorefrontIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  MapPinIcon,
  CubeIcon,
  InformationCircleIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

// Batch Detail Modal
function BatchStockModal({ batch, warehouseName, onClose }) {
  if (!batch) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl animate-fade-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-xl">
              <TagIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Batch Details</h2>
              <p className="text-xs text-gray-400">Warehouse: {warehouseName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-3 col-span-2">
              <div className="text-xs text-gray-500 mb-1">Product</div>
              <div className="text-white font-bold text-lg">{batch.product_name || batch.batch?.product_name || "—"}</div>
              {(batch.product_id || batch.batch?.product) && (
                <div className="text-xs text-gray-500 mt-0.5">ID: {batch.product_id || batch.batch?.product}</div>
              )}
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-1">Batch Number</div>
              <div className="text-cyan-300 font-bold">{batch.batch_number || batch.batch?.batch_number || "—"}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-1">Quantity</div>
              <div className={`font-bold text-xl ${batch.quantity > 0 ? "text-green-400" : "text-red-400"}`}>
                {batch.quantity}
              </div>
            </div>
            {(batch.expiry_date || batch.batch?.expiry_date) && (
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">Expiry Date</div>
                <div className="text-amber-300 font-medium">
                  {new Date(batch.expiry_date || batch.batch?.expiry_date).toLocaleDateString("en-IN")}
                </div>
              </div>
            )}
            {(batch.manufacturing_date || batch.batch?.manufacturing_date) && (
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">Mfg. Date</div>
                <div className="text-gray-300 font-medium">
                  {new Date(batch.manufacturing_date || batch.batch?.manufacturing_date).toLocaleDateString("en-IN")}
                </div>
              </div>
            )}
            <div className="bg-white/5 rounded-xl p-3 col-span-2">
              <div className="text-xs text-gray-500 mb-1">Last Updated</div>
              <div className="text-gray-300 font-medium">
                {batch.last_updated ? new Date(batch.last_updated).toLocaleString("en-IN") : "—"}
              </div>
            </div>
            {batch.notes && (
              <div className="bg-white/5 rounded-xl p-3 col-span-2">
                <div className="text-xs text-gray-500 mb-1">Notes</div>
                <div className="text-gray-300 text-sm leading-relaxed">{batch.notes}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function WarehouseManagement() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [formData, setFormData] = useState({ name: "", address: "" });
  const [expandedWarehouse, setExpandedWarehouse] = useState(null);
  const [error, setError] = useState("");
  const [viewBatch, setViewBatch] = useState(null);

  // Fetch warehouses
  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: getWarehouses,
  });

  const warehouseList = Array.isArray(warehouses)
    ? warehouses
    : warehouses.results || [];

  // Fetch stock points for expanded warehouse
  const { data: stockPoints = [] } = useQuery({
    queryKey: ["stockPoints", expandedWarehouse],
    queryFn: () => getStockPoints({ warehouse: expandedWarehouse }),
    enabled: !!expandedWarehouse,
  });

  const stockList = Array.isArray(stockPoints)
    ? stockPoints
    : stockPoints.results || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries(["warehouses"]);
      resetForm();
    },
    onError: (err) =>
      setError(err.response?.data?.name?.[0] || "Failed to create warehouse."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["warehouses"]);
      resetForm();
    },
    onError: (err) =>
      setError(err.response?.data?.name?.[0] || "Failed to update warehouse."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries(["warehouses"]);
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingWarehouse(null);
    setFormData({ name: "", address: "" });
    setError("");
  };

  const handleEdit = (wh) => {
    setEditingWarehouse(wh);
    setFormData({ name: wh.name, address: wh.address || "" });
    setShowForm(true);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!formData.name.trim()) {
      setError("Warehouse name is required.");
      return;
    }
    if (editingWarehouse) {
      updateMutation.mutate({ id: editingWarehouse.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (wh) => {
    if (window.confirm(`Delete warehouse "${wh.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(wh.id);
    }
  };

  const expandedWarehouseName = warehouseList.find((w) => w.id === expandedWarehouse)?.name;

  return (
    <>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
              <BuildingStorefrontIcon className="w-8 h-8 text-purple-400" />
              Godown / Multi-Store
            </h1>
            <p className="text-gray-400 text-sm">
              Manage warehouses, godowns, and view stock distribution.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="btn-primary text-sm py-2 px-4 shadow-lg shadow-purple-500/20 flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Warehouse</span>
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bento-card p-6 border-purple-500/30">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingWarehouse ? "Edit Warehouse" : "New Warehouse"}
            </h2>
            {error && (
              <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Main Godown, Cold Storage #2"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="e.g. Plot 12, Industrial Area"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckIcon className="w-4 h-4" />
                  {editingWarehouse ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Warehouse Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-500">
            Loading warehouses...
          </div>
        ) : warehouseList.length === 0 ? (
          <div className="bento-card p-12 text-center">
            <BuildingStorefrontIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-400 mb-2">
              No Warehouses Yet
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Create your first warehouse or godown to start tracking stock
              across locations.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary text-sm py-2 px-4"
            >
              <PlusIcon className="w-4 h-4" /> Add Warehouse
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouseList.map((wh) => (
              <div
                key={wh.id}
                className={`bento-card p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                  expandedWarehouse === wh.id
                    ? "ring-2 ring-purple-500/50"
                    : ""
                }`}
                onClick={() =>
                  setExpandedWarehouse(
                    expandedWarehouse === wh.id ? null : wh.id
                  )
                }
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <BuildingStorefrontIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        {wh.name}
                      </h3>
                      {wh.address && (
                        <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                          <MapPinIcon className="w-3 h-3" /> {wh.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(wh)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>
                    <button
                      onClick={() => handleDelete(wh)}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      wh.is_active
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {wh.is_active ? "Active" : "Inactive"}
                  </span>
                  <span className="text-xs text-gray-500">
                    Click to view stock
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stock Points for Expanded Warehouse */}
        {expandedWarehouse && (
          <div className="bento-card overflow-hidden animate-fade-up">
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
              <CubeIcon className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Stock in {expandedWarehouseName}
              </h2>
              <span className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                <InformationCircleIcon className="w-4 h-4" />
                Click a row for batch details
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">
                      Product
                    </th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">
                      Batch
                    </th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">
                      Quantity
                    </th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stockList.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-8 text-center text-gray-500"
                      >
                        No stock recorded in this warehouse.
                      </td>
                    </tr>
                  ) : (
                    stockList.map((sp, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => setViewBatch(sp)}
                      >
                        <td className="p-4">
                          <div className="text-sm text-white font-semibold">
                            {sp.product_name || sp.batch?.product_name || "—"}
                          </div>
                          {(sp.product_id || sp.batch?.product) && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              ID: {sp.product_id || sp.batch?.product}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-300 text-xs font-bold">
                            <TagIcon className="w-3 h-3" />
                            {sp.batch_number || sp.batch?.batch_number || "—"}
                          </span>
                        </td>
                        <td
                          className={`p-4 text-sm font-bold text-right ${
                            sp.quantity > 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {sp.quantity}
                        </td>
                        <td className="p-4 text-sm text-gray-400">
                          {sp.last_updated
                            ? new Date(sp.last_updated).toLocaleDateString("en-IN")
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Batch Detail Modal */}
      <BatchStockModal
        batch={viewBatch}
        warehouseName={expandedWarehouseName}
        onClose={() => setViewBatch(null)}
      />
    </>
  );
}
