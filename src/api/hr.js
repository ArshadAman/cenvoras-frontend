import api from './api';

export const hrApi = {
  // Departments
  getDepartments: (params) => api.get('/hr/departments/', { params }),
  getDepartment: (id) => api.get(`/hr/departments/${id}/`),
  createDepartment: (data) => api.post('/hr/departments/', data),
  updateDepartment: (id, data) => api.put(`/hr/departments/${id}/`, data),
  deleteDepartment: (id) => api.delete(`/hr/departments/${id}/`),

  // Designations
  getDesignations: (params) => api.get('/hr/designations/', { params }),
  getDesignation: (id) => api.get(`/hr/designations/${id}/`),
  createDesignation: (data) => api.post('/hr/designations/', data),
  updateDesignation: (id, data) => api.put(`/hr/designations/${id}/`, data),
  deleteDesignation: (id) => api.delete(`/hr/designations/${id}/`),

  // Employees
  getEmployees: (params) => api.get('/hr/employees/', { params }),
  getEmployee: (id) => api.get(`/hr/employees/${id}/`),
  createEmployee: (data) => api.post('/hr/employees/', data),
  updateEmployee: (id, data) => api.put(`/hr/employees/${id}/`, data),
  deleteEmployee: (id) => api.delete(`/hr/employees/${id}/`),

  // Attendance
  getAttendance: (params) => api.get('/hr/attendance/', { params }),
  createAttendance: (data) => api.post('/hr/attendance/', data),
  updateAttendance: (id, data) => api.put(`/hr/attendance/${id}/`, data),
  deleteAttendance: (id) => api.delete(`/hr/attendance/${id}/`),
  bulkAttendance: (data) => api.post('/hr/attendance/bulk/', data),

  // Leave Types
  getLeaveTypes: (params) => api.get('/hr/leave-types/', { params }),
  createLeaveType: (data) => api.post('/hr/leave-types/', data),
  updateLeaveType: (id, data) => api.put(`/hr/leave-types/${id}/`, data),
  deleteLeaveType: (id) => api.delete(`/hr/leave-types/${id}/`),

  // Leave Balances
  getLeaveBalances: (params) => api.get('/hr/leave-balances/', { params }),
  updateLeaveBalance: (id, data) => api.put(`/hr/leave-balances/${id}/`, data),

  // Leave Applications
  getLeaveApplications: (params) => api.get('/hr/leave-applications/', { params }),
  getLeaveApplication: (id) => api.get(`/hr/leave-applications/${id}/`),
  createLeaveApplication: (data) => api.post('/hr/leave-applications/', data),
  updateLeaveApplication: (id, data) => api.put(`/hr/leave-applications/${id}/`, data),
  deleteLeaveApplication: (id) => api.delete(`/hr/leave-applications/${id}/`),
  approveLeave: (id) => api.post(`/hr/leave-applications/${id}/approve/`),
  rejectLeave: (id) => api.post(`/hr/leave-applications/${id}/reject/`),

  // Salary Structures
  getSalaryStructures: (params) => api.get('/hr/salary-structures/', { params }),
  getSalaryStructure: (id) => api.get(`/hr/salary-structures/${id}/`),
  createSalaryStructure: (data) => api.post('/hr/salary-structures/', data),
  updateSalaryStructure: (id, data) => api.put(`/hr/salary-structures/${id}/`, data),
  deleteSalaryStructure: (id) => api.delete(`/hr/salary-structures/${id}/`),

  // Salary Assignments
  getSalaryAssignments: (params) => api.get('/hr/salary-assignments/', { params }),
  getSalaryAssignment: (id) => api.get(`/hr/salary-assignments/${id}/`),
  createSalaryAssignment: (data) => api.post('/hr/salary-assignments/', data),
  updateSalaryAssignment: (id, data) => api.put(`/hr/salary-assignments/${id}/`, data),
  deleteSalaryAssignment: (id) => api.delete(`/hr/salary-assignments/${id}/`),

  // Payroll Runs
  getPayrollRuns: (params) => api.get('/hr/payroll-runs/', { params }),
  getPayrollRun: (id) => api.get(`/hr/payroll-runs/${id}/`),
  createPayrollRun: (data) => api.post('/hr/payroll-runs/', data),
  runPayroll: (id) => api.post(`/hr/payroll-runs/${id}/run/`),
  finalisePayroll: (id) => api.post(`/hr/payroll-runs/${id}/finalise/`),

  // Payslips
  getPayslips: (params) => api.get('/hr/payslips/', { params }),
  getPayslip: (id) => api.get(`/hr/payslips/${id}/`),
  downloadPayslipPdf: (id) => api.get(`/hr/payslips/${id}/pdf/`, { responseType: 'blob' }),

  // Dashboard
  getHRDashboard: () => api.get('/hr/dashboard/'),

  // Tasks
  getTasks: (params) => api.get('/hr/tasks/', { params }),
  createTask: (data) => api.post('/hr/tasks/', data),
  updateTask: (id, data) => api.put(`/hr/tasks/${id}/`, data),
  deleteTask: (id) => api.delete(`/hr/tasks/${id}/`),

  // Queries
  getQueries: (params) => api.get('/hr/queries/', { params }),
  createQuery: (data) => api.post('/hr/queries/', data),
  updateQuery: (id, data) => api.patch(`/hr/queries/${id}/`, data),

  // Notifications
  getNotifications: (params) => api.get('/hr/notifications/', { params }),
  createNotification: (data) => api.post('/hr/notifications/', data),
  deleteNotification: (id) => api.delete(`/hr/notifications/${id}/`),

  // Payroll Lifecycle & Exceptions
  calculatePayroll: (id) => api.post(`/hr/payroll-runs/${id}/calculate/`),
  getPayrollExceptions: (id) => api.get(`/hr/payroll-runs/${id}/exceptions/`),
  approvePayroll: (id) => api.post(`/hr/payroll-runs/${id}/approve/`),
  payPayroll: (id, data) => api.post(`/hr/payroll-runs/${id}/pay/`, data),
  lockPayroll: (id) => api.post(`/hr/payroll-runs/${id}/lock/`),
  reopenPayroll: (id, data) => api.post(`/hr/payroll-runs/${id}/reopen/`, data),

  // Salary History
  getSalaryHistories: (params) => api.get('/hr/salary-history/', { params }),

  // Overtime
  getOvertimeRecords: (params) => api.get('/hr/overtime/', { params }),
  createOvertimeRecord: (data) => api.post('/hr/overtime/', data),
  approveOvertime: (id) => api.post(`/hr/overtime/${id}/approve/`),
  rejectOvertime: (id) => api.post(`/hr/overtime/${id}/reject/`),
  deleteOvertime: (id) => api.delete(`/hr/overtime/${id}/`),

  // Advances & Loans
  getAdvancesLoans: (params) => api.get('/hr/advances-loans/', { params }),
  createAdvanceLoan: (data) => api.post('/hr/advances-loans/', data),
  approveAdvanceLoan: (id) => api.post(`/hr/advances-loans/${id}/approve/`),
  closeAdvanceLoan: (id) => api.post(`/hr/advances-loans/${id}/close/`),
  deleteAdvanceLoan: (id) => api.delete(`/hr/advances-loans/${id}/`),

  // Exceptions
  getExceptions: (params) => api.get('/hr/exceptions/', { params }),
  resolveException: (id) => api.post(`/hr/exceptions/${id}/resolve/`),

  // Documents
  getDocuments: (params) => api.get('/hr/documents/', { params }),
  createDocument: (data) => api.post('/hr/documents/', data),
  deleteDocument: (id) => api.delete(`/hr/documents/${id}/`),

  // HRMS Settings
  getHRMSSettings: () => api.get('/hr/settings/'),
  updateHRMSSettings: (data) => api.put('/hr/settings/', data),

  // HR Reports
  getHRReports: (params) => api.get('/hr/reports/', { params }),

  // Payslip Dispatch
  sendPayslipEmail: (id) => api.post(`/hr/payslips/${id}/send_email/`),
  sendPayslipWhatsApp: (id) => api.post(`/hr/payslips/${id}/send_whatsapp/`),

  // Setup Defaults
  seedDefaults: () => api.post('/hr/setup-defaults/'),
};
