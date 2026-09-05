import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import {
  FolderIcon, PlusIcon, TrashIcon, DocumentArrowDownIcon,
  XMarkIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

function DocumentUploadModal({ isOpen, onClose, onSuccess, employees }) {
  const [form, setForm] = useState({
    employee: '',
    title: '',
    document_type: 'offer_letter',
    file_url: '',
    notes: '',
  });
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
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await hrApi.createDocument(form);
      toast.success('Document uploaded successfully');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload document');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;
  const ic = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Upload Employee Document</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Employee *</label>
            <select required value={form.employee} onChange={e => setForm(p => ({ ...p, employee: e.target.value }))} className={ic}>
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Document Title *</label>
            <input required type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={ic} placeholder="e.g. Signed Offer Letter 2026" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Document Category *</label>
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
            <label className="block text-sm text-gray-300 mb-1">Document Link / URL</label>
            <input type="url" value={form.file_url} onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))} className={ic} placeholder="https://..." />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className={ic + ' resize-none'} />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-400 bg-white/5 rounded-xl hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 disabled:opacity-50">
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
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/40 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">Compliance & Records</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <FolderIcon className="w-9 h-9 text-indigo-300" />
                Employee Documents
              </h1>
              <p className="text-white/65 text-sm mt-2">
                Centralized digital repository for employee offer letters, contracts, KYC proofs, and tax declarations.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300 shadow-lg shadow-indigo-500/20"
            >
              <PlusIcon className="h-4 w-4" />
              Upload Document
            </button>
          </div>
        </section>

        {/* Documents Table */}
        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Document Vault</h2>
            <button onClick={fetchDocs} className="text-gray-400 hover:text-white text-xs inline-flex items-center gap-1">
              <ArrowPathIcon className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
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
                  <tr><td colSpan="5" className="px-6 py-8 text-center">Loading vault...</td></tr>
                ) : documents.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">No documents uploaded yet.</td></tr>
                ) : (
                  documents.map(doc => (
                    <tr key={doc.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">
                        <p>{doc.title}</p>
                        {doc.notes && <p className="text-xs text-gray-400">{doc.notes}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p>{doc.employee_name}</p>
                        <p className="text-xs text-indigo-300">{doc.employee_code}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white uppercase">
                          {doc.document_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{new Date(doc.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {(doc.file_url || doc.file) && (
                          <a
                            href={doc.file_url || doc.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition inline-flex items-center"
                            title="Download / View"
                          >
                            <DocumentArrowDownIcon className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition inline-flex items-center"
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
