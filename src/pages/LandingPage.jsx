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
  SparklesIcon,
} from '@heroicons/react/24/outline';
import PublicNavbar from '../components/PublicNavbar';
import Seo from '../components/Seo';
import DetailedFeatures from '../components/DetailedFeatures';
import BrandLogo from '../components/common/BrandLogo';

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
    'GST Suvidha Provider (GSP) Gateway Ready',
    '1-Click Tally XML Export for Your CA',
    'NIC E-Way Bill & E-Invoice Standard',
    'ISO/IEC 27001 Security Standard Ready',
    '100% Indian Data Center Sovereignty',
    'Unlimited Staff Logins & Zero Per-User Fees',
    'Perpetual License Available · Full Ownership',
  ];
  const doubled = [...items, ...items];
  return (
    <div className="relative z-10 overflow-hidden border-y border-[var(--border-subtle)] py-4 bg-[var(--bg-surface)]/90 backdrop-blur-md">
      <div className="flex gap-10 animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-xs font-mono font-medium text-[var(--text-muted)] tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shrink-0" />
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
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors duration-200 cursor-pointer ${
                isActive
                  ? 'text-[var(--bg-primary)] font-bold'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-[var(--text-primary)] rounded-xl shadow-lg"
                  transition={{ type: 'spring', stiffness: 380, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--bg-primary)]' : 'text-[var(--text-muted)]'}`} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Browser Frame */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="flex items-center px-4 py-3 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5 mr-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-muted)] opacity-40" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-muted)] opacity-60" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-muted)] opacity-80" />
          </div>
          <div className="flex items-center gap-2 bg-[var(--bg-surface)] px-3 py-1 rounded-md border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-muted)]">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>https://app.cenvora.com</span>
          </div>
        </div>

        <div className="relative min-h-[300px] sm:min-h-[500px] bg-[var(--bg-primary)] flex items-center justify-center">
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

// Animated FAQ Accordion
const FAQ_ITEMS = [
  {
    q: 'Can I import my existing products and customers from Excel or Tally?',
    a: 'Yes. We provide simple Excel and CSV import templates for your item catalog, starting stock counts, customer directory, and opening balances. Our engineering team also helps you migrate your data seamlessly with zero downtime.',
  },
  {
    q: 'Will my CA be able to file my GST returns without learning new software?',
    a: 'Yes, 100%. Cenvora comes with a built-in 1-Click Tally XML Export engine. At month-end, your accountant clicks one button to download sales, purchases, bank receipts, and journals, and imports the file directly into TallyPrime in 60 seconds. Your CA does not have to learn or touch anything new.',
  },
  {
    q: 'What is the Lifetime License and what can we customize?',
    a: 'Our Lifetime License gives you complete flexibility and perpetual software ownership. You pay once and own the software license forever. You can completely customize your Cenvora: put it on your own domain (erp.yourbrand.com), use your company branding on invoice PDFs, and request custom features or specific workflow modules built specifically for your trade.',
  },
  {
    q: 'How many devices and team members can use Cenvora?',
    a: 'You can create logins for cashiers, stock managers, sales staff, and your accountant. Cenvora does not penalize you with per-user subscription fees.',
  },
  {
    q: 'Where is our data stored? Is it private?',
    a: 'Your data is stored in dedicated, encrypted databases located in Indian data centers. We never sell or share your business data, and your records are completely isolated from other businesses.',
  },
  {
    q: 'Can counter billing staff operate this with keyboard shortcuts only?',
    a: 'Yes. Cenvora is optimized for rapid counter operation with keyboard navigation (Enter to advance inputs, Tab, Ctrl+S to save, Ctrl+P to print) so operators can issue invoices without touching a mouse.',
  },
];

const FaqAccordion = () => {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div className="space-y-3 text-left">
      {FAQ_ITEMS.map((item, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div key={idx} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-md overflow-hidden">
            <button
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="w-full flex items-center justify-between p-6 text-left cursor-pointer group"
            >
              <h3 className="text-sm font-bold text-[var(--text-primary)] pr-4 group-hover:text-[var(--accent-primary)] transition-colors">{item.q}</h3>
              <ChevronDownIcon className={`w-5 h-5 text-[var(--text-muted)] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
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
                  <p className="px-6 pb-6 text-xs text-[var(--text-muted)] leading-relaxed font-body">{item.a}</p>
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
      description: 'GST billing and stock management software for Indian businesses. Available in transparent annual SaaS or customizable perpetual license.',
      offers: {
        '@type': 'Offer',
        price: '17999',
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
    <div className="font-body text-[var(--text-primary)] bg-[var(--bg-primary)] min-h-screen">
      <Seo
        title="Cenvora — Run Your Business & GST Billing From The Cloud"
        description="Run your business and billing from the cloud without changing your CA. GST invoices, live stock, and customer ledgers with 1-click Tally export."
        canonicalPath="/"
        structuredData={structuredData}
      />

      {/* Ambient Lighting Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[var(--accent-primary)]/10 via-[var(--accent-primary)]/5 to-transparent blur-3xl opacity-30 dark:opacity-50" />
        <div className="absolute top-[40%] right-[-100px] w-[500px] h-[500px] bg-gradient-to-b from-[var(--accent-primary)]/10 to-transparent blur-3xl opacity-30 dark:opacity-40" />
        <div className="absolute top-[75%] left-[-100px] w-[500px] h-[500px] bg-gradient-to-b from-[var(--accent-primary)]/10 to-transparent blur-3xl opacity-20 dark:opacity-30" />
      </div>

      <PublicNavbar
        links={[
          { label: 'Features', href: '#features' },
          { label: 'Pricing', href: '#pricing' },
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
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.08]"
            >
              Run your business and billing from the cloud.{' '}
              <span className="text-[var(--accent-primary)]">Without changing your CA.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 text-base sm:text-lg text-[var(--text-muted)] max-w-lg leading-relaxed"
            >
              GST invoices, live stock, and customer ledgers with 1-click Tally export for your accountant. Zero remote-desktop lag. No per-user traps.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-col sm:flex-row items-start gap-3"
            >
              <button
                onClick={() => setIsCalendlyOpen(true)}
                className="btn-primary !text-sm !py-3.5 !px-7 cursor-pointer shadow-lg"
              >
                Book a Free Demo
              </button>

              <a
                href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20would%20like%20to%20see%20a%20quick%20demo%20of%20the%20billing%20software."
                target="_blank"
                rel="noreferrer"
                className="btn-secondary !text-sm !py-3.5 !px-6 flex items-center gap-2 cursor-pointer shadow-sm"
              >
                Chat on WhatsApp
                <ArrowRightIcon className="w-4 h-4" />
              </a>
            </motion.div>

            {/* Trust micro-strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--text-muted)] font-medium"
            >
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                1-Click Tally Export
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                No monthly per-user fees
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                100% India-hosted data
              </span>
            </motion.div>
          </div>

          {/* Right Column — 3D Canvas */}
          <div className="flex-1 w-full lg:w-auto">
            <Suspense fallback={<div className="h-[420px] animate-pulse bg-[var(--bg-surface)] rounded-3xl" />}>
              <HeroPrismCanvas />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ─── Trust Marquee Strip ─── */}
      <TrustMarquee />

      {/* ─── 2. CORE PILLARS — Asymmetric Bento Grid ─── */}
      <section id="features" className="relative z-10 py-24 px-6 bg-[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="max-w-2xl mb-14">
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Everything your business runs on
              </h2>
              <p className="mt-3 text-[var(--text-muted)] text-sm sm:text-base font-body">
                Made for shop owners and distributors — not accountants.
              </p>
            </div>
          </Reveal>

          {/* Bento: 1 large left + 2 stacked right */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {/* Large cell */}
            <Reveal className="md:col-span-3 p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-md hover:border-[var(--accent-primary)] transition-all duration-300 shadow-xl group">
              <div className="w-14 h-14 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)] mb-6 group-hover:scale-105 transition-transform">
                <BoltIcon className="w-7 h-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">10-Second GST Invoicing</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-md font-body">
                Create clean GST tax bills with auto-calculated CGST, SGST, and IGST. Auto-fills customer details and prints formal A4 or A5 invoices with your branding.
              </p>
            </Reveal>

            {/* 2 stacked right */}
            <div className="md:col-span-2 flex flex-col gap-5">
              <Reveal delay={0.1} className="flex-1 p-7 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-md hover:border-[var(--accent-primary)] transition-all duration-300 shadow-xl group">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)] mb-4 group-hover:scale-105 transition-transform">
                  <ArchiveBoxIcon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-1.5">Real-Time Stock Updates</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed font-body">
                  Stock deducts as invoices are generated. Low-stock alerts keep you ahead.
                </p>
              </Reveal>

              <Reveal delay={0.2} className="flex-1 p-7 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-md hover:border-[var(--accent-primary)] transition-all duration-300 shadow-xl group">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)] mb-4 group-hover:scale-105 transition-transform">
                  <DocumentChartBarIcon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-1.5">Ledgers & Tax Reports</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed font-body">
                  Track customer balances, record settlements, and export GSTR-1 and GSTR-3B summaries.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. PRODUCT SHOWCASE (Tabs) ─── */}
      <section className="relative z-10 py-24 px-6 bg-[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center mb-4">
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                See the whole system
              </h2>
              <p className="mt-3 text-[var(--text-muted)] text-sm sm:text-base font-body">
                From billing to staff permissions — every module built for smooth daily trade.
              </p>
            </div>
          </Reveal>
          <ProductShowcase />
        </div>
      </section>

      {/* ─── 4. DETAILED FEATURES EXPLORER ─── */}
      <section className="relative z-10 py-24 border-t border-[var(--border-subtle)] px-6 bg-[var(--bg-surface)]/40">
        <div className="max-w-5xl mx-auto">
          <DetailedFeatures />
        </div>
      </section>

      {/* ─── 6. PRICING ─── */}
      <section id="pricing" className="relative z-10 py-24 border-t border-[var(--border-subtle)] px-6 bg-[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Choose the plan that fits your business
              </h2>
              <p className="mt-3 text-[var(--text-muted)] text-sm sm:text-base font-body">
                Flexible annual cloud subscriptions, or own your software license forever with complete customization.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Tier 1: SaaS Annual */}
            <Reveal delay={0}>
              <div className="h-full p-7 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-md flex flex-col justify-between hover:border-[var(--accent-primary)] transition-all">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono">Cloud SaaS</div>
                  <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mt-1">Annual Professional</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed font-body">
                    Best for single-business shops and distributors wanting zero setup headaches.
                  </p>

                  <div className="mt-6 pb-6 border-b border-[var(--border-subtle)]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-[var(--text-primary)] font-mono font-tabular">₹1,499</span>
                      <span className="text-xs text-[var(--text-muted)]">/ month</span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">Billed annually at ₹17,999/year</div>
                    <div className="mt-4 p-3.5 bg-[var(--bg-primary)] rounded-xl text-xs space-y-1.5 text-[var(--text-muted)] border border-[var(--border-subtle)] font-mono font-tabular">
                      <div className="flex justify-between"><span>Hosting & Backups:</span><span className="text-[var(--text-primary)] font-medium">Included</span></div>
                      <div className="flex justify-between"><span>GST Statutory Updates:</span><span className="text-[var(--text-primary)] font-medium">Included</span></div>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-[var(--text-muted)]">
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Generous staff logins and devices</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Full GST billing & stock management</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> 1-Click Tally XML Export for your CA</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Automated daily cloud backups</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> GST statutory updates & WhatsApp support</li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    to="/signup"
                    className="btn-secondary !text-xs !py-3 w-full text-center block cursor-pointer"
                  >
                    Start 14-Day Free Trial
                  </Link>
                </div>
              </div>
            </Reveal>

            {/* Tier 2: Lifetime License & Custom ERP (★ Most Popular - Centered Badge) */}
            <Reveal delay={0.1}>
              <div className="h-full p-7 rounded-3xl border-2 border-[var(--accent-primary)] bg-[var(--bg-surface)] flex flex-col justify-between relative shadow-2xl">
                {/* Centered Badge */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--accent-primary)] text-white text-xs font-black uppercase rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap z-20">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Lifetime Ownership · Complete Flexibility
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)] font-mono">Perpetual License</div>
                  <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mt-1">Lifetime / Custom ERP</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed font-body">
                    Buy once, own forever. Complete flexibility: customize your Cenvora from logos to adding new features.
                  </p>

                  <div className="mt-6 pb-6 border-b border-[var(--border-subtle)]">
                    <div className="text-3xl font-extrabold text-[var(--text-primary)] font-mono font-tabular">Custom Quote</div>
                    <div className="text-xs text-[var(--accent-primary)] mt-0.5 font-bold">Contact Founders / Sales for Tailored Pricing</div>
                    <div className="mt-4 p-3.5 bg-[var(--bg-primary)] rounded-xl text-xs space-y-1.5 text-[var(--text-muted)] border border-[var(--border-subtle)] font-mono font-tabular">
                      <div className="flex justify-between"><span>Software License:</span><span className="text-[var(--text-primary)] font-medium">Perpetual (Yours Forever)</span></div>
                      <div className="flex justify-between"><span>Customization:</span><span className="text-[var(--text-primary)] font-medium">Full Workflow Flexibility</span></div>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-[var(--text-primary)] font-medium">
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> <strong>Complete Flexibility:</strong> Customize from your logos to adding custom workflows</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Your custom domain (erp.yourbrand.com) with white-label PDFs</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Dedicated, isolated private database container</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> 1-Click Tally XML export so your CA never complains</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Priority direct founder & engineer support on WhatsApp</li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <a
                    href="https://wa.me/917205289643?text=Hi%20Cenvora%20Team%2C%20I%20am%20interested%20in%20the%20Lifetime%20License%20and%20want%20to%20discuss%20customizing%20Cenvora%20for%20my%20business."
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary !text-xs !py-3 w-full text-center block shadow-md cursor-pointer"
                  >
                    Contact Founders on WhatsApp
                  </a>
                </div>
              </div>
            </Reveal>

            {/* Tier 3: Enterprise / Self-Hosted */}
            <Reveal delay={0.2}>
              <div className="h-full p-7 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-md flex flex-col justify-between hover:border-[var(--accent-primary)] transition-all">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono">Tier 3</div>
                  <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mt-1">Enterprise / Self-Hosted</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed font-body">
                    For businesses that want the software deployed on their own private cloud or local server.
                  </p>

                  <div className="mt-6 pb-6 border-b border-[var(--border-subtle)]">
                    <div className="text-3xl font-extrabold text-[var(--text-primary)] font-mono font-tabular">Custom Quote</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">On-Premise / Private AWS Deployment</div>
                    <div className="mt-4 p-3.5 bg-[var(--bg-primary)] rounded-xl text-xs space-y-1.5 text-[var(--text-muted)] border border-[var(--border-subtle)] font-mono font-tabular">
                      <div className="flex justify-between"><span>Deployment:</span><span className="text-[var(--text-primary)] font-medium">Your AWS / Private Cloud</span></div>
                      <div className="flex justify-between"><span>Data Control:</span><span className="text-[var(--accent-primary)] font-medium">100% On-Premise</span></div>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-[var(--text-muted)]">
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Installed on your own AWS or private server</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Assistance with full data migration from Tally/Excel</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Custom integrations and custom APIs available</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Dedicated SLA and security audit compliance</li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    onClick={() => setIsCalendlyOpen(true)}
                    className="btn-secondary !text-xs !py-3 w-full text-center block cursor-pointer"
                  >
                    Schedule Consultation
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── 7. FAQ ─── */}
      <section className="relative z-10 py-24 border-t border-[var(--border-subtle)] px-6 bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>
          </Reveal>
          <FaqAccordion />
        </div>
      </section>

      {/* ─── 8. FINAL CTA ─── */}
      <section className="relative z-10 py-20 border-t border-[var(--border-subtle)] px-6 text-center bg-[var(--bg-surface)]">
        <Reveal>
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
              See it live in 20 minutes.
            </h2>
            <p className="mt-3 text-[var(--text-muted)] text-sm font-body">
              Book a screen walkthrough or chat with our team on WhatsApp.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setIsCalendlyOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 btn-primary !text-sm cursor-pointer shadow-lg"
              >
                Book a Free Demo
              </button>
              <a
                href="https://wa.me/917205289643"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-7 py-3.5 btn-secondary !text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                Chat on WhatsApp
              </a>
            </div>

            {/* Trial link */}
            <div className="mt-5">
              <Link
                to="/signup"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors inline-flex items-center gap-1.5"
              >
                Or start a 14-day free trial <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── 9. FOOTER — 3-Column ─── */}
      <footer className="relative z-10 py-14 border-t border-[var(--border-subtle)] px-6 text-xs text-[var(--text-muted)] bg-[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
          {/* Col 1: Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <BrandLogo className="h-9 sm:h-10 w-auto" />
            </div>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Simple business software. GST billing, inventory, and customer management for Indian businesses.
            </p>
            <p className="mt-4 text-[var(--text-muted)] font-mono">&copy; {new Date().getFullYear()} Cenvora.</p>
          </div>

          {/* Col 2: Product */}
          <div>
            <h4 className="text-[var(--text-primary)] font-semibold mb-3 font-display text-sm">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">Pricing</a></li>
              <li><Link to="/gst-hsn-guide" className="hover:text-[var(--text-primary)] transition-colors">HSN Lookup</Link></li>
              <li><Link to="/sitemap" className="hover:text-[var(--text-primary)] transition-colors">Sitemap</Link></li>
            </ul>
          </div>

          {/* Col 3: Company */}
          <div>
            <h4 className="text-[var(--text-primary)] font-semibold mb-3 font-display text-sm">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/contact" className="hover:text-[var(--text-primary)] transition-colors">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms of Service</Link></li>
              <li>
                <a
                  href="https://wa.me/917205289643"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1.5"
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
