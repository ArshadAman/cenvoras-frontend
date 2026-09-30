import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  MagnifyingGlassIcon, 
  DocumentDuplicateIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import PublicNavbar from '../components/PublicNavbar';
import Seo from '../components/Seo';
import api from '../api/api';
import { toast } from 'react-toastify';

export default function GSTAndHSNGuide() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('hsn'); // 'hsn' or 'gst'

  const isAuthenticated = !!localStorage.getItem('token');

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
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          HSN Code & GST Rate Finder
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Search over 15,000+ HSN and SAC codes with their applicable GST tax slabs.
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-8">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSearchType('hsn')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              searchType === 'hsn'
                ? 'bg-white text-zinc-950 font-semibold'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Search by HSN / Product Name
          </button>
          <button
            onClick={() => setSearchType('gst')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              searchType === 'gst'
                ? 'bg-white text-zinc-950 font-semibold'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Search by Category / Tax Slab
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              searchType === 'hsn'
                ? 'Type 2+ letters or numbers: e.g. 8517, mobile, cotton, steel...'
                : 'Search category: e.g. software, medicine, transport, dairy...'
            }
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          <span>Popular:</span>
          {popularCategories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSearchType('hsn');
                setSearchTerm(cat.query);
              }}
              className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 hover:text-zinc-200 text-zinc-400 rounded transition-colors"
            >
              {cat.label} ({cat.query})
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        {(hsnLoading || gstLoading) && (
          <div className="p-8 text-center text-xs text-zinc-500">
            Searching directory...
          </div>
        )}

        {searchType === 'hsn' && hsnResults?.length > 0 && (
          <div className="space-y-2 mb-10">
            <div className="text-xs text-zinc-500 mb-2">
              Found {hsnResults.length} matching items:
            </div>
            {hsnResults.map((item, idx) => (
              <div
                key={idx}
                className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-white">
                      HSN {item.code || item.hsn_code}
                    </span>
                    {item.gst_rate && (
                      <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-emerald-400 text-xs rounded font-medium">
                        GST {item.gst_rate}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {item.desc || item.description || item.name}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(item.code || item.hsn_code)}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs rounded transition-colors flex items-center gap-1 shrink-0"
                >
                  <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {searchType === 'gst' && gstResults?.length > 0 && (
          <div className="space-y-2 mb-10">
            <div className="text-xs text-zinc-500 mb-2">
              Matching GST tax slabs:
            </div>
            {gstResults.map((item, idx) => (
              <div
                key={idx}
                className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {item.category || item.name}
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded font-medium">
                      {item.rate || item.gst_rate}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{item.description || item.sub_category}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GST Slab Reference */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl">
            <div className="text-xl font-bold text-white">0%</div>
            <div className="text-xs font-medium text-zinc-400 mt-0.5">Nil Rated / Exempt</div>
            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
              Fresh vegetables, grains, milk, salt, and basic healthcare.
            </p>
          </div>
          <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl">
            <div className="text-xl font-bold text-white">5%</div>
            <div className="text-xs font-medium text-zinc-400 mt-0.5">Essentials</div>
            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
              Packaged foods, basic footwear, tea, spices, and medicines.
            </p>
          </div>
          <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl">
            <div className="text-xl font-bold text-white">12% / 18%</div>
            <div className="text-xs font-medium text-zinc-400 mt-0.5">Standard Goods</div>
            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
              Electronics, computers, IT services, capital goods, and restaurants.
            </p>
          </div>
          <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl">
            <div className="text-xl font-bold text-white">28%</div>
            <div className="text-xs font-medium text-zinc-400 mt-0.5">Luxury Goods</div>
            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
              Air conditioners, automobiles, and luxury consumer goods.
            </p>
          </div>
        </div>

        {/* Bottom Callout */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
          <h3 className="text-lg font-bold text-white">
            Auto-fill HSN codes on every bill with Cenvora
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
            Cenvora remembers your product HSN codes and automatically applies the correct CGST, SGST, or IGST rate.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Link
              to="/signup"
              className="px-4 py-2 bg-white text-zinc-950 font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Start 14-Day Free Trial
            </Link>
            <Link
              to="/#pricing"
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium text-xs rounded-lg hover:text-white transition-colors"
            >
              View Perpetual Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  if (isAuthenticated) {
    return <div className="min-h-screen bg-black text-white pt-24">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
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
