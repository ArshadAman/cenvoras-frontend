import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "../../api/audit";
import { 
    ClockIcon, 
    UserIcon, 
    DocumentTextIcon 
} from '@heroicons/react/24/outline';
import { format } from "date-fns";
import { formatCurrency } from '../../utils/currency';
import { formatAuditTimestamp } from '../../utils/dateFormat';

export default function AuditLogList() {
  const [params, setParams] = useState({ page: 1 });
  
  const { data, isLoading } = useQuery({
    queryKey: ["auditLogs", params],
    queryFn: () => getAuditLogs(params),
  });

  const logs = Array.isArray(data)
    ? data
    : data?.results || data?.data || [];

  const formatTimestamp = (value) => formatAuditTimestamp(value);

  // Readable mappings for technical terms
  const MODEL_LABELS = {
    'SalesInvoice': 'Sales Bill',
    'SalesInvoiceItem': 'Sales Bill Line',
    'PurchaseBill': 'Purchase Bill',
    'PurchaseBillItem': 'Purchase Bill Line',
    'Product': 'Inventory Item',
    'Customer': 'Customer',
    'Vendor': 'Vendor',
    'Payment': 'Payment Received',
    'GeneralLedgerEntry': 'Accounting Entry',
    'CreditNote': 'Sales Return',
    'DebitNote': 'Purchase Return',
    'User': 'Team Member/Profile',
    'Warehouse': 'Store/Warehouse',
    'ProductBatch': 'Batch/Expiry Info',
    'PayrollRun': 'Payroll Run',
    'Payslip': 'Payslip',
    'AttendanceRecord': 'Attendance',
  };

  const FIELD_LABELS = {
    'invoice_number': 'Bill No',
    'bill_number': 'Bill No',
    'total_amount': 'Total Value',
    'amount': 'Amount',
    'price': 'Price',
    'stock': 'Stock Qty',
    'name': 'Name',
    'customer_name': 'Customer',
    'vendor_name': 'Vendor',
    'invoice_date': 'Bill Date',
    'bill_date': 'Bill Date',
    'payment_status': 'Payment Status',
    'status': 'Status',
    'phone': 'Phone No',
    'email': 'Email',
    'address': 'Address',
    'role': 'User Role',
    'is_active': 'Account Active',
  };

  const formatValue = (field, val) => {
    if (val === null || val === undefined) return 'None';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'object') {
      // Prefer human labels over raw JSON dumps
      if (val.name) return String(val.name);
      if (val.bill_number) return String(val.bill_number);
      if (val.invoice_number) return String(val.invoice_number);
      if (val.email) return String(val.email);
      if (val.old !== undefined || val.new !== undefined) {
        return `${formatValue(field, val.old)} → ${formatValue(field, val.new)}`;
      }
      const keys = Object.keys(val);
      if (keys.length <= 3) {
        return keys.map((k) => `${FIELD_LABELS[k] || k}: ${formatValue(k, val[k])}`).join('; ');
      }
      return `${keys.length} fields`;
    }
    if (field.includes('amount') || field.includes('price') || field === 'total_revenue') {
      const num = Number(val);
      if (!Number.isNaN(num)) return formatCurrency(num);
    }
    // Mask tenant UUIDs / long opaque IDs for non-technical readability
    const s = String(val);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) {
      return `${s.slice(0, 8)}…`;
    }
    return s;
  };

  const renderChanges = (log) => {
    if (!log.changes || Object.keys(log.changes).length === 0) {
      return <span className="text-[var(--text-muted)] italic">No detailed changes</span>;
    }

    if (log.action === 'UPDATE') {
      // Support legacy {before, after} blobs if API did not normalize
      let entries = Object.entries(log.changes || {});
      if (log.changes?.before && log.changes?.after && typeof log.changes.before === 'object') {
        const before = log.changes.before || {};
        const after = log.changes.after || {};
        const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
        entries = keys
          .filter((k) => !String(k).startsWith('_') && before[k] !== after[k])
          .map((k) => [k, { old: before[k], new: after[k] }]);
      }
      return (
        <div className="space-y-2 py-1">
          {entries.map(([field, delta]) => {
            if (field === 'before' || field === 'after') return null;
            const label = FIELD_LABELS[field] || field;
            const setOnly = delta?.set_only || (delta?.old === undefined && delta?.new === undefined && typeof delta !== 'object');
            const oldVal = typeof delta === 'object' && delta !== null ? delta.old : undefined;
            const newVal = typeof delta === 'object' && delta !== null && ('new' in delta || 'old' in delta)
              ? delta.new
              : delta;

            if (setOnly || (oldVal === null || oldVal === undefined) && newVal !== undefined) {
              return (
                <div key={field} className="flex flex-wrap items-center gap-1.5 leading-tight text-xs">
                  <span className="text-[var(--text-secondary)] font-medium">{label}:</span>
                  <span className="text-[var(--text-muted)]">set to</span>
                  <span className="text-[var(--status-success)] font-bold px-1.5 py-0.5 bg-[var(--status-success)]/10 rounded">{formatValue(field, newVal)}</span>
                </div>
              );
            }

            return (
              <div key={field} className="flex flex-wrap items-center gap-1.5 leading-tight text-xs">
                <span className="text-[var(--text-secondary)] font-medium">{label}:</span>
                <span className="text-[var(--status-danger)] line-through px-1.5 py-0.5 bg-[var(--status-danger)]/10 rounded">{formatValue(field, oldVal)}</span>
                <span className="text-[var(--text-muted)]">→</span>
                <span className="text-[var(--status-success)] font-bold px-1.5 py-0.5 bg-[var(--status-success)]/10 rounded">{formatValue(field, newVal)}</span>
              </div>
            );
          })}
        </div>
      );
    }

    // For CREATE/DELETE
    const keys = Object.keys(log.changes).filter(k => !k.startsWith('_')).slice(0, 4);
    return (
      <div className="text-xs text-[var(--text-secondary)] grid grid-cols-2 gap-x-4 gap-y-1">
        {keys.map(k => (
          <div key={k} className="truncate">
            <span className="text-[var(--text-muted)]">{FIELD_LABELS[k] || k}:</span> {formatValue(k, log.changes[k])}
          </div>
        ))}
        {Object.keys(log.changes).length > 4 && (
          <div className="col-span-2 text-xs italic text-[var(--text-muted)] mt-1">
            + {Object.keys(log.changes).length - 4} more details
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="p-6 md:p-10 animate-fade-up">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">Audit History</h1>
            <p className="text-[var(--text-secondary)]">Keep track of every important action in your business.</p>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Time</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Done By</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-center">Action</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Type</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">What Changed</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {isLoading ? (
                  <tr><td colSpan="6" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <ClockIcon className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
                       <div className="text-[var(--text-secondary)] font-medium">Reading logs...</div>
                    </div>
                  </td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="6" className="p-20 text-center text-[var(--text-muted)] italic">No activity recorded yet.</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors group">
                      <td className="p-4 text-xs text-[var(--text-muted)] whitespace-nowrap tabular-nums">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center">
                             <UserIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                          </div>
                          <div className="max-w-[150px]">
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{log.user_email?.split('@')[0] || 'System'}</p>
                            <p className="text-xs text-[var(--text-muted)]">{log.ip_address || 'Cloud'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold tracking-wider uppercase ${
                            log.action === 'CREATE' ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30' :
                            log.action === 'UPDATE' ? 'bg-[var(--status-info)]/15 text-[var(--status-info)] border border-[var(--status-info)]/30' :
                            log.action === 'DELETE' ? 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30' :
                            'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                        }`}>
                            {log.action === 'CREATE' ? 'ADDED' : log.action === 'UPDATE' ? 'CHANGED' : log.action === 'DELETE' ? 'REMOVED' : log.action}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-semibold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-1 rounded-md border border-[var(--accent-primary)]/20 shadow-sm whitespace-nowrap">
                          {MODEL_LABELS[log.model_name] || log.model_name}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                         <div className="max-w-[200px]">
                           <p className="text-[var(--text-primary)] font-semibold truncate text-xs" title={log.object_repr}>
                             {log.object_repr || `ID: ${log.object_id?.substring(0, 8)}`}
                           </p>
                           <p className="text-xs text-[var(--text-muted)] font-mono tracking-tighter">REF: {log.object_id?.substring(0, 18)}...</p>
                         </div>
                      </td>
                      <td className="p-4">
                        {renderChanges(log)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
