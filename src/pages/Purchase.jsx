import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useEscKey from "../hooks/useEscStack";
import PurchaseTable from "../components/purchase/PurchaseTable";
import PurchaseForm from "../components/purchase/PurchaseForm";
import PurchaseDetailsModal from "../components/purchase/PurchaseDetailsModal";
import PurchaseDeleteDialog from "../components/purchase/PurchaseDeleteDialog";
import PurchaseUploadCsv from "../components/purchase/PurchaseUploadCsv";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ShoppingBagIcon, DocumentArrowUpIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Purchase() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editBill, setEditBill] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [deleteBill, setDeleteBill] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  // Hierarchical ESC key navigation:
  // 1. Idle on section list -> Esc redirects to Professional Dashboard (/dashboard)
  useEscKey(() => navigate('/dashboard'), !showForm && !showDetails && !deleteBill && !showUpload, 0);
  // 2. View details modal -> Esc closes details
  useEscKey(() => setShowDetails(null), Boolean(showDetails), 10);
  // 3. Delete dialog -> Esc closes dialog
  useEscKey(() => setDeleteBill(null), Boolean(deleteBill), 20);
  // 4. Upload dialog -> Esc closes upload
  useEscKey(() => setShowUpload(false), Boolean(showUpload), 10);

  const handleEdit = (bill) => {
    setEditBill(bill);
    setShowForm(true); 
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditBill(null);
  };

  // Intercept back button to close any open overlay instead of navigating back in browser history
  useEffect(() => {
    const isAnyOverlayOpen = showForm || showDetails || deleteBill || showUpload;
    if (!isAnyOverlayOpen) return;

    const stateObj = { purchaseOverlayOpen: true };
    window.history.pushState(stateObj, '');

    const handlePopState = () => {
      setShowForm(false);
      setEditBill(null);
      setShowDetails(null);
      setDeleteBill(null);
      setShowUpload(false);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state && window.history.state.purchaseOverlayOpen) {
        window.history.back();
      }
    };
  }, [showForm, showDetails, deleteBill, showUpload]);

  return (
    <>
      <div className="p-4 md:p-6 space-y-5 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
           <div>
             <h1 className="text-2xl font-bold tracking-tight text-white mb-0.5 flex items-center gap-2.5">
                <ShoppingBagIcon className="w-6 h-6 text-purple-400" />
                Purchase Bills
             </h1>
             <p className="text-gray-400 text-xs">Track procurement and supplier relationships.</p>
           </div>
           
           <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => setShowUpload(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/10 shadow-sm uppercase tracking-widest"
              >
                <DocumentArrowUpIcon className="h-4 w-4" />
                <span>Upload CSV</span>
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-purple-400 shadow-lg shadow-purple-500/20 uppercase tracking-widest"
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
          isOpen={showForm}
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
      
    </>
  );
}