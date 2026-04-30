import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import PublicNavbar from '../components/PublicNavbar';
import Seo from '../components/Seo';

export default function ContactUs() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen font-sans text-white bg-black selection:bg-purple-500/30">
      <Seo
        title="Contact Cenvora"
        description="Contact Cenvora for billing software, inventory software, GST support, onboarding, and account help."
        canonicalPath="/contact"
      />
      <div className="fixed inset-0 bg-grid z-0 pointer-events-none opacity-40"></div>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-24 top-24 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl"></div>
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-purple-500/15 blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"></div>
      </div>

      <PublicNavbar
        links={[
          { label: 'Home', href: '/' },
          { label: 'Privacy', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
        ]}
      />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-40">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#101826] via-[#0f0f14] to-[#1a0f24] p-8 md:p-12 shadow-2xl shadow-black/40">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl"></div>
          <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl"></div>

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-200">
              <SparklesIcon className="h-4 w-4" />
              Contact Cenvora
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
              Let us talk about your business setup.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg">
              Need help with onboarding, invoicing flow, subscriptions, or data setup? Reach us directly using the channels below.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <a
            href="mailto:cenvoras@gmail.com"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0e1118] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-900/20"
          >
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-400/10 blur-2xl"></div>
            <div className="relative">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
                <EnvelopeIcon className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">Email</h2>
              <p className="mt-2 text-sm text-gray-400">Best for detailed requests and account support.</p>
              <p className="mt-6 text-lg font-semibold text-cyan-300">cenvoras@gmail.com</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-cyan-200">
                Send Email <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </span>
            </div>
          </a>

          <a
            href="https://wa.me/918895159796"
            target="_blank"
            rel="noreferrer"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#121015] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/40 hover:shadow-2xl hover:shadow-purple-900/20"
          >
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-purple-400/10 blur-2xl"></div>
            <div className="relative">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/10 text-purple-200">
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">WhatsApp</h2>
              <p className="mt-2 text-sm text-gray-400">Quick chat for faster response.</p>
              <p className="mt-6 text-lg font-semibold text-purple-300">+91 8895159796</p>
              <p className="mt-2 text-xs uppercase tracking-wider text-amber-300">WhatsApp only, no calls</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-purple-200">
                Open WhatsApp <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </span>
            </div>
          </a>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#0b0d12] p-6 md:p-8">
          <h3 className="text-xl font-bold text-white">Response window</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            We usually respond the same day on WhatsApp and within 24 hours over email. Include your business name and issue summary so we can assist faster.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/" className="btn-secondary">Back to Home</Link>
            <Link to="/signup" className="btn-primary">Start with Cenvora</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
