import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PopupModal } from 'react-calendly';
import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  ServerStackIcon,
  BuildingOffice2Icon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import PublicNavbar from '../components/PublicNavbar';
import Seo from '../components/Seo';

export default function ContactUs() {
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen font-sans text-white bg-[#07080b] selection:bg-cyan-500/30 selection:text-white">
      <Seo
        title="Contact Cenvora Enterprise | Perpetual License ERP Consultation"
        description="Connect directly with Cenvora's deployment team for perpetual license quotes, white-label custom domain setup, data migration, and technical architecture demos."
        canonicalPath="/contact"
      />

      {/* Grid Pattern Texture */}
      <div className="fixed inset-0 bg-grid z-0 pointer-events-none opacity-20"></div>
      
      {/* Subtle Cyan Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]"></div>
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-teal-500/10 blur-[120px]"></div>
      </div>

      <PublicNavbar
        links={[
          { label: 'Home', href: '/' },
          { label: 'Perpetual Pricing', href: '/#pricing' },
          { label: 'HSN Directory', href: '/gst-hsn-guide' },
          { label: 'Privacy', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
        ]}
      />

      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-32 sm:pt-40">
        {/* Header Hero Card */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c1017] p-8 md:p-12 shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-mono uppercase tracking-wider text-cyan-300">
              <SparklesIcon className="h-3.5 w-3.5" />
              Direct Engineering & Commercial Desk
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Let us discuss your business deployment.
            </h1>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-gray-400">
              Whether you are evaluating perpetual ownership, setting up a white-label custom domain, or migrating opening balances from Tally or Excel, our core engineering team is available directly.
            </p>
          </div>
        </section>

        {/* Channels Grid */}
        <section className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Card 1: Calendly Video Walkthrough */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c1017] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-950/40 flex flex-col justify-between">
            <div>
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
                <CalendarDaysIcon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Live 1-on-1 Walkthrough</h2>
              <p className="mt-2 text-xs sm:text-sm text-gray-400 leading-relaxed">
                Schedule a 25-minute screen share with a systems architect to review your trade workflows and ask live questions.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <button
                onClick={() => setIsCalendlyOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-cyan-400/20"
              >
                <span>Book Calendar Slot</span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Card 2: WhatsApp Direct */}
          <a
            href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20am%20interested%20in%20deploying%20Cenvora%20ERP%20for%20my%20business."
            target="_blank"
            rel="noreferrer"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c1017] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-950/40 flex flex-col justify-between"
          >
            <div>
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Direct WhatsApp</h2>
              <p className="mt-2 text-xs sm:text-sm text-gray-400 leading-relaxed">
                Fastest channel for immediate commercial questions, quotations, and live sandbox access links.
              </p>
              <div className="mt-4 font-mono font-bold text-base text-emerald-300">+91 7205289643</div>
              <div className="text-[11px] text-gray-500 font-mono mt-1">Available 9 AM - 8 PM IST</div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <span className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs uppercase tracking-wider transition-all">
                <span>Open WhatsApp</span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </span>
            </div>
          </a>

          {/* Card 3: Enterprise Email */}
          <a
            href="mailto:support@cenvora.app"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c1017] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/40 hover:shadow-2xl hover:shadow-blue-950/40 flex flex-col justify-between"
          >
            <div>
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/10 text-blue-300">
                <EnvelopeIcon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Official Support Email</h2>
              <p className="mt-2 text-xs sm:text-sm text-gray-400 leading-relaxed">
                For RFP submissions, enterprise purchase orders, NDA agreements, and formal deployment contracts.
              </p>
              <div className="mt-4 font-mono font-bold text-base text-blue-300">support@cenvora.app</div>
              <div className="text-[11px] text-gray-500 font-mono mt-1">Typical response within 3 hours</div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <span className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-xs uppercase tracking-wider transition-all">
                <span>Send Email</span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </span>
            </div>
          </a>
        </section>

        {/* Deployment Assistance Specifications */}
        <section className="mt-12 rounded-3xl border border-white/10 bg-[#0b0e14] p-8 md:p-10">
          <h3 className="text-xl font-bold text-white mb-2">What happens after you reach out?</h3>
          <p className="text-sm text-gray-400 mb-6">
            We don't route you through aggressive junior sales reps. You speak directly with our solutions team.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-sans">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="text-xs font-mono text-cyan-400 font-bold uppercase mb-1">Step 1 • 20 Mins</div>
              <div className="text-sm font-semibold text-white mb-1">Architecture Alignment</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                We confirm your state GST or UAE VAT rules, thermal printer specs, and user role configuration.
              </p>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="text-xs font-mono text-cyan-400 font-bold uppercase mb-1">Step 2 • 24 Hours</div>
              <div className="text-sm font-semibold text-white mb-1">Private Sandbox Setup</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                We spin up a dedicated instance seeded with your sample catalog and customer ledger data.
              </p>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="text-xs font-mono text-cyan-400 font-bold uppercase mb-1">Step 3 • Production</div>
              <div className="text-sm font-semibold text-white mb-1">Perpetual Handover</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Domain mapping (`erp.yourbrand.com`), database sovereignty confirmation, and admin staff training.
              </p>
            </div>
          </div>
        </section>

        {/* Return to Home Link */}
        <div className="mt-12 text-center">
          <Link to="/" className="text-xs font-mono text-gray-500 hover:text-cyan-400 transition-colors">
            &larr; Return to Main Cenvora Architecture Page
          </Link>
        </div>
      </main>

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
