import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getVendors, deleteVendor } from "../../api/vendors";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

export default function VendorTable({ onEdit, onView, onDelete }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at"); // default: newest first
  const [page, setPage] = useState(1);
  const [selectedVendors, setSelectedVendors] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["vendors", search, ordering, page],
    queryFn: () => getVendors({ search, ordering, page }),
    keepPreviousData: true,
  });

  const vendors = data?.results || data || [];
  const totalCount = data?.count || vendors.length;
  const totalPages = data?.total_pages || Math.ceil(totalCount / 10);

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
      <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 shadow-lg rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/20 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 shadow-lg rounded-lg p-6">
        <div className="text-center text-red-300 font-bold drop-shadow-lg">
          Error loading vendors: {error.message}
        </div>
      </div>
    );
  }

  const isAllSelected = vendors.length > 0 && selectedVendors.size === vendors.length;
  const isIndeterminate = selectedVendors.size > 0 && selectedVendors.size < vendors.length;

  return (
        <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 shadow-lg rounded-lg">
      {/* Header with search and actions */}
      <div className="p-6 border-b border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h2 className="text-xl font-black text-white tracking-tight">
            Vendors <span className="text-indigo-400/50 text-sm font-normal ml-2 tracking-normal">({totalCount} total)</span>
          </h2>
          
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search vendors..."
                className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder-white/30 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            
            <select
              className="w-full sm:w-48 px-4 py-2.5 border border-white/10 rounded-xl bg-[#0a0a0a] text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all cursor-pointer"
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
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <span className="text-sm text-indigo-400 font-bold uppercase tracking-widest">
              {selectedVendors.size} Selected
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleBulkDelete}
                className="flex-1 sm:flex-none px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs rounded-lg border border-red-500/30 font-black uppercase tracking-widest transition-all"
              >
                Delete
              </button>
              <button
                onClick={exportToCSV}
                className="flex-1 sm:flex-none px-4 py-2 bg-green-500/20 hover:bg-green-500/40 text-green-400 text-xs rounded-lg border border-green-500/30 font-black uppercase tracking-widest transition-all"
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
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-[#7fd3f7]/10 to-[#b6e0f7]/10 backdrop-blur-10">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
              </th>
                            <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-wider drop-shadow-lg">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-wider drop-shadow-lg">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-wider drop-shadow-lg">
                GSTIN
              </th>
              <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-wider drop-shadow-lg">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-wider drop-shadow-lg">
                Credit Limit
              </th>
              <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-wider drop-shadow-lg">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-wider drop-shadow-lg">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="backdrop-filter backdrop-blur-10 bg-transparent divide-y divide-white/10">
            {vendors.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-white font-bold drop-shadow-lg">
                  No vendors found
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-white/10 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedVendors.has(vendor.id)}
                      onChange={(e) => handleVendorSelect(vendor.id, e.target.checked)}
                      className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10 backdrop-filter backdrop-blur-10"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-bold text-white drop-shadow-lg">
                        {vendor.name}
                      </div>
                      <div className="text-sm text-cyan-300 font-medium">
                        {vendor.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white font-medium drop-shadow-lg">
                      {vendor.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white font-medium drop-shadow-lg">
                      {vendor.gstin || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-cyan-300 font-medium drop-shadow-lg">
                      {vendor.meta?.party_category ? (
                        <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30 uppercase">
                          {vendor.meta.party_category}
                        </span>
                      ) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white font-medium drop-shadow-lg">
                      {vendor.meta?.credit_limit ? `${getCurrencySymbol()}${Number(vendor.meta.credit_limit).toLocaleString()}` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-cyan-300 font-medium drop-shadow-lg">
                      {format(new Date(vendor.created_at), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onView(vendor)}
                        className="text-blue-300 hover:text-blue-100 text-sm font-bold drop-shadow-lg transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onEdit(vendor)}
                        className="text-green-300 hover:text-green-100 text-sm font-bold drop-shadow-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(vendor)}
                        className="text-red-300 hover:text-red-100 text-sm font-bold drop-shadow-lg transition-colors"
                      >
                        Delete
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
            <div key={i} className="bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10 p-4 animate-pulse">
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-3/4"></div>
            </div>
          ))
        ) : (
          vendors.map((vendor) => (
            <div key={vendor.id} className="bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-300">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedVendors.has(vendor.id)}
                      onChange={(e) => handleVendorSelect(vendor.id, e.target.checked)}
                      className="rounded border-white/10 text-indigo-500 focus:ring-indigo-500 bg-white/5 w-5 h-5"
                    />
                  <div>
                    <div className="text-lg font-semibold text-white">
                      {vendor.name}
                    </div>
                    <div className="text-sm text-white/70">
                      {vendor.email || 'No email'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Phone:</span>
                  <span className="text-sm font-medium text-white">{vendor.phone || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-500">GSTIN:</span>
                  <span className="text-sm text-white font-mono">{vendor.gstin || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-500">Category:</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-400/20">{vendor.meta?.party_category || '-'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Credit Limit:</span>
                  <span className="text-sm text-white">
                    {vendor.meta?.credit_limit ? `${getCurrencySymbol()}${Number(vendor.meta.credit_limit).toLocaleString()}` : '-'}
                  </span>
                </div>

                {vendor.address && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-white/70">Address:</span>
                    <span className="text-sm text-white text-right max-w-[60%]">{vendor.address}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={() => onView(vendor)}
                  className="flex-1 px-4 py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all text-xs font-black uppercase tracking-widest"
                >
                  View
                </button>
                <button
                  onClick={() => onEdit(vendor)}
                  className="flex-1 px-4 py-2.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-all text-xs font-black uppercase tracking-widest"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(vendor)}
                  className="flex-1 px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all text-xs font-black uppercase tracking-widest"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}

        {/* No data message for mobile */}
        {!isLoading && vendors.length === 0 && (
          <div className="p-8 text-center text-white/80">
            <p>No vendors found.</p>
            <p className="text-sm mt-2">
              Click "Add Vendor" to create your first vendor.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages} ({totalCount} total vendors)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-white/20 rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed backdrop-filter backdrop-blur-10 bg-white/10 text-white font-bold transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-white/20 rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed backdrop-filter backdrop-blur-10 bg-white/10 text-white font-bold transition-colors"
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