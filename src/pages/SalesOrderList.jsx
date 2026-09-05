import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import SalesOrderTable from "../components/sales/SalesOrderTable";
import SalesOrderForm from "../components/sales/SalesOrderForm";
import { PlusIcon } from '@heroicons/react/24/outline';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { deleteSalesOrder } from "../api/sales_order";

export default function SalesOrderList() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: deleteSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
    },
  });

  const handleEdit = (order) => {
    setEditOrder(order);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditOrder(null);
  };

  const handleDelete = async (order) => {
    if (!window.confirm(`Delete sales order ${order.order_number}?`)) return;
    await deleteMutation.mutateAsync(order.id);
  };

  return (
    <>
      <div className="p-2 sm:p-6 md:p-10 space-y-8 animate-fade-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2 sm:px-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Sales Orders</h1>
            <p className="text-gray-400 text-sm">Manage customer orders before invoicing.</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
             <button
               onClick={() => setShowForm(true)}
               className="btn-primary text-sm py-2 px-4 shadow-lg shadow-purple-500/20 flex items-center gap-2 w-full sm:w-auto justify-center"
             >
               <PlusIcon className="w-4 h-4"/> New Order
             </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bento-card p-3 sm:p-6">
          <SalesOrderTable
            onEdit={handleEdit}
            onView={(order) => console.log("View", order)}
            onDelete={handleDelete}
          />
        </div>

      </div>

      {/* Modals */}
      {showForm && (
        <SalesOrderForm 
          isOpen={showForm} 
          onClose={handleCloseForm}
          editData={editOrder}
        />
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="dark" />
    </>
  );
}
