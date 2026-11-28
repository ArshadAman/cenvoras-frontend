import React from 'react';

export default function InlineProgressBar({ value, label = 'Processing...', className = '' }) {
  const normalized = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
        <span className="text-xs font-mono font-semibold text-[var(--accent-primary)]">{Math.round(normalized)}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
        <div
          className="h-full bg-[var(--action-primary)] transition-all duration-150"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
}
