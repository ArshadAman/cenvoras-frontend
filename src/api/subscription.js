import api from './api';

export const getSubscriptionEntitlements = () =>
  api.get('/subscription/entitlements/').then((res) => res.data);

export const getPlanCatalog = () =>
  api.get('/subscription/plans/').then((res) => res.data);

export const createPlanPaymentOrder = (planCode) =>
  api.post('/subscription/payments/create-order/', { plan_code: planCode }).then((res) => res.data);

export const confirmPlanPayment = (orderId) =>
  api.post('/subscription/payments/confirm/', { order_id: orderId }).then((res) => res.data);

export default {
  getSubscriptionEntitlements,
  getPlanCatalog,
  createPlanPaymentOrder,
  confirmPlanPayment,
};
