import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HomeIcon, 
  UserPlusIcon, 
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  MapIcon
} from '@heroicons/react/24/outline';
import Seo from '../components/Seo';

export default function Sitemap() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sitemapLinks = [
    { title: 'Home', path: '/', icon: HomeIcon, desc: 'Cenvora Main Landing Page' },
    { title: 'Login', path: '/login', icon: ArrowRightOnRectangleIcon, desc: 'Sign into your ERP account' },
    { title: 'Sign Up', path: '/signup', icon: UserPlusIcon, desc: 'Create a new free trial account' },
    { title: 'Privacy Policy', path: '/privacy', icon: ShieldCheckIcon, desc: 'How we manage and protect your data' },
    { title: 'Terms of Service', path: '/terms', icon: DocumentTextIcon, desc: 'Legal agreements and billing terms' },
    { title: 'Sitemap', path: '/sitemap', icon: MapIcon, desc: 'Directory of all public pages' },
  ];

  return (
    <div className="min-h-screen font-sans text-white bg-black selection:bg-purple-500/30">
      <Seo
        title="Sitemap"
        description="Browse the public pages available on Cenvora."
        canonicalPath="/sitemap"
      />
      {/* Background Texture Grid */}
      <div className="fixed inset-0 bg-grid z-0 pointer-events-none opacity-40"></div>
      
      {/* Floating Pill Navbar */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center">
        <div className="glass-nav px-6 py-3 flex items-center justify-between gap-12 max-w-5xl shadow-2xl">
          <Link to="/" className="hover:opacity-80 transition-opacity flex items-center">
            <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="w-[160px] h-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4">
             <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Log In</Link>
             <Link to="/signup" className="text-sm font-semibold bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      <main className="pt-40 pb-20 relative z-10 max-w-4xl mx-auto px-6">
        <div className="mb-12 border-b border-white/10 pb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white flex items-center gap-4">
                <MapIcon className="w-10 h-10 text-cyan-400" />
                Sitemap
            </h1>
            <p className="text-gray-400 text-lg">A complete directory of public pages available on the Cenvora platform.</p>
        </div>

        {/* Link Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sitemapLinks.map((link) => (
                <Link 
                    key={link.path} 
                    to={link.path}
                    className="p-6 bg-[#0a0a0a] border border-white/10 rounded-2xl hover:border-cyan-500/50 hover:bg-[#111] transition-all group flex items-start gap-4"
                >
                    <div className="p-3 bg-white/5 rounded-xl text-gray-400 group-hover:text-cyan-400 transition-colors mt-1">
                        <link.icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{link.title}</h3>
                        <p className="text-sm text-gray-500">{link.desc}</p>
                        <div className="text-xs font-mono text-gray-600 mt-3 flex items-center gap-1">
                            <span className="text-gray-400">GET</span> {link.path}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
        
        <section className="pt-8 border-t border-white/10 mt-12">
            <Link to="/" className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-2">
                &larr; Back to Home
            </Link>
        </section>
      </main>
    </div>
  );
}
