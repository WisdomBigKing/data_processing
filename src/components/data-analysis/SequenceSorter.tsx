"use client";

import React, { useState, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  ArrowUpDown,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";

interface SortResult {
  success: boolean;
  output_file: string;
  total_groups: number;
  message: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  file: File;
  status: "pending" | "processing" | "completed" | "error";
  result?: SortResult;
  error?: string;
}

const API_BASE_URL = "";

export const SequenceSorter: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileUpload = useCallback(async (uploadedFiles: File[]) => {
    const validFiles = uploadedFiles.filter(
      (f) => f.name.endsWith(".xlsx") || f.name.endsWith(".xls"),
    );

    const newFiles: UploadedFile[] = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      file,
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    for (const fileInfo of newFiles) {
      await processFile(fileInfo.id, fileInfo.file);
    }
  }, []);

  const processFile = async (fileId: string, file: File) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: "processing" } : f)),
    );

    try {
      // Upload file first
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("文件上传失败");
      }

      const uploadResult = await uploadResponse.json();
      const filePath =
        uploadResult.file?.path || uploadResult.path || uploadResult.filePath;

      // Call sorting API
      const sortResponse = await fetch(
        `${API_BASE_URL}/api/gene-editing/sort`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file_path: filePath,
            original_filename: file.name,
          }),
        },
      );

      if (!sortResponse.ok) {
        const errorData = await sortResponse.json();
        throw new Error(errorData.detail || "排序处理失败");
      }

      const result: SortResult = await sortResponse.json();

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: "completed", result } : f,
        ),
      );
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error",
                error: error instanceof Error ? error.message : "处理失败",
              }
            : f,
        ),
      );
    }
  };

  const handleDownload = async (outputPath: string, originalName: string) => {
    try {
      const response = await fetch("/api/files/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file_path: outputPath }),
      });

      if (!response.ok) {
        throw new Error("下载失败");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalName.replace(/\.(xlsx|xls)$/i, "_renumbered.xlsx");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("下载失败，请重试");
    }
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileUpload(droppedFiles);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <ArrowUpDown className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">序列重编号</h2>
          <p className="text-sm text-gray-500">
            保持行顺序不变，将序号依次重新编号为001, 002, 003...
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload-sorter"
          className="hidden"
          accept=".xlsx,.xls"
          multiple
          onChange={(e) => {
            if (e.target.files) {
              handleFileUpload(Array.from(e.target.files));
            }
          }}
        />
        <label
          htmlFor="file-upload-sorter"
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <span className="text-lg font-medium text-gray-700">
            点击或拖拽上传文件
          </span>
          <span className="text-sm text-gray-500 mt-1">
            支持 .xlsx, .xls 格式的基因编辑数据文件
          </span>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">处理文件</h3>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)}
                    {file.result && (
                      <span className="ml-2 text-blue-600">
                        · {file.result.total_groups} 个序列组
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {file.status === "processing" && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>重编号中...</span>
                  </div>
                )}

                {file.status === "completed" && file.result && (
                  <>
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span>完成</span>
                    </div>
                    <button
                      onClick={() =>
                        handleDownload(file.result!.output_file, file.name)
                      }
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      下载
                    </button>
                  </>
                )}

                {file.status === "error" && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span>{file.error}</span>
                  </div>
                )}

                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">使用说明</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 上传包含序列数据的Excel文件（格式：0xx-refXXX）</li>
          <li>
            • 系统将保持行顺序不变，只将序号依次重新编号为001, 002, 003...
          </li>
          <li>• 重编号后的文件将保留原始的格式、颜色和高亮标记</li>
          <li>• 处理完成后点击“下载”按钮获取重编号后的文件</li>
        </ul>
      </div>
    </div>
  );
};

export default SequenceSorter;
