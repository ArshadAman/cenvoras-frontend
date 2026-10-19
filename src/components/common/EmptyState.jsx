import React from 'react';
import Button from './Button';
import { SparklesIcon } from '@heroicons/react/24/outline';

/**
 * Tactical Empty State Component
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
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-white/[0.08] bg-[#121418]/60 backdrop-blur-sm animate-fade-up my-4 ${className}`}
    >
      {/* Icon Badge */}
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-cyan-400 mb-4 shadow-xl shadow-black/40">
        <Icon className="w-7 h-7" />
      </div>

      {/* Typography */}
      <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-gray-400 max-w-md leading-relaxed mb-6">
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
