import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import SalesTable from "../components/sales/SalesTable";
import SalesForm from "../components/sales/SalesForm";
import SalesDetailsModal from "../components/sales/SalesDetailsModal";
import SalesDeleteDialog from "../components/sales/SalesDeleteDialog";
import SalesUploadCsv from "../components/sales/SalesUploadCsv";
import SalesSummary from "../components/sales/SalesSummary";
import "react-toastify/dist/ReactToastify.css";
import Layout from "../components/Layout";
import { PlusIcon, ArrowUpTrayIcon, CurrencyRupeeIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { getUserProfile, patchUserProfile } from "../api/users";

const DEFAULT_INVOICE_PREFIX = "INV-";

const normalizePrefix = (value) => {
  return String(value ?? "").toUpperCase();
};

export default function Sales({ documentType = "invoice" }) {
  const isQuotation = documentType === "quotation";
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [deleteInvoice, setDeleteInvoice] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [invoicePrefix, setInvoicePrefix] = useState(DEFAULT_INVOICE_PREFIX);

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
    gem_id: billingProfile.gem_id,
    state: billingProfile.state,
  } : {};

  const handleEdit = (invoice) => {
    setEditInvoice(invoice);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditInvoice(null);
  };

  useEffect(() => {
    const dbPrefix = billingProfile?.invoice_prefix;
    if (dbPrefix !== undefined && dbPrefix !== null) {
      setInvoicePrefix(normalizePrefix(dbPrefix));
    }
  }, [billingProfile?.invoice_prefix]);

  const handlePrefixBlur = () => {
    const normalized = normalizePrefix(invoicePrefix);
    setInvoicePrefix(normalized);
    if (!canEditInvoicePrefix) {
      return;
    }
    if (normalized !== normalizePrefix(billingProfile?.invoice_prefix || DEFAULT_INVOICE_PREFIX)) {
      saveInvoicePrefixMutation.mutate(normalized);
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
              {isQuotation ? "Quotation Management" : "Sales Management"}
            </h1>
            <p className="text-gray-400 text-sm">
              {isQuotation
                ? "Create and manage customer quotations using the same invoice workflow."
                : "Create, manage and track your sales invoices."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
             <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-cyan-500/50">
               <span className="text-xs text-gray-400 font-medium">PREFIX:</span>
               <input 
                 type="text" 
                 value={invoicePrefix}
                 onChange={(e) => setInvoicePrefix(normalizePrefix(e.target.value))}
                 onBlur={handlePrefixBlur}
                 disabled={!canEditInvoicePrefix}
                 className="bg-transparent border-none text-white text-sm w-28 outline-none placeholder-gray-600 focus:ring-0 p-0"
                 placeholder="INV-"
                 maxLength={10}
                 title={!canEditInvoicePrefix ? 'Invoice prefix is managed by the main account.' : ''}
               />
             </div>
             <button
               onClick={() => setShowUpload(true)}
               className="btn-secondary text-sm py-2 px-4 shadow-sm bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center gap-2"
             >
               <ArrowUpTrayIcon className="w-4 h-4 text-cyan-400"/> Upload CSV
             </button>
             <button
               onClick={() => setShowForm(true)}
               className="btn-primary text-sm py-2 px-4 shadow-lg shadow-cyan-500/20 flex items-center gap-2"
             >
               <PlusIcon className="w-4 h-4"/> {isQuotation ? "New Quotation" : "New Sale"}
             </button>
          </div>
        </div>

        {/* Sales Summary */}
        {!isQuotation && <SalesSummary />}

        {/* Sales Table */}
        <div className="bento-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Sales Invoices</h2>
              <p className="text-xs text-gray-400">
                {isQuotation ? "Manage all your quotations" : "Manage all your sales transactions"}
              </p>
            </div>
          </div>
          <SalesTable
            initialStatusFilter={isQuotation ? "draft" : "final"}
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
          editData={editInvoice}
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
    </Layout>
  );
}