import api from './api'

export const listPurchaseOrders = async () => {
  const resp = await api.get('/billing/purchase-orders/')
  return resp.data
}

export const createPurchaseOrder = async (payload) => {
  const resp = await api.post('/billing/purchase-orders/', payload)
  return resp.data
}

export const convertPurchaseOrder = async (id) => {
  const resp = await api.post(`/billing/purchase-orders/${id}/convert/`)
  return resp.data
}

export const updatePurchaseOrder = async (id, payload) => {
  const resp = await api.patch(`/billing/purchase-orders/${id}/`, payload)
  return resp.data
}

export const deletePurchaseOrder = async (id) => {
  const resp = await api.delete(`/billing/purchase-orders/${id}/`)
  return resp.data
}

export default {
  listPurchaseOrders,
  createPurchaseOrder,
  convertPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
}
