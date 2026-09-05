import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import InventoryTable from "../components/inventory/InventoryTable";
import ProductForm from "../components/inventory/ProductForm";
import ProductDetailsModal from "../components/inventory/ProductDetailsModal";
import ProductDeleteDialog from "../components/inventory/ProductDeleteDialog";
import StockAdjustmentModal from "../components/inventory/StockAdjustmentModal";
import StockTransfer from "../components/inventory/StockTransfer";
import BatchSplitModal from "../components/inventory/BatchSplitModal";
import { CubeIcon, PlusIcon, ArrowsRightLeftIcon, ScissorsIcon } from '@heroicons/react/24/outline';

export default function Inventory() {
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [showStockTransfer, setShowStockTransfer] = useState(false);
  const [showBatchSplit, setShowBatchSplit] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const addBarcode = params.get('addBarcode');
    if (addBarcode) {
      setEditingProduct({ barcode: addBarcode });
      setShowProductForm(true);
    }
  }, [location]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
  };

  const handleStockAdjustment = (product) => {
    setSelectedProduct(product);
    setShowStockAdjustment(true);
  };

  const handleCloseModals = () => {
    setShowProductForm(false);
    setShowProductDetails(false);
    setProductToDelete(null);
    setShowStockAdjustment(false);
    setShowBatchSplit(false);
    setSelectedProduct(null);
    setEditingProduct(null);
  };

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute -top-10 left-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute top-40 right-6 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
        </div>

        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/80 mb-2">Inventory Control</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-2 flex items-center gap-3">
                <CubeIcon className="w-9 h-9 text-cyan-300" />
                Product Inventory
              </h1>
              <p className="text-white/65 text-sm">Manage stock, pricing, variants, and batch workflows with focused operational controls.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowBatchSplit(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10"
              >
                <ScissorsIcon className="h-4 w-4" />
                Split Batch
              </button>
              <button
                disabled
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-500 cursor-not-allowed opacity-70 relative"
              >
                <ArrowsRightLeftIcon className="h-4 w-4" />
                Transfer Stock
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                  Soon
                </span>
              </button>
              <button
                onClick={handleAddProduct}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                <PlusIcon className="h-4 w-4" />
                Add Product
              </button>
            </div>
          </div>
        </section>

        <section className="relative rounded-[2rem] sm:rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/[0.02] gap-1 sm:gap-4">
            <h2 className="text-base sm:text-sm font-semibold text-white uppercase tracking-wider">All Products</h2>
            <span className="text-xs text-gray-400">Monitor stock, price, and batch health in real time</span>
          </div>
          <InventoryTable
            onEdit={handleEditProduct}
            onView={handleViewProduct}
            onDelete={handleDeleteProduct}
            onStockAdjustment={handleStockAdjustment}
          />
        </section>
      </div>

      {/* Modals */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleCloseModals}
        />
      )}

      {showProductDetails && selectedProduct && (
        <ProductDetailsModal
          productId={selectedProduct.id}
          onClose={handleCloseModals}
        />
      )}

      {productToDelete && (
        <ProductDeleteDialog
          product={productToDelete}
          onClose={handleCloseModals}
          onSuccess={handleCloseModals}
        />
      )}

      {showStockAdjustment && selectedProduct && (
        <StockAdjustmentModal
          product={selectedProduct}
          onClose={handleCloseModals}
          onSuccess={handleCloseModals}
        />
      )}

      {showStockTransfer && (
        <StockTransfer
          onClose={() => setShowStockTransfer(false)}
        />
      )}

      {showBatchSplit && (
        <BatchSplitModal
          onClose={() => setShowBatchSplit(false)}
        />
      )}
    </>
  );
}
