import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { listPurchaseOrders, deletePurchaseOrder, convertPurchaseOrder } from '../api/purchase_orders'
import PurchaseOrderTable from '../components/purchase/PurchaseOrderTable'
import PurchaseOrderForm from '../components/purchase/PurchaseOrderForm'
import { PlusIcon } from '@heroicons/react/24/outline'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function PurchaseOrders() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editOrder, setEditOrder] = useState(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: listPurchaseOrders,
  })

  const convertMut = useMutation({
    mutationFn: convertPurchaseOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchaseOrders'] })
      toast.success("Purchase order converted to bill successfully!")
    },
    onError: (err) => {
      toast.error(err.message || "Failed to convert purchase order")
    }
  })

  const deleteMut = useMutation({
    mutationFn: deletePurchaseOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchaseOrders'] })
      toast.success("Purchase order deleted successfully!")
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete purchase order")
    }
  })

  const handleEdit = (order) => {
    setEditOrder(order)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditOrder(null)
  }

  const handleDelete = async (order) => {
    if (!window.confirm(`Are you sure you want to delete purchase order ${order.po_number}?`)) return
    try {
      await deleteMut.mutateAsync(order.id)
    } catch (err) {
      console.error('Failed to delete PO:', err)
    }
  }

  const handleConvert = async (order) => {
    if (!window.confirm(`Convert Purchase Order ${order.po_number} to a Purchase Bill?`)) return
    try {
      await convertMut.mutateAsync(order.id)
    } catch (err) {
      console.error('Failed to convert PO:', err)
    }
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4">
            <h3 className="text-red-400 font-semibold">Error loading purchase orders</h3>
            <p className="text-red-300 text-sm mt-1">{error?.message || 'Unknown error'}</p>
          </div>
        </div>
      </Layout>
    )
  }

  const orders = data?.data || []

  return (
    <Layout>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Purchase Orders</h1>
            <p className="text-gray-400 text-sm">Manage vendor orders before they arrive.</p>
          </div>
          <div className="flex gap-3">
             <button
               onClick={() => setShowForm(true)}
               className="btn-primary text-sm py-2 px-4 shadow-lg shadow-cyan-500/20 flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-black border-none"
             >
               <PlusIcon className="w-4 h-4"/> New Purchase Order
             </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bento-card p-6">
          <PurchaseOrderTable
            orders={orders}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onConvert={handleConvert}
          />
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <PurchaseOrderForm 
          isOpen={showForm} 
          onClose={handleCloseForm}
          editData={editOrder}
        />
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="dark" />
    </Layout>
  )
}
