import React, { useState } from "react";
import CustomerTable from "../components/customers/CustomerTable";
import CustomerForm from "../components/customers/CustomerForm";
import CustomerDetailsModal from "../components/customers/CustomerDetailsModal";
import CustomerDeleteDialog from "../components/customers/CustomerDeleteDialog";
import CustomerSummary from "../components/customers/CustomerSummary";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "../components/Layout";
import { UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';

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
                  <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8 text-[#1a2341]" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-white via-[#b6e0f7] to-[#7fd3f7] bg-clip-text text-transparent">
                    Customer Management
                  </h1>
                  <p className="text-[#b6e0f7] mt-2 text-sm sm:text-base">Manage your customer database and relationships</p>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => setShowForm(true)}
                className="group flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] text-[#1a2341] font-medium text-sm sm:text-base rounded-xl hover:from-[#b6e0f7] hover:to-[#eaf6fa] transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Add Customer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-4 sm:px-6 pb-6 sm:pb-8">
          {/* Summary Cards */}
          <div className="mb-6 sm:mb-8">
            <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
              <CustomerSummary />
            </div>
          </div>

          {/* Customer Table Container */}
          <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <CustomerTable
              onEdit={handleEdit}
              onView={(customer) => setShowDetails(customer)}
              onDelete={(customer) => setDeleteCustomer(customer)}
            />
          </div>
        </div>
      </div>

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
    </Layout>
  );
}