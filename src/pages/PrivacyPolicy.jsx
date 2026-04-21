import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen font-sans text-white bg-black selection:bg-purple-500/30">
      {/* Background Texture Grid */}
      <div className="fixed inset-0 bg-grid z-0 pointer-events-none opacity-40"></div>
      
      <PublicNavbar
        links={[
          { label: 'Home', href: '/' },
          { label: 'Contact', href: '/contact' },
          { label: 'Terms', href: '/terms' },
        ]}
      />

      <main className="pt-40 pb-20 relative z-10 max-w-3xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-white">Privacy Policy</h1>
        <p className="text-gray-400 mb-12">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p>Welcome to Cenvora. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and use our ERP services.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Data We Collect</h2>
            <p className="mb-4">We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data:</strong> includes billing address, email address and telephone numbers.</li>
              <li><strong>Financial Data:</strong> includes GSTIN and company financial records uploaded to our platform. All data is securely encrypted.</li>
              <li><strong>Technical Data:</strong> includes IP address, login data, browser type and version.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Data</h2>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to provide our ERP services to you, to manage your account, to process payments, and to ensure the security of our platform.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
            <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. We limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p>
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
