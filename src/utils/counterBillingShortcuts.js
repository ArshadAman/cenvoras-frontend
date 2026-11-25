/**
 * Pure keydown handler for high-speed wholesale counter billing ergonomics.
 * Supported shortcuts:
 * - F2 or Ctrl+S / Cmd+S : Trigger form save
 * - F3                   : Focus Customer / Party lookup (#customer_name)
 * - F8                   : Focus last Item / Barcode search input ([data-counter-item-search="true"])
 * - Alt+N                : Add new line item row ([data-counter-add-item="true"]) and focus its search input
 * - Enter                : Advance focus like Tab across inputs/selects (unless data-no-enter="true")
 */
export function handleCounterBillingKeyDown(
  e,
  { onSaveToast } = {},
  doc = typeof document !== 'undefined' ? document : null
) {
  if (!doc) return false;

  const isCtrlOrCmdS = (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S');
  if (e.key === 'F2' || isCtrlOrCmdS) {
    e.preventDefault();
    const submitBtn = doc.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.click();
      if (onSaveToast) onSaveToast();
    }
    return true;
  }

  if (e.key === 'F3') {
    e.preventDefault();
    const custEl = doc.getElementById('customer_name');
    if (custEl) {
      custEl.focus();
      if (typeof custEl.select === 'function') custEl.select();
    }
    return true;
  }

  if (e.key === 'F8') {
    e.preventDefault();
    const itemInputs = doc.querySelectorAll('[data-counter-item-search="true"]');
    if (itemInputs && itemInputs.length > 0) {
      const targetInput = itemInputs[itemInputs.length - 1];
      targetInput.focus();
      if (typeof targetInput.select === 'function') targetInput.select();
    }
    return true;
  }

  if (e.altKey && (e.key === 'n' || e.key === 'N')) {
    e.preventDefault();
    const addBtn = doc.querySelector('[data-counter-add-item="true"]');
    if (addBtn) {
      addBtn.click();
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => {
          const itemInputs = doc.querySelectorAll('[data-counter-item-search="true"]');
          if (itemInputs && itemInputs.length > 0) {
            itemInputs[itemInputs.length - 1].focus();
          }
        });
      }
    }
    return true;
  }

  if (e.key === 'Enter') {
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT') && !target.dataset?.noEnter) {
      e.preventDefault();
      const form = target.form;
      if (form && form.elements) {
        const index = Array.prototype.indexOf.call(form.elements, target);
        let nextIndex = index + 1;
        while (form.elements[nextIndex]) {
          const next = form.elements[nextIndex];
          if (
            next.tagName !== 'FIELDSET' &&
            !next.hidden &&
            !next.disabled &&
            next.offsetParent !== null &&
            next.tabIndex >= 0
          ) {
            next.focus();
            break;
          }
          nextIndex++;
        }
      }
      return true;
    }
  }

  return false;
}
