import React, { useState } from "react";
import VendorTable from "../components/vendors/VendorTable";
import VendorForm from "../components/vendors/VendorForm";
import VendorDetailsModal from "../components/vendors/VendorDetailsModal";
import VendorDeleteDialog from "../components/vendors/VendorDeleteDialog";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "../components/Layout";
import { UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Vendors() {
  const [showForm, setShowForm] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [deleteVendor, setDeleteVendor] = useState(null);

  const handleEdit = (vendor) => {
    setEditVendor(vendor);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditVendor(null);
  };

  return (
    <Layout>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute -top-8 -left-8 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute top-24 right-8 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">Supply Network</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <UserGroupIcon className="w-9 h-9 text-indigo-300" />
                Vendor Management
              </h1>
              <p className="text-white/65 text-sm mt-2">Organize supplier records, track contact details, and operate procurement with confidence.</p>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300"
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

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </Layout>
  );
}