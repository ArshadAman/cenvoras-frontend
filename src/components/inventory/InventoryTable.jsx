import React, { useEffect, useMemo, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { downloadProductCsvTemplate, getProducts, bulkDeleteProducts, bulkRestoreProducts, updateProduct, restoreProduct, getManufacturers } from "../../api/inventory";
import Pagination from "../common/Pagination";
import { toast } from "react-toastify";
import InlineProgressBar from "../common/InlineProgressBar";
import { useLoadingPolicy } from "../../hooks/useLoadingPolicy";
import { useInventoryCsvJob } from "../../hooks/useInventoryCsvJob";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import InventoryCsvMappingModal from "./InventoryCsvMappingModal";
import InventoryCsvProgressBar from "./InventoryCsvProgressBar";
import useEscKey from "../../hooks/useEscStack";
import useResizableColumns from "../../hooks/useResizableColumns";
import { LIST_THEAD, LIST_TH, LIST_TH_SORTABLE, LIST_TH_LABEL } from "../common/tableHeaderClasses";
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

const DEFAULT_COLUMN_WIDTHS = {
  checkbox: 44,
  product: 220,
  quantity: 100,
  unit: 80,
  cost_price: 120,
  sale_price: 120,
  total_value: 130,
  status: 110,
  warranty: 100,
  actions: 145,
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
  const { colWidths, renderResizeHandle } = useResizableColumns(
    "cenvoras_inventory_table_col_widths",
    DEFAULT_COLUMN_WIDTHS
  );

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

  const columnPickerRef = useRef(null);

  useEscKey(() => setShowMappingModal(false), showMappingModal, 20);
  useEscKey(() => setShowColumnPicker(false), showColumnPicker, 20);

  // Close column picker on outside click
  useEffect(() => {
    if (!showColumnPicker) return;
    const handleClickOutside = (e) => {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target)) {
        setShowColumnPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColumnPicker]);

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

  // Query all available manufacturers across tenant's catalog
  const { data: allManufacturers = [] } = useQuery({
    queryKey: ["inventory-manufacturers"],
    queryFn: getManufacturers,
    staleTime: 60 * 1000,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["products", search, ordering, page, statusFilter, selectedManufacturer],
    queryFn: () => getProducts({
      search,
      ordering,
      page,
      ...(selectedManufacturer ? { manufacturer: selectedManufacturer } : {}),
      ...(statusFilter === 'archived' ? { is_active: false } : statusFilter === 'all' ? { include_archived: true } : { is_active: true })
    }),
    staleTime: 2 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
  });
  const loadingPolicy = useLoadingPolicy(isLoading);
  const queryClient = useQueryClient();

  const csvJob = useInventoryCsvJob({
    onComplete: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-manufacturers"] });
      refetch();
    },
  });

  const handleRestore = async (product) => {
    try {
      await restoreProduct(product.id);
      toast.success(`'${product.name}' restored to active inventory.`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-manufacturers"] });
      refetch();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Failed to restore product.';
      toast.error(msg);
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

  // Get the raw products array from API response
  const productsRaw = useMemo(
    () => (Array.isArray(data) ? data : data?.results || data?.data || []),
    [data]
  );
  const totalPages = data?.total_pages || 1;
  const currentPage = data?.current_page || page;

  // Extract available manufacturers across tenant catalog
  const availableManufacturers = useMemo(() => {
    const set = new Set(allManufacturers || []);
    productsRaw.forEach((p) => {
      if (p.manufacturer && String(p.manufacturer).trim()) {
        set.add(String(p.manufacturer).trim());
      }
    });
    return Array.from(set).sort();
  }, [allManufacturers, productsRaw]);

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
    if (ordering === field) return <span className="text-[var(--accent-primary)] font-bold">↑</span>;
    if (ordering === `-${field}`) return <span className="text-[var(--accent-primary)] font-bold">↓</span>;
    return null;
  };

  // Backend handles search across all products; frontend applies additional filters only.
  const filteredProducts = useMemo(() => {
    const minPrice = advancedFilters.priceRange.min === "" ? null : parseFloat(advancedFilters.priceRange.min);
    const maxPrice = advancedFilters.priceRange.max === "" ? null : parseFloat(advancedFilters.priceRange.max);
    const minStockRange = advancedFilters.stockRange.min === "" ? null : parseFloat(advancedFilters.stockRange.min);
    const maxStockRange = advancedFilters.stockRange.max === "" ? null : parseFloat(advancedFilters.stockRange.max);
    const supplierQuery = String(advancedFilters.supplier || "").toLowerCase();

    const searchQ = String(search || "").trim().toLowerCase();

    return productsRaw
      .filter((product) => {
        // Client-side search belt-and-suspenders (also sent to API as `search`)
        if (searchQ) {
          const hay = [
            product.name,
            product.item_code,
            product.internal_reference,
            product.manufacturer,
            product.hsn_sac_code,
            product.description,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!hay.includes(searchQ)) return false;
        }

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
    search,
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
      return { text: "Critical", className: "bg-[var(--bg-primary)] text-[var(--text-primary)] border-2 border-[var(--text-primary)] font-bold uppercase" };
    } else if (currentStock === 0) {
      return { text: "Out of Stock", className: "bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-default)] font-bold" };
    } else if (minStock > 0 && currentStock > 0 && currentStock <= minStock) {
      return { text: "Low Stock", className: "bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-subtle)] font-medium" };
    } else {
      return { text: "In Stock", className: "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-bold" };
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-[var(--bg-surface)] border-2 border-[var(--text-primary)] rounded-xl text-[var(--text-primary)] font-bold">
        Error loading inventory: {error.message}
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="btn-destructive ml-4 !text-xs !py-1 !px-3 !normal-case !tracking-normal !font-semibold"
        >
          Clear Auth & Re-login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-lg p-4 rounded-xl text-[var(--text-primary)]">
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
            className="w-full sm:w-56 border border-[var(--border-default)] rounded-lg px-3 py-1.5 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--border-focus)] transition-all outline-none"
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
            className="border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--border-focus)] transition-all outline-none"
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
            className="border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--border-focus)] transition-all outline-none"
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
              className="border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--border-focus)] transition-all outline-none max-w-[180px] truncate"
            >
              <option value="">All Manufacturers</option>
              {availableManufacturers.map((mfg) => (
                <option key={mfg} value={mfg}>
                  {mfg}
                </option>
              ))}
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setSelectedProducts(new Set());
              setShowBulkActions(false);
              setPage(1);
            }}
            className="border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--border-focus)] transition-all outline-none"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All Status</option>
          </select>
        </div>

        {/* View Options: Columns Picker & Details Toggle */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <div className="relative" ref={columnPickerRef}>
            <button
              type="button"
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="px-3 py-1.5 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg hover:border-[var(--accent-primary)] transition text-xs font-semibold flex items-center gap-1.5"
              title="Show / Hide Columns"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Columns</span>
            </button>
            {showColumnPicker && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-52 bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-xl shadow-2xl p-3 z-50 backdrop-blur-xl space-y-2"
              >
                <div className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider mb-2">Display Columns</div>
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
                  <label key={col.key} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.key]}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded border-[var(--border-default)] accent-[var(--accent-primary)]"
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
            className={`px-3 py-1.5 border rounded-lg transition text-xs font-semibold flex items-center gap-1.5 ${showItemDetails ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-transparent font-bold' : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-default)]'}`}
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
              <span className="text-sm text-[var(--accent-primary)] font-bold">
                {selectedProducts.size} selected
              </span>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Bulk Actions
              </button>
              {statusFilter === "archived" && (
                <button
                  onClick={handleBulkRestore}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  Restore Selected ({selectedProducts.size})
                </button>
              )}
            </>
          )}
          {showBulkActions && (
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="btn-destructive !text-xs !py-1 !px-3 !normal-case !tracking-normal !font-semibold"
              >
                Delete Selected
              </button>
              <button
                onClick={handleBulkRestore}
                className="btn-primary text-xs py-1 px-3"
              >
                Restore Selected
              </button>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={handleDownloadTemplate}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Download Template
          </button>
          <label className={`btn-secondary text-xs py-1.5 px-3 cursor-pointer ${isUploadingCsv ? 'opacity-50 pointer-events-none' : ''}`}>
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
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
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
          <table className="w-full table-fixed text-sm divide-y divide-[var(--border-subtle)]">
          <colgroup>
            {visibleColumns.checkbox && <col style={{ width: `${colWidths.checkbox}px` }} />}
            {visibleColumns.product && <col style={{ width: `${colWidths.product}px` }} />}
            {visibleColumns.quantity && <col style={{ width: `${colWidths.quantity}px` }} />}
            {visibleColumns.unit && <col style={{ width: `${colWidths.unit}px` }} />}
            {visibleColumns.cost_price && <col style={{ width: `${colWidths.cost_price}px` }} />}
            {visibleColumns.sale_price && <col style={{ width: `${colWidths.sale_price}px` }} />}
            {visibleColumns.total_value && <col style={{ width: `${colWidths.total_value}px` }} />}
            {visibleColumns.status && <col style={{ width: `${colWidths.status}px` }} />}
            {visibleColumns.warranty && <col style={{ width: `${colWidths.warranty}px` }} />}
            {visibleColumns.actions && <col style={{ width: `${colWidths.actions}px` }} />}
          </colgroup>
          <thead className={LIST_THEAD}>
            <tr className="border-b border-[var(--border-subtle)]">
              {visibleColumns.checkbox && (
                <th className={`${LIST_TH} rounded-l-lg`}>
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-[var(--border-default)] accent-[var(--accent-primary)]"
                  />
                  {renderResizeHandle("checkbox")}
                </th>
              )}
              {visibleColumns.product && (
                <th
                  onClick={() => handleSort('name')}
                  className={LIST_TH_SORTABLE}
                >
                  <div className={LIST_TH_LABEL}>
                    <span>Product</span>
                    {renderSortIndicator('name')}
                  </div>
                  {renderResizeHandle("product")}
                </th>
              )}
              {visibleColumns.quantity && (
                <th
                  onClick={() => handleSort('current_stock')}
                  className={LIST_TH_SORTABLE}
                >
                  <div className={LIST_TH_LABEL}>
                    <span>Quantity</span>
                    {renderSortIndicator('current_stock')}
                  </div>
                  {renderResizeHandle("quantity")}
                </th>
              )}
              {visibleColumns.unit && (
                <th className={LIST_TH}>
                  Unit
                  {renderResizeHandle("unit")}
                </th>
              )}
              {visibleColumns.cost_price && (
                <th
                  onClick={() => handleSort('cost_price')}
                  className={LIST_TH_SORTABLE}
                >
                  <div className={LIST_TH_LABEL}>
                    <span>Cost Price</span>
                    {renderSortIndicator('cost_price')}
                  </div>
                  {renderResizeHandle("cost_price")}
                </th>
              )}
              {visibleColumns.sale_price && (
                <th
                  onClick={() => handleSort('sale_price')}
                  className={LIST_TH_SORTABLE}
                >
                  <div className={LIST_TH_LABEL}>
                    <span>Sale Price</span>
                    {renderSortIndicator('sale_price')}
                  </div>
                  {renderResizeHandle("sale_price")}
                </th>
              )}
              {visibleColumns.total_value && (
                <th className={LIST_TH}>
                  Total Value
                  {renderResizeHandle("total_value")}
                </th>
              )}
              {visibleColumns.status && (
                <th className={LIST_TH}>
                  Status
                  {renderResizeHandle("status")}
                </th>
              )}
              {visibleColumns.warranty && (
                <th className={LIST_TH}>
                  Warranty
                  {renderResizeHandle("warranty")}
                </th>
              )}
              {visibleColumns.actions && (
                <th className={`${LIST_TH} rounded-r-lg`}>
                  Actions
                  {renderResizeHandle("actions")}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {loadingPolicy.visible
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="no-hover">
                      <td
                        colSpan={10}
                        className="py-6 animate-pulse bg-[var(--bg-surface)] rounded-lg"
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
                      className="hover:bg-[var(--bg-primary)] transition-colors"
                    >
                      {visibleColumns.checkbox && (
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                            className="rounded border-[var(--border-default)] accent-[var(--accent-primary)]"
                          />
                        </td>
                      )}
                      {visibleColumns.product && (
                        <td className="py-3 px-4 break-words min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[var(--text-primary)] break-words">
                              {product.name}
                            </span>
                            {product.item_code && (
                              <span className="px-1.5 py-0.5 rounded text-xs font-mono font-medium text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-default)]" title={`Item Code: ${product.item_code}`}>
                                {product.item_code}
                              </span>
                            )}
                            {showItemDetails && product.internal_reference && (
                              <span className="px-1.5 py-0.5 rounded text-xs font-mono font-medium text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border-default)]" title={`Internal Ref: ${product.internal_reference}`}>
                                Ref: {product.internal_reference}
                              </span>
                            )}
                            {showItemDetails && product.manufacturer && (
                              <span className="px-1.5 py-0.5 rounded text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border-default)]" title={`Manufacturer: ${product.manufacturer}`}>
                                {product.manufacturer}
                              </span>
                            )}
                            {product.is_active === false && (
                              <span className="px-2 py-0.5 rounded text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-primary)] border-2 border-[var(--border-default)]">
                                Archived
                              </span>
                            )}
                          </div>
                          {showItemDetails && product.description && (
                            <div className="text-xs text-[var(--text-muted)] mt-1 break-words line-clamp-2">
                              {product.description}
                            </div>
                          )}
                        </td>
                      )}
                      {visibleColumns.quantity && (
                        <td className="py-3 px-3 text-center">
                          <div className={`font-semibold ${parseFloat(product.stock ?? product.current_stock ?? 0) < 0 ? 'text-[var(--text-primary)] font-bold underline' : 'text-[var(--text-primary)]'}`}>
                            {parseFloat(product.stock ?? product.current_stock ?? 0).toLocaleString()}
                          </div>
                          {parseFloat(product.low_stock_alert ?? product.min_stock_level ?? 0) > 0 && (
                            <div className="text-xs text-[var(--text-muted)] mt-0.5">
                              Min: {parseFloat(product.low_stock_alert ?? product.min_stock_level).toLocaleString()}
                            </div>
                          )}
                        </td>
                      )}
                      {visibleColumns.unit && (
                        <td className="py-3 px-2 text-center">
                          <span 
                            className="inline-block px-2 py-0.5 rounded-md text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-default)] font-mono truncate max-w-full"
                            title={product.unit || 'pcs'}
                          >
                            {product.unit || 'pcs'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.cost_price && (
                        <td className="py-3 px-3 text-right font-medium text-[var(--text-primary)]">
                          {getCurrencySymbol()}{costPrice.toFixed(2)}
                        </td>
                      )}
                      {visibleColumns.sale_price && (
                        <td className="py-3 px-3 text-right font-medium text-[var(--text-primary)]">
                          {salePrice === null ? '-' : `${getCurrencySymbol()}${salePrice.toFixed(2)}`}
                        </td>
                      )}
                      {visibleColumns.total_value && (
                        <td className="py-3 px-3 text-right font-bold text-[var(--text-primary)]">
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
                            <span className="px-2 py-0.5 rounded text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-default)]">
                              {product.warranty_months} mo
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)] text-xs">—</span>
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
                              className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-surface)] transition-all"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {product.is_active === false ? (
                              <button
                                type="button"
                                onClick={() => handleRestore(product)}
                                title="Restore Product to Active Inventory"
                                aria-label="Restore Product"
                                className="p-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--text-on-accent)] border border-transparent hover:brightness-110 transition-all"
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
                                    className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-all"
                                  >
                                    <AdjustmentsVerticalIcon className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onEdit(product)}
                                  title="Edit Product"
                                  aria-label="Edit Product"
                                  className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-all"
                                >
                                  <PencilSquareIcon className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDelete(product)}
                                  title="Delete Product"
                                  aria-label="Delete Product"
                                  className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] border-2 border-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-all"
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
          <div className="p-8 text-center text-[var(--text-muted)]">
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
            <div key={i} className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-4 animate-pulse">
              <div className="h-4 bg-[var(--bg-primary)] rounded mb-2"></div>
              <div className="h-3 bg-[var(--bg-primary)] rounded mb-2"></div>
              <div className="h-3 bg-[var(--bg-primary)] rounded w-3/4"></div>
            </div>
          ))
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-4 transition-all duration-150">
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
                    className="flex-shrink-0 mt-1.5 rounded border-[var(--border-default)] accent-[var(--accent-primary)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-semibold text-[var(--text-primary)] break-words flex items-center gap-2 flex-wrap">
                      <span>{product.name}</span>
                      {product.item_code && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-mono font-medium text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-default)]">
                          {product.item_code}
                        </span>
                      )}
                    </div>
                    {product.manufacturer && (
                      <div className="text-xs text-[var(--text-muted)]">Mfg: {product.manufacturer}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">Category / HSN:</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{product.hsn_sac_code || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">Quantity:</span>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${
                      currentStock < 0
                        ? 'text-[var(--text-primary)] underline font-bold'
                        : 'text-[var(--text-primary)]'
                    }`}>
                      {currentStock.toLocaleString()}
                    </span>
                    {lowStockLevel > 0 && (
                      <div className="text-xs text-[var(--text-muted)]">
                        Min: {lowStockLevel.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">Unit:</span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-default)] font-mono">
                    {product.unit || 'pcs'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">Cost Price:</span>
                  <span className="text-lg font-semibold text-[var(--text-primary)]">
                    {getCurrencySymbol()}{Number(costPrice || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">Sale Price:</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {product.sale_price == null ? '-' : `${getCurrencySymbol()}${Number(product.sale_price).toLocaleString()}`}
                  </span>
                </div>

                {currentStock < 0 ? (
                  <div className="text-xs text-[var(--text-primary)] bg-[var(--bg-primary)] border-2 border-[var(--text-primary)] px-2 py-1 rounded font-bold uppercase">
                    Critical (Negative Stock)
                  </div>
                ) : isLowStock ? (
                  <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] px-2 py-1 rounded font-medium">
                    Low Stock Alert
                  </div>
                ) : null}
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => onView(product)}
                  title="View Product Details"
                  aria-label="View Product Details"
                  className="p-2 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-all"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                {product.is_active === false ? (
                  <button
                    type="button"
                    onClick={() => handleRestore(product)}
                    title="Restore Product to Active Inventory"
                    aria-label="Restore Product"
                    className="px-3 py-2 rounded-lg bg-[var(--accent-primary)] text-[var(--text-on-accent)] border border-transparent hover:brightness-110 transition-all flex items-center gap-1.5 text-xs font-semibold"
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
                        className="p-2 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-all"
                      >
                        <AdjustmentsVerticalIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      title="Edit Product"
                      aria-label="Edit Product"
                      className="p-2 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-all"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(product)}
                      title="Delete Product"
                      aria-label="Delete Product"
                      className="p-2 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] border-2 border-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-all"
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
          <div className="p-8 text-center text-[var(--text-muted)]">
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
