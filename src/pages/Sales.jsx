import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useEscKey from "../hooks/useEscStack";
import SalesTable from "../components/sales/SalesTable";
import SalesForm from "../components/sales/SalesForm";
import SalesDetailsModal from "../components/sales/SalesDetailsModal";
import SalesDeleteDialog from "../components/sales/SalesDeleteDialog";
import SalesUploadCsv from "../components/sales/SalesUploadCsv";
import SalesSummary from "../components/sales/SalesSummary";
import "react-toastify/dist/ReactToastify.css";
import { PlusIcon, ArrowUpTrayIcon, CurrencyRupeeIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { getUserProfile, patchUserProfile } from "../api/users";
import { getNextInvoiceNumber } from "../api/sales";

// R22: matches users.User.invoice_prefix max_length=20 (the old maxLength=10 silently cut "R22-CANCELTEST").
const PREFIX_MAX = 20;

const DEFAULT_INVOICE_PREFIX = "INV";

const normalizePrefix = (value) => {
  return String(value ?? "").toUpperCase();
};

export default function Sales({ documentType = "invoice" }) {
  const queryClient = useQueryClient();
  const isQuotation = documentType === "quotation";
  const location = useLocation();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [aiDraftData, setAiDraftData] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [deleteInvoice, setDeleteInvoice] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [invoicePrefix, setInvoicePrefix] = useState(DEFAULT_INVOICE_PREFIX);
  const [statusFilterTab, setStatusFilterTab] = useState(isQuotation ? "draft" : "final");

  // Hierarchical ESC key navigation:
  // 1. Idle on section list -> Esc redirects to Professional Dashboard (/dashboard)
  useEscKey(() => navigate('/dashboard'), !showForm && !showDetails && !deleteInvoice && !showUpload, 0);
  // 2. View details modal -> Esc closes details
  useEscKey(() => setShowDetails(null), Boolean(showDetails), 10);
  // 3. Delete dialog -> Esc closes dialog
  useEscKey(() => setDeleteInvoice(null), Boolean(deleteInvoice), 20);
  // 4. Upload dialog -> Esc closes upload
  useEscKey(() => setShowUpload(false), Boolean(showUpload), 10);

  // Fetch user profile for invoice customization
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const saveInvoicePrefixMutation = useMutation({
    mutationFn: (prefix) => patchUserProfile({ invoice_prefix: prefix }),
  });

  const billingProfile = userProfile?.billing_profile || userProfile?.profile;
  const canEditInvoicePrefix = Boolean(
    userProfile?.profile?.id &&
    billingProfile?.id &&
    userProfile.profile.id === billingProfile.id
  );

  // # Extract business info from billing profile (tenant/owner)
  const businessInfo = billingProfile ? {
    business_name: billingProfile.business_name,
    business_address: billingProfile.business_address,
    phone: billingProfile.phone,
    email: billingProfile.email,
    gstin: billingProfile.gstin,
    pan_number: billingProfile.pan_number,
    gem_id: billingProfile.gem_id,
    dl_number: billingProfile.dl_number,
    state: billingProfile.state,
    city: billingProfile.city,
    country: billingProfile.country,
    trn: billingProfile.trn,
    bank_name: billingProfile.bank_name,
    bank_account_number: billingProfile.bank_account_number,
    bank_ifsc_code: billingProfile.bank_ifsc_code,
    bank_branch: billingProfile.bank_branch,
    bank_upi_id: billingProfile.bank_upi_id,
    bank_qr_code: billingProfile.bank_qr_code,
  } : {};

  const handleEdit = (invoice) => {
    setEditInvoice(invoice);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditInvoice(null);
    setAiDraftData(null);
    queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
    queryClient.invalidateQueries({ queryKey: ["quotations"] });
    queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
    queryClient.invalidateQueries({ queryKey: ["salesAnalytics"] });
  };

  const handleDocumentSaved = (saved) => {
    const status = String(saved?.status || "").toLowerCase();
    if (status === "draft") {
      setStatusFilterTab("draft");
    } else if (status === "final") {
      setStatusFilterTab("final");
    }
    queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
    queryClient.invalidateQueries({ queryKey: ["salesAnalytics"] });
  };

  useEffect(() => {
    const dbPrefix = billingProfile?.invoice_prefix;
    if (dbPrefix !== undefined && dbPrefix !== null) {
      setInvoicePrefix(normalizePrefix(dbPrefix));
    }
  }, [billingProfile?.invoice_prefix]);

  // Handle AI Draft or View Invoice from navigation state
  useEffect(() => {
    if (location.state?.aiDraft) {
      setAiDraftData(location.state.aiDraft);
      setShowForm(true);
      // Clear location state to prevent re-opening on refresh
      window.history.replaceState({}, document.title);
    } else if (location.state?.viewInvoiceId) {
      // Find and show details of the newly created invoice
      // We'll set showDetails to a dummy object with ID first, 
      // or we can wait for the table to load.
      // Better: pass the ID to showDetails if we can fetch it, 
      // but SalesDetailsModal expects the full invoice object.
      // For now, let's just trigger the modal if we have the ID.
      setShowDetails({ id: location.state.viewInvoiceId });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Intercept back button to close any open overlay instead of navigating back in browser history
  useEffect(() => {
    const isAnyOverlayOpen = showForm || showDetails || deleteInvoice || showUpload;
    if (!isAnyOverlayOpen) return;

    const stateObj = { salesOverlayOpen: true };
    window.history.pushState(stateObj, '');

    const handlePopState = () => {
      setShowForm(false);
      setEditInvoice(null);
      setAiDraftData(null);
      setShowDetails(null);
      setDeleteInvoice(null);
      setShowUpload(false);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state && window.history.state.salesOverlayOpen) {
        window.history.back();
      }
    };
  }, [showForm, showDetails, deleteInvoice, showUpload]);

  const handlePrefixBlur = async () => {
    const normalized = normalizePrefix(invoicePrefix);
    setInvoicePrefix(normalized);
    if (!canEditInvoicePrefix) {
      return;
    }
    const current = normalizePrefix(billingProfile?.invoice_prefix || DEFAULT_INVOICE_PREFIX);
    if (normalized !== current) {
      // R21: the prefix box used to save silently on blur, so a stray edit (e.g. "R19-INV-4") became
      // the configured series and every new invoice was suggested as R19-INV-4-001. Confirm first.
      // R22: show the number the server will actually issue. The counter is per prefix
      // (sequence_service.preview_next_number), so a prefix used before continues its series (e.g. INV-016).
      const target = normalized || DEFAULT_INVOICE_PREFIX;
      let nextLine = 'The next invoice number could not be checked.';
      try {
        const res = await getNextInvoiceNumber(encodeURIComponent(target));
        if (res?.next_number) nextLine = `The next invoice will be ${res.next_number}.`;
      } catch { /* keep generic line */ }
      const ok = window.confirm(
        `Change the invoice series prefix from "${current}" to "${target}"?\n\n${nextLine}`
      );
      if (!ok) {
        setInvoicePrefix(current);
        return;
      }
      saveInvoicePrefixMutation.mutate(normalized);
    }
  };

  return (
    <>
      <div className="p-2 sm:p-6 md:p-10 space-y-8 animate-fade-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2 sm:px-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
              {isQuotation ? "Quotation Management" : "Sales Management"}
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              {isQuotation
                ? "Create and manage customer quotations using the same invoice workflow."
                : "Create, manage and track your sales invoices."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
             <div className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-1.5 focus-within:border-[var(--accent-primary)] w-full sm:w-auto">
               <span className="text-xs text-[var(--text-muted)] font-medium">PREFIX:</span>
               <input 
                 type="text" 
                 value={invoicePrefix}
                 onChange={(e) => setInvoicePrefix(normalizePrefix(e.target.value))}
                 onBlur={handlePrefixBlur}
                 disabled={!canEditInvoicePrefix}
                 className="bg-transparent border-none text-[var(--text-primary)] text-sm flex-1 sm:w-28 outline-none placeholder-[var(--text-muted)] focus:ring-0 p-0"
                 placeholder="INV"
                 maxLength={PREFIX_MAX}
                 title={!canEditInvoicePrefix ? 'Invoice prefix is managed by the main account.' : `Up to ${PREFIX_MAX} characters`}
               />
               {invoicePrefix.length >= PREFIX_MAX && (
                 <span className="text-[10px] text-amber-400 whitespace-nowrap">Max {PREFIX_MAX} characters</span>
               )}
             </div>
             <div className="flex gap-2 w-full sm:w-auto">
               <button
                 onClick={() => setShowUpload(true)}
                 className="btn-secondary text-sm py-2 px-4 flex-1 sm:flex-none flex items-center justify-center gap-2"
               >
                 <ArrowUpTrayIcon className="w-4 h-4 text-[var(--accent-primary)]"/> Upload CSV
               </button>
               <button
                 onClick={() => setShowForm(true)}
                 className="btn-primary text-sm py-2 px-4 flex-1 sm:flex-none flex items-center justify-center gap-2"
               >
                 <PlusIcon className="w-4 h-4"/> {isQuotation ? "New Quotation" : "New Sale"}
               </button>
             </div>
          </div>
        </div>

        {/* Sales Summary */}
        {!isQuotation && <SalesSummary />}

        {/* Sales Table */}
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 sm:p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between px-1 sm:px-0">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">Sales Invoices</h2>
              <p className="text-xs text-[var(--text-muted)]">
                {isQuotation ? "Manage all your quotations" : "Manage all your sales transactions"}
              </p>
            </div>
          </div>
          <SalesTable
            initialStatusFilter={isQuotation ? "draft" : "final"}
            statusFilter={statusFilterTab}
            onStatusFilterChange={setStatusFilterTab}
            hideStatusTabs={isQuotation}
            documentType={documentType}
            onEdit={handleEdit}
            onView={(invoice) => setShowDetails(invoice)}
            onDelete={(invoice) => setDeleteInvoice(invoice)}
          />
        </div>

      </div>

      {/* Modals */}
      {showForm && (
        <SalesForm 
          isOpen={showForm} 
          onClose={handleCloseForm}
          onSaved={handleDocumentSaved}
          editData={editInvoice}
          aiDraftData={aiDraftData}
          invoicePrefix={invoicePrefix}
          documentType={documentType}
          forceDraft={isQuotation}
        />
      )}

      {showDetails && (
        <SalesDetailsModal
          isOpen={!!showDetails}
          onClose={() => setShowDetails(null)}
          invoice={showDetails}
          businessInfo={businessInfo}
        />
      )}

      {deleteInvoice && (
        <SalesDeleteDialog
          isOpen={!!deleteInvoice}
          onClose={() => setDeleteInvoice(null)}
          invoice={deleteInvoice}
        />
      )}

      {showUpload && (
        <SalesUploadCsv
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
        />
      )}
    </>
  );
}