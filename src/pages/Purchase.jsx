import React, { useState } from "react";
import PurchaseTable from "../components/purchase/PurchaseTable";
import PurchaseForm from "../components/purchase/PurchaseForm";
import PurchaseDetailsModal from "../components/purchase/PurchaseDetailsModal";
import PurchaseDeleteDialog from "../components/purchase/PurchaseDeleteDialog";
import PurchaseUploadCsv from "../components/purchase/PurchaseUploadCsv";
import PurchaseSummary from "../components/purchase/PurchaseSummary";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "../components/Layout";
import { ShoppingBagIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';

export default function Purchase() {
  const [showForm, setShowForm] = useState(false);
  const [editBill, setEditBill] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [deleteBill, setDeleteBill] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  // Fix: Handle edit properly
  const handleEdit = (bill) => {
    setEditBill(bill);
    setShowForm(true); // This was missing!
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditBill(null);
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
                  <ShoppingBagIcon className="h-6 w-6 sm:h-8 sm:w-8 text-[#1a2341]" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-white via-[#b6e0f7] to-[#7fd3f7] bg-clip-text text-transparent">
                    Purchase Bills
                  </h1>
                  <p className="text-[#b6e0f7] mt-2 text-sm sm:text-base">Manage your purchase orders and supplier invoices</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowForm(true)}
                  className="group flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] text-[#1a2341] font-medium text-sm sm:text-base rounded-xl hover:from-[#b6e0f7] hover:to-[#eaf6fa] transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <ShoppingBagIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>New Purchase</span>
                </button>
                <button
                  onClick={() => setShowUpload(true)}
                  className="group flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 backdrop-filter backdrop-blur-20 bg-white/10 border border-white/20 text-white font-medium text-sm sm:text-base rounded-xl hover:bg-white/20 transform hover:scale-105 transition-all duration-200"
                >
                  <DocumentArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Upload CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-4 sm:px-6 pb-6 sm:pb-8">
          {/* Summary Cards */}
          <div className="mb-6 sm:mb-8">
            <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
              <PurchaseSummary />
            </div>
          </div>

          {/* Purchase Table Container */}
          <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <PurchaseTable
              onEdit={handleEdit}
              onView={setShowDetails}
              onDelete={setDeleteBill}
            />
          </div>
        </div>
      </div>
      {/* Modals */}
      {showForm && (
        <PurchaseForm
          bill={editBill}
          onClose={handleCloseForm} // Use the fixed handler
        />
      )}
      {showDetails && (
        <PurchaseDetailsModal
          billId={showDetails}
          onClose={() => setShowDetails(null)}
        />
      )}
      {deleteBill && (
        <PurchaseDeleteDialog
          billId={deleteBill}
          onClose={() => setDeleteBill(null)}
        />
      )}
      {showUpload && (
        <PurchaseUploadCsv onClose={() => setShowUpload(false)} />
      )}
      <ToastContainer position="top-right" />
    </Layout>
  );
}