import api from './api';

export const getSubscriptionEntitlements = () =>
  api.get('/subscription/entitlements/').then((res) => res.data);

export const getPlanCatalog = () =>
  api.get('/subscription/plans/').then((res) => res.data);

export const getPlanChangeQuote = (targetPlanCode, billingCycle = 'monthly') =>
  api.post('/subscription/plan-change/quote/', {
    target_plan_code: targetPlanCode,
    billing_cycle: billingCycle,
  }).then((res) => res.data);

export const schedulePlanChange = (targetPlanCode, billingCycle = 'monthly') =>
  api.post('/subscription/plan-change/schedule/', {
    target_plan_code: targetPlanCode,
    billing_cycle: billingCycle,
  }).then((res) => res.data);

export const createPlanPaymentOrder = (planCode, options = {}) =>
  api.post('/subscription/payments/create-order/', {
    plan_code: planCode,
    billing_cycle: options.billingCycle || 'monthly',
    force_new_order: !!options.forceNewOrder,
  }).then((res) => res.data);

export const confirmPlanPayment = (orderId) =>
  api.post('/subscription/payments/confirm/', { order_id: orderId }).then((res) => res.data);

export const getLatestPaymentStatus = () =>
  api.get('/subscription/payments/latest-status/').then((res) => res.data);

export default {
  getSubscriptionEntitlements,
  getPlanCatalog,
  getPlanChangeQuote,
  schedulePlanChange,
  createPlanPaymentOrder,
  confirmPlanPayment,
  getLatestPaymentStatus,
};
