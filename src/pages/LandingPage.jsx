import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  BoltIcon, 
  ShieldCheckIcon, 
  UserGroupIcon, 
  ArrowRightIcon, 
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  HomeIcon,
  ShoppingCartIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import PublicNavbar from '../components/PublicNavbar';

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
      el.classList.add('opacity-0', 'translate-y-8'); // Start hidden
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
};

// Screenshot Showcase Component
const ScreenshotShowcase = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, image: '/dashboard.png' },
    { id: 'sales', label: 'Sales', icon: ShoppingCartIcon, image: '/sales.png' },
    { id: 'inventory', label: 'Inventory', icon: CubeIcon, image: '/inventory.png' },
  ];

  return (
    <div className="mt-24 opacity-0 animate-fade-up delay-300 relative">
      {/* Tab Navigation */}
      <div className="flex justify-center gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-white text-black shadow-lg shadow-white/20'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Screenshot Container */}
      <div className="relative group perspective-[2000px]">
        {/* Behind Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-600 rounded-[2rem] blur-3xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        {/* Main Container */}
        <div className="relative mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10 max-w-6xl bg-[#0a0a0a] transform group-hover:translate-y-[-4px] transition-transform duration-700 ease-out">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent pointer-events-none z-10 mix-blend-overlay"></div>
          
          {/* Screenshots with transitions */}
          {tabs.map((tab) => (
            <img 
              key={tab.id}
              src={tab.image} 
              alt={`Cenvora ${tab.label} Interface`} 
              loading="lazy"
              className={`w-full h-auto object-cover transition-opacity duration-500 ${
                activeTab === tab.id ? 'opacity-100' : 'opacity-0 absolute inset-0'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Feature Pills */}
      <div className="flex flex-wrap justify-center gap-3 mt-8">
        {activeTab === 'dashboard' && (
          <>
            <span className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">Real-time Analytics</span>
            <span className="px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-xs font-medium">Live Charts</span>
            <span className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-medium">Quick Actions</span>
          </>
        )}
        {activeTab === 'sales' && (
          <>
            <span className="px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-xs font-medium">One-Click Invoicing</span>
            <span className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">GST Compliant</span>
            <span className="px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-xs font-medium">PDF Export</span>
          </>
        )}
        {activeTab === 'inventory' && (
          <>
            <span className="px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full text-xs font-medium">Batch Tracking</span>
            <span className="px-4 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-medium">Low Stock Alerts</span>
            <span className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">Multi-Warehouse</span>
          </>
        )}
      </div>
    </div>
  );
};

const BILLING_CYCLES = [
  { code: 'monthly', label: 'Monthly', multiplier: 1, discount: 0, duration: 'month', badge: 'Pay monthly' },
  { code: 'quarterly', label: 'Quarterly', multiplier: 3, discount: 0.15, duration: '3 months', badge: '15% off' },
  { code: 'yearly', label: 'Yearly', multiplier: 12, discount: 0.30, duration: 'year', badge: '30% off' },
];

const formatINR = (value) => {
  const amount = Number(value || 0);
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

const getCyclePrice = (monthlyPrice, cycle) => monthlyPrice * cycle.multiplier * (1 - cycle.discount);
const getOriginalCyclePrice = (originalMonthlyPrice, cycle) => originalMonthlyPrice * cycle.multiplier;

export default function LandingPage() {
  useScrollAnimation();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const selectedCycle = BILLING_CYCLES.find((cycle) => cycle.code === billingCycle) || BILLING_CYCLES[0];

  const planCards = [
    {
      code: 'starter',
      name: 'Starter',
      monthlyPrice: 0,
      originalMonthlyPrice: 0,
      cta: 'Get Started Free',
      ctaStyle: 'block w-full py-3 rounded-xl border border-gray-700 text-white text-center font-medium hover:bg-white hover:text-black transition-colors mb-8',
      description: 'For small teams getting started with billing and customer work',
      billingText: 'Free forever',
      features: [
        'Sales invoices',
        'Customer management',
        'Payments tracking',
        'Profile and setup tools',
      ],
    },
    {
      code: 'pro',
      name: 'Pro',
      monthlyPrice: 1599,
      originalMonthlyPrice: 1899,
      trialDays: 14,
      cta: 'Start 14-Day Trial',
      ctaStyle: 'block w-full py-3 rounded-xl bg-white text-black text-center font-bold hover:bg-gray-200 transition-colors mb-8 shadow-lg shadow-white/10',
      description: 'For growing shops that need more control',
      highlight: 'Most Popular',
      features: [
        'Everything in Starter',
        'Inventory module',
        'Dashboard analytics',
        'Integrations and advanced reports',
      ],
    },
    {
      code: 'business',
      name: 'Business',
      monthlyPrice: 1999,
      originalMonthlyPrice: 1999,
      trialDays: 14,
      cta: 'Start 14-Day Trial',
      ctaStyle: 'block w-full py-3 rounded-xl border border-gray-700 text-white text-center font-medium hover:bg-white hover:text-black transition-colors mb-8',
      description: 'For larger teams and multi-location operations',
      features: [
        'Everything in Pro',
        'Warehouses and multi-location inventory',
        'ML forecasts and restock predictions',
        'Gemini AI business assistant + priority support',
      ],
    },
  ];

  return (
    <div className="font-sans text-white overflow-x-hidden bg-black selection:bg-purple-500/30">
      
      {/* Background Texture Grid */}
      <div className="fixed inset-0 bg-grid z-0 pointer-events-none opacity-40"></div>

      {/* 1. Floating Pill Navbar */}
      <PublicNavbar
        links={[
          { label: 'Features', href: '#features' },
          { label: 'Pricing', href: '#pricing' },
          { label: 'Contact', href: '/contact' },
        ]}
      />

      {/* 2. Hero Section */}
      <section className="pt-40 pb-20 text-center relative overflow-hidden z-10">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-transparent -z-10"></div>
        
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold mb-8 opacity-0 animate-fade-up tracking-wide">
             <span className="animate-pulse mr-2">●</span> Built for Indian businesses
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-400 opacity-0 animate-fade-up delay-100 drop-shadow-2xl leading-none">
            Simple business <br/>
            software.
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 opacity-0 animate-fade-up delay-200 leading-relaxed font-light">
            Cenvora helps you manage sales, stock, customers, and billing in one place. It is made for shop owners, traders, and growing businesses that want less confusion and more control.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-up delay-300">
            <Link to="/signup" className="btn-primary w-full sm:w-auto shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.4)]">
              Start Now
            </Link>
            <a href="#demo" className="btn-secondary w-full sm:w-auto justify-center">
              See how it works <ArrowRightIcon className="w-5 h-5"/>
             </a>
          </div>

          {/* Hero Screenshot Showcase */}
          <ScreenshotShowcase />
        </div>
      </section>

      {/* 3. Bento Grid Section */}
      <section id="features" className="py-32 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-24 scroll-animate">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white tracking-tight">Clear tools for daily business work.<br/> No complicated setup.</h2>
            <p className="text-2xl text-gray-500 font-light max-w-2xl mx-auto">Handle billing, stock, and reports without needing a tech expert.</p>
          </div>

          {/* Bento Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[650px]">
             
             {/* Card 1: Inventory (Gradient) */}
             <div className="bento-card col-span-1 md:col-span-2 row-span-2 scroll-animate flex flex-col justify-between group !p-0 bg-gradient-to-br from-[#101010] to-black overflow-hidden relative">
                <div className="p-10 z-20 relative">
                   <div className="flex items-center gap-2 mb-4 text-cyan-400 font-bold text-xs tracking-widest uppercase">
                     <ChartBarIcon className="w-5 h-5" /> Inventory
                   </div>
                   <h3 className="text-4xl font-bold mb-4 text-white">Know what is in stock.</h3>
                   <p className="text-gray-400 max-w-md text-lg leading-relaxed">See stock, batches, and warehouse movement clearly so you know what is available before you sell.</p>
                </div>
                
                {/* Visual decoration */}
                <div className="relative w-full h-80 mt-auto">
                   <div className="absolute inset-x-12 -bottom-12 bg-[#0a0a0a] rounded-t-2xl border border-white/10 shadow-2xl h-full p-6 transform translate-y-8 group-hover:translate-y-4 transition-transform duration-700 ease-out">
                      {/* Abstract UI Lines */}
                      <div className="space-y-4 opacity-50 group-hover:opacity-100 transition-opacity duration-700">
                         <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <div className="h-3 w-32 bg-gray-800 rounded-full"></div>
                            <div className="h-3 w-12 bg-green-500/20 rounded-full"></div>
                         </div>
                         {[1,2,3].map(i => (
                             <div key={i} className="h-10 w-full bg-white/5 rounded-xl border border-white/5 flex items-center px-4">
                                <div className="h-2 w-full bg-gray-800/50 rounded-full"></div>
                             </div>
                         ))}
                      </div>
                   </div>
                   {/* Glow effect */}
                   <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cyan-900/20 to-transparent pointer-events-none"></div>
                </div>
             </div>

             {/* Card 2: Security */}
             <div className="bento-card bg-[#0a0a0a] scroll-animate group border-green-900/20 hover:border-green-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-green-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="flex flex-col h-full justify-between relative z-10">
                   <div className="w-14 h-14 bg-green-900/10 rounded-2xl flex items-center justify-center mb-6 text-green-500 group-hover:scale-110 transition-transform duration-300">
                      <ShieldCheckIcon className="w-7 h-7" />
                   </div>
                   <div>
                     <h3 className="text-2xl font-bold text-white mb-2">Safe access for your team.</h3>
                     <p className="text-gray-500 text-sm leading-relaxed">Give staff only the access they need, and keep your business data backed up and protected.</p>
                   </div>
                </div>
             </div>

             {/* Card 3: Mobile */}
             <div className="bento-card bg-[#0a0a0a] scroll-animate group hover:border-blue-500/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/5 group-hover:to-blue-900/10 transition-colors"></div>
                <div className="flex flex-col h-full justify-center items-center text-center relative z-10">
                   <div className="relative mb-8">
                      <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <DevicePhoneMobileIcon className="relative w-16 h-16 text-blue-400 group-hover:-translate-y-2 transition-transform duration-300" />
                   </div>
                   <h3 className="text-xl font-bold mb-2 text-white">Use it on phone or computer.</h3>
                   <p className="text-gray-500 text-sm px-4">Check sales, stock, and customers from anywhere, on any device.</p>
                </div>
             </div>

          </div>
          
          {/* Second Row of Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bento-card bg-[#0a0a0a] scroll-animate flex items-center p-0 overflow-hidden relative group">
                  <div className="p-10 w-2/3 relative z-10">
                    <h3 className="text-3xl font-bold mb-3 text-white">Fast billing.</h3>
                    <p className="text-gray-500 text-lg">Create bills quickly without extra clicks or confusing steps.</p>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-purple-900/20 to-transparent"></div>
                  <BoltIcon className="absolute -right-8 -bottom-8 w-48 h-48 text-purple-600/10 rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500" />
              </div>
              <div className="bento-card bg-[#0a0a0a] scroll-animate p-10 flex items-center justify-between group hover:bg-[#0f0f0f]">
                  <div>
                    <h3 className="text-3xl font-bold mb-3 text-white">GST ready.</h3>
                    <p className="text-gray-500 text-lg">GST reports, tax registers, and PDF export are built in.</p>
                  </div>
                  <GlobeAltIcon className="w-20 h-20 text-gray-800 group-hover:text-gray-600 transition-colors duration-300" />
              </div>
          </div>

        </div>
      </section>

      {/* 4. Pricing (Clean Dark) */}
      <section id="pricing" className="py-32 relative z-10">
        <div className="max-w-[980px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4 scroll-animate text-white">Simple pricing.</h2>
          <p className="text-gray-500 mb-16 scroll-animate">Choose the plan that fits your business.</p>

          <div className="mb-10 grid gap-3 text-left sm:grid-cols-3">
            {BILLING_CYCLES.map((cycle) => {
              const isActive = selectedCycle.code === cycle.code;
              return (
                <button
                  key={cycle.code}
                  type="button"
                  onClick={() => setBillingCycle(cycle.code)}
                  className={`rounded-2xl border p-4 transition-colors ${
                    isActive
                      ? 'border-cyan-400/50 bg-cyan-400/10 text-white'
                      : 'border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{cycle.label}</span>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-cyan-400 text-black' : 'bg-white/10 text-gray-300'}`}>
                      {cycle.badge}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {cycle.code === 'monthly' ? '30-day billing' : `${cycle.duration} billing`}
                  </p>
                </button>
              );
            })}
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 text-left">
             {planCards.map((plan) => {
               const isFree = plan.monthlyPrice === 0;
               const amount = isFree ? 0 : getCyclePrice(plan.monthlyPrice, selectedCycle);
               const originalAmount = isFree ? 0 : getOriginalCyclePrice(plan.originalMonthlyPrice, selectedCycle);
               const showOriginal = originalAmount > amount;

               return (
               <div
                 key={plan.code}
                 className={`p-8 bg-[#0a0a0a] rounded-3xl border scroll-animate transition-colors ${plan.code === 'pro' ? 'border-purple-500/30 shadow-2xl shadow-purple-900/20 relative overflow-hidden transform md:-translate-y-4 scale-105 z-10' : 'border-[#222] hover:border-gray-600'}`}
               >
                 {plan.highlight ? (
                   <>
                     <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 to-purple-500"></div>
                     <div className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-wider uppercase mb-2">{plan.highlight}</div>
                   </>
                 ) : null}
                 <h3 className="text-xl font-semibold mb-2 text-white">{plan.name}</h3>
                 <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                 <div className="mb-2 flex items-end gap-2">
                   <p className="text-3xl font-bold text-white">₹{formatINR(amount)}</p>
                   <span className="pb-1 text-base font-normal text-gray-500">/{isFree ? 'forever' : selectedCycle.duration}</span>
                 </div>
                 {showOriginal ? (
                   <p className="mb-2 text-sm text-gray-500">
                     <span className="line-through">₹{formatINR(originalAmount)}</span>
                     <span className="ml-2 text-emerald-300">{selectedCycle.discount ? `${Math.round(selectedCycle.discount * 100)}% off` : 'Discounted'}</span>
                   </p>
                 ) : null}
                 <p className="mb-6 text-xs uppercase tracking-wider text-gray-500">{plan.billingText || `Trial: ${plan.trialDays} days`}</p>
                 <Link to="/signup" className={plan.ctaStyle}>
                     {plan.cta}
                 </Link>
                 <ul className="space-y-4 text-sm text-gray-400">
                     {plan.features.map((feature) => (
                       <li key={feature} className="flex gap-3"><CheckCircleIcon className="w-5 h-5 text-gray-200" /> {feature}</li>
                     ))}
                 </ul>
             </div>
             )})}
          </div>

        </div>
      </section>

      {/* 5. Clean Footer */}
      <footer className="bg-black py-16 border-t border-white/5 relative z-10">
        <div className="max-w-[980px] mx-auto px-6">
           <div className="flex flex-col md:flex-row justify-between items-center mb-12">
              <Link to="/" className="flex items-center mb-4 md:mb-0 hover:opacity-80 transition-opacity">
                  <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="h-10 w-auto object-contain" />
              </Link>
                <div className="flex gap-8 text-sm text-gray-400">
                  <a href="https://www.instagram.com/cenvora.app/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Instagram</a>
                  <a href="https://www.facebook.com/cenvora.app/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Facebook</a>
              </div>
           </div>
           
           <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between text-xs text-gray-600 gap-4">
              <p>&copy; {new Date().getFullYear()} Cenvora Inc. All rights reserved.</p>
              <div className="flex gap-6">
                <Link to="/contact" className="hover:text-gray-400">Contact</Link>
                 <Link to="/privacy" className="hover:text-gray-400">Privacy</Link>
                 <Link to="/terms" className="hover:text-gray-400">Terms</Link>
                 <Link to="/sitemap" className="hover:text-gray-400">Sitemap</Link>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
