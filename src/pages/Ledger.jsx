import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import LedgerSummary from '../components/ledger/LedgerSummary';
import LedgerTable from '../components/ledger/LedgerTable';
import PaymentForm from '../components/ledger/PaymentForm';
import LedgerEntryForm from '../components/ledger/LedgerEntryForm';
import LedgerDeleteDialog from '../components/ledger/LedgerDeleteDialog';
import BulkDeleteModal from '../components/BulkDeleteModal';
import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '../api/customers';
import { getVendors } from '../api/vendors';
import { bulkDeleteLedgerEntries, getOverdueInvoices, getCustomerBalanceReconciliation } from '../api/ledger';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  PlusIcon, 
  BanknotesIcon, 
  XMarkIcon, 
  DocumentArrowUpIcon, 
  UsersIcon, 
  BuildingOfficeIcon,
  BookOpenIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { getCurrencySymbol } from '../utils/currency';

const Ledger = () => {
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'vendors' | 'general'

  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');

  // Vendor state
  const [selectedVendor, setSelectedVendor] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [selectedVendorName, setSelectedVendorName] = useState('');

  // Fetch customers
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });
  const customers = Array.isArray(customersData) ? customersData : customersData?.results || [];
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );
  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

  // Fetch vendors
  const { data: vendorsData } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => getVendors(),
  });
  const vendors = Array.isArray(vendorsData) ? vendorsData : vendorsData?.results || [];
  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(vendorSearch.toLowerCase())
  );
  const selectedVendorData = vendors.find(v => v.id === selectedVendor);

  const { data: overdueData, isLoading: isOverdueLoading } = useQuery({
    queryKey: ['overdueInvoices', selectedCustomer],
    queryFn: () => getOverdueInvoices({ customer: selectedCustomer || undefined }),
    enabled: activeTab === 'customers',
  });

  const { data: reconciliationData, isLoading: isReconciliationLoading } = useQuery({
    queryKey: ['customerBalanceReconciliation', selectedCustomer],
    queryFn: () => getCustomerBalanceReconciliation({ customer: selectedCustomer || undefined }),
    enabled: activeTab === 'customers',
  });

  const overdueInvoices = overdueData?.results || [];
  const reconciliationRows = reconciliationData?.results || [];
  const topMismatches = reconciliationRows
    .filter((row) => Math.abs(parseFloat(row.difference || 0)) >= 0.01)
    .slice(0, 5);

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

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setSelectedEntry(null);
  };

  const handleDeleteEntry = (entry) => {
    setSelectedEntry(entry);
    setShowDeleteDialog(true);
  };

  const handleDeleteSuccess = () => {
    setShowDeleteDialog(false);
    setSelectedEntry(null);
  };

  const handleBulkSelect = (entryIds) => {
    setSelectedEntries(entryIds);
  };

  const clearSelection = () => {
    setSelectedEntries([]);
  };

  return (
    <>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
             <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1 flex items-center gap-3">
                <BanknotesIcon className="w-8 h-8 text-[var(--accent-primary)]" />
                Ledger & Sub-Accounts
             </h1>
             <p className="text-[var(--text-secondary)] text-sm">Real-time double-entry sub-ledgers, debtor & creditor accounts, and running statements.</p>
           </div>
           
           <div className="flex flex-wrap gap-3">
             <Link to="/ledger/manual-journal"
               className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
             >
               <PlusIcon className="h-4 w-4" />
               <span>Manual Journal Entry</span>
             </Link>
             <Link to="/payments"
               className="btn-primary text-sm py-2 px-4 flex items-center gap-2 shadow-lg"
             >
               <PlusIcon className="h-4 w-4" />
               <span>Record Payment</span>
             </Link>
           </div>
        </div>

        {/* 3-Way Sub-Ledger Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] pb-4">
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === 'customers'
                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-transparent'
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            <span>Customers (Debtors)</span>
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === 'vendors'
                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-transparent'
            }`}
          >
            <BuildingOfficeIcon className="w-4 h-4" />
            <span>Vendors (Creditors)</span>
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === 'general'
                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-transparent'
            }`}
          >
            <BookOpenIcon className="w-4 h-4" />
            <span>Chart of Accounts</span>
          </button>
        </div>

        {/* Dynamic Partner Selector */}
        {activeTab === 'customers' && (
          <div className="bento-card !p-4 !overflow-visible relative z-30 flex flex-col md:flex-row items-start md:items-center gap-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 shrink-0">
              <UsersIcon className="w-5 h-5 text-[var(--accent-primary)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Filter by Customer:</span>
            </div>
            <div className="relative flex-1 w-full md:max-w-sm">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] z-10" />
              <input
                type="text"
                placeholder="Search customer..."
                value={selectedCustomerName || customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setSelectedCustomer('');
                  setSelectedCustomerName('');
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
              />
              {showCustomerDropdown && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowCustomerDropdown(false)} 
                />
              )}
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                  {filteredCustomers.slice(0, 20).map(c => (
                    <div
                      key={c.id}
                      className="px-4 py-2.5 cursor-pointer text-sm hover:bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] last:border-0 transition-colors"
                      onClick={() => {
                        setSelectedCustomer(c.id);
                        setSelectedCustomerName(c.name);
                        setCustomerSearch('');
                        setShowCustomerDropdown(false);
                      }}
                    >
                      <span className="text-[var(--text-primary)] font-medium">{c.name}</span>
                      {c.current_balance > 0 && (
                        <span className="ml-2 text-[var(--status-warning)] text-xs font-semibold">({getCurrencySymbol()}{parseFloat(c.current_balance).toLocaleString('en-IN')} due)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedCustomer && (
              <button
                onClick={() => { setSelectedCustomer(''); setSelectedCustomerName(''); setCustomerSearch(''); }}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)]"
              >
                Clear Filter
              </button>
            )}
            {selectedCustomerData?.current_balance > 0 && (
              <div className="ml-auto flex items-center gap-2 bg-[var(--status-warning)]/15 border border-[var(--status-warning)]/30 rounded-xl px-4 py-2">
                <span className="text-xs text-[var(--status-warning)] font-medium">Outstanding Receivable:</span>
                <span className="text-[var(--status-warning)] font-bold text-lg">{getCurrencySymbol()}{parseFloat(selectedCustomerData.current_balance).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="bento-card !p-4 !overflow-visible relative z-30 flex flex-col md:flex-row items-start md:items-center gap-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 shrink-0">
              <BuildingOfficeIcon className="w-5 h-5 text-[var(--accent-primary)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Filter by Vendor:</span>
            </div>
            <div className="relative flex-1 w-full md:max-w-sm">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] z-10" />
              <input
                type="text"
                placeholder="Search vendor / supplier..."
                value={selectedVendorName || vendorSearch}
                onChange={(e) => {
                  setVendorSearch(e.target.value);
                  setSelectedVendor('');
                  setSelectedVendorName('');
                  setShowVendorDropdown(true);
                }}
                onFocus={() => setShowVendorDropdown(true)}
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
              />
              {showVendorDropdown && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowVendorDropdown(false)} 
                />
              )}
              {showVendorDropdown && filteredVendors.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                  {filteredVendors.slice(0, 20).map(v => (
                    <div
                      key={v.id}
                      className="px-4 py-2.5 cursor-pointer text-sm hover:bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] last:border-0 transition-colors"
                      onClick={() => {
                        setSelectedVendor(v.id);
                        setSelectedVendorName(v.name);
                        setVendorSearch('');
                        setShowVendorDropdown(false);
                      }}
                    >
                      <span className="text-[var(--text-primary)] font-medium">{v.name}</span>
                      {v.gstin && (
                        <span className="ml-2 text-[var(--text-muted)] text-xs">({v.gstin})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedVendor && (
              <button
                onClick={() => { setSelectedVendor(''); setSelectedVendorName(''); setVendorSearch(''); }}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)]"
              >
                Clear Filter
              </button>
            )}
            {selectedVendorData?.outstanding_balance > 0 && (
              <div className="ml-auto flex items-center gap-2 bg-[var(--status-warning)]/15 border border-[var(--status-warning)]/30 rounded-xl px-4 py-2">
                <span className="text-xs text-[var(--status-warning)] font-medium">Outstanding Payable:</span>
                <span className="text-[var(--status-warning)] font-bold text-lg">{getCurrencySymbol()}{parseFloat(selectedVendorData.outstanding_balance).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        )}

        {/* Customer Specific Summary & Reconciliations */}
        {activeTab === 'customers' && (
          <>
            <LedgerSummary customerFilter={selectedCustomer} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bento-card !p-0 overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Overdue Invoices</h2>
                  <span className="text-xs text-[var(--status-warning)] font-semibold">{overdueData?.count || 0} items</span>
                </div>
                <div className="p-4 space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
                  {isOverdueLoading ? (
                    <p className="text-sm text-[var(--text-muted)]">Loading overdue invoices...</p>
                  ) : overdueInvoices.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">No overdue invoices found for current filters.</p>
                  ) : (
                    overdueInvoices.slice(0, 8).map((invoice) => (
                      <div key={invoice.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{invoice.invoice_number}</p>
                            <p className="text-xs text-[var(--text-secondary)]">{invoice.customer_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[var(--status-warning)]">{getCurrencySymbol()}{parseFloat(invoice.outstanding_amount || 0).toLocaleString('en-IN')}</p>
                            <p className="text-xs text-[var(--text-muted)]">{invoice.days_overdue} days overdue</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bento-card !p-0 overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Balance Reconciliation</h2>
                  <span className="text-xs text-[var(--accent-primary)] font-semibold">Top mismatches</span>
                </div>
                <div className="p-4 space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
                  {isReconciliationLoading ? (
                    <p className="text-sm text-[var(--text-muted)]">Loading reconciliation gaps...</p>
                  ) : topMismatches.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">No balance mismatch found. Customer balances match invoice outstanding.</p>
                  ) : (
                    topMismatches.map((row) => (
                      <div key={row.customer_id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{row.customer_name}</p>
                          <p className={`text-sm font-semibold ${parseFloat(row.difference) < 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'}`}>
                            {getCurrencySymbol()}{Math.abs(parseFloat(row.difference || 0)).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          {parseFloat(row.difference) < 0
                            ? 'Unmapped outstanding on customer balance'
                            : 'Likely unapplied credits from unlinked payments'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Ledger Table Container */}
        <div className="bento-card !p-0 overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
               {activeTab === 'customers' ? 'Customer Account Statement' : (activeTab === 'vendors' ? 'Vendor Account Statement' : 'General Ledger Entries')}
            </h2>
            <div className="text-xs text-[var(--text-muted)]">
              {activeTab === 'customers' && (selectedCustomerName ? `Viewing: ${selectedCustomerName}` : 'All Customers')}
              {activeTab === 'vendors' && (selectedVendorName ? `Viewing: ${selectedVendorName}` : 'All Vendors')}
              {activeTab === 'general' && 'All Chart of Accounts'}
            </div>
          </div>
          <LedgerTable
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            selectedEntries={selectedEntries}
            onBulkSelect={handleBulkSelect}
            customerFilter={activeTab === 'customers' ? selectedCustomer : ''}
            vendorFilter={activeTab === 'vendors' ? selectedVendor : ''}
            activeTab={activeTab}
            selectedPartnerName={activeTab === 'customers' ? selectedCustomerName : (activeTab === 'vendors' ? selectedVendorName : '')}
          />
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPaymentForm(false)}></div>
          
          <div className="relative w-full max-w-lg rounded-2xl shadow-2xl animate-fade-up bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
             <div className="flex justify-between items-center p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Record Payment</h3>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
             </div>
             <div className="p-6">
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => {setShowEditForm(false); setSelectedEntry(null);}}></div>
          
          <div className="relative w-full max-w-lg rounded-2xl shadow-2xl animate-fade-up bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
             <div className="flex justify-between items-center p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Edit Ledger Entry</h3>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setSelectedEntry(null);
                  }}
                  className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
             </div>
             <div className="p-6">
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

      
    </>
  );
};

export default Ledger;