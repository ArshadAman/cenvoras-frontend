import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'created', label: 'Created' },
  { key: 'updated', label: 'Updated' },
  { key: 'skipped', label: 'Unchanged' },
  { key: 'failed', label: 'Failed' },
];

const TAB_COLORS = {
  all: 'text-[var(--text-primary)] border-[var(--accent-primary)]',
  created: 'text-emerald-600 dark:text-emerald-400 border-emerald-500',
  updated: 'text-[var(--accent-primary)] border-[var(--accent-primary)]',
  skipped: 'text-[var(--text-secondary)] border-[var(--text-secondary)]',
  failed: 'text-rose-600 dark:text-rose-400 border-rose-500',
};

const BADGE_COLORS = {
  created: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  updated: 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]',
  skipped: 'bg-[var(--bg-primary)] text-[var(--text-secondary)]',
  failed: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
};

const FIELD_LABELS = {
  name: 'Name',
  price: 'Cost Price',
  sale_price: 'Sale Price',
  stock: 'Stock',
  unit: 'Unit',
  tax: 'Tax %',
  hsn_sac_code: 'HSN/SAC',
  manufacturer: 'Manufacturer',
  internal_reference: 'Int. Ref',
  description: 'Description',
  secondary_unit: 'Secondary Unit',
  conversion_factor: 'Conv. Factor',
  low_stock_alert: 'Low Stock Alert',
  warranty_months: 'Warranty (months)',
};

const PAGE_SIZE = 25;

export default function InventoryCsvResultsModal({ details, isOpen, onClose, initialTab, onLocateInTable }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const modalRef = useRef(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const allItems = useMemo(() => {
    if (!details) return [];
    const items = [];
    if (details.created) items.push(...details.created);
    if (details.updated) items.push(...details.updated);
    if (details.skipped) items.push(...details.skipped);
    if (details.failed) {
      items.push(
        ...details.failed.map((e) => ({
          row: e.row,
          name: e.name || '',
          item_code: e.item_code || '',
          status: 'failed',
          errors: e.errors,
        }))
      );
    }
    items.sort((a, b) => (a.row || 0) - (b.row || 0));
    return items;
  }, [details]);

  const tabCounts = useMemo(() => ({
    all: allItems.length,
    created: details?.created?.length || 0,
    updated: details?.updated?.length || 0,
    skipped: details?.skipped?.length || 0,
    failed: details?.failed?.length || 0,
  }), [allItems, details]);

  const filteredItems = useMemo(() => {
    let items = activeTab === 'all' ? allItems : allItems.filter((i) => i.status === activeTab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          (i.name || '').toLowerCase().includes(q) ||
          (i.item_code || '').toLowerCase().includes(q)
      );
    }
    return items;
  }, [allItems, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(
    () => filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredItems, page]
  );

  const handleExportCsv = useCallback(() => {
    const rows = [['Row', 'Item Code', 'Name', 'Status', 'Details']];
    filteredItems.forEach((item) => {
      let detail = '';
      if (item.status === 'updated' && item.changes) {
        detail = item.changes.map((c) => `${c.field}: ${c.old} → ${c.new}`).join('; ');
      } else if (item.status === 'failed' && item.errors) {
        detail = typeof item.errors === 'object' ? JSON.stringify(item.errors) : String(item.errors);
      } else if (item.status === 'created') {
        detail = `Stock: ${item.stock ?? ''}, Cost: ${item.cost_price ?? ''}, Sale: ${item.sale_price ?? ''}`;
      }
      rows.push([
        item.row || '',
        `"${(item.item_code || '').replace(/"/g, '""')}"`,
        `"${(item.name || '').replace(/"/g, '""')}"`,
        item.status || '',
        `"${detail.replace(/"/g, '""')}"`,
      ]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_results_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredItems, activeTab]);

  if (!isOpen || !details) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-up">
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[85vh] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            CSV Import Results
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/15 border border-[var(--border-default)] transition flex items-center gap-1.5"
              title="Export filtered results as CSV"
            >
              <ArrowDownTrayIcon className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-primary)] transition"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition whitespace-nowrap ${
                activeTab === tab.key
                  ? TAB_COLORS[tab.key]
                  : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.key
                    ? BADGE_COLORS[tab.key] || 'bg-[var(--bg-primary)]'
                    : 'bg-[var(--bg-primary)] text-[var(--text-muted)]'
                }`}
              >
                {tabCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-6 py-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name or item code..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--border-focus)] outline-none transition"
            />
          </div>
        </div>

        {/* Results Table */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">
          {paginatedItems.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              {search ? 'No results match your search.' : 'No items in this category.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--bg-surface)] z-10">
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider w-14">
                    Row
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider w-24">
                    Item Code
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider w-24">
                    Status
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Details
                  </th>
                  {onLocateInTable && (
                    <th className="w-10" />
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {paginatedItems.map((item, idx) => (
                  <tr key={`${item.row}-${idx}`} className="hover:bg-[var(--bg-primary)] transition-colors">
                    <td className="py-2.5 px-2 text-[var(--text-muted)] font-mono text-xs">
                      {item.row || '-'}
                    </td>
                    <td className="py-2.5 px-2 text-[var(--text-primary)] font-mono text-xs truncate max-w-[100px]" title={item.item_code}>
                      {item.item_code || '-'}
                    </td>
                    <td className="py-2.5 px-2 text-[var(--text-primary)] font-medium truncate max-w-[200px]" title={item.name}>
                      {item.name || '-'}
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${BADGE_COLORS[item.status] || 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}
                      >
                        {item.status === 'skipped' ? 'unchanged' : item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <ItemDetails item={item} />
                    </td>
                    {onLocateInTable && (
                      <td className="py-2.5 px-1">
                        {(item.name || item.item_code) && (
                          <button
                            onClick={() => onLocateInTable(item.item_code || item.name)}
                            title="Locate in inventory table"
                            className="p-1 rounded hover:bg-[var(--accent-primary)]/15 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition"
                          >
                            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
            <span className="text-xs text-[var(--text-muted)]">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filteredItems.length)} of {filteredItems.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] disabled:opacity-30 transition"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-[var(--text-primary)] px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] disabled:opacity-30 transition"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ItemDetails({ item }) {
  if (item.status === 'updated' && item.changes && item.changes.length > 0) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {item.changes.map((c, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20"
          >
            <span className="font-semibold">{FIELD_LABELS[c.field] || c.field}:</span>
            <span className="line-through opacity-60">{c.old || '(empty)'}</span>
            <span className="mx-0.5">→</span>
            <span className="font-bold">{c.new || '(empty)'}</span>
          </span>
        ))}
      </div>
    );
  }

  if (item.status === 'created') {
    const chips = [];
    if (item.stock != null) chips.push(`Stock: ${item.stock}`);
    if (item.cost_price != null) chips.push(`Cost: ${item.cost_price}`);
    if (item.sale_price != null) chips.push(`Sale: ${item.sale_price}`);
    if (chips.length === 0) return <span className="text-xs text-[var(--text-muted)]">New product</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c, i) => (
          <span
            key={i}
            className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          >
            {c}
          </span>
        ))}
      </div>
    );
  }

  if (item.status === 'failed' && item.errors) {
    const errorStr =
      typeof item.errors === 'string'
        ? item.errors
        : typeof item.errors === 'object'
        ? Object.entries(item.errors)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('; ')
        : String(item.errors);
    return (
      <span className="text-[11px] text-rose-500 dark:text-rose-400 font-medium break-words">
        {errorStr}
      </span>
    );
  }

  if (item.status === 'skipped') {
    return (
      <span className="text-[11px] text-[var(--text-muted)] italic">
        All fields match existing record
      </span>
    );
  }

  return null;
}
