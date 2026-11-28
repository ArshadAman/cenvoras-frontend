import { useLoadingPolicy } from '../hooks/useLoadingPolicy';

export default function Loader() {
  const { visible, shouldShowProgress } = useLoadingPolicy(true);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 w-full max-w-xs px-6 py-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl">
        <div className="w-10 h-10 border-[3px] border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
        {shouldShowProgress && (
          <div className="w-full">
            <div className="h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
              <div className="h-full w-2/3 bg-[var(--accent-primary)] animate-pulse rounded-full" />
            </div>
            <p className="mt-2.5 text-center text-xs font-medium text-[var(--text-secondary)]">Preparing your workspace…</p>
          </div>
        )}
      </div>
    </div>
  )
}