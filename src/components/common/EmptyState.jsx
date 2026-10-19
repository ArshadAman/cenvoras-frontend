import React from 'react';
import Button from './Button';
import { SparklesIcon } from '@heroicons/react/24/outline';

/**
 * Tactical Empty State Component
 * Strictly adheres to Cenvora's 8-color design system.
 * Eliminates dead ends by providing clear context and actionable next steps.
 */
export default function EmptyState({
  icon: Icon = SparklesIcon,
  title = 'No records found',
  description = 'Get started by creating your first record to begin tracking your data.',
  action = null,
  secondaryAction = null,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-sm animate-fade-up my-4 text-[var(--text-primary)] ${className}`}
    >
      {/* Blueprint Grid Accent */}
      <div className="relative mb-5">
        <div className="absolute -inset-4 rounded-full bg-[var(--accent-primary)]/10 blur-xl pointer-events-none" />
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)] shadow-md relative z-10">
          <Icon className="w-8 h-8" />
        </div>
      </div>

      {/* Typography */}
      <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1.5 tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md leading-relaxed mb-6">
        {description}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {secondaryAction && (
            <Button
              variant="secondary"
              size="sm"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button
              variant="primary"
              size="sm"
              icon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
