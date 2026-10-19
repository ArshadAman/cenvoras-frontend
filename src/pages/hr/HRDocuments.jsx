import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import {
  FolderIcon, PlusIcon, TrashIcon, DocumentArrowDownIcon,
  XMarkIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import useEscKey from "../../hooks/useEscStack";

function DocumentUploadModal({ isOpen, onClose, onSuccess, employees }) {
  useEscKey(onClose, isOpen, 10);
  const [form, setForm] = useState({
    employee: '',
    title: '',
    document_type: 'offer_letter',
    file_url: '',
    notes: '',
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        employee: '',
        title: '',
        document_type: 'offer_letter',
        file_url: '',
        notes: '',
      });
      setFile(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !form.file_url) {
      toast.error('Upload a file or provide a document URL');
      return;
    }
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('employee', form.employee);
      payload.append('title', form.title);
      payload.append('document_type', form.document_type);
      if (form.notes) payload.append('notes', form.notes);
      if (form.file_url) payload.append('file_url', form.file_url);
      if (file) payload.append('file', file);
      await hrApi.createDocument(payload);
      toast.success('Document uploaded successfully');
      onSuccess();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.detail
        || data?.file?.[0]
        || data?.file_url?.[0]
        || (typeof data === 'string' ? data : null)
        || 'Failed to upload document';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;
  const ic = "w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";
  const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)]">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Upload Employee Document</h2>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Employee *</label>
            <select required value={form.employee} onChange={e => setForm(p => ({ ...p, employee: e.target.value }))} className={ic}>
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Document Title *</label>
            <input required type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={ic} placeholder="e.g. Signed Offer Letter 2026" />
          </div>

          <div>
            <label className={labelCls}>Document Category *</label>
            <select value={form.document_type} onChange={e => setForm(p => ({ ...p, document_type: e.target.value }))} className={ic}>
              <option value="offer_letter">Offer Letter</option>
              <option value="appointment_letter">Appointment Letter</option>
              <option value="id_proof">ID Proof (Aadhaar/Passport)</option>
              <option value="tax_form">Tax Declaration Form</option>
              <option value="appraisal">Appraisal Letter</option>
              <option value="resignation">Resignation Letter</option>
              <option value="other">Other Document</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Upload File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-[var(--text-secondary)] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[var(--accent-primary)]/15 file:text-[var(--accent-primary)] hover:file:bg-[var(--accent-primary)]/25 transition cursor-pointer"
            />
            {file && <p className="mt-1 text-xs text-[var(--text-muted)] truncate">{file.name}</p>}
          </div>

          <div>
            <label className={labelCls}>Or Document Link / URL</label>
            <input type="url" value={form.file_url} onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))} className={ic} placeholder="https://..." />
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className={ic + ' resize-none'} />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
              {saving ? 'Uploading...' : 'Save Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HRDocuments() {
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const [docRes, empRes] = await Promise.all([
        hrApi.getDocuments(),
        hrApi.getEmployees({ limit: 200 })
      ]);
      setDocuments(docRes.data?.results || docRes.data || []);
      setEmployees(empRes.data?.results || empRes.data || []);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await hrApi.deleteDocument(id);
      toast.success('Document deleted');
      fetchDocs();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 md:p-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-2 font-semibold">Compliance & Records</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                <FolderIcon className="w-9 h-9 text-[var(--accent-primary)]" />
                Employee Documents
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">
                Centralized digital repository for employee offer letters, contracts, KYC proofs, and tax declarations.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary"
            >
              <PlusIcon className="h-4 w-4" />
              Upload Document
            </button>
          </div>
        </section>

        {/* Documents Table */}
        <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]/40">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Document Vault</h2>
            <button onClick={fetchDocs} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs inline-flex items-center gap-1 transition">
              <ArrowPathIcon className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[var(--text-secondary)]">
              <thead className="text-xs uppercase bg-[var(--bg-primary)]/70 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Uploaded At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-[var(--text-muted)]">Loading vault...</td></tr>
                ) : documents.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-[var(--text-muted)]">No documents uploaded yet.</td></tr>
                ) : (
                  documents.map(doc => (
                    <tr key={doc.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                        <p>{doc.title}</p>
                        {doc.notes && <p className="text-xs text-[var(--text-muted)]">{doc.notes}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[var(--text-primary)] font-medium">{doc.employee_name}</p>
                        <p className="text-xs text-[var(--accent-primary)] font-mono">{doc.employee_code}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 uppercase">
                          {doc.document_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)] text-xs">{(() => {
                        try {
                          return new Intl.DateTimeFormat('en-GB', {
                            timeZone: 'Asia/Kolkata',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          }).format(new Date(doc.created_at));
                        } catch {
                          return new Date(doc.created_at).toLocaleDateString('en-IN');
                        }
                      })()}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {(doc.file_url || doc.file) && (
                          <a
                            href={doc.file_url || doc.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/25 border border-[var(--accent-primary)]/30 transition inline-flex items-center"
                            title="Download / View"
                          >
                            <DocumentArrowDownIcon className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 rounded-lg text-[var(--status-danger)] hover:bg-[var(--status-danger)]/15 border border-transparent hover:border-[var(--status-danger)]/30 transition inline-flex items-center"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <DocumentUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDocs}
        employees={employees}
      />
    </>
  );
}
