import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PlusIcon } from '@heroicons/react/24/outline';
import SalesForm from '../components/sales/SalesForm';
import SalesDetailsModal from '../components/sales/SalesDetailsModal';
import QuotationTable from '../components/quotation/QuotationTable';
import { createQuotation, getNextQuotationNumber, updateQuotation } from '../api/quotation';
import { getUserProfile, patchUserProfile } from '../api/users';

const DEFAULT_QUOTATION_PREFIX = 'QT';

const normalizePrefix = (value) => {
  return String(value ?? '').toUpperCase();
};

export default function Quotations() {
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [quotationPrefix, setQuotationPrefix] = useState(DEFAULT_QUOTATION_PREFIX);

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
    staleTime: 5 * 60 * 1000,
  });

  const saveQuotationPrefixMutation = useMutation({
    mutationFn: (prefix) => patchUserProfile({ quotation_prefix: prefix }),
  });

  const billingProfile = userProfile?.billing_profile || userProfile?.profile;
  const canEditPrefix = Boolean(
    userProfile?.profile?.id &&
    billingProfile?.id &&
    userProfile.profile.id === billingProfile.id
  );

  useEffect(() => {
    const dbPrefix = billingProfile?.quotation_prefix;
    if (dbPrefix !== undefined && dbPrefix !== null) {
      setQuotationPrefix(normalizePrefix(dbPrefix));
    }
  }, [billingProfile?.quotation_prefix]);

  const handlePrefixBlur = () => {
    const normalized = normalizePrefix(quotationPrefix);
    setQuotationPrefix(normalized);
    if (!canEditPrefix) return;
    if (normalized !== normalizePrefix(billingProfile?.quotation_prefix || DEFAULT_QUOTATION_PREFIX)) {
      saveQuotationPrefixMutation.mutate(normalized);
    }
  };

  const businessInfo = billingProfile
    ? {
        business_name: billingProfile.business_name,
        business_address: billingProfile.business_address,
        phone: billingProfile.phone,
        email: billingProfile.email,
        gstin: billingProfile.gstin,
        pan_number: billingProfile.pan_number,
        gem_id: billingProfile.gem_id,
        dl_number: billingProfile.dl_number,
        state: billingProfile.state,
        city: billingProfile.city,
        country: billingProfile.country,
        trn: billingProfile.trn,
        bank_name: billingProfile.bank_name,
        bank_account_number: billingProfile.bank_account_number,
        bank_ifsc_code: billingProfile.bank_ifsc_code,
        bank_branch: billingProfile.bank_branch,
        bank_upi_id: billingProfile.bank_upi_id,
        bank_qr_code: billingProfile.bank_qr_code,
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
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-cyan-500/50 w-full sm:w-auto">
              <span className="text-xs text-gray-400 font-medium">PREFIX:</span>
              <input 
                type="text" 
                value={quotationPrefix}
                onChange={(e) => setQuotationPrefix(normalizePrefix(e.target.value))}
                onBlur={handlePrefixBlur}
                disabled={!canEditPrefix}
                className="bg-transparent border-none text-white text-sm flex-1 sm:w-28 outline-none placeholder-gray-600 focus:ring-0 p-0"
                placeholder="QT"
                maxLength={10}
                title={!canEditPrefix ? 'Quotation prefix is managed by the main account.' : ''}
              />
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
          invoicePrefix={quotationPrefix}
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
