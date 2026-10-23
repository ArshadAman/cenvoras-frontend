import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCustomers, deleteCustomer } from "../../api/customers";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import { EyeIcon, PencilSquareIcon, TrashIcon, ArrowTopRightOnSquareIcon, UsersIcon } from "@heroicons/react/24/outline";
import EmptyState from "../common/EmptyState";

export default function CustomerTable({ onEdit, onView, onDelete, onAddNewCustomer }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at"); // default: newest first
  const [page, setPage] = useState(1);
  const [selectedCustomers, setSelectedCustomers] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["customers", debouncedSearch, ordering, page],
    queryFn: () => getCustomers({ search: debouncedSearch, ordering, page }),
    keepPreviousData: true,
  });

  const customers = data?.results || data || [];
  const totalCount = data?.count || customers.length;
  const totalPages = data?.total_pages || Math.ceil(totalCount / 10);

  const handleSort = (field) => {
    setOrdering(prev => {
      if (prev === field) return `-${field}`;
      if (prev === `-${field}`) return field;
      return field;
    });
    setPage(1);
  };

  // Handle individual customer selection
  const handleCustomerSelect = (customerId, isSelected) => {
    const newSelected = new Set(selectedCustomers);
    if (isSelected) {
      newSelected.add(customerId);
    } else {
      newSelected.delete(customerId);
    }
    setSelectedCustomers(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  // Handle select all
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const allIds = new Set(customers.map(customer => customer.id));
      setSelectedCustomers(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedCustomers(new Set());
      setShowBulkActions(false);
    }
  };

  // Bulk delete functionality
  const handleBulkDelete = async () => {
    if (selectedCustomers.size === 0) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedCustomers.size} customers?`);
    if (confirmed) {
      try {
        const deletePromises = Array.from(selectedCustomers).map(customerId => 
          deleteCustomer(customerId)
        );
        
        await Promise.all(deletePromises);
        
        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        
        toast.success(`Successfully deleted ${selectedCustomers.size} customers!`);
        setSelectedCustomers(new Set());
        setShowBulkActions(false);
      } catch (error) {
        console.error('Bulk delete error:', error);
        toast.error('Error deleting some customers. Please try again.');
      }
    }
  };

  // Export functions
  const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

  const exportToCSV = () => {
    const selectedData = customers.filter(customer => selectedCustomers.has(customer.id));
    const csvContent = [
      ['Name', 'Email', 'Phone', 'GSTIN', 'Address', 'Created At'],
      ...selectedData.map(customer => [
        customer.name,
        customer.email || '',
        customer.phone || '',
        customer.gstin || '',
        customer.address || '',
        format(new Date(customer.created_at), 'yyyy-MM-dd HH:mm')
      ])
    ].map(row => row.map(csvEscape).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[var(--border-subtle)] rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-[var(--border-subtle)]/60 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-6 text-center text-[var(--status-danger)] font-semibold">
        Error loading customers: {error.message}
      </div>
    );
  }

  const isAllSelected = customers.length > 0 && selectedCustomers.size === customers.length;
  const isIndeterminate = selectedCustomers.size > 0 && selectedCustomers.size < customers.length;

  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-sm overflow-hidden">
      {/* Header with search and actions */}
      <div className="p-6 border-b border-[var(--border-subtle)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Customers <span className="text-[var(--text-muted)] text-sm font-normal ml-2 tracking-normal">({totalCount} total)</span>
          </h2>
          
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search customers..."
                className="w-full px-4 py-2.5 border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--border-focus)]/50 focus:border-[var(--border-focus)] outline-none transition-all"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            
            <select
              className="w-full sm:w-48 px-4 py-2.5 border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--border-focus)]/50 focus:border-[var(--border-focus)] outline-none transition-all cursor-pointer"
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
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 p-4 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xl">
            <span className="text-sm text-[var(--accent-primary)] font-bold uppercase tracking-wider">
              {selectedCustomers.size} Selected
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleBulkDelete}
                className="flex-1 sm:flex-none px-4 py-2 bg-[var(--status-danger-bg)] hover:opacity-90 text-[var(--status-danger)] text-xs rounded-xl border border-[var(--status-danger-border)] font-bold uppercase tracking-wider transition-all"
              >
                Delete
              </button>
              <button
                onClick={exportToCSV}
                className="flex-1 sm:flex-none px-4 py-2 bg-[var(--status-success-bg)] hover:opacity-90 text-[var(--status-success)] text-xs rounded-xl border border-[var(--status-success-border)] font-bold uppercase tracking-wider transition-all"
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
          <table className="min-w-full divide-y divide-[var(--border-subtle)]">
          <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
            <tr>
              <th className="px-6 py-3.5 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-[var(--border-default)] text-[var(--accent-primary)] focus:ring-[var(--border-focus)] bg-transparent"
                />
              </th>
              <th 
                onClick={() => handleSort("name")}
                className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Name</span>
                  {(ordering === "name" || ordering === "-name") && (
                    <span className="text-[var(--accent-primary)] font-bold">{ordering === "name" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort("email")}
                className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Contact</span>
                  {(ordering === "email" || ordering === "-email") && (
                    <span className="text-[var(--accent-primary)] font-bold">{ordering === "email" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort("gstin")}
                className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>GSTIN</span>
                  {(ordering === "gstin" || ordering === "-gstin") && (
                    <span className="text-[var(--accent-primary)] font-bold">{ordering === "gstin" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Credit Limit
              </th>
              <th 
                onClick={() => handleSort("created_at")}
                className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Created</span>
                  {(ordering === "created_at" || ordering === "-created_at") && (
                    <span className="text-[var(--accent-primary)] font-bold">{ordering === "created_at" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {customers.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-6 sm:p-10">
                  <EmptyState
                    icon={UsersIcon}
                    title={debouncedSearch ? "No matching customers found" : "No customers registered yet"}
                    description={
                      debouncedSearch
                        ? `No customer matched "${debouncedSearch}". Check your spelling or clear the search filter.`
                        : "Add your first customer to start tracking billing history, GST compliance, and balances."
                    }
                    action={onAddNewCustomer ? { label: "Add Customer", onClick: onAddNewCustomer } : null}
                    secondaryAction={debouncedSearch ? { label: "Clear Search", onClick: () => setSearch("") } : null}
                  />
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(customer.id)}
                      onChange={(e) => handleCustomerSelect(customer.id, e.target.checked)}
                      className="rounded border-[var(--border-default)] text-[var(--accent-primary)] focus:ring-[var(--border-focus)] bg-transparent"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => onView(customer)}
                        className="text-left text-sm font-semibold text-[var(--accent-primary)] hover:underline transition-colors cursor-pointer inline-flex items-center gap-1.5 group"
                        title="View Detailed Ledger & Invoices"
                      >
                        <span>{customer.name}</span>
                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </button>
                      <div className="text-sm text-[var(--text-muted)]">
                        {customer.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[var(--text-primary)] font-medium">
                      {customer.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[var(--text-secondary)] font-mono">
                      {customer.gstin || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {customer.meta?.party_category ? (
                        <span className="badge-info text-xs font-semibold">
                          {customer.meta.party_category}
                        </span>
                      ) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[var(--text-primary)] font-mono font-medium">
                      {customer.meta?.credit_limit ? `${getCurrencySymbol()}${Number(customer.meta.credit_limit).toLocaleString()}` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[var(--text-muted)] font-medium">
                      {customer.created_at ? format(new Date(customer.created_at), 'dd/MM/yyyy') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onView(customer)}
                        title="View Customer Details & Ledger"
                        aria-label="View Customer Details & Ledger"
                        className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--accent-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-surface)] transition-all"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(customer)}
                        title="Edit Customer"
                        aria-label="Edit Customer"
                        className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--status-success)] border border-[var(--border-default)] hover:bg-[var(--bg-surface)] transition-all"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(customer)}
                        title="Delete Customer"
                        aria-label="Delete Customer"
                        className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--status-danger)] border border-[var(--border-default)] hover:bg-[var(--bg-surface)] transition-all"
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
          customers.map((customer) => (
            <div key={customer.id} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] p-4 hover:border-[var(--border-default)] transition-all">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.has(customer.id)}
                    onChange={(e) => handleCustomerSelect(customer.id, e.target.checked)}
                    className="rounded border-[var(--border-default)] text-[var(--accent-primary)] focus:ring-[var(--border-focus)] bg-[var(--bg-surface)] w-5 h-5 cursor-pointer"
                  />
                  <div>
                    <button
                      type="button"
                      onClick={() => onView(customer)}
                      className="text-left text-base font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors inline-flex items-center gap-1.5 group cursor-pointer"
                      title="View Detailed Ledger & Invoices"
                    >
                      <span>{customer.name}</span>
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-all" />
                    </button>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {customer.email || 'No email'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Phone:</span>
                  <span className="font-medium text-[var(--text-primary)]">{customer.phone || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">GSTIN:</span>
                  <span className="text-sm text-[var(--text-primary)] font-mono">{customer.gstin || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Category:</span>
                  <span className="text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
                    {customer.meta?.party_category || '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Credit Limit:</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {customer.meta?.credit_limit ? `${getCurrencySymbol()}${Number(customer.meta.credit_limit).toLocaleString()}` : '-'}
                  </span>
                </div>

                {customer.address && (
                  <div className="flex justify-between items-start">
                    <span className="text-[var(--text-muted)]">Address:</span>
                    <span className="text-[var(--text-secondary)] text-right max-w-[60%] line-clamp-2">{customer.address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => onView(customer)}
                  title="View Customer Details & Ledger"
                  aria-label="View Customer Details & Ledger"
                  className="p-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(customer)}
                  title="Edit Customer"
                  aria-label="Edit Customer"
                  className="p-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(customer)}
                  title="Delete Customer"
                  aria-label="Delete Customer"
                  className="p-2 rounded-lg bg-[var(--bg-surface)] text-[var(--status-danger)] border border-[var(--border-default)] hover:bg-[var(--status-danger-bg)] transition-all cursor-pointer"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* No data message for mobile */}
        {!isLoading && customers.length === 0 && (
          <EmptyState
            icon={UsersIcon}
            title={debouncedSearch ? "No matching customers" : "No customers registered yet"}
            description={
              debouncedSearch
                ? `No customer matched "${debouncedSearch}".`
                : "Add your first customer to start tracking billing history, GST compliance, and balances."
            }
            action={onAddNewCustomer ? { label: "Add Customer", onClick: onAddNewCustomer } : null}
            secondaryAction={debouncedSearch ? { label: "Clear Search", onClick: () => setSearch("") } : null}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/40">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-[var(--text-muted)]">
              Page {page} of {totalPages} ({totalCount} total customers)
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