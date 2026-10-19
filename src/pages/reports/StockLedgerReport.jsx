import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStockLedger } from '../../api/reports';
import { getProducts } from '../../api/inventory';
import { DocumentTextIcon, ArrowDownCircleIcon, ArrowUpCircleIcon, ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function StockLedgerReport() {
    const [selectedProduct, setSelectedProduct] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const { data: productsData } = useQuery({
        queryKey: ['products'],
        queryFn: getProducts
    });

    const products = React.useMemo(() => {
        if (!productsData) return [];
        return Array.isArray(productsData) ? productsData : (productsData.results || productsData.data || []);
    }, [productsData]);

    const { data: ledgerData, isLoading } = useQuery({
        queryKey: ['stock-ledger', selectedProduct, startDate, endDate],
        queryFn: () => getStockLedger(selectedProduct, startDate, endDate),
        enabled: !!selectedProduct
    });

    const ledgerItems = React.useMemo(() => {
        if (!ledgerData) return [];
        const items = ledgerData.items || ledgerData.results || ledgerData.data || [];
        return Array.isArray(items) ? items : [];
    }, [ledgerData]);

    return (
        <>
            <div className="p-6 md:p-10 space-y-8 animate-fade-up">
                <Link to="/reports" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group">
                  <span className="p-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg group-hover:border-[var(--accent-primary)]/40 transition-colors"><ArrowLeftIcon className="w-4 h-4" /></span>
                  <ChartBarIcon className="w-3.5 h-3.5" /> Back to Reports
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Item Cardex / Stock Ledger</h1>
                    <p className="text-[var(--text-secondary)]">Detailed transaction history and running balance for items.</p>
                </div>

                <div className="bento-card p-6 border border-[var(--border-subtle)] flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Select Product</label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="input-field w-full"
                        >
                            <option value="">-- Choose Product --</option>
                            {products?.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="input-field"
                        />
                    </div>
                </div>

                {isLoading && <div className="text-[var(--text-secondary)] text-center py-10">Loading ledger...</div>}

                {!isLoading && selectedProduct && (
                    <div className="bento-card overflow-hidden border border-[var(--border-subtle)]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Date</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Type</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Reference</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Batch</th>
                                    <th className="p-4 text-xs font-bold text-[var(--status-success)] uppercase tracking-wider text-right">In (+)</th>
                                    <th className="p-4 text-xs font-bold text-[var(--status-danger)] uppercase tracking-wider text-right">Out (-)</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledgerItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-[var(--text-muted)]">
                                            <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            No transactions found for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    ledgerItems.map((t) => (
                                        <tr key={t.id} className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-primary)]/50 transition-colors">
                                            <td className="p-4 text-sm text-[var(--text-secondary)] font-mono">{t.date}</td>
                                            <td className="p-4 text-sm text-[var(--text-primary)] font-medium">{t.type}</td>
                                            <td className="p-4 text-sm text-[var(--text-secondary)] font-mono">{t.reference}</td>
                                            <td className="p-4 text-sm text-[var(--text-muted)]">{t.batch || '-'}</td>
                                            <td className="p-4 text-sm text-[var(--status-success)] text-right">
                                                {t.qty_in > 0 ? (
                                                    <span className="flex items-center justify-end gap-1 font-semibold">
                                                        {t.qty_in} <ArrowDownCircleIcon className="w-4 h-4" />
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 text-sm text-[var(--status-danger)] text-right">
                                                {t.qty_out > 0 ? (
                                                    <span className="flex items-center justify-end gap-1 font-semibold">
                                                        {t.qty_out} <ArrowUpCircleIcon className="w-4 h-4" />
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 text-sm text-[var(--text-primary)] font-bold text-right">{t.balance}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
