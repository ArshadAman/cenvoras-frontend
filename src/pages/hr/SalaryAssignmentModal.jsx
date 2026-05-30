import React, { useState, useEffect } from 'react';
import { hrApi } from '../../api/hr';
import { toast } from 'react-toastify';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function SalaryAssignmentModal({ isOpen, onClose, onSuccess, initialData }) {
  const [form, setForm] = useState({ employee: '', salary_structure: '', effective_from: '', monthly_ctc: '' });
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [structures, setStructures] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Fetch dropdown data
      Promise.all([hrApi.getEmployees(), hrApi.getSalaryStructures()])
        .then(([empRes, structRes]) => {
          setEmployees(empRes.data?.results || empRes.data);
          setStructures(structRes.data?.results || structRes.data);
        })
        .catch(() => toast.error("Failed to load required data for assignment"));

      if (initialData) {
        setForm({
          employee: initialData.employee?.id || initialData.employee || '',
          salary_structure: initialData.salary_structure?.id || initialData.salary_structure || '',
          effective_from: initialData.effective_from || '',
          monthly_ctc: initialData.monthly_ctc || ''
        });
      } else {
        setForm({
          employee: '',
          salary_structure: '',
          effective_from: new Date().toISOString().split('T')[0],
          monthly_ctc: ''
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        monthly_ctc: parseFloat(form.monthly_ctc)
      };

      if (initialData?.id) {
        await hrApi.updateSalaryAssignment(initialData.id, payload);
        toast.success('Salary Assignment updated');
      } else {
        await hrApi.createSalaryAssignment(payload);
        toast.success('Salary Assignment created');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || JSON.stringify(error.response?.data) || 'Failed to save salary assignment');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm";
  const selectClass = "w-full px-4 py-2 bg-[#111116] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm appearance-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-up">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">{initialData ? 'Edit Assignment' : 'New Assignment'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Employee *</label>
            <select required name="employee" value={form.employee} onChange={handleChange} className={selectClass} disabled={!!initialData}>
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Salary Structure *</label>
            <select required name="salary_structure" value={form.salary_structure} onChange={handleChange} className={selectClass}>
              <option value="">Select Structure</option>
              {structures.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Effective From *</label>
            <input required type="date" name="effective_from" value={form.effective_from} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Monthly CTC (₹) *</label>
            <input required type="number" step="0.01" name="monthly_ctc" value={form.monthly_ctc} onChange={handleChange} className={inputClass} placeholder="e.g. 50000" />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 disabled:opacity-50 transition">
              {saving ? 'Saving...' : 'Save Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
