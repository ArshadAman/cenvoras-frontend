import React, { useState, useEffect } from "react";
import { hrApi } from "../../api/hr";
import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";

export default function Payslips() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const res = await hrApi.getPayslips();
      setPayslips(res.data?.results || res.data);
    } catch (error) {
      toast.error("Failed to load payslips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const handleDownload = async (id, employeeCode, month, year) => {
    try {
      const response = await hrApi.downloadPayslipPdf(id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${employeeCode}_${month}_${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Failed to download payslip PDF");
    }
  };

  return (
    <>
      <div className="relative p-6 md:p-10 space-y-8 animate-fade-up">
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-300/80 mb-2">Payroll Operations</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
                <DocumentTextIcon className="w-9 h-9 text-indigo-300" />
                Payslips
              </h1>
              <p className="text-white/65 text-sm mt-2">View and download generated employee payslips.</p>
            </div>
          </div>
        </section>

        <section className="relative rounded-3xl border border-white/10 bg-black/25 p-0 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Generated Payslips</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Net Salary</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="px-6 py-4 text-center">Loading...</td></tr>
                ) : payslips.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-4 text-center">No payslips found</td></tr>
                ) : (
                  payslips.map(ps => (
                    <tr key={ps.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">{ps.employee_name || ps.employee}</td>
                      <td className="px-6 py-4">{ps.month} / {ps.year}</td>
                      <td className="px-6 py-4 text-green-400 font-medium">₹{parseFloat(ps.net_salary).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => handleDownload(ps.id, ps.employee_code, ps.month, ps.year)}
                          className="p-2 rounded bg-white/5 text-white hover:bg-white/10 transition"
                          title="Download PDF"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              await hrApi.sendPayslipEmail(ps.id);
                              toast.success(`Payslip emailed to ${ps.employee_name}`);
                            } catch (e) {
                              toast.error('Failed to send email');
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition text-xs font-medium"
                          title="Send Email"
                        >
                          ✉️ Email
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              await hrApi.sendPayslipWhatsApp(ps.id);
                              toast.success(`WhatsApp message queued for ${ps.employee_name}`);
                            } catch (e) {
                              toast.error('Failed to send WhatsApp');
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition text-xs font-medium"
                          title="Send WhatsApp"
                        >
                          💬 WhatsApp
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
