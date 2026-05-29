import React, { useState } from "react";
import DeliveryChallanTable from "../components/sales/DeliveryChallanTable";
import DeliveryChallanForm from "../components/sales/DeliveryChallanForm";
import { PlusIcon } from '@heroicons/react/24/outline';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DeliveryChallanList() {
  const [showForm, setShowForm] = useState(false);
  const [editChallan, setEditChallan] = useState(null);

  const handleEdit = (challan) => {
    setEditChallan(challan);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditChallan(null);
  };

  return (
    <>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Delivery Challans</h1>
            <p className="text-gray-400 text-sm">Manage delivery notes and challans.</p>
          </div>
          <div className="flex gap-3">
             <button
               onClick={() => setShowForm(true)}
               className="btn-primary text-sm py-2 px-4 shadow-lg shadow-blue-500/20 flex items-center gap-2"
             >
               <PlusIcon className="w-4 h-4"/> New Challan
             </button>
          </div>
        </div>

        {/* Challans Table */}
        <div className="bento-card p-6">
          <DeliveryChallanTable
            onEdit={handleEdit}
            onView={(challan) => console.log("View", challan)}
            onDelete={(challan) => console.log("Delete", challan)} 
          />
        </div>

      </div>

      {/* Modals */}
      {showForm && (
        <DeliveryChallanForm 
          isOpen={showForm} 
          onClose={handleCloseForm}
          editData={editChallan}
        />
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="dark" />
    </>
  );
}
