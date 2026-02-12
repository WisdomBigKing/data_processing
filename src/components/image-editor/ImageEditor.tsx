"use client";

import React, { useState, useRef, useCallback } from "react";
import * as fabric from "fabric";
import { useEditorStore } from "@/store/editor-store";
import { Toolbar } from "./Toolbar";
import { CanvasEditor } from "./CanvasEditor";
import { PropertiesPanel } from "./PropertiesPanel";
import { LayersPanel } from "./LayersPanel";
import { ExportDialog } from "./ExportDialog";
import { v4 as uuidv4 } from "uuid";
import { X, Settings, Maximize2 } from "lucide-react";

export const ImageEditor: React.FC = () => {
  const {
    canvas,
    updateLayers,
    addToHistory,
    canvasWidth,
    canvasHeight,
    setCanvasSize,
  } = useEditorStore();

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showCanvasSettings, setShowCanvasSettings] = useState(false);
  const [tempWidth, setTempWidth] = useState(canvasWidth);
  const [tempHeight, setTempHeight] = useState(canvasHeight);
  const [activePanel, setActivePanel] = useState<"properties" | "layers">(
    "properties",
  );

  const svgInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImportSVG = useCallback(() => {
    svgInputRef.current?.click();
  }, []);

  const handleImportImage = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  // 检查对象是否为文字类型
  const isTextObject = (obj: fabric.FabricObject): boolean => {
    // 检查类型名称（可能是 text, textbox, i-text, FabricText 等）
    const type = obj.type?.toLowerCase() || "";
    if (type.includes("text")) return true;

    // 检查是否有 text 属性（fabric.js 文字对象的特征）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyObj = obj as any;
    if (typeof anyObj.text === "string" && anyObj.text.length > 0) return true;

    // 检查是否是 fabric.Text 的实例
    if (
      obj instanceof fabric.Text ||
      obj instanceof fabric.IText ||
      obj instanceof fabric.Textbox
    ) {
      return true;
    }

    return false;
  };

  // 递归转换SVG中的文字元素为可编辑的IText
  const convertTextElements = (
    objects: fabric.FabricObject[],
  ): fabric.FabricObject[] => {
    return objects.map((obj) => {
      // 处理文字类型的对象
      if (isTextObject(obj)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const textObj = obj as any;
        const textContent = textObj.text || textObj.textLines?.join("\n") || "";

        // 如果已经是 IText，直接返回
        if (obj.type === "i-text") {
          (textObj as any).id = uuidv4();
          return obj;
        }

        // 转换为可编辑的IText
        const itext = new fabric.IText(textContent, {
          left: textObj.left,
          top: textObj.top,
          fontSize: textObj.fontSize || 16,
          fontFamily: textObj.fontFamily || "Arial",
          fill: textObj.fill || "#000000",
          fontWeight: textObj.fontWeight,
          fontStyle: textObj.fontStyle,
          textAlign: textObj.textAlign,
          angle: textObj.angle || 0,
          scaleX: textObj.scaleX || 1,
          scaleY: textObj.scaleY || 1,
          originX: textObj.originX || "left",
          originY: textObj.originY || "top",
          charSpacing: textObj.charSpacing,
          lineHeight: textObj.lineHeight,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (itext as any).id = uuidv4();
        console.log("[SVG导入] 文字转换:", textContent, "类型:", obj.type);
        return itext;
      }

      // 递归处理Group内的对象
      if (obj.type === "group") {
        const group = obj as fabric.Group;
        const groupObjects = group.getObjects ? group.getObjects() : [];
        const convertedObjects = convertTextElements(groupObjects);

        // 清空并重新添加转换后的对象
        group.remove(...groupObjects);
        convertedObjects.forEach((converted) => group.add(converted));
        return group;
      }

      return obj;
    });
  };

  const processSVGFile = useCallback(
    async (file: File) => {
      if (!canvas) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const svgString = e.target?.result as string;

        try {
          // fabric.js v6 uses async loadSVGFromString
          const result = await fabric.loadSVGFromString(svgString);

          // 转换文字元素为可编辑的IText
          const filteredObjects = result.objects.filter(
            Boolean,
          ) as fabric.FabricObject[];
          const convertedObjects = convertTextElements(filteredObjects);

          const svgGroup = new fabric.Group(convertedObjects);

          // Scale to fit canvas if too large
          const maxWidth = canvasWidth * 0.8;
          const maxHeight = canvasHeight * 0.8;

          if (svgGroup.width && svgGroup.height) {
            const scale = Math.min(
              maxWidth / svgGroup.width,
              maxHeight / svgGroup.height,
              1,
            );
            svgGroup.scale(scale);
          }

          svgGroup.set({
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            originX: "center",
            originY: "center",
            subTargetCheck: true, // 允许选中子元素
          });

          (svgGroup as fabric.Group & { id: string }).id = uuidv4();
          canvas.add(svgGroup);
          canvas.setActiveObject(svgGroup);
          canvas.renderAll();
          updateLayers();
          addToHistory(JSON.stringify(canvas.toJSON()));
        } catch (error) {
          console.error("Failed to load SVG:", error);
        }
      };
      reader.readAsText(file);
    },
    [canvas, canvasWidth, canvasHeight, updateLayers, addToHistory],
  );

  const processImageFile = useCallback(
    async (file: File) => {
      if (!canvas) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;

        try {
          // fabric.js v6 uses async Image.fromURL
          const img = await fabric.FabricImage.fromURL(dataUrl);

          // Scale to fit canvas if too large
          const maxWidth = canvasWidth * 0.8;
          const maxHeight = canvasHeight * 0.8;

          if (img.width && img.height) {
            const scale = Math.min(
              maxWidth / img.width,
              maxHeight / img.height,
              1,
            );
            img.scale(scale);
          }

          img.set({
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            originX: "center",
            originY: "center",
          });

          (img as fabric.FabricImage & { id: string }).id = uuidv4();
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
          updateLayers();
          addToHistory(JSON.stringify(canvas.toJSON()));
        } catch (error) {
          console.error("Failed to load image:", error);
        }
      };
      reader.readAsDataURL(file);
    },
    [canvas, canvasWidth, canvasHeight, updateLayers, addToHistory],
  );

  const handleSVGChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processSVGFile(file);
      }
      e.target.value = "";
    },
    [processSVGFile],
  );

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processImageFile(file);
      }
      e.target.value = "";
    },
    [processImageFile],
  );

  const handleCanvasSizeChange = () => {
    setCanvasSize(tempWidth, tempHeight);
    setShowCanvasSettings(false);
  };

  // Common preset sizes
  const presetSizes = [
    { name: "A4 横向 (300DPI)", width: 3508, height: 2480 },
    { name: "A4 纵向 (300DPI)", width: 2480, height: 3508 },
    { name: "1080P", width: 1920, height: 1080 },
    { name: "4K", width: 3840, height: 2160 },
    { name: "正方形", width: 1000, height: 1000 },
    { name: "微信封面", width: 900, height: 500 },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Hidden file inputs */}
      <input
        ref={svgInputRef}
        type="file"
        accept=".svg,.ai"
        onChange={handleSVGChange}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />

      {/* Toolbar */}
      <Toolbar
        onImportSVG={handleImportSVG}
        onImportImage={handleImportImage}
        onExport={() => setShowExportDialog(true)}
      />

      {/* Canvas Settings Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCanvasSettings(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Maximize2 size={14} />
            画布: {canvasWidth} × {canvasHeight} px
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePanel("properties")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activePanel === "properties"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            属性
          </button>
          <button
            onClick={() => setActivePanel("layers")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activePanel === "layers"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            图层
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <CanvasEditor />

        {/* Right Panel */}
        {activePanel === "properties" ? <PropertiesPanel /> : <LayersPanel />}
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />

      {/* Canvas Settings Dialog */}
      {showCanvasSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Settings size={20} />
                画布设置
              </h2>
              <button
                onClick={() => setShowCanvasSettings(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Preset Sizes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  预设尺寸
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {presetSizes.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setTempWidth(preset.width);
                        setTempHeight(preset.height);
                      }}
                      className={`p-2 text-sm border rounded-lg transition-colors ${
                        tempWidth === preset.width &&
                        tempHeight === preset.height
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    宽度 (px)
                  </label>
                  <input
                    type="number"
                    value={tempWidth}
                    onChange={(e) => setTempWidth(Number(e.target.value))}
                    min="100"
                    max="10000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    高度 (px)
                  </label>
                  <input
                    type="number"
                    value={tempHeight}
                    onChange={(e) => setTempHeight(Number(e.target.value))}
                    min="100"
                    max="10000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowCanvasSettings(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCanvasSizeChange}
                className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              >
                应用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
