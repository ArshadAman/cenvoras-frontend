import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadSalesCsv } from "../../api/sales";
import { toast } from "react-toastify";

export default function SalesUploadCsv({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: uploadSalesCsv,
    onSuccess: (data) => {
      toast.success(data?.message || 'Sales CSV import queued in the background.');
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      onClose();
      setFile(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload CSV file");
    },
  });

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && (/\.csv$/i.test(selectedFile.name) || selectedFile.type === 'text/csv' || selectedFile.type === 'application/vnd.ms-excel')) {
      setFile(selectedFile);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    uploadMutation.mutate(formData);
  };

  const downloadTemplate = () => {
    const csvHeaders = [
      'bill_number',
      'sale_date',
      'due_date',
      'customer_name',
      'customer_address',
      'customer_gstin',
      'payment_terms',
      'product_name',
      'quantity',
      'unit',
      'price',
      'discount',
      'tax',
      'hsn_code'
    ];
    
    const sampleData = [
      'INV-001',
      '2024-01-15',
      '2024-02-15',
      'Sample Customer',
      '123 Main St, City, State',
      '22AAAAA0000A1Z5',
      'Net 30',
      'Sample Product',
      '10',
      'pcs',
      '100.00',
      '5',
      '18',
      '1234'
    ];

    const csvContent = [
      csvHeaders.join(','),
      sampleData.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales-bills-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upload Sales Bills CSV
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Template Download */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
            Need a template? Download our CSV template to get started.
          </p>
          <button
            onClick={downloadTemplate}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
          >
            Download Template CSV
          </button>
        </div>

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-2">
              <svg className="w-12 h-12 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected: {file.name}
              </p>
              <button
                onClick={() => setFile(null)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drag and drop your CSV file here, or
                </p>
                <label className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer underline">
                  browse to select
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Only CSV files are supported
              </p>
            </div>
          )}
        </div>

        {/* CSV Format Info */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
            CSV Format Requirements:
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Include headers: bill_number, sale_date, customer_name, etc.</li>
            <li>• Date format: YYYY-MM-DD</li>
            <li>• Use comma separator</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || uploadMutation.isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadMutation.isLoading ? "Uploading..." : "Upload CSV"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}