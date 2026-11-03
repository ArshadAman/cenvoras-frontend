import React from "react";
import {
  SparklesIcon,
  BeakerIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  BuildingLibraryIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import Seo from "../components/Seo";

export default function ComingSoon() {
  const upcomingFeatures = [
    {
      title: "E-Way Bill Generation",
      description: "Direct integration with GST portal to generate E-Way bills directly from sales invoices.",
      icon: ArrowTrendingUpIcon,
      status: "In Development",
      eta: "Testing Phase",
    },
    {
      title: "E-Invoice (IRN)",
      description: "Auto-generate Invoice Reference Number (IRN) and QR codes for B2B transactions as per GST mandate.",
      icon: ShieldCheckIcon,
      status: "In Development",
      eta: "Testing Phase",
    },
    {
      title: "WhatsApp Automation",
      description: "Send invoices, payment links, and low stock alerts automatically via WhatsApp to your customers.",
      icon: SparklesIcon,
      status: "On demand",
      eta: "Available on Demand",
    },
    {
      title: "Bank Reconciliation",
      description: "Import bank statements and automatically match them against recorded payments and ledger entries using smart date-amount matching.",
      icon: BuildingLibraryIcon,
      status: "In Development",
      eta: "Next Release",
    },
    {
      title: "Inventory Batches",
      description: "Track inventory by batches, enabling expiry date management, targeted recall capabilities, and precise lot profitability analysis.",
      icon: CubeIcon,
      status: "In Development",
      eta: "Next Release",
    },
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
          <div className="inline-flex items-center justify-center p-3 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-2xl mb-4 text-[var(--accent-primary)]">
            <BeakerIcon className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
            Building the Future of <span className="text-[var(--accent-primary)] font-extrabold">Cenvora</span>
          </h1>
          <p className="text-base md:text-lg text-[var(--text-secondary)]">
            We are constantly working to bring you powerful new features. Here is a sneak peek at what is cooking in our development labs.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="relative group bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 transition-all duration-200 hover:border-[var(--border-default)] hover:shadow-md overflow-hidden"
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 rounded-xl transition-colors">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md border ${
                        feature.status === "On demand"
                          ? "bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)]"
                          : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
                      }`}
                    >
                      {feature.status}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-medium font-mono">
                      ETA: {feature.eta}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-grow">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Feedback prompt */}
        <div className="mt-16 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-8 text-center max-w-3xl mx-auto shadow-sm">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            Want to shape our roadmap?
          </h3>
          <p className="text-[var(--text-secondary)] text-sm mb-6">
            We prioritize features based on your feedback. Tell us what you need next!
          </p>
          <button
            className="btn-primary cursor-pointer px-6 py-2.5"
            onClick={() => window.open("mailto:support@cenvora.co.in")}
          >
            Send Feedback
          </button>
        </div>
      </div>
    </>
  );
}
