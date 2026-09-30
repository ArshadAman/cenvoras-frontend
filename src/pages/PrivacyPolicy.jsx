import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheckIcon, 
  LockClosedIcon, 
  ServerIcon, 
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import PublicNavbar from '../components/PublicNavbar';
import Seo from '../components/Seo';

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: 'sovereignty', title: '1. Data Sovereignty & Client Ownership' },
    { id: 'collection', title: '2. Information We Process' },
    { id: 'use', title: '3. Scope of Data Utilization' },
    { id: 'storage', title: '4. Database Isolation & Encryption' },
    { id: 'third-parties', title: '5. Sub-Processors & Infrastructure' },
    { id: 'dpdp-compliance', title: '6. DPDP Act 2023 & Statutory Compliance' },
    { id: 'retention', title: '7. Data Retention & Portability' },
    { id: 'contact', title: '8. Privacy Office Contact' },
  ];

  return (
    <div className="min-h-screen font-sans text-white bg-[#07080b] selection:bg-cyan-500/30 selection:text-white">
      <Seo
        title="Privacy Policy | Cenvora Enterprise ERP"
        description="Review Cenvora's data sovereignty commitments, DPDP Act 2023 compliance, database isolation, and security standards for perpetual and cloud deployments."
        canonicalPath="/privacy"
      />

      {/* Grid Pattern Texture */}
      <div className="fixed inset-0 bg-grid z-0 pointer-events-none opacity-20"></div>

      <PublicNavbar
        links={[
          { label: 'Home', href: '/' },
          { label: 'Perpetual Pricing', href: '/#pricing' },
          { label: 'HSN Directory', href: '/gst-hsn-guide' },
          { label: 'Terms of Service', href: '/terms' },
          { label: 'Contact', href: '/contact' },
        ]}
      />

      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-32 sm:pt-40">
        {/* Document Header */}
        <div className="border-b border-white/10 pb-8 mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono text-cyan-300 uppercase tracking-wider mb-4">
            <ShieldCheckIcon className="w-4 h-4" />
            DPDP Act 2023 & UAE Data Protection Aligned
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Privacy Policy & Data Sovereignty
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-400 font-mono">
            Effective Date: January 1, 2026 • Last Reviewed: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Quick Index Sidebar */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 bg-[#0c1017] border border-white/10 rounded-2xl p-5 shadow-xl">
              <div className="text-xs font-mono uppercase text-gray-400 font-bold mb-4 tracking-wider">
                Contents
              </div>
              <nav className="space-y-2">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block text-xs text-gray-400 hover:text-cyan-300 transition-colors py-1 truncate"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Zero Data Monetization</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Legal Content */}
          <div className="lg:col-span-8 space-y-12 text-sm sm:text-base text-gray-300 leading-relaxed font-light">
            {/* Section 1 */}
            <section id="sovereignty" className="scroll-mt-32">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 font-mono">
                <span className="text-cyan-400">01.</span> Data Sovereignty & Client Ownership
              </h2>
              <p className="mb-3">
                At Cenvora, we consider transactional accounting and inventory data to be the sovereign property of the deploying enterprise. Whether deployed via our Hosted Standard cluster, a White-Label Dedicated Container, or on your private Bring-Your-Own-Cloud (BYOC) infrastructure:
              </p>
              <div className="bg-[#0c1017] border border-white/10 rounded-xl p-4 space-y-2 my-4 text-xs sm:text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>No Data Selling or Advertising:</strong> We never sell, rent, commercialize, or share your business transaction logs with advertisers.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>No Public AI Training:</strong> Your business margins, customer records, supplier invoices, and transaction histories are never used to train public Large Language Models.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Full Data Portability:</strong> You may download your entire database as a standard SQL dump or CSV export at any point without lock-in penalties.</span>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="collection" className="scroll-mt-32">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 font-mono">
                <span className="text-cyan-400">02.</span> Information We Process
              </h2>
              <p className="mb-3">
                To operate the ERP system and fulfill statutory GST/VAT invoicing requirements, the software processes the following data categories:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-400 text-xs sm:text-sm">
                <li><strong className="text-gray-200">Account Credentials:</strong> Name, administrative business email, contact phone number, and encrypted password hashes.</li>
                <li><strong className="text-gray-200">Commercial Identifiers:</strong> Business legal name, registered operating address, GSTIN (India), TRN (UAE), and state tax jurisdiction codes.</li>
                <li><strong className="text-gray-200">Operational Records:</strong> Sales invoices, customer master profiles, vendor accounts, item master catalogs, batch serial numbers, and ledger entries entered by authorized users of your tenant.</li>
                <li><strong className="text-gray-200">Technical Telemetry:</strong> Anonymized server health metrics, latency logs, and audit trail timestamps (recording user IDs associated with transaction creation or edits).</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="use" className="scroll-mt-32">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 font-mono">
                <span className="text-cyan-400">03.</span> Scope of Data Utilization
              </h2>
              <p>
                Cenvora accesses and processes customer data strictly for the following operational objectives:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-400 text-xs sm:text-sm mt-2">
                <li>To render dual-tax GST and UAE VAT invoice calculations accurately.</li>
                <li>To maintain real-time batch stock valuations, FIFO deductions, and credit ledger accounting balances.</li>
                <li>To deliver automated transaction receipts to your designated recipients via WhatsApp or transactional email when triggered by your operators.</li>
                <li>To provide priority technical support and resolve operational database queries requested directly by your authorized system administrator.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="storage" className="scroll-mt-32">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 font-mono">
                <span className="text-cyan-400">04.</span> Database Isolation & Encryption
              </h2>
              <p>
                We employ modern zero-trust enterprise security protocols:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                <div className="p-4 bg-[#0c1017] border border-white/5 rounded-xl">
                  <div className="text-cyan-400 font-mono text-xs font-bold uppercase mb-1">In-Transit</div>
                  <div className="text-white text-sm font-semibold mb-1">TLS 1.3 Transport Encryption</div>
                  <p className="text-xs text-gray-400">All data in transit between clients, counter POS terminals, and servers is secured with strong HTTPS/TLS 1.3 cipher suites.</p>
                </div>
                <div className="p-4 bg-[#0c1017] border border-white/5 rounded-xl">
                  <div className="text-cyan-400 font-mono text-xs font-bold uppercase mb-1">At-Rest</div>
                  <div className="text-white text-sm font-semibold mb-1">AES-256 Storage Encryption</div>
                  <p className="text-xs text-gray-400">Database storage disks, WAL archives, and automated daily backup files are encrypted with industry-standard AES-256 encryption.</p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="third-parties" className="scroll-mt-32">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 font-mono">
                <span className="text-cyan-400">05.</span> Sub-Processors & Infrastructure
              </h2>
              <p>
                Hosted Standard and White-Label instances utilize enterprise cloud infrastructure providers with ISO 27001, SOC 2 Type II, and PCI-DSS certifications (e.g., AWS Mumbai region or DigitalOcean Bangalore data centers for Indian tenants; UAE regional zones for GCC clients). For clients opting for Enterprise BYOC, hosting is managed directly under the client's own cloud tenancy.
              </p>
            </section>

            {/* Section 6 */}
            <section id="dpdp-compliance" className="scroll-mt-32">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 font-mono">
                <span className="text-cyan-400">06.</span> DPDP Act 2023 & Statutory Compliance
              </h2>
              <p>
                In compliance with the Indian Digital Personal Data Protection (DPDP) Act, 2023, Cenvora acts primarily as a Data Processor on behalf of your enterprise (the Data Fiduciary). We maintain strict administrative safeguards to ensure that personal identifiers (such as retail customer phone numbers or employee identity numbers) are managed under your organization's direct mandate and authorization.
              </p>
            </section>

            {/* Section 7 */}
            <section id="retention" className="scroll-mt-32">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 font-mono">
                <span className="text-cyan-400">07.</span> Data Retention & Portability
              </h2>
              <p>
                Because Cenvora operates on a Perpetual License model, your historical business transactions remain accessible indefinitely on your instance. In the event you terminate your AMC contract or decommission a hosted container, a full raw SQL database archive is provided to you, followed by a permanent cryptographic purge of the hosted container within 30 calendar days upon written confirmation.
              </p>
            </section>

            {/* Section 8 */}
            <section id="contact" className="scroll-mt-32 pt-4 border-t border-white/10">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 font-mono">
                <span className="text-cyan-400">08.</span> Privacy Office Contact
              </h2>
              <p>
                For data protection officer inquiries, compliance audits, or technical questions regarding data residency:
              </p>
              <div className="mt-3 font-mono text-sm text-gray-300">
                Email: <a href="mailto:support@cenvora.app" className="text-cyan-400 hover:underline">support@cenvora.app</a><br />
                WhatsApp: <span className="text-emerald-400">+91 7205289643</span><br />
                Attn: Privacy & Data Sovereignty Officer
              </div>
            </section>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-16 pt-8 border-t border-white/10 flex justify-between items-center text-xs text-gray-500">
          <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            &larr; Back to Cenvora Home
          </Link>
          <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
            Read Terms of Service &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
