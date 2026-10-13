import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { hrApi } from '../../api/hr';
import { getWarehouses } from '../../api/inventory';
import { getUserProfile } from '../../api/users';
import { toast } from 'react-toastify';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import SalaryBreakdownCalculator from '../../components/hr/SalaryBreakdownCalculator';
import { indianStates, getGSTStateCode } from '../../utils/indiaData';
import useEscKey from '../../hooks/useEscStack';

function resolveCompanyWorkState(profileState) {
  if (!profileState) return 'Karnataka';
  const raw = String(profileState).trim();
  if (!raw) return 'Karnataka';
  // Already a full state name used by PT slabs
  const byLabel = indianStates.find((s) => s.label.toLowerCase() === raw.toLowerCase());
  if (byLabel) return byLabel.label;
  const code = getGSTStateCode(raw);
  if (code) {
    const byCode = indianStates.find((s) => getGSTStateCode(s.value) === code || getGSTStateCode(s.label) === code);
    if (byCode) return byCode.label;
  }
  return raw;
}

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
  contract_fee: '',
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
  upi_id: '',
  tax_regime: 'new',
};

export default function EmployeeFormModal({ isOpen, onClose, employee, onSuccess }) {
  useEscKey(onClose, isOpen, 10);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [salaryConfig, setSalaryConfig] = useState(null);
  const [salaryEdited, setSalaryEdited] = useState(false);
  const [calculatorKey, setCalculatorKey] = useState(0);
  const formSessionRef = useRef(0);

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: getUserProfile,
    enabled: isOpen,
    staleTime: 60_000,
  });
  const companyWorkState = useMemo(
    () => resolveCompanyWorkState(profileData?.profile?.state || profileData?.billing_profile?.state),
    [profileData]
  );

  // KYC Document file states
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [marksheetFile, setMarksheetFile] = useState(null);

  // Quick Add Department Modal state
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [addingDept, setAddingDept] = useState(false);

  // Quick Add Designation Modal state
  const [showAddDesig, setShowAddDesig] = useState(false);
  const [newDesigName, setNewDesigName] = useState('');
  const [addingDesig, setAddingDesig] = useState(false);

  useEffect(() => {
    if (isOpen) {
      formSessionRef.current += 1;
      setActiveTab('personal');
      setSalaryEdited(false);
      setCalculatorKey((k) => k + 1);
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
          contract_fee: employee.contract_fee || '',
          work_state: employee.work_state || companyWorkState,
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
          upi_id: employee.upi_id || '',
          tax_regime: employee.tax_regime || 'new',
        });
        setAadhaarFile(null);
        setPanFile(null);
        setMarksheetFile(null);
        const currentCtc = Number(employee.current_ctc || employee.salary_details?.monthly_ctc || 0);
        const existingComponents = employee.salary_details?.earnings || employee.salary_details?.components || {};
        if (currentCtc > 0 || employee.salary_details) {
          setSalaryConfig({
            monthly_ctc: currentCtc > 0 ? currentCtc : Number(employee.salary_details?.monthly_ctc || 50000),
            tax_regime: employee.tax_regime || 'new',
            work_state: employee.work_state || companyWorkState,
            components: existingComponents,
          });
        } else {
          setSalaryConfig(null);
        }
      } else {
        setFormData({ ...EMPTY_FORM, work_state: companyWorkState });
        setSalaryConfig(null);
        setAadhaarFile(null);
        setPanFile(null);
        setMarksheetFile(null);
      }
    } else {
      // Reset on close so next Add does not inherit prior compensation tab/state
      setActiveTab('personal');
      setSalaryConfig(null);
      setSalaryEdited(false);
      setFormData({ ...EMPTY_FORM, work_state: companyWorkState });
    }
  }, [isOpen, employee, companyWorkState]);

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

  const handleQuickAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setAddingDept(true);
    try {
      const res = await hrApi.createDepartment({ name: newDeptName.trim() });
      const created = res.data;
      setDepartments((prev) => [...prev, created]);
      setFormData((prev) => ({ ...prev, department_id: created.id }));
      toast.success(`Department "${created.name}" created`);
      setNewDeptName('');
      setShowAddDept(false);
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to create department');
    } finally {
      setAddingDept(false);
    }
  };

  const handleQuickAddDesignation = async (e) => {
    e.preventDefault();
    if (!newDesigName.trim()) return;
    setAddingDesig(true);
    try {
      const res = await hrApi.createDesignation({ name: newDesigName.trim() });
      const created = res.data;
      setDesignations((prev) => [...prev, created]);
      setFormData((prev) => ({ ...prev, designation_id: created.id }));
      toast.success(`Designation "${created.name}" created`);
      setNewDesigName('');
      setShowAddDesig(false);
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to create designation');
    } finally {
      setAddingDesig(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Mandatory phone number check (10 to 11 digits, e.g. 9876543210 or 09876543210)
    const rawPhone = (formData.personal_phone || '').trim();
    const cleanPhone = rawPhone.replace(/[\s\-+]/g, '');
    if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 15 || !/^\d+$/.test(cleanPhone)) {
      toast.error('Please enter a valid phone number (10 to 11 digits, e.g., 9876543210 or 09876543210).');
      setActiveTab('personal');
      return;
    }

    // 2. Age must be at least 13 years
    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 13) {
        toast.error('Employee must be at least 13 years old.');
        setActiveTab('personal');
        return;
      }
    } else {
      toast.error('Date of birth is mandatory.');
      setActiveTab('personal');
      return;
    }

    // 3. Department & Designation mandatory check
    if (!formData.department_id) {
      toast.error('Please select or add a Department.');
      setActiveTab('employment');
      return;
    }
    if (!formData.designation_id) {
      toast.error('Please select or add a Designation.');
      setActiveTab('employment');
      return;
    }

    // 4. Mandatory bank details check
    if (
      !formData.account_holder_name?.trim() ||
      !formData.bank_name?.trim() ||
      !formData.bank_account_number?.trim() ||
      !formData.bank_ifsc?.trim()
    ) {
      toast.error('Please fill in all mandatory bank details (Account Holder, Bank Name, Account Number, IFSC).');
      setActiveTab('bank');
      return;
    }

    // 5. Contract Remuneration check
    const isContract = formData.employment_type === 'contract';
    if (isContract && (!formData.contract_fee || Number(formData.contract_fee) <= 0)) {
      toast.error('Please specify the agreed monthly contract fee for this contract personnel.');
      setActiveTab('compensation');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name,
        date_of_birth: formData.date_of_birth,
        date_of_joining: formData.date_of_joining,
        gender: formData.gender,
        employment_type: formData.employment_type,
        contract_fee: isContract && formData.contract_fee ? parseFloat(formData.contract_fee) : null,
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
        upi_id: formData.upi_id?.trim() || null,
        tax_regime: !isContract ? (salaryConfig?.tax_regime || formData.tax_regime || 'new') : 'new',
      };

      if (formData.personal_email) payload.personal_email = formData.personal_email;
      if (formData.personal_phone) payload.personal_phone = formData.personal_phone;

      // Only attach salary if compensation was edited this session (prevents cross-assign on rapid creates)
      if (!isContract && salaryEdited && salaryConfig && salaryConfig.monthly_ctc > 0) {
        payload.salary = {
          monthly_ctc: salaryConfig.monthly_ctc,
          components: salaryConfig.components || {},
        };
        if (!employee && formData.date_of_joining) {
          payload.salary.effective_from = formData.date_of_joining;
        }
      }

      if (!isContract && salaryEdited && salaryConfig && salaryConfig.tax_declaration) {
        payload.tax_declaration = salaryConfig.tax_declaration;
      }

      let savedEmp = null;
      if (employee) {
        const res = await hrApi.updateEmployee(employee.id, payload);
        savedEmp = res.data;
        toast.success('Employee updated successfully');
      } else {
        const res = await hrApi.createEmployee(payload);
        savedEmp = res.data;
        toast.success('Employee added successfully');
      }

      // Handle KYC document uploads securely in tenant-isolated partition
      const targetEmpId = employee ? employee.id : savedEmp?.id;
      if (targetEmpId) {
        const docUploads = [];
        if (aadhaarFile) {
          const fd = new FormData();
          fd.append('file', aadhaarFile);
          fd.append('document_type', 'aadhaar');
          fd.append('title', 'Aadhaar Card (KYC)');
          fd.append('employee', targetEmpId);
          docUploads.push(hrApi.createDocument(fd).catch(err => console.warn('Aadhaar upload failed', err)));
        }
        if (panFile) {
          const fd = new FormData();
          fd.append('file', panFile);
          fd.append('document_type', 'pan');
          fd.append('title', 'PAN Card (KYC)');
          fd.append('employee', targetEmpId);
          docUploads.push(hrApi.createDocument(fd).catch(err => console.warn('PAN upload failed', err)));
        }
        if (marksheetFile) {
          const fd = new FormData();
          fd.append('file', marksheetFile);
          fd.append('document_type', 'marksheet_10th');
          fd.append('title', '10th Marksheet / Education Certificate (KYC)');
          fd.append('employee', targetEmpId);
          docUploads.push(hrApi.createDocument(fd).catch(err => console.warn('Marksheet upload failed', err)));
        }
        if (docUploads.length > 0) {
          await Promise.allSettled(docUploads);
        }
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

  const maxDobDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return d.toISOString().split('T')[0];
  })();

  const inputCls = 'w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500';
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl my-8">
        <div className="flex justify-between items-center p-5 border-b border-white/10 sticky top-0 bg-[#111116] z-10 rounded-t-2xl">
          <h2 className="text-xl font-semibold text-white">
            {employee ? `Edit Employee (${employee.employee_code})` : 'Add New Employee'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/10 bg-white/[0.02] px-5 pt-3 gap-2 overflow-x-auto">
          {[
            { id: 'personal', label: 'Personal & Family' },
            { id: 'employment', label: 'Employment & Branch' },
            { id: 'statutory', label: 'Statutory (PF/ESI/PAN)' },
            { id: 'bank', label: 'Bank Details' },
            { id: 'kyc', label: 'KYC & Verification' },
            {
              id: 'compensation',
              label: formData.employment_type === 'contract' ? 'Contract Fee' : 'Compensation & Tax',
            },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
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
                  <input type="email" name="personal_email" value={formData.personal_email} onChange={handleChange} className={inputCls} placeholder="john@example.com" />
                </div>
                <div>
                  <label className={labelCls}>Personal Phone *</label>
                  <input
                    required
                    type="tel"
                    name="personal_phone"
                    value={formData.personal_phone}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="e.g. 9876543210 or 09876543210 (10–11 digits)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Father's / Mother's Name</label>
                  <input type="text" name="father_mother_name" value={formData.father_mother_name} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls + ' mb-0'}>Date of Birth *</label>
                    <span className="text-[11px] text-gray-400 font-medium">At least 13 yrs old</span>
                  </div>
                  <input required type="date" name="date_of_birth" max={maxDobDate} value={formData.date_of_birth} onChange={handleChange} className={inputCls} />
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
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls + ' mb-0'}>Department *</label>
                    <button
                      type="button"
                      onClick={() => setShowAddDept(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 transition"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      Add New
                    </button>
                  </div>
                  <select required name="department_id" value={formData.department_id} onChange={handleChange} className={inputCls}>
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls + ' mb-0'}>Designation *</label>
                    <button
                      type="button"
                      onClick={() => setShowAddDesig(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 transition"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      Add New
                    </button>
                  </div>
                  <select required name="designation_id" value={formData.designation_id} onChange={handleChange} className={inputCls}>
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
                <label className={labelCls}>Account Holder Name *</label>
                <input required type="text" name="account_holder_name" value={formData.account_holder_name} onChange={handleChange} className={inputCls} placeholder="As per bank records" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Bank Name *</label>
                  <input required type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} className={inputCls} placeholder="e.g. HDFC Bank" />
                </div>
                <div>
                  <label className={labelCls}>Bank Account Number *</label>
                  <input required type="text" name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} className={inputCls} placeholder="Account Number" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>IFSC Code *</label>
                  <input required type="text" name="bank_ifsc" value={formData.bank_ifsc} onChange={handleChange} className={inputCls} placeholder="e.g. HDFC0001234" maxLength={11} />
                </div>
                <div>
                  <label className={labelCls}>UPI ID / VPA (Optional)</label>
                  <input type="text" name="upi_id" value={formData.upi_id} onChange={handleChange} className={inputCls} placeholder="e.g. employee@okhdfcbank" />
                </div>
              </div>
            </div>
          )}

          {/* TAB KYC: KYC & VERIFICATION DOCUMENTS */}
          {activeTab === 'kyc' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2.5">
                <span className="text-base shrink-0">🛡️</span>
                <p className="leading-relaxed">
                  <strong className="text-white">DPDPA 2023 & Aadhaar Act Compliant Partition:</strong> Identity and educational credentials are encrypted at rest and stored in a private tenant partition. Files are never stored on public servers or shared folders.
                </p>
              </div>

              {/* Aadhaar Card */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <label className={labelCls + ' mb-0'}>Aadhaar Card (PDF / Image)</label>
                  {employee?.kyc_documents?.find(d => d.document_type === 'aadhaar') && (
                    <a
                      href={employee.kyc_documents.find(d => d.document_type === 'aadhaar').file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded hover:underline"
                    >
                      ✓ Previously Uploaded (View)
                    </a>
                  )}
                </div>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={(e) => setAadhaarFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 cursor-pointer"
                />
                {aadhaarFile && (
                  <p className="text-[11px] text-indigo-300">Selected: {aadhaarFile.name} ({(aadhaarFile.size / 1024).toFixed(1)} KB)</p>
                )}
              </div>

              {/* PAN Card */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <label className={labelCls + ' mb-0'}>PAN Card (PDF / Image)</label>
                  {employee?.kyc_documents?.find(d => d.document_type === 'pan') && (
                    <a
                      href={employee.kyc_documents.find(d => d.document_type === 'pan').file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded hover:underline"
                    >
                      ✓ Previously Uploaded (View)
                    </a>
                  )}
                </div>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={(e) => setPanFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 cursor-pointer"
                />
                {panFile && (
                  <p className="text-[11px] text-indigo-300">Selected: {panFile.name} ({(panFile.size / 1024).toFixed(1)} KB)</p>
                )}
              </div>

              {/* 10th Marksheet */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <label className={labelCls + ' mb-0'}>10th Marksheet / Education Certificate (PDF / Image)</label>
                  {employee?.kyc_documents?.find(d => d.document_type === 'marksheet_10th') && (
                    <a
                      href={employee.kyc_documents.find(d => d.document_type === 'marksheet_10th').file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded hover:underline"
                    >
                      ✓ Previously Uploaded (View)
                    </a>
                  )}
                </div>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={(e) => setMarksheetFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 cursor-pointer"
                />
                {marksheetFile && (
                  <p className="text-[11px] text-indigo-300">Selected: {marksheetFile.name} ({(marksheetFile.size / 1024).toFixed(1)} KB)</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: COMPENSATION OR CONTRACT REMUNERATION */}
          {activeTab === 'compensation' && (
            <div className="space-y-4 pt-1">
              {formData.employment_type === 'contract' ? (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white">Contract Remuneration & Terms</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Fixed contract fee for professional / freelance personnel.</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Contract Personnel
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                    <p className="font-semibold text-white">Exempt from Statutory Payroll & PF/ESI</p>
                    <p className="text-amber-300/90">
                      Contract personnel receive their agreed monthly remuneration without deductions for Employee Provident Fund (PF) or Employee State Insurance (ESI). They are automatically excluded from permanent monthly statutory payroll runs.
                    </p>
                  </div>

                  <div>
                    <label className={labelCls}>Agreed Monthly Contract Fee (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-gray-400 font-semibold text-sm">₹</span>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="1"
                        name="contract_fee"
                        value={formData.contract_fee}
                        onChange={handleChange}
                        className={inputCls + ' pl-8'}
                        placeholder="e.g. 50000"
                      />
                    </div>
                    {formData.contract_fee && Number(formData.contract_fee) > 0 && (
                      <p className="text-xs text-indigo-300 mt-1.5">
                        Annual Contract Value: ₹{(Number(formData.contract_fee) * 12).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <SalaryBreakdownCalculator
                  key={`salary-calc-${calculatorKey}-${employee?.id || 'new'}`}
                  initialMonthlyCtc={
                    salaryConfig?.monthly_ctc ||
                    Number(employee?.current_ctc || employee?.salary_details?.monthly_ctc || 50000)
                  }
                  initialTaxRegime={salaryConfig?.tax_regime || formData.tax_regime || 'new'}
                  initialWorkState={salaryConfig?.work_state || formData.work_state || companyWorkState}
                  initialComponents={salaryConfig?.components || employee?.salary_details?.earnings || employee?.salary_details?.components}
                  onChange={(calcData) => {
                    const session = formSessionRef.current;
                    // Ignore stale calculator responses from a previous open session
                    if (session !== formSessionRef.current) return;
                    setSalaryEdited(true);
                    setSalaryConfig(calcData);
                    setFormData((prev) => ({
                      ...prev,
                      tax_regime: calcData.tax_regime,
                      work_state: calcData.work_state || prev.work_state,
                    }));
                  }}
                />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 flex justify-between items-center border-t border-white/10">
            <div className="flex gap-2">
              {activeTab !== 'personal' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['personal', 'employment', 'statutory', 'bank', 'kyc', 'compensation'];
                    const idx = tabs.indexOf(activeTab);
                    if (idx > 0) setActiveTab(tabs[idx - 1]);
                  }}
                  className="px-4 py-2 text-xs font-medium text-gray-400 bg-white/5 rounded-xl hover:text-white"
                >
                  ← Back
                </button>
              )}
              {activeTab !== 'compensation' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['personal', 'employment', 'statutory', 'bank', 'kyc', 'compensation'];
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

      {/* Quick Add Department Modal */}
      {showAddDept && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#181820] border border-white/15 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-white">Add New Department</h3>
              <button
                type="button"
                onClick={() => setShowAddDept(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleQuickAddDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Sales, Marketing, IT"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDept(false)}
                  className="px-3 py-1.5 text-xs text-gray-300 bg-white/5 rounded-lg hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingDept}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-indigo-400 rounded-lg hover:bg-indigo-300 disabled:opacity-50"
                >
                  {addingDept ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Designation Modal */}
      {showAddDesig && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#181820] border border-white/15 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-white">Add New Designation</h3>
              <button
                type="button"
                onClick={() => setShowAddDesig(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleQuickAddDesignation} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Designation Title *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Senior Developer, Sales Executive"
                  value={newDesigName}
                  onChange={(e) => setNewDesigName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDesig(false)}
                  className="px-3 py-1.5 text-xs text-gray-300 bg-white/5 rounded-lg hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingDesig}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-indigo-400 rounded-lg hover:bg-indigo-300 disabled:opacity-50"
                >
                  {addingDesig ? 'Creating...' : 'Create Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
