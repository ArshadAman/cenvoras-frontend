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
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
             <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
                <UserGroupIcon className="w-8 h-8 text-blue-400" />
                Vendor Management
             </h1>
             <p className="text-gray-400 text-sm">Manage client relationships and data.</p>
           </div>
           
           <div>
             <button
               onClick={() => setShowForm(true)}
               className="btn-primary text-sm py-2 px-4 shadow-lg shadow-blue-500/20"
             >
               <PlusIcon className="h-4 w-4" />
               <span>Add Vendor</span>
             </button>
           </div>
        </div>

        {/* Vendor Table Container */}
        <div className="bento-card !p-0 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
               Client Database
            </h2>
          </div>
          <VendorTable
              onEdit={handleEdit}
              onView={(vendor) => setShowDetails(vendor)}
              onDelete={(vendor) => setDeleteVendor(vendor)}
            />
        </div>
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