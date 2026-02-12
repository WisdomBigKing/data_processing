'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

interface BatchResult {
  filename: string;
  success: boolean;
  message: string;
  download_id?: string;
  summary?: Array<{
    group: number;
    b_value: number;
    y3_last: number;
    b_group_count: number;
    e_group_count: number;
  }>;
}

interface BatchResponse {
  success: boolean;
  message: string;
  results: BatchResult[];
  summary: {
    total: number;
    success: number;
    failed: number;
  };
}

export default function BatchProcessorPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // 自定义参数
  const [slopeB, setSlopeB] = useState(-0.4823);
  const [slopeE, setSlopeE] = useState(0.4557);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        file => file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      );
      if (droppedFiles.length > 0) {
        setFiles(prev => [...prev, ...droppedFiles]);
        setError(null);
        setResult(null);
      } else {
        setError('请上传Excel文件（.xlsx或.xls格式）');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter(
        file => file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      );
      if (selectedFiles.length > 0) {
        setFiles(prev => [...prev, ...selectedFiles]);
        setError(null);
        setResult(null);
      } else {
        setError('请上传Excel文件（.xlsx或.xls格式）');
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      setError('请先选择文件');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const url = `/api/excel/batch?slope_b=${slopeB}&slope_e=${slopeE}`;

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const data: BatchResponse = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || '处理失败');
      }
    } catch (err) {
      setError(`请求失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (downloadId: string, filename: string) => {
    try {
      const processedFilename = `processed_${filename}`;
      const url = `/api/excel/download/${downloadId}?filename=${encodeURIComponent(processedFilename)}`;
      
      const response = await fetch(url);
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = processedFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(`下载失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  const handleDownloadAll = async () => {
    if (!result) return;
    
    for (const item of result.results) {
      if (item.success && item.download_id) {
        await handleDownload(item.download_id, item.filename);
        // 添加小延迟避免浏览器阻止多个下载
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 标题和返回链接 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              批量 Excel 处理
            </h1>
            <p className="text-gray-600">
              一次上传多个文件，批量进行数据处理
            </p>
          </div>
          <Link
            href="/excel-processor"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回单文件处理
          </Link>
        </div>

        {/* 参数设置 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">⚙️ 计算参数（应用于所有文件）</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                B组斜率 (slope_b)
              </label>
              <input
                type="number"
                step="0.0001"
                value={slopeB}
                onChange={(e) => setSlopeB(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E组斜率 (slope_e)
              </label>
              <input
                type="number"
                step="0.0001"
                value={slopeE}
                onChange={(e) => setSlopeE(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 文件上传区域 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">📁 上传文件</h3>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-gray-400 text-5xl mb-2">📊</div>
            <p className="text-gray-600">
              拖拽多个Excel文件到此处，或
              <label className="text-blue-600 hover:text-blue-800 cursor-pointer underline ml-1">
                点击选择文件
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-sm text-gray-400 mt-2">支持 .xlsx, .xls 格式，可选择多个文件</p>
          </div>

          {/* 已选文件列表 */}
          {files.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-700">已选择 {files.length} 个文件</h4>
                <button
                  onClick={handleReset}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  清空全部
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">📄</span>
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 处理按钮 */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleProcess}
              disabled={files.length === 0 || isProcessing}
              className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                files.length === 0 || isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  批量处理中...
                </span>
              ) : (
                `开始批量处理 (${files.length} 个文件)`
              )}
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-500 text-xl mr-2">⚠️</span>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* 处理结果 */}
        {result && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">✅ 批量处理结果</h3>
              {result.summary.success > 0 && (
                <button
                  onClick={handleDownloadAll}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  下载全部成功文件
                </button>
              )}
            </div>

            {/* 统计摘要 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{result.summary.total}</div>
                <div className="text-sm text-gray-500">总计</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{result.summary.success}</div>
                <div className="text-sm text-green-500">成功</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{result.summary.failed}</div>
                <div className="text-sm text-red-500">失败</div>
              </div>
            </div>

            {/* 详细结果列表 */}
            <div className="space-y-3">
              {result.results.map((item, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-4 ${
                    item.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`text-xl mr-2 ${item.success ? 'text-green-500' : 'text-red-500'}`}>
                        {item.success ? '✓' : '✕'}
                      </span>
                      <div>
                        <div className="font-medium text-gray-800">{item.filename}</div>
                        <div className="text-sm text-gray-500">{item.message}</div>
                      </div>
                    </div>
                    {item.success && item.download_id && (
                      <button
                        onClick={() => handleDownload(item.download_id!, item.filename)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        下载
                      </button>
                    )}
                  </div>
                  
                  {/* 显示摘要信息 */}
                  {item.success && item.summary && item.summary.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="text-sm text-gray-600">
                        {item.summary.map((s, i) => (
                          <span key={i} className="mr-4">
                            组{s.group}: B组{s.b_group_count}点, E组{s.e_group_count}点, b={s.b_value.toFixed(4)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
