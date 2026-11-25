import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handleCounterBillingKeyDown } from '../src/utils/counterBillingShortcuts.js';

function createMockEvent(overrides = {}) {
  let prevented = false;
  return {
    key: '',
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    preventDefault: () => { prevented = true; },
    wasPrevented: () => prevented,
    target: { tagName: 'DIV', dataset: {} },
    ...overrides,
  };
}

describe('handleCounterBillingKeyDown', () => {
  it('triggers submit on F2 and Ctrl+S / Cmd+S', () => {
    let clicks = 0;
    let toasts = 0;
    const mockDoc = {
      querySelector: (sel) => (sel === 'button[type="submit"]' ? { click: () => { clicks++; } } : null),
    };
    const onSaveToast = () => { toasts++; };

    const eF2 = createMockEvent({ key: 'F2' });
    assert.equal(handleCounterBillingKeyDown(eF2, { onSaveToast }, mockDoc), true);
    assert.equal(eF2.wasPrevented(), true);
    assert.equal(clicks, 1);
    assert.equal(toasts, 1);

    const eCtrlS = createMockEvent({ key: 's', ctrlKey: true });
    assert.equal(handleCounterBillingKeyDown(eCtrlS, { onSaveToast }, mockDoc), true);
    assert.equal(clicks, 2);

    const eCmdS = createMockEvent({ key: 'S', metaKey: true });
    assert.equal(handleCounterBillingKeyDown(eCmdS, { onSaveToast }, mockDoc), true);
    assert.equal(clicks, 3);
  });

  it('focuses #customer_name on F3', () => {
    let focused = 0;
    let selected = 0;
    const mockDoc = {
      getElementById: (id) => (id === 'customer_name' ? { focus: () => { focused++; }, select: () => { selected++; } } : null),
    };

    const e = createMockEvent({ key: 'F3' });
    assert.equal(handleCounterBillingKeyDown(e, {}, mockDoc), true);
    assert.equal(e.wasPrevented(), true);
    assert.equal(focused, 1);
    assert.equal(selected, 1);
  });

  it('focuses the last item search input on F8', () => {
    let focused1 = 0;
    let focused2 = 0;
    const mockDoc = {
      querySelectorAll: () => [{ focus: () => { focused1++; } }, { focus: () => { focused2++; } }],
    };

    const e = createMockEvent({ key: 'F8' });
    assert.equal(handleCounterBillingKeyDown(e, {}, mockDoc), true);
    assert.equal(focused1, 0);
    assert.equal(focused2, 1);
  });

  it('clicks Add Item button on Alt+N', () => {
    let clicks = 0;
    const mockDoc = {
      querySelector: (sel) => (sel === '[data-counter-add-item="true"]' ? { click: () => { clicks++; } } : null),
      querySelectorAll: () => [],
    };

    const e = createMockEvent({ key: 'n', altKey: true });
    assert.equal(handleCounterBillingKeyDown(e, {}, mockDoc), true);
    assert.equal(e.wasPrevented(), true);
    assert.equal(clicks, 1);
  });

  it('advances focus like Tab on Enter for standard inputs', () => {
    let nextFocused = 0;
    const input1 = { tagName: 'INPUT', dataset: {}, form: null };
    const input2 = { tagName: 'INPUT', hidden: false, disabled: false, offsetParent: {}, tabIndex: 0, focus: () => { nextFocused++; } };
    input1.form = { elements: [input1, input2] };

    const e = createMockEvent({ key: 'Enter', target: input1 });
    assert.equal(handleCounterBillingKeyDown(e, {}, {}), true);
    assert.equal(e.wasPrevented(), true);
    assert.equal(nextFocused, 1);
  });
});
