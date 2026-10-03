import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createProduct, updateProduct } from "../../api/inventory";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { getCurrencySymbol } from '../../utils/currency';

const UNIT_OPTIONS = ["pcs", "kg", "g", "mg", "l", "ml", "cm", "m", "mm", "box", "pack", "dozen", "other"];

const GST_RATES = [
  { value: 0, label: "0% (Exempt / Nil)" },
  { value: 3, label: "3% (Gold / Precious Metals)" },
  { value: 5, label: "5% (Essential Goods)" },
  { value: 12, label: "12% (Standard Goods)" },
  { value: 18, label: "18% (Standard Rate)" },
  { value: 28, label: "28% (Luxury Goods)" },
  { value: 40, label: "40% (Sin / Cess Goods)" },
];

const STORAGE_PRESETS = [
  "Room Temperature (RT)",
  "2°C - 8°C",
  "-20°C",
  "-80°C",
];

const productSchema = Yup.object().shape({
  name: Yup.string()
    .required("Product name is required")
    .max(255, "Name must be 255 characters or less"),
  manufacturer: Yup.string()
    .max(255, "Manufacturer must be 255 characters or less")
    .nullable(),
  description: Yup.string().nullable(),
  tax: Yup.number()
    .min(0, "Tax cannot be negative")
    .max(100, "Tax cannot exceed 100%")
    .nullable(),
  hsn_sac_code: Yup.string()
    .max(20, "HSN/SAC code must be 20 characters or less"),
  unit: Yup.string()
    .required("Unit is required")
    .max(50, "Unit must be 50 characters or less"),
  secondary_unit: Yup.string()
    .max(20, "Secondary unit must be 20 characters or less")
    .nullable(),
  conversion_factor: Yup.number()
    .integer("Conversion factor must be a whole number")
    .min(1, "Conversion factor must be at least 1")
    .nullable(),
  cost_price: Yup.string()
    .nullable()
    .test("is-decimal-or-empty", "Cost price must be a valid decimal number", (value) => {
      if (value === null || value === undefined || value === "") return true;
      return /^(\d+(\.\d{1,4})?|\.\d{1,4})$/.test(String(value).trim());
    }),
  sale_price: Yup.string()
    .required("Sale price is required")
    .test("is-decimal", "Sale price must be a valid decimal number", (value) => {
      if (value === null || value === undefined || value === "") return false;
      return /^(\d+(\.\d{1,4})?|\.\d{1,4})$/.test(String(value).trim());
    }),
  stock: Yup.number()
    .required("Stock is required")
    .integer("Stock must be a whole number")
    .min(0, "Stock must be positive"),
  low_stock_alert: Yup.number()
    .integer("Low stock alert must be a whole number")
    .min(0, "Low stock alert must be positive"),
  warranty_months: Yup.number()
    .integer("Warranty must be a whole number")
    .min(0, "Warranty must be positive"),
  meta: Yup.object().shape({
    expiry_date: Yup.string().nullable(),
    storage_condition: Yup.string().max(150, "Storage condition must be 150 characters or less").nullable(),
  }),
});

// Helper component for DD/MM/YYYY Expiry Date input
function FormattedDateInput({ value, onChange, className }) {
  // Convert ISO (YYYY-MM-DD) to DD/MM/YYYY for display
  const isoToDisplay = (isoStr) => {
    if (!isoStr) return "";
    const parts = String(isoStr).split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const [y, m, d] = parts;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    return isoStr;
  };

  // Convert DD/MM/YYYY to ISO (YYYY-MM-DD)
  const displayToIso = (dispStr) => {
    if (!dispStr) return "";
    const clean = dispStr.trim();
    const parts = clean.split(/[/.-]/);
    if (parts.length === 3) {
      let [d, m, y] = parts;
      if (y.length === 2) y = `20${y}`;
      if (y.length === 4 && d.length <= 2 && m.length <= 2) {
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    return dispStr;
  };

  const [displayText, setDisplayText] = useState(() => isoToDisplay(value));
  const hiddenDateRef = React.useRef(null);

  useEffect(() => {
    setDisplayText(isoToDisplay(value));
  }, [value]);

  const handleTextChange = (e) => {
    const raw = e.target.value;
    setDisplayText(raw);
    const iso = displayToIso(raw);
    onChange(iso);
  };

  const handleNativePickerChange = (e) => {
    const isoVal = e.target.value;
    onChange(isoVal);
    setDisplayText(isoToDisplay(isoVal));
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        value={displayText}
        onChange={handleTextChange}
        placeholder="dd/mm/yyyy"
        className={`${className} pr-10 font-mono`}
      />
      <button
        type="button"
        onClick={() => hiddenDateRef.current?.showPicker ? hiddenDateRef.current.showPicker() : hiddenDateRef.current?.focus()}
        className="absolute right-3 p-1 text-gray-400 hover:text-cyan-400 transition-colors"
        title="Open calendar"
      >
        <CalendarIcon className="w-5 h-5" />
      </button>
      <input
        ref={hiddenDateRef}
        type="date"
        value={value || ""}
        onChange={handleNativePickerChange}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}

// Storage Condition Dropdown + Custom Field Component
function StorageConditionSelector({ value, onChange, inputClass, labelClass }) {
  const isPreset = STORAGE_PRESETS.includes(value);
  const initialMode = value ? (isPreset ? value : "custom") : "";
  const [selectedOption, setSelectedOption] = useState(initialMode);
  const [customText, setCustomText] = useState(isPreset ? "" : (value || ""));

  useEffect(() => {
    if (STORAGE_PRESETS.includes(value)) {
      setSelectedOption(value);
      setCustomText("");
    } else if (value) {
      setSelectedOption("custom");
      setCustomText(value);
    } else {
      setSelectedOption("");
      setCustomText("");
    }
  }, [value]);

  const handleSelectChange = (e) => {
    const opt = e.target.value;
    setSelectedOption(opt);
    if (opt === "custom") {
      onChange(customText);
    } else {
      onChange(opt);
    }
  };

  const handleCustomChange = (e) => {
    const text = e.target.value;
    setCustomText(text);
    onChange(text);
  };

  return (
    <div className="space-y-2">
      <label className={labelClass}>Storage Condition</label>
      <select
        value={selectedOption}
        onChange={handleSelectChange}
        className={inputClass}
      >
        <option value="">Select storage condition...</option>
        {STORAGE_PRESETS.map((preset) => (
          <option key={preset} value={preset}>
            {preset}
          </option>
        ))}
        <option value="custom">Custom...</option>
      </select>

      {selectedOption === "custom" && (
        <input
          type="text"
          value={customText}
          onChange={handleCustomChange}
          placeholder="e.g. Store below 25°C, protect from light"
          className={`${inputClass} animate-fade-in text-sm`}
          autoFocus
        />
      )}
    </div>
  );
}

export default function ProductForm({ product, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Product created successfully!");
      onClose();
    },
    onError: (error) => {
      console.error("Error creating product:", error);
      toast.error(error.response?.data?.message || "Failed to create product");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Product updated successfully!");
      onClose();
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      toast.error(error.response?.data?.message || "Failed to update product");
    },
  });

  const initialValues = {
    name: product?.name || "",
    manufacturer: product?.manufacturer || "",
    description: product?.description || "",
    tax: product?.tax != null && product?.tax !== "" ? Number(product.tax) : 0,
    hsn_sac_code: product?.hsn_sac_code || product?.hsn_code || "",
    unit: product?.unit || "pcs",
    secondary_unit: product?.secondary_unit || "",
    conversion_factor: product?.conversion_factor || 1,
    cost_price: product?.cost_price ?? product?.price ?? product?.purchase_price ?? product?.unit_price ?? "",
    sale_price: product?.sale_price ?? "",
    stock: product?.stock || product?.current_stock || "",
    low_stock_alert: product?.low_stock_alert || product?.min_stock_level || "",
    warranty_months: product?.warranty_months || 0,
    meta: {
      barcode: product?.barcode || product?.meta?.barcode || "",
      expiry_date: product?.meta?.expiry_date || "",
      storage_condition: product?.meta?.storage_condition || "",
    },
  };

  const handleSubmit = (values, { setSubmitting }) => {
    const metaData = {};

    if (values.meta.barcode?.trim()) metaData.barcode = values.meta.barcode;
    if (values.meta.expiry_date) metaData.expiry_date = values.meta.expiry_date;
    if (values.meta.storage_condition?.trim()) metaData.storage_condition = values.meta.storage_condition;

    const productData = {
      name: values.name,
      manufacturer: values.manufacturer?.trim() || null,
      description: values.description || null,
      tax: values.tax ? parseFloat(values.tax) : 0,
      hsn_sac_code: values.hsn_sac_code || null,
      unit: values.unit,
      secondary_unit: values.secondary_unit || null,
      conversion_factor: values.conversion_factor ? parseInt(values.conversion_factor) : 1,
      cost_price: values.cost_price,
      sale_price: values.sale_price,
      stock: parseInt(values.stock),
      low_stock_alert: parseInt(values.low_stock_alert) || 0,
      warranty_months: parseInt(values.warranty_months) || 0,
      meta: metaData,
    };

    if (isEdit) {
      updateMutation.mutate({ id: product.id, data: productData });
    } else {
      createMutation.mutate(productData);
    }
    setSubmitting(false);
  };

  const inputClass = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-20 sm:pt-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bento-card !p-0 shadow-2xl shadow-cyan-900/20 animate-fade-up">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? "Edit Product" : "New Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={productSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, values, setFieldValue }) => (
            <Form className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
              {/* Section 1: Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Product Name *</label>
                  <Field
                    name="name"
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Wireless Headphones"
                  />
                  <ErrorMessage name="name" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <div>
                  <label className={labelClass}>HSN/SAC Code</label>
                  <Field
                    name="hsn_sac_code"
                    type="text"
                    className={inputClass}
                    placeholder="e.g. 8518"
                  />
                  <ErrorMessage name="hsn_sac_code" component="div" className="text-red-400 text-xs mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Manufacturer</label>
                  <Field
                    name="manufacturer"
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Cipla, Sun Pharma, Samsung"
                  />
                  <ErrorMessage name="manufacturer" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <div>
                  <label className={labelClass}>GST Tax Rate (%)</label>
                  <Field
                    as="select"
                    name="tax"
                    className={inputClass}
                  >
                    {GST_RATES.map((rate) => (
                      <option key={rate.value} value={rate.value}>
                        {rate.label}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="tax" component="div" className="text-red-400 text-xs mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Description / Notes</label>
                  <Field
                    as="textarea"
                    name="description"
                    className={`${inputClass} resize-none h-[52px]`}
                    placeholder="Optional description"
                  />
                  <ErrorMessage name="description" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <div>
                  <StorageConditionSelector
                    value={values.meta.storage_condition}
                    onChange={(val) => setFieldValue("meta.storage_condition", val)}
                    inputClass={inputClass}
                    labelClass={labelClass}
                  />
                  <ErrorMessage name="meta.storage_condition" component="div" className="text-red-400 text-xs mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Expiry Date (Optional)</label>
                  <FormattedDateInput
                    value={values.meta.expiry_date}
                    onChange={(val) => setFieldValue("meta.expiry_date", val)}
                    className={inputClass}
                  />
                  <ErrorMessage name="meta.expiry_date" component="div" className="text-red-400 text-xs mt-1" />
                </div>
              </div>

              {/* Section 2: Units */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Primary Unit *</label>
                  <Field name="unit">
                    {({ field }) => (
                      <>
                        <input
                          {...field}
                          type="text"
                          list="unit-datalist"
                          className={inputClass}
                          placeholder="e.g. pcs, kg, box, nos, tablet…"
                          autoComplete="off"
                        />
                        <datalist id="unit-datalist">
                          {UNIT_OPTIONS.map((u) => (
                            <option key={u} value={u} />
                          ))}
                        </datalist>
                      </>
                    )}
                  </Field>
                  <ErrorMessage name="unit" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <div>
                  <label className={labelClass}>Secondary Unit</label>
                  <Field
                    name="secondary_unit"
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Box"
                  />
                  <ErrorMessage name="secondary_unit" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <div>
                  <label className={labelClass}>Conversion Factor</label>
                  <Field
                    name="conversion_factor"
                    type="number"
                    min="1"
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    1 {values.secondary_unit || 'Box'} = {values.conversion_factor || 1} {values.unit || 'pcs'}
                  </p>
                </div>
              </div>

              {/* Section 3: Pricing & Stock (Stock Value removed) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Cost Price ({getCurrencySymbol()})</label>
                  <Field
                    name="cost_price"
                    type="text"
                    className={inputClass}
                    placeholder="Optional"
                  />
                  <ErrorMessage name="cost_price" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <div>
                  <label className={labelClass}>Sale Price ({getCurrencySymbol()}) *</label>
                  <Field
                    name="sale_price"
                    type="text"
                    className={inputClass}
                    placeholder="0.00"
                  />
                  <ErrorMessage name="sale_price" component="div" className="text-red-400 text-xs mt-1" />
                </div>

                <div>
                  <label className={labelClass}>Opening Stock *</label>
                  <Field
                    name="stock"
                    type="number"
                    min="0"
                    className={inputClass}
                    placeholder="0"
                  />
                  <ErrorMessage name="stock" component="div" className="text-red-400 text-xs mt-1" />
                </div>
              </div>

              {/* Section 4: Alerts & Warranty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Low Stock Alert</label>
                  <Field
                    name="low_stock_alert"
                    type="number"
                    min="0"
                    className={inputClass}
                    placeholder="e.g. 10"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Get notified when stock falls below this level.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Warranty (Months)</label>
                  <Field
                    name="warranty_months"
                    type="number"
                    min="0"
                    className={inputClass}
                    placeholder="e.g. 12"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Warranty duration from sale date. 0 = no warranty.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-gray-300 hover:text-white font-medium hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  {isSubmitting || createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : isEdit
                    ? "Update Product"
                    : "Create Product"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
