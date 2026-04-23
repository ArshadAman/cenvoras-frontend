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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4">Upload Purchase Bills CSV</h2>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded p-8 w-full text-center cursor-pointer ${
            isDragActive ? "border-blue-600 bg-blue-50" : "border-gray-300"
          }`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the CSV file here ...</p>
          ) : (
            <p>Drag & drop a CSV file here, or click to select file</p>
          )}
        </div>
        {isUploading && uploadProgress > 0 && (
          <div className="w-full mt-4">
            <InlineProgressBar value={uploadProgress} label="Uploading purchase CSV" />
          </div>
        )}
        <button className="mt-6 px-3 py-1 rounded bg-gray-200" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}