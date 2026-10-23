/** Shared list-table header tokens (sales invoice list is the source of truth). */
export const LIST_THEAD = "bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]";

export const LIST_TH =
  "relative px-3.5 py-3 text-center text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider select-none border-r border-[var(--border-subtle)] last:border-r-0";

export const LIST_TH_SORTABLE = `${LIST_TH} cursor-pointer hover:text-[var(--text-primary)] transition-colors`;

export const LIST_TH_CUSTOMER =
  "relative px-3.5 py-3 text-left text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider select-none border-r border-[var(--border-subtle)] last:border-r-0 cursor-pointer hover:text-[var(--text-primary)] transition-colors";

export const LIST_TH_LABEL = "flex items-center justify-center gap-1.5 truncate";

export const LIST_TH_LABEL_LEFT = "flex items-center justify-start gap-1.5 truncate";

export const LIST_TD =
  "px-3.5 py-3.5 whitespace-nowrap text-center border-r border-[var(--border-subtle)] last:border-r-0";

export const LIST_TD_AMOUNT =
  "px-3.5 py-3.5 whitespace-nowrap text-right border-r border-[var(--border-subtle)] last:border-r-0";

export const LIST_TD_CUSTOMER =
  "px-3.5 py-3.5 whitespace-nowrap text-left border-r border-[var(--border-subtle)] last:border-r-0";
