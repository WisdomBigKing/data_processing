"use client";

import React, { useState, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  Dna,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Types for gene editing data - v11 保留所有原始列
interface SequenceResult {
  sequence_id: string;
  reference_name: string;
  row_type: string; // "WT" 或 "SNP"
  highlight_color: string; // 高亮颜色（yellow/green/blue/pink等）
  red_20_bases: string; // 红色20碱基（保留原始大小写）
  is_highlighted: boolean;
  is_simplified: boolean;
  original_cols: number; // 原始列数
}

interface ValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
  total_rows: number;
  total_sequence_groups: number;
  wt_rows: number;
  snp_rows: number;
}

interface SimplifyResult {
  success: boolean;
  output_file: string;
  total_entries: number;
  summary: {
    total_rows: number;
    total_sequence_groups: number;
    wt_rows: number;
    snp_rows: number;
    snp_with_red_bases: number;
    highlight_color_distribution: Record<string, number>;
    reference_distribution: Record<string, number>;
  };
  validation: ValidationResult;
  results: SequenceResult[];
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  file: File;
  status: "pending" | "processing" | "completed" | "error";
  result?: SimplifyResult;
  error?: string;
}

// 使用Next.js API路由代理，支持远程访问
const API_BASE_URL = "";

export const GeneEditingSimplifier: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSNP, setFilterSNP] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (uploadedFiles: File[]) => {
    const validFiles = uploadedFiles.filter(
      (f) =>
        f.name.endsWith(".xlsx") ||
        f.name.endsWith(".xls") ||
        f.name.endsWith(".csv"),
    );

    const newFiles: UploadedFile[] = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      file,
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Auto-process files
    for (const fileInfo of newFiles) {
      await processFile(fileInfo.id, fileInfo.file);
    }
  }, []);

  // Process file through Python service
  const processFile = async (fileId: string, file: File) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: "processing" } : f)),
    );

    try {
      // First upload the file
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

      // Call gene editing simplify API
      const simplifyResponse = await fetch(
        `${API_BASE_URL}/api/gene-editing/simplify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file_path: filePath,
          }),
        },
      );

      if (!simplifyResponse.ok) {
        throw new Error("数据处理失败");
      }

      const result: SimplifyResult = await simplifyResponse.json();

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: "completed", result } : f,
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

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFileUpload(droppedFiles);
    },
    [handleFileUpload],
  );

  // Handle file input
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      handleFileUpload(selectedFiles);
      e.target.value = "";
    },
    [handleFileUpload],
  );

  // Remove file
  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (selectedFile === fileId) {
      setSelectedFile(null);
    }
  };

  // Download simplified file
  const downloadResult = async (fileInfo: UploadedFile) => {
    if (!fileInfo.result?.output_file) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/gene-editing/download?path=${encodeURIComponent(fileInfo.result.output_file)}`,
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileInfo.name.replace(/\.[^.]+$/, "_simplified.xlsx");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (seqId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(seqId)) {
        newSet.delete(seqId);
      } else {
        newSet.add(seqId);
      }
      return newSet;
    });
  };

  // Get selected file data
  const selectedFileData = files.find((f) => f.id === selectedFile);

  // Filter and search results - v11
  const filteredResults = selectedFileData?.result?.results.filter((r) => {
    const matchesSearch =
      searchTerm === "" ||
      r.sequence_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reference_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.red_20_bases || "").toLowerCase().includes(searchTerm.toLowerCase());

    // 按类型过滤 (WT/SNP)
    const matchesFilter = filterSNP === "all" || r.row_type === filterSNP;

    return matchesSearch && matchesFilter;
  });

  // 类型选项
  const snpTypes = ["WT", "SNP"];

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Dna className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              基因编辑数据化简
            </h2>
            <p className="text-sm text-gray-500">
              大豆毛状根技术应用基因编辑数据处理
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner - v3.0 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">数据化简规则 v3.0：</p>
          <ul className="list-disc list-inside space-y-1 text-blue-600">
            <li>
              <strong>只保留有高亮行的序号组</strong>（无高亮=整个跳过）
            </li>
            <li>每组输出：WT行 + 所有高亮SNP行</li>
            <li>
              提取高亮行中的
              <span className="text-red-600 font-bold">红色20碱基</span>
            </li>
            <li>重点数据：深度、百分比、SNP类型</li>
          </ul>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          isDragging
            ? "border-green-500 bg-green-50"
            : "border-gray-300 hover:border-green-400 bg-gray-50"
        }`}
      >
        <input
          type="file"
          id="gene-file-upload"
          multiple
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInput}
          className="hidden"
        />
        <label htmlFor="gene-file-upload" className="cursor-pointer">
          <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <p className="text-base font-medium text-gray-700 mb-1">
            拖拽基因编辑数据文件到此处或点击上传
          </p>
          <p className="text-sm text-gray-500">
            支持 Excel (.xlsx, .xls) 和 CSV 文件
          </p>
        </label>
      </div>

      {/* File List & Results */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* File List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-800">
              上传的文件 ({files.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {files.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>暂无文件</p>
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.id}
                  onClick={() =>
                    file.status === "completed" && setSelectedFile(file.id)
                  }
                  className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedFile === file.id
                      ? "bg-green-50 border-l-4 border-green-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate text-sm">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === "processing" && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      )}
                      {file.status === "completed" && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {file.status === "completed" && file.result && (
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-3">
                      <span>{file.result.total_entries} 条记录</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadResult(file);
                        }}
                        className="text-green-600 hover:text-green-700 flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        下载
                      </button>
                    </div>
                  )}
                  {file.status === "error" && (
                    <p className="mt-1 text-xs text-red-500">{file.error}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          {selectedFileData?.result ? (
            <>
              {/* Summary Header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-800">化简结果</h3>
                  <button
                    onClick={() => downloadResult(selectedFileData)}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    下载化简文件
                  </button>
                </div>

                {/* Stats Cards - v3.0 */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-2xl font-bold text-green-600">
                      {selectedFileData.result.summary.total_sequence_groups}
                    </p>
                    <p className="text-xs text-gray-500">序号组数</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedFileData.result.summary.wt_rows}
                    </p>
                    <p className="text-xs text-gray-500">WT行数</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-2xl font-bold text-amber-600">
                      {selectedFileData.result.summary.snp_rows}
                    </p>
                    <p className="text-xs text-gray-500">SNP高亮行</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-2xl font-bold text-red-600">
                      {selectedFileData.result.summary.snp_with_red_bases}
                    </p>
                    <p className="text-xs text-gray-500">有红色碱基</p>
                  </div>
                </div>

                {/* Validation Info */}
                {selectedFileData.result.validation &&
                  !selectedFileData.result.validation.valid && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-medium text-red-700 mb-1">
                        ⚠️ 数据验证问题:
                      </p>
                      <ul className="text-xs text-red-600 list-disc list-inside">
                        {selectedFileData.result.validation.issues.map(
                          (issue, i) => (
                            <li key={i}>{issue}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                {selectedFileData.result.validation?.warnings?.length > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-700 mb-1">
                      ⚠️ 警告:
                    </p>
                    <ul className="text-xs text-yellow-600 list-disc list-inside max-h-20 overflow-y-auto">
                      {selectedFileData.result.validation.warnings
                        .slice(0, 5)
                        .map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      {selectedFileData.result.validation.warnings.length >
                        5 && (
                        <li>
                          ...还有{" "}
                          {selectedFileData.result.validation.warnings.length -
                            5}{" "}
                          条警告
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Search and Filter */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜索序号、参考序列、碱基..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterSNP}
                    onChange={(e) => setFilterSNP(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">全部类型</option>
                    {snpTypes.map((snp) => (
                      <option key={snp} value={snp}>
                        {snp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Results Table - v11 */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">
                        序号
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">
                        参考序列
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">
                        类型
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">
                        高亮颜色
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">
                        <span className="text-red-600">红色20碱基</span>
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">
                        原始列数
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredResults?.map((result, idx) => (
                      <React.Fragment
                        key={`${result.sequence_id}-${result.row_type}-${idx}`}
                      >
                        <tr
                          className={`hover:bg-gray-50 ${
                            result.is_highlighted
                              ? result.highlight_color === "green"
                                ? "bg-green-50"
                                : result.highlight_color === "blue"
                                  ? "bg-blue-50"
                                  : result.highlight_color === "pink"
                                    ? "bg-pink-50"
                                    : "bg-yellow-50"
                              : ""
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {result.sequence_id}
                          </td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                            {result.reference_name}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                result.row_type === "SNP"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {result.row_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {result.highlight_color ? (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  result.highlight_color === "green"
                                    ? "bg-green-100 text-green-700"
                                    : result.highlight_color === "blue"
                                      ? "bg-blue-100 text-blue-700"
                                      : result.highlight_color === "pink"
                                        ? "bg-pink-100 text-pink-700"
                                        : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {result.highlight_color}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {result.red_20_bases &&
                            result.red_20_bases !== "-" ? (
                              <code className="px-2 py-1 bg-yellow-100 text-red-600 rounded font-mono text-xs font-bold">
                                {result.red_20_bases}
                              </code>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {result.original_cols || "-"}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>

                {filteredResults?.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>没有找到匹配的结果</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Dna className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-lg font-medium mb-2">选择一个已处理的文件</p>
                <p className="text-sm">
                  上传并处理基因编辑数据文件后，在这里查看化简结果
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneEditingSimplifier;
