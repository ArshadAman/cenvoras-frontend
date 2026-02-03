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
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, image: '/dashbaord.png' },
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

export default function LandingPage() {
  useScrollAnimation();

  return (
    <div className="font-sans text-white overflow-x-hidden bg-black selection:bg-purple-500/30">
      
      {/* Background Texture Grid */}
      <div className="fixed inset-0 bg-grid z-0 pointer-events-none opacity-40"></div>

      {/* 1. Floating Pill Navbar */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center">
        <div className="glass-nav px-6 py-3 flex items-center justify-between gap-12 max-w-5xl shadow-2xl">
          <Link to="/" className="text-lg font-bold tracking-tight text-white hover:opacity-80 transition-opacity flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-lg"></div>
            Cenvora
          </Link>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Enterprise</a>
          </div>

          <div className="flex items-center gap-4">
             <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Log In</Link>
             <Link to="/signup" className="text-sm font-semibold bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">
              Get Started
             </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="pt-40 pb-20 text-center relative overflow-hidden z-10">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-transparent -z-10"></div>
        
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold mb-8 opacity-0 animate-fade-up tracking-wide">
             <span className="animate-pulse mr-2">●</span> ENGINEERED FOR PERFECTION
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-400 opacity-0 animate-fade-up delay-100 drop-shadow-2xl leading-none">
            Commerce, <br/>
            Evolved.
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 opacity-0 animate-fade-up delay-200 leading-relaxed font-light">
            Forget clunky ERPs. Cenvora is the <span className="text-white font-medium">high-performance engine</span> your business deserves. Real-time inventory, instant billing, and insights that feel like clairvoyance.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-up delay-300">
            <Link to="/signup" className="btn-primary w-full sm:w-auto shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.4)]">
              Experience Cenvora
            </Link>
            <a href="#demo" className="btn-secondary w-full sm:w-auto justify-center">
              Watch the magic <ArrowRightIcon className="w-5 h-5"/>
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
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white tracking-tight">It’s not just software.<br/> It’s a superpower.</h2>
            <p className="text-2xl text-gray-500 font-light max-w-2xl mx-auto">Every pixel designed to save you time and make you money.</p>
          </div>

          {/* Bento Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[650px]">
             
             {/* Card 1: Inventory (Gradient) */}
             <div className="bento-card col-span-1 md:col-span-2 row-span-2 scroll-animate flex flex-col justify-between group !p-0 bg-gradient-to-br from-[#101010] to-black overflow-hidden relative">
                <div className="p-10 z-20 relative">
                   <div className="flex items-center gap-2 mb-4 text-cyan-400 font-bold text-xs tracking-widest uppercase">
                      <ChartBarIcon className="w-5 h-5" /> inventory 2.0
                   </div>
                   <h3 className="text-4xl font-bold mb-4 text-white">Inventory that thinks.</h3>
                   <p className="text-gray-400 max-w-md text-lg leading-relaxed">Stop guessing. We track every batch, every expiry, and every movement across all your warehouses in real-time. It’s like having a dedicated manager for every shelf.</p>
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
                      <h3 className="text-2xl font-bold text-white mb-2">Fort Knox, Digital.</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">Your data is encrypted with AES-256 and backed up daily. Sleep soundly knowing your business is bulletproof.</p>
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
                   <h3 className="text-xl font-bold mb-2 text-white">Your shop, anywhere.</h3>
                   <p className="text-gray-500 text-sm px-4">Check sales from your couch. Or the beach. Works on any device, instantly.</p>
                </div>
             </div>

          </div>
          
          {/* Second Row of Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bento-card bg-[#0a0a0a] scroll-animate flex items-center p-0 overflow-hidden relative group">
                  <div className="p-10 w-2/3 relative z-10">
                      <h3 className="text-3xl font-bold mb-3 text-white">Ludicrous Speed.</h3>
                      <p className="text-gray-500 text-lg">Billing so fast, your customers won't have time to blink. Keyboard-first design for power users.</p>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-purple-900/20 to-transparent"></div>
                  <BoltIcon className="absolute -right-8 -bottom-8 w-48 h-48 text-purple-600/10 rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500" />
              </div>
              <div className="bento-card bg-[#0a0a0a] scroll-animate p-10 flex items-center justify-between group hover:bg-[#0f0f0f]">
                  <div>
                    <h3 className="text-3xl font-bold mb-3 text-white">Global Scale.</h3>
                    <p className="text-gray-500 text-lg">GSTR-1 Reports, Multi-Currency, <br/>and export to anything.</p>
                  </div>
                  <GlobeAltIcon className="w-20 h-20 text-gray-800 group-hover:text-gray-600 transition-colors duration-300" />
              </div>
          </div>

        </div>
      </section>

      {/* 4. Pricing (Clean Dark) */}
      <section id="pricing" className="py-32 relative z-10">
        <div className="max-w-[980px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4 scroll-animate text-white">Simple Pricing.</h2>
          <p className="text-gray-500 mb-16 scroll-animate">No hidden fees. Cancel anytime.</p>
          
          <div className="grid md:grid-cols-3 gap-6 text-left">
             {/* Starter */}
             <div className="p-8 bg-[#0a0a0a] rounded-3xl border border-[#222] scroll-animate hover:border-gray-600 transition-colors">
                 <h3 className="text-xl font-semibold mb-2 text-white">Starter</h3>
                 <p className="text-3xl font-bold mb-6 text-white">₹49<span className="text-base font-normal text-gray-500">/mo</span></p>
                 <Link to="/signup" className="block w-full py-3 rounded-xl border border-gray-700 text-white text-center font-medium hover:bg-white hover:text-black transition-colors mb-8">
                     Start Free Trial
                 </Link>
                 <ul className="space-y-4 text-sm text-gray-400">
                     <li className="flex gap-3"><CheckCircleIcon className="w-5 h-5 text-gray-200" /> 1 User</li>
                     <li className="flex gap-3"><CheckCircleIcon className="w-5 h-5 text-gray-200" /> Basic Invoicing</li>
                     <li className="flex gap-3"><CheckCircleIcon className="w-5 h-5 text-gray-200" /> 5 Clients</li>
                 </ul>
             </div>

             {/* Growth - Highlighted */}
             <div className="p-8 bg-[#111] border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-900/20 relative overflow-hidden scroll-animate transform md:-translate-y-4 scale-105 z-10">
                 <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 to-purple-500"></div>
                 <div className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-wider uppercase mb-2">Most Popular</div>
                 <h3 className="text-2xl font-bold mb-2 text-white">Growth</h3>
                 <p className="text-3xl font-bold mb-6 text-white">₹199<span className="text-base font-normal text-gray-400">/mo</span></p>
                 <Link to="/signup" className="block w-full py-3 rounded-xl bg-white text-black text-center font-bold hover:bg-gray-200 transition-colors mb-8 shadow-lg shadow-white/10">
                     Get Started
                 </Link>
                 <ul className="space-y-4 text-sm text-gray-300">
                     <li className="flex gap-3"><CheckCircleIcon className="w-5 h-5 text-purple-400" /> Unlimited Users</li>
                     <li className="flex gap-3"><CheckCircleIcon className="w-5 h-5 text-purple-400" /> Inventory Tracking</li>
                     <li className="flex gap-3"><CheckCircleIcon className="w-5 h-5 text-purple-400" /> 50 Clients</li>
                     <li className="flex gap-3"><CheckCircleIcon className="w-5 h-5 text-purple-400" /> Financial Reports</li>
                 </ul>
             </div>

             {/* Pro */}
             <div className="p-8 bg-[#0a0a0a] rounded-3xl border border-[#222] scroll-animate hover:border-gray-600 transition-colors">
                 <h3 className="text-xl font-semibold mb-2 text-white">Pro</h3>
                 <p className="text-3xl font-bold mb-6 text-white">₹499<span className="text-base font-normal text-gray-500">/mo</span></p>
                 <Link to="/signup" className="block w-full py-3 rounded-xl border border-gray-700 text-white text-center font-medium hover:bg-white hover:text-black transition-colors mb-8">
                     Contact Sales
                 </Link>
                 <ul className="space-y-4 text-sm text-gray-400">
                     <li className="flex gap-3"><CheckCircleIcon className="w-5 h-5 text-gray-200" /> Needs Analysis</li>
                     <li className="flex gap-3"><CheckCircleIcon className="w-5 h-5 text-gray-200" /> Custom Branding</li>
                     <li className="flex gap-3"><CheckCircleIcon className="w-5 h-5 text-gray-200" /> API Access</li>
                 </ul>
             </div>
          </div>
        </div>
      </section>

      {/* 5. Clean Footer */}
      <footer className="bg-black py-16 border-t border-white/5 relative z-10">
        <div className="max-w-[980px] mx-auto px-6">
           <div className="flex flex-col md:flex-row justify-between items-center mb-12">
              <div className="text-2xl font-bold tracking-tight text-white mb-4 md:mb-0">Cenvora</div>
              <div className="flex gap-8 text-sm text-gray-400">
                 <a href="#" className="hover:text-white transition-colors">Twitter</a>
                 <a href="#" className="hover:text-white transition-colors">GitHub</a>
                 <a href="#" className="hover:text-white transition-colors">Discord</a>
              </div>
           </div>
           
           <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between text-xs text-gray-600 gap-4">
              <p>&copy; {new Date().getFullYear()} Cenvora Inc. All rights reserved.</p>
              <div className="flex gap-6">
                 <a href="#" className="hover:text-gray-400">Privacy</a>
                 <a href="#" className="hover:text-gray-400">Terms</a>
                 <a href="#" className="hover:text-gray-400">Sitemap</a>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}