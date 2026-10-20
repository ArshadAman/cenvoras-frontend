import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import Seo from '../components/Seo';

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen font-body text-[var(--text-primary)] bg-[var(--bg-primary)]">
      <Seo
        title="Terms of Service & License Terms | Cenvora"
        description="Review the perpetual software license terms, AMC maintenance scope, and user responsibilities for Cenvora software."
        canonicalPath="/terms"
      />

      <PublicNavbar
        links={[
          { label: 'Home', href: '/' },
          { label: 'Pricing', href: '/#pricing' },
          { label: 'HSN Lookup', href: '/gst-hsn-guide' },
          { label: 'Privacy', href: '/privacy' },
          { label: 'Contact', href: '/contact' },
        ]}
      />

      <main className="mx-auto max-w-3xl px-6 pb-20 pt-32 sm:pt-40">
        <div className="border-b border-[var(--border-subtle)] pb-6 mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] font-display">
            Terms of Service & License Agreement
          </h1>
          <p className="mt-2 text-xs text-[var(--text-muted)] font-mono">
            Last Updated: January 2026 • Perpetual License Model
          </p>
        </div>

        <div className="space-y-8 text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
          <section>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">1. Perpetual Software License</h2>
            <p>
              When you purchase a Cenvora license (such as Hosted Standard at ₹1,00,000, White-Label Custom Domain at ₹1,50,000, or Enterprise at ₹2,00,000+), you receive a perpetual, non-exclusive license to use the software for your business operations. You are free to add as many staff logins, billing counters, and devices as needed without paying any monthly per-user fees.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">2. Annual Maintenance Contract (AMC) & Hosting</h2>
            <p className="mb-2">
              To keep your software up to date with new statutory GST tax rules and ensure system security:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] text-xs sm:text-sm">
              <li><strong>Base Software AMC (Flat ₹12,000/year):</strong> Covers software updates, new GST features, bug fixes, automated backups, and priority WhatsApp support.</li>
              <li><strong>Hosting Fees:</strong> For Hosted Standard, cloud hosting is bundled at ~₹6,000/year (₹18,000/year total). For White-Label Custom Domain, dedicated container hosting is bundled at ~₹12,000/year (₹24,000/year total). For Self-Hosted Enterprise, hosting is paid directly by you to your cloud provider (₹0 to Cenvora).</li>
              <li><strong>AMC Renewal is Optional:</strong> If you decide not to renew the maintenance fee, your software license and your database remain 100% yours forever. You simply stop receiving new software upgrades and priority support until renewed.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">3. Your Data Sovereignty</h2>
            <p>
              All item catalogs, prices, invoices, customer records, and ledger balances entered into Cenvora remain your exclusive property. We will never lock your data or restrict your right to download your records in Excel, CSV, or SQL format.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">4. Lawful Use & Tax Compliance</h2>
            <p>
              You agree to use Cenvora in accordance with applicable Indian laws, including the Information Technology Act, 2000, and GST legislation. The software assists you with accurate calculations and automated formatting, but final responsibility for filed tax returns lies with your authorized business management.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">5. Governing Law</h2>
            <p>
              These terms are governed by the laws of India. Any legal proceedings shall be subject to the jurisdiction of competent courts in India.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">6. Questions</h2>
            <p>
              For any questions regarding commercial terms or agreements, please reach out to us at{' '}
              <a href="mailto:support@cenvora.co.in" className="text-[var(--accent-primary)] hover:underline">support@cenvora.co.in</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--border-subtle)] flex justify-between text-xs text-[var(--text-muted)]">
          <Link to="/" className="hover:text-[var(--text-primary)] transition-colors">&larr; Back to Home</Link>
          <Link to="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Read Privacy Policy &rarr;</Link>
        </div>
      </main>
    </div>
  );
}
