import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PopupModal } from 'react-calendly';
import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import PublicNavbar from '../components/PublicNavbar';
import Seo from '../components/Seo';

export default function ContactUs() {
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen font-body text-[var(--text-primary)] bg-[var(--bg-primary)]">
      <Seo
        title="Contact Cenvora | Software Inquiries & Support"
        description="Get in touch with Cenvora for software demos, pricing questions, custom domain setups, or general support."
        canonicalPath="/contact"
      />

      <PublicNavbar
        links={[
          { label: 'Home', href: '/' },
          { label: 'Features', href: '/#features' },
          { label: 'Pricing', href: '/#pricing' },
          { label: 'HSN Lookup', href: '/gst-hsn-guide' },
          { label: 'Privacy', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
        ]}
      />

      <main className="mx-auto max-w-4xl px-6 pb-20 pt-32 sm:pt-40">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] font-display">
            Get in touch with our team
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[var(--text-secondary)]">
            Have questions about software features, perpetual pricing, or data migration? We are here to help.
          </p>
        </div>

        {/* Channels */}
        <div className="grid gap-5 sm:grid-cols-3">
          {/* Card 1: WhatsApp */}
          <a
            href="https://wa.me/917205289643?text=Hi%20Cenvora%2C%20I%20have%20a%20question%20about%20your%20billing%20software."
            target="_blank"
            rel="noreferrer"
            className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]/40 transition-colors flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-primary)] flex items-center justify-center text-[var(--status-success)] mb-4">
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">WhatsApp</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
                Fastest way to get quick answers and pricing details.
              </p>
              <div className="mt-4 font-mono font-semibold text-sm text-[var(--status-success)]">
                +91 7205289643
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-[var(--border-subtle)] flex items-center gap-1 text-xs text-[var(--text-secondary)] font-medium">
              <span>Open Chat</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Card 2: Book a Demo */}
          <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-primary)] flex items-center justify-center text-[var(--accent-primary)] mb-4">
                <CalendarDaysIcon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Live Screen Demo</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
                Book a 20-minute screen walkthrough to see the software live.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => setIsCalendlyOpen(true)}
                className="btn-primary w-full py-2.5 px-3 text-xs"
              >
                Pick a Time
              </button>
            </div>
          </div>

          {/* Card 3: Email */}
          <a
            href="mailto:support@cenvora.co.in"
            className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]/40 transition-colors flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-secondary)] mb-4">
                <EnvelopeIcon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Email Us</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
                For formal quotations, contracts, or partnership inquiries.
              </p>
              <div className="mt-4 font-mono font-semibold text-sm text-[var(--text-secondary)]">
                support@cenvora.co.in
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-[var(--border-subtle)] flex items-center gap-1 text-xs text-[var(--text-secondary)] font-medium">
              <span>Send Email</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            </div>
          </a>
        </div>

        {/* Simple Onboarding Timeline */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm">
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">What to expect when you get started</h3>
          <p className="text-xs text-[var(--text-muted)] mb-6">
            We guide you through every step of setup so your billing starts smoothly.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <div className="text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider">Step 1</div>
              <div className="text-sm font-semibold text-[var(--text-primary)] mt-1">Free 14-Day Trial</div>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                Test the software with your own products, sales bills, and staff logins.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <div className="text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider">Step 2</div>
              <div className="text-sm font-semibold text-[var(--text-primary)] mt-1">Catalog Import</div>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                We help you import your existing items and customer balances from Excel.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <div className="text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider">Step 3</div>
              <div className="text-sm font-semibold text-[var(--text-primary)] mt-1">Live Billing</div>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                Start raising GST invoices with confidence, backed by direct WhatsApp support.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-xs text-[var(--text-muted)]">
          <Link to="/" className="hover:text-[var(--text-primary)] transition-colors">
            &larr; Back to Cenvora homepage
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
