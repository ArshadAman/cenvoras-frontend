import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listPurchaseOrders, deletePurchaseOrder, convertPurchaseOrder } from '../api/purchase_orders'
import PurchaseOrderTable from '../components/purchase/PurchaseOrderTable'
import PurchaseOrderForm from '../components/purchase/PurchaseOrderForm'
import Button from '../components/common/Button'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { PlusIcon } from '@heroicons/react/24/outline'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function PurchaseOrders() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editOrder, setEditOrder] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [convertTarget, setConvertTarget] = useState(null)

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

  const handleDelete = (order) => {
    setDeleteTarget(order)
  }

  const handleConvert = (order) => {
    setConvertTarget(order)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete PO:', err)
    }
  }

  const confirmConvert = async () => {
    if (!convertTarget) return
    try {
      await convertMut.mutateAsync(convertTarget.id)
      setConvertTarget(null)
    } catch (err) {
      console.error('Failed to convert PO:', err)
    }
  }

  if (error) {
    return (
      <>
        <div className="p-6">
          <div className="rounded-xl bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30 p-4">
            <h3 className="text-[var(--status-danger)] font-semibold">Error loading purchase orders</h3>
            <p className="text-[var(--status-danger)]/80 text-sm mt-1">{error?.message || 'Unknown error'}</p>
          </div>
        </div>
      </>
    )
  }

  const orders = data?.data || []

  return (
    <>
      <div className="p-4 md:p-6 space-y-5 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-0.5">Purchase Orders</h1>
            <p className="text-[var(--text-muted)] text-xs">Manage vendor orders before they arrive.</p>
          </div>
          <div className="flex gap-2.5">
             <Button
               variant="primary"
               onClick={() => setShowForm(true)}
               icon={PlusIcon}
               size="sm"
             >
               New Purchase Order
             </Button>
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Purchase Order?"
        description={deleteTarget ? `Permanently remove purchase order ${deleteTarget.po_number}. This action cannot be undone.` : ''}
        confirmLabel="Delete Order"
        variant="destructive"
        isPending={deleteMut.isPending}
      />

      <ConfirmDialog
        isOpen={!!convertTarget}
        onClose={() => setConvertTarget(null)}
        onConfirm={confirmConvert}
        title="Convert to Purchase Bill?"
        description={convertTarget ? `Create a Purchase Bill from ${convertTarget.po_number}. Line items, taxes, and vendor details will be carried over.` : ''}
        confirmLabel="Convert to Bill"
        variant="info"
        isPending={convertMut.isPending}
      />
    </>
  )
}
