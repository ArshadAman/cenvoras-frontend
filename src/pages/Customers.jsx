import React, { useState } from "react";
import CustomerTable from "../components/customers/CustomerTable";
import CustomerForm from "../components/customers/CustomerForm";
import CustomerDetailsModal from "../components/customers/CustomerDetailsModal";
import CustomerDeleteDialog from "../components/customers/CustomerDeleteDialog";
import CustomerSummary from "../components/customers/CustomerSummary";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "../components/Layout";

export default function Customers() {
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [deleteCustomer, setDeleteCustomer] = useState(null);

  const handleEdit = (customer) => {
    setEditCustomer(customer);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditCustomer(null);
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
                  Customer Management
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Manage your customer database and relationships
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Customer
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Customer Summary */}
        <CustomerSummary />

        {/* Customer Table */}
        <CustomerTable
          onEdit={handleEdit}
          onView={(customer) => setShowDetails(customer)}
          onDelete={(customer) => setDeleteCustomer(customer)}
        />

        {/* Modals */}
        {showForm && (
          <CustomerForm 
            isOpen={showForm} 
            onClose={handleCloseForm}
            editData={editCustomer}
          />
        )}

        {showDetails && (
          <CustomerDetailsModal
            isOpen={!!showDetails}
            onClose={() => setShowDetails(null)}
            customer={showDetails}
          />
        )}

        {deleteCustomer && (
          <CustomerDeleteDialog
            isOpen={!!deleteCustomer}
            onClose={() => setDeleteCustomer(null)}
            customer={deleteCustomer}
          />
        )}

        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      </div>
    </Layout>
  );
}