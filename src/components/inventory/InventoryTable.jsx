import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../../api/inventory";
import AdvancedInventoryFilters from "./AdvancedInventoryFilters";

export default function InventoryTable({ onEdit, onView, onDelete, onStockAdjustment }) {
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("name"); // default: alphabetical
  const [page, setPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [stockFilter, setStockFilter] = useState("all"); // all, in-stock, out-of-stock, low-stock
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    priceRange: { min: "", max: "" },
    stockRange: { min: "", max: "" },
    supplier: "",
    lowStock: false,
    outOfStock: false,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["products", search, ordering, page],
    queryFn: () => getProducts({ search, ordering, page }),
  });

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading inventory: {error.message}
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="ml-4 px-2 py-1 bg-red-500 text-white rounded text-xs"
        >
          Clear Auth & Re-login
        </button>
      </div>
    );
  }

  // Get the raw products array from API response
  const productsRaw = Array.isArray(data)
    ? data
    : data?.data || data?.results || [];

  // Frontend search and filter
  const filteredProducts = productsRaw
    .filter(product => {
      // Search by product name or description
      const searchLower = search.toLowerCase();
      const matchesSearch = product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower);
      

      
      // Stock filter
      let matchesStock = true;
  const currentStock = parseFloat(product.stock ?? product.current_stock ?? 0);
  const minStock = parseFloat(product.low_stock_alert ?? product.min_stock_level ?? 0);
      
      if (stockFilter === "in-stock") {
        matchesStock = currentStock > 0;
      } else if (stockFilter === "out-of-stock") {
        matchesStock = currentStock === 0;
      } else if (stockFilter === "low-stock") {
        matchesStock = currentStock > 0 && currentStock <= minStock;
      }
      
      // Advanced filters
      if (advancedFilters.lowStock) {
        matchesStock = matchesStock && currentStock <= minStock;
      }
      if (advancedFilters.outOfStock) {
        matchesStock = matchesStock && currentStock === 0;
      }
      
      // Price range filter
      let matchesPrice = true;
      if (advancedFilters.priceRange.min || advancedFilters.priceRange.max) {
        const price = parseFloat(product.price ?? product.purchase_price ?? product.unit_price ?? 0);
        if (advancedFilters.priceRange.min) {
          matchesPrice = matchesPrice && price >= parseFloat(advancedFilters.priceRange.min);
        }
        if (advancedFilters.priceRange.max) {
          matchesPrice = matchesPrice && price <= parseFloat(advancedFilters.priceRange.max);
        }
      }
      
      // Stock range filter
      let matchesStockRange = true;
      if (advancedFilters.stockRange.min || advancedFilters.stockRange.max) {
        if (advancedFilters.stockRange.min) {
          matchesStockRange = matchesStockRange && currentStock >= parseFloat(advancedFilters.stockRange.min);
        }
        if (advancedFilters.stockRange.max) {
          matchesStockRange = matchesStockRange && currentStock <= parseFloat(advancedFilters.stockRange.max);
        }
      }
      
      // Supplier filter
      let matchesSupplier = true;
      if (advancedFilters.supplier) {
        matchesSupplier = product.supplier?.toLowerCase().includes(advancedFilters.supplier.toLowerCase());
      }
      
      return matchesSearch && matchesStock && matchesPrice && matchesStockRange && matchesSupplier;
    })
    .sort((a, b) => {
      // Frontend ordering
      if (ordering === "name") return (a.name || "").localeCompare(b.name || "");
      if (ordering === "-name") return (b.name || "").localeCompare(a.name || "");
      if (ordering === "current_stock") return parseFloat(a.current_stock || 0) - parseFloat(b.current_stock || 0);
      if (ordering === "-current_stock") return parseFloat(b.current_stock || 0) - parseFloat(a.current_stock || 0);
      if (ordering === "unit_price") return parseFloat(a.unit_price || 0) - parseFloat(b.unit_price || 0);
      if (ordering === "-unit_price") return parseFloat(b.unit_price || 0) - parseFloat(a.unit_price || 0);

      return 0;
    });

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
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedProducts.size} products?`);
    if (confirmed) {
      try {
        for (const productId of selectedProducts) {
          await onDelete(productId);
        }
        setSelectedProducts(new Set());
        setShowBulkActions(false);
      } catch (error) {
        alert('Error deleting some products. Please try again.');
      }
    }
  };

  // Export functions
  const exportToCSV = () => {
    const selectedData = filteredProducts.filter(product => selectedProducts.has(product.id));
    const dataToExport = selectedData.length > 0 ? selectedData : filteredProducts;
    
    const csvHeaders = ['Name', 'SKU', 'Category', 'Current Stock', 'Unit', 'Unit Price', 'Total Value', 'Supplier'];
    const csvData = dataToExport.map(product => [
      product.name,
      product.sku,
      product.category,
      product.current_stock,
      product.unit,
      product.unit_price,
      (parseFloat(product.current_stock || 0) * parseFloat(product.unit_price || 0)).toFixed(2),
      product.supplier || ''
    ]);
    
    const csvContent = [csvHeaders, ...csvData].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get stock status styling
  const getStockStatus = (product) => {
    const currentStock = parseFloat(product.stock ?? product.current_stock ?? 0);
    const minStock = parseFloat(product.low_stock_alert ?? product.min_stock_level ?? 0);

    if (currentStock === 0) {
      return { text: "Out of Stock", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
    } else if (minStock > 0 && currentStock > 0 && currentStock <= minStock) {
      return { text: "Low Stock", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" };
    } else {
      return { text: "In Stock", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      {/* Enhanced Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Search by name or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="name">Name (A-Z)</option>
          <option value="-name">Name (Z-A)</option>
          <option value="-current_stock">Stock (High to Low)</option>
          <option value="current_stock">Stock (Low to High)</option>
          <option value="-unit_price">Price (High to Low)</option>
          <option value="unit_price">Price (Low to High)</option>
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">All Stock</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
        <button
          onClick={() => setShowAdvancedFilters(true)}
          className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition text-sm"
        >
          Advanced Filters
        </button>
      </div>

      {/* Bulk Actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          {selectedProducts.size > 0 && (
            <>
              <span className="text-sm text-gray-600">
                {selectedProducts.size} selected
              </span>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm"
              >
                Bulk Actions
              </button>
            </>
          )}
          {showBulkActions && (
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="text-left py-3 px-4 rounded-l-lg">
                <input
                  type="checkbox"
                  checked={filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded"
                />
              </th>
              <th className="text-left py-3 px-4">Product</th>
              <th className="text-center py-3 px-4">Stock</th>
              <th className="text-right py-3 px-4">Unit Price</th>
              <th className="text-right py-3 px-4">Total Value</th>
              <th className="text-center py-3 px-4">Status</th>
              <th className="text-center py-3 px-4 rounded-r-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      <td
                        colSpan={7}
                        className="py-6 animate-pulse bg-gray-100 dark:bg-gray-700 rounded"
                      />
                    </tr>
                  ))
              : filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
              const totalValue = parseFloat(product.stock ?? product.current_stock ?? 0) * parseFloat(product.price ?? product.purchase_price ?? product.unit_price ?? 0);
                  
                  return (
                    <tr
                      key={product.id}
                      className="bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-blue-700 dark:text-blue-200">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {product.description.substring(0, 50)}...
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-medium">
                            {parseFloat(product.stock ?? product.current_stock ?? 0)} {product.unit}
                        </div>
                          {parseFloat(product.low_stock_alert ?? product.min_stock_level ?? 0) > 0 && (
                            <div className="text-xs text-gray-500">
                              Min: {product.low_stock_alert ?? product.min_stock_level} {product.unit}
                            </div>
                          )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        ₹{parseFloat(product.price ?? product.purchase_price ?? product.unit_price ?? 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-green-700 dark:text-green-300">
                        ₹{totalValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.className}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center space-x-1">
                        {/* View button removed */}
                        <button
                          className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition text-xs"
                          onClick={() => onEdit(product)}
                        >
                          Edit
                        </button>
                        {/* Stock button removed */}
                        <button
                          className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-xs"
                          onClick={() => onDelete(product)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>

        {/* No data message */}
        {!isLoading &&
          (!data ||
            (Array.isArray(data)
              ? data.length === 0
              : ((!data.data || data.data.length === 0) &&
                  (!data.results || data.results.length === 0)))) && (
          <div className="p-8 text-center text-gray-500">
            <p>No products found.</p>
            <p className="text-sm mt-2">
              Click "Add Product" to create your first inventory item.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-end mt-4 gap-2">
        <button
          className="px-2 py-1 border rounded"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <span className="px-2 py-1">{page}</span>
        <button
          className="px-2 py-1 border rounded"
          disabled={!data?.next && !data?.data?.next}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>

      {/* Advanced Filters Modal */}
      {showAdvancedFilters && (
        <AdvancedInventoryFilters
          onFiltersChange={setAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
        />
      )}
    </div>
  );
}
