import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  MagnifyingGlassIcon, 
  ClipboardDocumentCheckIcon, 
  SparklesIcon, 
  BoltIcon, 
  CheckCircleIcon,
  TagIcon,
  BookOpenIcon,
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
    { label: 'Electronics & Mobile', query: '8517' },
    { label: 'Computer Software & IT', query: '9983' },
    { label: 'Textiles & Garments', query: '6203' },
    { label: 'Pharmaceuticals & Drugs', query: '3004' },
    { label: 'Iron, Steel & Metals', query: '7214' },
    { label: 'Food, Grain & Spices', query: '1006' },
  ];

  const handleCopy = (code, desc) => {
    navigator.clipboard.writeText(code);
    toast.success(`HSN Code ${code} copied to clipboard!`);
  };

  const content = (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono uppercase tracking-wider mb-4">
          <BookOpenIcon className="w-4 h-4" />
          Statutory GST & HSN/SAC Master Directory
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Instant HSN Code & GST Rate Lookup
        </h1>
        <p className="mt-4 text-sm sm:text-base text-gray-400 leading-relaxed">
          Search over 15,000+ Harmonized System of Nomenclature (HSN) and Service Accounting Codes (SAC) with corresponding CGST, SGST, and IGST tax slabs.
        </p>
      </div>

      {/* Search Console */}
      <div className="max-w-3xl mx-auto bg-[#0c1017] border border-white/10 rounded-2xl p-6 shadow-2xl mb-10">
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setSearchType('hsn')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              searchType === 'hsn'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Search by HSN / Product Name
          </button>
          <button
            onClick={() => setSearchType('gst')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              searchType === 'gst'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Search by Category / Tax Slab
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              searchType === 'hsn'
                ? 'Type 2+ characters: e.g. 8517, mobile, cotton, medicine...'
                : 'Search category: e.g. software, textile, dairy, metal...'
            }
            className="w-full bg-[#07090e] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">Popular:</span>
          {popularCategories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSearchType('hsn');
                setSearchTerm(cat.query);
              }}
              className="px-2.5 py-1 bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 text-gray-400 rounded-lg text-xs font-mono transition-colors border border-white/5"
            >
              {cat.label} ({cat.query})
            </button>
          ))}
        </div>
      </div>

      {/* Results Area */}
      <div className="max-w-4xl mx-auto">
        {(hsnLoading || gstLoading) && (
          <div className="p-12 text-center text-gray-400 text-sm font-mono animate-pulse">
            Querying official GST master directory...
          </div>
        )}

        {searchType === 'hsn' && hsnResults?.length > 0 && (
          <div className="space-y-3 mb-12">
            <div className="text-xs font-mono uppercase text-gray-500 font-bold mb-2">
              Found {hsnResults.length} matching codes:
            </div>
            {hsnResults.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#0c1017] border border-white/5 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-cyan-500/30 transition-all group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold font-mono text-cyan-400">
                      HSN {item.code || item.hsn_code}
                    </span>
                    {item.gst_rate && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-md font-mono">
                        GST {item.gst_rate}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                    {item.desc || item.description || item.name}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(item.code || item.hsn_code, item.desc)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-cyan-400 hover:text-black text-gray-300 text-xs font-mono rounded-lg transition-all flex items-center gap-1.5 shrink-0 border border-white/10"
                >
                  <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {searchType === 'gst' && gstResults?.length > 0 && (
          <div className="space-y-3 mb-12">
            <div className="text-xs font-mono uppercase text-gray-500 font-bold mb-2">
              Matching GST Rate Slabs:
            </div>
            {gstResults.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#0c1017] border border-white/5 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-cyan-500/30 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">
                      {item.category || item.name}
                    </span>
                    <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs rounded-md font-mono">
                      Rate: {item.rate || item.gst_rate}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{item.description || item.sub_category}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GST Slab Reference Guide Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-16">
          <div className="bg-[#0c1017] border border-white/5 p-5 rounded-2xl">
            <div className="text-2xl font-extrabold text-white font-mono">0%</div>
            <div className="text-xs font-semibold text-cyan-300 mt-1">Exempt / Nil Rated</div>
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
              Unprocessed food grains, milk, fresh vegetables, salt, educational books, and healthcare services.
            </p>
          </div>
          <div className="bg-[#0c1017] border border-white/5 p-5 rounded-2xl">
            <div className="text-2xl font-extrabold text-white font-mono">5%</div>
            <div className="text-xs font-semibold text-cyan-300 mt-1">Essential Commodities</div>
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
              Packaged food items, footwear under ₹1,000, coal, medicines, economy transport, and tea.
            </p>
          </div>
          <div className="bg-[#0c1017] border border-white/5 p-5 rounded-2xl">
            <div className="text-2xl font-extrabold text-white font-mono">12% / 18%</div>
            <div className="text-xs font-semibold text-cyan-300 mt-1">Standard Goods & IT</div>
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
              IT software, computers, consumer electronics, capital goods, financial services, telecom, restaurants.
            </p>
          </div>
          <div className="bg-[#0c1017] border border-white/5 p-5 rounded-2xl">
            <div className="text-2xl font-extrabold text-white font-mono">28%</div>
            <div className="text-xs font-semibold text-cyan-300 mt-1">Luxury & Demerit</div>
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
              Automobiles, air conditioners, high-end consumer appliances, aerated drinks with cess.
            </p>
          </div>
        </div>

        {/* Conversion Banner */}
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-[#0d1620] to-[#07090e] p-8 md:p-10 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tired of looking up HSN codes manually on every bill?
            </h3>
            <p className="text-gray-300 text-sm mt-3 leading-relaxed">
              Cenvora ERP automatically remembers HSN codes, auto-splits CGST/SGST/IGST, and generates audit-ready GSTR-1 summaries in seconds.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-400/20"
              >
                Test Invoicing on Cloud Sandbox
              </Link>
              <a
                href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20am%20looking%20for%20an%20automated%20GST%20billing%20solution."
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/10 transition-all"
              >
                Inquire on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isAuthenticated) {
    return <div className="min-h-screen bg-[#07080b] text-white pt-24">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-[#07080b] text-white relative selection:bg-cyan-500/30 selection:text-white">
      <Seo
        title="HSN Code & GST Rate Finder | India Tax Directory | Cenvora"
        description="Search HSN codes, SAC service accounting codes, and GST tax rate slabs. Free lookup directory for Indian businesses and accountants."
        canonicalPath="/gst-hsn-guide"
      />
      <div className="fixed inset-0 bg-grid z-0 pointer-events-none opacity-20"></div>
      
      <PublicNavbar
        links={[
          { label: 'Home', href: '/' },
          { label: 'Perpetual Pricing', href: '/#pricing' },
          { label: 'HSN Directory', href: '/gst-hsn-guide' },
          { label: 'Privacy', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
        ]}
      />

      <div className="relative z-10 pt-28 sm:pt-36 pb-20">
        {content}
      </div>
    </div>
  );
}
