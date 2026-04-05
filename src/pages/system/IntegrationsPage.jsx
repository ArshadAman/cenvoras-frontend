import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  EnvelopeIcon, ChatBubbleLeftIcon, QrCodeIcon, CloudArrowDownIcon, CloudArrowUpIcon,
  KeyIcon, CheckCircleIcon, XCircleIcon, BellAlertIcon, CameraIcon,
  ArrowPathIcon, SparklesIcon, ShieldCheckIcon, ExclamationTriangleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import {
  getNotificationLogs, sendCustomEmail, sendPaymentReminders,
  exportData, importData,
  lookupBarcode,
} from '../../api/integrations';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ─── Back to — not needed here, this is under System group in sidebar ───

const TABS = [
  { id: 'email', label: '📧 Email', icon: EnvelopeIcon },
  { id: 'barcode', label: '📷 Barcode Scanner', icon: QrCodeIcon },
  { id: 'backup', label: '💾 Data Backup', icon: CloudArrowDownIcon },
  { id: 'whatsapp', label: '💬 WhatsApp', icon: ChatBubbleLeftIcon, comingSoon: true },
  { id: 'apikeys', label: '🔑 API Keys', icon: KeyIcon, comingSoon: true },
];

// ─── ComingSoon Placeholder ───
function ComingSoonPlaceholder({ title, description, icon: Icon }) {
  return (
    <div className="bento-card p-10 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
      <div className="relative mb-6">
        <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
          <Icon className="w-12 h-12 text-gray-500" />
        </div>
        <span className="absolute -top-2 -right-2 px-2.5 py-1 bg-gradient-to-r from-pink-500 to-orange-400 text-[10px] font-extrabold uppercase rounded-full text-white tracking-widest">
          Soon
        </span>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-400 text-sm leading-relaxed mb-6">{description}</p>
      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-gray-500 text-sm">
        <SparklesIcon className="w-4 h-4 text-purple-400" />
        We'll notify you when this is available
      </div>
    </div>
  );
}

// ─── Email Tab ───
function EmailTab() {
  const queryClient = useQueryClient();
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['notification-logs'],
    queryFn: () => getNotificationLogs().then(r => r.data),
    refetchInterval: 4000,
  });

  // Fetch customers with emails for the restricted recipient picker
  const { data: customerData } = useQuery({
    queryKey: ['customers-for-email'],
    queryFn: () => import('../../api/customers').then(mod => mod.getCustomers({ page_size: 200 })),
  });
  const customersRaw = customerData?.results || customerData || [];
  const customersWithEmail = Array.isArray(customersRaw) ? customersRaw.filter(c => c.email) : [];

  const [form, setForm] = useState({ recipient: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredCustomers = customersWithEmail.filter(c =>
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const selectedCustomer = customersWithEmail.find(c => c.email === form.recipient);

  const remindersMutation = useMutation({
    mutationFn: sendPaymentReminders,
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Payment reminders queued!');
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    },
    onError: () => toast.error('Failed to queue payment reminders'),
  });

  const handleSend = async () => {
    if (!form.recipient || !form.body) { toast.warning('Recipient and message are required'); return; }
    setSending(true);
    try {
      await sendCustomEmail(form);
      toast.success(`Email queued to ${form.recipient}`);
      setForm({ recipient: '', subject: '', body: '' });
      setCustomerSearch('');
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    } catch { toast.error('Failed to send email'); }
    setSending(false);
  };

  const logList = Array.isArray(logs) ? logs : (logs?.results || []);

  return (
    <div className="space-y-6">

      {/* Payment Reminder Automation */}
      <div className="bento-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-amber-500/10 rounded-xl">
            <BellAlertIcon className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Automated Payment Reminders</h3>
            <p className="text-sm text-gray-400">Send outstanding balance reminders to all customers with unpaid dues</p>
          </div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-4 text-sm text-amber-200">
          <ExclamationTriangleIcon className="w-4 h-4 inline mr-2 text-amber-400" />
          This will email <strong>every customer with an outstanding balance</strong>. Verify your email configuration first.
        </div>
        <button
          onClick={() => remindersMutation.mutate()}
          disabled={remindersMutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl font-semibold hover:bg-amber-500/20 transition-colors disabled:opacity-40"
        >
          {remindersMutation.isPending ? (
            <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Sending...</>
          ) : (
            <><BellAlertIcon className="w-4 h-4" /> Send Payment Reminders Now</>
          )}
        </button>
      </div>

      {/* Manual Email Send — Customer-Only */}
      <div className="bento-card p-6">
        <h3 className="text-white font-bold mb-1">Send Email to Customer</h3>
        <p className="text-xs text-gray-500 mb-4">You can only send emails to registered customers with an email address on file.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <label className="text-xs text-gray-400 block mb-1">Customer</label>
            <input
              type="text"
              value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.email})` : customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setForm(p => ({ ...p, recipient: '' }));
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Type customer name or email..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
            />
            {showDropdown && !form.recipient && (
              <div className="absolute z-50 top-full mt-1 w-full max-h-48 overflow-y-auto bg-[#111] border border-white/10 rounded-xl shadow-xl">
                {filteredCustomers.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    {customersWithEmail.length === 0 ? 'No customers have email addresses' : 'No matching customers'}
                  </div>
                ) : (
                  filteredCustomers.slice(0, 10).map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setForm(p => ({ ...p, recipient: c.email }));
                        setCustomerSearch('');
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                    >
                      <div className="text-sm text-white font-medium">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.email}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              placeholder="Invoice / Payment Reminder..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs text-gray-400 block mb-1">Message</label>
          <textarea
            value={form.body}
            onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
            rows={4}
            placeholder="Type your message here..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 resize-none"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={sending || !form.recipient}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl font-semibold hover:bg-blue-500/20 transition-colors disabled:opacity-40"
        >
          {sending ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Sending...</> : <><EnvelopeIcon className="w-4 h-4" /> Send Email</>}
        </button>
      </div>

      {/* Notification History */}
      <div className="bento-card p-0 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Email History</h3>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['notification-logs'] })}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Refresh logs"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
        {logsLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : logList.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <EnvelopeIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
            No emails sent yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 text-xs uppercase">
                  <th className="px-5 py-3 text-left font-medium">Recipient</th>
                  <th className="px-5 py-3 text-left font-medium">Subject</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {logList.filter(l => l.channel === 'email').map(log => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-gray-300">{log.recipient}</td>
                    <td className="px-5 py-3 text-gray-400">{log.subject || '—'}</td>
                    <td className="px-5 py-3">
                      {log.status === 'sent' ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                          <CheckCircleIcon className="w-4 h-4" /> Sent
                        </span>
                      ) : log.status === 'queued' ? (
                        <span className="flex items-center gap-1 text-blue-400 text-xs font-semibold">
                          <ArrowPathIcon className="w-4 h-4 animate-spin" /> Queued
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-xs font-semibold">
                          <XCircleIcon className="w-4 h-4" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(log.sent_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Barcode Scanner Tab ───
function BarcodeTab() {
  const navigate = useNavigate();
  const [scanMode, setScanMode] = useState('manual'); // 'manual' | 'camera' | 'hardware'
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);
  const [notFoundBarcode, setNotFoundBarcode] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const hardwareRef = useRef(null);
  const scannerRef = useRef(null);

  const lookupProduct = async (code) => {
    if (!code || !code.trim()) return;
    setIsLookingUp(true);
    setLookupError('');
    setScannedProduct(null);
    setNotFoundBarcode('');
    try {
      const res = await lookupBarcode(code.trim());
      setScannedProduct(res.data);
      toast.success(`Found: ${res.data.name}`);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFoundBarcode(code);
        setLookupError(`No product found with barcode: ${code}`);
      } else {
        setLookupError(`Error looking up barcode: ${code}`);
      }
    }
    setIsLookingUp(false);
  };

  useEffect(() => {
    if (scanMode === 'camera') {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [0] // Html5QrcodeScanType.SCAN_TYPE_CAMERA
      });
      
      scanner.render((decodedText) => {
        setBarcodeInput(decodedText);
        lookupProduct(decodedText);
      }, (error) => {
        // quiet fail on scan errors
      });

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
        scannerRef.current = null;
      }
    };
  }, [scanMode]);

  // Hardware scanner support: listens for rapid keystrokes ending in Enter
  useEffect(() => {
    if (scanMode !== 'hardware') return;
    let buffer = '';
    let lastKeyTime = Date.now();
    const handler = (e) => {
      const now = Date.now();
      if (now - lastKeyTime > 100) buffer = '';
      lastKeyTime = now;
      if (e.key === 'Enter') {
        if (buffer.length >= 4) {
          setBarcodeInput(buffer);
          lookupProduct(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [scanMode]);

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="bento-card p-6">
        <h3 className="text-white font-bold mb-4">Scan Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { id: 'manual', icon: QrCodeIcon, label: 'Manual Entry', desc: 'Type or paste barcode / scan into input field' },
            { id: 'camera', icon: CameraIcon, label: 'Mobile Camera', desc: 'Use your phone or webcam to scan barcodes' },
            { id: 'hardware', icon: ShieldCheckIcon, label: 'Hardware Scanner', desc: 'USB/Bluetooth barcode gun — scan anywhere on screen' },
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => {
                setScanMode(mode.id);
              }}
              className={`text-left p-4 rounded-xl border transition-all ${scanMode === mode.id ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/5'}`}
            >
              <mode.icon className={`w-6 h-6 mb-2 ${scanMode === mode.id ? 'text-purple-400' : 'text-gray-400'}`} />
              <div className={`font-semibold text-sm mb-1 ${scanMode === mode.id ? 'text-white' : 'text-gray-300'}`}>{mode.label}</div>
              <div className="text-xs text-gray-500 leading-snug">{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Camera View */}
      {scanMode === 'camera' && (
        <div className="bento-card p-6">
          <h3 className="text-white font-bold mb-3">Camera Scanner</h3>
          <div id="reader" className="w-full bg-black rounded-2xl overflow-hidden mb-4 min-h-[300px]"></div>
          <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-xs text-blue-300">
            💡 For reliable scanning, connect an external barcode scanner gun in <strong>Hardware Scanner</strong> mode.
          </div>
        </div>
      )}

      {/* Hardware Scanner Status */}
      {scanMode === 'hardware' && (
        <div className="bento-card p-6 border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-green-500/10 rounded-xl">
              <ShieldCheckIcon className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Hardware Scanner Active</h3>
              <p className="text-sm text-green-300">Listening for barcode input from USB/Bluetooth scanner</p>
            </div>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400 font-bold">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Listening
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Point your barcode scanner gun at any barcode. The device will automatically send the barcode as keyboard input —
            this mode captures it regardless of which field is focused. Works with all USB HID and Bluetooth scanners.
          </p>
        </div>
      )}

      {/* Manual Input */}
      <div className="bento-card p-6">
        <h3 className="text-white font-bold mb-3">
          {scanMode === 'hardware' ? 'Last Scanned Barcode' : 'Enter Barcode Manually'}
        </h3>
        <div className="flex gap-3">
          <input
            ref={hardwareRef}
            type="text"
            value={barcodeInput}
            onChange={e => setBarcodeInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') lookupProduct(barcodeInput); }}
            placeholder={scanMode === 'hardware' ? 'Scan a barcode to populate...' : 'Enter barcode / EAN / UPC...'}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 outline-none font-mono"
          />
          <button
            onClick={() => lookupProduct(barcodeInput)}
            disabled={isLookingUp || !barcodeInput.trim()}
            className="px-5 py-3 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl font-semibold hover:bg-purple-500/20 transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {isLookingUp ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <QrCodeIcon className="w-4 h-4" />}
            Lookup
          </button>
        </div>

        {/* Result */}
        {lookupError && (
          <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-300 text-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <XCircleIcon className="w-5 h-5 shrink-0" /> {lookupError}
            </div>
            {notFoundBarcode && (
              <button
                onClick={() => navigate(`/inventory?addBarcode=${notFoundBarcode}`)}
                className="px-4 py-2 bg-purple-500 border border-purple-400 text-white rounded-lg text-xs font-bold hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" /> Add to Inventory
              </button>
            )}
          </div>
        )}
        {scannedProduct && (
          <div className="mt-4 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold text-sm">Product Found</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Name', value: scannedProduct.name },
                { label: 'Sale Price', value: `₹${scannedProduct.sale_price}` },
                { label: 'Stock', value: scannedProduct.stock },
                { label: 'HSN/SAC', value: scannedProduct.hsn_sac_code || '—' },
              ].map(f => (
                <div key={f.label}>
                  <div className="text-xs text-gray-500 uppercase mb-0.5">{f.label}</div>
                  <div className="text-white font-semibold">{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Backup Tab ───
function BackupTab() {
  const [exportResult, setExportResult] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
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
      toast.success('Backup downloaded successfully!');
    } catch { toast.error('Export failed. Please try again.'); }
    setExporting(false);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      const { data: result } = await importData(data);
      setImportResult(result);
      toast.success('Data restored successfully!');
    } catch (err) {
      setImportResult({ error: err.message });
      toast.error('Import failed. Check the backup file format.');
    }
    setImporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bento-card p-5 border-purple-500/20 bg-purple-500/5 flex items-start gap-4">
        <div className="p-3 bg-purple-500/10 rounded-xl shrink-0">
          <CloudArrowDownIcon className="w-7 h-7 text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-bold mb-1">Complete System Backup</h3>
          <p className="text-sm text-gray-400">
            Export a complete JSON backup of all your data — products, customers, invoices, payments.
            Store it securely and use it to restore your data on any Cenvora instance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export */}
        <div className="bento-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-purple-500/10 rounded-xl">
              <CloudArrowDownIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Export & Download</h3>
              <p className="text-sm text-gray-500">Full data backup as JSON</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-400 mb-5">
            {['✦ All Products & Inventory', '✦ All Customers & Balances', '✦ All Sales Invoices', '✦ Payment History'].map(item => (
              <div key={item} className="flex items-center gap-2">{item}</div>
            ))}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-3 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl font-semibold hover:bg-purple-500/20 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {exporting ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Preparing...</> : <><CloudArrowDownIcon className="w-4 h-4" /> Export Now</>}
          </button>
          {exportResult && (
            <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-sm text-emerald-400">
              ✅ {exportResult.summary?.total_products} products · {exportResult.summary?.total_customers} customers · {exportResult.summary?.total_invoices} invoices exported
            </div>
          )}
        </div>

        {/* Import */}
        <div className="bento-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-cyan-500/10 rounded-xl">
              <CloudArrowUpIcon className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Restore from Backup</h3>
              <p className="text-sm text-gray-500">Import a .json backup file</p>
            </div>
          </div>
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200">
            ⚠ Existing records will be updated by name. No data will be deleted before import.
          </div>
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1">Select Backup File (.json)</label>
            <input
              type="file"
              accept=".json"
              onChange={e => { setImportFile(e.target.files?.[0]); setImportResult(null); }}
              className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:font-medium file:cursor-pointer"
            />
          </div>
          <button
            onClick={handleImport}
            disabled={!importFile || importing}
            className="w-full py-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-xl font-semibold hover:bg-cyan-500/20 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {importing ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Importing...</> : <><CloudArrowUpIcon className="w-4 h-4" /> Restore Data</>}
          </button>
          {importResult && (
            <div className={`mt-4 p-3 rounded-xl text-sm ${importResult.error ? 'bg-red-500/5 border border-red-500/10 text-red-400' : 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-400'}`}>
              {importResult.error ? `❌ ${importResult.error}` : `✅ Restored: ${importResult.imported?.products} products, ${importResult.imported?.customers} customers`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main IntegrationsPage ───
export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState('email');

  return (
    <Layout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-fade-up">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Business Tools & Integrations</h1>
          <p className="text-gray-400 text-sm">Email notifications, barcode scanning, data backups, and more — all automated.</p>
        </div>

        {/* Tab Bar */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white shadow-sm border border-white/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.label}
              {tab.comingSoon && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-gradient-to-r from-pink-500 to-orange-400 text-white leading-none">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'email' && <EmailTab />}
        {activeTab === 'barcode' && <BarcodeTab />}
        {activeTab === 'backup' && <BackupTab />}
        {activeTab === 'whatsapp' && (
          <ComingSoonPlaceholder
            title="WhatsApp Business Integration"
            description="Send invoices, payment reminders, and order updates directly via WhatsApp Business. Requires Meta Business API approval and a verified WhatsApp Business number."
            icon={ChatBubbleLeftIcon}
          />
        )}
        {activeTab === 'apikeys' && (
          <ComingSoonPlaceholder
            title="External API Keys"
            description="Generate API keys to connect your Cenvora account with external tools — online stores, POS systems, and custom integrations. Full REST API documentation included."
            icon={KeyIcon}
          />
        )}
      </div>
    </Layout>
  );
}
