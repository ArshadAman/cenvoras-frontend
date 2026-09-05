import React from 'react';

export default function InlineProgressBar({ value, label = 'Processing...', className = '' }) {
  const normalized = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-300">{label}</span>
        <span className="text-xs text-cyan-300">{Math.round(normalized)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-150"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
}
