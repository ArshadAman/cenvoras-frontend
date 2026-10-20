import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProductBatches } from '../../api/inventory';
import Pagination from '../../components/common/Pagination';
import { CubeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

export default function BatchListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['batches', search, page],
    queryFn: () => getProductBatches({ search, page }),
  });

  const batches = Array.isArray(data) ? data : data?.results || [];
  const totalPages = data?.total_pages || 1;
  const currentPage = data?.current_page || page;

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: 'Expired', color: 'text-[var(--status-danger)] bg-[var(--status-danger-bg)] border-[var(--status-danger-border)]' };
    if (daysLeft <= 7) return { label: `${daysLeft}d`, color: 'text-[var(--status-danger)] bg-[var(--status-danger-bg)] border-[var(--status-danger-border)]' };
    if (daysLeft <= 30) return { label: `${daysLeft}d`, color: 'text-[var(--status-warning)] bg-[var(--status-warning-bg)] border-[var(--status-warning-border)]' };
    return null;
  };

  return (
    <>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1 flex items-center gap-3">
            <CubeIcon className="w-8 h-8 text-[var(--accent-primary)]" />
            All Batches
          </h1>
          <p className="text-[var(--text-muted)] text-sm">View all product batches with pricing, expiry, and stock information</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by product name..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none transition-all"
          />
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-[var(--text-muted)] text-sm">Loading batches...</div>
          ) : batches.length === 0 ? (
            <div className="p-12 text-center text-[var(--text-muted)] text-sm">
              <CubeIcon className="w-12 h-12 mx-auto mb-3 opacity-40 text-[var(--text-muted)]" />
              <p>No batches found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3.5 text-left">Product</th>
                    <th className="px-5 py-3.5 text-left">Batch #</th>
                    <th className="px-5 py-3.5 text-left">MFG Date</th>
                    <th className="px-5 py-3.5 text-left">Expiry Date</th>
                    <th className="px-5 py-3.5 text-right">MRP</th>
                    <th className="px-5 py-3.5 text-right">Cost</th>
                    <th className="px-5 py-3.5 text-right">Sale Price</th>
                    <th className="px-5 py-3.5 text-left">Status</th>
                    <th className="px-5 py-3.5 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {batches.map((batch) => {
                    const expiryStatus = getExpiryStatus(batch.expiry_date);
                    return (
                      <tr key={batch.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                        <td className="px-5 py-3.5 text-[var(--text-primary)] font-medium">{batch.product_name || '—'}</td>
                        <td className="px-5 py-3.5 text-[var(--text-secondary)] font-mono text-xs">{batch.batch_number}</td>
                        <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs">{batch.manufacturing_date || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-[var(--text-secondary)] text-xs">{batch.expiry_date || '—'}</span>
                          {expiryStatus && (
                            <span className={`ml-2 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${expiryStatus.color}`}>
                              {expiryStatus.label}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right text-[var(--text-secondary)] tabular-nums">{getCurrencySymbol()}{Number(batch.mrp || 0).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3.5 text-right text-[var(--text-muted)] tabular-nums">{getCurrencySymbol()}{Number(batch.cost_price || 0).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3.5 text-right text-[var(--accent-primary)] font-semibold tabular-nums">{getCurrencySymbol()}{Number(batch.sale_price || 0).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3.5">
                          {batch.is_active ? (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold text-[var(--status-success)] bg-[var(--status-success-bg)] border border-[var(--status-success-border)]">Active</span>
                          ) : (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold text-[var(--text-muted)] bg-[var(--border-subtle)]/20 border border-[var(--border-subtle)]">Inactive</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs max-w-[150px] truncate" title={batch.notes}>{batch.notes || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  );
}
