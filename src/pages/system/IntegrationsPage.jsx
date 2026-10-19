import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
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
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

// ─── Back to — not needed here, this is under System group in sidebar ───

const TABS = [
  { id: 'email', label: 'Email Automation', icon: EnvelopeIcon },
  { id: 'backup', label: 'Data Backup', icon: CloudArrowDownIcon },
  { id: 'whatsapp', label: 'WhatsApp Automation', icon: ChatBubbleLeftIcon, badge: 'On demand', badgeClass: 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30' },
  { id: 'apikeys', label: 'API Keys', icon: KeyIcon, comingSoon: true },
];

// ─── ComingSoon Placeholder ───
function ComingSoonPlaceholder({ title, description, icon: Icon, badge = 'Soon', badgeClass = 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30', note = "We'll notify you when this is available" }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-10 flex flex-col items-center justify-center text-center max-w-lg mx-auto shadow-sm">
      <div className="relative mb-6">
        <div className="p-5 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-subtle)]">
          <Icon className="w-12 h-12 text-[var(--text-muted)]" />
        </div>
        <span className={`absolute -top-2 -right-2 px-2.5 py-1 ${badgeClass} text-[10px] font-extrabold uppercase rounded-full tracking-wider shadow-md`}>
          {badge}
        </span>
      </div>
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">{title}</h2>
      <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">{description}</p>
      <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] text-sm">
        <SparklesIcon className="w-4 h-4 text-[var(--accent-primary)]" />
        {note}
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
  const [lastReminderDispatch, setLastReminderDispatch] = useState(null);

  const filteredCustomers = customersWithEmail.filter(c =>
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const selectedCustomer = customersWithEmail.find(c => c.email === form.recipient);

  const remindersMutation = useMutation({
    mutationFn: sendPaymentReminders,
    onSuccess: (res) => {
      const payload = res?.data || {};
      const queued = Number(payload.queued || 0);
      const stagger = Number(payload.stagger_seconds || 0);
      const dispatchWindow = Number(payload.dispatch_window_seconds || 0);
      setLastReminderDispatch({ queued, stagger, dispatchWindow });
      if (queued > 0 && stagger > 0) {
        toast.success(`Queued ${queued} reminder(s) with ${stagger}s stagger (${dispatchWindow}s total dispatch window).`);
      } else {
        toast.success(payload.message || 'Payment reminders queued!');
      }
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
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-[var(--status-warning)]/10 rounded-xl">
            <BellAlertIcon className="w-5 h-5 text-[var(--status-warning)]" />
          </div>
          <div>
            <h3 className="text-[var(--text-primary)] font-bold">Automated Payment Reminders</h3>
            <p className="text-sm text-[var(--text-secondary)]">Send outstanding balance reminders to all customers with unpaid dues</p>
          </div>
        </div>
        <div className="bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30 rounded-xl p-4 mb-4 text-sm text-[var(--status-warning)]">
          <ExclamationTriangleIcon className="w-4 h-4 inline mr-2 text-[var(--status-warning)]" />
          This will email <strong>every customer with an outstanding balance</strong>.
        </div>
        <button
          onClick={() => remindersMutation.mutate()}
          disabled={remindersMutation.isPending}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          {remindersMutation.isPending ? (
            <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Sending...</>
          ) : (
            <><BellAlertIcon className="w-4 h-4" /> Send Payment Reminders Now</>
          )}
        </button>
        {lastReminderDispatch && (
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Last queue: {lastReminderDispatch.queued} reminder(s), {lastReminderDispatch.stagger}s stagger, {lastReminderDispatch.dispatchWindow}s dispatch window.
          </p>
        )}
      </div>

      {/* Manual Email Send — Customer-Only */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
        <h3 className="text-[var(--text-primary)] font-bold mb-1">Send Email to Customer</h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">You can only send emails to registered customers with an email address on file.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-1.5">Customer</label>
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
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-primary)]"
            />
            {showDropdown && !form.recipient && (
              <div className="absolute z-50 top-full mt-1 w-full max-h-48 overflow-y-auto bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-xl">
                {filteredCustomers.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-[var(--text-muted)]">
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
                      className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] last:border-0 transition-colors"
                    >
                      <div className="text-sm text-[var(--text-primary)] font-medium">{c.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{c.email}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-1.5">Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              placeholder="Invoice / Payment Reminder..."
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-1.5">Message</label>
          <textarea
            value={form.body}
            onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
            rows={4}
            placeholder="Type your message here..."
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-primary)] resize-none"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={sending || !form.recipient}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          {sending ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Sending...</> : <><EnvelopeIcon className="w-4 h-4" /> Send Email</>}
        </button>
      </div>

      {/* Notification History */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-0 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]">
          <h3 className="text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider">Email History</h3>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['notification-logs'] })}
            className="p-1.5 hover:bg-[var(--bg-surface)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Refresh logs"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
        {logsLoading ? (
          <div className="p-8 text-center text-[var(--text-muted)]">Loading...</div>
        ) : logList.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">
            <EnvelopeIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
            No emails sent yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] text-xs uppercase font-semibold">
                  <th className="px-5 py-3 text-left">Recipient</th>
                  <th className="px-5 py-3 text-left">Subject</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {logList.filter(l => l.channel === 'email').map(log => (
                  <tr key={log.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-primary)]/50 transition-colors">
                    <td className="px-5 py-3 text-[var(--text-primary)] font-medium">{log.recipient}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{log.subject || '—'}</td>
                    <td className="px-5 py-3">
                      {log.status === 'sent' ? (
                        <span className="flex items-center gap-1 text-[var(--status-success)] text-xs font-semibold">
                          <CheckCircleIcon className="w-4 h-4" /> Sent
                        </span>
                      ) : log.status === 'queued' ? (
                        <span className="flex items-center gap-1 text-[var(--status-info)] text-xs font-semibold">
                          <ArrowPathIcon className="w-4 h-4 animate-spin" /> Queued
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[var(--status-danger)] text-xs font-semibold">
                          <XCircleIcon className="w-4 h-4" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)] text-xs">{new Date(log.sent_at).toLocaleDateString('en-IN')}</td>
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
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
        <h3 className="text-[var(--text-primary)] font-bold mb-4">Scan Mode</h3>
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
              className={`text-left p-4 rounded-xl border transition-all ${
                scanMode === mode.id 
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--text-primary)]' 
                  : 'border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)]'
              }`}
            >
              <mode.icon className={`w-6 h-6 mb-2 ${scanMode === mode.id ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`} />
              <div className={`font-semibold text-sm mb-1 ${scanMode === mode.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{mode.label}</div>
              <div className="text-xs text-[var(--text-muted)] leading-snug">{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Camera View */}
      {scanMode === 'camera' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
          <h3 className="text-[var(--text-primary)] font-bold mb-3">Camera Scanner</h3>
          <div id="reader" className="w-full bg-black rounded-2xl overflow-hidden mb-4 min-h-[300px]"></div>
          <div className="mt-4 p-3 bg-[var(--status-info)]/10 border border-[var(--status-info)]/30 rounded-xl text-xs text-[var(--status-info)]">
            💡 For reliable scanning, connect an external barcode scanner gun in <strong>Hardware Scanner</strong> mode.
          </div>
        </div>
      )}

      {/* Hardware Scanner Status */}
      {scanMode === 'hardware' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--status-success)]/30 bg-[var(--status-success)]/5 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-[var(--status-success)]/10 rounded-xl">
              <ShieldCheckIcon className="w-6 h-6 text-[var(--status-success)]" />
            </div>
            <div>
              <h3 className="text-[var(--text-primary)] font-bold">Hardware Scanner Active</h3>
              <p className="text-sm text-[var(--status-success)]">Listening for barcode input from USB/Bluetooth scanner</p>
            </div>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-[var(--status-success)] font-bold">
              <span className="w-2 h-2 bg-[var(--status-success)] rounded-full animate-pulse" />
              Listening
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Point your barcode scanner gun at any barcode. The device will automatically send the barcode as keyboard input —
            this mode captures it regardless of which field is focused. Works with all USB HID and Bluetooth scanners.
          </p>
        </div>
      )}

      {/* Manual Input */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
        <h3 className="text-[var(--text-primary)] font-bold mb-3">
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
            className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none font-mono"
          />
          <button
            onClick={() => lookupProduct(barcodeInput)}
            disabled={isLookingUp || !barcodeInput.trim()}
            className="btn-primary px-5 py-3 flex items-center gap-2 text-sm disabled:opacity-40"
          >
            {isLookingUp ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <QrCodeIcon className="w-4 h-4" />}
            Lookup
          </button>
        </div>

        {/* Result */}
        {lookupError && (
          <div className="mt-4 p-4 bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30 rounded-xl text-[var(--status-danger)] text-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <XCircleIcon className="w-5 h-5 shrink-0" /> {lookupError}
            </div>
            {notFoundBarcode && (
              <button
                onClick={() => navigate(`/inventory?addBarcode=${notFoundBarcode}`)}
                className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" /> Add to Inventory
              </button>
            )}
          </div>
        )}
        {scannedProduct && (
          <div className="mt-4 p-5 bg-[var(--status-success)]/5 border border-[var(--status-success)]/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleIcon className="w-5 h-5 text-[var(--status-success)]" />
              <span className="text-[var(--status-success)] font-semibold text-sm">Product Found</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Name', value: scannedProduct.name },
                { label: 'Sale Price', value: `${getCurrencySymbol()}${scannedProduct.sale_price}` },
                { label: 'Stock', value: scannedProduct.stock },
                { label: 'HSN/SAC', value: scannedProduct.hsn_sac_code || '—' },
              ].map(f => (
                <div key={f.label}>
                  <div className="text-xs text-[var(--text-muted)] uppercase mb-0.5">{f.label}</div>
                  <div className="text-[var(--text-primary)] font-semibold">{f.value}</div>
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
  const [backupFormat, setBackupFormat] = useState('json');
  const [exportResult, setExportResult] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await exportData(backupFormat);
      const isCsv = backupFormat === 'csv';
      let blob;
      if (isCsv) {
        blob = data;
        setExportResult({ summary: null, format: 'csv' });
      } else {
        setExportResult(data);
        blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cenvora-backup-${new Date().toLocaleDateString('sv-SE')}.${isCsv ? 'zip' : 'json'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${backupFormat.toUpperCase()} backup downloaded successfully!`);
    } catch { toast.error('Export failed. Please try again.'); }
    setExporting(false);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      let result;
      if (backupFormat === 'csv') {
        const response = await importData(importFile, 'csv');
        result = response.data;
      } else {
        const text = await importFile.text();
        const data = JSON.parse(text);
        const response = await importData(data, 'json');
        result = response.data;
      }
      setImportResult(result);
      toast.success('Data restored successfully!');
    } catch (err) {
      setImportResult({ error: err.message });
      toast.error(`Import failed. Check the ${backupFormat.toUpperCase()} backup file format.`);
    }
    setImporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 flex items-start gap-4 shadow-sm">
        <div className="p-3 bg-[var(--accent-primary)]/10 rounded-xl shrink-0">
          <CloudArrowDownIcon className="w-7 h-7 text-[var(--accent-primary)]" />
        </div>
        <div>
          <h3 className="text-[var(--text-primary)] font-bold mb-1">Complete System Backup</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Export a complete backup of all your data in JSON or CSV (separate module files in a ZIP).
            Store it securely and use it to restore your data on any Cenvora instance.
          </p>
          <div className="mt-3 inline-flex bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-1 gap-1">
            {['json', 'csv'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => {
                  setBackupFormat(fmt);
                  setImportFile(null);
                  setImportResult(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors ${
                  backupFormat === fmt ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-[var(--accent-primary)]/10 rounded-xl">
              <CloudArrowDownIcon className="w-6 h-6 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h3 className="text-[var(--text-primary)] font-bold">Export & Download</h3>
              <p className="text-sm text-[var(--text-muted)]">Full data backup as {backupFormat.toUpperCase()}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-[var(--text-secondary)] mb-5">
            {['✦ All Products & Inventory', '✦ All Customers & Balances', '✦ All Sales Invoices', '✦ Payment History'].map(item => (
              <div key={item} className="flex items-center gap-2">{item}</div>
            ))}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-40"
          >
            {exporting ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Preparing...</> : <><CloudArrowDownIcon className="w-4 h-4" /> Export Now</>}
          </button>
          {exportResult && (
            <div className="mt-4 p-3 bg-[var(--status-success)]/10 border border-[var(--status-success)]/30 rounded-xl text-sm text-[var(--status-success)]">
              {backupFormat === 'csv'
                ? '✅ products.csv, customers.csv, invoices.csv, payments.csv exported in ZIP'
                : `✅ ${exportResult.summary?.total_products} products · ${exportResult.summary?.total_customers} customers · ${exportResult.summary?.total_invoices} invoices exported`}
            </div>
          )}
        </div>

        {/* Import */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-[var(--status-info)]/10 rounded-xl">
              <CloudArrowUpIcon className="w-6 h-6 text-[var(--status-info)]" />
            </div>
            <div>
              <h3 className="text-[var(--text-primary)] font-bold">Restore from Backup</h3>
              <p className="text-sm text-[var(--text-muted)]">Import a {backupFormat === 'csv' ? '.zip' : '.json'} backup file</p>
            </div>
          </div>
          <div className="mb-4 p-3 bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30 rounded-xl text-xs text-[var(--status-warning)]">
            ⚠ Existing records will be updated by name. No data will be deleted before import.
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Select Backup File ({backupFormat === 'csv' ? '.zip' : '.json'})
            </label>
            <input
              type="file"
              accept={backupFormat === 'csv' ? '.zip' : '.json'}
              onChange={e => { setImportFile(e.target.files?.[0]); setImportResult(null); }}
              className="w-full text-sm text-[var(--text-secondary)] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[var(--bg-primary)] file:text-[var(--text-primary)] file:font-semibold file:cursor-pointer"
            />
          </div>
          <button
            onClick={handleImport}
            disabled={!importFile || importing}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-40"
          >
            {importing ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Importing...</> : <><CloudArrowUpIcon className="w-4 h-4" /> Restore Data</>}
          </button>
          {importResult && (
            <div className={`mt-4 p-3 rounded-xl text-sm ${importResult.error ? 'bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30 text-[var(--status-danger)]' : 'bg-[var(--status-success)]/10 border border-[var(--status-success)]/30 text-[var(--status-success)]'}`}>
              {importResult.error
                ? `❌ ${importResult.error}`
                : `✅ Restored: ${importResult.imported?.products || 0} products, ${importResult.imported?.customers || 0} customers, ${importResult.imported?.invoices || 0} invoices, ${importResult.imported?.payments || 0} payments`}
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
  const activeTabConfig = TABS.find((tab) => tab.id === activeTab);

  return (
    <>
      <div className="relative p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fade-up">
        <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent-primary)] mb-2 font-bold">System Hub</p>
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2">Business Tools</h1>
              <p className="text-[var(--text-secondary)] text-sm md:text-base max-w-2xl">Centralized automation for communication, backup, and platform operations.</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)]">
              <span className="text-[var(--text-secondary)]">Active Tool:</span>{' '}
              <span className="font-semibold text-[var(--accent-primary)]">{activeTabConfig?.label}</span>
            </div>
          </div>
        </section>

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-sm space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full rounded-2xl px-4 py-3.5 text-left transition-all border flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold shadow-sm'
                        : 'bg-transparent border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]/50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`p-2 rounded-xl ${isActive ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-sm font-medium">{tab.label}</span>
                    </span>
                    {tab.badge ? (
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${tab.badgeClass || 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30'} leading-none`}>
                        {tab.badge}
                      </span>
                    ) : tab.comingSoon ? (
                      <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30 leading-none">
                        Soon
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="lg:col-span-9">
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 md:p-6 shadow-sm">
              {/* Tab Content */}
              {activeTab === 'email' && <EmailTab />}
              {activeTab === 'backup' && <BackupTab />}
              {activeTab === 'whatsapp' && (
                <ComingSoonPlaceholder
                  title="WhatsApp Automation"
                  description="Send invoices, payment reminders, order updates, and low-stock alerts automatically to customers via the official WhatsApp Business Cloud API. Dedicated business number provisioning and custom templates are available on demand."
                  icon={ChatBubbleLeftIcon}
                  badge="On demand"
                  badgeClass="bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30"
                  note="Available on demand — contact support to activate for your business"
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
          </section>
        </div>
      </div>
    </>
  );
}
