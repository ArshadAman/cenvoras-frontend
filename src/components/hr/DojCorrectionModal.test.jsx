import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

vi.mock('../../api/hr', () => ({
  hrApi: { previewDojCorrection: vi.fn(), applyDojCorrection: vi.fn() },
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { hrApi } from '../../api/hr';
import DojCorrectionModal from './DojCorrectionModal';

afterEach(() => { cleanup(); vi.clearAllMocks(); });
const emp = { id: 'e1', full_name: 'QA Mid', employee_code: 'EMP-0001', date_of_joining: '2026-08-01' };

function fill(date, reason) {
  const { container } = render(<DojCorrectionModal isOpen employee={emp} onClose={() => {}} onSuccess={() => {}} />);
  fireEvent.change(container.querySelector('input[type="date"]'), { target: { value: date } });
  if (reason) fireEvent.change(container.querySelector('textarea'), { target: { value: reason } });
  return container;
}

describe('DojCorrectionModal', () => {
  it('POSTs new_doj + reason and shows the arrears line and warnings', async () => {
    hrApi.applyDojCorrection.mockResolvedValue({ data: {
      id: 'c1', old_doj: '2026-08-01', new_doj: '2026-07-15', amount: '8000.00', kind: 'arrears',
      target_month: 11, target_year: 2026, lines: [{ year: 2026, month: 7, old_payable_days: 0, new_payable_days: 17, delta: '8000.00' }],
      warnings: ['Arrears: ESIC treatment to verify'] } });
    fill('2026-07-15', 'Offer letter');
    fireEvent.click(screen.getByText('Apply correction'));
    await waitFor(() => expect(screen.getByTestId('doj-result')).toBeTruthy());
    expect(hrApi.applyDojCorrection).toHaveBeenCalledWith('e1', { new_doj: '2026-07-15', reason: 'Offer letter' });
    expect(screen.getByText(/Arrears ₹8,000.00/)).toBeTruthy();
    expect(screen.getByText(/ESIC treatment to verify/)).toBeTruthy();
  });

  it('shows the API validation error as returned', async () => {
    hrApi.applyDojCorrection.mockRejectedValue({ response: { status: 400, data: { error: 'The new date of joining is the same as the current one.' } } });
    fill('2026-08-01', 'x');
    fireEvent.click(screen.getByText('Apply correction'));
    await waitFor(() => expect(screen.getByTestId('doj-errors').textContent).toContain('same as the current one'));
  });

  it('shows a recovery with the EPFO warning on preview', async () => {
    hrApi.previewDojCorrection.mockResolvedValue({ data: {
      old_doj: '2026-07-01', new_doj: '2026-08-01', amount: '-5000.00', kind: 'recovery', target_month: 11, target_year: 2026,
      lines: [], warnings: ['Excess PF already remitted must be corrected on the EPFO portal.'] } });
    fill('2026-08-01');
    fireEvent.click(screen.getByText('Preview'));
    await waitFor(() => expect(screen.getByText(/Recovery ₹5,000.00/)).toBeTruthy());
    expect(screen.getByText(/EPFO portal/)).toBeTruthy();
    expect(hrApi.previewDojCorrection).toHaveBeenCalledWith('e1', '2026-08-01');
  });
});
