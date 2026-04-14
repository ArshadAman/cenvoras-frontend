import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import SalesForm from '../components/sales/SalesForm';
import QuotationTable from '../components/quotation/QuotationTable';
import { createQuotation, getNextQuotationNumber, updateQuotation } from '../api/quotation';

export default function Quotations() {
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  return (
    <Layout>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Quotation Management</h1>
            <p className="text-gray-400 text-sm">Create quotations separately and convert approved items to sales orders.</p>
          </div>
          <button
            onClick={() => {
              setEditData(null);
              setShowForm(true);
            }}
            className="btn-primary text-sm py-2 px-4 shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" /> New Quotation
          </button>
        </div>

        <div className="bento-card p-6">
          <QuotationTable
            onEdit={(q) => {
              setEditData(q);
              setShowForm(true);
            }}
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
    </Layout>
  );
}
