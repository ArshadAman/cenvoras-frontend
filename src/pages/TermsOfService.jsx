import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  KeyIcon, 
  ServerStackIcon, 
  CheckCircleIcon,
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';
import PublicNavbar from '../components/PublicNavbar';
import Seo from '../components/Seo';

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: 'license-grant', title: '1. Grant of Perpetual Software License' },
    { id: 'amc-scope', title: '2. Annual Maintenance Contract (AMC) & Hosting' },
    { id: 'data-ownership', title: '3. Client Data Sovereignty & Portability' },
    { id: 'acceptable-use', title: '4. Acceptable Use, IT Act & BNS Compliance' },
    { id: 'hardware-specs', title: '5. Hardware, Printers & Client Environment' },
    { id: 'liability', title: '6. Limitation of Liability & Warranty Scope' },
    { id: 'termination', title: '7. Contract Termination & AMC Expiry' },
    { id: 'governing-law', title: '8. Governing Law & Dispute Resolution' },
  ];

  return (
    <div className="min-h-screen font-sans text-white bg-[#07080b] selection:bg-cyan-500/30 selection:text-white">
      <Seo
        title="Terms of Service & Perpetual License Agreement | Cenvora"
        description="Review the commercial terms, perpetual software license grant, AMC scope, and legal compliance obligations for Cenvora ERP deployments."
        canonicalPath="/terms"
      />

      {/* Grid Pattern Texture */}
      <div className="fixed inset-0 bg-grid z-0 pointer-events-none opacity-20"></div>

      <PublicNavbar
        links={[
          { label: 'Home', href: '/' },
          { label: 'Perpetual Pricing', href: '/#pricing' },
          { label: 'HSN Directory', href: '/gst-hsn-guide' },
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Contact', href: '/contact' },
        ]}
      />

      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-32 sm:pt-40">
        {/* Document Header */}
        <div className="border-b border-white/10 pb-8 mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono text-cyan-300 uppercase tracking-wider mb-4">
            <DocumentTextIcon className="w-4 h-4" />
            Commercial Agreement & Perpetual License
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Software License & Commercial Terms
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-400 font-mono">
            Effective Date: January 1, 2026 • Commercial Revision: 4.2
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Quick Index Sidebar */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 bg-[#0c1017] border border-white/10 rounded-2xl p-5 shadow-xl">
              <div className="text-xs font-mono uppercase text-gray-400 font-bold mb-4 tracking-wider">
                Agreement Clauses
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

              <div className="mt-6 pt-4 border-t border-white/5 space-y-2 text-xs font-mono text-gray-400">
                <div className="flex items-center gap-2 text-cyan-400">
                  <KeyIcon className="w-4 h-4" />
                  <span>Perpetual License Model</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Flat ₹12k/yr Base AMC</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Legal Content */}
          <div className="lg:col-span-8 space-y-12 text-sm sm:text-base text-gray-300 leading-relaxed font-light">
            {/* Clause 1 */}
            <section id="license-grant" className="scroll-mt-32">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 font-mono">
                <span className="text-cyan-400">01.</span> Grant of Perpetual Software License
              </h2>
              <p className="mb-3">
                Upon payment of the agreed one-time license fee (such as the Hosted Standard license fee of ₹1,00,000, White-Label Custom Domain fee of ₹1,50,000, or Enterprise Bespoke fee), Cenvora grants you a non-exclusive, perpetual, non-transferable license to deploy, operate, and utilize the software for your internal enterprise business operations.
              </p>
              <div className="bg-[#0c1017] border border-white/10 rounded-xl p-4 my-3 text-xs sm:text-sm">
                <p className="text-gray-300">
                  <strong>Zero Per-User Seat Penalties:</strong> You are authorized to create unlimited user accounts, cashier logins, and operational roles within your licensed instance without incurring per-seat monthly license fees.
                </p>
              </div>
            </section>

            {/* Clause 2 */}
            <section id="amc-scope" className="scroll-mt-32">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 font-mono">
                <span className="text-cyan-400">02.</span> Annual Maintenance Contract (AMC) & Hosting
              </h2>
              <p className="mb-3">
                To guarantee uninterrupted regulatory compliance and platform security, Cenvora operates under a transparent, cost-pegged maintenance model:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-400 text-xs sm:text-sm">
                <li><strong className="text-gray-200">Base Software AMC (Flat ₹12,000/year):</strong> Covers continuous statutory GST rate updates, UAE VAT formula adjustments, security patches, database integrity maintenance, and direct WhatsApp priority support.</li>
                <li><strong className="text-gray-200">Infrastructure Hosting:</strong> For Hosted Standard, cloud hosting is bundled at ~₹500/mo (₹6,000/yr), bringing total ongoing to ₹18,000/yr. For White-Label Custom Domain, dedicated container hosting is bundled at ~₹1,000/mo (₹12,000/yr), bringing total ongoing to ₹24,000/yr. For Enterprise BYOC, server hosting is paid by the client directly to their cloud provider (₹0 hosting fee to Cenvora).</li>
                <li><strong className="text-gray-200">Renewal Cycle:</strong> The AMC is invoiced annually in advance. Renewal is optional but required to receive automated software version upgrades and official technical support.</li>
              </ul>
            </section>

            {/* Clause 3 */}
            <section id="data-ownership" className="scroll-mt-32">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 font-mono">
                <span className="text-cyan-400">03.</span> Client Data Sovereignty & Portability
              </h2>
              <p>
                All data, customer lists, inventory valuation numbers, invoice documents, and transaction logs stored within your Cenvora instance remain exclusively your intellectual and corporate property. Cenvora will never claim ownership, place commercial liens, or withhold your database. You retain the right to export full database backups at any time.
              </p>
            </section>

            {/* Clause 4 */}
            <section id="acceptable-use" className="scroll-mt-32">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 font-mono">
                <span className="text-cyan-400">04.</span> Acceptable Use, IT Act & BNS Compliance
              </h2>
              <p className="mb-2">
                You agree to use Cenvora strictly in compliance with all applicable Indian and international laws, including but not limited to the Information Technology Act, 2000, and the Bharatiya Nyaya Sanhita, 2023 (BNS). You explicitly agree NOT to use the software to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-400 text-xs sm:text-sm">
                <li>Generate fraudulent, fictitious, or forged tax invoices intended to evade lawful tax liabilities under GST or UAE VAT legislation.</li>
                <li>Engage in unauthorized data interception, tampering with audit trails, or cyber-attacks prohibited under Sections 43 and 66 of the Information Technology Act, 2000.</li>
                <li>Store illegal, illicit, or malicious payloads within invoice attachment fields.</li>
              </ul>
            </section>

            {/* Clause 5 */}
            <section id="hardware-specs" className="scroll-mt-32">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 font-mono">
                <span className="text-cyan-400">05.</span> Hardware, Printers & Client Environment
              </h2>
              <p>
                Cenvora ERP runs as a modern cloud/web progressive application compatible with standard web browsers (Google Chrome, Microsoft Edge, Safari, Firefox). The client is responsible for maintaining their local hardware (barcode scanners, desktop computers, tablets) and thermal receipt printers (standard 80mm ESC/POS or A4/A5 laser printers).
              </p>
            </section>

            {/* Clause 6 */}
            <section id="liability" className="scroll-mt-32">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 font-mono">
                <span className="text-cyan-400">06.</span> Limitation of Liability & Warranty Scope
              </h2>
              <p>
                Cenvora ERP is designed to assist businesses with computational accuracy, record-keeping, and operational efficiency. However, the final verification of tax filings (GSTR-1, GSTR-3B, or VAT returns) filed with government authorities remains the sole responsibility of the client and their certified tax practitioners. In no event shall Cenvora's aggregate liability exceed the total maintenance and license fees paid by the client in the twelve (12) months preceding the claim.
              </p>
            </section>

            {/* Clause 7 */}
            <section id="termination" className="scroll-mt-32">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 font-mono">
                <span className="text-cyan-400">07.</span> Contract Termination & AMC Expiry
              </h2>
              <p>
                Should you elect not to renew the Annual Maintenance Contract upon expiration:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-400 text-xs sm:text-sm mt-2">
                <li>Your perpetual license to the installed software version remains valid indefinitely.</li>
                <li>Access to historical records and local data exports continues without interruption.</li>
                <li>New feature releases, statutory GST formula patches, and technical support SLAs will cease until an AMC renewal is executed.</li>
              </ul>
            </section>

            {/* Clause 8 */}
            <section id="governing-law" className="scroll-mt-32 pt-4 border-t border-white/10">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 font-mono">
                <span className="text-cyan-400">08.</span> Governing Law & Dispute Resolution
              </h2>
              <p>
                This Agreement shall be governed by and construed in accordance with the laws of India. Any legal dispute, arbitration, or proceedings arising under this Agreement shall be subject to the exclusive jurisdiction of the competent courts of India.
              </p>
              <div className="mt-4 font-mono text-xs text-gray-400">
                Questions regarding commercial terms or contracts: <a href="mailto:support@cenvora.app" className="text-cyan-400 hover:underline">support@cenvora.app</a>
              </div>
            </section>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-16 pt-8 border-t border-white/10 flex justify-between items-center text-xs text-gray-500">
          <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            &larr; Back to Cenvora Home
          </Link>
          <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
            Read Privacy Policy &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
