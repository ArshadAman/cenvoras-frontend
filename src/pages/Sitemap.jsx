import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HomeIcon, 
  UserPlusIcon, 
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  MapIcon,
  BookOpenIcon,
  CurrencyRupeeIcon,
  ServerStackIcon,
  EnvelopeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import PublicNavbar from '../components/PublicNavbar';
import Seo from '../components/Seo';

export default function Sitemap() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sitemapGroups = [
    {
      category: 'Core Platform & Architecture',
      links: [
        { title: 'Home / Overview', path: '/', desc: 'Perpetual license overview, architecture, and live screen demos.', status: '200 OK' },
        { title: 'Architecture Modules', path: '/#features', desc: 'Detailed breakdown of sales, batch inventory, accounting & HR.', status: '200 OK' },
        { title: 'Rent vs Own ROI Calculator', path: '/#roi-calculator', desc: 'Interactive financial comparison of recurring SaaS vs Perpetual License.', status: '200 OK' },
      ]
    },
    {
      category: 'Commercial & Perpetual License',
      links: [
        { title: 'Perpetual Pricing Matrix', path: '/#pricing', desc: 'Hosted Standard (₹1L), White-Label Custom Domain (₹1.5L), and Enterprise BYOC.', status: '200 OK' },
        { title: 'Executive Enterprise Contact', path: '/contact', desc: 'Book direct architecture walkthrough, WhatsApp desk, and sales engineering.', status: '200 OK' },
      ]
    },
    {
      category: 'Statutory GST & Reference Tools',
      links: [
        { title: 'HSN & SAC Code Master Directory', path: '/gst-hsn-guide', desc: '15,000+ searchable HSN codes and GST slab references.', status: '200 OK' },
      ]
    },
    {
      category: 'Legal, Compliance & Data Sovereignty',
      links: [
        { title: 'Privacy Policy & DPDP Act 2023', path: '/privacy', desc: 'Data sovereignty guarantees, database isolation, and zero-monetization clauses.', status: '200 OK' },
        { title: 'Terms of Service & License Grant', path: '/terms', desc: 'Perpetual software license agreement, flat ₹12k/yr AMC scope, and SLA terms.', status: '200 OK' },
      ]
    },
    {
      category: 'User Access & Cloud Sandbox',
      links: [
        { title: 'Operator / Admin Login', path: '/login', desc: 'Secure authentication gateway for authorized enterprise tenant operators.', status: '200 OK' },
        { title: '14-Day Cloud Sandbox Registration', path: '/signup', desc: 'Test drive Cenvora ERP with full sample data before perpetual deployment.', status: '200 OK' },
      ]
    }
  ];

  return (
    <div className="min-h-screen font-sans text-white bg-[#07080b] selection:bg-cyan-500/30 selection:text-white">
      <Seo
        title="Public Sitemap & Route Directory | Cenvora ERP"
        description="Comprehensive index of public pages, commercial architecture guides, statutory tax reference directories, and user portals on Cenvora."
        canonicalPath="/sitemap"
      />
      
      {/* Background Texture Grid */}
      <div className="fixed inset-0 bg-grid z-0 pointer-events-none opacity-20"></div>

      <PublicNavbar
        links={[
          { label: 'Home', href: '/' },
          { label: 'Perpetual Pricing', href: '/#pricing' },
          { label: 'HSN Directory', href: '/gst-hsn-guide' },
          { label: 'Privacy', href: '/privacy' },
          { label: 'Contact', href: '/contact' },
        ]}
      />

      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-32 sm:pt-40">
        <div className="mb-12 border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono text-cyan-300 uppercase tracking-wider mb-4">
            <MapIcon className="w-4 h-4" />
            Static Route Map
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white flex items-center gap-4">
            System Sitemap & Directory
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-400">
            Complete structural index of all public endpoints, statutory tools, legal covenants, and cloud sandbox portals.
          </p>
        </div>

        {/* Sitemap Groups */}
        <div className="space-y-10">
          {sitemapGroups.map((group, gIdx) => (
            <div key={gIdx} className="bg-[#0c1017] border border-white/10 rounded-2xl p-6 sm:p-8">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                {group.category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.links.map((link, lIdx) => (
                  <Link
                    key={lIdx}
                    to={link.path}
                    className="p-4 bg-[#07090e] border border-white/5 rounded-xl hover:border-cyan-500/40 hover:bg-white/[0.02] transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                          {link.title}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] rounded">
                          {link.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{link.desc}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/5 font-mono text-[11px] text-gray-500 flex items-center gap-1 group-hover:text-cyan-400 transition-colors">
                      <span>GET</span> {link.path} &rarr;
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link to="/" className="text-xs font-mono text-gray-500 hover:text-cyan-400 transition-colors">
            &larr; Back to Cenvora Home
          </Link>
        </div>
      </main>
    </div>
  );
}
