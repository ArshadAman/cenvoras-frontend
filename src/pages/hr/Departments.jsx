import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { BuildingOfficeIcon, PlusIcon, PencilIcon, TrashIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import SimpleFormModal from "./SimpleFormModal";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getDepartments();
      setDepartments(res.data?.results || res.data);
    } catch (error) {
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (name) => {
    setSaving(true);
    try {
      if (selectedDept) {
        await hrApi.updateDepartment(selectedDept.id, { name });
        toast.success("Department updated");
      } else {
        await hrApi.createDepartment({ name });
        toast.success("Department created");
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || "Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      await hrApi.seedDefaults();
      toast.success("Default Departments and Designations loaded!");
      fetchDepartments();
    } catch (err) {
      toast.error("Failed to load defaults");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">HR Management</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <BuildingOfficeIcon className="w-9 h-9 text-indigo-300" />
                Departments
              </h1>
              <p className="text-white/65 text-sm mt-2">Manage organizational departments.</p>
            </div>

            <button onClick={() => { setSelectedDept(null); setIsModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300">
              <PlusIcon className="h-4 w-4" />
              Add Department
            </button>
          </div>
        </section>

        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Department Directory</h2>
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
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <p className="text-gray-400">No departments found</p>
                        <button onClick={handleSeedDefaults} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition">
                          <CloudArrowDownIcon className="w-5 h-5" />
                          Load Default Departments
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  departments.map(dept => (
                    <tr key={dept.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4">{dept.name}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => { setSelectedDept(dept); setIsModalOpen(true); }} className="text-indigo-400 hover:text-indigo-300"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={async () => { if(window.confirm('Delete this department?')) { try { await hrApi.deleteDepartment(dept.id); toast.success('Deleted'); fetchDepartments(); } catch(e){ toast.error(e.response?.data?.detail || 'Failed to delete'); } } }} className="text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
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
        title={selectedDept ? "Edit Department" : "Add Department"}
        label="Department Name"
        initialValue={selectedDept?.name || ""}
        onSubmit={handleSave}
        loading={saving}
      />
    </>
  );
}
