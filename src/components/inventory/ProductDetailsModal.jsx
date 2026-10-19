import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getProduct, getProductBatches } from "../../api/inventory";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import useEscKey from "../../hooks/useEscStack";

export default function ProductDetailsModal({ productId, onClose }) {
  useEscKey(onClose, Boolean(productId), 15);
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
    
    if (currentStock < 0) {
      return { text: "Critical", className: "badge-danger font-bold" };
    } else if (currentStock === 0) {
      return { text: "Out of Stock", className: "badge-danger font-medium" };
    } else if (minStock > 0 && currentStock <= minStock) {
      return { text: "Low Stock", className: "badge-warning font-medium" };
    } else {
      return { text: "In Stock", className: "badge-success font-medium" };
    }
  };

  const stockStatus = getStockStatus();
  const costPrice = parseFloat(product.cost_price ?? product.price ?? product.unit_price ?? 0);
  const salePrice = product.sale_price == null ? null : parseFloat(product.sale_price);
  const totalValue = parseFloat(product.stock ?? product.current_stock ?? 0) * costPrice;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] pt-20 sm:pt-0 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-0 shadow-2xl animate-fade-up">
        {/* Action Buttons */}
        {/* Header Top */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Product Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Product Details */}
        <div className="p-6 md:p-8 bg-[var(--bg-surface)] text-[var(--text-primary)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4 sm:gap-0 bg-[var(--bg-primary)] p-5 rounded-2xl border border-[var(--border-subtle)]">
                <div className="w-full sm:w-auto">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight break-words">
                    {product.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {(product.item_code || product.sku) && (
                      <span className="text-sm font-mono text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2.5 py-0.5 rounded-lg border border-[var(--accent-primary)]/20">
                        Item Code: {product.item_code || product.sku}
                      </span>
                    )}
                    {product.barcode && (
                      <span className="text-sm font-mono text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2.5 py-0.5 rounded-lg border border-[var(--accent-primary)]/20">
                        Barcode: {product.barcode}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <span className={`px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap shadow-sm ${stockStatus.className}`}>
                     {stockStatus.text}
                  </span>
                </div>
              </div>
              {/* Product Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">Basic Information</h3>
                    <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4 rounded-xl space-y-2.5">
                      {product.item_code && (
                        <div className="flex justify-between">
                          <span className="font-medium text-[var(--text-secondary)]">Item Code / SKU:</span>
                          <span className="text-[var(--accent-primary)] font-mono font-medium">{product.item_code}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="font-medium text-[var(--text-secondary)]">Category:</span>
                        <span className="text-[var(--text-primary)]">{product.category || 'Uncategorized'}</span>
                      </div>
                      {product.manufacturer && (
                        <div className="flex justify-between">
                          <span className="font-medium text-[var(--text-secondary)]">Manufacturer:</span>
                          <span className="text-[var(--text-primary)] font-medium">{product.manufacturer}</span>
                        </div>
                      )}
                      {product.internal_reference && (
                        <div className="flex justify-between">
                          <span className="font-medium text-[var(--text-secondary)]">Internal Reference:</span>
                          <span className="text-[var(--accent-primary)] font-mono font-medium">{product.internal_reference}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="font-medium text-[var(--text-secondary)]">GST Rate:</span>
                        <span className="text-[var(--text-primary)]">{product.tax ? `${product.tax}%` : '0%'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-[var(--text-secondary)]">Unit:</span>
                        <span className="text-[var(--text-primary)]">{product.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-[var(--text-secondary)]">Cost Price:</span>
                        <span className="font-bold text-[var(--status-success-text)] font-mono">{getCurrencySymbol()}{costPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-[var(--text-secondary)]">Sale Price:</span>
                        <span className="font-bold text-[var(--accent-primary)] font-mono">{salePrice === null ? '-' : `${getCurrencySymbol()}${salePrice.toFixed(2)}`}</span>
                      </div>
                      {product.meta?.storage_condition && (
                        <div className="flex justify-between">
                          <span className="font-medium text-[var(--text-secondary)]">Storage:</span>
                          <span className="text-[var(--text-primary)]">{product.meta.storage_condition}</span>
                        </div>
                      )}
                      {product.meta?.expiry_date && (
                        <div className="flex justify-between">
                          <span className="font-medium text-[var(--text-secondary)]">Expiry Date/Warranty:</span>
                          <span className="text-[var(--status-warning-text)] font-mono">
                            {(() => {
                              const parts = String(product.meta.expiry_date).split('-');
                              return parts.length === 3 && parts[0].length === 4
                                ? `${parts[2]}/${parts[1]}/${parts[0]}`
                                : product.meta.expiry_date;
                            })()}
                          </span>
                        </div>
                      )}
                      {product.supplier && (
                        <div className="flex justify-between">
                          <span className="font-medium text-[var(--text-secondary)]">Supplier:</span>
                          <span className="text-[var(--text-primary)]">{product.supplier}</span>
                        </div>
                      )}
                      {product.location && (
                        <div className="flex justify-between">
                          <span className="font-medium text-[var(--text-secondary)]">Location:</span>
                          <span className="text-[var(--text-primary)]">{product.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">Stock Information</h3>
                    <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4 rounded-xl space-y-2.5">
                      <div className="flex justify-between">
                        <span className="font-medium text-[var(--text-secondary)]">Current Stock:</span>
                        <span className="font-bold text-[var(--text-primary)]">{product.stock ?? product.current_stock} {product.unit}</span>
                      </div>
                      {(product.low_stock_alert ?? product.min_stock_level) && (
                        <div className="flex justify-between">
                          <span className="font-medium text-[var(--text-secondary)]">Min Stock Level:</span>
                          <span className="text-[var(--text-primary)]">{product.low_stock_alert ?? product.min_stock_level} {product.unit}</span>
                        </div>
                      )}
                      {product.max_stock_level && (
                        <div className="flex justify-between">
                          <span className="font-medium text-[var(--text-secondary)]">Max Stock Level:</span>
                          <span className="text-[var(--text-primary)]">{product.max_stock_level} {product.unit}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-[var(--border-subtle)] pt-2.5">
                        <span className="font-medium text-[var(--text-secondary)]">Total Value:</span>
                        <span className="font-bold text-[var(--accent-primary)]">{getCurrencySymbol()}{totalValue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">Description</h3>
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4 rounded-xl">
                    <p className="text-[var(--text-primary)]">{product.description}</p>
                  </div>
                </div>
              )}

              {/* Stock Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4 rounded-xl text-center shadow-sm">
                  <div className="text-2xl font-bold font-mono text-[var(--accent-primary)]">{product.stock ?? product.current_stock}</div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mt-1">Current Stock</div>
                </div>
                <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4 rounded-xl text-center shadow-sm">
                  <div className="text-2xl font-bold font-mono text-[var(--status-success-text)]">{getCurrencySymbol()}{costPrice.toFixed(2)}</div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mt-1">Cost Price</div>
                </div>
                <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4 rounded-xl text-center shadow-sm">
                  <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">{getCurrencySymbol()}{totalValue.toFixed(2)}</div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mt-1">Total Value</div>
                </div>
              </div>

              {/* Stock Level Indicator */}
              {(product.low_stock_alert ?? product.min_stock_level) && (
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">Stock Level Indicator</h3>
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[var(--text-secondary)]">Stock Level</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {product.stock ?? product.current_stock} / {product.max_stock_level || 'No limit'}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--bg-surface)] rounded-full h-2 border border-[var(--border-subtle)] overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          parseFloat(product.stock ?? product.current_stock ?? 0) <= parseFloat(product.low_stock_alert ?? product.min_stock_level ?? 0)
                            ? 'bg-[var(--status-danger-text)]'
                            : parseFloat(product.stock ?? product.current_stock ?? 0) <= parseFloat(product.low_stock_alert ?? product.min_stock_level ?? 0) * 2
                            ? 'bg-[var(--status-warning-text)]'
                            : 'bg-[var(--status-success-text)]'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (parseFloat(product.stock ?? product.current_stock ?? 0) / (parseFloat(product.max_stock_level) || parseFloat(product.stock ?? product.current_stock ?? 0) || 1)) * 100
                          )}%`
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1.5">
                      <span>Min: {product.low_stock_alert ?? product.min_stock_level}</span>
                      {product.max_stock_level && <span>Max: {product.max_stock_level}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Batch History Section */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3 block">Batch History & Stock</h3>
                {isLoadingBatches ? (
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4 rounded-xl flex justify-center">
                    <div className="animate-pulse flex space-x-4">
                      <div className="h-4 bg-[var(--border-subtle)] rounded w-24"></div>
                    </div>
                  </div>
                ) : batches.length > 0 ? (
                  <div className="overflow-x-auto bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-4">
                    <table className="min-w-full divide-y divide-[var(--border-subtle)]">
                      <thead className="bg-[var(--bg-surface)]">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Batch No.</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Stock</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">MRP</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Cost</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Sale</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Exp Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {batches.map((batch) => {
                          const batchStock = batch.stock_points?.reduce((acc, sp) => acc + sp.quantity, 0) || 0;
                          return (
                            <tr key={batch.id} className="hover:bg-[var(--bg-surface)]/50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[var(--text-primary)] border-l-4 border-l-[var(--accent-primary)]">
                                {batch.batch_number}
                                {batch.manufacturing_date && <span className="text-[10px] text-[var(--text-secondary)] block">Mfg: {batch.manufacturing_date}</span>}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-[var(--text-primary)]">
                                {batchStock}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-secondary)]">{getCurrencySymbol()}{parseFloat(batch.mrp || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-secondary)] font-medium">{getCurrencySymbol()}{parseFloat(batch.cost_price || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--accent-primary)] font-semibold">{getCurrencySymbol()}{parseFloat(batch.sale_price || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                                {batch.expiry_date ? (
                                  <span className={new Date(batch.expiry_date) < new Date() ? 'text-[var(--status-danger-text)] font-bold' : ''}>
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
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4 rounded-xl text-sm text-[var(--text-secondary)] italic">
                    No individual batches found for this product.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-[var(--border-subtle)] text-center text-sm text-[var(--text-secondary)]">
                Product details as of {new Date().toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
