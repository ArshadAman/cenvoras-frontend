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

  return (
    <Layout>
      <div className="p-6 md:p-10 animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Audit Logs</h1>
        <p className="text-gray-400 mb-8">Track system changes and user actions.</p>

        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Timestamp</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">User</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Action</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Model</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Object</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Changes</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading logs...</td></tr>
                ) : data?.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">No activity logged yet.</td></tr>
                ) : (
                  data?.map((log) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm text-gray-400 whitespace-nowrap">
                        {format(new Date(log.timestamp), 'dd MMM yyyy HH:mm:ss')}
                      </td>
                      <td className="p-4 text-sm text-white flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-500" />
                        {log.user_email || 'System'}
                      </td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            log.action === 'CREATE' ? 'bg-green-500/20 text-green-400' :
                            log.action === 'UPDATE' ? 'bg-blue-500/20 text-blue-400' :
                            log.action === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                        }`}>
                            {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-cyan-300 font-mono">{log.model_name}</td>
                      <td className="p-4 text-sm text-gray-300 max-w-xs truncate" title={log.object_repr}>
                         {log.object_repr}
                      </td>
                      <td className="p-4 text-xs text-gray-400 font-mono max-w-sm truncate">
                        {JSON.stringify(log.changes)}
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
