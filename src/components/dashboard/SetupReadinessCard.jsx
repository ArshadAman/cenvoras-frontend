import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightIcon,
  XMarkIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { computeSetupReadiness } from '../../utils/readinessProgress';

const DISMISSED_KEY = 'cenvora_setup_readiness_dismissed';

export default function SetupReadinessCard({ profile, metrics, salesList, purchasesList, isLoading }) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [expanded, setExpanded] = useState(false);

  const readiness = useMemo(
    () => computeSetupReadiness({ profile, metrics, salesList, purchasesList }),
    [profile, metrics, salesList, purchasesList]
  );

  if (dismissed || isLoading) {
    return null;
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // Ignore storage errors in restricted contexts
    }
    setDismissed(true);
  };

  return (
    <section
      aria-label="Workspace setup and compliance readiness"
      className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 shadow-sm transition-colors duration-150"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div
            className={`p-2 rounded-xl border shrink-0 ${
              readiness.isComplete
                ? 'bg-[var(--status-success-bg)] border-[var(--status-success-border)] text-[var(--status-success)]'
                : 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
            }`}
          >
            {readiness.isComplete ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <ShieldCheckIcon className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
                {readiness.isComplete ? 'Workspace Operational Readiness Verified' : 'Workspace Readiness Checklist'}
              </h2>
              <span
                className={`text-[11px] font-mono font-tabular font-semibold px-2 py-0.5 rounded-md border ${
                  readiness.isComplete
                    ? 'bg-[var(--status-success-bg)] border-[var(--status-success-border)] text-[var(--status-success)]'
                    : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                {readiness.completedCount}/{readiness.totalCount} · {readiness.percent}%
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
              {readiness.isComplete
                ? 'All core identity, tax, bank, and ledger foundations are configured.'
                : `Next step: ${readiness.nextStep?.label} (${readiness.remainingCount} remaining)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {!readiness.isComplete && readiness.nextStep && (
            <button
              type="button"
              onClick={() => navigate(readiness.nextStep.route)}
              className="btn-primary !text-xs !py-1.5 !px-3 flex items-center gap-1.5 active:scale-[0.98] transition-all duration-150"
            >
              <span>{readiness.nextStep.actionLabel}</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="btn-secondary !text-xs !py-1.5 !px-2.5 flex items-center gap-1 active:scale-[0.98] transition-all duration-150"
            aria-expanded={expanded}
          >
            <span>{expanded ? 'Hide steps' : 'View steps'}</span>
            {expanded ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] border border-transparent hover:border-[var(--border-subtle)] transition-colors duration-150 active:scale-[0.98]"
            title="Dismiss readiness checklist"
            aria-label="Dismiss readiness checklist"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Goal-Gradient Progress Bar */}
      <div
        className="mt-3 w-full h-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-full overflow-hidden"
        role="progressbar"
        aria-label="Workspace readiness progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={readiness.percent}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${readiness.percent}%`,
            backgroundColor: readiness.isComplete ? 'var(--status-success)' : 'var(--accent-primary)',
          }}
        />
      </div>

      {/* Expandable Steps Grid */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {readiness.steps.map((step) => (
            <div
              key={step.id}
              className={`rounded-xl border p-3 flex items-start justify-between gap-2.5 transition-colors duration-150 ${
                step.completed
                  ? 'bg-[var(--bg-primary)]/40 border-[var(--border-subtle)] opacity-85'
                  : 'bg-[var(--bg-primary)]/80 border-[var(--border-default)] hover:border-[var(--accent-primary)]/50'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                    step.completed
                      ? 'bg-[var(--status-success-bg)] border-[var(--status-success-border)] text-[var(--status-success)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-surface)]'
                  }`}
                >
                  {step.completed && <CheckCircleIcon className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-xs font-semibold ${
                      step.completed ? 'text-[var(--text-secondary)] line-through decoration-[var(--text-muted)]/50' : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                    {step.description}
                  </div>
                </div>
              </div>

              {!step.completed && (
                <button
                  type="button"
                  onClick={() => navigate(step.route)}
                  className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline shrink-0 mt-0.5 cursor-pointer"
                >
                  {step.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
