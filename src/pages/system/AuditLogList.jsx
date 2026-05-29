import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "../../api/audit";
import { 
    ClockIcon, 
    UserIcon, 
    DocumentTextIcon 
} from '@heroicons/react/24/outline';
import { format } from "date-fns";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

export default function AuditLogList() {
  const [params, setParams] = useState({ page: 1 });
  
  const { data, isLoading } = useQuery({
    queryKey: ["auditLogs", params],
    queryFn: () => getAuditLogs(params),
  });

  const logs = Array.isArray(data)
    ? data
    : data?.results || data?.data || [];

  const formatTimestamp = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return format(date, 'dd MMM yyyy HH:mm:ss');
  };

  // Readable mappings for technical terms
  const MODEL_LABELS = {
    'SalesInvoice': 'Sales Bill',
    'PurchaseBill': 'Purchase Bill',
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
    if (field.includes('amount') || field.includes('price') || field === 'total_revenue') {
      return `${getCurrencySymbol()}${Number(val).toLocaleString()}`;
    }
    return String(val);
  };

  const renderChanges = (log) => {
    if (!log.changes || Object.keys(log.changes).length === 0) {
      return <span className="text-gray-600 italic">No detailed changes</span>;
    }

    if (log.action === 'UPDATE') {
      return (
        <div className="space-y-2 py-1">
          {Object.entries(log.changes).map(([field, delta]) => {
            const label = FIELD_LABELS[field] || field;
            const oldVal = delta?.old;
            const newVal = delta?.new ?? delta;
            
            return (
              <div key={field} className="flex flex-wrap items-center gap-1.5 leading-tight text-xs">
                <span className="text-gray-400 font-medium">{label}:</span>
                <span className="text-red-400/80 line-through px-1 bg-red-500/5 rounded">{formatValue(field, oldVal)}</span>
                <span className="text-gray-600">→</span>
                <span className="text-emerald-400 font-bold px-1 bg-emerald-500/5 rounded">{formatValue(field, newVal)}</span>
              </div>
            );
          })}
        </div>
      );
    }

    // For CREATE/DELETE
    const keys = Object.keys(log.changes).filter(k => !k.startsWith('_')).slice(0, 4);
    return (
      <div className="text-[11px] text-gray-500 grid grid-cols-2 gap-x-4 gap-y-1">
        {keys.map(k => (
          <div key={k} className="truncate">
            <span className="text-gray-400">{FIELD_LABELS[k] || k}:</span> {formatValue(k, log.changes[k])}
          </div>
        ))}
        {Object.keys(log.changes).length > 4 && (
          <div className="col-span-2 text-[10px] italic text-gray-600 mt-1">
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
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Audit History</h1>
            <p className="text-gray-400">Keep track of every important action in your business.</p>
          </div>
        </div>

        <div className="bento-card overflow-hidden border border-white/10 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Time</th>
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Done By</th>
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">What Changed</th>
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr><td colSpan="6" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <ClockIcon className="w-8 h-8 text-cyan-500 animate-spin" />
                       <div className="text-gray-500 font-medium">Reading logs...</div>
                    </div>
                  </td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="6" className="p-20 text-center text-gray-500 italic">No activity recorded yet.</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 text-xs text-gray-500 whitespace-nowrap tabular-nums">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                             <UserIcon className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div className="max-w-[150px]">
                            <p className="text-sm font-bold text-white/90 truncate">{log.user_email?.split('@')[0] || 'System'}</p>
                            <p className="text-[10px] text-gray-500">{log.ip_address || 'Cloud'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-black tracking-tighter uppercase ${
                            log.action === 'CREATE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            log.action === 'UPDATE' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                            log.action === 'DELETE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                            {log.action === 'CREATE' ? 'ADDED' : log.action === 'UPDATE' ? 'CHANGED' : log.action === 'DELETE' ? 'REMOVED' : log.action}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 shadow-sm whitespace-nowrap">
                          {MODEL_LABELS[log.model_name] || log.model_name}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                         <div className="max-w-[200px]">
                           <p className="text-white/80 font-semibold truncate text-xs" title={log.object_repr}>
                             {log.object_repr || `ID: ${log.object_id?.substring(0, 8)}`}
                           </p>
                           <p className="text-[9px] text-gray-600 font-mono tracking-tighter">REF: {log.object_id?.substring(0, 18)}...</p>
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
