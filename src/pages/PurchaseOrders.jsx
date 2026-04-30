import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { listPurchaseOrders, createPurchaseOrder, convertPurchaseOrder } from '../api/purchase_orders'

export default function PurchaseOrders() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery(['purchaseOrders'], listPurchaseOrders)
  const [creating, setCreating] = useState(false)

  const createMut = useMutation(createPurchaseOrder, {
    onSuccess: () => qc.invalidateQueries(['purchaseOrders'])
  })

  const convertMut = useMutation(convertPurchaseOrder, {
    onSuccess: () => qc.invalidateQueries(['purchaseOrders'])
  })

  const handleCreate = async () => {
    setCreating(true)
    try {
      await createMut.mutateAsync({ vendor_name: 'Unknown Vendor', items: [] })
    } finally {
      setCreating(false)
    }
  }

  const handleConvert = async (id) => {
    if (!window.confirm('Convert this Purchase Order to a Purchase Bill?')) return
    await convertMut.mutateAsync(id)
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Purchase Orders</h2>
          <div>
            <button onClick={handleCreate} className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'New Purchase Order'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="py-2">PO ID</th>
                <th className="py-2">Vendor</th>
                <th className="py-2">Status</th>
                <th className="py-2">Total</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((po) => (
                <tr key={po.id} className="border-t border-white/5">
                  <td className="py-3">{po.id}</td>
                  <td className="py-3">{po.vendor_name}</td>
                  <td className="py-3">{po.status}</td>
                  <td className="py-3">{po.total_amount ?? 0}</td>
                  <td className="py-3">
                    <button onClick={() => handleConvert(po.id)} className="mr-2 btn btn-sm" disabled={po.status === 'received'}>
                      Convert
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
