import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

export default function LeaveTypeModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const isEdit = Boolean(initialData?.id);
  const [form, setForm] = useState({
    name: "",
    annual_entitlement: "12",
    is_paid: true,
    carry_forward_max_days: "0",
    max_consecutive_days: "0",
    requires_approval: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          name: initialData.name || "",
          annual_entitlement: initialData.annual_entitlement != null ? String(initialData.annual_entitlement) : "12",
          is_paid: initialData.is_paid !== undefined ? initialData.is_paid : true,
          carry_forward_max_days: initialData.carry_forward_max_days != null ? String(initialData.carry_forward_max_days) : "0",
          max_consecutive_days: initialData.max_consecutive_days != null ? String(initialData.max_consecutive_days) : "0",
          requires_approval: initialData.requires_approval !== undefined ? initialData.requires_approval : true,
        });
      } else {
        setForm({
          name: "",
          annual_entitlement: "12",
          is_paid: true,
          carry_forward_max_days: "0",
          max_consecutive_days: "0",
          requires_approval: true,
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter a leave type name");
      return;
    }
    if (!form.annual_entitlement || isNaN(form.annual_entitlement) || Number(form.annual_entitlement) < 0) {
      toast.error("Please enter a valid annual entitlement");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      annual_entitlement: parseFloat(form.annual_entitlement),
      is_paid: form.is_paid,
      carry_forward_max_days: parseFloat(form.carry_forward_max_days || 0),
      max_consecutive_days: parseInt(form.max_consecutive_days || 0, 10),
      requires_approval: form.requires_approval,
    };

    try {
      let res;
      if (isEdit) {
        res = await hrApi.updateLeaveType(initialData.id, payload);
        toast.success("Leave type updated successfully");
      } else {
        res = await hrApi.createLeaveType(payload);
        toast.success("Leave type created successfully");
      }
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      const errData = err.response?.data;
      if (errData && typeof errData === "object") {
        const msg = Object.entries(errData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
          .join("\n");
        toast.error(msg);
      } else {
        toast.error(errData?.detail || `Failed to ${isEdit ? "update" : "create"} leave type`);
      }
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm";
  const labelCls = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            {isEdit ? "Edit Leave Type" : "Add Leave Type"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Leave Type Name *</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Sick Leave, Casual Leave, Vacation"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Annual Days *</label>
              <input
                type="number"
                name="annual_entitlement"
                required
                min="0"
                step="0.5"
                value={form.annual_entitlement}
                onChange={handleChange}
                placeholder="12"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Carry Forward (Days)</label>
              <input
                type="number"
                name="carry_forward_max_days"
                min="0"
                step="0.5"
                value={form.carry_forward_max_days}
                onChange={handleChange}
                placeholder="0"
                className={inputCls}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_paid"
                checked={form.is_paid}
                onChange={handleChange}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-0"
              />
              <span className="text-sm text-gray-300">Paid Leave (Salaried)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="requires_approval"
                checked={form.requires_approval}
                onChange={handleChange}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-0"
              />
              <span className="text-sm text-gray-300">Requires Manager Approval</span>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : isEdit ? "Update Leave Type" : "Save Leave Type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
