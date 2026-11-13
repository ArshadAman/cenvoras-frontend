import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '../api/users';
import { getUserRole } from '../utils/auth';
import { canAccessModule } from '../utils/modulePermissions';
import AccessDeniedRedirect from './AccessDeniedRedirect';

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

  if (role === 'employee') {
    return <AccessDeniedRedirect to="/employee/portal" />;
  }

  if (isLoading) {
    return null;
  }

  if (!canAccessModule(role, profileData?.profile?.permissions, moduleKey)) {
    return <AccessDeniedRedirect />;
  }

  return children;
}
