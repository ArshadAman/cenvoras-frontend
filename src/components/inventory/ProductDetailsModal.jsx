import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getProduct, getProductBatches } from "../../api/inventory";

export default function ProductDetailsModal({ productId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId),
    enabled: !!productId,
  });

  const { data: batchesData, isLoading: isLoadingBatches } = useQuery({
    queryKey: ["productBatches", productId],
    queryFn: () => getProductBatches({ product: productId }),
    enabled: !!productId,
  });

  const product = data?.data || data?.result || data || {};
  const batches = Array.isArray(batchesData) ? batchesData : batchesData?.results || [];

  if (!productId) return null;

  const getStockStatus = () => {
    const currentStock = parseFloat(product.stock ?? product.current_stock ?? 0);
    const minStock = parseFloat(product.low_stock_alert ?? product.min_stock_level ?? 0);
    
    if (currentStock === 0) {
      return { text: "Out of Stock", className: "bg-red-500/10 text-red-400 border border-red-500/20" };
    } else if (currentStock <= minStock) {
      return { text: "Low Stock", className: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" };
    } else {
      return { text: "In Stock", className: "bg-green-500/10 text-green-400 border border-green-500/20" };
    }
  };

  const stockStatus = getStockStatus();
  const costPrice = parseFloat(product.cost_price ?? product.price ?? product.unit_price ?? 0);
  const salePrice = product.sale_price == null ? null : parseFloat(product.sale_price);
  const totalValue = parseFloat(product.stock ?? product.current_stock ?? 0) * costPrice;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] pt-20 sm:pt-0 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bento-card !p-0 shadow-2xl shadow-purple-900/20 animate-fade-up">
        {/* Action Buttons */}
        {/* Header Top */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Product Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Product Details */}
        <div className="p-6 md:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/10"></div>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4 sm:gap-0 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="w-full sm:w-auto">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight break-words drop-shadow-md">
                    {product.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="text-sm font-mono text-cyan-200 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      SKU: {product.sku}
                    </span>
                    {product.barcode && (
                      <span className="text-sm font-mono text-purple-200 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        Code: {product.barcode}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <span className={`px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap shadow-lg ${stockStatus.className}`}>
                     {stockStatus.text}
                  </span>
                </div>
              </div>
              {/* Product Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white drop-shadow-md mb-3">Basic Information</h3>
                    <div className="bg-[#111] border border-white/5 shadow-inner p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-400">Category:</span>
                        <span>{product.category || 'Uncategorized'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-400">Unit:</span>
                        <span>{product.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-400">Cost Price:</span>
                        <span className="font-bold text-green-400">₹{costPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-400">Sale Price:</span>
                        <span className="font-bold text-blue-400">{salePrice === null ? '-' : `₹${salePrice.toFixed(2)}`}</span>
                      </div>
                      {product.supplier && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-400">Supplier:</span>
                          <span>{product.supplier}</span>
                        </div>
                      )}
                      {product.location && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-400">Location:</span>
                          <span>{product.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white drop-shadow-md mb-3">Stock Information</h3>
                    <div className="bg-[#111] border border-white/5 shadow-inner p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-400">Current Stock:</span>
                        <span className="font-bold">{product.stock ?? product.current_stock} {product.unit}</span>
                      </div>
                      {(product.low_stock_alert ?? product.min_stock_level) && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-400">Min Stock Level:</span>
                          <span>{product.low_stock_alert ?? product.min_stock_level} {product.unit}</span>
                        </div>
                      )}
                      {product.max_stock_level && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-400">Max Stock Level:</span>
                          <span>{product.max_stock_level} {product.unit}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium text-gray-400">Total Value:</span>
                        <span className="font-bold text-blue-400">₹{totalValue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white drop-shadow-md mb-3">Description</h3>
                  <div className="bg-[#111] border border-white/5 shadow-inner p-4 rounded-lg">
                    <p className="text-white drop-shadow-md">{product.description}</p>
                  </div>
                </div>
              )}

              {/* Stock Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-400">{product.stock ?? product.current_stock}</div>
                  <div className="text-sm text-blue-700">Current Stock</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">₹{costPrice.toFixed(2)}</div>
                  <div className="text-sm text-green-700">Cost Price</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">₹{totalValue.toFixed(2)}</div>
                  <div className="text-sm text-purple-700">Total Value</div>
                </div>
              </div>

              {/* Stock Level Indicator */}
              {(product.low_stock_alert ?? product.min_stock_level) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white drop-shadow-md mb-3">Stock Level Indicator</h3>
                  <div className="bg-[#111] border border-white/5 shadow-inner p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Stock Level</span>
                      <span className="text-sm text-gray-400">
                        {product.stock ?? product.current_stock} / {product.max_stock_level || 'No limit'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          parseFloat(product.stock ?? product.current_stock ?? 0) <= parseFloat(product.low_stock_alert ?? product.min_stock_level ?? 0)
                            ? 'bg-red-500'
                            : parseFloat(product.stock ?? product.current_stock ?? 0) <= parseFloat(product.low_stock_alert ?? product.min_stock_level ?? 0) * 2
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (parseFloat(product.stock ?? product.current_stock ?? 0) / (parseFloat(product.max_stock_level) || parseFloat(product.stock ?? product.current_stock ?? 0) || 1)) * 100
                          )}%`
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Min: {product.low_stock_alert ?? product.min_stock_level}</span>
                      {product.max_stock_level && <span>Max: {product.max_stock_level}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Batch History Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white drop-shadow-md mb-3 block">Batch History & Stock</h3>
                {isLoadingBatches ? (
                  <div className="bg-[#111] border border-white/5 shadow-inner p-4 rounded-lg flex justify-center">
                    <div className="animate-pulse flex space-x-4">
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                    </div>
                  </div>
                ) : batches.length > 0 ? (
                  <div className="overflow-x-auto bg-[#111] border border-white/5 shadow-inner rounded-lg p-4">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Batch No.</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">MRP</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Cost</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Sale</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Exp Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {batches.map((batch) => {
                          const batchStock = batch.stock_points?.reduce((acc, sp) => acc + sp.quantity, 0) || 0;
                          return (
                            <tr key={batch.id} className="hover:bg-[#111] border border-white/5 shadow-inner transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-l-4 border-l-blue-500">
                                {batch.batch_number}
                                {batch.manufacturing_date && <span className="text-[10px] text-gray-400 block">Mfg: {batch.manufacturing_date}</span>}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-white drop-shadow-md">
                                {batchStock}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">₹{parseFloat(batch.mrp || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400 font-medium">₹{parseFloat(batch.cost_price || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-400 font-semibold">₹{parseFloat(batch.sale_price || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {batch.expiry_date ? (
                                  <span className={new Date(batch.expiry_date) < new Date() ? 'text-red-500 font-bold' : ''}>
                                    {batch.expiry_date}
                                  </span>
                                ) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-[#111] border border-white/5 shadow-inner p-4 rounded-lg text-sm text-gray-500 italic">
                    No individual batches found for this product.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-white/10 text-center text-sm text-gray-500">
                Product details as of {new Date().toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
