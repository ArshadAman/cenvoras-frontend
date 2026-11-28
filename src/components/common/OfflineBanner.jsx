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
      className={`fixed top-0 inset-x-0 z-[2147483640] pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-2 px-4 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-opacity duration-150 motion-reduce:transition-none border-b ${
        isOnline
          ? 'bg-[var(--status-success-fill)] text-[var(--status-success-on-fill)] border-[var(--status-success-border)] animate-fade-in'
          : 'bg-[var(--status-warning-fill)] text-[var(--status-warning-on-fill)] border-[var(--status-warning-border)] animate-fade-in'
      }`}
    >
      <WifiIcon className="w-4 h-4 shrink-0" />
      {isOnline ? (
        <span>Connection restored — your workspace is back in sync.</span>
      ) : (
        <span>Offline mode — your unsaved invoice and bill drafts are safely stored on this device.</span>
      )}
    </div>
  );
}
