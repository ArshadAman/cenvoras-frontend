import { useEffect, useMemo, useState } from 'react';

const DEFAULT_NO_LOADING_MS = 300;
const DEFAULT_PROGRESS_THRESHOLD_MS = 3000;

/**
 * Centralized loading display policy:
 * - under 300ms: show nothing
 * - 300ms..3s: spinner/skeleton (caller chooses)
 * - over 3s: progress-style indicator
 */
export function useLoadingPolicy(isLoading, options = {}) {
  const noLoadingMs = options.noLoadingMs ?? DEFAULT_NO_LOADING_MS;
  const progressThresholdMs = options.progressThresholdMs ?? DEFAULT_PROGRESS_THRESHOLD_MS;

  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setElapsedMs(0);
      return;
    }

    const startedAt = Date.now();
    const tick = () => setElapsedMs(Date.now() - startedAt);
    tick();
    const interval = window.setInterval(tick, 120);

    return () => window.clearInterval(interval);
  }, [isLoading]);

  return useMemo(() => {
    const visible = isLoading && elapsedMs >= noLoadingMs;
    const phase = !visible
      ? 'none'
      : elapsedMs >= progressThresholdMs
        ? 'progress'
        : 'loading';

    return {
      visible,
      phase,
      elapsedMs,
      shouldShowNothing: !visible,
      shouldShowSpinner: phase === 'loading',
      shouldShowProgress: phase === 'progress',
    };
  }, [isLoading, elapsedMs, noLoadingMs, progressThresholdMs]);
}
