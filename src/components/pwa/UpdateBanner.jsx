import React from "react";
import { ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";

/**
 * Presentational "New version available" banner. Uses the app's theme tokens
 * (var(--bg-surface), var(--text-*), var(--accent-primary), .btn-primary/.btn-secondary),
 * so it follows light and dark themes automatically.
 */
export default function UpdateBanner({ onRefresh, onDismiss, refreshing = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-labelledby="pwa-update-title"
      className="fixed z-[10000] inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:w-[min(92vw,30rem)] pwa-update-banner"
    >
      <div className="flex items-center gap-3 px-4 py-3 sm:rounded-2xl border-t sm:border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <span className="shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-[var(--status-info-bg)] text-[var(--accent-primary)]" aria-hidden="true">
          <ArrowPathIcon className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p id="pwa-update-title" className="text-sm font-semibold">New version available</p>
          <p className="text-xs text-[var(--text-secondary)]">Refresh to get the latest Cenvora update.</p>
        </div>
        <button type="button" onClick={onDismiss} className="btn-secondary px-3 py-1.5 text-sm">
          Later
        </button>
        <button type="button" onClick={onRefresh} disabled={refreshing} className="btn-primary px-3 py-1.5 text-sm disabled:opacity-60">
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss update notification"
          className="hidden sm:grid place-items-center p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
