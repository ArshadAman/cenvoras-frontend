import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import { format, subDays } from 'date-fns';
import LedgerSummary from '../components/ledger/LedgerSummary';
import LedgerTable from '../components/ledger/LedgerTable';
import PaymentForm from '../components/ledger/PaymentForm';
import LedgerEntryForm from '../components/ledger/LedgerEntryForm';
import LedgerDeleteDialog from '../components/ledger/LedgerDeleteDialog';
import BulkDeleteModal from '../components/BulkDeleteModal';
import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '../api/customers';
import { bulkDeleteLedgerEntries, getAccounts } from '../api/ledger';
import Layout from '../components/Layout';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PlusIcon, BanknotesIcon, XMarkIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';

const Ledger = () => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);


  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
  };

  const handleEditEntry = (entry) => {
    setSelectedEntry(entry);
    setShowEditForm(true);
  };

  const handleDeleteEntry = (entry) => {
    setSelectedEntry(entry);
    setShowDeleteDialog(true);
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setSelectedEntry(null);
  };

  const handleDeleteSuccess = () => {
    setShowDeleteDialog(false);
    setSelectedEntry(null);
  };


  // Bulk selection handlers
  const handleBulkSelect = (entryIds) => {
    setSelectedEntries(entryIds);
  };

  const clearSelection = () => {
    setSelectedEntries([]);
  };

  const handleBulkDelete = () => {
    if (selectedEntries.length > 0) {
      setIsBulkDeleteOpen(true);
    }
  };

  const inputClass = "w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm font-medium";
  const labelClass = "block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide";

  return (
    <Layout>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
             <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
                <BanknotesIcon className="w-8 h-8 text-green-400" />
                Client Ledger
             </h1>
             <p className="text-gray-400 text-sm">Track client payments, debits, and account balances.</p>
           </div>
           
           <div className="flex gap-3">
             <button
               className="btn-secondary text-sm py-2 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white shadow-sm"
             >
               <DocumentArrowUpIcon className="h-4 w-4" />
               <span>Export CSV</span>
             </button>
             <button
               onClick={() => setShowPaymentForm(true)}
               className="btn-primary text-sm py-2 px-4 shadow-lg shadow-green-500/20"
             >
               <PlusIcon className="h-4 w-4" />
               <span>Record Payment</span>
             </button>
           </div>
        </div>

        {/* Ledger Table Container */}
        <div className="bento-card !p-0 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
               Ledger Entries
            </h2>
          </div>
          <LedgerTable
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            selectedEntries={selectedEntries}
            onBulkSelect={handleBulkSelect}
          />
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPaymentForm(false)}></div>
          
          <div className="relative w-full max-w-lg bento-card !p-0 shadow-2xl shadow-green-900/20 animate-fade-up bg-[#111] border border-white/10">
             <div className="flex justify-between items-center p-8 border-b border-white/10 bg-white/5">
                <h3 className="text-xl font-bold text-white">Record Payment</h3>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
             </div>
             <div className="p-8">
                <PaymentForm
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setShowPaymentForm(false)}
                />
             </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Entry Modal */}
      {showEditForm && selectedEntry && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => {setShowEditForm(false); setSelectedEntry(null);}}></div>
          
          <div className="relative w-full max-w-lg bento-card !p-0 shadow-2xl shadow-blue-900/20 animate-fade-up bg-[#111] border border-white/10">
             <div className="flex justify-between items-center p-8 border-b border-white/10 bg-white/5">
                <h3 className="text-xl font-bold text-white">Edit Ledger Entry</h3>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setSelectedEntry(null);
                  }}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
             </div>
             <div className="p-8">
              <LedgerEntryForm
                  entry={selectedEntry}
                  onSuccess={handleEditSuccess}
                  onCancel={() => {
                    setShowEditForm(false);
                    setSelectedEntry(null);
                  }}
                />
             </div>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        selectedItems={selectedEntries}
        onClearSelection={clearSelection}
        bulkDeleteFn={bulkDeleteLedgerEntries}
        invalidateQueries={[['generalLedgerEntries']]}
        itemType="ledger entry"
        title="Delete Selected Ledger Entries"
        description="Are you sure you want to delete the selected ledger entries? This action cannot be undone and will remove these transactions from your records."
      />

      {/* Delete Confirmation Dialog */}
      <LedgerDeleteDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteSuccess}
        entry={selectedEntry}
      />

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="dark" />
    </Layout>
  );
};

export default Ledger;