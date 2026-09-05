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
       title: "WhatsApp Integration",
       description: "Send invoices, payment links, and low stock alerts automatically via WhatsApp to your customers.",
       icon: SparklesIcon,
       status: "Planned",
       eta: "Q2 2026"
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
          <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-2xl mb-4 text-purple-400">
            <BeakerIcon className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Building the Future of <span className="p-1 rounded bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 font-extrabold italic pr-2">Cenvora</span>
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
              className="relative group bg-[#111] border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.02] hover:border-purple-500/30 overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/5 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-300 rounded-md border border-white/10">
                       {feature.status}
                     </span>
                     <span className="text-xs text-purple-400 font-medium">
                        ETA: {feature.eta}
                     </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed flex-grow">
                  {feature.description}
                </p>
                
                {/* Decorative dots */}
                <div className="mt-6 flex gap-1 opacity-20">
                   <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                   <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                   <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter/Feedback prompt */}
        <div className="mt-16 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border border-white/10 rounded-2xl p-8 text-center max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-2">Want to shape our roadmap?</h3>
          <p className="text-gray-400 text-sm mb-6">
            We prioritize features based on your feedback. Tell us what you need next!
          </p>
          <button className="btn-primary" onClick={() => window.open('mailto:support@cenvora.app')}>
             Send Feedback
          </button>
        </div>
      </div>
    </>
  );
}
