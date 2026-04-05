import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../../api/inventory";
import AdvancedInventoryFilters from "./AdvancedInventoryFilters";
import Pagination from "../common/Pagination";

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
  const productsRaw = Array.isArray(data)
    ? data
    : data?.results || data?.data || [];
  const totalPages = data?.total_pages || 1;
  const currentPage = data?.current_page || page;

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
      return { text: "Out of Stock", className: "bg-red-500/30 text-red-200 border border-red-300/50 backdrop-filter backdrop-blur-10 font-bold" };
    } else if (minStock > 0 && currentStock > 0 && currentStock <= minStock) {
      return { text: "Low Stock", className: "bg-yellow-500/30 text-yellow-200 border border-yellow-300/50 backdrop-filter backdrop-blur-10 font-bold" };
    } else {
      return { text: "In Stock", className: "bg-green-500/30 text-green-200 border border-green-300/50 backdrop-filter backdrop-blur-10 font-bold" };
    }
  };

  return (
    <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 shadow-lg p-4 rounded">
      {/* Enhanced Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="border border-white/30 rounded px-2 py-1 text-sm bg-white/10 backdrop-filter backdrop-blur-10 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
          placeholder="Search by name or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="border border-white/30 rounded px-2 py-1 text-sm bg-white/10 backdrop-filter backdrop-blur-10 text-white focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
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
          className="border border-white/30 rounded px-2 py-1 text-sm bg-white/10 backdrop-filter backdrop-blur-10 text-white focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
        >
          <option value="all">All Stock</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
        <button
          onClick={() => setShowAdvancedFilters(true)}
          className="px-3 py-1 bg-purple-500/30 text-purple-200 border border-purple-300/50 rounded hover:bg-purple-400/40 transition text-sm backdrop-filter backdrop-blur-10 font-bold"
        >
          Advanced Filters
        </button>
      </div>

      {/* Bulk Actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
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
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
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

      {/* Table for desktop, Cards for mobile */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-gradient-to-r from-[#7fd3f7]/10 to-[#b6e0f7]/10 backdrop-blur-10">
              <th className="text-left py-3 px-4 rounded-l-lg">
                <input
                  type="checkbox"
                  checked={filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10 backdrop-filter backdrop-blur-10"
                />
              </th>
              <th className="text-left py-3 px-4 font-black text-white drop-shadow-lg">Product</th>
              <th className="text-center py-3 px-4 font-black text-white drop-shadow-lg">Stock</th>
              <th className="text-right py-3 px-4 font-black text-white drop-shadow-lg">Unit Price</th>
              <th className="text-right py-3 px-4 font-black text-white drop-shadow-lg">Total Value</th>
              <th className="text-center py-3 px-4 font-black text-white drop-shadow-lg">Status</th>
              <th className="text-center py-3 px-4 font-black text-white drop-shadow-lg">Warranty</th>
              <th className="text-center py-3 px-4 rounded-r-lg font-black text-white drop-shadow-lg">Actions</th>
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
                        className="py-6 animate-pulse bg-white/10 backdrop-filter backdrop-blur-10 rounded"
                      />
                    </tr>
                  ))
              : filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
              const totalValue = parseFloat(product.stock ?? product.current_stock ?? 0) * parseFloat(product.price ?? product.purchase_price ?? product.unit_price ?? 0);
                  
                  return (
                    <tr
                      key={product.id}
                      className="bg-white/5 backdrop-filter backdrop-blur-10 shadow rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300"
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                          className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10 backdrop-filter backdrop-blur-10"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white drop-shadow-lg">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-xs text-white/70 drop-shadow-md mt-1">
                            {product.description.substring(0, 50)}...
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-medium text-white drop-shadow-lg">
                            {parseFloat(product.stock ?? product.current_stock ?? 0)} {product.unit}
                        </div>
                          {parseFloat(product.low_stock_alert ?? product.min_stock_level ?? 0) > 0 && (
                            <div className="text-xs text-white/60 drop-shadow-md">
                              Min: {product.low_stock_alert ?? product.min_stock_level} {product.unit}
                            </div>
                          )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-white drop-shadow-lg">
                        ₹{parseFloat(product.price ?? product.purchase_price ?? product.unit_price ?? 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white drop-shadow-lg">
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
                      <td className="py-3 px-4 text-center">
                        {(product.warranty_months && product.warranty_months > 0) ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                            {product.warranty_months} mo
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center space-x-1">
                        {/* View button removed */}
                        <button
                          className="px-2 py-1 bg-green-500/30 text-white border border-green-300/50 rounded hover:bg-green-500/50 transition text-xs backdrop-filter backdrop-blur-10 drop-shadow-lg"
                          onClick={() => onEdit(product)}
                        >
                          Edit
                        </button>
                        {/* Stock button removed */}
                        <button
                          className="px-2 py-1 bg-red-500/30 text-white border border-red-300/50 rounded hover:bg-red-500/50 transition text-xs backdrop-filter backdrop-blur-10 drop-shadow-lg"
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
        {isLoading ? (
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
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                    className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10"
                  />
                  <div>
                    <div className="text-lg font-semibold text-white">
                      {product.name}
                    </div>
                    <div className="text-sm text-white/70">
                      SKU: {product.sku}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Category:</span>
                  <span className="text-sm font-medium text-white">{product.category || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Stock:</span>
                  <span className={`text-sm font-medium ${
                    product.stock_quantity <= (product.reorder_level || 0) 
                      ? 'text-red-400' 
                      : product.stock_quantity <= (product.reorder_level || 0) * 2 
                        ? 'text-yellow-400' 
                        : 'text-green-400'
                  }`}>
                    {product.stock_quantity} {product.unit}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Price:</span>
                  <span className="text-lg font-semibold text-[#7fd3f7]">
                    ₹{Number(product.price || 0).toLocaleString()}
                  </span>
                </div>

                {product.stock_quantity <= (product.reorder_level || 0) && (
                  <div className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded">
                    Low Stock Alert
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="flex space-x-2 mt-4 pt-3 border-t border-white/10">
                <button
                  onClick={() => onView(product)}
                  className="flex-1 px-3 py-2 bg-blue-500/30 text-white border border-blue-300/50 rounded-lg hover:bg-blue-500/50 transition backdrop-filter backdrop-blur-10 text-sm font-medium"
                >
                  View
                </button>
                <button
                  onClick={() => onStockAdjustment(product)}
                  className="flex-1 px-3 py-2 bg-orange-500/30 text-white border border-orange-300/50 rounded-lg hover:bg-orange-500/50 transition backdrop-filter backdrop-blur-10 text-sm font-medium"
                >
                  Adjust
                </button>
                <button
                  onClick={() => onEdit(product)}
                  className="flex-1 px-3 py-2 bg-indigo-500/30 text-white border border-indigo-300/50 rounded-lg hover:bg-indigo-500/50 transition backdrop-filter backdrop-blur-10 text-sm font-medium"
                >
                  Edit
                </button>
              </div>
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
