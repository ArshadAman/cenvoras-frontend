import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { NO_ACCESS_MESSAGE } from '../utils/modulePermissions';
import { getUserRole } from '../utils/auth';

// Blocked route: tell the user why instead of silently bouncing to the dashboard.
export default function AccessDeniedRedirect({ to }) {
  const role = getUserRole();
  const target = to || (role === 'employee' ? '/employee/portal' : '/dashboard');

  useEffect(() => {
    toast.error(NO_ACCESS_MESSAGE, { toastId: 'no-access' });
  }, []);
  return <Navigate to={target} replace />;
}
