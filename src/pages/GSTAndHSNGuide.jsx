import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Layout from '../components/Layout'
import PublicNavbar from '../components/PublicNavbar'
import api from '../api/api'

export default function GSTAndHSNGuide() {
  const [searchParams] = useSearchParams()
  const [signupModal, setSignupModal] = useState({
    open: false,
    hsnCode: null,
    gstRate: null,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState('hsn') // 'hsn' or 'gst'

  const isAuthenticated = !!localStorage.getItem('token');

  // Check URL params
  useEffect(() => {
    const hsn = searchParams.get('hsn')
    const gstRate = searchParams.get('gst_rate')
    if (hsn || gstRate) {
      setSignupModal({ open: true, hsnCode: hsn, gstRate })
    }
  }, [searchParams])

  // Fetch HSN/GST stats
  const { data: statsData } = useQuery({
    queryKey: ['gst-hsn-stats'],
    queryFn: async () => {
      const res = await api.get('/references/api/stats/')
      return res.data?.data || {}
    },
  })

  // Search HSN codes
  const { data: hsnResults, isLoading: hsnLoading } = useQuery({
    queryKey: ['hsn-search', searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2 || searchType !== 'hsn') return []
      const res = await api.get('/references/api/hsn-search/', {
        params: { q: searchTerm, limit: 20 },
      })
      return res.data?.data || []
    },
  })

  // Search GST rates
  const { data: gstResults, isLoading: gstLoading } = useQuery({
    queryKey: ['gst-search', searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2 || searchType !== 'gst') return []
      const res = await api.get('/references/api/gst-rate/', {
        params: { category: searchTerm, limit: 20 },
      })
      return res.data?.data || []
    },
  })

  const results = searchType === 'hsn' ? hsnResults : gstResults
  const isLoading = searchType === 'hsn' ? hsnLoading : gstLoading

  const content = (
    <div className={`min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-6 md:p-12 ${!isAuthenticated ? 'pt-32' : ''}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            GST & HSN Code Reference
          </h1>
          <p className="text-gray-400 text-lg">
            Search HSN codes and GST rates for your products. Use Cenvora to auto-fill invoice details.
          </p>
        </div>

        {/* Stats Cards */}
        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-900/20 border border-purple-500/30 rounded-lg p-6">
              <div className="text-3xl font-bold text-purple-400">{statsData.total_hsn_codes || 50}+</div>
              <p className="text-gray-400 mt-2">HSN Codes Covered</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-900/20 border border-cyan-500/30 rounded-lg p-6">
              <div className="text-3xl font-bold text-cyan-400">{statsData.total_gst_rates || 8}</div>
              <p className="text-gray-400 mt-2">GST Rate Categories</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-green-900/20 border border-green-500/30 rounded-lg p-6">
              <div className="text-3xl font-bold text-green-400">100%</div>
              <p className="text-gray-400 mt-2">Accurate & Updated 2026</p>
            </div>
          </div>
        )}

        {/* Search Tabs */}
        <div className="mb-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setSearchType('hsn'); setSearchTerm('') }}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                searchType === 'hsn'
                  ? 'bg-purple-500/30 border border-purple-500/50 text-purple-300'
                  : 'bg-white/10 border border-white/20 text-gray-400 hover:text-white'
              }`}
            >
              Search HSN Codes
            </button>
            <button
              onClick={() => { setSearchType('gst'); setSearchTerm('') }}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                searchType === 'gst'
                  ? 'bg-cyan-500/30 border border-cyan-500/50 text-cyan-300'
                  : 'bg-white/10 border border-white/20 text-gray-400 hover:text-white'
              }`}
            >
              Search GST Rates
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder={
                searchType === 'hsn'
                  ? 'Search by HSN code or product name... (e.g., "8471" or "Electronics")'
                  : 'Search by category or GST rate... (e.g., "Electronics" or "18%")'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {isLoading && <div className="text-gray-400">Searching...</div>}
          {!isLoading && searchTerm && results?.length === 0 && (
            <div className="text-gray-400">No results found. Try a different search term.</div>
          )}
          {!isLoading && results?.map((item) => (
            <div
              key={`${searchType}-${item.code || item.rate}-${item.slug}`}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer"
              onClick={() => {
                if (searchType === 'hsn') {
                  window.location.href = `/hsn/${item.slug}/`
                } else {
                  window.location.href = `/gst-rate/${item.slug}/`
                }
              }}
            >
              {searchType === 'hsn' ? (
                <div>
                  <div className="font-semibold text-lg">HSN {item.code}</div>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                  {item.category && <p className="text-xs text-gray-500 mt-1">Category: {item.category}</p>}
                </div>
              ) : (
                <div>
                  <div className="font-semibold text-lg">GST {item.rate}% - {item.category}</div>
                  {item.hsn_codes && (
                    <p className="text-gray-400 text-sm">
                      Applicable HSN Codes: {item.hsn_codes.join(', ')}
                    </p>
                  )}
                  {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Featured Links */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <h2 className="text-2xl font-bold mb-6">Popular HSN Codes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { code: '8471', desc: 'Computer Equipment', url: '/hsn/8471-automatic-data-processing-machines/' },
              { code: '8517', desc: 'Telecommunications', url: '/hsn/8517-telephone-sets/' },
              { code: '6204', desc: 'Textiles & Clothing', url: '/hsn/6204-womens-clothing/' },
              { code: '3004', desc: 'Pharmaceuticals', url: '/hsn/3004-medicaments/' },
            ].map((item) => (
              <a
                key={item.code}
                href={item.url}
                className="block bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all"
              >
                <div className="font-semibold">HSN {item.code}</div>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </a>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-4">Ready to generate invoices?</h3>
          <p className="text-gray-400 mb-6">Sign up for Cenvora to auto-fill HSN codes and GST rates</p>
          <button
            onClick={() => window.location.href = '/signup'}
            className="px-8 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-semibold transition-all"
          >
            Start Free Trial
          </button>
        </div>
      </div>
    </div>
  );

  if (isAuthenticated) {
    return <Layout>{content}</Layout>;
  }

  return (
    <div className="min-h-screen bg-black relative">
       <div className="fixed inset-0 bg-grid z-0 pointer-events-none opacity-40"></div>
       <PublicNavbar
        links={[
          { label: 'Home', href: '/' },
          { label: 'HSN Code', href: '/gst-hsn-guide' },
          { label: 'Privacy', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
        ]}
      />
      <div className="relative z-10">
        {content}
      </div>
    </div>
  );
}
