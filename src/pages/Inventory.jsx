import React, { useState } from "react";
import Layout from "../components/Layout";
import InventorySummary from "../components/inventory/InventorySummary";
import InventoryTable from "../components/inventory/InventoryTable";
import ProductForm from "../components/inventory/ProductForm";
import ProductDetailsModal from "../components/inventory/ProductDetailsModal";
import ProductDeleteDialog from "../components/inventory/ProductDeleteDialog";
import StockAdjustmentModal from "../components/inventory/StockAdjustmentModal";

export default function Inventory() {
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
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
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Inventory Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your products, stock levels, and inventory operations
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddProduct}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Product
            </button>
          </div>
        </div>

        {/* Inventory Summary */}
        {/* <InventorySummary /> */}

        {/* Inventory Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Product Inventory
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View and manage all your products and stock levels
            </p>
          </div>
          <InventoryTable
            onEdit={handleEditProduct}
            onView={handleViewProduct}
            onDelete={handleDeleteProduct}
            onStockAdjustment={handleStockAdjustment}
          />
        </div>

        {/* Modals */}
        {showProductForm && (
          <ProductForm
            product={editingProduct}
            onClose={handleCloseModals}
            onSuccess={handleCloseModals}
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
      </div>
    </Layout>
  );
}
