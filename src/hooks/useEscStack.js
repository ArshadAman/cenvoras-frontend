import { useEffect, useRef } from "react";

// Global stack of active ESC key handlers
const escStack = [];
let listenerAttached = false;

function ensureListener() {
  if (listenerAttached || typeof window === "undefined") return;
  listenerAttached = true;

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" || e.keyCode === 27) {
        if (escStack.length > 0) {
          // Sort or take highest priority, then most recently added (LIFO)
          const sorted = [...escStack].sort((a, b) => {
            if (b.priority !== a.priority) {
              return b.priority - a.priority;
            }
            return b.order - a.order;
          });

          const topHandler = sorted[0];
          if (topHandler && typeof topHandler.callback === "function") {
            e.preventDefault();
            e.stopPropagation();
            topHandler.callback();
          }
        }
      }
    },
    true // Capture phase to intercept before native or parent listeners
  );
}

let nextOrder = 0;

/**
 * Hook to register an Escape key action in the global LIFO stack.
 *
 * @param {Function} callback - Function to execute when Esc is pressed.
 * @param {boolean} isActive - Whether this handler is currently active.
 * @param {number} priority - Higher priority executes before lower priority.
 *   - 0: Page level (e.g. redirect to /dashboard when idle on section list)
 *   - 10: Task / Form / Detail modal (e.g. New Invoice, View Bill)
 *   - 20: Sub-popups / Child dialogs (e.g. Add Customer, Catalog Update)
 *   - 30: Autocomplete Dropdowns / Select menus
 */
export function useEscKey(callback, isActive = true, priority = 10) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    ensureListener();
    if (!isActive) return;

    const entry = {
      callback: () => callbackRef.current?.(),
      priority,
      order: ++nextOrder,
    };

    escStack.push(entry);

    return () => {
      const idx = escStack.indexOf(entry);
      if (idx !== -1) {
        escStack.splice(idx, 1);
      }
    };
  }, [isActive, priority]);
}

export default useEscKey;
