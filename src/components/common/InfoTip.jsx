import { useId, useState } from 'react';
import {
  useFloating, autoUpdate, offset, flip, shift, size,
  useHover, useFocus, useClick, useDismiss, useRole, useInteractions, safePolygon, FloatingPortal,
} from '@floating-ui/react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * Accessible info tooltip: opens on hover, keyboard focus, or tap; Esc / outside tap closes.
 * Stays inside the viewport (flip + shift), max 260px wide. Uses theme tokens (light/dark).
 * Pass `children` to make a custom trigger label; otherwise a small ⓘ icon is rendered.
 */
export default function InfoTip({ content, label = 'More info', children, className = '' }) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({ padding: 8, apply({ availableWidth, elements }) {
        elements.floating.style.maxWidth = `${Math.min(260, availableWidth)}px`;
      } }),
    ],
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { move: false, handleClose: safePolygon() }),
    useFocus(context, { visibleOnly: false }),
    useClick(context, { ignoreMouse: true }), // tap on touch / Enter key; mouse uses hover
    useDismiss(context), // Esc + outside press
    useRole(context, { role: 'tooltip' }),
  ]);

  return (
    <>
      <button
        type="button"
        ref={refs.setReference}
        aria-label={children ? undefined : label}
        aria-describedby={open ? tipId : undefined}
        aria-expanded={open}
        className={`inline-flex items-center gap-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${className}`}
        {...getReferenceProps()}
      >
        {children}
        <InformationCircleIcon aria-hidden="true" className="w-3.5 h-3.5 shrink-0 opacity-70" />
      </button>
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            id={tipId}
            style={{ ...floatingStyles, maxWidth: 260 }}
            className="z-[1000] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs leading-snug text-[var(--text-primary)] shadow-lg"
            {...getFloatingProps()}
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
