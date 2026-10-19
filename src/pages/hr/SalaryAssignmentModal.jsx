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

  const inputClass = "w-full px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";
  const selectClass = "w-full px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm appearance-none cursor-pointer";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl w-full max-w-lg shadow-2xl animate-fade-up">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-default)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{initialData ? 'Edit Assignment' : 'New Assignment'}</h2>
          <button type="button" onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Employee *</label>
            <select required name="employee" value={form.employee} onChange={handleChange} className={selectClass} disabled={!!initialData}>
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Salary Structure *</label>
            <select required name="salary_structure" value={form.salary_structure} onChange={handleChange} className={selectClass}>
              <option value="">Select Structure</option>
              {structures.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Effective From *</label>
            <input required type="date" name="effective_from" value={form.effective_from} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Monthly CTC (₹) *</label>
            <input required type="number" step="0.01" name="monthly_ctc" value={form.monthly_ctc} onChange={handleChange} className={inputClass} placeholder="e.g. 50000" />
          </div>

          {/* Live Component Breakdown Preview */}
          {(() => {
            const selectedStruct = structures.find(s => String(s.id) === String(form.salary_structure));
            const ctc = parseFloat(form.monthly_ctc);
            if (!selectedStruct || !ctc || ctc <= 0) return null;

            const components = selectedStruct.components || [];
            const basicComp = components.find(c => c.is_basic);
            let basicVal = 0;
            if (basicComp) {
              basicVal = basicComp.component_type === 'fixed' 
                ? parseFloat(basicComp.value) 
                : ctc * (parseFloat(basicComp.value) / 100);
            }

            let totalEarnings = 0;
            const previewRows = components.map(c => {
              let val = 0;
              if (c.component_type === 'fixed') val = parseFloat(c.value);
              else if (c.component_type === 'pct_basic') val = basicVal * (parseFloat(c.value) / 100);
              else val = ctc * (parseFloat(c.value) / 100);
              
              if (c.type !== 'deduction') totalEarnings += val;
              return { name: c.name, type: c.type || 'earning', amount: val };
            });

            if (totalEarnings < ctc && !previewRows.some(r => r.name === 'Special Allowance')) {
              previewRows.push({ name: 'Special Allowance (Balancing)', type: 'earning', amount: ctc - totalEarnings });
            }

            return (
              <div className="p-4 rounded-xl border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 space-y-2">
                <p className="text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider">Estimated Component Breakdown</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {previewRows.map((r, i) => (
                    <div key={i} className="flex justify-between p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                      <span className={r.type === 'deduction' ? 'text-rose-500' : 'text-[var(--text-secondary)]'}>
                        {r.name} {r.type === 'deduction' ? '(-)' : ''}
                      </span>
                      <span className="font-semibold text-[var(--text-primary)]">₹{r.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-default)]">
            <button type="button" onClick={onClose} className="btn-secondary !text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary !text-sm">
              {saving ? 'Saving...' : 'Save Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
