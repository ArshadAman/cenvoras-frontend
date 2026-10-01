import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PopupModal } from 'react-calendly';
import { 
  CheckIcon,
  ArrowRightIcon,
  BoltIcon,
  ArchiveBoxIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
  QrCodeIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import PublicNavbar from '../components/PublicNavbar';
import Seo from '../components/Seo';
import DetailedFeatures from '../components/DetailedFeatures';
import HeroPrismCanvas from '../components/3d/HeroPrismCanvas';

// Odoo-inspired Modular Product Preview Showcase
const ProductShowcase = () => {
  const [activeTab, setActiveTab] = useState('demo');

  const tabs = [
    { id: 'demo', label: 'Billing Demo', icon: BoltIcon, image: '/billcreationdemo.gif' },
    { id: 'dashboard', label: 'Business Dashboard', icon: DocumentChartBarIcon, image: '/dashboard.png' },
    { id: 'sales', label: 'Sales Invoices', icon: BanknotesIcon, image: '/sales.png' },
    { id: 'inventory', label: 'Stock Valuation', icon: ArchiveBoxIcon, image: '/inventory.png' },
  ];

  return (
    <div className="mt-14 sm:mt-18 w-full max-w-5xl mx-auto">
      {/* Modular Tab Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-slate-100 text-slate-950 font-bold shadow-lg shadow-white/5 ring-1 ring-white/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Museum-Grade Glass Browser Frame */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-950/80 backdrop-blur-xl overflow-hidden shadow-2xl shadow-sky-950/20 ring-1 ring-white/10">
        <div className="flex items-center px-4 py-3 bg-slate-900/90 border-b border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 mr-4">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-md border border-slate-800/60 font-mono text-[11px] text-slate-400">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>https://app.cenvora.com</span>
          </div>
        </div>

        <div className="relative min-h-[300px] sm:min-h-[500px] bg-slate-950 flex items-center justify-center">
          {tabs.map((tab) => (
            <img 
              key={tab.id}
              src={tab.image} 
              alt={`Cenvora ${tab.label}`} 
              loading="lazy"
              className={`w-full h-auto object-cover transition-opacity duration-300 ${
                activeTab === tab.id ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Rent vs Own Perpetual License Calculator
const RentVsOwnCalculator = () => {
  const [users, setUsers] = useState(6);

  const saasMonthlyPerUser = 1500;
  const saas3YearCost = users * saasMonthlyPerUser * 12 * 3;
  const cenvora3YearCost = 100000 + (18000 * 3);
  const savings = Math.max(0, saas3YearCost - cenvora3YearCost);

  const formatINR = (val) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
      <div className="max-w-2xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Perpetual Ownership Advantage
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Why rent your business software when you can own it?
        </h3>
        <p className="text-slate-400 text-sm sm:text-base mt-2 leading-relaxed">
          Standard cloud ERPs charge monthly fees for every employee. When you expand your workforce, your monthly costs skyrocket. With Cenvora, you pay once for the software and add unlimited team members at zero extra cost.
        </p>
      </div>

      {/* Slider Control */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 mb-8">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium text-slate-300">
            How many people in your team need access?
          </label>
          <span className="text-base font-bold text-white bg-slate-800 px-3.5 py-1 rounded-xl border border-slate-700">
            {users} Users
          </span>
        </div>
        <input 
          type="range" 
          min="2" 
          max="30" 
          value={users} 
          onChange={(e) => setUsers(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
          <span>2 users (Retail shop)</span>
          <span>15 users</span>
          <span>30 users (Growing distributor)</span>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Typical SaaS Card */}
        <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/50">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Monthly Subscription ERP
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-300 mt-2 font-mono">
            {formatINR(saas3YearCost)}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Total cost over 3 years (at ~₹1,500/user/month).
          </p>
          <ul className="mt-5 space-y-2.5 text-xs text-slate-400 border-t border-slate-800/60 pt-4">
            <li className="flex items-center gap-2">
              <span className="text-rose-400 font-bold">✕</span> Recurring fees that never stop
            </li>
            <li className="flex items-center gap-2">
              <span className="text-rose-400 font-bold">✕</span> Automatic price hikes every time you hire
            </li>
            <li className="flex items-center gap-2">
              <span className="text-rose-400 font-bold">✕</span> You lose your database if you stop paying
            </li>
          </ul>
        </div>

        {/* Cenvora Perpetual Card */}
        <div className="p-6 rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-xl shadow-emerald-950/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Cenvora (Buy Once, Own Forever)
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-2 font-mono">
            {formatINR(cenvora3YearCost)}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Total cost over 3 years (One-time license + ₹18k/yr hosting & AMC).
          </p>
          <ul className="mt-5 space-y-2.5 text-xs text-slate-200 border-t border-slate-800/60 pt-4">
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> One-time license fee with unlimited users
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Flat ₹12,000/year base maintenance
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Your database is 100% yours forever
            </li>
          </ul>
        </div>
      </div>

      {/* Savings Callout */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 font-medium">Estimated 3-Year Savings</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-0.5 font-mono">
            Save {formatINR(savings)}
          </div>
        </div>
        <a
          href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20checked%20the%20pricing%20calculator%20and%20want%20to%20know%20more%20about%20the%20perpetual%20license."
          target="_blank"
          rel="noreferrer"
          className="px-6 py-3 bg-white text-slate-950 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap shadow-md"
        >
          Talk to Us on WhatsApp
        </a>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Cenvora',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android, iOS, Windows, Mac',
      url: siteUrl,
      description: 'Simple GST billing and inventory management software for Indian businesses with one-time perpetual ownership.',
    }
  ];

  return (
    <div className="font-sans text-white bg-[#080C14] min-h-screen selection:bg-sky-500/20 selection:text-sky-300">
      <Seo
        title="Cenvora | Simple GST Billing & Stock Management for India"
        description="Create GST bills in seconds, manage stock, and track customer payments. Buy once, use forever with zero per-user monthly charges."
        canonicalPath="/"
        structuredData={structuredData}
      />

      {/* Ambient Lighting Mesh (No Purple) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-sky-500/10 via-sky-600/5 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-[40%] right-[-100px] w-[500px] h-[500px] bg-gradient-to-b from-emerald-500/10 to-transparent blur-3xl opacity-50" />
        <div className="absolute top-[75%] left-[-100px] w-[500px] h-[500px] bg-gradient-to-b from-cyan-500/10 to-transparent blur-3xl opacity-40" />
      </div>

      <PublicNavbar
        links={[
          { label: 'Features', href: '#features' },
          { label: 'Pricing', href: '#pricing' },
          { label: 'Why Own?', href: '#why-own' },
          { label: 'HSN Lookup', href: '/gst-hsn-guide' },
          { label: 'Contact', href: '/contact' },
        ]}
      />

      {/* 1. Hero Section with Interactive 3D Canvas */}
      <section className="relative z-10 pt-32 sm:pt-40 pb-16 sm:pb-24 px-6 text-center">
        <div className="max-w-5xl mx-auto">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-300 text-xs font-semibold mb-6 shadow-md backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Built for Indian Businesses & GST Precision
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] max-w-4xl mx-auto">
            Fast, modern GST billing & stock management you actually own.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Create professional invoices in seconds, track inventory in real time, and reconcile customer ledgers. One-time perpetual license with zero per-user recurring fees.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsCalendlyOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 bg-white text-slate-950 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all shadow-lg shadow-white/5 active:scale-95"
            >
              Schedule a Live Demo
            </button>

            <a
              href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20would%20like%20to%20see%20a%20quick%20demo%20of%20the%20billing%20software."
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900/90 border border-slate-700 text-white font-medium text-sm rounded-xl hover:bg-slate-800 transition-all backdrop-blur-md active:scale-95"
            >
              Chat on WhatsApp (+91 7205289643)
            </a>

            <Link
              to="/signup"
              className="w-full sm:w-auto px-5 py-3.5 text-slate-400 hover:text-white font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <span>14-Day Free Trial</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {/* Interactive Three.js 3D Floating Prism Modules */}
          <div className="mt-10 sm:mt-14">
            <div className="text-center mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                Interactive 3D System Modules (Move Cursor to Tilt)
              </span>
            </div>
            <HeroPrismCanvas />
          </div>

          {/* Product Interface Showcase Tabs */}
          <ProductShowcase />
        </div>
      </section>

      {/* 2. Core Pillars (Stripe-Grade Glass Cards) */}
      <section id="features" className="relative z-10 py-24 border-t border-slate-900/80 px-6 bg-slate-950/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered for seamless daily operations
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Built for speed, simplicity, and financial clarity—designed for shop owners and distributors, not accountants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="p-7 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md hover:border-sky-500/40 transition-all duration-300 shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-sky-950/80 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-5 group-hover:scale-105 transition-transform">
                <BoltIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">10-Second GST Invoicing</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Create clean GST tax bills with auto-calculated CGST, SGST, and IGST. Auto-fills customer details and prints formal A4 or A5 invoices.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-7 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md hover:border-emerald-500/40 transition-all duration-300 shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
                <ArchiveBoxIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Real-Time Stock Updates</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Stock counts deduct automatically as invoices are generated and replenish when purchase entries are saved. Instant low-stock threshold notifications.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-7 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md hover:border-cyan-500/40 transition-all duration-300 shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-105 transition-transform">
                <DocumentChartBarIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Ledgers & Tax Reports</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Track customer balances, record partial settlements, and export 1-click GSTR-1 and GSTR-3B summaries for your tax consultant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Detailed Features Explorer */}
      <section className="relative z-10 py-24 border-t border-slate-900/80 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Explore the full system
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              From billing to staff permissions, explore every module included in your perpetual license.
            </p>
          </div>

          <DetailedFeatures />
        </div>
      </section>

      {/* 4. Why Own / Rent vs Own Calculator */}
      <section id="why-own" className="relative z-10 py-24 border-t border-slate-900/80 px-6 bg-slate-950/40">
        <div className="max-w-5xl mx-auto">
          <RentVsOwnCalculator />
        </div>
      </section>

      {/* 5. Perpetual License Pricing */}
      <section id="pricing" className="relative z-10 py-24 border-t border-slate-900/80 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Buy the software once. No recurring per-user subscription fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1: Hosted Standard */}
            <div className="p-7 rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tier 1</div>
                <h3 className="text-xl font-bold text-white mt-1">Hosted Standard</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Best for single-business shops and distributors wanting zero setup headaches.
                </p>

                <div className="mt-6 pb-6 border-b border-slate-800">
                  <div className="text-3xl font-extrabold text-white font-mono">₹1,00,000</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">One-time software license</div>

                  <div className="mt-4 p-3.5 bg-slate-950/80 rounded-xl text-xs space-y-1.5 text-slate-400 border border-slate-800/80">
                    <div className="flex justify-between">
                      <span>Base Maintenance (AMC):</span>
                      <span className="text-white font-medium">₹12,000/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cloud Server Hosting:</span>
                      <span>~₹6,000/yr</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-800 text-slate-200 font-semibold">
                      <span>Total Ongoing:</span>
                      <span>₹18,000/yr</span>
                    </div>
                  </div>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Unlimited staff logins and devices
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Full GST billing & stock management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Automated daily cloud backups
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> GST statutory updates & WhatsApp support
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <a
                  href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20am%20interested%20in%20the%20Hosted%20Standard%20plan%20(Rs%201%2C00%2C000)."
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full py-3 text-center bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
                >
                  Inquire on WhatsApp
                </a>
              </div>
            </div>

            {/* Tier 2: White-Label Custom Domain */}
            <div className="p-7 rounded-3xl border-2 border-emerald-500/60 bg-gradient-to-b from-slate-900/95 to-slate-950/95 flex flex-col justify-between relative shadow-2xl shadow-emerald-950/30">
              <div className="absolute -top-3.5 left-6 px-3 py-0.5 bg-emerald-400 text-slate-950 text-[10px] font-black uppercase rounded-full shadow-md">
                Most Popular
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Tier 2</div>
                <h3 className="text-xl font-bold text-white mt-1">White-Label Custom Domain</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Your own website domain (`erp.yourbrand.com`) with your logo and dedicated server.
                </p>

                <div className="mt-6 pb-6 border-b border-slate-800">
                  <div className="text-3xl font-extrabold text-white font-mono">₹1,50,000</div>
                  <div className="text-xs text-slate-400 mt-0.5 font-medium">One-time software license</div>

                  <div className="mt-4 p-3.5 bg-slate-950/90 rounded-xl text-xs space-y-1.5 text-slate-300 border border-slate-800/80">
                    <div className="flex justify-between">
                      <span>Base Maintenance (AMC):</span>
                      <span className="text-white font-medium">₹12,000/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dedicated Server Container:</span>
                      <span>~₹12,000/yr</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-800 text-white font-semibold">
                      <span>Total Ongoing:</span>
                      <span>₹24,000/yr</span>
                    </div>
                  </div>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Your custom domain (`erp.yourcompany.com`)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Your logo on invoice PDFs & customer portal
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Dedicated, isolated server container
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Priority engineer support on WhatsApp
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <a
                  href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20am%20interested%20in%20the%20White-Label%20Custom%20Domain%20plan%20(Rs%201%2C50%2C000)."
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full py-3 text-center bg-white text-slate-950 hover:bg-slate-200 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
                >
                  Deploy on Your Domain
                </a>
              </div>
            </div>

            {/* Tier 3: Self-Hosted / Enterprise */}
            <div className="p-7 rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tier 3</div>
                <h3 className="text-xl font-bold text-white mt-1">Enterprise / Self-Hosted</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  For businesses that want the software installed on their own private cloud or local server.
                </p>

                <div className="mt-6 pb-6 border-b border-slate-800">
                  <div className="text-3xl font-extrabold text-white font-mono">₹2,00,000+</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">One-time software license</div>

                  <div className="mt-4 p-3.5 bg-slate-950/80 rounded-xl text-xs space-y-1.5 text-slate-400 border border-slate-800/80">
                    <div className="flex justify-between">
                      <span>Base Maintenance (AMC):</span>
                      <span className="text-white font-medium">₹12,000/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Server Hosting:</span>
                      <span className="text-emerald-400">₹0 to Cenvora</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-800 text-slate-200 font-semibold">
                      <span>Hosting Paid:</span>
                      <span>Direct to your cloud (AWS/DigitalOcean)</span>
                    </div>
                  </div>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Installed on your own AWS or private server
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Assistance with data migration from Excel
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Custom integration options available
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <button
                  onClick={() => setIsCalendlyOpen(true)}
                  className="block w-full py-3 text-center bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
                >
                  Schedule Consultation
                </button>
              </div>
            </div>
          </div>

          {/* AMC Explanation Note in Plain English */}
          <div className="mt-12 p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md text-xs text-slate-400 leading-relaxed max-w-3xl mx-auto">
            <strong className="text-white block mb-1 text-sm">What does the ₹12,000/year maintenance fee cover?</strong>
            It covers software updates, statutory GST tax calculation adjustments when government rates change, automated backups, and priority support over WhatsApp. Even if you choose not to renew the maintenance fee, your software license and your historical database remain 100% yours forever.
          </div>
        </div>
      </section>

      {/* 6. Frequently Asked Questions */}
      <section className="relative z-10 py-24 border-t border-slate-900/80 px-6 bg-slate-950/40">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4 text-left">
            <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
              <h4 className="text-sm font-bold text-white">Can I import my existing products and customers from Excel?</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Yes. We provide simple Excel and CSV import templates for your item catalog, starting stock counts, customer directory, and opening balances. Our team can also help you import your data during setup.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
              <h4 className="text-sm font-bold text-white">How many devices and team members can use Cenvora?</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Unlimited. You can create logins for cashiers, stock managers, sales staff, and your accountant. Cenvora does not charge per user.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
              <h4 className="text-sm font-bold text-white">What happens if I stop paying the ₹12,000 annual maintenance fee?</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                You never lose access to your software or your data. The license is perpetual. You can continue using your installed version and access all historical records. The maintenance fee is only needed if you want ongoing software updates, new GST features, and WhatsApp technical support.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
              <h4 className="text-sm font-bold text-white">Where is our data stored? Is it private?</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Your data is stored in dedicated, encrypted databases located in Indian data centers. We never sell or share your business data, and your records are completely isolated from other businesses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Bottom CTA */}
      <section className="relative z-10 py-20 border-t border-slate-900/80 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to simplify your billing and stock?
          </h2>
          <p className="mt-3 text-slate-400 text-sm">
            Book a 20-minute screen walkthrough or chat with our team on WhatsApp.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsCalendlyOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 bg-white text-slate-950 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors shadow-md"
            >
              Book a Screen Demo
            </button>
            <a
              href="https://wa.me/917205289643"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-900/90 border border-slate-700 text-white font-medium text-xs rounded-xl hover:bg-slate-800 transition-colors backdrop-blur-md"
            >
              Chat on WhatsApp (+91 7205289643)
            </a>
          </div>
        </div>
      </section>

      {/* 8. Clean Simple Footer */}
      <footer className="relative z-10 py-12 border-t border-slate-900/80 px-6 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora" className="h-6 w-auto" />
            <span>&copy; {new Date().getFullYear()} Cenvora. Simple business software.</span>
          </div>

          <div className="flex flex-wrap gap-5">
            <Link to="/#features" className="hover:text-slate-300 transition-colors">Features</Link>
            <Link to="/#pricing" className="hover:text-slate-300 transition-colors">Pricing</Link>
            <Link to="/gst-hsn-guide" className="hover:text-slate-300 transition-colors">HSN Lookup</Link>
            <Link to="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link to="/sitemap" className="hover:text-slate-300 transition-colors">Sitemap</Link>
          </div>
        </div>
      </footer>

      {/* Calendly Booking Modal */}
      <PopupModal
        url="https://calendly.com/cenvora"
        onModalClose={() => setIsCalendlyOpen(false)}
        open={isCalendlyOpen}
        rootElement={document.getElementById("root")}
      />
    </div>
  );
}
