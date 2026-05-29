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
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">HR Management</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <BriefcaseIcon className="w-9 h-9 text-indigo-300" />
                Designations
              </h1>
              <p className="text-white/65 text-sm mt-2">Manage employee job titles and roles.</p>
            </div>

            <button onClick={() => { setSelectedDesig(null); setIsModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300">
              <PlusIcon className="h-4 w-4" />
              Add Designation
            </button>
          </div>
        </section>

        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Designation Directory</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
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
                        <p className="text-gray-400">No designations found</p>
                        <button onClick={handleSeedDefaults} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition">
                          <CloudArrowDownIcon className="w-5 h-5" />
                          Load Default Designations
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  designations.map(desig => (
                    <tr key={desig.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4">{desig.name}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => { setSelectedDesig(desig); setIsModalOpen(true); }} className="text-indigo-400 hover:text-indigo-300"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={async () => { if(window.confirm('Delete this designation?')) { try { await hrApi.deleteDesignation(desig.id); toast.success('Deleted'); fetchDesignations(); } catch(e){ toast.error(e.response?.data?.detail || 'Failed to delete'); } } }} className="text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
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
