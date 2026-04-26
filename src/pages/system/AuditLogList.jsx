import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "../../api/audit";
import Layout from "../../components/Layout";
import { 
    ClockIcon, 
    UserIcon, 
    DocumentTextIcon 
} from '@heroicons/react/24/outline';
import { format } from "date-fns";

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

  const renderChanges = (log) => {
    if (!log.changes || Object.keys(log.changes).length === 0) return <span className="text-gray-600 italic">No details captured</span>;

    if (log.action === 'UPDATE') {
      return (
        <div className="space-y-1 py-1">
          {Object.entries(log.changes).map(([field, delta]) => (
            <div key={field} className="flex flex-wrap items-center gap-1.5 leading-tight">
              <span className="text-white/80 font-medium px-1.5 py-0.5 rounded bg-white/5 border border-white/10">{field}</span>
              <span className="text-red-400 line-through decoration-red-400/50">{String(delta.old || 'null')}</span>
              <span className="text-gray-500">→</span>
              <span className="text-emerald-400 font-medium">{String(delta.new || 'null')}</span>
            </div>
          ))}
        </div>
      );
    }

    // For CREATE/DELETE, show summary of keys
    const keys = Object.keys(log.changes).filter(k => !k.startsWith('_')).slice(0, 5);
    return (
      <div className="text-[10px] text-gray-500 leading-relaxed max-w-sm">
        {keys.map(k => (
          <span key={k} className="mr-2">
            <span className="text-gray-400">{k}:</span> {String(log.changes[k]).substring(0, 20)}
            {String(log.changes[k]).length > 20 ? '...' : ''}
          </span>
        ))}
        {Object.keys(log.changes).length > 5 && <span className="italic text-gray-600"> +{Object.keys(log.changes).length - 5} more</span>}
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-6 md:p-10 animate-fade-up">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Audit Logs</h1>
            <p className="text-gray-400">Track team activity and business-critical changes across your entire organization.</p>
          </div>
        </div>

        <div className="bento-card overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Timestamp</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Action</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Entity</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Target Object</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Detailed Changes</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="p-16 text-center">
                    <div className="inline-block animate-pulse text-gray-500">Loading comprehensive logs...</div>
                  </td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="6" className="p-16 text-center text-gray-500 italic">No activity logged for your team yet.</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 text-xs text-gray-500 whitespace-nowrap tabular-nums">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="p-4 text-sm text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                             <UserIcon className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white/90">{log.user_email || 'System'}</p>
                            <p className="text-[10px] text-gray-500">{log.ip_address || 'Internal'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-center">
                        <span className={`inline-block w-20 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase border ${
                            log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            log.action === 'UPDATE' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                            log.action === 'DELETE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                            {log.action}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-mono text-indigo-300 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                          {log.model_name}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                         <div className="max-w-[180px]">
                           <p className="text-white/80 font-medium truncate" title={log.object_repr}>
                             {log.object_repr || `ID: ${log.object_id}`}
                           </p>
                           <p className="text-[10px] text-gray-500 font-mono">Ref: {log.object_id}</p>
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
    </Layout>
  );
}
