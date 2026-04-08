import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProductBatches } from '../../api/inventory';
import Layout from '../../components/Layout';
import Pagination from '../../components/common/Pagination';
import { CubeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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
    if (daysLeft < 0) return { label: 'Expired', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
    if (daysLeft <= 7) return { label: `${daysLeft}d`, color: 'text-red-400 bg-red-500/10 border-red-500/20' };
    if (daysLeft <= 30) return { label: `${daysLeft}d`, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
    return null;
  };

  return (
    <Layout>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
            <CubeIcon className="w-8 h-8 text-cyan-400" />
            All Batches
          </h1>
          <p className="text-gray-400 text-sm">View all product batches with pricing, expiry, and stock information</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by product name..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:border-purple-500/50 outline-none transition-colors"
          />
        </div>

        {/* Table */}
        <div className="bento-card !p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Loading batches...</div>
          ) : batches.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <CubeIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No batches found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/10">
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Batch #</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">MFG Date</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Expiry Date</th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">MRP</th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Cost</th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Sale Price</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => {
                    const expiryStatus = getExpiryStatus(batch.expiry_date);
                    return (
                      <tr key={batch.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-3 text-white font-medium">{batch.product_name || '—'}</td>
                        <td className="px-5 py-3 text-gray-300 font-mono text-xs">{batch.batch_number}</td>
                        <td className="px-5 py-3 text-gray-400">{batch.manufacturing_date || '—'}</td>
                        <td className="px-5 py-3">
                          <span className="text-gray-300">{batch.expiry_date || '—'}</span>
                          {expiryStatus && (
                            <span className={`ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border ${expiryStatus.color}`}>
                              {expiryStatus.label}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-300">₹{Number(batch.mrp || 0).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3 text-right text-gray-400">₹{Number(batch.cost_price || 0).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3 text-right text-cyan-400 font-medium">₹{Number(batch.sale_price || 0).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3">
                          {batch.is_active ? (
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20">Active</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold text-gray-400 bg-gray-500/10 border border-gray-500/20">Inactive</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs max-w-[150px] truncate" title={batch.notes}>{batch.notes || '—'}</td>
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
    </Layout>
  );
}
