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
    const currentStock = parseFloat(product.current_stock || 0);
    const minStock = parseFloat(product.min_stock_level || 0);
    
    if (currentStock === 0) {
      return { text: "Out of Stock", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
    } else if (currentStock <= minStock) {
      return { text: "Low Stock", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" };
    } else {
      return { text: "In Stock", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
    }
  };

  const stockStatus = getStockStatus();
  const totalValue = parseFloat(product.current_stock || 0) * parseFloat(product.unit_price || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-3xl font-sans max-h-[90vh] overflow-y-auto">
        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        {/* Product Details */}
        <div className="bg-white p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="flex justify-between items-start mb-6 border-b-2 border-blue-600 pb-4">
                <div>
                  <h2 className="text-3xl font-bold text-blue-700">
                    {product.name}
                  </h2>
                  <div className="text-sm text-gray-600 mt-1">
                    SKU: {product.sku}
                  </div>
                  {product.barcode && (
                    <div className="text-sm text-gray-600 mt-1">
                      Barcode: {product.barcode}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus.className}`}>
                    {stockStatus.text}
                  </span>
                </div>
              </div>

              {/* Product Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Basic Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Category:</span>
                        <span>{product.category || 'Uncategorized'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Unit:</span>
                        <span>{product.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Unit Price:</span>
                        <span className="font-bold text-green-600">₹{parseFloat(product.unit_price || 0).toFixed(2)}</span>
                      </div>
                      {product.supplier && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Supplier:</span>
                          <span>{product.supplier}</span>
                        </div>
                      )}
                      {product.location && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Location:</span>
                          <span>{product.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Stock Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Current Stock:</span>
                        <span className="font-bold">{product.current_stock} {product.unit}</span>
                      </div>
                      {product.min_stock_level && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Min Stock Level:</span>
                          <span>{product.min_stock_level} {product.unit}</span>
                        </div>
                      )}
                      {product.max_stock_level && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Max Stock Level:</span>
                          <span>{product.max_stock_level} {product.unit}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium text-gray-600">Total Value:</span>
                        <span className="font-bold text-blue-600">₹{totalValue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{product.description}</p>
                  </div>
                </div>
              )}

              {/* Stock Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{product.current_stock}</div>
                  <div className="text-sm text-blue-700">Current Stock</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">₹{parseFloat(product.unit_price || 0).toFixed(2)}</div>
                  <div className="text-sm text-green-700">Unit Price</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">₹{totalValue.toFixed(2)}</div>
                  <div className="text-sm text-purple-700">Total Value</div>
                </div>
              </div>

              {/* Stock Level Indicator */}
              {product.min_stock_level && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Stock Level Indicator</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Stock Level</span>
                      <span className="text-sm text-gray-600">
                        {product.current_stock} / {product.max_stock_level || 'No limit'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          parseFloat(product.current_stock) <= parseFloat(product.min_stock_level)
                            ? 'bg-red-500'
                            : parseFloat(product.current_stock) <= parseFloat(product.min_stock_level) * 2
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (parseFloat(product.current_stock) / (parseFloat(product.max_stock_level) || parseFloat(product.current_stock) || 1)) * 100
                          )}%`
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Min: {product.min_stock_level}</span>
                      {product.max_stock_level && <span>Max: {product.max_stock_level}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Batch History Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 block">Batch History & Stock</h3>
                {isLoadingBatches ? (
                  <div className="bg-gray-50 p-4 rounded-lg flex justify-center">
                    <div className="animate-pulse flex space-x-4">
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                    </div>
                  </div>
                ) : batches.length > 0 ? (
                  <div className="overflow-x-auto bg-gray-50 rounded-lg p-4">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Batch No.</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">MRP</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cost</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sale</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Exp Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {batches.map((batch) => {
                          const batchStock = batch.stock_points?.reduce((acc, sp) => acc + sp.quantity, 0) || 0;
                          return (
                            <tr key={batch.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-l-4 border-l-blue-500">
                                {batch.batch_number}
                                {batch.manufacturing_date && <span className="text-[10px] text-gray-400 block">Mfg: {batch.manufacturing_date}</span>}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-700">
                                {batchStock}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">₹{parseFloat(batch.mrp || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-medium">₹{parseFloat(batch.cost_price || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-semibold">₹{parseFloat(batch.sale_price || 0).toFixed(2)}</td>
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
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500 italic">
                    No individual batches found for this product.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                Product details as of {new Date().toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
