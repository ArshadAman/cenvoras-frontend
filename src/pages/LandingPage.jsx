import React, { useState, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { PopupModal } from 'react-calendly';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckIcon,
  ArrowRightIcon,
  BoltIcon,
  ArchiveBoxIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
  QrCodeIcon,
  BanknotesIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import PublicNavbar from '../components/PublicNavbar';
import Seo from '../components/Seo';
import DetailedFeatures from '../components/DetailedFeatures';

const HeroPrismCanvas = React.lazy(() => import('../components/3d/HeroPrismCanvas'));

// Framer Motion reveal wrapper
const Reveal = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

// Trust Marquee Strip
const TrustMarquee = () => {
  const items = [
    '50+ businesses running live',
    'GST-compliant invoicing',
    'No per-user monthly charges',
    'India data centers only',
    'Unlimited staff logins',
    'One-time perpetual license',
  ];
  const doubled = [...items, ...items];
  return (
    <div className="relative z-10 overflow-hidden border-y border-slate-800/60 py-4 bg-slate-950/60">
      <div className="flex gap-10 animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-xs font-medium text-slate-400 tracking-wide">
            <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

// Product Showcase with animated tab indicator
const ProductShowcase = () => {
  const [activeTab, setActiveTab] = useState('demo');

  const tabs = [
    { id: 'demo', label: 'Billing Demo', icon: BoltIcon, image: '/billcreationdemo.gif' },
    { id: 'dashboard', label: 'Dashboard', icon: DocumentChartBarIcon, image: '/dashboard.png' },
    { id: 'sales', label: 'Sales Invoices', icon: BanknotesIcon, image: '/sales.png' },
    { id: 'inventory', label: 'Stock Valuation', icon: ArchiveBoxIcon, image: '/inventory.png' },
  ];

  return (
    <Reveal className="mt-16 sm:mt-20 w-full max-w-5xl mx-auto">
      {/* Tab Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'text-slate-950 font-bold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/80'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-slate-100 rounded-xl shadow-lg shadow-white/5 ring-1 ring-white/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Browser Frame */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-950/80 backdrop-blur-xl overflow-hidden shadow-2xl shadow-sky-950/20 ring-1 ring-white/10">
        <div className="flex items-center px-4 py-3 bg-slate-900/90 border-b border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 mr-4">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
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
    </Reveal>
  );
};

// Rent vs Own Calculator
const RentVsOwnCalculator = () => {
  const [users, setUsers] = useState(6);

  const saasMonthlyPerUser = 1500;
  const saas3YearCost = users * saasMonthlyPerUser * 12 * 3;
  const cenvora3YearCost = 100000 + (18000 * 3);
  const savings = Math.max(0, saas3YearCost - cenvora3YearCost);

  const formatINR = (val) => '₹' + Math.round(val).toLocaleString('en-IN');

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
      <div className="max-w-2xl mb-8">
        <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Why rent your business software when you can own it?
        </h3>
        <p className="text-slate-400 text-sm sm:text-base mt-3 leading-relaxed font-body">
          Monthly subscription ERPs charge per employee. When your team grows, your costs skyrocket. With Cenvora, you pay once and add unlimited team members at zero extra cost.
        </p>
      </div>

      {/* Slider */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 mb-8">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium text-slate-300 font-body">
            How many people need access?
          </label>
          <span className="text-base font-bold text-white bg-slate-800 px-3.5 py-1 rounded-xl border border-slate-700 font-mono">
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
          <span>2 users</span>
          <span>15 users</span>
          <span>30 users</span>
        </div>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/50">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monthly Subscription ERP</div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-300 mt-2 font-mono">{formatINR(saas3YearCost)}</div>
          <p className="text-xs text-slate-400 mt-1.5">Total cost over 3 years (at ~₹1,500/user/month).</p>
          <ul className="mt-5 space-y-2.5 text-xs text-slate-400 border-t border-slate-800/60 pt-4">
            <li className="flex items-center gap-2"><span className="text-rose-400 font-bold">✕</span> Recurring fees that never stop</li>
            <li className="flex items-center gap-2"><span className="text-rose-400 font-bold">✕</span> Price hikes every time you hire</li>
            <li className="flex items-center gap-2"><span className="text-rose-400 font-bold">✕</span> Lose your database if you stop paying</li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-xl shadow-emerald-950/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Cenvora (Buy Once, Own Forever)</div>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-2 font-mono">{formatINR(cenvora3YearCost)}</div>
          <p className="text-xs text-slate-400 mt-1.5">Total cost over 3 years (One-time license + ₹18k/yr hosting & AMC).</p>
          <ul className="mt-5 space-y-2.5 text-xs text-slate-200 border-t border-slate-800/60 pt-4">
            <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> One-time license with unlimited users</li>
            <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Flat ₹12,000/year base maintenance</li>
            <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Your database is 100% yours forever</li>
          </ul>
        </div>
      </div>

      {/* Savings */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 font-medium">Estimated 3-Year Savings</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-0.5 font-mono">Save {formatINR(savings)}</div>
        </div>
        <a
          href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20checked%20the%20pricing%20calculator%20and%20want%20to%20know%20more%20about%20the%20perpetual%20license."
          target="_blank"
          rel="noreferrer"
          className="px-6 py-3 bg-white text-slate-950 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap shadow-md active:scale-95"
        >
          Talk to Us on WhatsApp
        </a>
      </div>
    </div>
  );
};

// Animated FAQ Accordion
const FAQ_ITEMS = [
  {
    q: 'Can I import my existing products and customers from Excel?',
    a: 'Yes. We provide simple Excel and CSV import templates for your item catalog, starting stock counts, customer directory, and opening balances. Our team can also help you import your data during setup.',
  },
  {
    q: 'How many devices and team members can use Cenvora?',
    a: 'Unlimited. You can create logins for cashiers, stock managers, sales staff, and your accountant. Cenvora does not charge per user.',
  },
  {
    q: 'What happens if I stop paying the ₹12,000 annual maintenance fee?',
    a: 'You never lose access to your software or your data. The license is perpetual. You can continue using your installed version and access all historical records. The maintenance fee is only needed if you want ongoing software updates, new GST features, and WhatsApp technical support.',
  },
  {
    q: 'Where is our data stored? Is it private?',
    a: 'Your data is stored in dedicated, encrypted databases located in Indian data centers. We never sell or share your business data, and your records are completely isolated from other businesses.',
  },
];

const FaqAccordion = () => {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div className="space-y-3 text-left">
      {FAQ_ITEMS.map((item, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div key={idx} className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md overflow-hidden">
            <button
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="w-full flex items-center justify-between p-6 text-left cursor-pointer group"
            >
              <h3 className="text-sm font-bold text-white pr-4 group-hover:text-sky-300 transition-colors">{item.q}</h3>
              <ChevronDownIcon className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-6 text-xs text-slate-400 leading-relaxed font-body">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

// ======= Main Landing Page =======
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
      description: 'GST billing and stock management software for Indian businesses. One-time perpetual license, unlimited users.',
      offers: {
        '@type': 'Offer',
        price: '100000',
        priceCurrency: 'INR',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ];

  return (
    <div className="font-body text-white bg-[#080C14] min-h-screen selection:bg-sky-500/20 selection:text-sky-300">
      <Seo
        title="Cenvora — GST Billing & Stock Software for India"
        description="Cenvora is a one-time GST billing and stock management software for Indian businesses. Create invoices, track inventory, and manage customer ledgers — no monthly fees."
        canonicalPath="/"
        structuredData={structuredData}
      />

      {/* Ambient Lighting Mesh */}
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

      {/* ─── 1. HERO — Split Layout (Left text / Right 3D) ─── */}
      <section className="relative z-10 pt-28 sm:pt-36 pb-12 sm:pb-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left Column — Copy */}
          <div className="flex-1 max-w-xl lg:max-w-none">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]"
            >
              Own your billing software.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">Forever.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 text-base sm:text-lg text-slate-400 max-w-lg leading-relaxed"
            >
              GST invoices, live stock, customer ledgers. One price. No monthly traps.
            </motion.p>

            {/* CTAs — 1 primary + 1 ghost */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-col sm:flex-row items-start gap-3"
            >
              <button
                onClick={() => setIsCalendlyOpen(true)}
                className="px-7 py-3.5 bg-white text-slate-950 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all shadow-lg shadow-white/5 active:scale-[0.97] cursor-pointer"
              >
                Book a Free Demo
              </button>

              <a
                href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20would%20like%20to%20see%20a%20quick%20demo%20of%20the%20billing%20software."
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 bg-slate-900/90 border border-slate-700 text-white font-medium text-sm rounded-xl hover:bg-slate-800 transition-all backdrop-blur-md active:scale-[0.97] flex items-center gap-2"
              >
                WhatsApp Us
                <ArrowRightIcon className="w-4 h-4" />
              </a>
            </motion.div>

            {/* Trust micro-strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 font-medium"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                50+ businesses live
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                No monthly fees
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                India-hosted data
              </span>
            </motion.div>
          </div>

          {/* Right Column — 3D Canvas */}
          <div className="flex-1 w-full lg:w-auto">
            <Suspense fallback={<div className="h-[420px] animate-pulse bg-slate-900/40 rounded-3xl" />}>
              <HeroPrismCanvas />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ─── Trust Marquee Strip ─── */}
      <TrustMarquee />

      {/* ─── 2. CORE PILLARS — Asymmetric Bento Grid ─── */}
      <section id="features" className="relative z-10 py-24 px-6 bg-slate-950/40">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="max-w-2xl mb-14">
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Everything your business runs on
              </h2>
              <p className="mt-3 text-slate-400 text-sm sm:text-base font-body">
                Made for shop owners and distributors — not accountants.
              </p>
            </div>
          </Reveal>

          {/* Bento: 1 large left + 2 stacked right */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {/* Large cell */}
            <Reveal className="md:col-span-3 p-8 rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/60 to-slate-950/80 backdrop-blur-md hover:border-sky-500/40 transition-all duration-300 shadow-xl group">
              <div className="w-14 h-14 rounded-xl bg-sky-950/80 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-6 group-hover:scale-105 transition-transform">
                <BoltIcon className="w-7 h-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">10-Second GST Invoicing</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md font-body">
                Create clean GST tax bills with auto-calculated CGST, SGST, and IGST. Auto-fills customer details and prints formal A4 or A5 invoices with your branding.
              </p>
            </Reveal>

            {/* 2 stacked right */}
            <div className="md:col-span-2 flex flex-col gap-5">
              <Reveal delay={0.1} className="flex-1 p-7 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md hover:border-emerald-500/40 transition-all duration-300 shadow-xl group">
                <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                  <ArchiveBoxIcon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-1.5">Real-Time Stock Updates</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-body">
                  Stock deducts as invoices are generated. Low-stock alerts keep you ahead.
                </p>
              </Reveal>

              <Reveal delay={0.2} className="flex-1 p-7 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md hover:border-cyan-500/40 transition-all duration-300 shadow-xl group">
                <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
                  <DocumentChartBarIcon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-1.5">Ledgers & Tax Reports</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-body">
                  Track customer balances, record settlements, and export GSTR-1 and GSTR-3B summaries.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. PRODUCT SHOWCASE (Tabs) ─── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center mb-4">
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                See the whole system
              </h2>
              <p className="mt-3 text-slate-400 text-sm sm:text-base font-body">
                From billing to staff permissions — every module included in your perpetual license.
              </p>
            </div>
          </Reveal>
          <ProductShowcase />
        </div>
      </section>

      {/* ─── 4. DETAILED FEATURES EXPLORER ─── */}
      <section className="relative z-10 py-24 border-t border-slate-900/80 px-6 bg-slate-950/40">
        <div className="max-w-5xl mx-auto">
          <DetailedFeatures />
        </div>
      </section>

      {/* ─── 5. WHY OWN / RENT VS OWN CALCULATOR ─── */}
      <section id="why-own" className="relative z-10 py-24 border-t border-slate-900/80 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <RentVsOwnCalculator />
          </Reveal>
        </div>
      </section>

      {/* ─── 6. PRICING ─── */}
      <section id="pricing" className="relative z-10 py-24 border-t border-slate-900/80 px-6 bg-slate-950/40">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                One price. Yours forever.
              </h2>
              <p className="mt-3 text-slate-400 text-sm sm:text-base font-body">
                Buy the software once. No recurring per-user subscription fees.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1 */}
            <Reveal delay={0}>
              <div className="h-full p-7 rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-all">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tier 1</div>
                  <h3 className="font-display text-xl font-bold text-white mt-1">Hosted Standard</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed font-body">
                    Best for single-business shops and distributors wanting zero setup headaches.
                  </p>

                  <div className="mt-6 pb-6 border-b border-slate-800">
                    <div className="text-3xl font-extrabold text-white font-mono">₹1,00,000</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">One-time software license</div>
                    <div className="mt-4 p-3.5 bg-slate-950/80 rounded-xl text-xs space-y-1.5 text-slate-400 border border-slate-800/80">
                      <div className="flex justify-between"><span>Base Maintenance (AMC):</span><span className="text-white font-medium">₹12,000/yr</span></div>
                      <div className="flex justify-between"><span>Cloud Server Hosting:</span><span>~₹6,000/yr</span></div>
                      <div className="flex justify-between pt-1.5 border-t border-slate-800 text-slate-200 font-semibold"><span>Total Ongoing:</span><span>₹18,000/yr</span></div>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Unlimited staff logins and devices</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Full GST billing & stock management</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Automated daily cloud backups</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> GST statutory updates & WhatsApp support</li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <a
                    href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20am%20interested%20in%20the%20Hosted%20Standard%20plan%20(Rs%201%2C00%2C000)."
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full py-3 text-center bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm active:scale-[0.97]"
                  >
                    Inquire on WhatsApp
                  </a>
                </div>
              </div>
            </Reveal>

            {/* Tier 2: Popular */}
            <Reveal delay={0.1}>
              <div className="h-full p-7 rounded-3xl border-2 border-emerald-500/60 bg-gradient-to-b from-slate-900/95 to-slate-950/95 flex flex-col justify-between relative shadow-2xl shadow-emerald-950/30">
                <div className="absolute -top-3.5 left-6 px-3 py-0.5 bg-emerald-400 text-slate-950 text-[10px] font-black uppercase rounded-full shadow-md">
                  Most Popular
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Tier 2</div>
                  <h3 className="font-display text-xl font-bold text-white mt-1">White-Label Custom Domain</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed font-body">
                    Your own website domain (erp.yourbrand.com) with your logo and dedicated server.
                  </p>

                  <div className="mt-6 pb-6 border-b border-slate-800">
                    <div className="text-3xl font-extrabold text-white font-mono">₹1,50,000</div>
                    <div className="text-xs text-slate-400 mt-0.5 font-medium">One-time software license</div>
                    <div className="mt-4 p-3.5 bg-slate-950/90 rounded-xl text-xs space-y-1.5 text-slate-300 border border-slate-800/80">
                      <div className="flex justify-between"><span>Base Maintenance (AMC):</span><span className="text-white font-medium">₹12,000/yr</span></div>
                      <div className="flex justify-between"><span>Dedicated Server Container:</span><span>~₹12,000/yr</span></div>
                      <div className="flex justify-between pt-1.5 border-t border-slate-800 text-white font-semibold"><span>Total Ongoing:</span><span>₹24,000/yr</span></div>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-200">
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Your custom domain (erp.yourcompany.com)</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Your logo on invoice PDFs & customer portal</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Dedicated, isolated server container</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Priority engineer support on WhatsApp</li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <a
                    href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20am%20interested%20in%20the%20White-Label%20Custom%20Domain%20plan%20(Rs%201%2C50%2C000)."
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full py-3 text-center bg-white text-slate-950 hover:bg-slate-200 font-bold text-xs rounded-xl transition-all shadow-md active:scale-[0.97]"
                  >
                    Deploy on Your Domain
                  </a>
                </div>
              </div>
            </Reveal>

            {/* Tier 3 */}
            <Reveal delay={0.2}>
              <div className="h-full p-7 rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-all">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tier 3</div>
                  <h3 className="font-display text-xl font-bold text-white mt-1">Enterprise / Self-Hosted</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed font-body">
                    For businesses that want the software on their own private cloud or local server.
                  </p>

                  <div className="mt-6 pb-6 border-b border-slate-800">
                    <div className="text-3xl font-extrabold text-white font-mono">₹2,00,000+</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">One-time software license</div>
                    <div className="mt-4 p-3.5 bg-slate-950/80 rounded-xl text-xs space-y-1.5 text-slate-400 border border-slate-800/80">
                      <div className="flex justify-between"><span>Base Maintenance (AMC):</span><span className="text-white font-medium">₹12,000/yr</span></div>
                      <div className="flex justify-between"><span>Server Hosting:</span><span className="text-emerald-400">₹0 to Cenvora</span></div>
                      <div className="flex justify-between pt-1.5 border-t border-slate-800 text-slate-200 font-semibold"><span>Hosting Paid:</span><span>Direct to your cloud (AWS/DigitalOcean)</span></div>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Installed on your own AWS or private server</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Assistance with data migration from Excel</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> Custom integration options available</li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    onClick={() => setIsCalendlyOpen(true)}
                    className="block w-full py-3 text-center bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm cursor-pointer active:scale-[0.97]"
                  >
                    Schedule Consultation
                  </button>
                </div>
              </div>
            </Reveal>
          </div>

          {/* AMC Note */}
          <Reveal className="mt-12 p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md text-xs text-slate-400 leading-relaxed max-w-3xl mx-auto font-body">
            <strong className="text-white block mb-1 text-sm font-display">What does the ₹12,000/year maintenance fee cover?</strong>
            It covers software updates, statutory GST tax calculation adjustments when government rates change, automated backups, and priority support over WhatsApp. Even if you choose not to renew the maintenance fee, your software license and your historical database remain 100% yours forever.
          </Reveal>
        </div>
      </section>

      {/* ─── 7. FAQ ─── */}
      <section className="relative z-10 py-24 border-t border-slate-900/80 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>
          </Reveal>
          <FaqAccordion />
        </div>
      </section>

      {/* ─── 8. FINAL CTA ─── */}
      <section className="relative z-10 py-20 border-t border-slate-900/80 px-6 text-center bg-slate-950/40">
        <Reveal>
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              See it live in 20 minutes.
            </h2>
            <p className="mt-3 text-slate-400 text-sm font-body">
              Book a screen walkthrough or chat with our team on WhatsApp.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setIsCalendlyOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 bg-white text-slate-950 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors shadow-md cursor-pointer active:scale-[0.97]"
              >
                Book a Free Demo
              </button>
              <a
                href="https://wa.me/917205289643"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-7 py-3.5 bg-slate-900/90 border border-slate-700 text-white font-medium text-sm rounded-xl hover:bg-slate-800 transition-colors backdrop-blur-md active:scale-[0.97]"
              >
                Chat on WhatsApp
              </a>
            </div>

            {/* Trial link — moved from hero to here */}
            <div className="mt-5">
              <Link
                to="/signup"
                className="text-slate-500 hover:text-white text-xs font-medium transition-colors inline-flex items-center gap-1.5"
              >
                Or start a 14-day free trial <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── 9. FOOTER — 3-Column ─── */}
      <footer className="relative z-10 py-14 border-t border-slate-900/80 px-6 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
          {/* Col 1: Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora" className="h-6 w-auto" />
            </div>
            <p className="text-slate-500 leading-relaxed">
              Simple business software. GST billing, inventory, and customer management for Indian businesses.
            </p>
            <p className="mt-4 text-slate-600">&copy; {new Date().getFullYear()} Cenvora.</p>
          </div>

          {/* Col 2: Product */}
          <div>
            <h4 className="text-white font-semibold mb-3 font-display text-sm">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/#features" className="hover:text-slate-300 transition-colors">Features</Link></li>
              <li><Link to="/#pricing" className="hover:text-slate-300 transition-colors">Pricing</Link></li>
              <li><Link to="/gst-hsn-guide" className="hover:text-slate-300 transition-colors">HSN Lookup</Link></li>
              <li><Link to="/sitemap" className="hover:text-slate-300 transition-colors">Sitemap</Link></li>
            </ul>
          </div>

          {/* Col 3: Company */}
          <div>
            <h4 className="text-white font-semibold mb-3 font-display text-sm">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/contact" className="hover:text-slate-300 transition-colors">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link></li>
              <li>
                <a
                  href="https://wa.me/917205289643"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-300 transition-colors inline-flex items-center gap-1.5"
                >
                  WhatsApp (+91 7205289643)
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Calendly Modal */}
      <PopupModal
        url="https://calendly.com/cenvora"
        onModalClose={() => setIsCalendlyOpen(false)}
        open={isCalendlyOpen}
        rootElement={document.getElementById("root")}
      />
    </div>
  );
}
