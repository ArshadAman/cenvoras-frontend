import React, { useState } from "react";
import Layout from "../components/Layout";
import InventoryTable from "../components/inventory/InventoryTable";
import ProductForm from "../components/inventory/ProductForm";
import ProductDetailsModal from "../components/inventory/ProductDetailsModal";
import ProductDeleteDialog from "../components/inventory/ProductDeleteDialog";
import StockAdjustmentModal from "../components/inventory/StockAdjustmentModal";
import StockTransfer from "../components/inventory/StockTransfer";
import { CubeIcon, PlusIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

export default function Inventory() {
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [showStockTransfer, setShowStockTransfer] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

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
    setSelectedProduct(null);
    setEditingProduct(null);
  };

  return (
    <Layout>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
               <CubeIcon className="w-8 h-8 text-cyan-400" />
               Product Inventory
            </h1>
            <p className="text-gray-400 text-sm">Manage stock, pricing, and variants.</p>
          </div>
          
          <div className="flex gap-3">
            <button
              disabled
              className="btn-secondary text-sm py-2 px-4 bg-white/5 border border-white/10 text-gray-500 shadow-sm cursor-not-allowed opacity-60 relative"
            >
              <ArrowsRightLeftIcon className="h-4 w-4" />
              <span>Transfer Stock</span>
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                Soon
              </span>
            </button>
            <button
              onClick={handleAddProduct}
              className="btn-primary text-sm py-2 px-4 shadow-lg shadow-cyan-500/20"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Inventory Table Container */}
        <div className="bento-card !p-0 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
               All Products
            </h2>
             {/* We can add filters here later if needed */}
          </div>
          <InventoryTable
            onEdit={handleEditProduct}
            onView={handleViewProduct}
            onDelete={handleDeleteProduct}
            onStockAdjustment={handleStockAdjustment}
          />
        </div>
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
    </Layout>
  );
}
