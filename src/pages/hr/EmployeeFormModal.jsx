import React, { useState, useEffect } from 'react';
import { hrApi } from '../../api/hr';
import { getWarehouses } from '../../api/inventory';
import { toast } from 'react-toastify';
import { XMarkIcon } from '@heroicons/react/24/outline';

const EMPTY_FORM = {
  full_name: '',
  personal_email: '',
  personal_phone: '',
  father_mother_name: '',
  address: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  date_of_birth: '',
  date_of_joining: '',
  gender: 'M',
  employment_type: 'full_time',
  work_state: '',
  status: 'active',
  department_id: '',
  designation_id: '',
  branch_id: '',
  reporting_manager_id: '',
  pan_number: '',
  uan_number: '',
  pf_number: '',
  esi_number: '',
  bank_name: '',
  bank_account_number: '',
  bank_ifsc: '',
  account_holder_name: '',
};

export default function EmployeeFormModal({ isOpen, onClose, employee, onSuccess }) {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState('personal');
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
          father_mother_name: employee.father_mother_name || '',
          address: employee.address || '',
          emergency_contact_name: employee.emergency_contact_name || '',
          emergency_contact_phone: employee.emergency_contact_phone || '',
          date_of_birth: employee.date_of_birth || '',
          date_of_joining: employee.date_of_joining || '',
          gender: employee.gender || 'M',
          employment_type: employee.employment_type || 'full_time',
          work_state: employee.work_state || '',
          status: employee.status || 'active',
          department_id: employee.department || '',
          designation_id: employee.designation || '',
          branch_id: employee.branch || '',
          reporting_manager_id: employee.reporting_manager || '',
          pan_number: employee.pan_number || '',
          uan_number: employee.uan_number || '',
          pf_number: employee.pf_number || '',
          esi_number: employee.esi_number || '',
          bank_name: employee.bank_name || '',
          bank_account_number: employee.bank_account_number || '',
          bank_ifsc: employee.bank_ifsc || '',
          account_holder_name: employee.account_holder_name || '',
        });
      } else {
        setFormData(EMPTY_FORM);
      }
    }
  }, [isOpen, employee]);

  const fetchDropdowns = async () => {
    try {
      const [deptRes, desigRes, empRes] = await Promise.all([
        hrApi.getDepartments(),
        hrApi.getDesignations(),
        hrApi.getEmployees({ limit: 100 }),
      ]);
      setDepartments(deptRes.data?.results || deptRes.data || []);
      setDesignations(desigRes.data?.results || desigRes.data || []);
      setAllEmployees(empRes.data?.results || empRes.data || []);

      try {
        const whRes = await getWarehouses();
        setBranches(whRes?.results || whRes || []);
      } catch (e) {
        console.warn('Could not fetch warehouses for branch selection', e);
      }
    } catch (err) {
      toast.error('Failed to load form options');
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
        department: formData.department_id || null,
        designation: formData.designation_id || null,
        branch: formData.branch_id || null,
        reporting_manager: formData.reporting_manager_id || null,
        father_mother_name: formData.father_mother_name,
        address: formData.address,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        pan_number: formData.pan_number ? formData.pan_number.toUpperCase() : '',
        uan_number: formData.uan_number,
        pf_number: formData.pf_number,
        esi_number: formData.esi_number,
        bank_name: formData.bank_name,
        bank_account_number: formData.bank_account_number,
        bank_ifsc: formData.bank_ifsc ? formData.bank_ifsc.toUpperCase() : '',
        account_holder_name: formData.account_holder_name,
      };

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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl my-8">
        <div className="flex justify-between items-center p-5 border-b border-white/10 sticky top-0 bg-[#111116] z-10 rounded-t-2xl">
          <h2 className="text-xl font-semibold text-white">
            {employee ? `Edit Employee (${employee.employee_code})` : 'Add New Employee'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/10 bg-white/[0.02] px-5 pt-3 gap-2">
          {[
            { id: 'personal', label: 'Personal & Family' },
            { id: 'employment', label: 'Employment & Branch' },
            { id: 'statutory', label: 'Statutory (PF/ESI/PAN)' },
            { id: 'bank', label: 'Bank Details' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-indigo-400 text-indigo-300'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* TAB 1: PERSONAL */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input required type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={inputCls} placeholder="e.g. John Doe" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Personal Email</label>
                  <input type="email" name="personal_email" value={formData.personal_email} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Personal Phone</label>
                  <input type="text" name="personal_phone" value={formData.personal_phone} onChange={handleChange} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Father's / Mother's Name</label>
                  <input type="text" name="father_mother_name" value={formData.father_mother_name} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Date of Birth *</label>
                  <input required type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Residential Address</label>
                <textarea rows={2} name="address" value={formData.address} onChange={handleChange} className={inputCls + ' resize-none'} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Emergency Contact Name</label>
                  <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Emergency Contact Phone</label>
                  <input type="text" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMPLOYMENT */}
          {activeTab === 'employment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Date of Joining *</label>
                  <input required type="date" name="date_of_joining" value={formData.date_of_joining} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Gender *</label>
                  <select required name="gender" value={formData.gender} onChange={handleChange} className={inputCls}>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Employment Type *</label>
                  <select required name="employment_type" value={formData.employment_type} onChange={handleChange} className={inputCls}>
                    <option value="full_time">Full-Time</option>
                    <option value="part_time">Part-Time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className={inputCls}>
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="resigned">Resigned</option>
                    <option value="terminated">Terminated</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Department</label>
                  <select name="department_id" value={formData.department_id} onChange={handleChange} className={inputCls}>
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Designation</label>
                  <select name="designation_id" value={formData.designation_id} onChange={handleChange} className={inputCls}>
                    <option value="">Select Designation</option>
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Branch / Warehouse</label>
                  <select name="branch_id" value={formData.branch_id} onChange={handleChange} className={inputCls}>
                    <option value="">Head Office (Default)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Reporting Manager</label>
                  <select name="reporting_manager_id" value={formData.reporting_manager_id} onChange={handleChange} className={inputCls}>
                    <option value="">None (Top Level)</option>
                    {allEmployees
                      .filter(e => !employee || e.id !== employee.id)
                      .map((e) => (
                        <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Work State *</label>
                <input required type="text" name="work_state" value={formData.work_state} onChange={handleChange} className={inputCls} placeholder="e.g. Maharashtra" />
              </div>
            </div>
          )}

          {/* TAB 3: STATUTORY */}
          {activeTab === 'statutory' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>PAN Number</label>
                  <input type="text" name="pan_number" value={formData.pan_number} onChange={handleChange} className={inputCls} placeholder="ABCDE1234F" maxLength={10} />
                </div>
                <div>
                  <label className={labelCls}>UAN (Universal Account No.)</label>
                  <input type="text" name="uan_number" value={formData.uan_number} onChange={handleChange} className={inputCls} placeholder="12 digits" maxLength={12} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>PF Account Number</label>
                  <input type="text" name="pf_number" value={formData.pf_number} onChange={handleChange} className={inputCls} placeholder="e.g. MH/BAN/12345/678" />
                </div>
                <div>
                  <label className={labelCls}>ESI IP Number</label>
                  <input type="text" name="esi_number" value={formData.esi_number} onChange={handleChange} className={inputCls} placeholder="17 digits" maxLength={17} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BANK DETAILS */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Account Holder Name</label>
                <input type="text" name="account_holder_name" value={formData.account_holder_name} onChange={handleChange} className={inputCls} placeholder="As per bank records" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Bank Name</label>
                  <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} className={inputCls} placeholder="e.g. HDFC Bank" />
                </div>
                <div>
                  <label className={labelCls}>Bank Account Number</label>
                  <input type="text" name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} className={inputCls} placeholder="Account Number" />
                </div>
              </div>

              <div>
                <label className={labelCls}>IFSC Code</label>
                <input type="text" name="bank_ifsc" value={formData.bank_ifsc} onChange={handleChange} className={inputCls} placeholder="e.g. HDFC0001234" maxLength={11} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 flex justify-between items-center border-t border-white/10">
            <div className="flex gap-2">
              {activeTab !== 'personal' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['personal', 'employment', 'statutory', 'bank'];
                    const idx = tabs.indexOf(activeTab);
                    if (idx > 0) setActiveTab(tabs[idx - 1]);
                  }}
                  className="px-4 py-2 text-xs font-medium text-gray-400 bg-white/5 rounded-xl hover:text-white"
                >
                  ← Back
                </button>
              )}
              {activeTab !== 'bank' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['personal', 'employment', 'statutory', 'bank'];
                    const idx = tabs.indexOf(activeTab);
                    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
                  }}
                  className="px-4 py-2 text-xs font-medium text-indigo-300 bg-indigo-500/20 rounded-xl hover:bg-indigo-500/30"
                >
                  Next →
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium text-slate-950 bg-indigo-400 rounded-xl hover:bg-indigo-300 transition disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Employee'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
