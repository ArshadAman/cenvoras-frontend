import React from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '../api/users';
import { getUserRole } from '../utils/auth';

const MODULE_ALIASES = {
  sales: ['sales'],
  purchases: ['purchases', 'purchase'],
  inventory: ['inventory'],
  financials: ['financials', 'finance', 'financial'],
};

function resolvePermissionLevel(permissions, moduleKey) {
  const keys = MODULE_ALIASES[moduleKey] || [moduleKey];
  for (const key of keys) {
    const value = permissions?.[key];
    if (value === 'none' || value === 'view' || value === 'edit') {
      return value;
    }
  }
  return 'none';
}

export default function ModuleProtectedRoute({ moduleKey, children }) {
  const role = getUserRole();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getUserProfile,
    enabled: !!role && role !== 'admin',
    staleTime: 60_000,
  });

  if (role === 'admin') {
    return children;
  }

  if (isLoading) {
    return null;
  }

  const permissions = profileData?.profile?.permissions;
  const permissionLevel = resolvePermissionLevel(
    typeof permissions === 'object' && permissions !== null ? permissions : {},
    moduleKey
  );

  if (permissionLevel === 'none') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
