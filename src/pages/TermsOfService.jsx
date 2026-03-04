import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen font-sans text-white bg-black selection:bg-purple-500/30">
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

      <main className="pt-40 pb-20 relative z-10 max-w-3xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-white">Terms of Service</h1>
        <p className="text-gray-400 mb-12">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
            <p>By accessing or using Cenvora, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Subscriptions & Billing</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis (monthly or annually).</li>
              <li>A valid payment method is required to process the payment for your Subscription.</li>
              <li>You may cancel your Subscription at any time, but no refunds will be provided for the remaining duration of the billing cycle.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Accounts</h2>
            <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use, BNS & IT Act Compliance</h2>
            <p className="text-sm mb-2">You agree to use Cenvora strictly in compliance with all applicable Indian laws, including but not limited to the Information Technology Act, 2000, and the Bharatiya Nyaya Sanhita, 2023 (BNS). You explicitly agree NOT to use the Service to upload, post, transmit, or otherwise make available any Content that:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm text-gray-400">
                <li>Constitutes forgery, cheating, or financial fraud under the Bharatiya Nyaya Sanhita (BNS) provisions.</li>
                <li>Involves unauthorized access, identity theft, or data manipulation punishable under Sections 43, 66, 66C, and 66D of the Information Technology Act, 2000.</li>
                <li>Is grossly harmful, defamatory, obscene, pornographic, pedophilic, invasive of another's privacy, or promotes money laundering or gambling.</li>
            </ul>
            <p className="text-sm mt-2 font-medium text-red-400">Any violation of these provisions constitutes a severe breach of these Terms. Cenvora reserves the right to immediately terminate your account, freeze your data, and report the offense to cyber crime authorities or law enforcement agencies without prior notice.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Data Protection (DPDP Act 2023)</h2>
            <p className="text-sm">By utilizing Cenvora to store your customers' or third-party data, you acknowledge that you remain the "Data Fiduciary" regarding that data under the Digital Personal Data Protection Act, 2023 (DPDP). Cenvora acts merely as a "Data Processor." You represent and warrant that you have obtained lawful, clear, and specific consent from all individuals whose personal data you input into our systems. You shall hold Cenvora completely harmless against any complaints or penalties levied by the Data Protection Board of India resulting from your failure to obtain such consent.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Intermediary Status & Safe Harbour (Sec 79 IT Act)</h2>
            <p className="text-sm">Cenvora is strictly a technology platform and acts purely as an "Intermediary" under Section 2(1)(w) and Section 79 of the Information Technology Act, 2000, and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021. We hold ZERO liability for the accuracy, legality, or GST compliance of any invoices, ledgers, or business data generated by you. We exercise no editorial control over your data. If you manipulate ledgers to evade taxes, the sole legal and penal liability lies exclusively with you and your business entity.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Limitation of Liability & Data Loss</h2>
            <p className="text-sm mb-4">While we implement automated off-site database backups every 24 hours to protect against catastrophic system failures, Cenvora is provided strictly on an "AS IS" and "AS AVAILABLE" basis. In no event shall Cenvora, nor its founders, directors, employees, or partners, be liable for any direct, indirect, incidental, special, consequential, or punitive damages under civil or criminal law. You explicitly acknowledge that up to 24 hours of data may be unrecoverable in the event of an intra-day catastrophic failure, hardware crash, or cyber attack, and you assume 100% of all risk associated with such potential data loss.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Absolute Indemnification</h2>
            <p className="text-sm">You hereby agree to defend, indemnify and indefinitely hold harmless Cenvora, its affiliates, employees, and officers from and against any and all claims, FIRs (First Information Reports), civil suits, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to lawyer's fees), resulting directly or indirectly from a) your use and access of the Service; b) any fraudulent or unlawful act committed by you or your staff using our software; c) any breach of the BNS, IT Act, DPDP Act, or GST laws by you.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Governing Law & Exclusive Jurisdiction</h2>
            <p className="text-sm">These Terms shall be governed and construed exclusively in accordance with the laws of India. Any disputes, civil suits, or criminal proceedings arising out of or relating to these Terms, the Service, or data breaches shall be subject to the exclusive jurisdiction of the competent courts located in New Delhi, India. You hereby waive any right to object to such jurisdiction.</p>
          </section>
          
          <section className="pt-8 border-t border-white/10 mt-12">
             <Link to="/" className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-2">
                &larr; Back to Home
             </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
