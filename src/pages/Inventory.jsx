import React, { useState } from "react";
import Layout from "../components/Layout";
import InventorySummary from "../components/inventory/InventorySummary";
import InventoryTable from "../components/inventory/InventoryTable";
import ProductForm from "../components/inventory/ProductForm";
import ProductDetailsModal from "../components/inventory/ProductDetailsModal";
import ProductDeleteDialog from "../components/inventory/ProductDeleteDialog";
import StockAdjustmentModal from "../components/inventory/StockAdjustmentModal";
import { CubeIcon, PlusIcon } from '@heroicons/react/24/outline';

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
      <div className="min-h-screen bg-gradient-to-br from-[#1a2341] via-[#1a2341] to-[#0d1421]">
        {/* Hero Header Section */}
        <div className="relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] rounded-full opacity-10 blur-2xl"></div>
            <div className="absolute top-20 right-20 w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 bg-gradient-to-r from-[#b6e0f7] to-[#eaf6fa] rounded-full opacity-10 blur-xl"></div>
          </div>

          {/* Header Content */}
          <div className="relative px-4 sm:px-6 pt-6 sm:pt-8 pb-12 sm:pb-16">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="p-3 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] rounded-2xl shadow-lg">
                  <CubeIcon className="h-6 w-6 sm:h-8 sm:w-8 text-[#1a2341]" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-white via-[#b6e0f7] to-[#7fd3f7] bg-clip-text text-transparent">
                    Inventory Management
                  </h1>
                  <p className="text-[#b6e0f7] mt-2 text-sm sm:text-base">Manage your products, stock levels, and inventory operations</p>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                onClick={handleAddProduct}
                className="group flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] text-[#1a2341] font-medium text-sm sm:text-base rounded-xl hover:from-[#b6e0f7] hover:to-[#eaf6fa] transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Add Product</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-4 sm:px-6 pb-6 sm:pb-8">
          {/* Summary Cards */}
          {/* Uncomment when InventorySummary is ready for the theme */}
          {/* <div className="mb-6 sm:mb-8">
            <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
              <InventorySummary />
            </div>
          </div> */}

          {/* Inventory Table Container */}
          <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-white/10">
              <h2 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">
                📦 Product Inventory
              </h2>
              <p className="text-cyan-300 mt-1 font-medium text-sm sm:text-base">
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
        </div>
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
    </Layout>
  );
}
