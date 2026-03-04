import React, { useState } from "react";
import Layout from "../../components/Layout";
import { useQuery } from "@tanstack/react-query";
import { getBOMs } from "../../api/bom";
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import BOMForm from "../../components/inventory/BOMForm";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function BOMList() {
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  
  const { data: bomsResult, isLoading } = useQuery({ 
      queryKey: ["boms"], 
      queryFn: () => getBOMs() 
  });
  
  const boms = Array.isArray(bomsResult) ? bomsResult : bomsResult?.data || bomsResult?.results || [];

  const handleEdit = (bom) => {
    setEditData(bom);
    setShowForm(true);
  };

  const handClose = () => {
    setShowForm(false);
    setEditData(null);
  }

  return (
    <Layout>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Bill of Materials</h1>
            <p className="text-gray-400 text-sm">Manage manufacturing recipes and formulas.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" /> New BOM
          </button>
        </div>

        <div className="bento-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase bg-white/5">
                  <th className="p-4 font-medium">BOM Name</th>
                  <th className="p-4 font-medium">Finished Good</th>
                  <th className="p-4 font-medium">Components</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : boms.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No BOMs found. Create one to get started.</td></tr>
                ) : (
                    boms.map((bom) => (
                    <tr key={bom.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4 text-white font-medium">{bom.name}</td>
                        <td className="p-4 text-gray-300">{bom.finished_good_display || bom.finished_good_name}</td>
                        <td className="p-4 text-gray-400 text-sm">
                            {bom.components?.length || 0} items
                        </td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${bom.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {bom.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(bom)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded">
                                <PencilSquareIcon className="w-4 h-4" />
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
      </div>

      {showForm && (
        <BOMForm isOpen={showForm} onClose={handClose} editData={editData} />
      )}
      
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="dark" />
    </Layout>
  );
}
