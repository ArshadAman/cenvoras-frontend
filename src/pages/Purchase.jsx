import React, { useState } from "react";
import PurchaseTable from "../components/purchase/PurchaseTable";
import PurchaseForm from "../components/purchase/PurchaseForm";
import PurchaseDetailsModal from "../components/purchase/PurchaseDetailsModal";
import PurchaseDeleteDialog from "../components/purchase/PurchaseDeleteDialog";
import PurchaseUploadCsv from "../components/purchase/PurchaseUploadCsv";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "../components/Layout";
import { ShoppingBagIcon, DocumentArrowUpIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Purchase() {
  const [showForm, setShowForm] = useState(false);
  const [editBill, setEditBill] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [deleteBill, setDeleteBill] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const handleEdit = (bill) => {
    setEditBill(bill);
    setShowForm(true); 
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditBill(null);
  };

  return (
    <Layout>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
             <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
                <ShoppingBagIcon className="w-8 h-8 text-purple-400" />
                Purchase Bills
             </h1>
             <p className="text-gray-400 text-sm">Track procurement and supplier relationships.</p>
           </div>
           
           <div className="flex gap-3">
             <button
               onClick={() => setShowUpload(true)}
               className="btn-secondary text-sm py-2 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white shadow-sm"
             >
               <DocumentArrowUpIcon className="h-4 w-4" />
               <span>Upload CSV</span>
             </button>
             <button
               onClick={() => setShowForm(true)}
               className="btn-primary text-sm py-2 px-4 shadow-lg shadow-purple-500/20"
             >
               <PlusIcon className="h-4 w-4" />
               <span>New Purchase</span>
             </button>
           </div>
        </div>

        {/* Purchase Table Container */}
        <div className="bento-card !p-0 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
               Purchase History
            </h2>
          </div>
          <PurchaseTable
              onEdit={handleEdit}
              onView={setShowDetails}
              onDelete={setDeleteBill}
            />
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <PurchaseForm
          bill={editBill}
          onClose={handleCloseForm} 
        />
      )}
      {showDetails && (
        <PurchaseDetailsModal
          billId={showDetails}
          onClose={() => setShowDetails(null)}
        />
      )}
      {deleteBill && (
        <PurchaseDeleteDialog
          billId={deleteBill}
          onClose={() => setDeleteBill(null)}
        />
      )}
      {showUpload && (
        <PurchaseUploadCsv onClose={() => setShowUpload(false)} />
      )}
      <ToastContainer position="top-right" />
    </Layout>
  );
}