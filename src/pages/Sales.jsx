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
      <div className="space-y-8">
        {/* Page Header */}
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Sales Invoices
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Manage sales invoices and track revenue
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowUpload(true)}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload CSV
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Sale
                </button>
              </div>
            </div>
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