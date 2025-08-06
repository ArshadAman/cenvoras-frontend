import React, { useState } from "react";
import PurchaseTable from "../components/purchase/PurchaseTable";
import PurchaseForm from "../components/purchase/PurchaseForm";
import PurchaseDetailsModal from "../components/purchase/PurchaseDetailsModal";
import PurchaseDeleteDialog from "../components/purchase/PurchaseDeleteDialog";
import PurchaseUploadCsv from "../components/purchase/PurchaseUploadCsv";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "../components/Layout";

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
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow flex items-center justify-between px-6 h-16">
          <span className="font-bold text-lg text-gray-900 dark:text-white">
            Purchase Bills
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              onClick={() => setShowForm(true)}
            >
              + New Purchase
            </button>
            <button
              className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm"
              onClick={() => setShowUpload(true)}
            >
              Upload CSV
            </button>
          </div>
        </header>
        <main className="flex-1 p-4">
          <PurchaseTable
            onEdit={handleEdit} // Use the fixed handler
            onView={setShowDetails}
            onDelete={setDeleteBill}
          />
        </main>
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