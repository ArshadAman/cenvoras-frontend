import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { animate, createScope, spring, stagger } from 'animejs';

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const root = useRef(null);
  const scope = useRef(null);

  // Add CSS animations
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes floatUp {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(5deg); }
      }
      
      @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes particle-float {
        0% { transform: translateY(100vh) translateX(-5px) rotate(0deg); opacity: 0; }
        10% { opacity: 0.6; }
        90% { opacity: 0.6; }
        100% { transform: translateY(-100vh) translateX(5px) rotate(180deg); opacity: 0; }
      }
      
      .floating-element {
        animation: floatUp 12s infinite ease-in-out;
      }
      
      .floating-element:nth-child(2) { animation-delay: -2s; }
      .floating-element:nth-child(3) { animation-delay: -4s; }
      .floating-element:nth-child(4) { animation-delay: -6s; }
      .floating-element:nth-child(5) { animation-delay: -8s; }
      
      .gradient-text {
        background: linear-gradient(-45deg, #7fd3f7, #b6e0f7, #eaf6fa, #7fd3f7);
        background-size: 400% 400%;
        animation: gradient-shift 8s ease infinite;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .particle {
        animation: particle-float 15s infinite linear;
      }
      
      .particle:nth-child(1) { animation-delay: -3s; }
      .particle:nth-child(2) { animation-delay: -8s; }
      .particle:nth-child(3) { animation-delay: -12s; }
      
      .scroll-smooth {
        scroll-behavior: smooth;
      }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scope.current = createScope({ root }).add(self => {
        // Navigation animations
        animate('nav', {
          opacity: [0, 1],
          translateY: [-20, 0],
          duration: 600,
          delay: 0,
          easing: 'outCubic'
        });

        // Hero brand animation
        animate('.hero-brand', {
          opacity: [0, 1],
          scale: [0.8, 1],
          duration: 800,
          delay: 200,
          easing: 'outCubic'
        });

        // Desktop nav items staggered animation
        animate('.nav-item', {
          opacity: [0, 1],
          translateX: [20, 0],
          delay: stagger(100, { start: 300 }),
          duration: 500,
          easing: 'outCubic'
        });

        // Hero title animation
        animate('.hero-title', {
          opacity: [0, 1],
          translateY: [40, 0],
          duration: 800,
          delay: 600,
          easing: 'outCubic'
        });

        // Hero subtitle animation
        animate('.hero-subtitle', {
          opacity: [0, 1],
          translateY: [30, 0],
          duration: 700,
          delay: 800,
          easing: 'outCubic'
        });

        // Hero CTA buttons animation
        animate('.hero-cta', {
          opacity: [0, 1],
          translateY: [30, 0],
          scale: [0.9, 1],
          delay: stagger(150, { start: 1000 }),
          duration: 600,
          easing: 'outCubic'
        });

        // Feature cards animation
        animate('.feature-card', {
          opacity: [0, 1],
          translateY: [50, 0],
          scale: [0.9, 1],
          delay: stagger(200, { start: 1200 }),
          duration: 700,
          easing: 'outCubic'
        });
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      scope.current?.revert();
    };
  }, []);

  // Scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // All features from the app
  const features = [
    {
      icon: '📊',
      title: 'Sales Management',
      description: 'Complete sales pipeline management with lead tracking, deal closure, and performance analytics.',
      details: ['Lead management', 'Sales pipeline tracking', 'Revenue analytics', 'Customer insights']
    },
    {
      icon: '📦',
      title: 'Inventory Management', 
      description: 'Real-time inventory tracking with automated stock alerts and product management.',
      details: ['Stock level monitoring', 'Product categorization', 'Low stock alerts', 'Stock adjustments']
    },
    {
      icon: '👥',
      title: 'Customer Management',
      description: 'Comprehensive customer database with detailed profiles and interaction history.',
      details: ['Customer profiles', 'Contact management', 'Customer history', 'Relationship tracking']
    },
    {
      icon: '💰',
      title: 'Purchase Management',
      description: 'Streamlined purchase processes with vendor management and purchase tracking.',
      details: ['Purchase orders', 'Vendor management', 'Purchase analytics', 'Cost tracking']
    },
    {
      icon: '📋',
      title: 'General Ledger',
      description: 'Complete accounting system with chart of accounts and financial reporting.',
      details: ['Chart of accounts', 'Double-entry bookkeeping', 'Financial statements', 'Trial balance']
    },
    {
      icon: '📈',
      title: 'Analytics & Reports',
      description: 'Powerful business intelligence with real-time dashboards and custom reports.',
      details: ['Business dashboard', 'Custom reports', 'Performance metrics', 'Data visualization']
    },
    {
      icon: '💳',
      title: 'Payment Processing',
      description: 'Integrated payment solutions with multiple payment methods and tracking.',
      details: ['Payment tracking', 'Invoice management', 'Payment history', 'Outstanding balances']
    },
    {
      icon: '🔄',
      title: 'Bulk Operations',
      description: 'Efficient bulk data management for large-scale operations and data imports.',
      details: ['Bulk data entry', 'CSV imports', 'Mass updates', 'Data migration tools']
    }
  ];

  return (
    <div ref={root} className="min-h-screen bg-gradient-to-br from-[#1a2341] via-[#2d3a5f] to-[#1a2341] relative overflow-hidden scroll-smooth">
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          {/* Moving paths */}
          <path d="M-200,100 Q200,50 600,100 Q1000,150 1600,100" stroke="url(#gradient1)" strokeWidth="2" fill="none" opacity="0.4" />
          <path d="M-100,300 Q300,250 700,300 Q1100,350 1500,300" stroke="url(#gradient2)" strokeWidth="1.5" fill="none" opacity="0.3" />
          <path d="M0,600 Q360,450 720,600 Q1080,750 1440,600" stroke="url(#gradient3)" strokeWidth="1" fill="none" opacity="0.3" />
          
          {/* Animated geometric patterns */}
          <circle cx="200" cy="150" r="3" fill="#7fd3f7" opacity="0.8" className="floating-element">
            <animate attributeName="r" values="2;5;2" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="800" cy="300" r="4" fill="#b6e0f7" opacity="0.7" className="floating-element" />
          <circle cx="1200" cy="500" r="2.5" fill="#eaf6fa" opacity="0.8" className="floating-element" />
          
          {/* Additional floating elements */}
          <rect x="100" y="100" width="4" height="4" fill="#b6e0f7" opacity="0.5" className="floating-element" transform="rotate(45)">
            <animateTransform attributeName="transform" type="rotate" values="0;360" dur="10s" repeatCount="indefinite" />
          </rect>
          
          {/* Gradients */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7fd3f7" />
              <stop offset="50%" stopColor="#b6e0f7" />
              <stop offset="100%" stopColor="#eaf6fa" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b6e0f7" />
              <stop offset="100%" stopColor="#7fd3f7" />
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#eaf6fa" />
              <stop offset="100%" stopColor="#b6e0f7" />
            </linearGradient>
          </defs>
          
          {/* Grid pattern */}
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#7fd3f7" strokeWidth="0.5" opacity="0.1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" opacity="0.03" />
        </svg>
        
        {/* Animated Particles */}
        <div className="particle absolute left-10 w-1 h-1 bg-[#7fd3f7]/60 rounded-full"></div>
        <div className="particle absolute left-20 w-2 h-2 bg-[#b6e0f7]/40 rounded-full"></div>
        <div className="particle absolute right-16 w-1.5 h-1.5 bg-[#eaf6fa]/50 rounded-full"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-4 sm:px-8 pt-6 sm:pt-8 opacity-0">
        <div className="flex justify-between items-center">
          <div className="hero-brand flex items-center gap-2 sm:gap-3 group cursor-pointer opacity-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#7fd3f7] to-[#1a2341] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
              <span className="text-white font-bold text-lg sm:text-xl group-hover:rotate-12 transition-transform duration-300">C</span>
            </div>
            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
              Cenvora
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 desktop-nav">
            <button 
              onClick={() => scrollToSection('features')}
              className={`nav-item text-[#7fd3f7] hover:text-[#b6e0f7] transition-all duration-300 font-semibold relative group transform hover:scale-105 opacity-0 ${activeSection === 'features' ? 'text-[#b6e0f7]' : ''}`}
            >
              Features
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] transition-all duration-300 ${activeSection === 'features' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className={`nav-item text-[#7fd3f7] hover:text-[#b6e0f7] transition-all duration-300 font-semibold relative group transform hover:scale-105 opacity-0 ${activeSection === 'about' ? 'text-[#b6e0f7]' : ''}`}
            >
              About
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] transition-all duration-300 ${activeSection === 'about' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className={`nav-item text-[#7fd3f7] hover:text-[#b6e0f7] transition-all duration-300 font-semibold relative group transform hover:scale-105 opacity-0 ${activeSection === 'contact' ? 'text-[#b6e0f7]' : ''}`}
            >
              Contact
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] transition-all duration-300 ${activeSection === 'contact' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
            <Link 
              to="/login" 
              className="nav-item px-6 py-3 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] text-[#1a2341] font-bold rounded-xl hover:from-[#6bc9f2] hover:to-[#a8d8f4] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden group opacity-0"
            >
              <span className="relative z-10">Sign In</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="nav-item md:hidden p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:scale-110 transition-all duration-300 group shadow-lg opacity-0"
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M6 18L18 6M6 6l12 12"
                  className="animate-pulse" 
                />
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 12h16" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 18h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Outside nav for proper z-index layering */}
      <div className={`md:hidden fixed inset-0 z-[100] transition-all duration-500 ease-in-out ${
        isMobileMenuOpen 
          ? 'opacity-100 visible' 
          : 'opacity-0 invisible pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2341] via-[#0d1421] to-[#1a2341]"></div>
        
        {/* Menu Panel */}
        <div className={`relative h-full w-full flex flex-col transform transition-all duration-500 ease-out ${
          isMobileMenuOpen 
            ? 'translate-y-0 scale-100' 
            : '-translate-y-8 scale-95'
        }`}>
          {/* Mobile Menu Header */}
          <div className="flex justify-between items-center p-6 border-b border-[#7fd3f7]/20 bg-gradient-to-r from-[#1a2341]/90 to-[#2d3a5f]/90 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#7fd3f7] to-[#1a2341] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] bg-clip-text text-transparent">
                Cenvora
              </span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-gradient-to-r from-[#7fd3f7]/20 to-[#b6e0f7]/20 backdrop-blur-sm border border-[#7fd3f7]/30 text-white hover:bg-[#7fd3f7]/30 hover:scale-110 transition-all duration-300 group"
            >
              <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Items - Centered in remaining space */}
          <div className="flex-1 flex flex-col justify-center items-center space-y-8 px-8 py-12 relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#7fd3f7]/5 to-transparent"></div>
            
            {[
              { id: 'features', label: 'Features', delay: 'delay-75' },
              { id: 'about', label: 'About', delay: 'delay-150' },
              { id: 'contact', label: 'Contact', delay: 'delay-225' }
            ].map((item, index) => (
              <button 
                key={item.id}
                onClick={() => {
                  scrollToSection(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`relative w-full max-w-sm text-2xl font-bold text-center py-4 px-8 rounded-2xl transition-all duration-500 transform hover:scale-105 ${item.delay} ${
                  isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                } ${
                  activeSection === item.id 
                    ? 'bg-gradient-to-r from-[#7fd3f7]/30 to-[#b6e0f7]/30 text-[#b6e0f7] shadow-xl border border-[#7fd3f7]/50 backdrop-blur-sm' 
                    : 'text-[#7fd3f7] hover:text-[#b6e0f7] hover:bg-gradient-to-r hover:from-[#7fd3f7]/10 hover:to-[#b6e0f7]/10 border border-[#7fd3f7]/20 hover:border-[#7fd3f7]/40 backdrop-blur-sm'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            {/* Sign In Button - Separated with more space */}
            <div className="pt-8">
              <Link 
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block w-full max-w-sm text-2xl font-bold text-center py-4 px-8 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] text-[#1a2341] rounded-2xl hover:from-[#6bc9f2] hover:to-[#a8d8f4] transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:scale-105 delay-300 relative overflow-hidden group ${
                  isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                }`}
              >
                <span className="relative z-10">Sign In</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              </Link>
            </div>
          </div>

          {/* Enhanced Decorative Elements */}
          <div className="absolute top-1/4 left-8 w-2 h-16 bg-gradient-to-b from-[#7fd3f7]/80 to-transparent rounded-full opacity-80 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-8 w-3 h-12 bg-gradient-to-t from-[#b6e0f7]/80 to-transparent rounded-full opacity-80 animate-pulse"></div>
          <div className="absolute top-1/2 left-4 w-1 h-8 bg-gradient-to-b from-[#eaf6fa]/60 to-transparent rounded-full opacity-60"></div>
          <div className="absolute top-1/3 right-12 w-1.5 h-6 bg-gradient-to-t from-[#7fd3f7]/40 to-transparent rounded-full opacity-70"></div>
        </div>
      </div>

      {/* Hero Section */}
      <section id="home" className="relative z-10 min-h-screen flex items-center justify-center px-4 py-16 sm:py-20">
        <div className="text-center max-w-6xl">
          <h1 className="hero-title gradient-text text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold mb-6 sm:mb-8 leading-tight">
            Business Management
            <br />
            <span className="text-white">Simplified</span>
          </h1>
          <p className="hero-subtitle text-[#b6e0f7]/90 text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
            Streamline your operations with Cenvora - the all-in-one platform for sales, inventory, 
            customer management, and financial tracking. Built for growing businesses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
            <Link 
              to="/signup" 
              className="hero-cta px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] text-[#1a2341] font-bold text-base sm:text-lg rounded-2xl hover:from-[#6bc9f2] hover:to-[#a8d8f4] transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 relative overflow-hidden group"
            >
              <span className="relative z-10">Start Free Trial</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            </Link>
            <button 
              onClick={() => scrollToSection('features')}
              className="hero-cta px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white font-bold text-base sm:text-lg rounded-2xl hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
            >
              Explore Features
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="gradient-text text-5xl lg:text-6xl font-bold mb-6">
              Complete Business Suite
            </h2>
            <p className="text-[#b6e0f7]/80 text-xl max-w-3xl mx-auto">
              Everything you need to manage and grow your business, all in one integrated platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="feature-card bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-white/15 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl group">
                <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#7fd3f7] transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-[#b6e0f7]/80 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="text-[#eaf6fa]/70 text-sm flex items-center">
                      <span className="w-1.5 h-1.5 bg-[#7fd3f7] rounded-full mr-3"></span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12 shadow-2xl">
            <div className="text-center mb-12">
              <h2 className="gradient-text text-5xl lg:text-6xl font-bold mb-6">
                About Cenvora
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] rounded-full mx-auto"></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-white mb-6">
                  Empowering Business Growth
                </h3>
                <p className="text-[#b6e0f7]/90 text-lg mb-6 leading-relaxed">
                  Cenvora is designed to simplify complex business operations through intelligent automation 
                  and intuitive design. We believe that powerful business tools should be accessible to 
                  businesses of all sizes.
                </p>
                <p className="text-[#b6e0f7]/90 text-lg mb-8 leading-relaxed">
                  Our comprehensive platform eliminates the need for multiple disconnected systems, 
                  providing a unified solution that grows with your business.
                </p>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold gradient-text mb-2">500+</div>
                    <div className="text-[#b6e0f7]/70">Active Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold gradient-text mb-2">99.9%</div>
                    <div className="text-[#b6e0f7]/70">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold gradient-text mb-2">24/7</div>
                    <div className="text-[#b6e0f7]/70">Support</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold gradient-text mb-2">8+</div>
                    <div className="text-[#b6e0f7]/70">Core Features</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-[#7fd3f7] mb-3">🎯 Our Mission</h4>
                  <p className="text-[#b6e0f7]/80">
                    To democratize enterprise-level business management tools, making them accessible 
                    and affordable for businesses of all sizes.
                  </p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-[#7fd3f7] mb-3">🚀 Our Vision</h4>
                  <p className="text-[#b6e0f7]/80">
                    To become the leading platform that empowers businesses to optimize their operations, 
                    make data-driven decisions, and achieve sustainable growth.
                  </p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-[#7fd3f7] mb-3">⭐ Our Values</h4>
                  <p className="text-[#b6e0f7]/80">
                    Innovation, reliability, and customer success drive everything we do. We're committed 
                    to continuous improvement and exceptional user experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="gradient-text text-5xl lg:text-6xl font-bold mb-6">
              Get In Touch
            </h2>
            <p className="text-[#b6e0f7]/80 text-xl max-w-3xl mx-auto">
              Ready to transform your business operations? We're here to help you get started.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-3xl font-bold text-white mb-8">Send us a Message</h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#b6e0f7] text-sm font-semibold mb-2">Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] transition-all duration-300"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className="block text-[#b6e0f7] text-sm font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] transition-all duration-300"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#b6e0f7] text-sm font-semibold mb-2">Subject</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] transition-all duration-300"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label className="block text-[#b6e0f7] text-sm font-semibold mb-2">Message</label>
                  <textarea
                    rows="5"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7fd3f7]/50 focus:border-[#7fd3f7] transition-all duration-300"
                    placeholder="Tell us about your business needs..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] text-[#1a2341] font-bold text-lg rounded-xl hover:from-[#6bc9f2] hover:to-[#a8d8f4] transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
                >
                  Send Message
                </button>
              </form>
            </div>
            
            {/* Contact Information */}
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6">Contact Information</h3>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] rounded-xl flex items-center justify-center">
                      <span className="text-[#1a2341] text-xl">📧</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">Email</div>
                      <div className="text-[#b6e0f7]/80">support@cenvora.app</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] rounded-xl flex items-center justify-center">
                      <span className="text-[#1a2341] text-xl">📞</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">Phone</div>
                      <div className="text-[#b6e0f7]/80">+1 (555) 123-4567</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] rounded-xl flex items-center justify-center">
                      <span className="text-[#1a2341] text-xl">🕒</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">Business Hours</div>
                      <div className="text-[#b6e0f7]/80">Mon - Fri: 9AM - 6PM EST</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6">Get Started Today</h3>
                <p className="text-[#b6e0f7]/80 mb-6">
                  Ready to transform your business operations? Start your free trial and see the difference Cenvora can make.
                </p>
                <div className="space-y-4">
                  <Link 
                    to="/signup"
                    className="block w-full py-3 px-6 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] text-[#1a2341] font-bold text-lg rounded-xl hover:from-[#6bc9f2] hover:to-[#a8d8f4] transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 text-center"
                  >
                    Start Free Trial
                  </Link>
                  <Link 
                    to="/login"
                    className="block w-full py-3 px-6 bg-white/10 border border-white/20 text-white font-bold text-lg rounded-xl hover:bg-white/20 transition-all duration-300 text-center"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 py-12 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#7fd3f7] to-[#1a2341] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">C</span>
                </div>
                <span className="text-2xl font-bold gradient-text">Cenvora</span>
              </div>
              <p className="text-[#b6e0f7]/70 mb-4 max-w-md">
                Empowering businesses with comprehensive management tools. Streamline your operations and accelerate growth.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors duration-300 cursor-pointer">
                  <span className="text-[#7fd3f7] text-sm">📘</span>
                </div>
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors duration-300 cursor-pointer">
                  <span className="text-[#7fd3f7] text-sm">🐦</span>
                </div>
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors duration-300 cursor-pointer">
                  <span className="text-[#7fd3f7] text-sm">💼</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-[#b6e0f7]/70">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-[#7fd3f7] transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('about')} className="hover:text-[#7fd3f7] transition-colors">About</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-[#7fd3f7] transition-colors">Contact</button></li>
                <li><Link to="/signup" className="hover:text-[#7fd3f7] transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-[#b6e0f7]/70">
                <li><a href="#" className="hover:text-[#7fd3f7] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#7fd3f7] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[#7fd3f7] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#7fd3f7] transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-[#b6e0f7]/70">
              © {new Date().getFullYear()} Cenvora. All rights reserved. Built with ❤️ for growing businesses.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}