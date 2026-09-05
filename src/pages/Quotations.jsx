import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from '@heroicons/react/24/outline';
import SalesForm from '../components/sales/SalesForm';
import SalesDetailsModal from '../components/sales/SalesDetailsModal';
import QuotationTable from '../components/quotation/QuotationTable';
import { createQuotation, getNextQuotationNumber, updateQuotation } from '../api/quotation';
import { getUserProfile } from '../api/users';

export default function Quotations() {
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewData, setViewData] = useState(null);

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
    staleTime: 5 * 60 * 1000,
  });

  const businessInfo = userProfile?.profile
    ? {
        business_name: userProfile.profile.business_name,
        business_address: userProfile.profile.business_address,
        phone: userProfile.profile.phone,
        email: userProfile.profile.email,
        gstin: userProfile.profile.gstin,
        gem_id: userProfile.profile.gem_id,
        dl_number: userProfile.profile.dl_number,
        gin_number: userProfile.profile.gin_number,
      }
    : {};

  return (
    <>
      <div className="p-2 sm:p-6 md:p-10 space-y-8 animate-fade-up">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2 sm:px-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Quotation Management</h1>
            <p className="text-gray-400 text-sm">Create quotations separately and convert approved items to sales orders.</p>
          </div>
          <button
            onClick={() => {
              setEditData(null);
              setShowForm(true);
            }}
            className="btn-primary text-sm py-2 px-4 shadow-lg shadow-cyan-500/20 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <PlusIcon className="w-4 h-4" /> New Quotation
          </button>
        </div>

        <div className="bento-card p-3 sm:p-6">
          <QuotationTable
            onEdit={(q) => {
              setEditData(q);
              setShowForm(true);
            }}
            onView={(q) => setViewData(q)}
          />
        </div>
      </div>

      {showForm && (
        <SalesForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditData(null);
          }}
          editData={editData}
          invoicePrefix="QT-"
          documentType="quotation"
          createDocument={createQuotation}
          updateDocument={(id, data) => updateQuotation(id, data)}
          getNextNumber={getNextQuotationNumber}
          finalSubmitStatus="pending"
        />
      )}

      <SalesDetailsModal
        isOpen={!!viewData}
        onClose={() => setViewData(null)}
        invoice={viewData}
        businessInfo={businessInfo}
        documentType="quotation"
      />
    </>
  );
}
