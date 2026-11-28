import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';

vi.mock('../../api/hr', () => ({
  hrApi: {
    calculateSalaryBreakdown: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import SalaryBreakdownCalculator from './SalaryBreakdownCalculator';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SalaryBreakdownCalculator', () => {
  it('renders without throwing a TDZ ReferenceError on initial mount', () => {
    const { container } = render(
      <SalaryBreakdownCalculator initialMonthlyCtc={50000} />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders without throwing when fixed components exceed monthly CTC', () => {
    const { container } = render(
      <SalaryBreakdownCalculator
        initialMonthlyCtc={50000}
        initialBasicPct={80}
        initialHraPct={50}
      />
    );
    expect(container.textContent).toContain('exceed');
  });
});
