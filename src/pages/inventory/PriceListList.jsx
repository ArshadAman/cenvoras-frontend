import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPriceLists, deletePriceList } from "../../api/inventory";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
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
    <Layout>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
             <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
                <BanknotesIcon className="w-8 h-8 text-green-400" />
                Price Lists
             </h1>
             <p className="text-gray-400 text-sm">Manage custom pricing for different customer categories.</p>
           </div>
           
           <div>
             <Link
               to="/inventory/price-lists/new"
               className="btn-primary text-sm py-2 px-4 shadow-lg shadow-green-500/20"
             >
               <PlusIcon className="h-4 w-4" />
               <span>New Price List</span>
             </Link>
           </div>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
             <p className="text-white">Loading...</p>
          ) : priceLists?.length === 0 ? (
             <p className="text-gray-400">No price lists found.</p>
          ) : (
            priceLists.map((list) => (
              <div key={list.id} className="bento-card p-6 flex flex-col justify-between group hover:border-green-500/50 transition-colors">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-green-300 transition-colors">{list.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${list.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {list.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">Category: <span className="text-white uppercase">{list.party_category || 'All'}</span></p>
                  <p className="text-xs text-gray-500">Created: {format(new Date(list.created_at), 'MMM dd, yyyy')}</p>
                </div>
                
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-white/10">
                  <Link
                    to={`/inventory/price-lists/${list.id}`}
                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(list.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
