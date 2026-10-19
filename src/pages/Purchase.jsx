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
import Button from "../components/common/Button";
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
             <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-0.5 flex items-center gap-2.5">
                <ShoppingBagIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                Purchase Bills
             </h1>
             <p className="text-[var(--text-muted)] text-xs">Track procurement and supplier relationships.</p>
           </div>
           
           <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowUpload(true)}
                icon={DocumentArrowUpIcon}
              >
                Upload CSV
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowForm(true)}
                icon={PlusIcon}
              >
                New Purchase
              </Button>
            </div>
        </div>

        {/* Purchase Table Container */}
        <div className="bento-card !p-0 overflow-hidden">
          <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-primary)]/40">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
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