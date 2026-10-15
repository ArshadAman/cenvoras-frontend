import React, { useState, useEffect, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createProduct, updateProduct, getManufacturers } from "../../api/inventory";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { getCurrencySymbol } from '../../utils/currency';
import { getAllUnits, saveCustomUnit } from '../../utils/units';
import useEscKey from '../../hooks/useEscStack';
import { formatErrorMessage } from '../../utils/toastUtils';

const GST_RATES = [
  { value: 0, label: "0% (Exempt / Nil)" },
  { value: 3, label: "3% (Gold / Precious Metals)" },
  { value: 5, label: "5% (Essential Goods)" },
  { value: 18, label: "18% (Standard Rate)" },
  { value: 40, label: "40% (Sin / Cess Goods)" },
];

const STORAGE_PRESETS = [
  "Room Temperature (RT)",
  "2°C - 8°C",
  "-20°C",
  "-80°C",
];

const productSchema = Yup.object().shape({
  item_code: Yup.string()
    .max(100, "Item code must be 100 characters or less")
    .nullable(),
  name: Yup.string()
    .required("Product name is required")
    .max(255, "Name must be 255 characters or less"),
  manufacturer: Yup.string()
    .max(255, "Manufacturer must be 255 characters or less")
    .nullable(),
  internal_reference: Yup.string()
    .max(100, "Internal reference must be 100 characters or less")
    .nullable(),
  description: Yup.string().nullable(),
  tax: Yup.number()
    .min(0, "Tax cannot be negative")
    .max(100, "Tax cannot exceed 100%")
    .nullable(),
  hsn_sac_code: Yup.string()
    .transform((v) => (v == null ? "" : String(v).trim()))
    .required("HSN/SAC code is required.")
    .test("not-na", "HSN/SAC code is required.", (value) => Boolean(value) && value.toUpperCase() !== "N/A")
    .test("min-digits", "HSN/SAC code must be at least 4 digits (6 digits if turnover > ₹5 Cr).", (value) => {
      const digits = String(value || "").replace(/\D/g, "");
      return digits.length >= 4;
    })
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
    .typeError("Stock must be a whole number")
    .integer("Stock must be a whole number")
    .required("Stock is required"),
  low_stock_alert: Yup.number()
    .integer("Low stock alert must be a whole number")
    .min(0, "Low stock alert must be positive"),
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

function ManufacturerCombobox({ value, onChange, options, inputClass, labelClass }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState(value || "");
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilterText(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = (options || []).filter((opt) =>
    opt.toLowerCase().includes((filterText || "").toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative">
      <label className={labelClass}>Manufacturer</label>
      <div className="relative">
        <input
          type="text"
          value={filterText}
          onChange={(e) => {
            setFilterText(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={`${inputClass} pr-7`}
          placeholder="Select or enter manufacturer"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          tabIndex={-1}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-36 w-full overflow-auto rounded-lg border border-white/20 bg-gray-900/95 p-1 shadow-2xl backdrop-blur-xl text-xs">
          {filtered.map((item) => (
            <li
              key={item}
              onClick={() => {
                setFilterText(item);
                onChange(item);
                setIsOpen(false);
              }}
              className="cursor-pointer rounded px-2.5 py-1.5 text-white/90 hover:bg-cyan-500/20 hover:text-cyan-300 transition"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProductForm({ product, onClose }) {
  useEscKey(onClose, true, 10);
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const { data: manufacturerList = [] } = useQuery({
    queryKey: ['inventory-manufacturers'],
    queryFn: getManufacturers,
    staleTime: 60 * 1000,
  });

  const [availableUnits, setAvailableUnits] = useState(() => {
    const defaultUnits = getAllUnits();
    if (product?.unit && !defaultUnits.includes(product.unit)) {
      return [...defaultUnits, product.unit];
    }
    return defaultUnits;
  });
  const [isCustomUnit, setIsCustomUnit] = useState(false);

  const applyServerFieldErrors = (error, setFieldError) => {
    const data = error?.response?.data;
    if (!data || typeof data !== "object") return false;

    // Support both DRF field maps and { error, details } envelopes
    const fieldMap =
      data.details && typeof data.details === "object" && !Array.isArray(data.details)
        ? data.details
        : data;

    const skipKeys = new Set(["detail", "error", "message", "non_field_errors", "details"]);
    let applied = false;

    Object.entries(fieldMap).forEach(([field, messages]) => {
      if (skipKeys.has(field)) return;
      const msg = Array.isArray(messages) ? messages[0] : messages;
      if (typeof msg === "string" && msg.trim()) {
        setFieldError(field, msg);
        applied = true;
      }
    });
    return applied;
  };

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Product created successfully!");
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Product updated successfully!");
      onClose();
    },
  });

  const initialValues = {
    item_code: product?.item_code || "",
    name: product?.name || "",
    manufacturer: product?.manufacturer || "",
    internal_reference: product?.internal_reference || "",
    description: product?.description || "",
    tax: product?.tax != null && product?.tax !== "" ? Number(product.tax) : 0,
    hsn_sac_code: product?.hsn_sac_code || product?.hsn_code || "",
    unit: product?.unit || "pcs",
    secondary_unit: product?.secondary_unit || "",
    conversion_factor: product?.conversion_factor || 1,
    cost_price: product?.cost_price ?? product?.price ?? product?.purchase_price ?? product?.unit_price ?? "",
    sale_price: product?.sale_price ?? "",
    stock: product?.stock != null ? product.stock : 0,
    low_stock_alert: product?.low_stock_alert || product?.min_stock_level || "",
    meta: {
      barcode: product?.barcode || product?.meta?.barcode || "",
      expiry_date: product?.meta?.expiry_date || "",
      storage_condition: product?.meta?.storage_condition || "",
    },
  };

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    const metaData = {};

    if (values.meta.barcode?.trim()) metaData.barcode = values.meta.barcode;
    if (values.meta.expiry_date) metaData.expiry_date = values.meta.expiry_date;
    if (values.meta.storage_condition?.trim()) metaData.storage_condition = values.meta.storage_condition;

    const productData = {
      item_code: values.item_code?.trim() || null,
      name: values.name,
      manufacturer: values.manufacturer?.trim() || null,
      internal_reference: values.internal_reference?.trim() || null,
      description: values.description || null,
      tax: values.tax ? parseFloat(values.tax) : 0,
      hsn_sac_code: values.hsn_sac_code?.trim() || null,
      unit: values.unit,
      secondary_unit: values.secondary_unit || null,
      conversion_factor: values.conversion_factor ? parseInt(values.conversion_factor) : 1,
      cost_price: values.cost_price,
      sale_price: values.sale_price,
      stock: values.stock === "" || values.stock == null ? 0 : parseInt(values.stock, 10),
      low_stock_alert: parseInt(values.low_stock_alert) || 0,
      meta: metaData,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: product.id, data: productData });
      } else {
        await createMutation.mutateAsync(productData);
      }
    } catch (error) {
      console.error(isEdit ? "Error updating product:" : "Error creating product:", error);
      const hasFieldError = applyServerFieldErrors(error, setFieldError);
      const fallback = isEdit ? "Failed to update product" : "Failed to create product";
      const toastMsg = formatErrorMessage(error, fallback);
      // Always surface HSN clearly when that field failed
      if (hasFieldError && error?.response?.data?.hsn_sac_code) {
        const hsnMsg = Array.isArray(error.response.data.hsn_sac_code)
          ? error.response.data.hsn_sac_code[0]
          : error.response.data.hsn_sac_code;
        toast.error(typeof hsnMsg === "string" ? hsnMsg : toastMsg);
      } else if (hasFieldError && error?.response?.data?.details?.hsn_sac_code) {
        const hsnMsg = Array.isArray(error.response.data.details.hsn_sac_code)
          ? error.response.data.details.hsn_sac_code[0]
          : error.response.data.details.hsn_sac_code;
        toast.error(typeof hsnMsg === "string" ? hsnMsg : toastMsg);
      } else {
        toast.error(toastMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const activeGstRates = React.useMemo(() => {
    const rates = [...GST_RATES];
    const currentTax = product?.tax != null ? Number(product.tax) : null;
    if (currentTax !== null && !rates.some((r) => r.value === currentTax)) {
      rates.push({ value: currentTax, label: `${currentTax}% (Legacy Rate)` });
    }
    return rates;
  }, [product?.tax]);

  const inputClass = "w-full bg-[#111] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all";
  const labelClass = "block text-[11px] font-medium text-gray-400 mb-1 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[94vh] overflow-y-auto bento-card !p-0 shadow-2xl shadow-cyan-900/20 animate-fade-up">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? "Edit Product" : "New Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={productSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, values, setFieldValue }) => (
            <Form className="p-4 sm:p-5 space-y-3">
              {/* Row 1: Code, Name, HSN */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Item Code / SKU</label>
                  <Field
                    name="item_code"
                    type="text"
                    className={inputClass}
                    placeholder="e.g. PRD-001 (optional)"
                  />
                  <ErrorMessage name="item_code" component="div" className="text-red-400 text-xs mt-0.5" />
                </div>

                <div>
                  <label className={labelClass}>Product Name *</label>
                  <Field
                    name="name"
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Wireless Headphones"
                  />
                  <ErrorMessage name="name" component="div" className="text-red-400 text-xs mt-0.5" />
                </div>

                <div>
                  <label className={labelClass}>HSN/SAC Code *</label>
                  <Field
                    name="hsn_sac_code"
                    type="text"
                    className={inputClass}
                    placeholder="e.g. 8518"
                  />
                  <ErrorMessage name="hsn_sac_code" component="div" className="text-red-400 text-xs mt-0.5" />
                </div>
              </div>

              {/* Row 2: Manufacturer, GST Rate, Primary Unit, Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <ManufacturerCombobox
                    value={values.manufacturer}
                    onChange={(val) => setFieldValue("manufacturer", val)}
                    options={manufacturerList}
                    inputClass={inputClass}
                    labelClass={labelClass}
                  />
                  <ErrorMessage name="manufacturer" component="div" className="text-red-400 text-xs mt-0.5" />
                </div>

                <div>
                  <label className={labelClass}>GST Tax Rate (%)</label>
                  <Field
                    as="select"
                    name="tax"
                    className={inputClass}
                  >
                    {activeGstRates.map((rate) => (
                      <option key={rate.value} value={rate.value}>
                        {rate.label}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="tax" component="div" className="text-red-400 text-xs mt-0.5" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelClass}>Primary Unit *</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomUnit(!isCustomUnit)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 transition underline"
                    >
                      {isCustomUnit ? "Predefined" : "+ Custom"}
                    </button>
                  </div>
                  <Field name="unit">
                    {({ field, form }) => isCustomUnit ? (
                      <input
                        {...field}
                        type="text"
                        className={inputClass}
                        placeholder="e.g. tablet, vial…"
                        onChange={(e) => {
                          field.onChange(e);
                          if (e.target.value.trim()) {
                            saveCustomUnit(e.target.value.trim());
                            setAvailableUnits(getAllUnits());
                          }
                        }}
                      />
                    ) : (
                      <select
                        {...field}
                        className={inputClass}
                        onChange={(e) => {
                          if (e.target.value === '__add_custom__') {
                            setIsCustomUnit(true);
                            form.setFieldValue("unit", "");
                          } else {
                            field.onChange(e);
                          }
                        }}
                      >
                        <option value="">Select Unit</option>
                        {availableUnits.map((u) => (
                          <option key={u} value={u} className="bg-gray-800 text-white">
                            {u.toUpperCase()}
                          </option>
                        ))}
                        <option value="__add_custom__" className="bg-gray-800 text-cyan-400 font-semibold">
                          + Custom Unit...
                        </option>
                      </select>
                    )}
                  </Field>
                  <ErrorMessage name="unit" component="div" className="text-red-400 text-xs mt-0.5" />
                </div>

                <div>
                  <label className={labelClass}>Stock *</label>
                  <Field
                    name="stock"
                    type="number"
                    min="0"
                    className={inputClass}
                    placeholder="0"
                  />
                  <ErrorMessage name="stock" component="div" className="text-red-400 text-xs mt-0.5" />
                </div>
              </div>

              {/* Row 3: Cost Price, Sale Price, Secondary Unit, Conversion Factor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className={labelClass}>Cost Price ({getCurrencySymbol()})</label>
                  <Field
                    name="cost_price"
                    type="text"
                    className={inputClass}
                    placeholder="Optional"
                  />
                  <ErrorMessage name="cost_price" component="div" className="text-red-400 text-xs mt-0.5" />
                </div>

                <div>
                  <label className={labelClass}>Sale Price ({getCurrencySymbol()}) *</label>
                  <Field
                    name="sale_price"
                    type="text"
                    className={inputClass}
                    placeholder="0.00"
                  />
                  <ErrorMessage name="sale_price" component="div" className="text-red-400 text-xs mt-0.5" />
                </div>

                <div>
                  <label className={labelClass}>Secondary Unit</label>
                  <Field
                    name="secondary_unit"
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Box"
                  />
                  <ErrorMessage name="secondary_unit" component="div" className="text-red-400 text-xs mt-0.5" />
                </div>

                <div>
                  <label className={labelClass}>Conversion Factor</label>
                  <Field
                    name="conversion_factor"
                    type="number"
                    min="1"
                    className={inputClass}
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    1 {values.secondary_unit || 'Box'} = {values.conversion_factor || 1} {values.unit || 'pcs'}
                  </p>
                </div>
              </div>

              {/* Row 4: Low Stock Alert, Expiry Date, Storage Condition, Internal Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className={labelClass}>Low Stock Alert</label>
                  <Field
                    name="low_stock_alert"
                    type="number"
                    min="0"
                    className={inputClass}
                    placeholder="e.g. 10"
                  />
                  <ErrorMessage name="low_stock_alert" component="div" className="text-red-400 text-xs mt-0.5" />
                </div>

                <div>
                  <label className={labelClass}>Expiry Date/Warranty</label>
                  <FormattedDateInput
                    value={values.meta.expiry_date}
                    onChange={(val) => setFieldValue("meta.expiry_date", val)}
                    className={inputClass}
                  />
                  <ErrorMessage name="meta.expiry_date" component="div" className="text-red-400 text-xs mt-0.5" />
                </div>

                <div>
                  <StorageConditionSelector
                    value={values.meta.storage_condition}
                    onChange={(val) => setFieldValue("meta.storage_condition", val)}
                    inputClass={inputClass}
                    labelClass={labelClass}
                  />
                  <ErrorMessage name="meta.storage_condition" component="div" className="text-red-400 text-xs mt-0.5" />
                </div>

                <div>
                  <label className={labelClass}>Internal Reference</label>
                  <Field
                    name="internal_reference"
                    type="text"
                    className={inputClass}
                    placeholder="e.g. REF-2026-X"
                  />
                  <ErrorMessage name="internal_reference" component="div" className="text-red-400 text-xs mt-0.5" />
                </div>
              </div>

              {/* Row 5: Description / Notes */}
              <div>
                <label className={labelClass}>Description / Notes</label>
                <Field
                  name="description"
                  type="text"
                  className={inputClass}
                  placeholder="Optional product description or notes"
                />
                <ErrorMessage name="description" component="div" className="text-red-400 text-xs mt-0.5" />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white font-medium hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 text-sm bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-500/20"
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
