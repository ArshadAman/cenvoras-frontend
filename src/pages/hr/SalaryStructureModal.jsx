import React, { useState, useEffect } from 'react';
import { hrApi } from '../../api/hr';
import { toast } from 'react-toastify';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function SalaryStructureModal({ isOpen, onClose, onSuccess, initialData }) {
  const [form, setForm] = useState({ name: '', description: '', components: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          name: initialData.name || '',
          description: initialData.description || '',
          components: initialData.components || []
        });
      } else {
        setForm({
          name: '',
          description: '',
          components: [
            { name: 'Basic', type: 'earning', component_type: 'pct_gross', is_basic: true, value: 40, order: 1 },
            { name: 'HRA', type: 'earning', component_type: 'pct_basic', is_basic: false, value: 50, order: 2 }
          ]
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleComponentChange = (index, field, value) => {
    const newComponents = [...form.components];
    
    if (field === 'is_basic' && value === true) {
      // Ensure only one component is basic and it must be an earning
      newComponents.forEach(c => c.is_basic = false);
      newComponents[index].type = 'earning';
    }
    
    newComponents[index] = { ...newComponents[index], [field]: value };
    setForm(prev => ({ ...prev, components: newComponents }));
  };

  const addComponent = () => {
    setForm(prev => ({
      ...prev,
      components: [
        ...prev.components,
        { name: '', type: 'earning', component_type: 'fixed', is_basic: false, value: 0, order: prev.components.length + 1 }
      ]
    }));
  };

  const removeComponent = (index) => {
    setForm(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initialData?.id) {
        await hrApi.updateSalaryStructure(initialData.id, form);
        toast.success('Salary Structure updated');
      } else {
        await hrApi.createSalaryStructure(form);
        toast.success('Salary Structure created');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || JSON.stringify(error.response?.data) || 'Failed to save salary structure');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm";
  const selectClass = "w-full px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm appearance-none cursor-pointer";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto pt-10 pb-20">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl w-full max-w-3xl shadow-2xl animate-fade-up">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-default)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{initialData ? 'Edit Salary Structure' : 'New Salary Structure'}</h2>
          <button type="button" onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Structure Name *</label>
              <input required type="text" name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="e.g. Standard Package" />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Description</label>
              <input type="text" name="description" value={form.description} onChange={handleChange} className={inputClass} placeholder="Optional description" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">Salary Components</label>
              <button type="button" onClick={addComponent} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-primary)] hover:opacity-80 transition cursor-pointer">
                <PlusIcon className="w-4 h-4" /> Add Component
              </button>
            </div>
            
            <div className="space-y-3">
              {form.components.map((comp, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-3 p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)]/40 items-start md:items-center">
                  <div className="flex-1 w-full md:w-auto">
                    <input required type="text" value={comp.name} onChange={(e) => handleComponentChange(index, 'name', e.target.value)} placeholder="Component Name (e.g. HRA)" className={inputClass} />
                  </div>
                  <div className="w-full md:w-32 shrink-0">
                    <select value={comp.type || 'earning'} onChange={(e) => handleComponentChange(index, 'type', e.target.value)} className={selectClass} disabled={comp.is_basic}>
                      <option value="earning">Earning (+)</option>
                      <option value="deduction">Deduction (-)</option>
                    </select>
                  </div>
                  <div className="w-full md:w-36 shrink-0">
                    <select required value={comp.component_type} onChange={(e) => handleComponentChange(index, 'component_type', e.target.value)} className={selectClass}>
                      <option value="fixed">Fixed Amount</option>
                      <option value="pct_basic">% of Basic</option>
                      <option value="pct_gross">% of Gross/CTC</option>
                    </select>
                  </div>
                  <div className="w-full md:w-32 shrink-0 relative">
                    <input required type="number" step="0.01" value={comp.value} onChange={(e) => handleComponentChange(index, 'value', e.target.value)} placeholder="Value" className={`${inputClass} pr-8`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs">{comp.component_type === 'fixed' ? '₹' : '%'}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 mt-2 md:mt-0">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={comp.is_basic} onChange={(e) => handleComponentChange(index, 'is_basic', e.target.checked)} className="rounded border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/20" />
                      <span className="text-xs text-[var(--text-secondary)]">Is Basic?</span>
                    </label>
                    <button type="button" onClick={() => removeComponent(index)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer" title="Remove Component">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {form.components.length === 0 && (
                <div className="text-center py-6 border border-dashed border-[var(--border-default)] rounded-xl text-[var(--text-muted)] text-sm">
                  No components added yet.
                </div>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-3">Note: Exactly one component must be designated as "Is Basic?". For percentages, value is the percent rate (e.g., 40 for 40%).</p>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-default)]">
            <button type="button" onClick={onClose} className="btn-secondary !text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary !text-sm">
              {saving ? 'Saving...' : 'Save Structure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
