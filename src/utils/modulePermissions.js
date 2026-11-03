// Single source for module access: used by the route guard AND the sidebar (UAT P1 #11).
export const MODULE_ALIASES = {
  sales: ['sales'],
  purchases: ['purchases', 'purchase'],
  inventory: ['inventory'],
  financials: ['financials', 'finance', 'financial'],
  hr: ['hr'],
};

export function resolvePermissionLevel(permissions, moduleKey) {
  const keys = MODULE_ALIASES[moduleKey] || [moduleKey];
  for (const key of keys) {
    const value = permissions?.[key];
    if (value === 'none' || value === 'view' || value === 'edit') return value;
  }
  return 'none';
}

export function canAccessModule(role, permissions, moduleKey) {
  if (role === 'admin') return true;
  const perms = typeof permissions === 'object' && permissions !== null ? permissions : {};
  return resolvePermissionLevel(perms, moduleKey) !== 'none';
}

export const NO_ACCESS_MESSAGE = "You don't have access to this page";
