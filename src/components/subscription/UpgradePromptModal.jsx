import React from 'react';
import { createPortal } from 'react-dom';
import { LockClosedIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function UpgradePromptModal({
  isOpen,
  onClose,
  title = 'Upgrade required',
  featureName = 'this feature',
  currentPlanName = 'Free',
  targetPlanName = 'Pro',
  description = '',
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f0f12] shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400">
              <LockClosedIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="mt-1 text-sm text-gray-400">
                {featureName} is not included in your current {currentPlanName} plan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm leading-6 text-gray-300">
            {description || `Upgrade to ${targetPlanName} to unlock ${featureName}. This keeps the feature visible while making the restriction obvious.`}
          </p>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">What happens next</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div>• Your current data stays intact.</div>
              <div>• You can upgrade without losing invoices, customers, or reports.</div>
              <div>• Contact the team to move to {targetPlanName}.</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:cenvoras@gmail.com?subject=Plan%20upgrade%20request"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-400 transition-all"
            >
              Contact Support
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
