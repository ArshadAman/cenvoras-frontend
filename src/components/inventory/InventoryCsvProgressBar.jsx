import React, { useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

export default function InventoryCsvProgressBar({ job, onDismiss, onRefreshNow }) {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  if (!job || job.status === 'IDLE') {
    return null;
  }

  const {
    status,
    percent,
    current,
    total,
    createdCount,
    updatedCount,
    skippedCount,
    failedCount,
    errors,
    errorMessage,
    isProcessing,
  } = job;

  const isSuccess = status === 'SUCCESS';
  const isFailure = status === 'FAILURE';

  return (
    <div className="relative mb-5 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-r from-slate-900/90 via-slate-800/85 to-cyan-950/80 p-4 shadow-xl backdrop-blur-xl animate-fade-up">
      {/* Top Bar: Status title, Progress %, and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          {isProcessing && (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            </span>
          )}
          {isSuccess && (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40">
              <CheckCircleIcon className="h-4 w-4" />
            </span>
          )}
          {isFailure && (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/40">
              <ExclamationTriangleIcon className="h-4 w-4" />
            </span>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold tracking-wide text-white">
                {isProcessing && 'Importing Inventory in Background'}
                {isSuccess && 'CSV Import Finished Successfully'}
                {isFailure && 'CSV Import Encountered an Error'}
              </h4>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isProcessing
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                    : isSuccess
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-slate-300/80 mt-0.5">
              {isProcessing && `Processing ${current.toLocaleString()} of ${total ? total.toLocaleString() : '...'} rows`}
              {isSuccess && `Processed all ${total || (createdCount + updatedCount + skippedCount + failedCount)} rows`}
              {isFailure && (errorMessage || 'Processing interrupted')}
            </p>
          </div>
        </div>

        {/* Right side: Percent and dismiss/refresh button */}
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-cyan-300 drop-shadow">
            {Math.round(percent)}%
          </span>

          {isSuccess && onRefreshNow && (
            <button
              onClick={onRefreshNow}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30 border border-cyan-400/30 transition flex items-center gap-1.5"
            >
              <ArrowPathIcon className="h-3 w-3" />
              Refresh Table
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              title="Dismiss notification"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10 mb-3">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            isFailure
              ? 'bg-rose-500'
              : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400'
          }`}
          style={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        )}
      </div>

      {/* Counters & Metric Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Created: <strong>{createdCount}</strong>
        </span>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          Updated: <strong>{updatedCount}</strong>
        </span>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-500/15 text-slate-300 border border-slate-500/25">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Unchanged: <strong>{skippedCount}</strong>
        </span>

        {failedCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            Failed: <strong>{failedCount}</strong>
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {errors && errors.length > 0 && (
            <button
              onClick={() => setShowErrorDetails(prev => !prev)}
              className="text-xs text-rose-300 hover:text-rose-200 underline flex items-center gap-1"
            >
              {showErrorDetails ? 'Hide error details' : `View ${errors.length} row error(s)`}
              {showErrorDetails ? (
                <ChevronUpIcon className="h-3 w-3" />
              ) : (
                <ChevronDownIcon className="h-3 w-3" />
              )}
            </button>
          )}

          {isProcessing && (
            <span className="text-[11px] text-slate-400 italic">
              Non-blocking &bull; You can freely browse and edit products
            </span>
          )}
        </div>
      </div>

      {/* Expandable Error Details */}
      {showErrorDetails && errors && errors.length > 0 && (
        <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-rose-500/20 max-h-36 overflow-y-auto space-y-1">
          <p className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider mb-1">
            Row Processing Issues:
          </p>
          {errors.slice(0, 10).map((err, idx) => (
            <div key={idx} className="text-xs text-rose-200/90 font-mono flex items-start gap-2">
              <span className="text-rose-400">Row {err.row || '?'}:</span>
              <span>{err.error || JSON.stringify(err)}</span>
            </div>
          ))}
          {errors.length > 10 && (
            <p className="text-[11px] text-slate-400 italic pt-1">
              ...and {errors.length - 10} more row error(s).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
