import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon, ArrowRightIcon, CheckCircleIcon, ExclamationTriangleIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { bulkUploadProductsCsv } from '../../api/inventory';
import { toast } from 'react-toastify';
import InlineProgressBar from '../common/InlineProgressBar';

// Standard inventory target fields that can be mapped
const TARGET_FIELDS = [
  { key: 'item_code', label: 'Item Code / SKU (Unique ID)', required: false, aliases: ['item_code', 'itemcode', 'item_id', 'itemid', 'sku', 'product_code', 'product_id', 'code'] },
  { key: 'name', label: 'Product Name', required: true, aliases: ['name', 'product_name', 'item_name', 'product', 'item', 'title', 'description_name'] },
  { key: 'unit', label: 'Primary Unit (optional — defaults to pcs)', required: false, aliases: ['unit', 'uom', 'unit_of_measure', 'measurement_unit', 'unit_name'] },
  { key: 'sale_price', label: 'Sale Price', required: true, aliases: ['sale_price', 'sales_price', 'selling_price', 'mrp', 'rate', 'price', 'retail_price'] },
  { key: 'cost_price', label: 'Cost Price', required: false, aliases: ['cost_price', 'purchase_price', 'cost', 'buying_price', 'purchase_rate'] },
  { key: 'stock', label: 'Stock', required: false, aliases: ['stock', 'opening_stock', 'current_stock', 'qty', 'quantity', 'balance'] },
  { key: 'hsn_sac_code', label: 'HSN / SAC Code', required: false, aliases: ['hsn_sac_code', 'hsn_code', 'hsn', 'sac', 'hsncode', 'sac_code'] },
  { key: 'manufacturer', label: 'Manufacturer', required: false, aliases: ['manufacturer', 'mfg', 'mfg_by', 'brand', 'company', 'make', 'producer'] },
  { key: 'internal_reference', label: 'Internal Reference', required: false, aliases: ['internal_reference', 'internal_ref', 'internalref', 'reference', 'ref_no', 'ref'] },
  { key: 'description', label: 'Description / Notes', required: false, aliases: ['description', 'notes', 'details', 'remarks', 'item_description'] },
  { key: 'tax', label: 'GST Tax Rate (%)', required: false, aliases: ['tax', 'gst', 'gst_rate', 'tax_rate', 'gst_%'] },
  { key: 'expiry_date', label: 'Expiry Date / Warranty', required: false, aliases: ['expiry_date', 'exp_date', 'expiry', 'exp', 'expiration', 'warranty_date'] },
  { key: 'storage_condition', label: 'Storage Condition', required: false, aliases: ['storage_condition', 'storage', 'temperature', 'temp_condition'] },
  { key: 'low_stock_alert', label: 'Low Stock Alert', required: false, aliases: ['low_stock_alert', 'min_stock_level', 'reorder_level', 'min_stock'] },
  { key: 'secondary_unit', label: 'Secondary Unit', required: false, aliases: ['secondary_unit', 'secondaryunit', 'alt_unit'] },
  { key: 'conversion_factor', label: 'Conversion Factor', required: false, aliases: ['conversion_factor', 'conversionfactor', 'factor'] },
  { key: 'warranty_months', label: 'Warranty (Months)', required: false, aliases: ['warranty_months', 'warranty', 'warranty_month'] },
];

// Robust CSV Line Splitter handling quotes and commas
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      if (inQuotes && line[i + 1] === char) {
        current += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Parse entire CSV text into array of rows
function parseCsvRows(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  return lines.map(parseCsvLine);
}

export default function InventoryCsvMappingModal({ file, isOpen, onClose, onSuccess }) {
  const [rawRows, setRawRows] = useState([]);
  const [headerRowIndex, setHeaderRowIndex] = useState(0); // 0-indexed (Row 1 = 0)
  const [columnMapping, setColumnMapping] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseError, setParseError] = useState(null);

  // Read and parse file when opened
  useEffect(() => {
    if (!file || !isOpen) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = parseCsvRows(text);
        if (rows.length < 2) {
          setParseError('The selected CSV file must have at least a header row and one data row.');
          return;
        }
        setRawRows(rows);
        setHeaderRowIndex(0);
        setParseError(null);
      } catch (err) {
        setParseError('Failed to read CSV file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }, [file, isOpen]);

  // Headers from the chosen row
  const availableHeaders = useMemo(() => {
    if (!rawRows.length || headerRowIndex >= rawRows.length) return [];
    return rawRows[headerRowIndex].map((h, idx) => ({
      index: idx,
      label: h ? String(h).trim() : `Column ${idx + 1}`
    }));
  }, [rawRows, headerRowIndex]);

  // Auto-map columns whenever availableHeaders changes
  useEffect(() => {
    if (!availableHeaders.length) return;

    const newMapping = {};
    TARGET_FIELDS.forEach((field) => {
      // Find matching header by alias
      const match = availableHeaders.find(h => {
        const normalized = h.label.toLowerCase().replace(/[\s\-_]/g, '');
        return field.aliases.some(alias => normalized === alias.replace(/[\s\-_]/g, ''));
      });
      if (match) {
        newMapping[field.key] = match.index;
      }
    });
    setColumnMapping(newMapping);
  }, [availableHeaders]);

  if (!isOpen) return null;

  const handleMappingChange = (fieldKey, columnIndex) => {
    setColumnMapping(prev => {
      const updated = { ...prev };
      if (columnIndex === '' || columnIndex === undefined || columnIndex === null) {
        delete updated[fieldKey];
      } else {
        updated[fieldKey] = Number(columnIndex);
      }
      return updated;
    });
  };

  const handleImport = async () => {
    // Validate required fields
    const missingRequired = TARGET_FIELDS.filter(f => f.required && (columnMapping[f.key] === undefined || columnMapping[f.key] === ''));
    if (missingRequired.length > 0) {
      toast.error(`Please map required field(s): ${missingRequired.map(f => f.label).join(', ')}`);
      return;
    }

    const dataRows = rawRows.slice(headerRowIndex + 1);
    if (!dataRows.length) {
      toast.error('No data rows found below the specified header row.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(10);

    try {
      // Build standard CSV
      const outputHeaders = TARGET_FIELDS.map(f => f.key);
      const csvLines = [outputHeaders.join(',')];

      dataRows.forEach(row => {
        const rowValues = outputHeaders.map(key => {
          const colIdx = columnMapping[key];
          let val = colIdx !== undefined && colIdx < row.length ? row[colIdx] : '';
          val = String(val || '').trim();
          
          // Escape quotes
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        });

        // Only include if row has at least one non-empty value
        if (rowValues.some(v => v !== '')) {
          csvLines.push(rowValues.join(','));
        }
      });

      const normalizedCsvContent = csvLines.join('\n');
      const blob = new Blob([normalizedCsvContent], { type: 'text/csv;charset=utf-8;' });
      const normalizedFile = new File([blob], file.name || 'mapped_inventory.csv', { type: 'text/csv' });

      setUploadProgress(40);

      const result = await bulkUploadProductsCsv(normalizedFile, {
        onUploadProgress: (progressEvent) => {
          const total = Number(progressEvent?.total || 0);
          if (total) {
            const percent = 40 + Math.round((progressEvent.loaded / total) * 50);
            setUploadProgress(percent);
          }
        }
      });

      setUploadProgress(100);

      if (result?.message) {
        toast.info(result.message);
      } else {
        const createdCount = Number(result?.created_count || 0);
        const updatedCount = Number(result?.updated_count || 0);
        const skippedCount = Number(result?.skipped_count || 0);
        const failedCount = Number(result?.failed_count || 0);

        const summaryParts = [];
        if (createdCount > 0) summaryParts.push(`${createdCount} created`);
        if (updatedCount > 0) summaryParts.push(`${updatedCount} updated`);
        if (skippedCount > 0) summaryParts.push(`${skippedCount} unchanged`);

        const summaryText = summaryParts.length > 0 ? summaryParts.join(', ') : 'Processed';

        if (failedCount > 0) {
          toast.warn(`Import finished (${summaryText}). Failed rows: ${failedCount}`);
        } else if (createdCount > 0 || updatedCount > 0 || skippedCount > 0) {
          toast.success(`Import complete: ${summaryText}!`);
        } else {
          toast.success('CSV upload processed successfully!');
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('CSV import error:', err);
      const resp = err?.response?.data;
      toast.error(resp?.error || resp?.message || 'Failed to process CSV import');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // 5 rows preview
  const previewRows = rawRows.slice(0, 5);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pt-16 sm:pt-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bento-card !p-0 shadow-2xl shadow-cyan-950/40 border border-white/10 animate-fade-up">
        {/* Header */}
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-white/10 bg-white/[0.04]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <TableCellsIcon className="w-6 h-6 text-cyan-400" />
              Configure CSV Import Specifications
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Select which row contains column headers, and map your CSV columns to Cenvora inventory fields.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {parseError ? (
          <div className="p-8 text-center space-y-4">
            <ExclamationTriangleIcon className="w-12 h-12 text-rose-400 mx-auto" />
            <p className="text-sm text-rose-300 font-medium">{parseError}</p>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="p-6 md:p-8 space-y-8">
            {/* Step 1: Header Row Selector & Raw Preview */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
                <div>
                  <label className="text-xs font-semibold text-white uppercase tracking-wider block">
                    1. Which row contains your column headers?
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Data rows above the header row will be excluded from the import.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={headerRowIndex}
                    onChange={(e) => setHeaderRowIndex(Number(e.target.value))}
                    className="bg-[#111] border border-cyan-500/40 text-cyan-300 font-semibold rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    {rawRows.slice(0, 10).map((_, idx) => (
                      <option key={idx} value={idx}>
                        Row {idx + 1} {idx === 0 ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40">
                <div className="px-4 py-2 bg-white/[0.02] border-b border-white/5 text-[11px] font-medium text-gray-400 flex justify-between">
                  <span>File Preview (First 5 Rows):</span>
                  <span className="text-cyan-400 font-semibold">Row {headerRowIndex + 1} selected as Headers</span>
                </div>
                <div className="overflow-x-auto max-h-48 text-xs font-mono">
                  <table className="w-full border-collapse">
                    <tbody>
                      {previewRows.map((row, rIdx) => {
                        const isHeader = rIdx === headerRowIndex;
                        return (
                          <tr 
                            key={rIdx}
                            className={`border-b border-white/5 transition-colors ${
                              isHeader ? 'bg-cyan-500/15 text-cyan-200 font-bold' : 'hover:bg-white/[0.02] text-gray-300'
                            }`}
                          >
                            <td className="p-2 px-3 text-gray-500 text-[10px] w-12 border-r border-white/5">
                              #{rIdx + 1}
                            </td>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2 px-3 whitespace-nowrap max-w-[200px] truncate border-r border-white/5">
                                {cell || <span className="text-gray-600 italic">empty</span>}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Step 2: Column Mapping Grid */}
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span>2. Map CSV Columns to Cenvora Fields</span>
                  <span className="text-xs text-gray-400 font-normal normal-case">
                    Fields marked with <span className="text-rose-400 font-bold">*</span> are required
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TARGET_FIELDS.map((field) => {
                  const mappedIndex = columnMapping[field.key];
                  const isMapped = mappedIndex !== undefined && mappedIndex !== '';

                  return (
                    <div 
                      key={field.key}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isMapped 
                          ? 'border-cyan-500/30 bg-cyan-950/10' 
                          : field.required 
                          ? 'border-rose-500/30 bg-rose-950/5' 
                          : 'border-white/10 bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-semibold text-white flex items-center gap-1">
                          {field.label}
                          {field.required && <span className="text-rose-400">*</span>}
                        </label>
                        {isMapped ? (
                          <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                            <CheckCircleIcon className="w-3.5 h-3.5" /> Mapped
                          </span>
                        ) : field.required ? (
                          <span className="text-[10px] font-medium text-rose-400">Required</span>
                        ) : (
                          <span className="text-[10px] text-gray-500">Optional</span>
                        )}
                      </div>

                      <select
                        value={mappedIndex ?? ''}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 font-medium"
                      >
                        <option value="">-- Do not import / None --</option>
                        {availableHeaders.map((header) => (
                          <option key={header.index} value={header.index}>
                            {header.label} (Col {header.index + 1})
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress indicator */}
            {isSubmitting && (
              <div className="bg-slate-950/80 p-4 rounded-xl border border-white/10 space-y-2">
                <InlineProgressBar value={uploadProgress} label="Normalizing and uploading products..." />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleImport}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <span>{isSubmitting ? 'Importing...' : 'Confirm Mapping & Import'}</span>
                {!isSubmitting && <ArrowRightIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
