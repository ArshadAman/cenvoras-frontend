import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, CommandLineIcon } from '@heroicons/react/24/outline';

const SHORTCUT_GROUPS = [
  {
    title: 'Global Navigation',
    items: [
      { keys: ['⌘K', 'Ctrl+K'], description: 'Open Command Palette (search pages & quick actions)' },
      { keys: ['⌘B', 'Ctrl+B'], description: 'Collapse or expand navigation sidebar' },
      { keys: ['?'], description: 'Open this Keyboard Shortcuts reference' },
      { keys: ['Esc'], description: 'Close active dialog, modal, or drawer' },
    ],
  },
  {
    title: 'Counter Billing & Invoices',
    items: [
      { keys: ['F2', 'Ctrl+S'], description: 'Save current invoice, order, or purchase bill' },
      { keys: ['F3'], description: 'Focus Customer / Party lookup field' },
      { keys: ['F8'], description: 'Jump to last Item / Barcode search input' },
      { keys: ['Alt+N'], description: 'Add a new line item row and focus search' },
      { keys: ['Enter'], description: 'Advance focus to next input field (Tab-like entry)' },
    ],
  },
  {
    title: 'Command Palette',
    items: [
      { keys: ['↑', '↓'], description: 'Move selection up or down' },
      { keys: ['↵'], description: 'Navigate to selected page or action' },
    ],
  },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts Reference"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
              <CommandLineIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                Keyboard Mastery Reference
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                High-speed keyboard navigation for accounting & counter billing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] border border-transparent hover:border-[var(--border-subtle)] transition-colors duration-150"
            aria-label="Close keyboard shortcuts"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {group.title}
              </h3>
              <div className="divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 overflow-hidden">
                {group.items.map((item) => (
                  <div
                    key={item.description}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-4 text-xs"
                  >
                    <span className="text-[var(--text-secondary)]">{item.description}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.keys.map((keyLabel) => (
                        <kbd
                          key={keyLabel}
                          className="px-2 py-0.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] font-mono text-[11px] font-semibold"
                        >
                          {keyLabel}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-primary)]">Esc</kbd> to close
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary !text-xs !py-1.5 !px-3 active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
