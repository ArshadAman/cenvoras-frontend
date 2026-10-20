import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPriceLists, deletePriceList } from "../../api/inventory";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { PlusIcon, TrashIcon, PencilIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { format } from "date-fns";

export default function PriceListList() {
  const queryClient = useQueryClient();

  const { data: priceLists, isLoading } = useQuery({
    queryKey: ["priceLists"],
    queryFn: getPriceLists,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePriceList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceLists"] });
      toast.success("Price List deleted successfully");
    },
    onError: (err) => toast.error("Failed to delete price list"),
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this price list?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
             <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1 flex items-center gap-3">
                <BanknotesIcon className="w-8 h-8 text-[var(--accent-primary)]" />
                Price Lists
             </h1>
             <p className="text-[var(--text-muted)] text-sm">Manage custom pricing for different customer categories.</p>
           </div>
           
           <div>
             <Link
               to="/inventory/price-lists/new"
               className="btn-primary text-sm py-2 px-4 shadow-sm"
             >
               <PlusIcon className="h-4 w-4" />
               <span>New Price List</span>
             </Link>
           </div>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
             <p className="text-[var(--text-muted)] text-sm">Loading price lists...</p>
          ) : priceLists?.length === 0 ? (
             <p className="text-[var(--text-muted)] text-sm">No price lists found.</p>
          ) : (
            priceLists.map((list) => (
              <div key={list.id} className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 flex flex-col justify-between group hover:border-[var(--accent-primary)] transition-colors shadow-sm">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">{list.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${list.is_active ? 'bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success-border)]' : 'bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger-border)]'}`}>
                      {list.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">Category: <span className="text-[var(--text-primary)] font-semibold uppercase">{list.party_category || 'All'}</span></p>
                  <p className="text-xs text-[var(--text-muted)]">Created: {format(new Date(list.created_at), 'MMM dd, yyyy')}</p>
                </div>
                
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--border-subtle)]">
                  <Link
                    to={`/inventory/price-lists/${list.id}`}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-primary)] rounded-lg transition-colors"
                    title="Edit Price List"
                    aria-label="Edit Price List"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(list.id)}
                    className="p-2 text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)] rounded-lg transition-colors"
                    title="Delete Price List"
                    aria-label="Delete Price List"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
