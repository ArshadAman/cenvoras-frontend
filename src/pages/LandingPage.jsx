import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PopupModal } from 'react-calendly';
import { 
  CheckIcon,
  ArrowRightIcon,
  BoltIcon,
  ArchiveBoxIcon,
  DocumentChartBarIcon,
  DevicePhoneMobileIcon,
  LockClosedIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import PublicNavbar from '../components/PublicNavbar';
import Seo from '../components/Seo';
import DetailedFeatures from '../components/DetailedFeatures';

// Clean Product Preview Tabs
const ProductShowcase = () => {
  const [activeTab, setActiveTab] = useState('demo');

  const tabs = [
    { id: 'demo', label: 'Billing Demo', image: '/billcreationdemo.gif' },
    { id: 'dashboard', label: 'Business Dashboard', image: '/dashboard.png' },
    { id: 'sales', label: 'Sales Invoices', image: '/sales.png' },
    { id: 'inventory', label: 'Stock Valuation', image: '/inventory.png' },
  ];

  return (
    <div className="mt-12 sm:mt-16 w-full max-w-5xl mx-auto">
      {/* Tab Buttons */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Screenshot Frame */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
        <div className="flex items-center px-4 py-3 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 mr-4">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
          </div>
          <span className="text-zinc-500 font-mono text-[11px]">app.cenvora.com</span>
        </div>

        <div className="relative min-h-[280px] sm:min-h-[460px] bg-zinc-950">
          {tabs.map((tab) => (
            <img 
              key={tab.id}
              src={tab.image} 
              alt={`Cenvora ${tab.label}`} 
              loading="lazy"
              className={`w-full h-auto object-cover transition-opacity duration-200 ${
                activeTab === tab.id ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Clean, Non-AI-Slop Rent vs Own Comparison
const RentVsOwnCalculator = () => {
  const [users, setUsers] = useState(6);

  // Standard SaaS subscription in India averages ₹1,500/user/month
  const saasMonthlyPerUser = 1500;
  const saas3YearCost = users * saasMonthlyPerUser * 12 * 3;

  // Cenvora Hosted Standard: ₹1,00,000 one-time + ₹18,000/yr (₹12k AMC + ₹6k server) for 3 years
  const cenvora3YearCost = 100000 + (18000 * 3);
  const savings = Math.max(0, saas3YearCost - cenvora3YearCost);

  const formatINR = (val) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-10">
      <div className="max-w-2xl mb-8">
        <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Why rent your ERP when you can own it?
        </h3>
        <p className="text-zinc-400 text-sm sm:text-base mt-2 leading-relaxed">
          Most subscription software charges per user, every single month. As your business hires more staff, your bills go through the roof. With Cenvora, you pay once for the software and add as many team members as you need.
        </p>
      </div>

      {/* Slider Control */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 mb-8">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium text-zinc-300">
            How many people in your team need access?
          </label>
          <span className="text-base font-bold text-white bg-zinc-800 px-3 py-1 rounded-lg">
            {users} Users
          </span>
        </div>
        <input 
          type="range" 
          min="2" 
          max="30" 
          value={users} 
          onChange={(e) => setUsers(Number(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-2">
          <span>2 users (Small shop)</span>
          <span>15 users</span>
          <span>30 users (Growing distributor)</span>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Typical SaaS Card */}
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Monthly Subscription ERP
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-zinc-300 mt-2">
            {formatINR(saas3YearCost)}
          </div>
          <p className="text-xs text-zinc-400 mt-1.5">
            Total cost over 3 years (at ~₹1,500/user/month).
          </p>
          <ul className="mt-4 space-y-2 text-xs text-zinc-400 border-t border-zinc-800/60 pt-4">
            <li className="flex items-center gap-2">
              <span className="text-zinc-600">✕</span> Monthly recurring fees that never stop
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zinc-600">✕</span> Price increases every time you hire
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zinc-600">✕</span> You lose access if you stop paying
            </li>
          </ul>
        </div>

        {/* Cenvora Perpetual Card */}
        <div className="p-6 rounded-xl border border-zinc-700 bg-zinc-900/80">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Cenvora (Buy Once, Own Forever)
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-2">
            {formatINR(cenvora3YearCost)}
          </div>
          <p className="text-xs text-zinc-400 mt-1.5">
            Total cost over 3 years (One-time license + ₹18k/yr maintenance & hosting).
          </p>
          <ul className="mt-4 space-y-2 text-xs text-zinc-300 border-t border-zinc-800/60 pt-4">
            <li className="flex items-center gap-2">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> One-time license fee with unlimited users
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> Flat ₹12,000/year base maintenance
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> Your database is 100% yours forever
            </li>
          </ul>
        </div>
      </div>

      {/* Savings Callout */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-zinc-400 font-medium">Estimated 3-Year Savings</div>
          <div className="text-2xl font-bold text-emerald-400 mt-0.5">
            Save {formatINR(savings)}
          </div>
        </div>
        <a
          href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20checked%20the%20pricing%20calculator%20and%20want%20to%20know%20more%20about%20the%20perpetual%20license."
          target="_blank"
          rel="noreferrer"
          className="px-5 py-2.5 bg-white text-zinc-950 font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors whitespace-nowrap"
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
    <div className="font-sans text-white bg-black min-h-screen">
      <Seo
        title="Cenvora | Simple GST Billing & Inventory Software for India"
        description="Create GST bills in seconds, manage stock, and track customer payments. Buy once, use forever with zero per-user monthly charges."
        canonicalPath="/"
        structuredData={structuredData}
      />

      <PublicNavbar
        links={[
          { label: 'Features', href: '#features' },
          { label: 'Pricing', href: '#pricing' },
          { label: 'Why Own?', href: '#why-own' },
          { label: 'HSN Lookup', href: '/gst-hsn-guide' },
          { label: 'Contact', href: '/contact' },
        ]}
      />

      {/* 1. Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Built for Indian Businesses & GST
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            GST billing and stock management that you actually own.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Create professional invoices in seconds, keep your stock counts accurate, and track customer balances. One-time perpetual license with zero per-user monthly fees.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsCalendlyOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 bg-white text-zinc-950 font-semibold text-sm rounded-xl hover:bg-zinc-200 transition-colors shadow-sm"
            >
              Schedule a Live Demo
            </button>

            <a
              href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20would%20like%20to%20see%20a%20quick%20demo%20of%20the%20billing%20software."
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 bg-zinc-900 border border-zinc-800 text-white font-medium text-sm rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Chat on WhatsApp (+91 7205289643)
            </a>

            <Link
              to="/signup"
              className="w-full sm:w-auto px-5 py-3.5 text-zinc-400 hover:text-white font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Try 14-Day Free Trial</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {/* Product Interface Showcase */}
          <ProductShowcase />
        </div>
      </section>

      {/* 2. Core Pillars (Clean 3-Column Layout) */}
      <section id="features" className="py-20 border-t border-zinc-900 px-6 bg-zinc-950/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Everything you need to run daily operations
            </h2>
            <p className="mt-2 text-zinc-400 text-sm sm:text-base">
              Simple tools designed for shop owners and distributors, not accountants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-white mb-4">
                <BoltIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">10-Second GST Invoicing</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Create clean GST tax bills with auto-calculated CGST, SGST, and IGST. Auto-fills customer details and prints formal A4 or A5 invoices.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-white mb-4">
                <ArchiveBoxIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Automatic Stock Updates</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Stock quantities update automatically as you raise bills or enter purchases. Get clear alerts when items drop below reorder levels.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-white mb-4">
                <DocumentChartBarIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Customer Ledgers & Reports</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Keep track of who owes you money, record partial payments, and export GSTR-1 and GSTR-3B summaries for your tax consultant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Detailed Features Explorer */}
      <section className="py-20 border-t border-zinc-900 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Explore the full system
            </h2>
            <p className="mt-2 text-zinc-400 text-sm sm:text-base">
              From billing to staff permissions, explore every module included in your license.
            </p>
          </div>

          <DetailedFeatures />
        </div>
      </section>

      {/* 4. Why Own / Rent vs Own Calculator */}
      <section id="why-own" className="py-20 border-t border-zinc-900 px-6 bg-zinc-950/40">
        <div className="max-w-5xl mx-auto">
          <RentVsOwnCalculator />
        </div>
      </section>

      {/* 5. Perpetual License Pricing */}
      <section id="pricing" className="py-20 border-t border-zinc-900 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-2 text-zinc-400 text-sm sm:text-base">
              Buy the software once. No recurring monthly per-user fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1: Hosted Standard */}
            <div className="p-7 rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Tier 1</div>
                <h3 className="text-xl font-bold text-white mt-1">Hosted Standard</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Best for single-business shops and distributors wanting zero setup headaches.
                </p>

                <div className="mt-6 pb-6 border-b border-zinc-800">
                  <div className="text-3xl font-bold text-white">₹1,00,000</div>
                  <div className="text-xs text-zinc-500 mt-0.5">One-time software license</div>

                  <div className="mt-4 p-3 bg-zinc-900/60 rounded-lg text-xs space-y-1.5 text-zinc-400">
                    <div className="flex justify-between">
                      <span>Base Maintenance (AMC):</span>
                      <span className="text-white font-medium">₹12,000/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cloud Server Hosting:</span>
                      <span>~₹6,000/yr</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-zinc-800 text-zinc-200 font-semibold">
                      <span>Total Ongoing:</span>
                      <span>₹18,000/yr</span>
                    </div>
                  </div>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
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
                    <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> GST updates & WhatsApp support
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <a
                  href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20am%20interested%20in%20the%20Hosted%20Standard%20plan%20(Rs%201%2C00%2C000)."
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full py-2.5 text-center bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs rounded-lg transition-colors"
                >
                  Inquire on WhatsApp
                </a>
              </div>
            </div>

            {/* Tier 2: White-Label Custom Domain */}
            <div className="p-7 rounded-2xl border-2 border-zinc-600 bg-zinc-900/90 flex flex-col justify-between relative shadow-lg">
              <div className="absolute -top-3 left-6 px-2.5 py-0.5 bg-white text-zinc-950 text-[10px] font-bold uppercase rounded-full">
                Most Popular
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Tier 2</div>
                <h3 className="text-xl font-bold text-white mt-1">White-Label Custom Domain</h3>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  Your own website domain (`erp.yourbrand.com`) with your logo and dedicated server.
                </p>

                <div className="mt-6 pb-6 border-b border-zinc-800">
                  <div className="text-3xl font-bold text-white">₹1,50,000</div>
                  <div className="text-xs text-zinc-400 mt-0.5">One-time software license</div>

                  <div className="mt-4 p-3 bg-zinc-950/80 rounded-lg text-xs space-y-1.5 text-zinc-300">
                    <div className="flex justify-between">
                      <span>Base Maintenance (AMC):</span>
                      <span className="text-white font-medium">₹12,000/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dedicated Server Container:</span>
                      <span>~₹12,000/yr</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-zinc-800 text-white font-semibold">
                      <span>Total Ongoing:</span>
                      <span>₹24,000/yr</span>
                    </div>
                  </div>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-zinc-200">
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
                  className="block w-full py-2.5 text-center bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs rounded-lg transition-colors"
                >
                  Deploy on Your Domain
                </a>
              </div>
            </div>

            {/* Tier 3: Self-Hosted / Enterprise */}
            <div className="p-7 rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Tier 3</div>
                <h3 className="text-xl font-bold text-white mt-1">Enterprise / Self-Hosted</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  For businesses that want the software installed on their own private cloud or local server.
                </p>

                <div className="mt-6 pb-6 border-b border-zinc-800">
                  <div className="text-3xl font-bold text-white">₹2,00,000+</div>
                  <div className="text-xs text-zinc-500 mt-0.5">One-time software license</div>

                  <div className="mt-4 p-3 bg-zinc-900/60 rounded-lg text-xs space-y-1.5 text-zinc-400">
                    <div className="flex justify-between">
                      <span>Base Maintenance (AMC):</span>
                      <span className="text-white font-medium">₹12,000/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Server Hosting:</span>
                      <span className="text-emerald-400">₹0 to Cenvora</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-zinc-800 text-zinc-200 font-semibold">
                      <span>Hosting Paid:</span>
                      <span>Direct to your cloud (AWS/DigitalOcean)</span>
                    </div>
                  </div>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
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
                  className="block w-full py-2.5 text-center bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs rounded-lg transition-colors"
                >
                  Schedule Consultation
                </button>
              </div>
            </div>
          </div>

          {/* AMC Explanation Note in Plain English */}
          <div className="mt-10 p-5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-xs text-zinc-400 leading-relaxed max-w-3xl mx-auto">
            <strong className="text-white block mb-1">What does the ₹12,000/year maintenance fee cover?</strong>
            It covers software updates, statutory GST tax calculation adjustments when government rates change, automated backups, and priority support over WhatsApp. Even if you choose not to renew the maintenance fee, your software license and your historical database remain 100% yours forever.
          </div>
        </div>
      </section>

      {/* 6. Frequently Asked Questions */}
      <section className="py-20 border-t border-zinc-900 px-6 bg-zinc-950/40">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4 text-left">
            <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/40">
              <h4 className="text-sm font-semibold text-white">Can I import my existing products and customers from Excel?</h4>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                Yes. We provide simple Excel and CSV import templates for your item catalog, starting stock counts, customer directory, and opening balances. Our team can also help you import your data during setup.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/40">
              <h4 className="text-sm font-semibold text-white">How many devices and team members can use Cenvora?</h4>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                Unlimited. You can create logins for cashiers, stock managers, sales staff, and your accountant. Cenvora does not charge per user.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/40">
              <h4 className="text-sm font-semibold text-white">What happens if I stop paying the ₹12,000 annual maintenance fee?</h4>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                You never lose access to your software or your data. The license is perpetual. You can continue using your installed version and access all historical records. The maintenance fee is only needed if you want ongoing software updates, new GST features, and WhatsApp technical support.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/40">
              <h4 className="text-sm font-semibold text-white">Where is our data stored? Is it private?</h4>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                Your data is stored in dedicated, encrypted databases located in Indian data centers. We never sell or share your business data, and your records are completely isolated from other businesses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Bottom CTA */}
      <section className="py-16 border-t border-zinc-900 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Ready to simplify your billing and stock?
          </h2>
          <p className="mt-2 text-zinc-400 text-sm">
            Book a 20-minute screen walkthrough or chat with our team on WhatsApp.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsCalendlyOpen(true)}
              className="w-full sm:w-auto px-6 py-3 bg-white text-zinc-950 font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Book a Screen Demo
            </button>
            <a
              href="https://wa.me/917205289643"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3 bg-zinc-900 border border-zinc-800 text-white font-medium text-xs rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Chat on WhatsApp (+91 7205289643)
            </a>
          </div>
        </div>
      </section>

      {/* 8. Clean Simple Footer */}
      <footer className="py-10 border-t border-zinc-900 px-6 text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora" className="h-6 w-auto" />
            <span>&copy; {new Date().getFullYear()} Cenvora. Simple business software.</span>
          </div>

          <div className="flex flex-wrap gap-5">
            <Link to="/#features" className="hover:text-zinc-300">Features</Link>
            <Link to="/#pricing" className="hover:text-zinc-300">Pricing</Link>
            <Link to="/gst-hsn-guide" className="hover:text-zinc-300">HSN Lookup</Link>
            <Link to="/contact" className="hover:text-zinc-300">Contact</Link>
            <Link to="/privacy" className="hover:text-zinc-300">Privacy</Link>
            <Link to="/terms" className="hover:text-zinc-300">Terms</Link>
            <Link to="/sitemap" className="hover:text-zinc-300">Sitemap</Link>
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
