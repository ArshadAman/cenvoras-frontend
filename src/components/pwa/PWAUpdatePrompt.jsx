import React, { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import UpdateBanner from "./UpdateBanner";

const UPDATE_INTERVAL_MS = 60 * 60 * 1000; // hourly

/**
 * registerType 'prompt': a new service worker waits until the user clicks Refresh,
 * which calls updateSW(true) (skipWaiting + reload). Polls for updates hourly and
 * whenever the tab becomes visible again.
 */
export default function PWAUpdatePrompt() {
  const [refreshing, setRefreshing] = useState(false);
  const [registration, setRegistration] = useState(null);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (reg) setRegistration(reg);
    },
  });

  useEffect(() => {
    if (!registration) return undefined;
    const check = () => {
      if (navigator.onLine !== false) registration.update().catch(() => {});
    };
    const id = setInterval(check, UPDATE_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [registration]);

  if (!needRefresh) return null;
  return (
    <UpdateBanner
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        updateServiceWorker(true);
      }}
      onDismiss={() => setNeedRefresh(false)}
    />
  );
}
