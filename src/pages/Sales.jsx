import React, { useState } from "react";
import SalesTable from "../components/sales/SalesTable";
import SalesForm from "../components/sales/SalesForm";
import SalesDetailsModal from "../components/sales/SalesDetailsModal";
import SalesDeleteDialog from "../components/sales/SalesDeleteDialog";
import SalesUploadCsv from "../components/sales/SalesUploadCsv";
import SalesSummary from "../components/sales/SalesSummary";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "../components/Layout";

export default function Sales() {
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [deleteInvoice, setDeleteInvoice] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const handleEdit = (invoice) => {
    setEditInvoice(invoice);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditInvoice(null);
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow flex items-center justify-between px-6 h-16">
          <span className="font-bold text-lg text-gray-900 dark:text-white">
            Sales Invoices
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              onClick={() => setShowForm(true)}
            >
              + New Sale
            </button>
            <button
              className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm"
              onClick={() => setShowUpload(true)}
            >
              Upload CSV
            </button>
          </div>
        </header>

        {/* Sales Summary */}
        <SalesSummary />

        {/* Sales Table */}
        <SalesTable
          onEdit={handleEdit}
          onView={(invoice) => setShowDetails(invoice)}
          onDelete={(invoice) => setDeleteInvoice(invoice)}
        />

        {/* Modals */}
        {showForm && (
          <SalesForm 
            isOpen={showForm} 
            onClose={handleCloseForm}
            editData={editInvoice}
          />
        )}

        {showDetails && (
          <SalesDetailsModal
            isOpen={!!showDetails}
            onClose={() => setShowDetails(null)}
            invoice={showDetails}
          />
        )}

        {deleteInvoice && (
          <SalesDeleteDialog
            isOpen={!!deleteInvoice}
            onClose={() => setDeleteInvoice(null)}
            invoice={deleteInvoice}
          />
        )}

        {showUpload && (
          <SalesUploadCsv
            isOpen={showUpload}
            onClose={() => setShowUpload(false)}
          />
        )}

        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      </div>
    </Layout>
  );
}