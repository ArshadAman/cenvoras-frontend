import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCustomers, deleteCustomer } from "../../api/customers";
import { format } from "date-fns";
import { toast } from "react-toastify";

export default function CustomerTable({ onEdit, onView, onDelete }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at"); // default: newest first
  const [page, setPage] = useState(1);
  const [selectedCustomers, setSelectedCustomers] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["customers", search, ordering, page],
    queryFn: () => getCustomers({ search, ordering, page }),
    keepPreviousData: true,
  });

  const customers = data?.results || data || [];
  const totalCount = data?.count || customers.length;
  const totalPages = data?.total_pages || Math.ceil(totalCount / 10);

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
    ].map(row => row.join(',')).join('\n');

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
          Error loading customers: {error.message}
        </div>
      </div>
    );
  }

  const isAllSelected = customers.length > 0 && selectedCustomers.size === customers.length;
  const isIndeterminate = selectedCustomers.size > 0 && selectedCustomers.size < customers.length;

  return (
        <div className="backdrop-filter backdrop-blur-20 bg-white/5 border border-white/10 shadow-lg rounded-lg">
      {/* Header with search and actions */}
      <div className="p-6 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h2 className="text-lg font-bold text-white drop-shadow-lg">
            👥 Customers ({totalCount})
          </h2>
          
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search customers..."
              className="px-3 py-2 border border-white/30 rounded-md bg-white/10 backdrop-filter backdrop-blur-10 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            
            <select
              className="px-3 py-2 border border-white/30 rounded-md bg-white/10 backdrop-filter backdrop-blur-10 text-white focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
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
          <div className="mt-4 flex items-center gap-3 p-3 bg-cyan-500/20 backdrop-filter backdrop-blur-10 border border-cyan-300/30 rounded-md">
            <span className="text-sm text-cyan-300 font-bold drop-shadow-lg">
              {selectedCustomers.size} customer(s) selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-500/80 hover:bg-red-400/90 text-white text-sm rounded backdrop-filter backdrop-blur-10 border border-red-300/30 font-bold transition-colors"
            >
              Delete Selected
            </button>
            <button
              onClick={exportToCSV}
              className="px-3 py-1 bg-green-500/80 hover:bg-green-400/90 text-white text-sm rounded backdrop-filter backdrop-blur-10 border border-green-300/30 font-bold transition-colors"
            >
              Export Selected
            </button>
          </div>
        )}
      </div>

      {/* Table */}
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
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-wider drop-shadow-lg">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="backdrop-filter backdrop-blur-10 bg-transparent divide-y divide-white/10">
            {customers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-white font-bold drop-shadow-lg">
                  No customers found
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-white/10 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(customer.id)}
                      onChange={(e) => handleCustomerSelect(customer.id, e.target.checked)}
                      className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10 backdrop-filter backdrop-blur-10"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-bold text-white drop-shadow-lg">
                        {customer.name}
                      </div>
                      <div className="text-sm text-cyan-300 font-medium">
                        {customer.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white font-medium drop-shadow-lg">
                      {customer.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white font-medium drop-shadow-lg">
                      {customer.gstin || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-cyan-300 font-medium drop-shadow-lg">
                      {format(new Date(customer.created_at), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onView(customer)}
                        className="text-blue-300 hover:text-blue-100 text-sm font-bold drop-shadow-lg transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onEdit(customer)}
                        className="text-green-300 hover:text-green-100 text-sm font-bold drop-shadow-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(customer)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages} ({totalCount} total customers)
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