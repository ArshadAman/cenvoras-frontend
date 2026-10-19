import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function SimpleFormModal({ isOpen, onClose, title, label, initialValue = '', onSubmit, loading }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(value);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl my-8">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)]">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
            <input 
              required 
              type="text" 
              value={value} 
              onChange={(e) => setValue(e.target.value)} 
              className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]" 
              placeholder={`Enter ${label.toLowerCase()}...`}
              autoFocus
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--bg-primary)] transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary px-5 py-2 text-sm font-medium rounded-xl disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
