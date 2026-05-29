import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function TrialBalance() {
  return (
    <>
      <div className="page-bg min-h-screen p-6 flex items-center justify-center">
        <div className="bento-card p-12 text-center max-w-lg w-full">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyan-500/10 flex items-center justify-center">
            <ChartBarIcon className="w-10 h-10 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Trial Balance</h1>
          <p className="text-gray-400 text-lg mb-8">
            This financial report is currently under development. We're working hard to bring you advanced financial insights.
          </p>
          <div className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-cyan-400 font-medium tracking-wide">
            <span className="relative flex h-3 w-3 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            Coming Soon
          </div>
        </div>
      </div>
    </>
  );
}
