'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

interface ProcessingResult {
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
  original_filename?: string;
  params?: {
    slope_b: number;
    slope_e: number;
  };
}

export default function ExcelProcessorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // 自定义参数
  const [slopeB, setSlopeB] = useState(-0.4823);
  const [slopeE, setSlopeE] = useState(0.4557);
  const [useCustomParams, setUseCustomParams] = useState(false);

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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile);
        setError(null);
        setResult(null);
      } else {
        setError('请上传Excel文件（.xlsx或.xls格式）');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      } else {
        setError('请上传Excel文件（.xlsx或.xls格式）');
      }
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setError('请先选择文件');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      let url = '/api/excel/upload';
      
      if (useCustomParams) {
        url = `/api/excel/upload?slope_b=${slopeB}&slope_e=${slopeE}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const data: ProcessingResult = await response.json();
      
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

  const handleDownload = async () => {
    if (!result?.download_id) return;

    try {
      const filename = result.original_filename 
        ? `processed_${result.original_filename}` 
        : 'processed_result.xlsx';
      
      const url = `/api/excel/download/${result.download_id}?filename=${encodeURIComponent(filename)}`;
      
      const response = await fetch(url);
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(`下载失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Excel 数据处理器
            </h1>
            <p className="text-gray-600">
              上传Excel文件，自动计算线性/非线性分离数据
            </p>
          </div>
          <Link
            href="/excel-processor/batch"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            批量处理
          </Link>
        </div>

        {/* 计算公式说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">📐 计算公式说明</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>B组：</strong>y3 = {slopeB} × x1（线性部分），y5 = y1 - y3（非线性部分）</p>
            <p><strong>E组：</strong>y4 = {slopeE} × x2 + b（线性部分），y6 = y2 - y4（非线性部分）</p>
            <p><strong>b值计算：</strong>使用B组最后一个点的y3值，代入E组公式计算得到</p>
          </div>
        </div>

        {/* 参数设置 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">⚙️ 计算参数</h3>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomParams}
                onChange={(e) => setUseCustomParams(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-600">使用自定义参数</span>
            </label>
          </div>
          
          <div className={`grid grid-cols-2 gap-4 ${!useCustomParams ? 'opacity-50' : ''}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                B组斜率 (slope_b)
              </label>
              <input
                type="number"
                step="0.0001"
                value={slopeB}
                onChange={(e) => setSlopeB(parseFloat(e.target.value))}
                disabled={!useCustomParams}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                disabled={!useCustomParams}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                : file 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-2">
                <div className="text-green-600 text-5xl mb-2">✓</div>
                <p className="text-lg font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <button
                  onClick={handleReset}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  移除文件
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-gray-400 text-5xl mb-2">📊</div>
                <p className="text-gray-600">
                  拖拽Excel文件到此处，或
                  <label className="text-blue-600 hover:text-blue-800 cursor-pointer underline ml-1">
                    点击选择文件
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-sm text-gray-400">支持 .xlsx, .xls 格式</p>
              </div>
            )}
          </div>

          {/* 处理按钮 */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleProcess}
              disabled={!file || isProcessing}
              className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                !file || isProcessing
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
                  处理中...
                </span>
              ) : (
                '开始处理'
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
        {result && result.success && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">✅ 处理结果</h3>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                下载结果文件
              </button>
            </div>

            <p className="text-gray-600 mb-4">{result.message}</p>

            {/* 结果摘要表格 */}
            {result.summary && result.summary.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        组号
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        B组数据点
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        E组数据点
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        y3最后值
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        计算得到的b值
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.summary.map((item) => (
                      <tr key={item.group}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          组 {item.group}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {item.b_group_count} 个
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {item.e_group_count} 个
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {item.y3_last.toFixed(6)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {item.b_value.toFixed(6)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 使用的参数 */}
            {result.params && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>使用的参数：</strong>
                  B组斜率 = {result.params.slope_b}，
                  E组斜率 = {result.params.slope_e}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 数据格式说明 */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">📋 数据格式要求</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Excel文件应包含以下列：<code className="bg-gray-200 px-1 rounded">x1, y1, x2, y2</code></p>
            <p>• x1, y1 为B组数据；x2, y2 为E组数据</p>
            <p>• 支持多组数据，按列顺序排列</p>
            <p>• 数据可以有不同的长度，程序会自动处理</p>
          </div>
        </div>

        {/* 计算流程图 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-800 mb-4">🔄 计算流程</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
            <div className="bg-blue-100 rounded-lg p-3 text-center">
              <div className="font-medium text-blue-800">B组数据</div>
              <div className="text-blue-600">x1, y1</div>
            </div>
            <div className="text-gray-400">→</div>
            <div className="bg-green-100 rounded-lg p-3 text-center">
              <div className="font-medium text-green-800">计算y3</div>
              <div className="text-green-600">y3 = {slopeB} × x1</div>
            </div>
            <div className="text-gray-400">→</div>
            <div className="bg-purple-100 rounded-lg p-3 text-center">
              <div className="font-medium text-purple-800">计算b值</div>
              <div className="text-purple-600">b = y3_last - {slopeE} × x2_first</div>
            </div>
            <div className="text-gray-400">→</div>
            <div className="bg-orange-100 rounded-lg p-3 text-center">
              <div className="font-medium text-orange-800">E组计算</div>
              <div className="text-orange-600">y4 = {slopeE} × x2 + b</div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm mt-4">
            <div className="bg-teal-100 rounded-lg p-3 text-center">
              <div className="font-medium text-teal-800">B组非线性</div>
              <div className="text-teal-600">y5 = y1 - y3</div>
            </div>
            <div className="text-gray-400 hidden md:block">+</div>
            <div className="bg-pink-100 rounded-lg p-3 text-center">
              <div className="font-medium text-pink-800">E组非线性</div>
              <div className="text-pink-600">y6 = y2 - y4</div>
            </div>
            <div className="text-gray-400">→</div>
            <div className="bg-gray-200 rounded-lg p-3 text-center">
              <div className="font-medium text-gray-800">输出结果</div>
              <div className="text-gray-600">Excel文件</div>
            </div>
          </div>
        </div>

        {/* 历史记录提示 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 提示：处理后的文件会临时保存，请及时下载。刷新页面后需要重新处理。</p>
        </div>
      </div>
    </div>
  );
}
