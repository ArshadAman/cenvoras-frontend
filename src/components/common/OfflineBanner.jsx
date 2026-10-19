import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WifiIcon } from '@heroicons/react/24/outline';

/**
 * Global Network Status & Offline Recovery Banner
 * Sits at the top of the viewport, alerting the user to offline conditions
 * and auto-refreshing queries upon reconnection.
 */
export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true
  );
  const [showRestored, setShowRestored] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      // Re-fetch active queries once back online
      queryClient.invalidateQueries();

      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient]);

  if (isOnline && !showRestored) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 inset-x-0 z-[2147483640] py-2 px-4 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-all duration-300 ${
        isOnline
          ? 'bg-emerald-600 text-white animate-fade-in'
          : 'bg-gradient-to-r from-amber-600 to-rose-600 text-white animate-fade-in'
      }`}
    >
      <WifiIcon className="w-4 h-4 animate-pulse" />
      {isOnline ? (
        <span>Connection restored. System is synchronized.</span>
      ) : (
        <span>You are currently working offline. Unsaved drafts are cached locally on this device.</span>
      )}
    </div>
  );
}
