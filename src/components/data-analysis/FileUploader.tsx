'use client';

import React, { useCallback, useState } from 'react';
import { useDataAnalysisStore } from '@/store/data-analysis-store';
import type { DataFile, ColumnInfo } from './types';
import { v4 as uuidv4 } from 'uuid';
import {
  Upload,
  File,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';

const parseCSV = (text: string): { data: Record<string, unknown>[]; columns: string[] } => {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return { data: [], columns: [] };

  const columns = lines[0].split(',').map((col) => col.trim().replace(/^"|"$/g, ''));
  const data: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((val) => val.trim().replace(/^"|"$/g, ''));
    const row: Record<string, unknown> = {};
    columns.forEach((col, index) => {
      const value = values[index];
      // Try to parse as number
      const numValue = parseFloat(value);
      row[col] = isNaN(numValue) ? value : numValue;
    });
    data.push(row);
  }

  return { data, columns };
};

const inferColumnType = (values: unknown[]): ColumnInfo['type'] => {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'string';

  const types = nonNullValues.map((v) => {
    if (typeof v === 'number') return 'number';
    if (typeof v === 'boolean') return 'boolean';
    if (typeof v === 'string') {
      if (!isNaN(Date.parse(v))) return 'date';
      if (!isNaN(parseFloat(v))) return 'number';
    }
    return 'string';
  });

  const uniqueTypes = [...new Set(types)];
  if (uniqueTypes.length === 1) return uniqueTypes[0];
  if (uniqueTypes.length === 2 && uniqueTypes.includes('number') && uniqueTypes.includes('string')) {
    return 'mixed';
  }
  return 'mixed';
};

const analyzeColumns = (data: Record<string, unknown>[], columnNames: string[]): ColumnInfo[] => {
  return columnNames.map((name) => {
    const values = data.map((row) => row[name]);
    const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');
    const uniqueValues = [...new Set(nonNullValues.map(String))];

    return {
      name,
      type: inferColumnType(values),
      sampleValues: nonNullValues.slice(0, 5),
      nullCount: values.length - nonNullValues.length,
      uniqueCount: uniqueValues.length,
    };
  });
};

export const FileUploader: React.FC = () => {
  const { files, addFile, removeFile, clearFiles, selectedFileIds, toggleFileSelection } =
    useDataAnalysisStore();
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      const fileId = uuidv4();
      const newFile: DataFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        data: null,
        columns: [],
        previewData: [],
        status: 'uploading',
      };

      addFile(newFile);

      try {
        const text = await file.text();
        const { data, columns } = parseCSV(text);

        if (data.length === 0) {
          throw new Error('文件为空或格式不正确');
        }

        const columnInfo = analyzeColumns(data, columns);
        const previewData = data.slice(0, 10);

        useDataAnalysisStore.getState().updateFile(fileId, {
          data,
          columns: columnInfo,
          previewData,
          status: 'ready',
        });
      } catch (error) {
        useDataAnalysisStore.getState().updateFile(fileId, {
          status: 'error',
          error: error instanceof Error ? error.message : '处理文件时出错',
        });
      }
    },
    [addFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (file) =>
          file.type === 'text/csv' ||
          file.name.endsWith('.csv') ||
          file.type === 'application/vnd.ms-excel' ||
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.xls')
      );

      droppedFiles.forEach(processFile);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      selectedFiles.forEach(processFile);
      e.target.value = '';
    },
    [processFile]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = (status: DataFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            拖拽文件到此处或点击上传
          </p>
          <p className="text-sm text-gray-500">支持 CSV、Excel 文件，可同时上传多个文件</p>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-800">
              已上传文件 ({files.length})
            </h3>
            <button
              onClick={clearFiles}
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              清空全部
            </button>
          </div>

          <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  selectedFileIds.includes(file.id) ? 'bg-blue-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFileIds.includes(file.id)}
                  onChange={() => toggleFileSelection(file.id)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      {file.status === 'ready' && file.data && (
                        <>
                          <span>•</span>
                          <span>{file.data.length} 行</span>
                          <span>•</span>
                          <span>{file.columns.length} 列</span>
                        </>
                      )}
                      {file.status === 'error' && (
                        <span className="text-red-500">{file.error}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusIcon(file.status)}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
