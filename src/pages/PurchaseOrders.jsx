import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { listPurchaseOrders, createPurchaseOrder, convertPurchaseOrder } from '../api/purchase_orders'

export default function PurchaseOrders() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: listPurchaseOrders,
  })
  const [creating, setCreating] = useState(false)

  const createMut = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchaseOrders'] })
  })

  const convertMut = useMutation({
    mutationFn: convertPurchaseOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchaseOrders'] })
  })

  const handleCreate = async () => {
    setCreating(true)
    try {
      await createMut.mutateAsync({ vendor: null, items: [] })
    } catch (err) {
      console.error('Failed to create PO:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleConvert = async (id) => {
    if (!window.confirm('Convert this Purchase Order to a Purchase Bill?')) return
    try {
      await convertMut.mutateAsync(id)
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
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Purchase Orders</h2>
          <div>
            <button onClick={handleCreate} className="btn btn-primary" disabled={creating || createMut.isPending}>
              {creating || createMut.isPending ? 'Creating...' : 'New Purchase Order'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-gray-400">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-gray-400">No purchase orders found. Create one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => (
                <tr key={po.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4">{po.po_number || 'N/A'}</td>
                  <td className="py-3 px-4">{po.vendor_name || 'Unknown'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      po.status === 'received' ? 'bg-green-500/20 text-green-400' :
                      po.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">₹{parseFloat(po.total_amount || 0).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <button 
                      onClick={() => handleConvert(po.id)} 
                      className="px-3 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-sm disabled:opacity-50"
                      disabled={po.status === 'received' || convertMut.isPending}
                    >
                      {convertMut.isPending ? 'Converting...' : 'Convert'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
