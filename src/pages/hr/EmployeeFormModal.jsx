import React, { useState, useEffect } from 'react';
import { hrApi } from '../../api/hr';
import { toast } from 'react-toastify';
import { XMarkIcon } from '@heroicons/react/24/outline';

const EMPTY_FORM = {
  full_name: '',
  personal_email: '',
  personal_phone: '',
  date_of_birth: '',
  date_of_joining: '',
  gender: 'M',
  employment_type: 'full_time',
  work_state: '',
  status: 'active',
  department_id: '',
  designation_id: '',
};

export default function EmployeeFormModal({ isOpen, onClose, employee, onSuccess }) {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (isOpen) {
      fetchDropdowns();
      if (employee) {
        setFormData({
          full_name: employee.full_name || '',
          personal_email: employee.personal_email || '',
          personal_phone: employee.personal_phone || '',
          date_of_birth: employee.date_of_birth || '',
          date_of_joining: employee.date_of_joining || '',
          gender: employee.gender || 'M',
          employment_type: employee.employment_type || 'full_time',
          work_state: employee.work_state || '',
          status: employee.status || 'active',
          department_id: employee.department || '',
          designation_id: employee.designation || '',
        });
      } else {
        setFormData(EMPTY_FORM);
      }
    }
  }, [isOpen, employee]);

  const fetchDropdowns = async () => {
    try {
      const [deptRes, desigRes] = await Promise.all([
        hrApi.getDepartments(),
        hrApi.getDesignations(),
      ]);
      setDepartments(deptRes.data?.results || deptRes.data || []);
      setDesignations(desigRes.data?.results || desigRes.data || []);
    } catch (err) {
      toast.error('Failed to load departments or designations');
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name,
        date_of_birth: formData.date_of_birth,
        date_of_joining: formData.date_of_joining,
        gender: formData.gender,
        employment_type: formData.employment_type,
        work_state: formData.work_state,
        status: formData.status,
        department: formData.department_id,
        designation: formData.designation_id,
      };

      // optional fields — only include if not empty
      if (formData.personal_email) payload.personal_email = formData.personal_email;
      if (formData.personal_phone) payload.personal_phone = formData.personal_phone;

      if (employee) {
        await hrApi.updateEmployee(employee.id, payload);
        toast.success('Employee updated successfully');
      } else {
        await hrApi.createEmployee(payload);
        toast.success('Employee added successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        // Show each field error clearly
        const messages = Object.entries(errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`)
          .join('\n');
        toast.error(messages);
      } else {
        toast.error('Failed to save employee');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = 'w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500';
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl my-4">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Full Name */}
          <div>
            <label className={labelCls}>Full Name *</label>
            <input required type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={inputCls} placeholder="e.g. John Doe" />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Personal Email</label>
              <input type="email" name="personal_email" value={formData.personal_email} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input type="text" name="personal_phone" value={formData.personal_phone} onChange={handleChange} className={inputCls} />
            </div>
          </div>

          {/* DoB & DoJ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date of Birth *</label>
              <input required type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Date of Joining *</label>
              <input required type="date" name="date_of_joining" value={formData.date_of_joining} onChange={handleChange} className={inputCls} />
            </div>
          </div>

          {/* Gender & Employment Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Gender *</label>
              <select required name="gender" value={formData.gender} onChange={handleChange} className={inputCls}>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Employment Type *</label>
              <select required name="employment_type" value={formData.employment_type} onChange={handleChange} className={inputCls}>
                <option value="full_time">Full-Time</option>
                <option value="part_time">Part-Time</option>
                <option value="contract">Contract</option>
              </select>
            </div>
          </div>

          {/* Department & Designation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Department *</label>
              <select required name="department_id" value={formData.department_id} onChange={handleChange} className={inputCls}>
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Designation *</label>
              <select required name="designation_id" value={formData.designation_id} onChange={handleChange} className={inputCls}>
                <option value="">Select Designation</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Work State & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Work State *</label>
              <input required type="text" name="work_state" value={formData.work_state} onChange={handleChange} className={inputCls} placeholder="e.g. Maharashtra" />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className={inputCls}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 transition disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
