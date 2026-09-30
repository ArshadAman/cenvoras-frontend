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
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute -top-8 -left-8 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute top-24 right-8 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <section className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4 md:p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-indigo-300/80 mb-1">Supply Network</p>
              <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2.5">
                <UserGroupIcon className="w-7 h-7 text-indigo-300" />
                Vendor Management
              </h1>
              <p className="text-white/65 text-xs mt-1">Organize supplier records, track contact details, and operate procurement with confidence.</p>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-indigo-300 shrink-0"
            >
              <PlusIcon className="h-4 w-4" />
              Add Vendor
            </button>
          </div>
        </section>

        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Vendor Directory</h2>
            <span className="text-xs text-gray-400">Search, export, and maintain your supplier base</span>
          </div>
          <VendorTable
            onEdit={handleEdit}
            onView={(vendor) => setShowDetails(vendor)}
            onDelete={(vendor) => setDeleteVendor(vendor)}
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