import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { uploadPurchaseCsv } from "../../api/purchase";
import { toast } from "react-toastify";
import InlineProgressBar from "../common/InlineProgressBar";

export default function PurchaseUploadCsv({ onClose }) {
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const formData = new FormData();
    formData.append("file", acceptedFiles[0]);
    setUploadProgress(0);
    setIsUploading(true);
    try {
      await uploadPurchaseCsv(formData, {
        onUploadProgress: (event) => {
          const total = Number(event?.total || 0);
          if (!total) return;
          setUploadProgress((Number(event.loaded || 0) / total) * 100);
        },
      });
      toast.success("CSV uploaded successfully!");
      onClose();
    } catch (err) {
      toast.error("CSV upload failed.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onClose]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: ".csv" });

  const handleDownloadSampleCsv = () => {
    const headers = [
      "vendor_name",
      "bill_number",
      "bill_date",
      "due_date",
      "product_name",
      "hsn_sac_code",
      "batch_number",
      "expiry_date",
      "quantity",
      "unit",
      "purchase_price",
      "discount",
      "tax"
    ];
    const sampleRows = [
      [
        "ACME Supplies Pvt Ltd",
        "PB-2026-001",
        "2026-10-10",
        "2026-11-10",
        "Sample Raw Material A",
        "84713010",
        "BATCH-101",
        "2027-10-10",
        "10",
        "pcs",
        "1500.00",
        "5",
        "18"
      ],
      [
        "ACME Supplies Pvt Ltd",
        "PB-2026-001",
        "2026-10-10",
        "2026-11-10",
        "Sample Component B",
        "84713020",
        "",
        "",
        "5",
        "pcs",
        "850.00",
        "0",
        "18"
      ]
    ];
    const csvContent = [
      headers.join(","),
      ...sampleRows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "purchase_bills_sample_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md flex flex-col items-center border border-[var(--border-subtle)] text-[var(--text-primary)]">
        <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">Upload Purchase Bills CSV</h2>
        <p className="text-xs text-[var(--text-muted)] mb-6 text-center">
          Upload bulk purchase bills formatted with vendor, bill number, products, and prices.
        </p>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 w-full text-center cursor-pointer transition-all ${
            isDragActive 
              ? "border-[var(--accent-primary)] bg-[var(--bg-primary)] text-[var(--accent-primary)]" 
              : "border-[var(--border-subtle)] hover:border-[var(--accent-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
          }`}
        >
          <input {...getInputProps()} />
          <svg className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {isDragActive ? (
            <p className="text-xs font-bold text-[var(--accent-primary)]">Drop the CSV file here ...</p>
          ) : (
            <p className="text-xs font-medium">Drag & drop CSV file here, or <span className="text-[var(--accent-primary)] font-bold underline">browse</span></p>
          )}
        </div>

        {isUploading && uploadProgress > 0 && (
          <div className="w-full mt-4">
            <InlineProgressBar value={uploadProgress} label="Uploading purchase CSV" />
          </div>
        )}

        <div className="w-full mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="btn-secondary !text-xs !py-2 !px-4 w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download Sample CSV</span>
          </button>

          <button
            type="button"
            className="btn-ghost !text-xs !py-2 !px-5 w-full sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}