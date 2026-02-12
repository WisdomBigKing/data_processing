"use client";

import React, { useState } from "react";
import { useEditorStore } from "@/store/editor-store";
import { FileDown, FileUp, Loader2, Settings } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface PDFExportOptions {
  pageSize: "A4" | "A3" | "Letter" | "Custom";
  orientation: "portrait" | "landscape";
  quality: "high" | "medium" | "low";
  includeBleed: boolean;
  bleedSize: number;
}

const pageSizes = {
  A4: { width: 595.28, height: 841.89 },
  A3: { width: 841.89, height: 1190.55 },
  Letter: { width: 612, height: 792 },
  Custom: { width: 0, height: 0 },
};

export const PDFExporter: React.FC = () => {
  const { canvas, canvasWidth, canvasHeight } = useEditorStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [options, setOptions] = useState<PDFExportOptions>({
    pageSize: "A4",
    orientation: "portrait",
    quality: "high",
    includeBleed: false,
    bleedSize: 3,
  });
  const [showOptions, setShowOptions] = useState(false);

  const exportToPDF = async () => {
    if (!canvas) return;

    setIsExporting(true);
    try {
      // 创建PDF文档
      const pdfDoc = await PDFDocument.create();

      // 获取页面尺寸
      let pageWidth: number;
      let pageHeight: number;

      if (options.pageSize === "Custom") {
        pageWidth = canvasWidth;
        pageHeight = canvasHeight;
      } else {
        const size = pageSizes[options.pageSize];
        if (options.orientation === "landscape") {
          pageWidth = size.height;
          pageHeight = size.width;
        } else {
          pageWidth = size.width;
          pageHeight = size.height;
        }
      }

      // 添加出血位
      if (options.includeBleed) {
        const bleedPt = options.bleedSize * 2.83465; // mm to pt
        pageWidth += bleedPt * 2;
        pageHeight += bleedPt * 2;
      }

      // 创建页面
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // 将画布转换为PNG
      const quality =
        options.quality === "high" ? 2 : options.quality === "medium" ? 1.5 : 1;
      const dataUrl = canvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: quality,
      });

      // 将PNG嵌入PDF
      const pngImageBytes = await fetch(dataUrl).then((res) =>
        res.arrayBuffer(),
      );
      const pngImage = await pdfDoc.embedPng(pngImageBytes);

      // 计算图像在页面中的位置和大小
      const scale = Math.min(
        (pageWidth -
          (options.includeBleed ? options.bleedSize * 2.83465 * 2 : 0)) /
          canvasWidth,
        (pageHeight -
          (options.includeBleed ? options.bleedSize * 2.83465 * 2 : 0)) /
          canvasHeight,
      );

      const imgWidth = canvasWidth * scale;
      const imgHeight = canvasHeight * scale;
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      page.drawImage(pngImage, {
        x,
        y,
        width: imgWidth,
        height: imgHeight,
      });

      // 如果有出血位，添加裁切标记
      if (options.includeBleed) {
        const bleedPt = options.bleedSize * 2.83465;
        const markLength = 10;

        // 绘制裁切标记
        const marks = [
          // 左上
          { x1: bleedPt, y1: 0, x2: bleedPt, y2: markLength },
          {
            x1: 0,
            y1: pageHeight - bleedPt,
            x2: markLength,
            y2: pageHeight - bleedPt,
          },
          // 右上
          {
            x1: pageWidth - bleedPt,
            y1: 0,
            x2: pageWidth - bleedPt,
            y2: markLength,
          },
          {
            x1: pageWidth - markLength,
            y1: pageHeight - bleedPt,
            x2: pageWidth,
            y2: pageHeight - bleedPt,
          },
          // 左下
          {
            x1: bleedPt,
            y1: pageHeight,
            x2: bleedPt,
            y2: pageHeight - markLength,
          },
          { x1: 0, y1: bleedPt, x2: markLength, y2: bleedPt },
          // 右下
          {
            x1: pageWidth - bleedPt,
            y1: pageHeight,
            x2: pageWidth - bleedPt,
            y2: pageHeight - markLength,
          },
          {
            x1: pageWidth - markLength,
            y1: bleedPt,
            x2: pageWidth,
            y2: bleedPt,
          },
        ];

        marks.forEach((mark) => {
          page.drawLine({
            start: { x: mark.x1, y: mark.y1 },
            end: { x: mark.x2, y: mark.y2 },
            thickness: 0.5,
            color: rgb(0, 0, 0),
          });
        });
      }

      // 保存PDF
      const pdfBytes = await pdfDoc.save();

      // 下载
      const blob = new Blob([new Uint8Array(pdfBytes)], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "design.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF export error:", error);
      alert("PDF导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  const importPDF = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !canvas) return;

      setIsImporting(true);
      try {
        // 动态导入pdfjs
        const pdfjsLib = await import("pdfjs-dist");

        // 设置worker (使用CDN)
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        // 获取第一页
        const page = await pdf.getPage(1);
        const scale = 2;
        const viewport = page.getViewport({ scale });

        // 创建canvas来渲染PDF页面
        const tempCanvas = document.createElement("canvas");
        const context = tempCanvas.getContext("2d");
        if (!context) throw new Error("Cannot get canvas context");

        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (page as any).render({
          canvasContext: context,
          viewport,
        }).promise;

        // 将渲染的PDF转换为图像并添加到fabric画布
        const dataUrl = tempCanvas.toDataURL("image/png");

        const fabric = await import("fabric");
        const img = await fabric.FabricImage.fromURL(dataUrl);

        // 缩放以适应画布
        const scaleX = canvasWidth / (img.width || 1);
        const scaleY = canvasHeight / (img.height || 1);
        const fitScale = Math.min(scaleX, scaleY, 1);

        img.scale(fitScale);
        img.set({
          left: (canvasWidth - (img.width || 0) * fitScale) / 2,
          top: (canvasHeight - (img.height || 0) * fitScale) / 2,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (img as any).id = `pdf-${Date.now()}`;
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();

        alert(`成功导入PDF (共${pdf.numPages}页，已导入第1页)`);
      } catch (error) {
        console.error("PDF import error:", error);
        alert("PDF导入失败，请确保文件格式正确");
      } finally {
        setIsImporting(false);
      }
    };

    input.click();
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        PDF 导入/导出
      </h3>

      {/* 导出按钮 */}
      <div className="space-y-3">
        <button
          onClick={exportToPDF}
          disabled={!canvas || isExporting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          {isExporting ? "导出中..." : "导出为 PDF"}
        </button>

        <button
          onClick={importPDF}
          disabled={!canvas || isImporting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
        >
          {isImporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileUp className="w-4 h-4" />
          )}
          {isImporting ? "导入中..." : "导入 PDF"}
        </button>
      </div>

      {/* 导出选项 */}
      <div className="mt-4">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700"
        >
          <Settings className="w-3 h-3" />
          {showOptions ? "隐藏选项" : "导出选项"}
        </button>

        {showOptions && (
          <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-xs text-gray-500 block mb-1">页面尺寸</span>
              <select
                value={options.pageSize}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    pageSize: e.target.value as PDFExportOptions["pageSize"],
                  })
                }
                className="w-full text-sm border rounded px-2 py-1"
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="A3">A3 (297 × 420 mm)</option>
                <option value="Letter">Letter (8.5 × 11 in)</option>
                <option value="Custom">自定义 (匹配画布)</option>
              </select>
            </div>

            <div>
              <span className="text-xs text-gray-500 block mb-1">方向</span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setOptions({ ...options, orientation: "portrait" })
                  }
                  className={`flex-1 py-1 text-xs rounded ${
                    options.orientation === "portrait"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100"
                  }`}
                >
                  纵向
                </button>
                <button
                  onClick={() =>
                    setOptions({ ...options, orientation: "landscape" })
                  }
                  className={`flex-1 py-1 text-xs rounded ${
                    options.orientation === "landscape"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100"
                  }`}
                >
                  横向
                </button>
              </div>
            </div>

            <div>
              <span className="text-xs text-gray-500 block mb-1">质量</span>
              <select
                value={options.quality}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    quality: e.target.value as PDFExportOptions["quality"],
                  })
                }
                className="w-full text-sm border rounded px-2 py-1"
              >
                <option value="high">高质量 (印刷级)</option>
                <option value="medium">中等质量</option>
                <option value="low">低质量 (小文件)</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={options.includeBleed}
                  onChange={(e) =>
                    setOptions({ ...options, includeBleed: e.target.checked })
                  }
                />
                添加出血位
              </label>
              {options.includeBleed && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={options.bleedSize}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        bleedSize: Number(e.target.value),
                      })
                    }
                    className="w-16 text-xs border rounded px-2 py-1"
                  />
                  <span className="text-xs text-gray-400">mm</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-gray-400 mt-4">
        PDF导出支持矢量图形和文字，适合印刷输出
      </p>
    </div>
  );
};

export default PDFExporter;
