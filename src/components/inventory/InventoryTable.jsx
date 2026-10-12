import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { downloadProductCsvTemplate, getProducts, bulkDeleteProducts, bulkRestoreProducts, updateProduct } from "../../api/inventory";
import Pagination from "../common/Pagination";
import { toast } from "react-toastify";
import InlineProgressBar from "../common/InlineProgressBar";
import { useLoadingPolicy } from "../../hooks/useLoadingPolicy";
import { useInventoryCsvJob } from "../../hooks/useInventoryCsvJob";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import InventoryCsvMappingModal from "./InventoryCsvMappingModal";
import InventoryCsvProgressBar from "./InventoryCsvProgressBar";
import useEscKey from "../../hooks/useEscStack";
import {
  AdjustmentsHorizontalIcon,
  AdjustmentsVerticalIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const REQUIRED_CSV_COLUMNS = ["name", "unit", "cost_price"];

const splitCsvLine = (line) => {
  return line
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((cell) => cell.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
};

const normalizeHeader = (header) =>
  String(header || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

const validateCsvBeforeUpload = async (file) => {
  const csvText = await file.text();
  const rawLines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (rawLines.length < 2) {
    return { valid: false, message: "CSV must contain a header and at least one data row." };
  }

  const headers = splitCsvLine(rawLines[0]).map(normalizeHeader);
  const missingHeaders = REQUIRED_CSV_COLUMNS.filter((key) => !headers.includes(key));
  if (missingHeaders.length > 0) {
    return {
      valid: false,
      message: `Missing required column(s): ${missingHeaders.join(", ")}`,
    };
  }

  const indexByHeader = Object.fromEntries(headers.map((h, idx) => [h, idx]));
  const invalidRows = [];

  for (let i = 1; i < rawLines.length; i += 1) {
    const values = splitCsvLine(rawLines[i]);
    const rowNumber = i + 1;

    const missingFields = REQUIRED_CSV_COLUMNS.filter((field) => {
      const value = values[indexByHeader[field]];
      return value == null || String(value).trim() === "";
    });

    if (missingFields.length > 0) {
      invalidRows.push({ rowNumber, missingFields });
    }
  }

  if (invalidRows.length > 0) {
    const preview = invalidRows
      .slice(0, 3)
      .map((row) => `Row ${row.rowNumber}: ${row.missingFields.join(", ")}`)
      .join(" | ");
    return {
      valid: false,
      message: `CSV has missing required values. ${preview}${invalidRows.length > 3 ? " ..." : ""}`,
    };
  }

  return { valid: true };
};

const DEFAULT_COLUMNS = {
  checkbox: true,
  product: true,
  quantity: true,
  unit: true,
  cost_price: true,
  sale_price: true,
  total_value: true,
  status: true,
  warranty: true,
  actions: true,
};

export default function InventoryTable({ onEdit, onView, onDelete, onStockAdjustment }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("name"); // default: alphabetical
  const [page, setPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [stockFilter, setStockFilter] = useState("all"); // all, in-stock, out-of-stock, low-stock, critical
  const [statusFilter, setStatusFilter] = useState("active"); // active, archived, all
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mappingFile, setMappingFile] = useState(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(true);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem("inventory_table_columns");
      return saved ? { ...DEFAULT_COLUMNS, ...JSON.parse(saved) } : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });

  const toggleColumn = (colKey) => {
    setVisibleColumns((prev) => {
      const updated = { ...prev, [colKey]: !prev[colKey] };
      try {
        localStorage.setItem("inventory_table_columns", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  useEscKey(() => setShowMappingModal(false), showMappingModal, 20);
  useEscKey(() => setShowColumnPicker(false), showColumnPicker, 20);

  const [advancedFilters, setAdvancedFilters] = useState({
    priceRange: { min: "", max: "" },
    stockRange: { min: "", max: "" },
    supplier: "",
    lowStock: false,
    outOfStock: false,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["products", search, ordering, page, statusFilter, selectedManufacturer],
    queryFn: () => getProducts({
      search,
      ordering,
      page,
      ...(selectedManufacturer ? { manufacturer: selectedManufacturer } : {}),
      ...(statusFilter === 'archived' ? { is_active: false } : statusFilter === 'all' ? { include_archived: true } : { is_active: true })
    }),
    staleTime: 5 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
  const loadingPolicy = useLoadingPolicy(isLoading);
  const queryClient = useQueryClient();

  const csvJob = useInventoryCsvJob({
    onComplete: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      refetch();
    },
  });

  const handleRestore = async (product) => {
    try {
      await updateProduct(product.id, { ...product, is_active: true });
      toast.success(`'${product.name}' restored to active inventory.`);
      refetch();
    } catch {
      toast.error('Failed to restore product.');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadProductCsvTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product_bulk_template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download product template.');
    }
  };

  const handleUploadCsv = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a valid CSV file.');
      event.target.value = '';
      return;
    }

    setMappingFile(file);
    setShowMappingModal(true);
    event.target.value = '';
  };

  if (error) {
    return (
      <div className="p-4 text-red-300 font-bold drop-shadow-lg">
        Error loading inventory: {error.message}
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="ml-4 px-2 py-1 bg-red-500/80 text-white rounded text-xs backdrop-filter backdrop-blur-10 border border-red-300/30 font-bold transition-colors"
        >
          Clear Auth & Re-login
        </button>
      </div>
    );
  }

  // Get the raw products array from API response
  const productsRaw = useMemo(
    () => (Array.isArray(data) ? data : data?.results || data?.data || []),
    [data]
  );
  const totalPages = data?.total_pages || 1;
  const currentPage = data?.current_page || page;

  // Extract available manufacturers from loaded products
  const availableManufacturers = useMemo(() => {
    const set = new Set();
    productsRaw.forEach((p) => {
      if (p.manufacturer && String(p.manufacturer).trim()) {
        set.add(String(p.manufacturer).trim());
      }
    });
    return Array.from(set).sort();
  }, [productsRaw]);

  // Handle clickable column header sorting
  const handleSort = (field) => {
    if (ordering === field) {
      setOrdering(`-${field}`);
    } else if (ordering === `-${field}`) {
      setOrdering(field);
    } else {
      setOrdering(field);
    }
    setPage(1);
  };

  const renderSortIndicator = (field) => {
    if (ordering === field) return <span className="ml-1 text-cyan-300 font-bold">▲</span>;
    if (ordering === `-${field}`) return <span className="ml-1 text-cyan-300 font-bold">▼</span>;
    return <span className="ml-1 text-white/30 text-xs">↕</span>;
  };

  // Backend handles search across all products; frontend applies additional filters only.
  const filteredProducts = useMemo(() => {
    const minPrice = advancedFilters.priceRange.min === "" ? null : parseFloat(advancedFilters.priceRange.min);
    const maxPrice = advancedFilters.priceRange.max === "" ? null : parseFloat(advancedFilters.priceRange.max);
    const minStockRange = advancedFilters.stockRange.min === "" ? null : parseFloat(advancedFilters.stockRange.min);
    const maxStockRange = advancedFilters.stockRange.max === "" ? null : parseFloat(advancedFilters.stockRange.max);
    const supplierQuery = String(advancedFilters.supplier || "").toLowerCase();

    return productsRaw
      .filter((product) => {
        let matchesStock = true;
        const currentStock = parseFloat(product.stock ?? product.current_stock ?? 0);
        const minStock = parseFloat(product.low_stock_alert ?? product.min_stock_level ?? 0);

        if (stockFilter === "in-stock") {
          matchesStock = currentStock > 0;
        } else if (stockFilter === "out-of-stock") {
          matchesStock = currentStock === 0;
        } else if (stockFilter === "low-stock") {
          matchesStock = currentStock > 0 && currentStock <= minStock;
        } else if (stockFilter === "critical") {
          matchesStock = currentStock < 0;
        }

        if (advancedFilters.lowStock) {
          matchesStock = matchesStock && currentStock <= minStock;
        }
        if (advancedFilters.outOfStock) {
          matchesStock = matchesStock && currentStock === 0;
        }

        let matchesPrice = true;
        if (minPrice !== null || maxPrice !== null) {
          const price = parseFloat(product.cost_price ?? product.price ?? product.purchase_price ?? product.unit_price ?? 0);
          if (minPrice !== null) {
            matchesPrice = matchesPrice && price >= minPrice;
          }
          if (maxPrice !== null) {
            matchesPrice = matchesPrice && price <= maxPrice;
          }
        }

        let matchesStockRange = true;
        if (minStockRange !== null || maxStockRange !== null) {
          if (minStockRange !== null) {
            matchesStockRange = matchesStockRange && currentStock >= minStockRange;
          }
          if (maxStockRange !== null) {
            matchesStockRange = matchesStockRange && currentStock <= maxStockRange;
          }
        }

        let matchesSupplier = true;
        if (supplierQuery) {
          matchesSupplier = String(product.supplier || "").toLowerCase().includes(supplierQuery);
        }

        let matchesManufacturer = true;
        if (selectedManufacturer) {
          matchesManufacturer = String(product.manufacturer || "").toLowerCase() === selectedManufacturer.toLowerCase();
        }

        return matchesStock && matchesPrice && matchesStockRange && matchesSupplier && matchesManufacturer;
      })
      .sort((a, b) => {
        if (ordering === "name") return (a.name || "").localeCompare(b.name || "");
        if (ordering === "-name") return (b.name || "").localeCompare(a.name || "");
        if (ordering === "current_stock") return parseFloat(a.current_stock ?? a.stock ?? 0) - parseFloat(b.current_stock ?? b.stock ?? 0);
        if (ordering === "-current_stock") return parseFloat(b.current_stock ?? b.stock ?? 0) - parseFloat(a.current_stock ?? a.stock ?? 0);
        if (ordering === "sale_price") return parseFloat(a.sale_price || 0) - parseFloat(b.sale_price || 0);
        if (ordering === "-sale_price") return parseFloat(b.sale_price || 0) - parseFloat(a.sale_price || 0);
        if (ordering === "unit_price" || ordering === "cost_price") return parseFloat(a.cost_price ?? a.price ?? a.unit_price ?? 0) - parseFloat(b.cost_price ?? b.price ?? b.unit_price ?? 0);
        if (ordering === "-unit_price" || ordering === "-cost_price") return parseFloat(b.cost_price ?? b.price ?? b.unit_price ?? 0) - parseFloat(a.cost_price ?? a.price ?? a.unit_price ?? 0);
        if (ordering === "updated_at") return new Date(a.updated_at || 0) - new Date(b.updated_at || 0);
        if (ordering === "-updated_at") return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
        if (ordering === "-created_at") return new Date(b.created_at || 0) - new Date(a.created_at || 0);

        return 0;
      });
  }, [
    advancedFilters.lowStock,
    advancedFilters.outOfStock,
    advancedFilters.priceRange.max,
    advancedFilters.priceRange.min,
    advancedFilters.stockRange.max,
    advancedFilters.stockRange.min,
    advancedFilters.supplier,
    ordering,
    productsRaw,
    selectedManufacturer,
    stockFilter,
  ]);

  // Bulk operations functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(new Set(filteredProducts.map(product => product.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId, checked) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    
    const count = selectedProducts.size;
    const confirmed = window.confirm(`Are you sure you want to delete ${count} product(s)?`);
    if (confirmed) {
      const toastId = "bulk-delete-progress";
      toast.loading(`Deleting ${count} product(s)...`, { toastId });
      try {
        const productIds = Array.from(selectedProducts);
        const result = await bulkDeleteProducts(productIds);
        
        toast.dismiss(toastId);
        setSelectedProducts(new Set());
        setShowBulkActions(false);

        const hasProtected = result.protected && result.protected.length > 0;
        if (hasProtected) {
          toast.warning(result.message || `Some products could not be deleted.`, { toastId: 'bulk-delete-result', autoClose: 4000 });
        } else {
          toast.success(result.message || `Products deleted successfully.`, { toastId: 'bulk-delete-result', autoClose: 3000 });
        }
        
        refetch();
      } catch (error) {
        toast.dismiss(toastId);
        const errMsg = error?.response?.data?.error || error?.response?.data?.detail || `Failed to delete products.`;
        toast.error(errMsg, { toastId: 'bulk-delete-result', autoClose: 4000 });
      } finally {
        toast.dismiss(toastId);
      }
    }
  };

  const handleBulkRestore = async () => {
    if (selectedProducts.size === 0) return;

    const count = selectedProducts.size;
    const confirmed = window.confirm(`Are you sure you want to restore ${count} selected product(s) to active inventory?`);
    if (!confirmed) return;

    const toastId = "bulk-restore-progress";
    toast.loading(`Restoring ${count} product(s)...`, { toastId });
    try {
      const productIds = Array.from(selectedProducts);
      const result = await bulkRestoreProducts(productIds);

      toast.dismiss(toastId);
      setSelectedProducts(new Set());
      setShowBulkActions(false);
      toast.success(result.message || `${count} product(s) restored successfully.`, { toastId: 'bulk-restore-result', autoClose: 3000 });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      refetch();
    } catch (error) {
      toast.dismiss(toastId);
      const errMsg = error?.response?.data?.error || error?.response?.data?.detail || `Failed to restore products.`;
      toast.error(errMsg, { toastId: 'bulk-restore-result', autoClose: 4000 });
    } finally {
      toast.dismiss(toastId);
    }
  };

  // Export functions
  const exportToCSV = () => {
    const selectedData = filteredProducts.filter(product => selectedProducts.has(product.id));
    const dataToExport = selectedData.length > 0 ? selectedData : filteredProducts;
    
    const csvHeaders = ['Item Code', 'Internal Reference', 'Name', 'Current Stock', 'Unit', 'Cost Price', 'Sale Price', 'Total Value'];
    const csvData = dataToExport.map(product => [
      product.item_code || '',
      product.internal_reference || '',
      product.name,
      product.stock ?? product.current_stock,
      product.unit,
      parseFloat(product.cost_price ?? product.price ?? product.purchase_price ?? product.unit_price ?? 0).toFixed(2),
      product.sale_price == null ? '' : parseFloat(product.sale_price).toFixed(2),
      (parseFloat(product.stock ?? product.current_stock ?? 0) * parseFloat(product.cost_price ?? product.price ?? product.purchase_price ?? product.unit_price ?? 0)).toFixed(2),
    ]);
    
    const csvContent = [csvHeaders, ...csvData].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toLocaleDateString('sv-SE')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get stock status styling
  const getStockStatus = (product) => {
    const currentStock = parseFloat(product.stock ?? product.current_stock ?? 0);
    const minStock = parseFloat(product.low_stock_alert ?? product.min_stock_level ?? 0);

    if (currentStock < 0) {
      return { text: "Critical", className: "bg-red-600/30 text-red-200 border border-red-500/60 backdrop-filter backdrop-blur-10 font-bold" };
    } else if (currentStock === 0) {
      return { text: "Out of Stock", className: "bg-red-500/30 text-red-200 border border-red-300/50 backdrop-filter backdrop-blur-10 font-bold" };
    } else if (minStock > 0 && currentStock > 0 && currentStock <= minStock) {
      return { text: "Low Stock", className: "bg-yellow-500/30 text-yellow-200 border border-yellow-300/50 backdrop-filter backdrop-blur-10 font-bold" };
    } else {
      return { text: "In Stock", className: "bg-green-500/30 text-green-200 border border-green-300/50 backdrop-filter backdrop-blur-10 font-bold" };
    }
  };

  return (
    <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 shadow-lg p-4 rounded">
      {/* Background CSV Import Progress Widget (Non-blocking) */}
      <InventoryCsvProgressBar
        job={csvJob}
        onDismiss={csvJob.clearJob}
        onRefreshNow={() => {
          queryClient.invalidateQueries({ queryKey: ["products"] });
          refetch();
        }}
      />

      {/* Enhanced Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <input
            className="w-full sm:w-56 border border-white/30 rounded px-3 py-1.5 text-sm bg-white/10 backdrop-filter backdrop-blur-10 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select
            value={ordering}
            onChange={(e) => {
              setOrdering(e.target.value);
              setPage(1);
            }}
            className="border border-white/30 rounded px-2.5 py-1.5 text-sm bg-white/10 backdrop-filter backdrop-blur-10 text-white focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
          >
            <option value="name">Name (A-Z)</option>
            <option value="-name">Name (Z-A)</option>
            <option value="-updated_at">Recently Modified</option>
            <option value="updated_at">Modified (Oldest)</option>
            <option value="-created_at">Recently Added</option>
            <option value="-current_stock">Stock (High to Low)</option>
            <option value="current_stock">Stock (Low to High)</option>
            <option value="-sale_price">Sale Price (High to Low)</option>
            <option value="sale_price">Sale Price (Low to High)</option>
            <option value="-unit_price">Cost Price (High to Low)</option>
            <option value="unit_price">Cost Price (Low to High)</option>
          </select>
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setPage(1);
            }}
            className="border border-white/30 rounded px-2.5 py-1.5 text-sm bg-white/10 backdrop-filter backdrop-blur-10 text-white focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
          >
            <option value="all">All Stock</option>
            <option value="in-stock">In Stock (&gt;0)</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock (0)</option>
            <option value="critical">Critical (&lt;0)</option>
          </select>
          {availableManufacturers.length > 0 && (
            <select
              value={selectedManufacturer}
              onChange={(e) => {
                setSelectedManufacturer(e.target.value);
                setPage(1);
              }}
              className="border border-white/30 rounded px-2.5 py-1.5 text-sm bg-white/10 backdrop-filter backdrop-blur-10 text-white focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 max-w-[180px] truncate"
            >
              <option value="">All Manufacturers</option>
              {availableManufacturers.map((mfg) => (
                <option key={mfg} value={mfg} className="bg-gray-800 text-white">
                  {mfg}
                </option>
              ))}
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-white/30 rounded px-2.5 py-1.5 text-sm bg-white/10 backdrop-filter backdrop-blur-10 text-white focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All Status</option>
          </select>
        </div>

        {/* View Options: Columns Picker & Details Toggle */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="px-3 py-1.5 bg-white/10 text-white/90 border border-white/20 rounded hover:bg-white/20 transition text-xs font-semibold flex items-center gap-1.5 backdrop-filter backdrop-blur-10"
              title="Show / Hide Columns"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-cyan-300" />
              <span>Columns</span>
            </button>
            {showColumnPicker && (
              <div className="absolute right-0 mt-2 w-52 bg-gray-900/95 border border-white/20 rounded-xl shadow-2xl p-3 z-50 backdrop-blur-xl space-y-2">
                <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-2">Display Columns</div>
                {[
                  { key: 'product', label: 'Product Name' },
                  { key: 'quantity', label: 'Quantity / Stock' },
                  { key: 'unit', label: 'Unit' },
                  { key: 'cost_price', label: 'Cost Price' },
                  { key: 'sale_price', label: 'Sale Price' },
                  { key: 'total_value', label: 'Total Value' },
                  { key: 'status', label: 'Stock Status' },
                  { key: 'warranty', label: 'Warranty' },
                ].map((col) => (
                  <label key={col.key} className="flex items-center gap-2 text-xs text-white/90 hover:text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.key]}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded border-white/30 text-cyan-400 focus:ring-cyan-400 bg-white/10"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowItemDetails(!showItemDetails)}
            className={`px-3 py-1.5 border rounded transition text-xs font-semibold flex items-center gap-1.5 backdrop-filter backdrop-blur-10 ${showItemDetails ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30' : 'bg-white/10 text-white/70 border-white/20'}`}
            title={showItemDetails ? "Hide Item Details" : "Show Item Details"}
          >
            {showItemDetails ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
            <span>{showItemDetails ? "Details On" : "Details Off"}</span>
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {selectedProducts.size > 0 && (
            <>
              <span className="text-sm text-cyan-300 font-bold drop-shadow-lg">
                {selectedProducts.size} selected
              </span>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-3 py-1 bg-blue-500/30 text-blue-200 border border-blue-300/50 rounded hover:bg-blue-400/40 transition text-sm backdrop-filter backdrop-blur-10 font-bold"
              >
                Bulk Actions
              </button>
            </>
          )}
          {showBulkActions && (
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-500/30 text-red-200 border border-red-300/50 rounded hover:bg-red-400/40 transition text-sm backdrop-filter backdrop-blur-10 font-bold"
              >
                Delete Selected
              </button>
              <button
                onClick={handleBulkRestore}
                className="px-3 py-1 bg-emerald-500/30 text-emerald-200 border border-emerald-300/50 rounded hover:bg-emerald-400/40 transition text-sm backdrop-filter backdrop-blur-10 font-bold"
              >
                Restore Selected
              </button>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-1 bg-cyan-500/30 text-cyan-200 border border-cyan-300/50 rounded hover:bg-cyan-400/40 transition text-sm backdrop-filter backdrop-blur-10 font-bold"
          >
            Download Template
          </button>
          <label className={`px-3 py-1 border rounded transition text-sm backdrop-filter backdrop-blur-10 font-bold cursor-pointer ${isUploadingCsv ? 'bg-gray-600/30 text-gray-300 border-gray-400/40' : 'bg-blue-500/30 text-blue-200 border-blue-300/50 hover:bg-blue-400/40'}`}>
            {isUploadingCsv ? 'Uploading...' : 'Upload CSV'}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleUploadCsv}
              disabled={isUploadingCsv}
            />
          </label>
          <button
            onClick={exportToCSV}
            className="px-3 py-1 bg-green-500/30 text-green-200 border border-green-300/50 rounded hover:bg-green-400/40 transition text-sm flex items-center gap-1 backdrop-filter backdrop-blur-10 font-bold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {isUploadingCsv && uploadProgress > 0 && (
        <div className="mb-4">
          <InlineProgressBar value={uploadProgress} label="Uploading inventory CSV" />
        </div>
      )}

      {/* Table for desktop, Cards for mobile */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-gradient-to-r from-[#7fd3f7]/10 to-[#b6e0f7]/10 backdrop-blur-10">
              {visibleColumns.checkbox && (
                <th className="w-12 text-left py-3 px-4 rounded-l-lg">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10 backdrop-filter backdrop-blur-10"
                  />
                </th>
              )}
              {visibleColumns.product && (
                <th
                  onClick={() => handleSort('name')}
                  className="w-[28%] min-w-[200px] text-left py-3 px-4 font-black text-white drop-shadow-lg cursor-pointer select-none hover:text-cyan-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Product</span>
                    {renderSortIndicator('name')}
                  </div>
                </th>
              )}
              {visibleColumns.quantity && (
                <th
                  onClick={() => handleSort('current_stock')}
                  className="w-24 text-center py-3 px-3 font-black text-white drop-shadow-lg cursor-pointer select-none hover:text-cyan-200 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Quantity</span>
                    {renderSortIndicator('current_stock')}
                  </div>
                </th>
              )}
              {visibleColumns.unit && (
                <th className="w-20 text-center py-3 px-2 font-black text-white drop-shadow-lg">
                  Unit
                </th>
              )}
              {visibleColumns.cost_price && (
                <th
                  onClick={() => handleSort('cost_price')}
                  className="w-28 text-right py-3 px-3 font-black text-white drop-shadow-lg cursor-pointer select-none hover:text-cyan-200 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Cost Price</span>
                    {renderSortIndicator('cost_price')}
                  </div>
                </th>
              )}
              {visibleColumns.sale_price && (
                <th
                  onClick={() => handleSort('sale_price')}
                  className="w-28 text-right py-3 px-3 font-black text-white drop-shadow-lg cursor-pointer select-none hover:text-cyan-200 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Sale Price</span>
                    {renderSortIndicator('sale_price')}
                  </div>
                </th>
              )}
              {visibleColumns.total_value && (
                <th className="w-28 text-right py-3 px-3 font-black text-white drop-shadow-lg">
                  Total Value
                </th>
              )}
              {visibleColumns.status && (
                <th className="w-28 text-center py-3 px-3 font-black text-white drop-shadow-lg">
                  Status
                </th>
              )}
              {visibleColumns.warranty && (
                <th className="w-24 text-center py-3 px-2 font-black text-white drop-shadow-lg">
                  Warranty
                </th>
              )}
              {visibleColumns.actions && (
                <th className="w-36 text-center py-3 px-3 rounded-r-lg font-black text-white drop-shadow-lg">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loadingPolicy.visible
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      <td
                        colSpan={10}
                        className="py-6 animate-pulse bg-white/10 backdrop-filter backdrop-blur-10 rounded"
                      />
                    </tr>
                  ))
              : filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const costPrice = parseFloat(product.cost_price ?? product.price ?? product.purchase_price ?? product.unit_price ?? 0);
                  const salePrice = product.sale_price == null ? null : parseFloat(product.sale_price);
                  const totalValue = parseFloat(product.stock ?? product.current_stock ?? 0) * costPrice;
                  
                  return (
                    <tr
                      key={product.id}
                      className="bg-white/5 backdrop-filter backdrop-blur-10 shadow rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300"
                    >
                      {visibleColumns.checkbox && (
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                            className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10 backdrop-filter backdrop-blur-10"
                          />
                        </td>
                      )}
                      {visibleColumns.product && (
                        <td className="py-3 px-4 break-words min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white drop-shadow-lg break-words">
                              {product.name}
                            </span>
                            {product.item_code && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-500/20" title={`Item Code: ${product.item_code}`}>
                                {product.item_code}
                              </span>
                            )}
                            {showItemDetails && product.internal_reference && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-teal-300 bg-teal-500/10 border border-teal-500/20" title={`Internal Ref: ${product.internal_reference}`}>
                                Ref: {product.internal_reference}
                              </span>
                            )}
                            {showItemDetails && product.manufacturer && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20" title={`Manufacturer: ${product.manufacturer}`}>
                                {product.manufacturer}
                              </span>
                            )}
                            {product.is_active === false && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40">
                                Archived
                              </span>
                            )}
                          </div>
                          {showItemDetails && product.description && (
                            <div className="text-xs text-white/70 drop-shadow-md mt-1 break-words line-clamp-2">
                              {product.description}
                            </div>
                          )}
                        </td>
                      )}
                      {visibleColumns.quantity && (
                        <td className="py-3 px-3 text-center">
                          <div className={`font-semibold drop-shadow-lg ${parseFloat(product.stock ?? product.current_stock ?? 0) < 0 ? 'text-red-400 font-bold' : 'text-white'}`}>
                            {parseFloat(product.stock ?? product.current_stock ?? 0).toLocaleString()}
                          </div>
                          {parseFloat(product.low_stock_alert ?? product.min_stock_level ?? 0) > 0 && (
                            <div className="text-[11px] text-amber-300/80 drop-shadow-md mt-0.5">
                              Min: {parseFloat(product.low_stock_alert ?? product.min_stock_level).toLocaleString()}
                            </div>
                          )}
                        </td>
                      )}
                      {visibleColumns.unit && (
                        <td className="py-3 px-2 text-center">
                          <span 
                            className="inline-block px-2 py-0.5 rounded-md text-xs font-medium text-cyan-200 bg-cyan-500/10 border border-cyan-500/20 font-mono truncate max-w-full"
                            title={product.unit || 'pcs'}
                          >
                            {product.unit || 'pcs'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.cost_price && (
                        <td className="py-3 px-3 text-right font-medium text-white drop-shadow-lg">
                          {getCurrencySymbol()}{costPrice.toFixed(2)}
                        </td>
                      )}
                      {visibleColumns.sale_price && (
                        <td className="py-3 px-3 text-right font-medium text-white drop-shadow-lg">
                          {salePrice === null ? '-' : `${getCurrencySymbol()}${salePrice.toFixed(2)}`}
                        </td>
                      )}
                      {visibleColumns.total_value && (
                        <td className="py-3 px-3 text-right font-bold text-white drop-shadow-lg">
                          {getCurrencySymbol()}{totalValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.className}`}>
                            {stockStatus.text}
                          </span>
                        </td>
                      )}
                      {visibleColumns.warranty && (
                        <td className="py-3 px-2 text-center">
                          {(product.warranty_months && product.warranty_months > 0) ? (
                            <span className="px-2 py-0.5 rounded text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                              {product.warranty_months} mo
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">—</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.actions && (
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onView(product)}
                              title="View Product Details"
                              aria-label="View Product Details"
                              className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/40 transition-all drop-shadow"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {product.is_active === false ? (
                              <button
                                type="button"
                                onClick={() => handleRestore(product)}
                                title="Restore Product to Active Inventory"
                                aria-label="Restore Product"
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-200 hover:border-emerald-500/40 transition-all drop-shadow"
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                            ) : (
                              <>
                                {onStockAdjustment && (
                                  <button
                                    type="button"
                                    onClick={() => onStockAdjustment(product)}
                                    title="Adjust Stock"
                                    aria-label="Adjust Stock"
                                    className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40 transition-all drop-shadow"
                                  >
                                    <AdjustmentsVerticalIcon className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onEdit(product)}
                                  title="Edit Product"
                                  aria-label="Edit Product"
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 transition-all drop-shadow"
                                >
                                  <PencilSquareIcon className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDelete(product)}
                                  title="Delete Product"
                                  aria-label="Delete Product"
                                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 transition-all drop-shadow"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
          </tbody>
        </table>
        </div>

        {/* No data message */}
        {!isLoading &&
          (!data ||
            (Array.isArray(data)
              ? data.length === 0
              : ((!data.data || data.data.length === 0) &&
                  (!data.results || data.results.length === 0)))) && (
          <div className="p-8 text-center text-white/80 drop-shadow-lg">
            <p>No products found.</p>
            <p className="text-sm mt-2">
              Click "Add Product" to create your first inventory item.
            </p>
          </div>
        )}
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4">
        {loadingPolicy.visible ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10 p-4 animate-pulse">
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-3/4"></div>
            </div>
          ))
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-300">
              {(() => {
                const currentStock = parseFloat(product.stock ?? product.current_stock ?? 0);
                const lowStockLevel = parseFloat(product.low_stock_alert ?? product.min_stock_level ?? 0);
                const costPrice = parseFloat(product.cost_price ?? product.price ?? product.purchase_price ?? product.unit_price ?? 0);
                const isLowStock = lowStockLevel > 0 && currentStock <= lowStockLevel;
                return (
                  <>
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 w-full">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                    className="flex-shrink-0 mt-1.5 rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-semibold text-white break-words flex items-center gap-2 flex-wrap">
                      <span>{product.name}</span>
                      {product.item_code && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-500/20">
                          {product.item_code}
                        </span>
                      )}
                    </div>
                    {product.manufacturer && (
                      <div className="text-xs text-white/60">Mfg: {product.manufacturer}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Category / HSN:</span>
                  <span className="text-sm font-medium text-white">{product.hsn_sac_code || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Quantity:</span>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${
                      currentStock < 0
                        ? 'text-red-400 font-bold'
                        : isLowStock
                          ? 'text-red-400' 
                          : currentStock <= lowStockLevel * 2 && lowStockLevel > 0
                            ? 'text-yellow-400' 
                            : 'text-green-400'
                    }`}>
                      {currentStock.toLocaleString()}
                    </span>
                    {lowStockLevel > 0 && (
                      <div className="text-[11px] text-amber-300/80">
                        Min: {lowStockLevel.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Unit:</span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium text-cyan-200 bg-cyan-500/10 border border-cyan-500/20 font-mono">
                    {product.unit || 'pcs'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Cost Price:</span>
                  <span className="text-lg font-semibold text-[#7fd3f7]">
                    {getCurrencySymbol()}{Number(costPrice || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Sale Price:</span>
                  <span className="text-sm font-medium text-white">
                    {product.sale_price == null ? '-' : `${getCurrencySymbol()}${Number(product.sale_price).toLocaleString()}`}
                  </span>
                </div>

                {currentStock < 0 ? (
                  <div className="text-xs text-red-300 bg-red-600/30 border border-red-500/50 px-2 py-1 rounded font-bold">
                    Critical (Negative Stock)
                  </div>
                ) : isLowStock ? (
                  <div className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded">
                    Low Stock Alert
                  </div>
                ) : null}
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => onView(product)}
                  title="View Product Details"
                  aria-label="View Product Details"
                  className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                {product.is_active === false ? (
                  <button
                    type="button"
                    onClick={() => handleRestore(product)}
                    title="Restore Product to Active Inventory"
                    aria-label="Restore Product"
                    className="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    <span>Restore</span>
                  </button>
                ) : (
                  <>
                    {onStockAdjustment && (
                      <button
                        type="button"
                        onClick={() => onStockAdjustment(product)}
                        title="Adjust Stock"
                        aria-label="Adjust Stock"
                        className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-300 transition-all"
                      >
                        <AdjustmentsVerticalIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      title="Edit Product"
                      aria-label="Edit Product"
                      className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(product)}
                      title="Delete Product"
                      aria-label="Delete Product"
                      className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300 transition-all"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
                  </>
                );
              })()}
            </div>
          ))
        )}

        {/* No data message for mobile */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="p-8 text-center text-white/80">
            <p>No products found.</p>
            <p className="text-sm mt-2">
              Click "Add Product" to create your first inventory item.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />

      {/* CSV Mapping Modal */}
      {showMappingModal && mappingFile && (
        <InventoryCsvMappingModal
          file={mappingFile}
          isOpen={showMappingModal}
          onClose={() => {
            setShowMappingModal(false);
            setMappingFile(null);
          }}
          onSuccess={(result) => {
            if (result?.taskId) {
              csvJob.startJob(result.taskId);
            } else {
              queryClient.invalidateQueries({ queryKey: ["products"] });
              refetch();
            }
          }}
          onJobStarted={(taskId) => {
            csvJob.startJob(taskId);
          }}
        />
      )}
    </div>
  );
}
