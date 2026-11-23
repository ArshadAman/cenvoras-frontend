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
  BanknotesIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  CheckBadgeIcon,
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
    '1-Click Tally XML Export for CAs',
    'NIC E-Way Bill & GST Compliant',
    'Multi-Godown Real-Time Stock Sync',
    'Batch & Expiry (FEFO) Control',
    '100% Indian Cloud Data Sovereignty',
    'Keyboard-Only 15-Second Billing',
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

// CA Objection Neutralizer Banner
const CaObjectionBanner = () => (
  <section className="relative z-10 py-8 px-6 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
    <div className="max-w-5xl mx-auto">
      <div className="p-6 sm:p-8 rounded-3xl border-2 border-[var(--accent-primary)]/40 bg-[var(--bg-surface)] shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center shrink-0 mt-1">
            <CheckBadgeIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] font-mono">
                The Zero-Friction CA Guarantee
              </span>
              <span className="text-[10px] font-mono bg-[var(--accent-primary)] text-white px-2 py-0.5 rounded-full font-semibold">
                Tally Compatible
              </span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-1">
              "What will my CA say if I switch to Cenvora?"
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 max-w-2xl leading-relaxed">
              <strong>Your CA keeps using Tally.</strong> At month-end, click one button to export your sales, purchases, payments, and journals as a certified Tally XML file. Your CA imports it into Tally in 60 seconds with zero manual data entry.
            </p>
          </div>
        </div>
        <a
          href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20can%20you%20show%20me%20how%20the%201-click%20Tally%20XML%20export%20works%3F"
          target="_blank"
          rel="noreferrer"
          className="btn-secondary !text-xs !py-3 !px-5 whitespace-nowrap shrink-0 shadow-sm flex items-center gap-2"
        >
          See Tally Export Demo
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  </section>
);

// Product Showcase with animated tab indicator
const ProductShowcase = () => {
  const [activeTab, setActiveTab] = useState('demo');

  const tabs = [
    { id: 'demo', label: '15-Sec Fast Billing', icon: BoltIcon, image: '/billcreationdemo.gif' },
    { id: 'dashboard', label: 'Owner Dashboard', icon: DocumentChartBarIcon, image: '/dashboard.png' },
    { id: 'sales', label: 'GST Sales & Challans', icon: BanknotesIcon, image: '/sales.png' },
    { id: 'inventory', label: 'Multi-Godown Stock', icon: ArchiveBoxIcon, image: '/inventory.png' },
  ];

  return (
    <Reveal className="mt-12 sm:mt-16 w-full max-w-5xl mx-auto">
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
            <span>https://app.cenvora.com/billing</span>
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

// Head-to-Head Comparison Table
const CompetitorComparison = () => {
  const rows = [
    {
      feature: 'Fast Cloud Access (Phone / Tablet / PC)',
      cenvora: 'Native Cloud Web (Zero lag, instant open)',
      tally: 'Slow RDP / Remote Desktop (Lags & crashes)',
      vyapar: 'Basic Mobile App (Desktop sync often breaks)',
    },
    {
      feature: 'Multi-Godown Stock Transfers',
      cenvora: 'Real-time multi-warehouse transfers & balances',
      tally: 'Requires complex Tally Gold setup',
      vyapar: 'Not supported (Single-store only)',
    },
    {
      feature: 'Batch & Expiry Tracking (FEFO)',
      cenvora: 'Automatic oldest-batch pick & expiry alerts',
      tally: 'Supported on desktop version',
      vyapar: 'Basic manual batch typing only',
    },
    {
      feature: 'True Double-Entry General Ledger',
      cenvora: 'Immutable journal audit trail & balance sheet',
      tally: 'Yes, full double-entry',
      vyapar: 'No (Single-entry balance estimation)',
    },
    {
      feature: 'CA Tally Interoperability',
      cenvora: '1-Click Month-End Tally XML Export',
      tally: 'Native Tally format',
      vyapar: 'Manual Excel export & re-typing',
    },
    {
      feature: 'Cost & License Structure',
      cenvora: 'Transparent SaaS OR Custom Lifetime License',
      tally: '₹1,40,000+ Year 1 (Gold + Cloud Hosting)',
      vyapar: '₹4,000/yr (Fails when turnover > ₹1 Cr)',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-10 shadow-xl backdrop-blur-xl">
      <div className="max-w-2xl mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] font-mono">
          Head-to-Head Comparison
        </span>
        <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mt-1">
          Why growing distributors outgrow Tally Cloud & Vyapar
        </h3>
        <p className="text-[var(--text-muted)] text-sm sm:text-base mt-2 leading-relaxed">
          See how Cenvora solves multi-godown stock leaks and slow remote-desktop lag without forcing your CA to learn a new system.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono">
              <th className="py-3.5 px-4 font-semibold">Capability</th>
              <th className="py-3.5 px-4 font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 rounded-t-xl">
                Cenvora ERP
              </th>
              <th className="py-3.5 px-4 font-semibold">Tally Prime + Cloud RDP</th>
              <th className="py-3.5 px-4 font-semibold">Vyapar / myBillBook</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                <td className="py-4 px-4 font-medium text-[var(--text-primary)]">{row.feature}</td>
                <td className="py-4 px-4 font-semibold text-[var(--accent-primary)] bg-[var(--accent-primary)]/5">
                  <div className="flex items-center gap-1.5">
                    <CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                    <span>{row.cenvora}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-[var(--text-muted)]">{row.tally}</td>
                <td className="py-4 px-4 text-[var(--text-muted)]">{row.vyapar}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 p-5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[var(--text-primary)]">Ready to see Cenvora running your exact stock?</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">We can demo your products and godowns on a 15-minute call.</div>
        </div>
        <a
          href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20saw%20the%20comparison%20with%20Tally%20and%20want%20a%2015-minute%20walkthrough."
          target="_blank"
          rel="noreferrer"
          className="btn-primary !text-xs !py-3 !px-6 whitespace-nowrap shadow-md"
        >
          Request Live Walkthrough
        </a>
      </div>
    </div>
  );
};

// Animated FAQ Accordion
const FAQ_ITEMS = [
  {
    q: 'Will my CA be able to file my GST returns without learning new software?',
    a: 'Yes, 100%. Cenvora comes with a built-in 1-Click Tally XML Export engine. At month-end, your accountant clicks one button to download sales, purchases, bank receipts, and journals, and imports the file directly into TallyPrime in 60 seconds. Your CA does not have to learn or touch anything new.',
  },
  {
    q: 'What is the Lifetime License and what can we customize?',
    a: 'Our Lifetime License gives you complete flexibility and perpetual software ownership. You pay once and own the software license forever. You can completely customize your Cenvora: put it on your own domain (erp.yourbrand.com), use your company branding on invoice PDFs, and request custom features or specific workflow modules built specifically for your trade.',
  },
  {
    q: 'Can we migrate our existing party balances, stock counts, and items from Tally or Excel?',
    a: 'Yes. With our 24-Hour White-Glove Migration Service, you send us your Tally backup or Excel spreadsheets. Our engineering team imports your item catalog, HSN codes, opening stock counts per godown, and customer/vendor balances into Cenvora within 24 hours so you experience zero downtime.',
  },
  {
    q: 'Where is our data stored and can we download local backups?',
    a: 'Your data is hosted in high-security, ISO-certified data centers in India with automated daily encrypted backups. Furthermore, Cenvora gives you a 1-click button to download your complete company database and Excel ledger archive to your local PC or Google Drive every single evening.',
  },
  {
    q: 'Can our counter billing operators use this with keyboard shortcuts only?',
    a: 'Yes. Cenvora is built specifically for fast wholesale counter billing. Your operators can traverse form inputs using pure keyboard shortcuts (Enter to jump fields, Tab, Ctrl+S to save, Ctrl+P to print) without needing to touch a mouse during rush hours.',
  },
  {
    q: 'Do you charge per user or per invoice volume?',
    a: 'No. Cenvora does not penalize you for hiring more billing clerks or generating more invoices. All plans come with generous multi-user access and unlimited invoice generation.',
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
      name: 'Cenvora ERP',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android, iOS, Windows, Mac',
      url: siteUrl,
      description: 'Multi-godown GST billing and double-entry accounting ERP for Indian wholesale distributors and manufacturers with 1-click Tally export.',
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
        title="Cenvora — Multi-Godown GST Billing & ERP for Wholesalers (Tally Compatible)"
        description="Run multi-godown stock, batch expiry (FEFO), and fast counter GST billing with 1-click Tally export. Available in transparent annual SaaS or custom lifetime license."
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
          { label: 'Comparison', href: '#comparison' },
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--accent-primary)] mb-5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
              Built for Indian Wholesalers, Distributors & Light Fabricators
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.08]"
            >
              Run your godowns and billing from the cloud.{' '}
              <span className="text-[var(--accent-primary)]">Without changing your CA.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 text-base sm:text-lg text-[var(--text-muted)] max-w-lg leading-relaxed"
            >
              The only modern multi-warehouse ERP with real double-entry accounting that exports directly to your CA’s Tally in 1 click. Zero remote-desktop lag. No per-user fees.
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
                Book a Free 15-Min Demo
              </button>

              <a
                href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20would%20like%20to%20see%20a%20quick%20demo%20of%20the%20multi-godown%20billing%20ERP."
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
                <CheckIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                1-Click Tally XML Export
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <CheckIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                24-Hour White-Glove Migration
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <CheckIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                100% Indian Cloud Sovereignty
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

      {/* ─── CA Objection Neutralizer ─── */}
      <CaObjectionBanner />

      {/* ─── 2. CORE PILLARS — Asymmetric Bento Grid ─── */}
      <section id="features" className="relative z-10 py-24 px-6 bg-[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="max-w-2xl mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] font-mono">
                Purpose-Built For Wholesale Trade
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight mt-1">
                Everything your business runs on. Under one roof.
              </h2>
              <p className="mt-3 text-[var(--text-muted)] text-sm sm:text-base font-body">
                Made for owners and counter operators who need speed, accuracy, and zero stock confusion.
              </p>
            </div>
          </Reveal>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {/* Large cell */}
            <Reveal className="md:col-span-3 p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-md hover:border-[var(--accent-primary)] transition-all duration-300 shadow-xl group">
              <div className="w-14 h-14 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)] mb-6 group-hover:scale-105 transition-transform">
                <BoltIcon className="w-7 h-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">15-Second Counter Billing (Keyboard-First)</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-md font-body">
                Keep counter lines moving fast during mandi peak hours. Complete keyboard navigation (<code className="font-mono text-xs bg-[var(--bg-primary)] px-1.5 py-0.5 rounded">Enter</code>, <code className="font-mono text-xs bg-[var(--bg-primary)] px-1.5 py-0.5 rounded">Tab</code>, <code className="font-mono text-xs bg-[var(--bg-primary)] px-1.5 py-0.5 rounded">Ctrl+S</code>). Auto-computes CGST/SGST/IGST and prints formal A4, paper-saving A5, or thermal delivery slips in seconds.
              </p>
            </Reveal>

            {/* 2 stacked right */}
            <div className="md:col-span-2 flex flex-col gap-5">
              <Reveal delay={0.1} className="flex-1 p-7 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-md hover:border-[var(--accent-primary)] transition-all duration-300 shadow-xl group">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)] mb-4 group-hover:scale-105 transition-transform">
                  <ArchiveBoxIcon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-1.5">Multi-Godown & Batch (FEFO) Control</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed font-body">
                  Transfer stock across godowns without missing items. Automatically route oldest expiring batches first to eliminate inventory dead-stock.
                </p>
              </Reveal>

              <Reveal delay={0.2} className="flex-1 p-7 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-md hover:border-[var(--accent-primary)] transition-all duration-300 shadow-xl group">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)] mb-4 group-hover:scale-105 transition-transform">
                  <DocumentChartBarIcon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-1.5">Real Double-Entry Accounting</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed font-body">
                  An immutable General Ledger, live customer outstanding balances, credit limits, and instant P&L and Balance Sheet reports.
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
                Inspect the system in action
              </h2>
              <p className="mt-3 text-[var(--text-muted)] text-sm sm:text-base font-body">
                Clean visual density built for high-throughput daily trade operations.
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

      {/* ─── 5. HEAD-TO-HEAD COMPETITOR COMPARISON ─── */}
      <section id="comparison" className="relative z-10 py-24 border-t border-[var(--border-subtle)] px-6 bg-[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <CompetitorComparison />
          </Reveal>
        </div>
      </section>

      {/* ─── 6. PRICING ─── */}
      <section id="pricing" className="relative z-10 py-24 border-t border-[var(--border-subtle)] px-6 bg-[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] font-mono">
                Transparent Pricing Architecture
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight mt-1">
                Choose the way you want to work
              </h2>
              <p className="mt-3 text-[var(--text-muted)] text-sm sm:text-base font-body">
                Start with our high-value annual cloud subscription, or own your software license forever with complete customization.
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
                    Best for growing wholesalers & distributors wanting fast cloud setup with zero IT headaches.
                  </p>

                  <div className="mt-6 pb-6 border-b border-[var(--border-subtle)]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-[var(--text-primary)] font-mono font-tabular">₹1,499</span>
                      <span className="text-xs text-[var(--text-muted)]">/ month</span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">Billed annually at ₹17,999/year</div>
                    <div className="mt-4 p-3 bg-[var(--bg-primary)] rounded-xl text-xs space-y-1 text-[var(--text-muted)] border border-[var(--border-subtle)] font-mono font-tabular">
                      <div className="flex justify-between"><span>Hosting & Backups:</span><span className="text-[var(--status-success)] font-semibold">Included</span></div>
                      <div className="flex justify-between"><span>GST Statutory Updates:</span><span className="text-[var(--status-success)] font-semibold">Included</span></div>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-[var(--text-muted)]">
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Up to 2 Godowns / Warehouses</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Up to 3 Active User Logins</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Full GST Billing & Double-Entry Ledgers</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> 1-Click Tally XML Export for your CA</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Automated daily cloud snapshot backups</li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    to="/signup"
                    className="btn-secondary !text-xs !py-3 w-full text-center block"
                  >
                    Start 14-Day Free Trial
                  </Link>
                </div>
              </div>
            </Reveal>

            {/* Tier 2: Lifetime License & Custom ERP (★ Most Popular) */}
            <Reveal delay={0.1}>
              <div className="h-full p-7 rounded-3xl border-2 border-[var(--accent-primary)] bg-[var(--bg-surface)] flex flex-col justify-between relative shadow-2xl">
                <div className="absolute -top-3.5 left-6 px-3.5 py-0.5 bg-[var(--accent-primary)] text-white text-xs font-black uppercase rounded-full shadow-md flex items-center gap-1.5">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Lifetime Ownership · Complete Flexibility
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)] font-mono">Perpetual License</div>
                  <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mt-1">Lifetime / Custom ERP</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed font-body">
                    Buy once, own forever. Tailored for established distributors who want their own brand, custom workflows, and private data.
                  </p>

                  <div className="mt-6 pb-6 border-b border-[var(--border-subtle)]">
                    <div className="text-3xl font-extrabold text-[var(--text-primary)] font-mono font-tabular">Custom Quote</div>
                    <div className="text-xs text-[var(--accent-primary)] mt-0.5 font-bold">Contact Founders / Sales for Tailored Pricing</div>
                    <div className="mt-4 p-3 bg-[var(--bg-primary)] rounded-xl text-xs space-y-1 text-[var(--text-muted)] border border-[var(--border-subtle)] font-mono font-tabular">
                      <div className="flex justify-between"><span>Software License:</span><span className="text-[var(--text-primary)] font-semibold">Perpetual (Yours Forever)</span></div>
                      <div className="flex justify-between"><span>Customization:</span><span className="text-[var(--text-primary)] font-semibold">Full Workflow Flexibility</span></div>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-[var(--text-primary)] font-medium">
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> <strong>Complete Flexibility:</strong> Customize from your logos to adding custom workflows</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Custom branding on domain (erp.yourbrand.com) & PDFs</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Dedicated, isolated private database container</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> VIP 24-Hour White-Glove Tally/Excel Data Migration</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Direct founder & dedicated engineer support on WhatsApp</li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <a
                    href="https://wa.me/917205289643?text=Hi%20Cenvora%20Team%2C%20I%20am%20interested%20in%20the%20Lifetime%20License%20and%20want%20to%20discuss%20customizing%20Cenvora%20for%20my%20business."
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary !text-xs !py-3 w-full text-center block shadow-md"
                  >
                    Contact Founders on WhatsApp
                  </a>
                </div>
              </div>
            </Reveal>

            {/* Tier 3: Multi-Branch Scale (SaaS) */}
            <Reveal delay={0.2}>
              <div className="h-full p-7 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-md flex flex-col justify-between hover:border-[var(--accent-primary)] transition-all">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono">Multi-Branch SaaS</div>
                  <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mt-1">Multi-Branch Enterprise</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed font-body">
                    For high-volume multi-location businesses needing unlimited warehouses and high concurrency.
                  </p>

                  <div className="mt-6 pb-6 border-b border-[var(--border-subtle)]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-[var(--text-primary)] font-mono font-tabular">₹2,999</span>
                      <span className="text-xs text-[var(--text-muted)]">/ month</span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">Billed annually at ₹35,999/year</div>
                    <div className="mt-4 p-3 bg-[var(--bg-primary)] rounded-xl text-xs space-y-1 text-[var(--text-muted)] border border-[var(--border-subtle)] font-mono font-tabular">
                      <div className="flex justify-between"><span>Godowns / Branches:</span><span className="text-[var(--text-primary)] font-semibold">Unlimited</span></div>
                      <div className="flex justify-between"><span>Account Manager:</span><span className="text-[var(--status-success)] font-semibold">Dedicated</span></div>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-[var(--text-muted)]">
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Unlimited Godowns & Warehouses</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Up to 10 User Logins & Billing Desks</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Advanced Batch & FEFO Expiry Routing</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> Multi-location stock transfer journals</li>
                    <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" /> 24/7 Phone & Priority WhatsApp SLA</li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    onClick={() => setIsCalendlyOpen(true)}
                    className="btn-secondary !text-xs !py-3 w-full text-center block cursor-pointer"
                  >
                    Schedule Live Consultation
                  </button>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Grand Slam Risk Reversal & Bonus Callout */}
          <Reveal className="mt-14 p-8 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-md shadow-xl max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] font-mono">
                  Zero-Risk Onboarding
                </span>
                <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mt-1">
                  24-Hour White-Glove Data Migration
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
                  Send us your Tally backup or Excel spreadsheets. Our engineers will import all your parties, opening balances, and warehouse stock within 24 hours so you experience zero business downtime.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                  60-Day Unconditional Double-Safety Guarantee
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
                  Run Cenvora alongside your existing software for 60 full days. If your counter billing isn't faster, your stock isn't 100% accurate, or your CA has any trouble with the Tally export, we will refund every single rupee and export all your data back to Excel.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── 7. FAQ ─── */}
      <section className="relative z-10 py-24 border-t border-[var(--border-subtle)] px-6 bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] font-mono">
                Got Questions?
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight mt-1">
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
              See Cenvora live on your screen in 15 minutes.
            </h2>
            <p className="mt-3 text-[var(--text-muted)] text-sm font-body">
              Book a screen walkthrough or chat with our founding team on WhatsApp.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setIsCalendlyOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 btn-primary !text-sm cursor-pointer shadow-lg"
              >
                Book a Free 15-Min Demo
              </button>
              <a
                href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20would%20like%20to%20discuss%20the%20ERP%20for%20my%20business."
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-7 py-3.5 btn-secondary !text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                Chat on WhatsApp
              </a>
            </div>

            <div className="mt-5">
              <Link
                to="/signup"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors inline-flex items-center gap-1.5"
              >
                Or start an instant 14-day free trial <ArrowRightIcon className="w-3.5 h-3.5" />
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
              Multi-godown GST billing, inventory, and double-entry accounting ERP for Indian wholesale distributors and manufacturers with 1-click Tally export.
            </p>
            <p className="mt-4 text-[var(--text-muted)] font-mono">&copy; {new Date().getFullYear()} Cenvora.</p>
          </div>

          {/* Col 2: Product */}
          <div>
            <h4 className="text-[var(--text-primary)] font-semibold mb-3 font-display text-sm">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Features</a></li>
              <li><a href="#comparison" className="hover:text-[var(--text-primary)] transition-colors">Comparison</a></li>
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
