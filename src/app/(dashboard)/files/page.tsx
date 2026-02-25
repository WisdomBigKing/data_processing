"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { formatFileSize, formatDate } from "@/lib/utils";

interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      setFiles(data.files || []);
      setSelectedFiles(new Set());
    } catch (error) {
      console.error("获取文件列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUploadSuccess = (file: any) => {
    setMessage({
      type: "success",
      text: `文件 "${file.originalName}" 上传成功`,
    });
    fetchFiles();
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUploadError = (error: string) => {
    setMessage({ type: "error", text: error });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`确定要删除文件 "${fileName}" 吗？`)) return;

    try {
      const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "删除失败");
      }

      setMessage({ type: "success", text: "文件已删除" });
      fetchFiles();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "删除失败",
      });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedFiles.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedFiles.size} 个文件吗？`)) return;

    setIsDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const fileId of selectedFiles) {
      try {
        const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsDeleting(false);

    if (failCount === 0) {
      setMessage({ type: "success", text: `成功删除 ${successCount} 个文件` });
    } else {
      setMessage({
        type: "error",
        text: `删除完成：成功 ${successCount} 个，失败 ${failCount} 个`,
      });
    }

    fetchFiles();
    setTimeout(() => setMessage(null), 3000);
  };

  const getFileIcon = (mimeType: string) => {
    if (
      mimeType.includes("csv") ||
      mimeType.includes("excel") ||
      mimeType.includes("spreadsheet")
    ) {
      return (
        <svg
          className="h-8 w-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
      );
    }
    if (mimeType.includes("json")) {
      return (
        <svg
          className="h-8 w-8 text-yellow-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      );
    }
    if (mimeType.includes("pdf")) {
      return (
        <svg
          className="h-8 w-8 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );
    }
    return (
      <svg
        className="h-8 w-8 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            文件管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            上传和管理您的数据文件
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>上传文件</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>文件列表</CardTitle>
          {files.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="px-3 py-1.5 text-sm rounded border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
              >
                {selectedFiles.size === files.length ? "取消全选" : "全选"}
              </button>
              {selectedFiles.size > 0 && (
                <button
                  onClick={handleBatchDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-sm rounded bg-[var(--error)] text-white hover:opacity-90 transition-colors disabled:opacity-50"
                >
                  {isDeleting
                    ? "删除中..."
                    : `删除选中 (${selectedFiles.size})`}
                </button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-[var(--primary)] animate-pulse">
                加载中...
              </div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📁</div>
              <p className="text-[var(--foreground)] opacity-60">暂无文件</p>
              <p className="text-sm text-[var(--foreground)] opacity-40">
                上传您的第一个数据文件开始分析
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedFiles.has(file.id)
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[var(--border)] hover:border-[var(--primary)]"
                  }`}
                  onClick={() => toggleFileSelection(file.id)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <div className="p-2 rounded-lg bg-[var(--muted)]">
                      {getFileIcon(file.mimeType)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium text-[var(--foreground)] truncate"
                      title={file.originalName}
                    >
                      {file.originalName}
                    </p>
                    <p className="text-sm text-[var(--foreground)] opacity-60 mt-1">
                      {formatFileSize(file.size)}
                    </p>
                    <p className="text-xs text-[var(--foreground)] opacity-40 mt-1">
                      {formatDate(file.createdAt)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.id, file.originalName);
                      }}
                      className="mt-2 text-xs text-[var(--error)] hover:underline"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
