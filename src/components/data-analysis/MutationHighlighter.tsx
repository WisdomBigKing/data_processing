"use client";

import React, { useState, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  Highlighter,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  Settings,
  Info,
} from "lucide-react";

interface HighlightResult {
  success: boolean;
  output_file: string;
  total_highlighted: number;
  target_sequence: string;
  color_statistics: Record<string, number>;
  mutation_statistics: Record<string, number>;
  highlighted_rows: Array<{
    row: number;
    sequence_id: string;
    mutation_type: string;
    color: string;
  }>;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  file: File;
  filePath?: string; // 服务器上的文件路径
  status:
    | "pending"
    | "uploading"
    | "uploaded"
    | "processing"
    | "completed"
    | "error";
  result?: HighlightResult;
  error?: string;
  usedTargetSequence?: string; // 处理时使用的目标序列
}

const COLOR_LABELS: Record<
  string,
  { label: string; bgClass: string; textClass: string }
> = {
  yellow: {
    label: "C→T 突变",
    bgClass: "bg-yellow-400",
    textClass: "text-yellow-800",
  },
  green: {
    label: "A→G 突变",
    bgClass: "bg-green-500",
    textClass: "text-green-800",
  },
  orange: {
    label: "G→A / T→C 突变",
    bgClass: "bg-orange-500",
    textClass: "text-orange-800",
  },
};

export const MutationHighlighter: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [targetSequence, setTargetSequence] = useState("TGGAGACACTAGAGGGATGG");
  const [showSettings, setShowSettings] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileUpload(droppedFiles);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        handleFileUpload(selectedFiles);
      }
    },
    [],
  );

  // 只上传文件，不处理
  const handleFileUpload = useCallback(async (uploadedFiles: File[]) => {
    const validFiles = uploadedFiles.filter(
      (f) => f.name.endsWith(".xlsx") || f.name.endsWith(".xls"),
    );

    const newFiles: UploadedFile[] = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      file,
      status: "uploading",
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // 只上传文件，不自动处理
    for (const fileInfo of newFiles) {
      await uploadFile(fileInfo.id, fileInfo.file);
    }
  }, []);

  // 上传文件到服务器
  const uploadFile = async (fileId: string, file: File) => {
    try {
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

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: "uploaded", filePath } : f,
        ),
      );
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error",
                error: error instanceof Error ? error.message : "上传失败",
              }
            : f,
        ),
      );
    }
  };

  // 处理单个文件（使用当前的目标序列）
  const processFile = async (fileId: string) => {
    const fileInfo = files.find((f) => f.id === fileId);
    if (!fileInfo || !fileInfo.filePath) {
      console.error("文件未上传或路径不存在");
      return;
    }

    const currentTargetSequence = targetSequence;
    console.log(
      `[processFile] 处理文件: ${fileInfo.name}, 目标序列: ${currentTargetSequence}`,
    );

    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: "processing" } : f)),
    );

    try {
      const highlightResponse = await fetch("/api/gene-editing/highlight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_path: fileInfo.filePath,
          target_sequence: currentTargetSequence,
          original_filename: fileInfo.name,
        }),
      });

      if (!highlightResponse.ok) {
        const errorData = await highlightResponse.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || "处理失败");
      }

      const result: HighlightResult = await highlightResponse.json();

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "completed",
                result,
                usedTargetSequence: currentTargetSequence,
              }
            : f,
        ),
      );
      setSelectedFile(fileId);
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

  // 处理所有已上传的文件
  const processAllFiles = async () => {
    const uploadedFiles = files.filter(
      (f) =>
        f.status === "uploaded" ||
        f.status === "completed" ||
        f.status === "error",
    );
    for (const fileInfo of uploadedFiles) {
      await processFile(fileInfo.id);
    }
  };

  const handleDownload = async (
    result: HighlightResult,
    originalFileName: string,
  ) => {
    try {
      const response = await fetch("/api/files/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_path: result.output_file }),
      });

      if (!response.ok) throw new Error("下载失败");

      // 从 Content-Disposition 头获取文件名
      let filename = "highlighted.xlsx";
      const contentDisposition = response.headers.get("Content-Disposition");
      if (contentDisposition) {
        // 尝试解析 filename*=UTF-8''xxx 格式
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''(.+)/i);
        if (utf8Match) {
          filename = decodeURIComponent(utf8Match[1]);
        } else {
          // 尝试解析 filename="xxx" 格式
          const normalMatch = contentDisposition.match(
            /filename="?([^";\n]+)"?/i,
          );
          if (normalMatch) {
            filename = normalMatch[1];
          }
        }
      }

      // 如果无法从响应头获取，使用原始文件名生成
      if (filename === "highlighted.xlsx" && originalFileName) {
        const baseName = originalFileName.replace(/\.(xlsx|xls)$/i, "");
        filename = `${baseName}_highlighted.xlsx`;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("下载失败:", error);
      alert("下载失败，请重试");
    }
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (selectedFile === fileId) {
      setSelectedFile(null);
    }
  };

  const selectedFileData = files.find((f) => f.id === selectedFile);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <Highlighter className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              突变高亮标记工具
            </h1>
          </div>
          <p className="text-slate-600 ml-12">
            根据突变类型自动对符合条件的行进行颜色高亮标记
          </p>
        </div>

        {/* Settings Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">高亮设置</span>
          </button>

          {showSettings && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  目标序列 (20bp)
                </label>
                <input
                  type="text"
                  value={targetSequence}
                  onChange={(e) =>
                    setTargetSequence(e.target.value.toUpperCase())
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-sm"
                  placeholder="输入目标20bp序列"
                />
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  高亮规则说明
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-yellow-400 rounded"></span>
                    <span className="text-slate-600">黄色：C→T 突变</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-500 rounded"></span>
                    <span className="text-slate-600">绿色：A→G 突变</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-orange-500 rounded"></span>
                    <span className="text-slate-600">
                      橙色：G→A 或 T→C 突变
                    </span>
                  </div>
                  <p className="text-slate-500 mt-2">
                    <strong>前提条件：</strong>F列和G列的突变类型必须相同
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Upload & File List */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                isDragging
                  ? "border-amber-500 bg-amber-50"
                  : "border-slate-300 hover:border-amber-400 hover:bg-slate-50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload
                className={`w-12 h-12 mx-auto mb-4 ${
                  isDragging ? "text-amber-500" : "text-slate-400"
                }`}
              />
              <p className="text-slate-600 mb-2">
                拖拽Excel文件到此处，或点击选择
              </p>
              <p className="text-sm text-slate-400">支持 .xlsx, .xls 格式</p>
            </div>

            {/* File List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-slate-700">文件列表</h3>
                {files.some(
                  (f) =>
                    f.status === "uploaded" ||
                    f.status === "completed" ||
                    f.status === "error",
                ) && (
                  <button
                    onClick={processAllFiles}
                    className="px-3 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
                  >
                    全部处理
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {files.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>暂无文件</p>
                  </div>
                ) : (
                  files.map((file) => (
                    <div
                      key={file.id}
                      className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                        selectedFile === file.id ? "bg-amber-50" : ""
                      }`}
                      onClick={() => setSelectedFile(file.id)}
                    >
                      <div className="flex-shrink-0">
                        {file.status === "uploading" ? (
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        ) : file.status === "processing" ? (
                          <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                        ) : file.status === "completed" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : file.status === "error" ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : file.status === "uploaded" ? (
                          <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                        ) : (
                          <FileSpreadsheet className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatFileSize(file.size)}
                          {file.status === "uploading" && (
                            <span className="ml-2 text-blue-500">
                              上传中...
                            </span>
                          )}
                          {file.status === "uploaded" && (
                            <span className="ml-2 text-blue-600">
                              已上传，待处理
                            </span>
                          )}
                          {file.status === "processing" && (
                            <span className="ml-2 text-amber-500">
                              处理中...
                            </span>
                          )}
                          {file.result && (
                            <span className="ml-2 text-green-600">
                              · {file.result.total_highlighted} 行高亮
                            </span>
                          )}
                          {file.status === "error" && file.error && (
                            <span className="ml-2 text-red-500">
                              · {file.error}
                            </span>
                          )}
                        </p>
                      </div>
                      {/* 处理按钮 */}
                      {(file.status === "uploaded" ||
                        file.status === "completed" ||
                        file.status === "error") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            processFile(file.id);
                          }}
                          className="flex-shrink-0 px-2 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
                          title={
                            file.status === "completed"
                              ? "重新处理"
                              : "开始处理"
                          }
                        >
                          {file.status === "completed" ? "重处理" : "处理"}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="flex-shrink-0 p-1 hover:bg-slate-200 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-slate-700">处理结果</h3>
                {selectedFileData?.result && (
                  <button
                    onClick={() =>
                      handleDownload(
                        selectedFileData.result!,
                        selectedFileData.name,
                      )
                    }
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    下载高亮文件
                  </button>
                )}
              </div>

              <div className="p-4">
                {!selectedFileData ? (
                  <div className="text-center py-12 text-slate-400">
                    <Highlighter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>选择文件查看处理结果</p>
                  </div>
                ) : selectedFileData.status === "processing" ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-amber-500 animate-spin" />
                    <p className="text-slate-600">正在处理文件...</p>
                  </div>
                ) : selectedFileData.status === "error" ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <p className="text-red-600">{selectedFileData.error}</p>
                  </div>
                ) : selectedFileData.result ? (
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-amber-600">
                          {selectedFileData.result.total_highlighted}
                        </p>
                        <p className="text-sm text-slate-500">高亮行数</p>
                      </div>
                      {Object.entries(
                        selectedFileData.result.color_statistics,
                      ).map(([color, count]) => (
                        <div
                          key={color}
                          className="bg-slate-50 rounded-lg p-4 text-center"
                        >
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <span
                              className={`w-3 h-3 rounded ${
                                COLOR_LABELS[color]?.bgClass || "bg-gray-400"
                              }`}
                            ></span>
                            <p className="text-2xl font-bold text-slate-700">
                              {count}
                            </p>
                          </div>
                          <p className="text-sm text-slate-500">
                            {COLOR_LABELS[color]?.label || color}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Mutation Statistics */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-medium text-slate-700 mb-3">
                        突变类型统计
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          selectedFileData.result.mutation_statistics,
                        ).map(([mutation, count]) => (
                          <span
                            key={mutation}
                            className="px-3 py-1 bg-white rounded-full text-sm border border-slate-200"
                          >
                            <span className="font-medium">{mutation}</span>
                            <span className="text-slate-400 ml-1">
                              × {count}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Highlighted Rows Table */}
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">
                        高亮行明细
                      </h4>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-slate-600">
                                行号
                              </th>
                              <th className="px-4 py-2 text-left text-slate-600">
                                序号
                              </th>
                              <th className="px-4 py-2 text-left text-slate-600">
                                突变类型
                              </th>
                              <th className="px-4 py-2 text-left text-slate-600">
                                高亮颜色
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedFileData.result.highlighted_rows
                              .slice(0, 50)
                              .map((row, index) => (
                                <tr key={index} className="hover:bg-slate-50">
                                  <td className="px-4 py-2 text-slate-700">
                                    {row.row}
                                  </td>
                                  <td className="px-4 py-2 text-slate-700">
                                    {row.sequence_id}
                                  </td>
                                  <td className="px-4 py-2">
                                    <span className="font-mono text-slate-700">
                                      {row.mutation_type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                                        COLOR_LABELS[row.color]?.bgClass ||
                                        "bg-gray-200"
                                      } ${
                                        COLOR_LABELS[row.color]?.textClass ||
                                        "text-gray-800"
                                      }`}
                                    >
                                      {COLOR_LABELS[row.color]?.label ||
                                        row.color}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        {selectedFileData.result.highlighted_rows.length >
                          50 && (
                          <div className="px-4 py-2 bg-slate-50 text-center text-sm text-slate-500">
                            显示前 50 条，共{" "}
                            {selectedFileData.result.highlighted_rows.length} 条
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MutationHighlighter;
