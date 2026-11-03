import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import useEscKey from '../../hooks/useEscStack';

/**
 * Universal Accessible Modal Component
 * Strictly adheres to Cenvora's 8-color design system.
 * Handles backdrop blur, keyboard traps, outside click, and spring entrance.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  maxWidth = 'max-w-xl',
  className = '',
  bodyClassName = '',
  noPadding = false,
  hideCloseButton = false,
  preventBackdropClose = false,
}) {
  useEscKey(onClose, isOpen, 20);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !preventBackdropClose) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "cenvora-modal-title" : undefined}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200" />

      {/* Modal Surface */}
      <div
        className={clsx(
          'relative w-full rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl overflow-hidden animate-fade-up z-10 my-auto text-[var(--text-primary)] max-h-[90vh] flex flex-col',
          maxWidth,
          className
        )}
      >
        {/* Header */}
        {(title || !hideCloseButton) && (
          <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--accent-primary)] shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div>
                {title && (
                  <h3 id="cenvora-modal-title" className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight font-display">
                    {title}
                  </h3>
                )}
                {subtitle && <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
              </div>
            </div>
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors cursor-pointer shrink-0"
                title="Close (Esc)"
                aria-label="Close dialog"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className={clsx('overflow-y-auto flex-1', noPadding ? '' : 'p-5 sm:p-6', bodyClassName)}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 sm:px-6 sm:py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
