import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadSalesCsv } from "../../api/sales";
import { toast } from "react-toastify";
import InlineProgressBar from "../common/InlineProgressBar";

export default function SalesUploadCsv({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: ({ formData, options }) => uploadSalesCsv(formData, options),
    onSuccess: (data) => {
      toast.success(data?.message || 'Sales CSV import queued in the background.');
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      onClose();
      setFile(null);
      setUploadProgress(0);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload CSV file");
      setUploadProgress(0);
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
    setUploadProgress(0);
    uploadMutation.mutate({
      formData,
      options: {
        onUploadProgress: (event) => {
          const total = Number(event?.total || 0);
          if (!total) return;
          setUploadProgress((Number(event.loaded || 0) / total) * 100);
        },
      },
    });
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Upload Sales Bills CSV
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Template Download */}
        <div className="mb-4 p-3.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl">
          <p className="text-xs text-[var(--text-secondary)] mb-2">
            Need a template? Download our CSV template to get started.
          </p>
          <button
            onClick={downloadTemplate}
            className="text-xs text-[var(--accent-primary)] hover:underline font-semibold"
          >
            Download Template CSV
          </button>
        </div>

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            dragOver
              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
              : 'border-[var(--border-subtle)] bg-[var(--bg-primary)]'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-2">
              <svg className="w-10 h-10 mx-auto text-[var(--status-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <p className="text-xs text-[var(--text-primary)] font-medium">
                Selected: {file.name}
              </p>
              <button
                onClick={() => setFile(null)}
                className="text-xs text-[var(--status-danger)] hover:underline"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <svg className="w-10 h-10 mx-auto text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Drag and drop your CSV file here, or
                </p>
                <label className="text-xs text-[var(--accent-primary)] hover:underline cursor-pointer font-semibold ml-1">
                  browse to select
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Only CSV files are supported
              </p>
            </div>
          )}
        </div>

        {/* CSV Format Info */}
        <div className="mt-4 p-3.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl">
          <p className="text-xs text-[var(--text-secondary)] mb-2 font-medium">
            CSV Format Requirements:
          </p>
          <ul className="text-xs text-[var(--text-muted)] space-y-1">
            <li>• Include headers: bill_number, sale_date, customer_name, etc.</li>
            <li>• Date format: YYYY-MM-DD</li>
            <li>• Use comma separator</li>
          </ul>
        </div>

        {/* Action Buttons */}
        {uploadMutation.isPending && uploadProgress > 0 && (
          <div className="mt-4">
            <InlineProgressBar value={uploadProgress} label="Uploading sales CSV" />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || uploadMutation.isPending}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload CSV"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}