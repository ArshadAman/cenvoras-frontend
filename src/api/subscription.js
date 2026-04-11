import api from './api';

export const getSubscriptionEntitlements = () =>
  api.get('/subscription/entitlements/').then((res) => res.data);

export const getPlanCatalog = () =>
  api.get('/subscription/plans/').then((res) => res.data);

export default {
  getSubscriptionEntitlements,
  getPlanCatalog,
};
