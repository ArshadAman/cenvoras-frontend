import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useEscKey from "../hooks/useEscStack";
import VendorTable from "../components/vendors/VendorTable";
import VendorForm from "../components/vendors/VendorForm";
import VendorDetailsModal from "../components/vendors/VendorDetailsModal";
import VendorDeleteDialog from "../components/vendors/VendorDeleteDialog";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Vendors() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [deleteVendor, setDeleteVendor] = useState(null);

  // Hierarchical ESC key navigation:
  // 1. Idle on section list -> Esc redirects to Professional Dashboard (/dashboard)
  useEscKey(() => navigate('/dashboard'), !showForm && !showDetails && !deleteVendor, 0);
  // 2. View details modal -> Esc closes details
  useEscKey(() => setShowDetails(null), Boolean(showDetails), 10);
  // 3. Delete dialog -> Esc closes dialog
  useEscKey(() => setDeleteVendor(null), Boolean(deleteVendor), 20);

  const handleEdit = (vendor) => {
    setEditVendor(vendor);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditVendor(null);
  };

  return (
    <>
      <div className="relative p-4 md:p-6 space-y-5 animate-fade-up">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -top-8 -left-8 h-48 w-48 rounded-full bg-[var(--accent-primary)]/10 blur-3xl" />
        </div>

        <section className="bento-card p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--accent-primary)] font-semibold mb-1">Supply Network</p>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-2.5">
                <UserGroupIcon className="w-7 h-7 text-[var(--accent-primary)]" />
                Vendor Management
              </h1>
              <p className="text-[var(--text-secondary)] text-xs mt-1">Organize supplier records, track contact details, and operate procurement with confidence.</p>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl shrink-0"
            >
              <PlusIcon className="h-4 w-4" />
              Add Vendor
            </button>
          </div>
        </section>

        <section className="bento-card p-0 overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]/50">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Vendor Directory</h2>
            <span className="text-xs text-[var(--text-muted)]">Search, export, and maintain your supplier base</span>
          </div>
          <VendorTable
            onEdit={handleEdit}
            onView={(vendor) => setShowDetails(vendor)}
            onDelete={(vendor) => setDeleteVendor(vendor)}
            onAddNewVendor={() => setShowForm(true)}
          />
        </section>
      </div>

      {/* Modals */}
      {showForm && (
        <VendorForm 
          isOpen={showForm} 
          onClose={handleCloseForm}
          editData={editVendor}
        />
      )}

      {showDetails && (
        <VendorDetailsModal
          isOpen={!!showDetails}
          onClose={() => setShowDetails(null)}
          vendor={showDetails}
        />
      )}

      {deleteVendor && (
        <VendorDeleteDialog
          isOpen={!!deleteVendor}
          onClose={() => setDeleteVendor(null)}
          vendor={deleteVendor}
        />
      )}

      
    </>
  );
}