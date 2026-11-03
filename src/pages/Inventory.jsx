import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InventoryTable from "../components/inventory/InventoryTable";
import ProductForm from "../components/inventory/ProductForm";
import ProductDetailsModal from "../components/inventory/ProductDetailsModal";
import ProductDeleteDialog from "../components/inventory/ProductDeleteDialog";
import StockAdjustmentModal from "../components/inventory/StockAdjustmentModal";
import StockTransfer from "../components/inventory/StockTransfer";
import BatchSplitModal from "../components/inventory/BatchSplitModal";
import { CubeIcon, PlusIcon, ScissorsIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import useEscKey from "../hooks/useEscStack";

import Button from "../components/common/Button";

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
  const navigate = useNavigate();

  const isAnyModalOpen = Boolean(
    showProductForm ||
    showProductDetails ||
    productToDelete ||
    showStockAdjustment ||
    showStockTransfer ||
    showBatchSplit
  );

  // Level 0: When no modal is open, Esc navigates back to dashboard
  useEscKey(() => navigate('/dashboard'), !isAnyModalOpen, 0);

  // Esc keys for modals
  useEscKey(() => setShowBatchSplit(false), showBatchSplit, 20);
  useEscKey(() => setShowStockAdjustment(false), showStockAdjustment, 20);
  useEscKey(() => setShowStockTransfer(false), showStockTransfer, 20);
  useEscKey(() => setProductToDelete(null), Boolean(productToDelete), 20);
  useEscKey(() => setShowProductDetails(false), showProductDetails, 15);
  useEscKey(() => { setShowProductForm(false); setEditingProduct(null); }, showProductForm, 10);

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
        <section className="relative rounded-3xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent-primary)] font-bold mb-2">Inventory Control</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] mb-2 flex items-center gap-3">
                <CubeIcon className="w-9 h-9 text-[var(--accent-primary)]" />
                Product Inventory
              </h1>
              <p className="text-[var(--text-muted)] text-sm">Manage stock, pricing, variants, and batch workflows with focused operational controls.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowBatchSplit(true)}
                icon={ScissorsIcon}
              >
                Split Batch
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowStockTransfer(true)}
                icon={ArrowsRightLeftIcon}
              >
                Transfer Stock
              </Button>
              <Button
                variant="primary"
                onClick={handleAddProduct}
                icon={PlusIcon}
              >
                Add Product
              </Button>
            </div>
          </div>
        </section>

        <section className="relative rounded-[2rem] sm:rounded-3xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-0 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[var(--border-default)] flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[var(--bg-primary)]/40 gap-1 sm:gap-4">
            <h2 className="text-base sm:text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">All Products</h2>
            <span className="text-xs text-[var(--text-muted)]">Monitor stock, price, and batch health in real time</span>
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
