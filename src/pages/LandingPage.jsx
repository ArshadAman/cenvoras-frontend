import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon, 
  CheckCircleIcon, 
  ChartBarIcon, 
  BoltIcon, 
  ShieldCheckIcon, 
  UserGroupIcon, 
  CurrencyRupeeIcon, 
  ArrowRightIcon, 
  StarIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

// Simple hook for scroll animations
const useScrollAnimation = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-slide-up');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scroll-animate').forEach((el) => {
      el.classList.add('opacity-0', 'translate-y-10', 'transition-all', 'duration-700');
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
};

import CanvasBackground from '../components/CanvasBackground';

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  
  useScrollAnimation();

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    {
      icon: ChartBarIcon,
      title: 'Advanced Analytics',
      description: 'Gain deep insights into your business performance with real-time dashboards and custom reports.'
    },
    {
      icon: BoltIcon,
      title: 'Lightning Fast',
      description: 'Experience zero lag with our optimized platform designed for speed and efficiency.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Bank-Grade Security',
      description: 'Your data is protected with state-of-the-art encryption and regular security audits.'
    },
    {
      icon: UserGroupIcon,
      title: 'Team Collaboration',
      description: 'Work together seamlessly with role-based access control and real-time updates.'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '₹49',
      period: '/month',
      description: 'Perfect for freelancers and small startups.',
      features: ['Basic Invoicing', 'Expense Tracking', '5 Clients', 'Email Support'],
      highlight: false
    },
    {
      name: 'Growth',
      price: '₹199',
      period: '/month',
      description: 'For growing businesses scaling up.',
      features: ['Unlimited Invoicing', 'Inventory Management', '50 Clients', 'Priority Support', 'Financial Reports'],
      highlight: true
    },
    {
      name: 'Pro',
      price: '₹499',
      period: '/month',
      description: 'Ultimate power for established enterprises.',
      features: ['Everything in Growth', 'API Access', 'Unlimited Clients', 'Dedicated Account Manager', 'Custom Branding'],
      highlight: false
    }
  ];

  const faqs = [
    {
      question: "Is there a free trial available?",
      answer: "Yes! We offer a 14-day free trial on all plans so you can explore Cenvora risk-free."
    },
    {
      question: "Can I upgrade or downgrade my plan?",
      answer: "Absolutely. You can change your plan at any time from your account settings."
    },
    {
      question: "Is my data secure?",
      answer: "We use industry-standard encryption and secure servers to ensure your data is always safe."
    },
    {
      question: "Do you offer customer support?",
      answer: "Yes, our dedicated support team is available 24/7 to assist you with any queries."
    }
  ];



  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-x-hidden font-sans selection:bg-cyan-500/30 relative">
      
      {/* Advanced Interactive Background */}
      <CanvasBackground />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#1a2341]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Cenvora</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Pricing</a>
              <a href="#testimonials" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Testimonials</a>
              <Link to="/login" className="text-sm font-medium text-white hover:text-cyan-400 transition-colors">Log In</Link>
              <Link to="/signup" className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-300">
                Get Started
              </Link>
            </div>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-slate-300 hover:text-white">
              {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-[#1a2341] border-b border-white/10 p-4 flex flex-col gap-4 shadow-2xl animate-fade-in">
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg hover:bg-white/5">Features</a>
            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg hover:bg-white/5">Pricing</a>
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg hover:bg-white/5">Log In</Link>
            <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="p-3 bg-cyan-600 rounded-lg text-center font-bold">Get Started</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] -z-10 opacity-50 animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] -z-10 opacity-30"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-sm font-medium text-cyan-300">New: Inventory Tracking 2.0</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 animate-slide-up">
            Master Your <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">Business Universe.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 animate-slide-up delay-100">
            Cenvora provides the ultimate toolkit for modern businesses. Track sales, manage inventory, and analyze growth—all in one stunning interface.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-200">
            <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group">
              Start Free Trial
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-bold text-lg hover:bg-white/10 hover:-translate-y-1 transition-all duration-300">
              View Demo
            </a>
          </div>

          {/* 3D Dashboard Mockup */}
          <div className="mt-20 relative mx-auto max-w-5xl animate-slide-up delay-300 perspective-1000">
            <div className="relative rounded-2xl bg-[#1a2341] border border-white/10 shadow-2xl shadow-cyan-500/10 overflow-hidden transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700 ease-out">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
              <img src="/dashboard.png" alt="App Dashboard" className="w-full h-auto opacity-90" />
              
              {/* Floating Elements */}
              <div className="absolute -right-10 top-10 p-4 bg-[#1a2341]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl animate-float hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg"><CurrencyRupeeIcon className="w-6 h-6 text-green-400" /></div>
                  <div>
                    <p className="text-xs text-slate-400">Total Revenue</p>
                    <p className="text-lg font-bold text-white">₹1,24,500</p>
                  </div>
                </div>
              </div>

              <div className="absolute -left-10 bottom-20 p-4 bg-[#1a2341]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl animate-float hidden md:block" style={{ animationDelay: '2s' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg"><UserGroupIcon className="w-6 h-6 text-purple-400" /></div>
                  <div>
                    <p className="text-xs text-slate-400">New Customers</p>
                    <p className="text-lg font-bold text-white">+128</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-[#131b33]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Leading Businesses Choose Cenvora</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">We don't just provide software; we provide a competitive advantage.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-colors duration-300 scroll-animate">
              <div className="w-14 h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6">
                <BoltIcon className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Lightning Performance</h3>
              <p className="text-slate-400 leading-relaxed">Built on cutting-edge tech, Cenvora loads instantly and handles thousands of transactions without breaking a sweat.</p>
            </div>
            <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-colors duration-300 scroll-animate" style={{ transitionDelay: '100ms' }}>
              <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheckIcon className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Unbreakable Security</h3>
              <p className="text-slate-400 leading-relaxed">Enterprise-grade encryption and automated backups ensure your business data is safer than in a bank vault.</p>
            </div>
            <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors duration-300 scroll-animate" style={{ transitionDelay: '200ms' }}>
              <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                <ChartBarIcon className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Actionable Insights</h3>
              <p className="text-slate-400 leading-relaxed">Turn raw data into profit. Our AI-powered analytics help you spot trends and opportunities before your competitors.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20 scroll-animate">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to <br /><span className="text-cyan-400">scale faster.</span></h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 scroll-animate" style={{ transitionDelay: `${index * 100}ms` }}>
                <feature.icon className="w-10 h-10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-lg font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-[#131b33]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-400">No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative p-8 rounded-3xl border ${plan.highlight ? 'bg-gradient-to-b from-cyan-900/20 to-[#1a2341] border-cyan-500/50 shadow-2xl shadow-cyan-500/10 scale-105 z-10' : 'bg-[#1a2341] border-white/10'} flex flex-col scroll-animate`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
                <div className="mb-8">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircleIcon className={`w-5 h-5 ${plan.highlight ? 'text-cyan-400' : 'text-slate-500'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link 
                  to="/signup" 
                  className={`w-full py-3 rounded-xl font-bold text-center transition-all duration-300 ${plan.highlight ? 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/25' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                >
                  {/* Choose {plan.name} */}
                  {plan.name=="Starter" ? 'Start Trial' : 'Coming Soon'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by Businesses</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/5 border border-white/10 scroll-animate" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => <StarIcon key={star} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">"Cenvora completely transformed how we manage our inventory. The insights are incredible and the interface is just beautiful."</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500"></div>
                  <div>
                    <p className="font-bold text-white">Sarah Johnson</p>
                    <p className="text-xs text-slate-500">CEO, TechStart</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-[#131b33]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="rounded-xl bg-[#1a2341] border border-white/5 overflow-hidden scroll-animate">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold text-white">{faq.question}</span>
                  {activeFaq === index ? <ChevronUpIcon className="w-5 h-5 text-cyan-400" /> : <ChevronDownIcon className="w-5 h-5 text-slate-500" />}
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-4 text-slate-400 animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 opacity-20"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 scroll-animate">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to elevate your business?</h2>
          <p className="text-xl text-slate-300 mb-10">Join thousands of businesses using Cenvora to grow faster and smarter.</p>
          <Link to="/signup" className="inline-block px-10 py-4 bg-white text-blue-900 font-bold text-lg rounded-xl shadow-2xl hover:scale-105 transition-transform duration-300">
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f1525] py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">C</span>
                </div>
                <span className="text-xl font-bold text-white">Cenvora</span>
              </div>
              <p className="text-slate-500 text-sm max-w-xs">
                The all-in-one business management platform designed for the modern era.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#features" className="hover:text-cyan-400">Features</a></li>
                <li><a href="#pricing" className="hover:text-cyan-400">Pricing</a></li>
                <li><Link to="/login" className="hover:text-cyan-400">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-cyan-400">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-cyan-400">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center text-sm text-slate-600">
            &copy; {new Date().getFullYear()} Cenvora. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}