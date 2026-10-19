import React from 'react';

/**
 * Reusable Pagination component with smooth 60fps transitions.
 * Expects the standard paginated response format:
 * { count, next, previous, total_pages, current_page, results }
 */
export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1.5 mt-6 select-none">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 will-change-transform ${
          currentPage <= 1
            ? 'text-[var(--text-muted)] cursor-not-allowed opacity-40'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] active:scale-95'
        }`}
      >
        ← Prev
      </button>

      {/* First page + ellipsis */}
      {pages[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="w-9 h-9 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] transition-all duration-150 active:scale-95"
          >
            1
          </button>
          {pages[0] > 2 && (
            <span className="text-[var(--text-muted)] px-1">…</span>
          )}
        </>
      )}

      {/* Page Numbers */}
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-150 will-change-transform ${
            page === currentPage
              ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold shadow-sm border border-transparent'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] active:scale-95'
          }`}
        >
          {page}
        </button>
      ))}

      {/* Last page + ellipsis */}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="text-[var(--text-muted)] px-1">…</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="w-9 h-9 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] transition-all duration-150 active:scale-95"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 will-change-transform ${
          currentPage >= totalPages
            ? 'text-[var(--text-muted)] cursor-not-allowed opacity-40'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] active:scale-95'
        }`}
      >
        Next →
      </button>
    </div>
  );
}
