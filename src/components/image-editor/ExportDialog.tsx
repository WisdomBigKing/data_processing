"use client";

import React, { useState } from "react";
import { useEditorStore } from "@/store/editor-store";
import { X, Download, Settings } from "lucide-react";
import type { ExportOptions } from "./types";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { canvas, canvasWidth, canvasHeight } = useEditorStore();

  const [options, setOptions] = useState<ExportOptions>({
    format: "png",
    quality: 1,
    dpi: 300,
    width: canvasWidth,
    height: canvasHeight,
    exportArea: "all",
  });

  const [fileName, setFileName] = useState("image");
  const [useCustomSize, setUseCustomSize] = useState(false);

  const handleExport = () => {
    if (!canvas) return;

    const multiplier = options.dpi / 72;
    const exportWidth = useCustomSize
      ? options.width || canvasWidth
      : canvasWidth;
    const exportHeight = useCustomSize
      ? options.height || canvasHeight
      : canvasHeight;

    const dataUrl = canvas.toDataURL({
      format: options.format === "jpg" ? "jpeg" : "png",
      quality: options.quality,
      multiplier: multiplier * (exportWidth / canvasWidth),
    });

    const link = document.createElement("a");
    link.download = `${fileName}.${options.format}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onClose();
  };

  const calculateOutputSize = () => {
    const multiplier = options.dpi / 72;
    const baseWidth = useCustomSize
      ? options.width || canvasWidth
      : canvasWidth;
    const baseHeight = useCustomSize
      ? options.height || canvasHeight
      : canvasHeight;
    return {
      width: Math.round(baseWidth * multiplier),
      height: Math.round(baseHeight * multiplier),
    };
  };

  const outputSize = calculateOutputSize();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Download size={20} />
            导出图片
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* File Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              文件名
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入文件名"
            />
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              导出格式
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setOptions({ ...options, format: "png" })}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  options.format === "png"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                PNG
              </button>
              <button
                onClick={() => setOptions({ ...options, format: "jpg" })}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  options.format === "jpg"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                JPG
              </button>
            </div>
          </div>

          {/* Quality (for JPG) */}
          {options.format === "jpg" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                质量: {Math.round(options.quality * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={options.quality}
                onChange={(e) =>
                  setOptions({ ...options, quality: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>
          )}

          {/* DPI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分辨率 (DPI)
            </label>
            <div className="flex gap-2">
              {[72, 150, 300, 600].map((dpi) => (
                <button
                  key={dpi}
                  onClick={() => setOptions({ ...options, dpi })}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${
                    options.dpi === dpi
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {dpi}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={options.dpi}
              onChange={(e) =>
                setOptions({
                  ...options,
                  dpi: Math.max(72, Number(e.target.value)),
                })
              }
              min="72"
              max="1200"
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Custom Size */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <input
                type="checkbox"
                checked={useCustomSize}
                onChange={(e) => setUseCustomSize(e.target.checked)}
                className="rounded border-gray-300"
              />
              自定义尺寸
            </label>
            {useCustomSize && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    宽度 (px)
                  </label>
                  <input
                    type="number"
                    value={options.width || canvasWidth}
                    onChange={(e) =>
                      setOptions({ ...options, width: Number(e.target.value) })
                    }
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    高度 (px)
                  </label>
                  <input
                    type="number"
                    value={options.height || canvasHeight}
                    onChange={(e) =>
                      setOptions({ ...options, height: Number(e.target.value) })
                    }
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Output Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Settings size={16} />
              <span className="font-medium">输出信息</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">输出尺寸:</span>
                <span className="ml-1 font-medium">
                  {outputSize.width} × {outputSize.height} px
                </span>
              </div>
              <div>
                <span className="text-gray-500">分辨率:</span>
                <span className="ml-1 font-medium">{options.dpi} DPI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            导出
          </button>
        </div>
      </div>
    </div>
  );
};
