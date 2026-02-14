import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  EnvelopeIcon, ChatBubbleLeftIcon, QrCodeIcon, CloudArrowDownIcon, CloudArrowUpIcon,
  KeyIcon, PlusIcon, TrashIcon, DocumentDuplicateIcon, CheckCircleIcon, XCircleIcon
} from '@heroicons/react/24/outline';
import {
  getNotificationLogs, getApiKeys, createApiKey, deleteApiKey,
  exportData, importData, sendInvoiceNotification
} from '../../api/integrations';
import { toast } from 'react-toastify';

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [newKeyName, setNewKeyName] = useState('');
  const [exportResult, setExportResult] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [sendForm, setSendForm] = useState({ channel: 'email', recipient: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);

  const { data: logs } = useQuery({ queryKey: ['notification-logs'], queryFn: () => getNotificationLogs().then(r => r.data) });
  const { data: apiKeys } = useQuery({ queryKey: ['api-keys'], queryFn: () => getApiKeys().then(r => r.data) });

  const createKeyMutation = useMutation({
    mutationFn: (data) => createApiKey(data),
    onSuccess: () => { queryClient.invalidateQueries(['api-keys']); setNewKeyName(''); }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id) => deleteApiKey(id),
    onSuccess: () => queryClient.invalidateQueries(['api-keys'])
  });

  const handleExport = async () => {
    try {
      const { data } = await exportData();
      setExportResult(data);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cenvora-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      const { data: result } = await importData(data);
      setImportResult(result);
    } catch (err) {
      setImportResult({ error: err.message });
    }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const integrationCards = [
    { id: 'email', icon: EnvelopeIcon, title: 'Email (SendGrid)', desc: 'Send invoices & reminders via email', status: 'demo', color: 'from-blue-500 to-blue-600' },
    { id: 'whatsapp', icon: ChatBubbleLeftIcon, title: 'WhatsApp', desc: 'Send notifications via WhatsApp', status: 'demo', color: 'from-green-500 to-green-600' },
    { id: 'barcode', icon: QrCodeIcon, title: 'Barcode/QR', desc: 'Scan barcodes for quick billing', status: 'active', color: 'from-orange-500 to-orange-600' },
    { id: 'backup', icon: CloudArrowDownIcon, title: 'Data Backup', desc: 'Export & restore your data', status: 'active', color: 'from-purple-500 to-purple-600' },
    { id: 'apikeys', icon: KeyIcon, title: 'API Keys', desc: 'Manage external API access', status: 'active', color: 'from-cyan-500 to-cyan-600' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'backup', label: 'Backup & Restore' },
    { id: 'apikeys', label: 'API Keys' },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Business Tools</h1>
        <p className="text-gray-500">Notifications, backups, API access, and more.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {integrationCards.map(card => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => {
                  if (card.id === 'backup') setActiveTab('backup');
                  else if (card.id === 'apikeys') setActiveTab('apikeys');
                  else if (['email', 'whatsapp'].includes(card.id)) setActiveTab('notifications');
                }}
                className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    card.status === 'active' 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}>
                    {card.status === 'active' ? 'Active' : 'Demo Mode'}
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-1">{card.title}</h3>
                <p className="text-gray-500 text-sm">{card.desc}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Send Notification Form */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Send Notification</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase">Channel</label>
                <select
                  value={sendForm.channel}
                  onChange={(e) => setSendForm(p => ({ ...p, channel: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/40"
                >
                  <option value="email" className="bg-[#111]">📧 Email</option>
                  <option value="whatsapp" className="bg-[#111]">💬 WhatsApp</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase">Recipient</label>
                <input
                  type="text"
                  value={sendForm.recipient}
                  onChange={(e) => setSendForm(p => ({ ...p, recipient: e.target.value }))}
                  placeholder={sendForm.channel === 'email' ? 'customer@example.com' : '919876543210'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/40"
                />
              </div>
            </div>
            {sendForm.channel === 'email' && (
              <div className="space-y-2 mb-4">
                <label className="text-xs font-medium text-gray-400 uppercase">Subject</label>
                <input
                  type="text"
                  value={sendForm.subject}
                  onChange={(e) => setSendForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="Invoice #123 - Payment Reminder"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/40"
                />
              </div>
            )}
            <div className="space-y-2 mb-4">
              <label className="text-xs font-medium text-gray-400 uppercase">Message</label>
              <textarea
                value={sendForm.body}
                onChange={(e) => setSendForm(p => ({ ...p, body: e.target.value }))}
                rows={3}
                placeholder="Type your message..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/40 resize-none"
              />
            </div>
            <button
              onClick={async () => {
                if (!sendForm.recipient || !sendForm.body) { toast.warning('Recipient and message are required'); return; }
                setSending(true);
                try {
                  await sendInvoiceNotification(sendForm);
                  toast.success(`${sendForm.channel === 'email' ? 'Email' : 'WhatsApp'} sent to ${sendForm.recipient}`);
                  queryClient.invalidateQueries(['notification-logs']);
                  setSendForm({ channel: sendForm.channel, recipient: '', subject: '', body: '' });
                } catch (e) { toast.error('Failed to send notification'); }
                setSending(false);
              }}
              disabled={sending || !sendForm.recipient || !sendForm.body}
              className="px-6 py-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl font-medium hover:bg-cyan-500/20 transition-colors disabled:opacity-30 flex items-center gap-2"
            >
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </div>

          {/* Notification History */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-1">Notification History</h2>
            <p className="text-sm text-gray-500 mb-4">All emails and WhatsApp messages sent from the system.</p>
            
            {(!logs || logs.length === 0) ? (
              <div className="text-center py-8 text-gray-500">
                <EnvelopeIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No notifications sent yet.</p>
                <p className="text-xs mt-1">Send an invoice notification to see it here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-400">
                      <th className="text-left py-3 px-2 font-medium">Channel</th>
                      <th className="text-left py-3 px-2 font-medium">Recipient</th>
                      <th className="text-left py-3 px-2 font-medium">Subject</th>
                      <th className="text-left py-3 px-2 font-medium">Status</th>
                      <th className="text-left py-3 px-2 font-medium">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(logs) ? logs : logs?.results || []).map(log => (
                      <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            log.channel === 'email' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'
                          }`}>{log.channel}</span>
                        </td>
                        <td className="py-3 px-2 text-gray-300">{log.recipient}</td>
                        <td className="py-3 px-2 text-gray-400">{log.subject || '—'}</td>
                        <td className="py-3 px-2">
                          {log.status === 'sent' ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-400" />
                          ) : (
                            <XCircleIcon className="w-5 h-5 text-red-400" />
                          )}
                        </td>
                        <td className="py-3 px-2 text-gray-500">{new Date(log.sent_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backup & Restore Tab */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CloudArrowDownIcon className="w-8 h-8 text-purple-400" />
              <div>
                <h3 className="text-white font-semibold">Export Data</h3>
                <p className="text-sm text-gray-500">Download a JSON backup of your data.</p>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="w-full py-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl font-medium hover:bg-purple-500/20 transition-colors"
            >
              Export Now
            </button>
            {exportResult && (
              <div className="mt-4 p-3 bg-green-500/5 border border-green-500/10 rounded-xl text-sm text-green-400">
                ✅ Exported: {exportResult.summary?.total_products} products, {exportResult.summary?.total_customers} customers, {exportResult.summary?.total_invoices} invoices
              </div>
            )}
          </div>

          {/* Import */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CloudArrowUpIcon className="w-8 h-8 text-cyan-400" />
              <div>
                <h3 className="text-white font-semibold">Import Data</h3>
                <p className="text-sm text-gray-500">Restore from a JSON backup file.</p>
              </div>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0])}
              className="w-full mb-3 text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:font-medium file:cursor-pointer"
            />
            <button
              onClick={handleImport}
              disabled={!importFile}
              className="w-full py-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl font-medium hover:bg-cyan-500/20 transition-colors disabled:opacity-30"
            >
              Import
            </button>
            {importResult && (
              <div className={`mt-4 p-3 rounded-xl text-sm ${importResult.error ? 'bg-red-500/5 border border-red-500/10 text-red-400' : 'bg-green-500/5 border border-green-500/10 text-green-400'}`}>
                {importResult.error ? `❌ ${importResult.error}` : `✅ Imported: ${importResult.imported?.products} products, ${importResult.imported?.customers} customers`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'apikeys' && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">API Keys</h2>
          <p className="text-sm text-gray-500 mb-5">Generate keys for external integrations (online store, POS, etc.)</p>

          {/* Create new key */}
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g. My Online Store)"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/40"
            />
            <button
              onClick={() => createKeyMutation.mutate({ name: newKeyName })}
              disabled={!newKeyName.trim()}
              className="px-5 py-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl font-medium hover:bg-cyan-500/20 transition-colors disabled:opacity-30 flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" /> Create
            </button>
          </div>

          {/* Keys list */}
          {(!apiKeys || (Array.isArray(apiKeys) ? apiKeys : apiKeys?.results || []).length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              <KeyIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No API keys created yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(Array.isArray(apiKeys) ? apiKeys : apiKeys?.results || []).map(key => (
                <div key={key.id} className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{key.name}</p>
                    <code className="text-xs text-gray-500 font-mono">{key.key.slice(0, 12)}...{key.key.slice(-8)}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyKey(key.key)}
                      className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                      title="Copy key"
                    >
                      {copiedKey === key.key ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <DocumentDuplicateIcon className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => deleteKeyMutation.mutate(key.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete key"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
