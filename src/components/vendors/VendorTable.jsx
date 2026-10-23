import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getVendors, deleteVendor } from "../../api/vendors";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import { EyeIcon, PencilSquareIcon, TrashIcon, ArrowTopRightOnSquareIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline";
import EmptyState from "../common/EmptyState";
import useResizableColumns from "../../hooks/useResizableColumns";
import { LIST_THEAD, LIST_TH, LIST_TH_SORTABLE, LIST_TH_LABEL } from "../common/tableHeaderClasses";

const DEFAULT_COLUMN_WIDTHS = {
  checkbox: 44,
  name: 180,
  contact: 180,
  gstin: 140,
  category: 110,
  credit_limit: 130,
  created: 110,
  actions: 145,
};

export default function VendorTable({ onEdit, onView, onDelete, onAddNewVendor }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at"); // default: newest first
  const [page, setPage] = useState(1);
  const [selectedVendors, setSelectedVendors] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const { colWidths, renderResizeHandle } = useResizableColumns(
    "cenvoras_vendor_table_col_widths",
    DEFAULT_COLUMN_WIDTHS
  );

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["vendors", debouncedSearch, ordering, page],
    queryFn: () => getVendors({ search: debouncedSearch, ordering, page }),
    keepPreviousData: true,
  });

  const vendors = data?.results || data || [];
  const totalCount = data?.count || vendors.length;
  const totalPages = data?.total_pages || Math.ceil(totalCount / 10);

  const handleSort = (field) => {
    setOrdering(prev => {
      if (prev === field) return `-${field}`;
      if (prev === `-${field}`) return field;
      return field;
    });
    setPage(1);
  };

  // Handle individual vendor selection
  const handleVendorSelect = (vendorId, isSelected) => {
    const newSelected = new Set(selectedVendors);
    if (isSelected) {
      newSelected.add(vendorId);
    } else {
      newSelected.delete(vendorId);
    }
    setSelectedVendors(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  // Handle select all
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const allIds = new Set(vendors.map(vendor => vendor.id));
      setSelectedVendors(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedVendors(new Set());
      setShowBulkActions(false);
    }
  };

  // Bulk delete functionality
  const handleBulkDelete = async () => {
    if (selectedVendors.size === 0) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedVendors.size} vendors?`);
    if (confirmed) {
      try {
        const deletePromises = Array.from(selectedVendors).map(vendorId => 
          deleteVendor(vendorId)
        );
        
        await Promise.all(deletePromises);
        
        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ["vendors"] });
        
        toast.success(`Successfully deleted ${selectedVendors.size} vendors!`);
        setSelectedVendors(new Set());
        setShowBulkActions(false);
      } catch (error) {
        console.error('Bulk delete error:', error);
        toast.error('Error deleting some vendors. Please try again.');
      }
    }
  };

  // Export functions
  const exportToCSV = () => {
    const selectedData = vendors.filter(vendor => selectedVendors.has(vendor.id));
    const csvContent = [
      ['Name', 'Email', 'Phone', 'GSTIN', 'Address', 'Created At'],
      ...selectedData.map(vendor => [
        vendor.name,
        vendor.email || '',
        vendor.phone || '',
        vendor.gstin || '',
        vendor.address || '',
        format(new Date(vendor.created_at), 'yyyy-MM-dd HH:mm')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendors_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-[var(--bg-primary)] rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-[var(--bg-primary)] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--status-danger-border)] shadow-sm rounded-xl p-6">
        <div className="text-center text-[var(--status-danger)] font-semibold">
          Error loading vendors: {error.message}
        </div>
      </div>
    );
  }

  const isAllSelected = vendors.length > 0 && selectedVendors.size === vendors.length;
  const isIndeterminate = selectedVendors.size > 0 && selectedVendors.size < vendors.length;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm rounded-xl overflow-hidden">
      {/* Header with search and actions */}
      <div className="p-6 border-b border-[var(--border-subtle)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Vendors <span className="text-[var(--text-muted)] text-sm font-normal ml-2">({totalCount} total)</span>
          </h2>
          
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search vendors..."
                className="w-full px-3.5 py-2 border border-[var(--border-default)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] outline-none text-sm transition-all"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            
            <select
              className="w-full sm:w-48 px-3.5 py-2 border border-[var(--border-default)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--border-focus)] outline-none text-sm transition-all cursor-pointer"
              value={ordering}
              onChange={(e) => {
                setOrdering(e.target.value);
                setPage(1);
              }}
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="name">Name A-Z</option>
              <option value="-name">Name Z-A</option>
              <option value="email">Email A-Z</option>
              <option value="-email">Email Z-A</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 p-3 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg">
            <span className="text-xs text-[var(--text-primary)] font-bold uppercase tracking-wider">
              {selectedVendors.size} Selected
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleBulkDelete}
                className="btn-danger text-xs px-3 py-1.5 cursor-pointer"
              >
                Delete
              </button>
              <button
                onClick={exportToCSV}
                className="btn-secondary text-xs px-3 py-1.5 cursor-pointer"
              >
                Export CSV
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table for desktop, Cards for mobile */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed divide-y divide-[var(--border-subtle)]">
          <colgroup>
            <col style={{ width: `${colWidths.checkbox}px` }} />
            <col style={{ width: `${colWidths.name}px` }} />
            <col style={{ width: `${colWidths.contact}px` }} />
            <col style={{ width: `${colWidths.gstin}px` }} />
            <col style={{ width: `${colWidths.category}px` }} />
            <col style={{ width: `${colWidths.credit_limit}px` }} />
            <col style={{ width: `${colWidths.created}px` }} />
            <col style={{ width: `${colWidths.actions}px` }} />
          </colgroup>
          <thead className={LIST_THEAD}>
            <tr>
              <th className={LIST_TH}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-[var(--border-default)] text-[var(--accent-primary)] focus:ring-[var(--border-focus)] bg-[var(--bg-surface)] cursor-pointer"
                />
                {renderResizeHandle("checkbox")}
              </th>
              <th
                onClick={() => handleSort("name")}
                className={LIST_TH_SORTABLE}
              >
                <div className={LIST_TH_LABEL}>
                  <span>Name</span>
                  {(ordering === "name" || ordering === "-name") && (
                    <span className="text-[var(--accent-primary)] font-bold">{ordering === "name" ? "↑" : "↓"}</span>
                  )}
                </div>
                {renderResizeHandle("name")}
              </th>
              <th
                onClick={() => handleSort("email")}
                className={LIST_TH_SORTABLE}
              >
                <div className={LIST_TH_LABEL}>
                  <span>Contact</span>
                  {(ordering === "email" || ordering === "-email") && (
                    <span className="text-[var(--accent-primary)] font-bold">{ordering === "email" ? "↑" : "↓"}</span>
                  )}
                </div>
                {renderResizeHandle("contact")}
              </th>
              <th
                onClick={() => handleSort("gstin")}
                className={LIST_TH_SORTABLE}
              >
                <div className={LIST_TH_LABEL}>
                  <span>GSTIN</span>
                  {(ordering === "gstin" || ordering === "-gstin") && (
                    <span className="text-[var(--accent-primary)] font-bold">{ordering === "gstin" ? "↑" : "↓"}</span>
                  )}
                </div>
                {renderResizeHandle("gstin")}
              </th>
              <th className={LIST_TH}>
                Category
                {renderResizeHandle("category")}
              </th>
              <th className={LIST_TH}>
                Credit Limit
                {renderResizeHandle("credit_limit")}
              </th>
              <th
                onClick={() => handleSort("created_at")}
                className={LIST_TH_SORTABLE}
              >
                <div className={LIST_TH_LABEL}>
                  <span>Created</span>
                  {(ordering === "created_at" || ordering === "-created_at") && (
                    <span className="text-[var(--accent-primary)] font-bold">{ordering === "created_at" ? "↑" : "↓"}</span>
                  )}
                </div>
                {renderResizeHandle("created")}
              </th>
              <th className={LIST_TH}>
                Actions
                {renderResizeHandle("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)]">
            {vendors.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-0">
                  <EmptyState
                    icon={BuildingStorefrontIcon}
                    title={search ? "No vendors match your search" : "No vendors registered yet"}
                    description={search ? `No vendor records matched "${search}". Try adjusting your keywords.` : "Keep your supplier relationships and purchase orders organized in one place."}
                    actionLabel={!search && onAddNewVendor ? "Add First Vendor" : undefined}
                    onAction={!search && onAddNewVendor ? onAddNewVendor : undefined}
                  />
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedVendors.has(vendor.id)}
                      onChange={(e) => handleVendorSelect(vendor.id, e.target.checked)}
                      className="rounded border-[var(--border-default)] text-[var(--accent-primary)] focus:ring-[var(--border-focus)] bg-[var(--bg-surface)] cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => onView(vendor)}
                        className="text-left text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] hover:underline transition-colors cursor-pointer inline-flex items-center gap-1.5 group"
                        title="View Detailed Ledger & Purchase Bills"
                      >
                        <span>{vendor.name}</span>
                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </button>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {vendor.email || '-'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[var(--text-primary)] font-medium">
                      {vendor.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[var(--text-primary)] font-mono">
                      {vendor.gstin || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[var(--text-secondary)] font-medium">
                      {vendor.meta?.party_category ? (
                        <span className="px-2 py-0.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] text-xs uppercase font-medium">
                          {vendor.meta.party_category}
                        </span>
                      ) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[var(--text-primary)] font-medium">
                      {vendor.meta?.credit_limit ? `${getCurrencySymbol()}${Number(vendor.meta.credit_limit).toLocaleString()}` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[var(--text-muted)] font-medium">
                      {vendor.created_at ? format(new Date(vendor.created_at), 'dd/MM/yyyy') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onView(vendor)}
                        title="View Vendor Details & Ledger"
                        aria-label="View Vendor Details & Ledger"
                        className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(vendor)}
                        title="Edit Vendor"
                        aria-label="Edit Vendor"
                        className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(vendor)}
                        title="Delete Vendor"
                        aria-label="Delete Vendor"
                        className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--status-danger)] border border-[var(--border-default)] hover:bg-[var(--status-danger-bg)] transition-all cursor-pointer"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4 p-2">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] p-4 animate-pulse space-y-3">
              <div className="h-4 bg-[var(--bg-surface)] rounded w-1/2"></div>
              <div className="h-3 bg-[var(--bg-surface)] rounded w-3/4"></div>
              <div className="h-3 bg-[var(--bg-surface)] rounded w-2/3"></div>
            </div>
          ))
        ) : (
          vendors.map((vendor) => (
            <div key={vendor.id} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] p-4 hover:border-[var(--border-default)] transition-all">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedVendors.has(vendor.id)}
                    onChange={(e) => handleVendorSelect(vendor.id, e.target.checked)}
                    className="rounded border-[var(--border-default)] text-[var(--accent-primary)] focus:ring-[var(--border-focus)] bg-[var(--bg-surface)] w-5 h-5 cursor-pointer"
                  />
                  <div>
                    <button
                      type="button"
                      onClick={() => onView(vendor)}
                      className="text-left text-base font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors inline-flex items-center gap-1.5 group cursor-pointer"
                      title="View Detailed Ledger & Purchase Bills"
                    >
                      <span>{vendor.name}</span>
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-all" />
                    </button>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {vendor.email || 'No email'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Phone:</span>
                  <span className="font-medium text-[var(--text-primary)]">{vendor.phone || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">GSTIN:</span>
                  <span className="text-sm text-[var(--text-primary)] font-mono">{vendor.gstin || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Category:</span>
                  <span className="text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
                    {vendor.meta?.party_category || '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Credit Limit:</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {vendor.meta?.credit_limit ? `${getCurrencySymbol()}${Number(vendor.meta.credit_limit).toLocaleString()}` : '-'}
                  </span>
                </div>

                {vendor.address && (
                  <div className="flex justify-between items-start">
                    <span className="text-[var(--text-muted)]">Address:</span>
                    <span className="text-[var(--text-secondary)] text-right max-w-[60%] line-clamp-2">{vendor.address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => onView(vendor)}
                  title="View Vendor Details & Ledger"
                  aria-label="View Vendor Details & Ledger"
                  className="p-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(vendor)}
                  title="Edit Vendor"
                  aria-label="Edit Vendor"
                  className="p-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(vendor)}
                  title="Delete Vendor"
                  aria-label="Delete Vendor"
                  className="p-2 rounded-lg bg-[var(--bg-surface)] text-[var(--status-danger)] border border-[var(--border-default)] hover:bg-[var(--status-danger-bg)] transition-all cursor-pointer"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* No data message for mobile */}
        {!isLoading && vendors.length === 0 && (
          <EmptyState
            icon={BuildingStorefrontIcon}
            title={search ? "No matching vendors" : "No vendors yet"}
            description={search ? `No results for "${search}".` : "Add suppliers to track purchases and payables."}
            actionLabel={!search && onAddNewVendor ? "Add Vendor" : undefined}
            onAction={!search && onAddNewVendor ? onAddNewVendor : undefined}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/40">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-[var(--text-muted)]">
              Page {page} of {totalPages} ({totalCount} total vendors)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}