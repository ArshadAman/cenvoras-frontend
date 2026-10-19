import React from "react";
import { SparklesIcon, BeakerIcon, ArrowTrendingUpIcon, ShieldCheckIcon, CubeTransparentIcon, TruckIcon, BuildingLibraryIcon, BanknotesIcon, DocumentTextIcon, CubeIcon } from "@heroicons/react/24/outline";
import Seo from "../components/Seo";

export default function ComingSoon() {
  const upcomingFeatures = [
    {
      title: "Delivery Challan",
      description: "Generate and track delivery challans for seamless dispatch operations and inventory movement tracking.",
      icon: TruckIcon,
      status: "In Development",
      eta: "Next Release"
    },
    {
      title: "E-Way Bill Generation",
      description: "Direct integration with GST portal to generate E-Way bills directly from sales invoices.",
      icon: ArrowTrendingUpIcon,
      status: "In Development",
      eta: "Testing Phase"
    },
    {
      title: "E-Invoice (IRN)",
      description: "Auto-generate Invoice Reference Number (IRN) and QR codes for B2B transactions as per GST mandate.",
      icon: ShieldCheckIcon,
      status: "In Development",
      eta: "Testing Phase"
    },
    {
       title: "WhatsApp Automation",
       description: "Send invoices, payment links, and low stock alerts automatically via WhatsApp to your customers.",
       icon: SparklesIcon,
       status: "On demand",
       eta: "Available on Demand"
    },
    {
       title: "Bank Reconciliation",
       description: "Import bank statements and automatically match them against recorded payments and ledger entries using smart date-amount matching.",
       icon: BuildingLibraryIcon,
       status: "In Development",
       eta: "Next Release"
    },
    {
       title: "Manufacturing BOM",
       description: "Automated raw material deduction on production runs and finished goods receipt directly from Bill of Materials.",
       icon: CubeTransparentIcon,
       status: "Exploring",
       eta: "Q3 2026"
    },
    {
       title: "Payroll Runs",
       description: "Automated monthly payroll processing with dynamic salary computation based on attendance, leaves, and salary structures.",
       icon: BanknotesIcon,
       status: "In Development",
       eta: "Next Release"
    },
    {
       title: "Payslips Generation",
       description: "Generate, view, and email detailed PDF payslips to employees instantly after payroll finalization.",
       icon: DocumentTextIcon,
       status: "In Development",
       eta: "Next Release"
    },
    {
       title: "Inventory Batches",
       description: "Track inventory by batches, enabling expiry date management, targeted recall capabilities, and precise lot profitability analysis.",
       icon: CubeIcon,
       status: "In Development",
       eta: "Next Release"
    }
  ];

  return (
    <>
      <Seo
        title="Coming Soon"
        description="Preview upcoming Cenvora features for billing, inventory, GST, and finance workflows."
        canonicalPath="/coming-soon"
        noindex
      />
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fade-up">
        {/* Header section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-4 text-blue-400">
            <BeakerIcon className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Building the Future of <span className="text-blue-400 font-extrabold">Cenvora</span>
          </h1>
          <p className="text-lg text-gray-400">
            We are constantly working to bring you powerful new features. Here is a sneak peek at what is cooking in our development labs.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingFeatures.map((feature, idx) => (
            <div 
              key={idx}
              className="relative group bg-slate-900/70 border border-slate-800 rounded-2xl p-6 transition-all duration-200 hover:bg-slate-900 hover:border-blue-500/40 overflow-hidden"
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl transition-colors">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                       feature.status === 'On demand'
                         ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                         : 'bg-white/5 text-gray-300 border-white/10'
                     }`}>
                       {feature.status}
                     </span>
                     <span className="text-xs text-slate-400 font-medium font-mono">
                        ETA: {feature.eta}
                     </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed flex-grow">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter/Feedback prompt */}
        <div className="mt-16 bg-slate-900/80 border border-slate-700/60 rounded-2xl p-8 text-center max-w-3xl mx-auto shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-2">Want to shape our roadmap?</h3>
          <p className="text-gray-400 text-sm mb-6">
            We prioritize features based on your feedback. Tell us what you need next!
          </p>
          <button className="btn-primary" onClick={() => window.open('mailto:support@cenvora.co.in')}>
             Send Feedback
          </button>
        </div>
      </div>
    </>
  );
}
