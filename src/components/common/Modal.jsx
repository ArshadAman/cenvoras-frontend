import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import useEscKey from '../../hooks/useEscStack';

/**
 * Universal Accessible Modal Component
 * Handles backdrop blur, keyboard traps, outside click, and spring entrance.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  maxWidth = 'max-w-xl',
  className = '',
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-200" />

      {/* Modal Surface */}
      <div
        className={clsx(
          'relative w-full rounded-2xl bg-obsidian-elevated border border-hairline shadow-2xl overflow-hidden animate-fade-up z-10 my-auto',
          maxWidth,
          className
        )}
      >
        {/* Header */}
        {(title || !hideCloseButton) && (
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-hairline bg-white/[0.02]">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 rounded-xl bg-white/5 border border-hairline text-blue-400">
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div>
                {title && <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>}
                {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
              </div>
            </div>
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
