import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  CubeIcon,
  BanknotesIcon,
  ArrowPathIcon,
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

/**
 * WarningsSection - Actionable alerts with traffic light severity
 * Shows: Out of stock, Low stock, Payment due, Dead stock, Cash flow warnings
 */
export default function WarningsSection({ data, healthStatus, isLoading }) {
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  if (isLoading) {
    return (
      <section className="bento-card !p-4 animate-pulse">
        <div className="h-6 w-48 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  const warnings = data || [];
  const health = healthStatus || { status: 'green', emoji: '🟢', message: 'All good!' };

  const getIcon = (type) => {
    switch (type) {
      case 'out_of_stock':
      case 'low_stock':
        return CubeIcon;
      case 'payment_due':
        return BanknotesIcon;
      case 'dead_stock':
        return ArrowPathIcon;
      case 'cash_flow':
        return ChartBarIcon;
      default:
        return ExclamationTriangleIcon;
    }
  };

  const severityStyles = {
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      dot: 'bg-red-500',
    },
    yellow: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      dot: 'bg-amber-500',
    },
    green: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      dot: 'bg-green-500',
    },
  };

  const HealthIcon = health.status === 'green' ? CheckCircleIcon : 
                     health.status === 'yellow' ? ExclamationTriangleIcon : ExclamationCircleIcon;

  const AlertsModal = () => {
    if (!showAllAlerts) return null;

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAllAlerts(false)} />

        <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl flex flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-white/[0.03] p-5">
            <div>
              <h3 className="text-xl font-bold text-white">All Alerts</h3>
              <p className="mt-1 text-xs text-gray-500">Showing every alert currently available in the dashboard.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAllAlerts(false)}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-3">
              {warnings.map((warning, i) => {
                const Icon = getIcon(warning.type);
                const styles = severityStyles[warning.severity] || severityStyles.yellow;

                return (
                  <div key={i} className={`flex items-start gap-3 rounded-xl border p-4 ${styles.bg} ${styles.border}`}>
                    <div className={`mt-1 h-2 w-2 rounded-full ${styles.dot} flex-shrink-0`} />
                    <div className={`rounded-lg p-2 ${styles.bg} flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${styles.text}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-medium ${styles.text}`}>{warning.title}</div>
                      <div className="mt-0.5 text-xs text-gray-500 whitespace-pre-line">{warning.message}</div>
                    </div>
                    {warning.action && (
                      <div className={`rounded-md px-2.5 py-1 text-xs font-medium ${styles.bg} ${styles.text} border ${styles.border}`}>
                        {warning.action === 'reorder' ? 'Reorder' :
                         warning.action === 'collect' ? 'Collect' :
                         warning.action === 'discount' ? 'Discount' :
                         warning.action === 'review' ? 'Review' : 'View'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <section className="bento-card !p-5">
      {/* Header with Health Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Alerts</h2>
          <span className="text-xs px-2 py-0.5 bg-white/5 text-gray-500 rounded-full">
            {warnings.length} items
          </span>
        </div>
        
        {/* Traffic Light Status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${severityStyles[health.status]?.bg} ${severityStyles[health.status]?.border} border`}>
          <HealthIcon className={`w-4 h-4 ${severityStyles[health.status]?.text}`} />
          <span className={`text-xs font-medium ${severityStyles[health.status]?.text}`}>
            {health.message}
          </span>
        </div>
      </div>

      {/* Warning List */}
      {warnings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircleIcon className="w-12 h-12 text-green-500/30 mb-3" />
          <p className="text-sm text-gray-500">No alerts right now!</p>
          <p className="text-xs text-gray-600">Your business is running smoothly 🎉</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {warnings.slice(0, 5).map((warning, i) => {
            const Icon = getIcon(warning.type);
            const styles = severityStyles[warning.severity] || severityStyles.yellow;
            
            return (
              <div 
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg border ${styles.bg} ${styles.border} hover:bg-white/5 transition-colors cursor-pointer`}
              >
                {/* Severity Dot */}
                <div className={`w-2 h-2 rounded-full ${styles.dot} mt-1.5 flex-shrink-0`} />
                
                {/* Icon */}
                <div className={`p-2 rounded-lg ${styles.bg} flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${styles.text}`} />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${styles.text}`}>
                    {warning.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {warning.message}
                  </div>
                </div>
                
                {/* Action Button */}
                {warning.action && (
                  <button className={`text-xs px-2 py-1 rounded ${styles.bg} ${styles.text} hover:bg-white/10 flex-shrink-0`}>
                    {warning.action === 'reorder' ? 'Reorder' :
                     warning.action === 'collect' ? 'Collect' :
                     warning.action === 'discount' ? 'Discount' :
                     warning.action === 'review' ? 'Review' : 'View'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {warnings.length > 5 && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setShowAllAlerts(true)}
            className="text-xs text-cyan-400 hover:text-cyan-300"
          >
            View all {warnings.length} alerts →
          </button>
        </div>
      )}

      <AlertsModal />
    </section>
  );
}
