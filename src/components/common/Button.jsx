import React from 'react';
import clsx from 'clsx';

/**
 * Tactical & Accessible Enterprise Button
 * Implements the 7-state interaction contract:
 * resting, hover, active press (scale-98), focus-visible, loading/in-flight, disabled.
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isPending = false,
  disabled = false,
  onClick,
  icon: Icon,
  className = '',
  haptic = true,
  ...props
}) {
  const pending = isLoading || isPending;
  const isDisabled = disabled || pending;

  const handleClick = (e) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    if (haptic && typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {
        // Ignore
      }
    }
    if (onClick) {
      onClick(e);
    }
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090E]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 border border-blue-400/30 focus-visible:ring-blue-500',
    secondary:
      'bg-obsidian-card hover:bg-obsidian-elevated text-gray-200 hover:text-white border border-white/10 hover:border-white/20 focus-visible:ring-white/40',
    destructive:
      'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/25 hover:border-rose-500/40 shadow-lg shadow-rose-950/30 focus-visible:ring-rose-500',
    ghost:
      'bg-transparent hover:bg-white/5 text-gray-400 hover:text-white border border-transparent focus-visible:ring-white/20',
    success:
      'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-950/30 focus-visible:ring-emerald-500',
  };

  const interactiveStyles = isDisabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer active:scale-[0.98]';

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={handleClick}
      className={clsx(
        baseStyles,
        sizeStyles[size] || sizeStyles.md,
        variantStyles[variant] || variantStyles.primary,
        interactiveStyles,
        className
      )}
      {...props}
    >
      {pending && (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}
      {!pending && Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      <span>{children}</span>
    </button>
  );
}
