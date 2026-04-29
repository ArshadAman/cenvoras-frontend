import React, { useState } from "react";
import CustomerTable from "../components/customers/CustomerTable";
import CustomerForm from "../components/customers/CustomerForm";
import CustomerDetailsModal from "../components/customers/CustomerDetailsModal";
import CustomerDeleteDialog from "../components/customers/CustomerDeleteDialog";
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
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute -top-6 -left-10 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute top-32 right-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-blue-300/80 mb-2">Relationship Hub</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <UserGroupIcon className="w-9 h-9 text-blue-300" />
                Customer Management
              </h1>
              <p className="text-white/65 text-sm mt-2">Maintain customer profiles, review balances, and act quickly from one clean workspace.</p>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-blue-300"
            >
              <PlusIcon className="h-4 w-4" />
              Add Customer
            </button>
          </div>
        </section>

        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Client Database</h2>
            <span className="text-xs text-gray-400">Search, view, edit, and manage customer records</span>
          </div>
          <CustomerTable
            onEdit={handleEdit}
            onView={(customer) => setShowDetails(customer)}
            onDelete={(customer) => setDeleteCustomer(customer)}
          />
        </section>
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