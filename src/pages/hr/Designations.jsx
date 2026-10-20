import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { BriefcaseIcon, PlusIcon, PencilIcon, TrashIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import SimpleFormModal from "./SimpleFormModal";

export default function Designations() {
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDesig, setSelectedDesig] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchDesignations = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getDesignations();
      setDesignations(res.data?.results || res.data);
    } catch (error) {
      toast.error("Failed to load designations");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (name) => {
    setSaving(true);
    try {
      if (selectedDesig) {
        await hrApi.updateDesignation(selectedDesig.id, { name });
        toast.success("Designation updated");
      } else {
        await hrApi.createDesignation({ name });
        toast.success("Designation created");
      }
      setIsModalOpen(false);
      fetchDesignations();
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || "Failed to save designation");
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      await hrApi.seedDefaults();
      toast.success("Default Departments and Designations loaded!");
      fetchDesignations();
    } catch (err) {
      toast.error("Failed to load defaults");
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        <section className="bento-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent-primary)] font-semibold mb-2">HR Management</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                <BriefcaseIcon className="w-9 h-9 text-[var(--accent-primary)]" />
                Designations
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">Manage employee job titles and roles.</p>
            </div>

            <button onClick={() => { setSelectedDesig(null); setIsModalOpen(true); }} className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl">
              <PlusIcon className="h-4 w-4" />
              Add Designation
            </button>
          </div>
        </section>

        <section className="bento-card p-0 overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]/50">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Designation Directory</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[var(--text-secondary)]">
              <thead className="text-xs uppercase bg-[var(--bg-primary)]/50 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="2" className="px-6 py-4 text-center">Loading...</td></tr>
                ) : designations.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <p className="text-[var(--text-muted)] text-sm">No designations found</p>
                        <button onClick={handleSeedDefaults} className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition">
                          <CloudArrowDownIcon className="w-5 h-5" />
                          Load Default Designations
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  designations.map(desig => (
                    <tr key={desig.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{desig.name}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => { setSelectedDesig(desig); setIsModalOpen(true); }} className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition p-1"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={async () => { if(window.confirm('Delete this designation?')) { try { await hrApi.deleteDesignation(desig.id); toast.success('Deleted'); fetchDesignations(); } catch(e){ toast.error(e.response?.data?.detail || 'Failed to delete'); } } }} className="text-[var(--status-danger)] hover:opacity-80 transition p-1"><TrashIcon className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <SimpleFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedDesig ? "Edit Designation" : "Add Designation"}
        label="Designation Name"
        initialValue={selectedDesig?.name || ""}
        onSubmit={handleSave}
        loading={saving}
      />
    </>
  );
}
