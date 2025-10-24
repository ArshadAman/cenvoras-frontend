import React, { useState, useEffect } from "react";
import SalesTable from "../components/sales/SalesTable";
import SalesForm from "../components/sales/SalesForm";
import SalesDetailsModal from "../components/sales/SalesDetailsModal";
import SalesDeleteDialog from "../components/sales/SalesDeleteDialog";
import SalesUploadCsv from "../components/sales/SalesUploadCsv";
import SalesSummary from "../components/sales/SalesSummary";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "../components/Layout";
import { PlusIcon, ArrowUpTrayIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';

export default function Sales() {
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [deleteInvoice, setDeleteInvoice] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  // Add theme CSS
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes floatUp {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(5deg); }
      }
      
      @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes particle-float {
        0% { transform: translateY(100vh) translateX(-5px) rotate(0deg); opacity: 0; }
        10% { opacity: 0.6; }
        90% { opacity: 0.6; }
        100% { transform: translateY(-100vh) translateX(5px) rotate(180deg); opacity: 0; }
      }
      
      .floating-element {
        animation: floatUp 8s infinite ease-in-out;
      }
      
      .floating-element:nth-child(2) { animation-delay: -1s; }
      .floating-element:nth-child(3) { animation-delay: -2s; }
      .floating-element:nth-child(4) { animation-delay: -3s; }
      
      .gradient-text {
        background: linear-gradient(-45deg, #7fd3f7, #b6e0f7, #eaf6fa, #7fd3f7);
        background-size: 400% 400%;
        animation: gradient-shift 6s ease infinite;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .particle {
        animation: particle-float linear infinite;
      }
      
      .sales-bg {
        background: linear-gradient(135deg, #1a2341 0%, #2d3561 50%, #1a2341 100%);
        min-height: 100vh;
        position: relative;
      }
      
      .glass-card {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 24px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
      }
      
      .glass-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 35px 70px rgba(0, 0, 0, 0.25);
        border-color: rgba(127, 211, 247, 0.3);
      }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  const handleEdit = (invoice) => {
    setEditInvoice(invoice);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditInvoice(null);
  };

  return (
    <Layout>
      <div className="sales-bg relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="particle absolute top-20 left-10 w-2 h-2 bg-[#7fd3f7]/30 rounded-full" style={{animationDuration: '15s'}}></div>
          <div className="particle absolute top-40 right-20 w-3 h-3 bg-[#b6e0f7]/40 rounded-full" style={{animationDuration: '12s'}}></div>
          <div className="particle absolute bottom-40 left-20 w-1.5 h-1.5 bg-[#eaf6fa]/50 rounded-full" style={{animationDuration: '18s'}}></div>
          <div className="particle absolute bottom-20 right-40 w-2 h-2 bg-[#7fd3f7]/35 rounded-full" style={{animationDuration: '14s'}}></div>
          
          {/* Floating Elements */}
          <div className="floating-element absolute top-32 left-32 w-20 h-20 bg-gradient-to-br from-[#7fd3f7]/10 to-[#b6e0f7]/10 rounded-full blur-xl"></div>
          <div className="floating-element absolute bottom-32 right-32 w-16 h-16 bg-gradient-to-br from-[#b6e0f7]/15 to-[#eaf6fa]/15 rounded-full blur-lg"></div>
          <div className="floating-element absolute top-1/2 left-1/4 w-12 h-12 bg-gradient-to-br from-[#eaf6fa]/20 to-[#7fd3f7]/20 rounded-full blur-md"></div>
        </div>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
          {/* Page Header */}
          <div className="text-center mb-8 lg:mb-12">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#7fd3f7] to-[#1a2341] rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg">
                <CurrencyRupeeIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h1 className="gradient-text text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold">
                Sales Management
              </h1>
            </div>
            <p className="text-[#b6e0f7]/80 text-sm sm:text-base lg:text-lg xl:text-xl max-w-2xl mx-auto px-4">
              Create, manage and track your sales invoices with powerful analytics
            </p>
            <div className="w-16 sm:w-20 lg:w-24 h-1 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] rounded-full mx-auto mt-4"></div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-8 lg:mb-12">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] text-[#1a2341] font-bold text-base sm:text-lg rounded-2xl hover:from-[#6bc9f2] hover:to-[#a8d8f4] transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-3">
                <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                Create New Sale
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            </button>
            
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 glass-card text-white font-bold text-base sm:text-lg hover:bg-white/20 transition-all duration-300 group"
            >
              <ArrowUpTrayIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#7fd3f7]" />
              Upload CSV Data
            </button>
          </div>

          {/* Sales Summary */}
          <div className="mb-6 lg:mb-8">
            <SalesSummary />
          </div>

          {/* Sales Table */}
          <div className="glass-card p-4 sm:p-6 lg:p-8">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <CurrencyRupeeIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#7fd3f7]" />
                Sales Invoices
              </h2>
              <p className="text-[#b6e0f7]/80 mt-2 text-sm sm:text-base">View, edit, and manage all your sales transactions</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden">
              <SalesTable
                onEdit={handleEdit}
                onView={(invoice) => setShowDetails(invoice)}
                onDelete={(invoice) => setDeleteInvoice(invoice)}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Modals */}
      {showForm && (
        <SalesForm 
          isOpen={showForm} 
          onClose={handleCloseForm}
          editData={editInvoice}
        />
      )}

      {showDetails && (
        <SalesDetailsModal
          isOpen={!!showDetails}
          onClose={() => setShowDetails(null)}
          invoice={showDetails}
        />
      )}

      {deleteInvoice && (
        <SalesDeleteDialog
          isOpen={!!deleteInvoice}
          onClose={() => setDeleteInvoice(null)}
          invoice={deleteInvoice}
        />
      )}

      {showUpload && (
        <SalesUploadCsv
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
        />
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </Layout>
  );
}