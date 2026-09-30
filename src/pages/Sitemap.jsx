import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HomeIcon, 
  MapIcon, 
} from '@heroicons/react/24/outline';
import PublicNavbar from '../components/PublicNavbar';
import Seo from '../components/Seo';

export default function Sitemap() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sitemapGroups = [
    {
      category: 'Main Pages',
      links: [
        { title: 'Home / Overview', path: '/', desc: 'Product overview, screenshots, and core benefits.' },
        { title: 'Features Explorer', path: '/#features', desc: 'Detailed breakdown of sales, stock management, accounting, and staff roles.' },
        { title: 'Rent vs Own Calculator', path: '/#why-own', desc: 'Interactive comparison between monthly SaaS and one-time perpetual ownership.' },
        { title: 'Perpetual Pricing', path: '/#pricing', desc: 'Hosted Standard, White-Label Custom Domain, and Enterprise plans.' },
      ]
    },
    {
      category: 'Free Business Tools',
      links: [
        { title: 'HSN & GST Code Lookup', path: '/gst-hsn-guide', desc: 'Search 15,000+ HSN codes and GST tax rate slabs.' },
      ]
    },
    {
      category: 'Support & Inquiries',
      links: [
        { title: 'Contact Us', path: '/contact', desc: 'Book a live screen demo or chat with our team on WhatsApp.' },
      ]
    },
    {
      category: 'Legal & Privacy',
      links: [
        { title: 'Privacy Policy', path: '/privacy', desc: 'DPDP Act compliance, data safety, and zero advertising monetization.' },
        { title: 'Terms of Service', path: '/terms', desc: 'Perpetual software license agreement and AMC maintenance terms.' },
      ]
    },
    {
      category: 'User Portals',
      links: [
        { title: 'Sign In', path: '/login', desc: 'Log in to your Cenvora account.' },
        { title: 'Start 14-Day Free Trial', path: '/signup', desc: 'Try Cenvora free for 14 days with zero obligation.' },
      ]
    }
  ];

  return (
    <div className="min-h-screen font-sans text-white bg-black">
      <Seo
        title="Sitemap | Cenvora"
        description="Directory of all public pages, tools, and pricing plans on Cenvora."
        canonicalPath="/sitemap"
      />

      <PublicNavbar
        links={[
          { label: 'Home', href: '/' },
          { label: 'Features', href: '/#features' },
          { label: 'Pricing', href: '/#pricing' },
          { label: 'HSN Lookup', href: '/gst-hsn-guide' },
          { label: 'Contact', href: '/contact' },
        ]}
      />

      <main className="mx-auto max-w-4xl px-6 pb-20 pt-32 sm:pt-40">
        <div className="mb-10 border-b border-zinc-800 pb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Sitemap
          </h1>
          <p className="mt-2 text-xs text-zinc-400">
            A complete list of public pages on Cenvora.
          </p>
        </div>

        <div className="space-y-8">
          {sitemapGroups.map((group, gIdx) => (
            <div key={gIdx} className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                {group.category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.links.map((link, lIdx) => (
                  <Link
                    key={lIdx}
                    to={link.path}
                    className="p-3.5 bg-zinc-900/60 border border-zinc-800/60 rounded-xl hover:bg-zinc-900 hover:border-zinc-700 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {link.title}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{link.desc}</p>
                    </div>
                    <div className="mt-3 text-[11px] font-mono text-zinc-500">
                      {link.path}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-xs text-zinc-600">
          <Link to="/" className="hover:text-zinc-400 transition-colors">
            &larr; Back to Cenvora homepage
          </Link>
        </div>
      </main>
    </div>
  );
}
