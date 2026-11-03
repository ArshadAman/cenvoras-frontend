import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useEscKey from "../hooks/useEscStack";
import CustomerTable from "../components/customers/CustomerTable";
import CustomerForm from "../components/customers/CustomerForm";
import CustomerDetailsModal from "../components/customers/CustomerDetailsModal";
import CustomerDeleteDialog from "../components/customers/CustomerDeleteDialog";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Customers() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [deleteCustomer, setDeleteCustomer] = useState(null);

  // Hierarchical ESC key navigation:
  // 1. Idle on section list -> Esc redirects to Professional Dashboard (/dashboard)
  useEscKey(() => navigate('/dashboard'), !showForm && !showDetails && !deleteCustomer, 0);
  // 2. View details modal -> Esc closes details
  useEscKey(() => setShowDetails(null), Boolean(showDetails), 10);
  // 3. Delete dialog -> Esc closes dialog
  useEscKey(() => setDeleteCustomer(null), Boolean(deleteCustomer), 20);

  const handleEdit = (customer) => {
    setEditCustomer(customer);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditCustomer(null);
  };

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -top-6 -left-10 h-56 w-56 rounded-full bg-[var(--accent-primary)]/10 blur-3xl" />
        </div>

        <section className="bento-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent-primary)] font-semibold mb-2">Relationship Hub</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                <UserGroupIcon className="w-9 h-9 text-[var(--accent-primary)]" />
                Customer Management
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">Maintain customer profiles, review balances, and act quickly from one clean workspace.</p>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl"
            >
              <PlusIcon className="h-4 w-4" />
              Add Customer
            </button>
          </div>
        </section>

        <section className="bento-card p-0 overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]/50">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Client Database</h2>
            <span className="text-xs text-[var(--text-muted)]">Search, view, edit, and manage customer records</span>
          </div>
          <CustomerTable
            onEdit={handleEdit}
            onView={(customer) => setShowDetails(customer)}
            onDelete={(customer) => setDeleteCustomer(customer)}
            onAddNewCustomer={() => setShowForm(true)}
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

      
    </>
  );
}