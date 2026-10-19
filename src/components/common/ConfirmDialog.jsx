import React, { useEffect, useRef } from 'react';
import Modal from './Modal';
import Button from './Button';
import { ExclamationTriangleIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * Universal Confirmation & Destructive Action Dialog
 * Strictly adheres to Cenvora's 8-color design system.
 * Protects against accidental triggers, provides dependency explanations,
 * and handles in-flight loading states.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  dependencyWarning,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  isPending = false,
  icon: CustomIcon,
}) {
  const cancelBtnRef = useRef(null);

  // Focus the Cancel button on open so pressing Enter doesn't accidentally confirm destructive actions
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const IconComponent =
    CustomIcon ||
    (variant === 'destructive'
      ? TrashIcon
      : variant === 'warning'
      ? ExclamationTriangleIcon
      : InformationCircleIcon);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isPending ? () => {} : onClose}
      maxWidth="max-w-md"
      preventBackdropClose={isPending}
    >
      <div className="flex flex-col items-center text-center pt-2 pb-1">
        {/* Warning Icon Badge */}
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-md ${
            variant === 'destructive'
              ? 'bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] text-[var(--status-danger)]'
              : 'bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] text-[var(--status-warning)]'
          }`}
        >
          <IconComponent className="w-6 h-6" />
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{description}</p>
        )}

        {/* Dependency Alert if blocked */}
        {dependencyWarning && (
          <div className="w-full text-left p-3.5 mb-5 rounded-xl bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] text-[var(--status-warning)] text-xs leading-relaxed flex items-start gap-2.5">
            <InformationCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--status-warning)]" />
            <span>{dependencyWarning}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 w-full pt-4 border-t border-[var(--border-subtle)] mt-2">
          <Button
            ref={cancelBtnRef}
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            isPending={isPending}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
