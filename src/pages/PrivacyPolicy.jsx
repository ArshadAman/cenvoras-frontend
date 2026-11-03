import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import Seo from '../components/Seo';

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen font-body text-[var(--text-primary)] bg-[var(--bg-primary)]">
      <Seo
        title="Privacy Policy | Cenvora"
        description="Learn how Cenvora protects your business data, complies with DPDP Act 2023, and guarantees 100% data ownership."
        canonicalPath="/privacy"
      />

      <PublicNavbar
        links={[
          { label: 'Home', href: '/' },
          { label: 'Pricing', href: '/#pricing' },
          { label: 'HSN Lookup', href: '/gst-hsn-guide' },
          { label: 'Terms', href: '/terms' },
          { label: 'Contact', href: '/contact' },
        ]}
      />

      <main className="mx-auto max-w-3xl px-6 pb-20 pt-32 sm:pt-40">
        <div className="border-b border-[var(--border-subtle)] pb-6 mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] font-display">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-[var(--text-muted)] font-mono">
            Last Updated: January 2026 • Compliant with Digital Personal Data Protection (DPDP) Act, 2023
          </p>
        </div>

        <div className="space-y-8 text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
          <section>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">1. Your Business Data is 100% Yours</h2>
            <p>
              At Cenvora, we believe that your business transactions, customer lists, item prices, and profit margins belong exclusively to you. We do not sell, rent, monetize, or share your data with any third-party advertisers. Your business records are never used to train public AI models.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">2. What Information We Collect</h2>
            <p className="mb-2">
              To provide you with working billing software and help you generate valid GST invoices, we store:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] text-xs sm:text-sm">
              <li><strong>Account Info:</strong> Your name, business email, contact phone number, and password hash.</li>
              <li><strong>Business Details:</strong> Business name, address, GSTIN, and state.</li>
              <li><strong>Transactional Data:</strong> Products, invoices, customer records, supplier bills, and payment records that you enter into the software.</li>
              <li><strong>Technical Logs:</strong> Basic error logs and login timestamps to ensure security.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">3. How Your Data is Used</h2>
            <p>
              Your data is used strictly to run your software instance: calculating GST tax accurately, updating stock counts, generating invoice PDFs, and creating GST filing reports (GSTR-1 and GSTR-3B).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">4. Data Security & Storage</h2>
            <p>
              All data transmitted between your browser and our servers is encrypted using TLS (HTTPS). Database disks and automated daily backups are encrypted with AES-256 standards. Hosted Standard and White-Label instances are hosted in secured Indian data centers. For Self-Hosted customers, data resides entirely on your own private cloud or server.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">5. Data Portability</h2>
            <p>
              You can export your customer lists, product catalogs, and invoices to standard Excel or CSV files at any time. If you ever decide to discontinue using Cenvora, you can request a complete SQL database backup.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">6. Contact Our Team</h2>
            <p>
              If you have any questions about how your data is handled, please contact our team at{' '}
              <a href="mailto:support@cenvora.co.in" className="text-[var(--accent-primary)] hover:underline">support@cenvora.co.in</a> or message us on WhatsApp at{' '}
              <span className="text-[var(--status-success)] font-mono">+91 7205289643</span>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--border-subtle)] flex justify-between text-xs text-[var(--text-muted)]">
          <Link to="/" className="hover:text-[var(--text-primary)] transition-colors">&larr; Back to Home</Link>
          <Link to="/terms" className="hover:text-[var(--text-primary)] transition-colors">Read Terms of Service &rarr;</Link>
        </div>
      </main>
    </div>
  );
}
