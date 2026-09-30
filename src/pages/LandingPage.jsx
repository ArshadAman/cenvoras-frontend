import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PopupModal } from 'react-calendly';
import { 
  ChartBarIcon, 
  BoltIcon, 
  ShieldCheckIcon, 
  ArrowRightIcon, 
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  HomeIcon,
  ShoppingCartIcon,
  CubeIcon,
  SparklesIcon,
  ServerStackIcon,
  BuildingOffice2Icon,
  ArrowTrendingUpIcon,
  QuestionMarkCircleIcon,
  KeyIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import PublicNavbar from '../components/PublicNavbar';
import Seo from '../components/Seo';
import DetailedFeatures from '../components/DetailedFeatures';
import { formatCurrency } from '../utils/currency';

// Hook for scroll animations
const useScrollAnimation = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-up');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scroll-animate').forEach((el) => {
      el.classList.add('opacity-0', 'translate-y-8');
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
};

// Screenshot Showcase Component
const ScreenshotShowcase = () => {
  const [activeTab, setActiveTab] = useState('demo');
  
  const tabs = [
    { id: 'demo', label: 'Lightning Invoicing Demo', icon: BoltIcon, image: '/billcreationdemo.gif' },
    { id: 'dashboard', label: 'Executive Dashboard', icon: HomeIcon, image: '/dashboard.png' },
    { id: 'sales', label: 'Sales & Ledgers', icon: ShoppingCartIcon, image: '/sales.png' },
    { id: 'inventory', label: 'Batch & Stock Valuation', icon: CubeIcon, image: '/inventory.png' },
  ];

  return (
    <div className="mt-14 md:mt-20 opacity-0 animate-fade-up delay-300 relative w-full">
      {/* Tab Navigation */}
      <div className="flex items-center overflow-x-auto md:justify-center gap-2 mb-8 px-4 pb-2 -mx-4 md:mx-0 whitespace-nowrap snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 shrink-0 snap-center border ${
                isActive
                  ? 'bg-cyan-500 text-black border-cyan-400 font-semibold shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border-white/10'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-cyan-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Screenshot Container */}
      <div className="relative group">
        {/* Subtle Ambient Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-teal-500/10 to-blue-500/20 rounded-[2.5rem] blur-2xl opacity-40 group-hover:opacity-60 transition duration-700"></div>
        
        {/* Main Display Window */}
        <div className="relative mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10 max-w-5xl bg-[#090b10] transform group-hover:translate-y-[-2px] transition-transform duration-500">
          <div className="flex items-center justify-between px-4 py-3 bg-[#0d1117] border-b border-white/5 text-xs text-gray-500 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/60 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/60 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/60 inline-block"></span>
              <span className="ml-2 text-gray-400">cenvora.app / console</span>
            </div>
            <span className="text-[11px] text-cyan-400 font-medium">Perpetual Instance • 100% Private DB</span>
          </div>

          <div className="relative min-h-[300px] sm:min-h-[460px] bg-[#07090e]">
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

      {/* Feature Badges */}
      <div className="flex flex-wrap justify-center gap-2.5 mt-6">
        {activeTab === 'demo' && (
          <>
            <span className="px-3.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-full text-xs font-mono">10s Bill Generation</span>
            <span className="px-3.5 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-full text-xs font-mono">Thermal & A4 Print</span>
            <span className="px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-full text-xs font-mono">Instant WhatsApp Delivery</span>
          </>
        )}
        {activeTab === 'dashboard' && (
          <>
            <span className="px-3.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-full text-xs font-mono">Live Gross Profit Pulse</span>
            <span className="px-3.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-full text-xs font-mono">Automated Overdue Collections</span>
            <span className="px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-full text-xs font-mono">Zero Cloud Lag</span>
          </>
        )}
        {activeTab === 'sales' && (
          <>
            <span className="px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-full text-xs font-mono">Dual-Tax: India GST & UAE VAT</span>
            <span className="px-3.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-full text-xs font-mono">Customer Credit Limits</span>
            <span className="px-3.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-full text-xs font-mono">One-Click Credit Notes</span>
          </>
        )}
        {activeTab === 'inventory' && (
          <>
            <span className="px-3.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-full text-xs font-mono">Batch Lot Tracking</span>
            <span className="px-3.5 py-1 bg-red-500/10 border border-red-500/20 text-red-300 rounded-full text-xs font-mono">Automated Expiry Warnings</span>
            <span className="px-3.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-full text-xs font-mono">FIFO Stock Valuation</span>
          </>
        )}
      </div>
    </div>
  );
};

// Interactive Rent vs Own ROI Calculator
const RoiCalculator = () => {
  const [users, setUsers] = useState(8);
  const [years, setYears] = useState(3);

  // Standard SaaS comparison: average ₹2,000/user/month for mid-tier GST ERP + 18% GST
  const monthlySaasPerUser = 2000;
  const saasTotal = useMemo(() => {
    return users * monthlySaasPerUser * 12 * years;
  }, [users, years]);

  // Cenvora Hosted Standard: ₹1,00,000 one-time + ₹18,000/yr (flat 12k AMC + 6k server)
  const cenvoraTotal = useMemo(() => {
    const oneTimeLicense = 100000;
    const annualRunning = 18000; // 12k AMC + 6k cloud server
    return oneTimeLicense + (annualRunning * years);
  }, [years]);

  const savings = Math.max(0, saasTotal - cenvoraTotal);

  return (
    <div className="bg-[#0b0e14] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-2xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase tracking-wider mb-3">
          <ArrowTrendingUpIcon className="w-4 h-4" />
          Capital Efficiency Model
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Rent vs. Own: Stop SaaS Subscription Bleed
        </h3>
        <p className="text-gray-400 text-sm sm:text-base mt-2 leading-relaxed">
          Traditional subscription ERPs punish growth with steep per-seat monthly charges. With Cenvora, you buy the perpetual license once, add unlimited users, and pay only transparent maintenance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Sliders Area */}
        <div className="lg:col-span-6 space-y-6">
          {/* User count slider */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300">Active Team Seats</label>
              <span className="text-lg font-bold text-cyan-400 font-mono">{users} Users</span>
            </div>
            <input 
              type="range" 
              min="2" 
              max="35" 
              value={users} 
              onChange={(e) => setUsers(Number(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[11px] text-gray-500 mt-2 font-mono">
              <span>2 billing staff</span>
              <span>15 managers</span>
              <span>35 enterprise users</span>
            </div>
          </div>

          {/* Time horizon slider */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300">Operating Horizon</label>
              <span className="text-lg font-bold text-cyan-400 font-mono">{years} {years === 1 ? 'Year' : 'Years'}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="5" 
              value={years} 
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[11px] text-gray-500 mt-2 font-mono">
              <span>1 Year</span>
              <span>3 Years (Recommended)</span>
              <span>5 Years</span>
            </div>
          </div>
        </div>

        {/* Comparison Result Cards */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Legacy SaaS Box */}
          <div className="bg-[#12161f] border border-red-500/20 rounded-2xl p-5 relative">
            <span className="text-[11px] uppercase tracking-wider text-red-400 font-mono font-semibold">Recurring SaaS Cost</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-200 mt-2 font-mono">
              {formatCurrency(saasTotal)}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Based on standard ₹2,000/seat/mo billing. Increases every time you hire.
            </p>
          </div>

          {/* Cenvora Box */}
          <div className="bg-gradient-to-br from-cyan-950/40 via-[#0d1924] to-[#091017] border border-cyan-500/40 rounded-2xl p-5 relative shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            <span className="text-[11px] uppercase tracking-wider text-cyan-300 font-mono font-semibold">Cenvora Perpetual</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-mono">
              {formatCurrency(cenvoraTotal)}
            </div>
            <p className="text-xs text-cyan-300/80 mt-2">
              ₹1L Perpetual License + Flat ₹12k/yr AMC + server cost. Unlimited seats.
            </p>
          </div>

          {/* Savings Highlight */}
          <div className="sm:col-span-2 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase text-emerald-400 font-bold">Total Capital Preserved</span>
              <div className="text-3xl font-extrabold text-emerald-300 font-mono mt-0.5">
                + {formatCurrency(savings)}
              </div>
              <p className="text-xs text-gray-400 mt-1">Direct cash flow kept inside your business over {years} {years === 1 ? 'year' : 'years'}.</p>
            </div>
            <a 
              href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20reviewed%20the%20ROI%20calculator%20and%20want%20to%20discuss%20perpetual%20deployment%20for%20my%20business."
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap shadow-lg shadow-emerald-500/20"
            >
              Lock Perpetual Quote
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LandingPage() {
  useScrollAnimation();
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Cenvora',
      url: siteUrl,
      logo: `${siteUrl}/cenvora-logo-backgrond-removed.png`,
      description: 'Perpetual License Billing & Inventory Software for India & UAE.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Cenvora ERP',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android, iOS, Cloud',
      url: siteUrl,
      description: 'High-performance dual-tax GST & UAE VAT billing, batch stock valuation, and customer accounting with perpetual ownership.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Cenvora',
      url: siteUrl,
    },
  ];

  return (
    <div className="font-sans text-white overflow-x-hidden bg-[#07080b] selection:bg-cyan-500/30 selection:text-white min-h-screen">
      <Seo
        title="Cenvora | Perpetual License Billing & Inventory Software (India & UAE)"
        description="Stop renting your ERP. Cenvora gives you 100% perpetual software ownership, dual-tax GST/VAT invoicing, batch stock valuation, and flat ₹12k/yr AMC."
        canonicalPath="/"
        structuredData={structuredData}
      />
      
      {/* Background Texture Grid */}
      <div className="fixed inset-0 bg-grid z-0 pointer-events-none opacity-20"></div>

      {/* 1. Global Clean Navbar */}
      <PublicNavbar
        links={[
          { label: 'Architecture', href: '#features' },
          { label: 'Perpetual Pricing', href: '#pricing' },
          { label: 'Rent vs Own ROI', href: '#roi-calculator' },
          { label: 'HSN Directory', href: '/gst-hsn-guide' },
          { label: 'Contact', href: '/contact' },
        ]}
      />

      {/* 2. Hero Section */}
      <section className="pt-24 sm:pt-36 pb-16 md:pb-24 text-center relative overflow-hidden z-10">
        {/* Radial Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-[650px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#07080b] to-transparent -z-10 pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto px-6 relative">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-semibold mb-6 opacity-0 animate-fade-up tracking-wide backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse mr-2"></span>
            Perpetual Software Ownership • Built for India & UAE
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-white opacity-0 animate-fade-up delay-100 leading-[1.12]">
            Own Your ERP. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              Stop Renting Your Business Operating System.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-10 opacity-0 animate-fade-up delay-200 leading-relaxed font-light">
            High-speed GST & UAE VAT billing, batch-level stock valuation, and double-entry client ledgers. One-time perpetual license with flat ₹12,000/year base AMC. No per-user penalties. Your database remains 100% yours.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-up delay-300">
            <button
              onClick={() => setIsCalendlyOpen(true)}
              className="w-full sm:w-auto justify-center flex items-center gap-2.5 px-7 py-4 rounded-xl font-bold text-black bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_35px_rgba(6,182,212,0.35)] hover:shadow-[0_0_45px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <CpuChipIcon className="w-5 h-5 text-black" />
              <span>Book Architecture Walkthrough</span>
            </button>

            <a 
              href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20want%20to%20see%20a%20live%20demo%20and%20test%20drive%20the%2014-day%20cloud%20sandbox." 
              target="_blank" 
              rel="noreferrer" 
              className="w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-4 rounded-xl font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-200 active:scale-95"
            >
              <svg className="w-5 h-5 fill-[#25D366]" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.407 1.46h.007c5.632 0 10.21-4.58 10.213-10.21.002-2.729-1.051-5.293-2.964-7.208C17.399 1.282 14.836.22 12.012.22 6.38 0 1.797 4.582 1.795 10.21a10.16 10.16 0 0 0 1.522 5.3l.18.286-1.002 3.661 3.746-.982.278.165zm11.905-7.616c-.3-.149-1.772-.874-2.047-.975-.276-.102-.476-.15-.676.15-.199.3-.775 1.009-.95 1.21-.175.199-.35.224-.65.075-1.127-.565-1.954-1.049-2.748-2.408-.21-.359-.01-.176.185-.548.148-.3.074-.562-.038-.711-.112-.149-.9-.2.9-2.179-.868-.21-.43-.099-.583-.075-.413.074-.112.199-.19.325-.3.125-.109.199-.199.3-.35.099-.15.05-.299-.025-.448-.075-.15-.675-1.623-.925-2.223-.244-.589-.496-.51-.678-.51-.175-.008-.375-.01-.576-.01-.2 0-.525.075-.799.375-.274.3-1.05 1.03-1.05 2.516s1.075 2.916 1.225 3.116c.15.199 2.115 3.227 5.125 4.527.715.31 1.273.495 1.708.635.718.228 1.37.195 1.887.118.577-.089 1.772-.724 2.022-1.424.25-.699.25-1.3.175-1.424-.075-.124-.275-.199-.575-.349z"/>
              </svg>
              <span>Instant WhatsApp Demo</span>
            </a>

            <Link 
              to="/signup" 
              className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-6 py-4 rounded-xl font-medium text-gray-300 hover:text-white transition-colors text-sm"
            >
              <span>Explore 14-Day Cloud Sandbox</span>
              <ArrowRightIcon className="w-4 h-4 text-cyan-400" />
            </Link>
          </div>

          {/* Proof Strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" /> Perpetual License
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" /> Flat ₹12,000/yr AMC
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" /> Client Database Sovereignty
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" /> Zero User Seat Caps
            </span>
          </div>

          {/* Screenshot Showcase */}
          <ScreenshotShowcase />
        </div>
      </section>

      {/* 3. Interactive ROI Calculator Section */}
      <section id="roi-calculator" className="py-20 relative z-10 border-t border-white/5 bg-[#090b10]">
        <div className="max-w-6xl mx-auto px-6">
          <RoiCalculator />
        </div>
      </section>

      {/* 4. Core Architecture Pillars (Bento Grid) */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 scroll-animate">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase mb-4">
              Production Architecture
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Engineered for Speed, Precision, & Sovereignty
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mt-3">
              No bloated enterprise configuration. Designed for business owners who need immediate answers and lightning-fast counter operations.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Batch & Stock Control */}
            <div className="bento-card col-span-1 md:col-span-2 bg-[#0c1017] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6">
                  <CubeIcon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Batch & Expiry Intelligence. Zero Stock Blunders.
                </h3>
                <p className="text-gray-400 max-w-xl text-sm sm:text-base leading-relaxed mb-6">
                  Track stock lots by batch numbers, manufacturing dates, and automated near-expiry alerts. Prevent selling expired stock, automate FIFO stock depletion, and view exact inventory valuations in real time.
                </p>
                <div className="grid grid-cols-3 gap-3 max-w-lg font-mono text-xs">
                  <div className="bg-white/[0.03] border border-white/5 p-3 rounded-xl">
                    <div className="text-gray-500">Valuation</div>
                    <div className="text-white font-bold mt-1">FIFO & Avg</div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 p-3 rounded-xl">
                    <div className="text-gray-500">Alerts</div>
                    <div className="text-amber-400 font-bold mt-1">30-Day Expiry</div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 p-3 rounded-xl">
                    <div className="text-gray-500">Audit</div>
                    <div className="text-cyan-400 font-bold mt-1">Live Ledger</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Dual Tax GST + UAE VAT */}
            <div className="bento-card bg-[#0c1017] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                  <GlobeAltIcon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Dual Tax Ready</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Compliant for Indian GST (CGST/SGST/IGST splitting) and UAE FTA VAT (5%). Multi-currency invoicing with zero tax formula mistakes.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 text-xs font-mono text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                GSTR-1 & 3B Ready Export
              </div>
            </div>

            {/* Card 3: Counter Speed Invoicing */}
            <div className="bento-card bg-[#0c1017] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6">
                  <BoltIcon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">10-Second Invoicing</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Barcode scanner support, keyboard shortcuts, customer phone lookup, and auto-splitting taxes. Raise bills in seconds with zero delay.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 text-xs font-mono text-cyan-300">
                Thermal 80mm & A4 PDF Presets
              </div>
            </div>

            {/* Card 4: Role-Based Audit Trail */}
            <div className="bento-card bg-[#0c1017] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
                  <ShieldCheckIcon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Role-Based Security</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Protect profit margins. Cashiers only bill, managers review stock, and only owners inspect net margins and full ledgers. Every edit logged.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 text-xs font-mono text-blue-300">
                Tamper-proof event logs
              </div>
            </div>

            {/* Card 5: Any Device Access */}
            <div className="bento-card bg-[#0c1017] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-teal-500/40 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-6">
                  <DevicePhoneMobileIcon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">PC, Mac, Tablet & Phone</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Responsive progressive interface. Access your live business pulse from your phone while traveling or run full thermal POS counters from your desk.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 text-xs font-mono text-teal-300">
                Encrypted cloud sync
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Comprehensive Module Breakdown */}
      <section id="detailed-features" className="py-24 relative z-10 bg-[#090b10] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 scroll-animate">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase mb-4">
              Complete Functional Scope
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Everything Your Trade & Distribution Operation Demands
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mt-3">
              Explore the five operational pillars pre-configured in every Cenvora deployment.
            </p>
          </div>
          
          <DetailedFeatures />
        </div>
      </section>

      {/* 6. Perpetual License Pricing Section */}
      <section id="pricing" className="py-24 relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 scroll-animate">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase mb-4">
              Transparent Ownership Model
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              One-Time License. Predictable Flat AMC.
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mt-3">
              No sneaky price hikes. No per-user penalties. Flat ₹12,000/year base software maintenance plus actual server hosting costs.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Tier 1: Hosted Standard */}
            <div className="bg-[#0b0e14] border border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <span className="text-xs uppercase tracking-wider font-mono text-gray-400 font-semibold">Tier 1</span>
                <h3 className="text-2xl font-bold text-white mt-1">Hosted Standard</h3>
                <p className="text-gray-400 text-xs sm:text-sm mt-2 leading-relaxed">
                  Ideal for established single-firm distributors wanting zero server management headaches.
                </p>

                {/* Price Display */}
                <div className="mt-6 pb-6 border-b border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white font-mono">₹1,00,000</span>
                    <span className="text-xs text-gray-400">one-time</span>
                  </div>
                  <div className="mt-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-gray-300">
                      <span>Base Software AMC:</span>
                      <span className="font-mono font-semibold text-white">₹12,000/yr</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Shared Cloud Cluster:</span>
                      <span className="font-mono text-gray-400">~₹500/mo (₹6k/yr)</span>
                    </div>
                    <div className="pt-1.5 border-t border-white/5 flex justify-between font-semibold text-cyan-300">
                      <span>Total Ongoing:</span>
                      <span className="font-mono">₹18,000/yr</span>
                    </div>
                  </div>
                </div>

                {/* Feature Checklist */}
                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-gray-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Unlimited user seats & terminals</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Dual-tax GST & UAE VAT engine</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Batch lot & expiry date intelligence</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Managed cloud hosting & daily backups</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Regulatory GST updates & WhatsApp support</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <a
                  href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20am%20interested%20in%20the%20Hosted%20Standard%20perpetual%20license%20(Rs%201%2C00%2C000)."
                  target="_blank"
                  rel="noreferrer"
                  className="w-full block py-3.5 px-4 text-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all"
                >
                  Inquire Hosted Standard
                </a>
              </div>
            </div>

            {/* Tier 2: White-Label Custom Domain (Highlighted) */}
            <div className="bg-gradient-to-b from-[#0f1724] to-[#0a111a] border-2 border-cyan-400 rounded-3xl p-8 flex flex-col justify-between relative shadow-[0_0_40px_rgba(6,182,212,0.2)] md:-translate-y-3">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-400 text-black text-[11px] font-extrabold uppercase tracking-widest rounded-full shadow-md">
                Most Popular
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider font-mono text-cyan-400 font-semibold">Tier 2</span>
                <h3 className="text-2xl font-bold text-white mt-1">White-Label Custom Domain</h3>
                <p className="text-gray-300 text-xs sm:text-sm mt-2 leading-relaxed">
                  Your brand name, your custom domain (`erp.yourbrand.com`), and dedicated isolated container.
                </p>

                {/* Price Display */}
                <div className="mt-6 pb-6 border-b border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white font-mono">₹1,50,000</span>
                    <span className="text-xs text-cyan-200">one-time</span>
                  </div>
                  <div className="mt-3 p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-gray-300">
                      <span>Base Software AMC:</span>
                      <span className="font-mono font-semibold text-white">₹12,000/yr</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Dedicated Container:</span>
                      <span className="font-mono text-gray-400">~₹1,000/mo (₹12k/yr)</span>
                    </div>
                    <div className="pt-1.5 border-t border-cyan-500/20 flex justify-between font-semibold text-cyan-300">
                      <span>Total Ongoing:</span>
                      <span className="font-mono">₹24,000/yr</span>
                    </div>
                  </div>
                </div>

                {/* Feature Checklist */}
                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-gray-200">
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Your custom domain</strong> (`erp.yourfirm.com`)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Full white-label branding</strong> (your logo on portals & PDFs)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Dedicated isolated container & database</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Automated hourly database backups</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Priority WhatsApp SLA & direct engineer contact</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <a
                  href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20am%20interested%20in%20the%20White-Label%20Custom%20Domain%20license%20(Rs%201%2C50%2C000)."
                  target="_blank"
                  rel="noreferrer"
                  className="w-full block py-4 px-4 text-center rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-sm shadow-lg shadow-cyan-400/30 transition-all"
                >
                  Deploy White-Label Custom Domain
                </a>
              </div>
            </div>

            {/* Tier 3: Enterprise Bespoke / BYOC */}
            <div className="bg-[#0b0e14] border border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <span className="text-xs uppercase tracking-wider font-mono text-gray-400 font-semibold">Tier 3</span>
                <h3 className="text-2xl font-bold text-white mt-1">Enterprise Bespoke / BYOC</h3>
                <p className="text-gray-400 text-xs sm:text-sm mt-2 leading-relaxed">
                  For large multi-firm groups, private cloud VPCs, or on-premise infrastructure.
                </p>

                {/* Price Display */}
                <div className="mt-6 pb-6 border-b border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white font-mono">₹2,00,000+</span>
                    <span className="text-xs text-gray-400">one-time</span>
                  </div>
                  <div className="mt-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-gray-300">
                      <span>Base Software AMC:</span>
                      <span className="font-mono font-semibold text-white">₹12,000/yr</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>BYOC Server Cost:</span>
                      <span className="font-mono text-emerald-400 font-semibold">₹0 to Cenvora (Direct)</span>
                    </div>
                    <div className="pt-1.5 border-t border-white/5 flex justify-between font-semibold text-gray-300">
                      <span>Hosting:</span>
                      <span className="font-mono text-gray-400">Paid to AWS/Hetzner directly</span>
                    </div>
                  </div>
                </div>

                {/* Feature Checklist */}
                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-gray-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Deploy on your private AWS, Azure, or Hetzner VPC</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Custom API integrations & custom workflow hooks</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Dedicated PostgreSQL cluster setup</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Custom data migration from Tally / Excel</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Direct executive SLA & on-call deployment engineer</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <button
                  onClick={() => setIsCalendlyOpen(true)}
                  className="w-full block py-3.5 px-4 text-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all"
                >
                  Schedule Enterprise Consultation
                </button>
              </div>
            </div>
          </div>

          {/* AMC Transparency Note */}
          <div className="mt-12 bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h4 className="text-white font-bold text-base flex items-center gap-2">
                <KeyIcon className="w-5 h-5 text-cyan-400" />
                What is included in the flat ₹12,000/year Base AMC?
              </h4>
              <p className="text-sm text-gray-400 max-w-3xl leading-relaxed">
                The ₹12,000/year (₹1,000/mo) AMC covers continuous regulatory GST and tax calculation updates, security patches, automated software releases, and priority direct WhatsApp support. You own your code license and your database forever.
              </p>
            </div>
            <Link
              to="/terms"
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-4 shrink-0"
            >
              Read Perpetual License Terms &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section className="py-20 relative z-10 bg-[#090b10] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white tracking-tight">Frequently Asked Commercial Questions</h2>
            <p className="text-gray-400 text-sm mt-2">Clear facts on software ownership, data sovereignty, and deployment.</p>
          </div>

          <div className="space-y-4">
            <div className="bg-[#0c1017] border border-white/10 rounded-2xl p-6">
              <h4 className="text-base font-semibold text-white">Can I import our existing products and customer balances from Tally or Excel?</h4>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                Yes. Cenvora includes standardized CSV import templates for items, batch stock counts, customer master profiles, and opening balances. Our deployment engineers assist you with your opening balance migration during onboarding.
              </p>
            </div>

            <div className="bg-[#0c1017] border border-white/10 rounded-2xl p-6">
              <h4 className="text-base font-semibold text-white">What happens if we choose not to renew the AMC after year one?</h4>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                You retain full perpetual ownership of your software version and complete access to your database. Unlike subscription SaaS tools that cut off your access the moment you stop paying, Cenvora never locks you out of your historical records. The AMC simply ensures ongoing statutory GST updates and priority support.
              </p>
            </div>

            <div className="bg-[#0c1017] border border-white/10 rounded-2xl p-6">
              <h4 className="text-base font-semibold text-white">How many billing counters and employee logins can we create?</h4>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                Unlimited. We believe per-user seat pricing is predatory for growing distribution businesses. You can create logins for cashiers, stock managers, sales agents, and accountants without paying an extra rupee.
              </p>
            </div>

            <div className="bg-[#0c1017] border border-white/10 rounded-2xl p-6">
              <h4 className="text-base font-semibold text-white">Is thermal receipt printing supported?</h4>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                Yes. Cenvora supports standard 80mm thermal receipt printers via USB and Bluetooth, as well as formal full-page A4 and A5 GST invoice layouts with QR payment codes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. High-Converting Bottom CTA Banner */}
      <section className="py-20 relative z-10 border-t border-white/5 bg-gradient-to-b from-[#090b10] to-black text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-6">
            Take Permanent Control of Your Business Operations
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Experience why distributors and high-volume traders are moving away from restrictive monthly SaaS tools to perpetual ownership with Cenvora.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setIsCalendlyOpen(true)}
              className="w-full sm:w-auto px-8 py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-400/25"
            >
              Schedule Live Walkthrough
            </button>
            <a
              href="https://wa.me/917205289643"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/10 transition-all"
            >
              Chat on WhatsApp (+91 7205289643)
            </a>
          </div>
        </div>
      </section>

      {/* 9. Clean Engineering Footer */}
      <footer className="bg-black py-16 border-t border-white/10 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
                <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="h-9 w-auto object-contain" />
              </Link>
              <p className="text-xs text-gray-500 mt-2 max-w-sm">
                Perpetual license software architecture for trade, billing, batch inventory, and client accounting. Built for India & UAE.
              </p>
            </div>

            <div className="flex flex-wrap gap-8 text-xs font-mono text-gray-400">
              <Link to="/#features" className="hover:text-white transition-colors">Features</Link>
              <Link to="/#pricing" className="hover:text-white transition-colors">Perpetual Pricing</Link>
              <Link to="/gst-hsn-guide" className="hover:text-white transition-colors">HSN Code Lookup</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact Enterprise</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/sitemap" className="hover:text-white transition-colors">Sitemap</Link>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 gap-4">
            <p>&copy; {new Date().getFullYear()} Cenvora Inc. All rights reserved. Sovereign business systems.</p>
            <div className="flex items-center gap-4 text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> All Systems Operational
              </span>
            </div>
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
