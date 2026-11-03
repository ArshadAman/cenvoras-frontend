import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import InfoTip from './InfoTip';
import { gstShieldTips } from '../../utils/gstShieldView';

afterEach(cleanup);
const flush = () => act(async () => { await Promise.resolve(); });

describe('InfoTip', () => {
  it('is closed initially and opens on tap (touch pointer), linking aria-describedby', async () => {
    render(<InfoTip content="Tip text">Composition</InfoTip>);
    const btn = screen.getByRole('button', { name: /composition/i });
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.pointerDown(btn, { pointerType: 'touch' });
    fireEvent.mouseDown(btn);
    fireEvent.click(btn);
    await flush();
    const tip = screen.getByRole('tooltip');
    expect(tip.textContent).toBe('Tip text');
    expect(btn.getAttribute('aria-describedby')).toBe(tip.id);
  });

  it('opens on keyboard focus and closes on Escape', async () => {
    render(<InfoTip content="Focus tip" label="ITC info" />);
    const btn = screen.getByRole('button', { name: 'ITC info' });
    await act(async () => { btn.focus(); fireEvent.focus(btn); });
    await flush();
    expect(screen.getByRole('tooltip').textContent).toBe('Focus tip');
    fireEvent.keyDown(document.body, { key: 'Escape' });
    await flush();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('renders GST copy with actual numbers', () => {
    const t = gstShieldTips({ priorLabel: 'FY 2025-26', priorTurnover: 1234567, compositionLimit: 15000000 });
    expect(t.composition).toContain('Your FY 2025-26 turnover: ₹12,34,567');
    expect(t.qrmp).toContain('PMT-06');
    expect(t.hsn).toContain('4 digits');
  });
});
