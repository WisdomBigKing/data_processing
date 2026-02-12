'use client';

import React, { useState } from 'react';
import { useDataAnalysisStore } from '@/store/data-analysis-store';
import type { DataFile } from './types';
import { Table, Eye, ChevronDown, ChevronUp, Hash, Type, Calendar, ToggleLeft } from 'lucide-react';

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'number':
      return <Hash className="w-3 h-3" />;
    case 'string':
      return <Type className="w-3 h-3" />;
    case 'date':
      return <Calendar className="w-3 h-3" />;
    case 'boolean':
      return <ToggleLeft className="w-3 h-3" />;
    default:
      return <Type className="w-3 h-3" />;
  }
};

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'number':
      return 'bg-blue-100 text-blue-700';
    case 'string':
      return 'bg-green-100 text-green-700';
    case 'date':
      return 'bg-purple-100 text-purple-700';
    case 'boolean':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

interface FilePreviewProps {
  file: DataFile;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showColumns, setShowColumns] = useState(true);

  if (file.status !== 'ready' || !file.data) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Table className="w-5 h-5 text-gray-500" />
          <div>
            <h4 className="font-medium text-gray-800">{file.name}</h4>
            <p className="text-sm text-gray-500">
              {file.data.length} 行 × {file.columns.length} 列
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Column Info Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowColumns(!showColumns)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                showColumns
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              列信息
            </button>
            <button
              onClick={() => setShowColumns(false)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                !showColumns
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              数据预览
            </button>
          </div>

          {showColumns ? (
            /* Column Info */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {file.columns.map((col) => (
                <div
                  key={col.name}
                  className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800 truncate">{col.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${getTypeBadgeColor(
                        col.type
                      )}`}
                    >
                      {getTypeIcon(col.type)}
                      {col.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>唯一值:</span>
                      <span className="font-medium">{col.uniqueCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>空值:</span>
                      <span className="font-medium">{col.nullCount}</span>
                    </div>
                    {col.sampleValues.length > 0 && (
                      <div className="mt-2">
                        <span className="text-gray-400">样例: </span>
                        <span className="text-gray-600">
                          {col.sampleValues.slice(0, 3).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Data Preview Table */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left text-gray-600 font-medium">#</th>
                    {file.columns.map((col) => (
                      <th
                        key={col.name}
                        className="px-3 py-2 text-left text-gray-600 font-medium whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1">
                          {getTypeIcon(col.type)}
                          {col.name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {file.previewData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-400">{rowIndex + 1}</td>
                      {file.columns.map((col) => (
                        <td
                          key={col.name}
                          className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[200px] truncate"
                        >
                          {String(row[col.name] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {file.data.length > 10 && (
                <div className="text-center py-2 text-sm text-gray-500 bg-gray-50">
                  显示前 10 行，共 {file.data.length} 行
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const DataPreview: React.FC = () => {
  const { files, selectedFileIds } = useDataAnalysisStore();
  const selectedFiles = files.filter(
    (f) => selectedFileIds.includes(f.id) && f.status === 'ready'
  );

  if (selectedFiles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>选择文件以预览数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedFiles.map((file) => (
        <FilePreview key={file.id} file={file} />
      ))}
    </div>
  );
};
