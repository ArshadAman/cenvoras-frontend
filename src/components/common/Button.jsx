import React from 'react';
import clsx from 'clsx';

/**
 * Standardized 8-Color Design System Button
 * Implements the 7-state interaction contract:
 * resting, hover, active press (scale-98), focus-visible, loading/in-flight, disabled.
 * Zero rogue colors: strictly driven by Cenvora's 8-color palette tokens.
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
    'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold shadow-sm hover:brightness-105 active:brightness-95 border border-transparent focus-visible:ring-[var(--border-focus)]',
    secondary:
      'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] focus-visible:ring-[var(--border-focus)]',
    destructive:
      'bg-[var(--bg-primary)] text-[var(--text-primary)] border-2 border-[var(--text-primary)] font-extrabold uppercase tracking-wider hover:bg-[var(--bg-surface)] focus-visible:ring-[var(--border-focus)]',
    ghost:
      'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-transparent focus-visible:ring-[var(--border-focus)]',
    success:
      'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold hover:brightness-105 border border-transparent focus-visible:ring-[var(--border-focus)]',
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
