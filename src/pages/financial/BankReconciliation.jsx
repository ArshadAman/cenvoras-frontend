import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/api';
import Layout from '../../components/Layout';
import { ArrowUpTrayIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { toast, ToastContainer } from 'react-toastify';

const fmt = (v) => v?.toLocaleString('en-IN', { minimumFractionDigits: 2 });

const uploadBankStatement = async (formData) => {
  const response = await api.post('/ledger/bank/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

const getReconciliationStatus = async (statementId) => {
  const response = await api.get(`/ledger/bank/status/${statementId}/`);
  return response.data;
};

const reconcileLine = async ({ lineId, entryId }) => {
  const response = await api.post(`/ledger/bank/reconcile/${lineId}/`, { entry_id: entryId });
  return response.data;
};

export default function BankReconciliation() {
  const [statementId, setStatementId] = useState(null);
  const queryClient = useQueryClient();

  const { data: statusData, refetch } = useQuery({
    queryKey: ['reconciliation-status', statementId],
    queryFn: () => getReconciliationStatus(statementId),
    enabled: !!statementId,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadBankStatement,
    onSuccess: (data) => {
      setStatementId(data.id);
      toast.success(`Uploaded ${data.count} lines successfully`);
    },
    onError: (err) => toast.error(err.response?.data?.error || "Upload failed"),
  });

  const matchMutation = useMutation({
    mutationFn: reconcileLine,
    onSuccess: () => {
      queryClient.invalidateQueries(['reconciliation-status', statementId]);
      toast.success("Matched successfully");
    },
    onError: () => toast.error("Failed to match"),
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bank_name', 'HDFC Bank'); // Hardcoded for MVP or add input
    uploadMutation.mutate(formData);
  };

  return (
    <Layout>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Bank Reconciliation</h1>
            <p className="text-gray-400 text-sm">Upload statements and match with ledger entries.</p>
          </div>
          
          <div className="flex gap-4">
             {/* Simple File Upload Button */}
             <label className="btn-primary flex items-center gap-2 cursor-pointer">
              <ArrowUpTrayIcon className="w-4 h-4" />
              <span>Upload Statement</span>
              <input type="file" onChange={handleFileUpload} className="hidden" accept=".csv,.xlsx" />
            </label>
          </div>
        </div>

        {!statementId ? (
          <div className="bento-card p-12 text-center text-gray-500 border-dashed border-2 border-white/10 bg-transparent">
            <ArrowUpTrayIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium text-white mb-2">No Statement Selected</h3>
            <p>Upload a CSV file to start reconciliation.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/10">
              <div>
                <h3 className="text-white font-medium">{statusData?.statement?.name}</h3>
                <p className="text-sm text-gray-400">Uploaded: {new Date(statusData?.statement?.date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                    {statusData?.lines?.filter(l => !l.is_reconciled).length}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Unreconciled Lines</div>
              </div>
            </div>

            <div className="space-y-4">
              {statusData?.lines?.map((line) => (
                <div key={line.id} className={`bento-card p-4 border transition-all ${
                  line.is_reconciled ? 'border-green-500/20 bg-green-500/5' : 'border-white/10'
                }`}>
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    {/* Bank Side */}
                    <div className="flex-1 w-full">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400 text-xs font-mono">{line.date}</span>
                        <span className={`font-mono font-medium ${line.debit > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {line.debit > 0 ? `- ₹${fmt(line.debit)}` : `+ ₹${fmt(line.credit)}`}
                        </span>
                      </div>
                      <div className="text-white text-sm truncate" title={line.description}>
                        {line.description}
                      </div>
                    </div>

                    {/* Divider Icon */}
                    <div className="hidden md:block text-gray-600">
                      {line.is_reconciled ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                      ) : (
                        <ArrowPathIcon className="w-6 h-6" />
                      )}
                    </div>

                    {/* Ledger Side / Match Action */}
                    <div className="flex-1 w-full border-l border-white/10 md:pl-4">
                      {line.is_reconciled ? (
                        <div className="flex items-center gap-2">
                           <div className="bg-green-500/20 p-1.5 rounded-full">
                             <CheckCircleIcon className="w-4 h-4 text-green-400" />
                           </div>
                           <div>
                              <div className="text-white text-sm font-medium">Matched</div>
                              <div className="text-xs text-gray-400">
                                {line.matched_entry?.description || "Linked Entry"}
                              </div>
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {line.candidates?.length > 0 ? (
                            <div>
                                <p className="text-xs text-purple-400 font-medium mb-2">Suggested Matches:</p>
                                <div className="space-y-2">
                                    {line.candidates.map(candidate => (
                                        <div key={candidate.id} className="flex justify-between items-center bg-white/5 p-2 rounded text-sm hover:bg-white/10 cursor-pointer"
                                             onClick={() => matchMutation.mutate({ lineId: line.id, entryId: candidate.id })}>
                                            <div className="truncate text-gray-300 pr-2">
                                                <span className="text-white block text-xs">{candidate.date}</span>
                                                {candidate.description}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-white font-mono">₹{fmt(candidate.amount)}</span>
                                                <button className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded hover:bg-purple-500/30">Match</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-500 text-sm italic">
                              <ExclamationCircleIcon className="w-4 h-4" /> No automatic matches found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="dark" />
      </div>
    </Layout>
  );
}
