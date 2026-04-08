import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStockLedger } from '../../api/reports';
import { getProducts } from '../../api/inventory';
import Layout from '../../components/Layout';
import { DocumentTextIcon, ArrowDownCircleIcon, ArrowUpCircleIcon, ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function StockLedgerReport() {
    const [selectedProduct, setSelectedProduct] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: getProducts
    });

    const { data: ledgerData, isLoading } = useQuery({
        queryKey: ['stock-ledger', selectedProduct, startDate, endDate],
        queryFn: () => getStockLedger(selectedProduct, startDate, endDate),
        enabled: !!selectedProduct
    });

    return (
        <Layout>
            <div className="p-6 md:p-10 space-y-8 animate-fade-up">
                <Link to="/reports" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group">
                  <span className="p-1.5 bg-white/5 border border-white/10 rounded-lg group-hover:bg-white/10 transition-colors"><ArrowLeftIcon className="w-4 h-4" /></span>
                  <ChartBarIcon className="w-3.5 h-3.5" /> Back to Reports
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Item Cardex / Stock Ledger</h1>
                    <p className="text-gray-400">Detailed transaction history and running balance for items.</p>
                </div>

                <div className="bento-card p-6 border border-white/10 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Select Product</label>
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
                        <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="input-field"
                        />
                    </div>
                </div>

                {isLoading && <div className="text-white text-center py-10">Loading ledger...</div>}

                {!isLoading && selectedProduct && (
                    <div className="bento-card overflow-hidden border border-white/10">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="p-4 text-sm font-medium text-gray-400">Date</th>
                                    <th className="p-4 text-sm font-medium text-gray-400">Type</th>
                                    <th className="p-4 text-sm font-medium text-gray-400">Reference</th>
                                    <th className="p-4 text-sm font-medium text-gray-400">Batch</th>
                                    <th className="p-4 text-sm font-medium text-green-400 text-right">In (+)</th>
                                    <th className="p-4 text-sm font-medium text-red-400 text-right">Out (-)</th>
                                    <th className="p-4 text-sm font-medium text-white text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledgerData?.items?.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-gray-500">
                                            <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            No transactions found for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    ledgerData?.items?.map((t) => (
                                        <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-sm text-gray-300 font-mono">{t.date}</td>
                                            <td className="p-4 text-sm text-white">{t.type}</td>
                                            <td className="p-4 text-sm text-gray-400 font-mono">{t.reference}</td>
                                            <td className="p-4 text-sm text-gray-500">{t.batch || '-'}</td>
                                            <td className="p-4 text-sm text-green-400 text-right">
                                                {t.qty_in > 0 ? (
                                                    <span className="flex items-center justify-end gap-1">
                                                        {t.qty_in} <ArrowDownCircleIcon className="w-4 h-4" />
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 text-sm text-red-400 text-right">
                                                {t.qty_out > 0 ? (
                                                    <span className="flex items-center justify-end gap-1">
                                                        {t.qty_out} <ArrowUpCircleIcon className="w-4 h-4" />
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 text-sm text-white font-bold text-right">{t.balance}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
}
