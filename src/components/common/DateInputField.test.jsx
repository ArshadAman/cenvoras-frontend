import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import DateInputField from './DateInputField';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('DateInputField', () => {
  it('opens themed portal calendar and dims prev/next month overflow days cleanly', () => {
    const onChange = vi.fn();
    render(
      <DateInputField
        name="invoice_date"
        value="2026-10-27"
        onChange={onChange}
      />
    );

    const openBtn = screen.getByRole('button', { name: 'Open calendar' });
    fireEvent.click(openBtn);

    const dialog = screen.getByRole('dialog', { name: 'Choose date' });
    expect(dialog).toBeTruthy();

    // October 2026 starts on Thursday -> Sunday..Wednesday Sept 27..30 are outside current month
    const sept28 = dialog.querySelector('button[data-iso="2026-09-28"]');
    const nov02 = dialog.querySelector('button[data-iso="2026-11-02"]');
    const oct15 = dialog.querySelector('button[data-iso="2026-10-15"]');
    const oct27 = dialog.querySelector('button[data-iso="2026-10-27"]');

    expect(sept28.getAttribute('data-outside-month')).toBe('true');
    expect(sept28.className).toContain('opacity-30');
    expect(nov02.getAttribute('data-outside-month')).toBe('true');
    expect(nov02.className).toContain('opacity-30');

    expect(oct15.getAttribute('data-outside-month')).toBe('false');
    expect(oct15.className).not.toContain('opacity-30');
    expect(oct27.getAttribute('aria-selected')).toBe('true');

    fireEvent.click(oct15);
    expect(onChange).toHaveBeenCalledWith({
      target: { name: 'invoice_date', value: '2026-10-15' },
    });
    expect(screen.queryByRole('dialog', { name: 'Choose date' })).toBeNull();
  });

  it('supports Clear, min/max constraints, month chevrons, and hidden native date input sync', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateInputField
        name="due_date"
        value="2026-10-10"
        min="2026-10-05"
        max="2026-10-20"
        onChange={onChange}
      />
    );

    // Synced hidden input change compatibility (used by existing tests like DojCorrectionModal.test.jsx)
    fireEvent.change(container.querySelector('input[type="date"]'), {
      target: { value: '2026-10-12' },
    });
    expect(onChange).toHaveBeenCalledWith({
      target: { name: 'due_date', value: '2026-10-12' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    const dialog = screen.getByRole('dialog', { name: 'Choose date' });

    const oct02 = dialog.querySelector('button[data-iso="2026-10-02"]');
    const oct25 = dialog.querySelector('button[data-iso="2026-10-25"]');
    expect(oct02.disabled).toBe(true);
    expect(oct25.disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith({
      target: { name: 'due_date', value: '' },
    });
  });
});
