import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  MagnifyingGlassIcon, 
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import PublicNavbar from '../components/PublicNavbar';
import Seo from '../components/Seo';
import api from '../api/api';
import { listLearnedHsnGst } from '../api/learned_hsn';
import { GST_SLAB_CARDS } from '../utils/gstRates';
import { toast } from 'react-toastify';
import Button from '../components/common/Button';

export default function GSTAndHSNGuide() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('hsn'); // 'hsn' or 'gst'

  const isAuthenticated = !!localStorage.getItem('token');

  const { data: learnedHsn = [] } = useQuery({
    queryKey: ['learned-hsn-gst'],
    queryFn: listLearnedHsnGst,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  // Search HSN codes
  const { data: hsnResults, isLoading: hsnLoading } = useQuery({
    queryKey: ['hsn-search', searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2 || searchType !== 'hsn') return [];
      try {
        const res = await api.get('/references/api/hsn-search/', {
          params: { q: searchTerm, limit: 25 },
        });
        return res.data?.data || [];
      } catch (e) {
        return [];
      }
    },
    enabled: searchTerm.length >= 2 && searchType === 'hsn',
  });

  // Search GST rates
  const { data: gstResults, isLoading: gstLoading } = useQuery({
    queryKey: ['gst-search', searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2 || searchType !== 'gst') return [];
      try {
        const res = await api.get('/references/api/gst-rate/', {
          params: { category: searchTerm, limit: 25 },
        });
        return res.data?.data || [];
      } catch (e) {
        return [];
      }
    },
    enabled: searchTerm.length >= 2 && searchType === 'gst',
  });

  const popularCategories = [
    { label: 'Mobile & Electronics', query: '8517' },
    { label: 'Computer Software', query: '9983' },
    { label: 'Garments & Clothing', query: '6203' },
    { label: 'Medicines', query: '3004' },
    { label: 'Iron & Steel', query: '7214' },
    { label: 'Grains & Food', query: '1006' },
  ];

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`HSN Code ${code} copied!`);
  };

  const content = (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
          HSN Code & GST Rate Finder
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Search over 15,000+ HSN and SAC codes with their applicable GST tax slabs.
        </p>
      </div>

      {/* Search Box */}
      <div className="bento-card p-6 mb-8">
        <div className="flex gap-2.5 mb-5">
          <button
            type="button"
            onClick={() => setSearchType('hsn')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              searchType === 'hsn'
                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow-sm'
                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:text-[var(--text-primary)]'
            }`}
          >
            Search by HSN / Product Name
          </button>
          <button
            type="button"
            onClick={() => setSearchType('gst')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              searchType === 'gst'
                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow-sm'
                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:text-[var(--text-primary)]'
            }`}
          >
            Search by Category / Tax Slab
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              searchType === 'hsn'
                ? 'Type 2+ letters or numbers: e.g. 8517, mobile, cotton, steel...'
                : 'Search category: e.g. software, medicine, transport, dairy...'
            }
            className="input-field !pl-11"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text-secondary)]">Popular:</span>
          {popularCategories.map((cat, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSearchType('hsn');
                setSearchTerm(cat.query);
              }}
              className="px-2.5 py-1 bg-[var(--bg-primary)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors font-medium"
            >
              {cat.label} ({cat.query})
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        {isAuthenticated && learnedHsn.length > 0 && !searchTerm && (
          <div className="space-y-3 mb-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Your saved HSN → GST rates (from invoices):
            </div>
            {learnedHsn.slice(0, 20).map((item, idx) => (
              <div
                key={`learned-${item.hsn_code}-${idx}`}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 flex items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold font-mono text-[var(--text-primary)]">
                    HSN {item.hsn_code}
                  </span>
                  <span className="px-2.5 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--accent-primary)] text-xs rounded-md font-bold">
                    GST {item.gst_rate}%
                  </span>
                  {item.usage_count > 1 ? (
                    <span className="text-xs text-[var(--text-muted)]">used {item.usage_count}×</span>
                  ) : null}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy(item.hsn_code)}
                  icon={DocumentDuplicateIcon}
                >
                  Copy
                </Button>
              </div>
            ))}
          </div>
        )}

        {(hsnLoading || gstLoading) && (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">
            Searching directory...
          </div>
        )}

        {searchType === 'hsn' && hsnResults?.length > 0 && (
          <div className="space-y-3 mb-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Found {hsnResults.length} matching items:
            </div>
            {hsnResults.map((item, idx) => (
              <div
                key={idx}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 flex items-start justify-between gap-4 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold font-mono text-[var(--text-primary)]">
                      HSN {item.code || item.hsn_code}
                    </span>
                    {item.gst_rate && (
                      <span className="px-2.5 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--accent-primary)] text-xs rounded-md font-bold">
                        GST {item.gst_rate}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    {item.desc || item.description || item.name}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy(item.code || item.hsn_code)}
                  icon={DocumentDuplicateIcon}
                >
                  Copy
                </Button>
              </div>
            ))}
          </div>
        )}

        {searchType === 'gst' && gstResults?.length > 0 && (
          <div className="space-y-3 mb-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Matching GST tax slabs:
            </div>
            {gstResults.map((item, idx) => (
              <div
                key={idx}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 flex items-start justify-between gap-4 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {item.category || item.name}
                    </span>
                    <span className="px-2.5 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs rounded-md font-bold">
                      {item.rate || item.gst_rate}%
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5">{item.description || item.sub_category}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GST Slab Reference */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-12">
          {GST_SLAB_CARDS.map((card) => (
            <div
              key={card.rate}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-4 rounded-xl transition-all"
            >
              <div className="text-2xl font-black text-[var(--text-primary)]">{card.rate}</div>
              <div className="text-xs font-bold text-[var(--text-primary)] mt-1">{card.title}</div>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Callout */}
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center shadow-lg">
          <h3 className="text-xl font-bold text-[var(--text-primary)]">
            Auto-fill HSN codes on every bill with Cenvora
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-md mx-auto leading-relaxed">
            Cenvora remembers your product HSN codes and automatically applies the correct CGST, SGST, or IGST rate.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="btn-primary !px-5 !py-2.5"
            >
              Start 14-Day Free Trial
            </Link>
            <Link
              to="/#pricing"
              className="btn-secondary !px-5 !py-2.5"
            >
              View Perpetual Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  if (isAuthenticated) {
    return <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pt-24 transition-colors duration-200">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200">
      <Seo
        title="HSN Code & GST Rate Finder | Cenvora"
        description="Search HSN codes, SAC service accounting codes, and GST tax rate slabs for Indian businesses."
        canonicalPath="/gst-hsn-guide"
      />

      <PublicNavbar
        links={[
          { label: 'Home', href: '/' },
          { label: 'Features', href: '/#features' },
          { label: 'Pricing', href: '/#pricing' },
          { label: 'Contact', href: '/contact' },
        ]}
      />

      <div className="pt-28 sm:pt-36 pb-20">
        {content}
      </div>
    </div>
  );
}
