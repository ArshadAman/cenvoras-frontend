import React from 'react';
import { 
  ShieldCheckIcon,
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

/**
 * GstShieldSection - GST Compliance Tracker
 * Shows: Turnover progress, Due dates, GSTR-1 download, GST payable
 */
export default function GstShieldSection({ data, isLoading, onDownloadReport }) {
  if (isLoading) {
    return (
      <section className="bento-card !p-5 animate-pulse">
        <div className="h-6 w-40 bg-white/10 rounded mb-4" />
        <div className="h-32 bg-white/5 rounded-lg" />
      </section>
    );
  }

  const gst = data || {};
  
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '₹0';
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${Math.abs(value).toLocaleString('en-IN')}`;
  };

  const turnoverPercent = gst.turnover_percent || 0;
  const isApproachingLimit = turnoverPercent >= 80;
  const daysUntilDue = gst.days_until_due || 0;
  const isDueSoon = daysUntilDue <= 5;

  const handleDownload = () => {
    if (onDownloadReport) {
      onDownloadReport();
    } else {
      // Fallback: open GSTR1 report in new tab
      window.open('/api/analytics/gstr1-report/?export=csv', '_blank');
    }
  };

  return (
    <section className="bento-card !p-5">
      <div className="flex items-center gap-2 mb-5">
        <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">GST Shield</h2>
      </div>

      <div className="space-y-5">
        {/* Turnover Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">Turnover (This FY)</span>
            <span className="text-xs text-gray-400">
              {formatCurrency(gst.total_turnover)} / {formatCurrency(gst.turnover_limit || 4000000)}
            </span>
          </div>
          
          <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isApproachingLimit ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
              }`}
              style={{ width: `${Math.min(100, turnoverPercent)}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center mt-1">
            <span className={`text-xs ${isApproachingLimit ? 'text-amber-400' : 'text-gray-600'}`}>
              {turnoverPercent.toFixed(1)}% of ₹40L limit
            </span>
            {isApproachingLimit && (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <ExclamationTriangleIcon className="w-3 h-3" />
                Approaching limit
              </span>
            )}
          </div>
        </div>


        {/* GST Payable */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Collected</div>
            <div className="text-sm font-bold text-green-400">{formatCurrency(gst.gst_collected)}</div>
          </div>
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Paid (ITC)</div>
            <div className="text-sm font-bold text-purple-400">{formatCurrency(gst.gst_paid)}</div>
          </div>
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Payable</div>
            <div className={`text-sm font-bold ${gst.gst_payable >= 0 ? 'text-amber-400' : 'text-green-400'}`}>
              {gst.gst_payable >= 0 ? formatCurrency(gst.gst_payable) : `${formatCurrency(gst.gst_payable)} (Credit)`}
            </div>
          </div>
        </div>

        {/* Download Button */}
        <button 
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors"
        >
          <DocumentArrowDownIcon className="w-4 h-4" />
          Download Report for CA
        </button>
      </div>
    </section>
  );
}

