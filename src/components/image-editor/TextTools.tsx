"use client";

import React, { useState, useEffect } from "react";
import * as fabric from "fabric";
import { useEditorStore } from "@/store/editor-store";
import { DEFAULT_FONTS } from "./types";
import {
  Type,
  AlignLeft,
  Spline,
  FileText,
  Bold,
  Italic,
  Underline,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";

type TextType = "point" | "area" | "path";

export const TextTools: React.FC = () => {
  const { canvas, activeObject, foregroundColor, addToHistory, updateLayers } =
    useEditorStore();
  const [textType, setTextType] = useState<TextType>("point");
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [lineHeight, setLineHeight] = useState(1.2);
  const [charSpacing, setCharSpacing] = useState(0);

  // 同步选中文字的字体和字号
  useEffect(() => {
    if (
      activeObject &&
      (activeObject.type === "i-text" || activeObject.type === "textbox")
    ) {
      const textObj = activeObject as fabric.IText;
      if (textObj.fontFamily) setFontFamily(textObj.fontFamily);
      if (textObj.fontSize) setFontSize(textObj.fontSize);
      if (textObj.lineHeight) setLineHeight(textObj.lineHeight);
      if (textObj.charSpacing !== undefined)
        setCharSpacing(textObj.charSpacing / 10);
    }
  }, [activeObject]);

  // 使用统一的字体列表
  const fonts = DEFAULT_FONTS;

  const createPointText = () => {
    if (!canvas) return;

    // 计算画布中心位置
    const centerX = (canvas.width || 800) / 2;
    const centerY = (canvas.height || 600) / 2;

    const text = new fabric.IText("点击编辑文字", {
      left: centerX - 50,
      top: centerY - 12,
      fontSize,
      fontFamily,
      fill: foregroundColor,
      lineHeight,
      charSpacing: charSpacing * 10,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (text as any).id = `text-${Date.now()}`;
    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    canvas.renderAll();
    updateLayers();
    addToHistory(JSON.stringify(canvas.toJSON()));
  };

  const createAreaText = () => {
    if (!canvas) return;

    // 计算画布中心位置
    const centerX = (canvas.width || 800) / 2;
    const centerY = (canvas.height || 600) / 2;

    const textbox = new fabric.Textbox(
      "这是区域文字，可以自动换行。双击编辑内容，拖动边框调整文本区域大小。",
      {
        left: centerX - 125,
        top: centerY - 50,
        width: 250,
        fontSize,
        fontFamily,
        fill: foregroundColor,
        lineHeight,
        charSpacing: charSpacing * 10,
        textAlign: "left",
      },
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (textbox as any).id = `textbox-${Date.now()}`;
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.renderAll();
    updateLayers();
    addToHistory(JSON.stringify(canvas.toJSON()));
  };

  const createPathText = () => {
    if (!canvas) return;

    // 创建一个弧形路径
    const pathData = "M 50 200 Q 200 50 350 200";

    // 先创建路径对象以获取其形状
    const pathObject = new fabric.Path(pathData, {
      fill: "transparent",
      stroke: "#CCCCCC",
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
    });

    // 使用 fabric.Text 并手动设置路径
    // 注意：Fabric.js v6 的路径文字实现可能不同
    const text = new fabric.IText("沿路径排列的文字效果", {
      left: 200,
      top: 150,
      fontSize,
      fontFamily,
      fill: foregroundColor,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (text as any).id = `pathtext-${Date.now()}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pathObject as any).id = `textpath-${Date.now()}`;

    canvas.add(pathObject);
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    updateLayers();
    addToHistory(JSON.stringify(canvas.toJSON()));
  };

  const convertTextToPath = () => {
    if (!canvas || !activeObject) return;
    if (activeObject.type !== "i-text" && activeObject.type !== "textbox") {
      alert("请先选择文字对象");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textObj = activeObject as any;

    // 使用 fabric.js 的 toSVG 方法获取文字的 SVG 路径
    const svgString = textObj.toSVG();

    // 解析 SVG 并创建路径组
    fabric.loadSVGFromString(svgString).then(({ objects }) => {
      if (objects.length > 0) {
        const group = new fabric.Group(
          objects.filter(Boolean) as fabric.Object[],
          {
            left: textObj.left,
            top: textObj.top,
          },
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (group as any).id = `textpath-${Date.now()}`;

        canvas.remove(textObj);
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.renderAll();
        updateLayers();
        addToHistory(JSON.stringify(canvas.toJSON()));
      }
    });
  };

  const updateTextProperty = (property: string, value: unknown) => {
    if (!canvas || !activeObject) return;
    if (activeObject.type !== "i-text" && activeObject.type !== "textbox")
      return;

    activeObject.set(property as keyof fabric.Object, value);
    canvas.renderAll();
  };

  const isTextObject =
    activeObject?.type === "i-text" || activeObject?.type === "textbox";

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-white mb-4">文字工具</h3>

      {/* 文字类型选择 */}
      <div className="mb-4">
        <span className="text-xs text-gray-500 block mb-2">创建文字</span>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={createPointText}
            className="flex flex-col items-center p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          >
            <Type className="w-5 h-5 mb-1" />
            <span className="text-xs">点文字</span>
          </button>
          <button
            onClick={createAreaText}
            className="flex flex-col items-center p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          >
            <AlignLeft className="w-5 h-5 mb-1" />
            <span className="text-xs">区域文字</span>
          </button>
          <button
            onClick={createPathText}
            className="flex flex-col items-center p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          >
            <Spline className="w-5 h-5 mb-1" />
            <span className="text-xs">路径文字</span>
          </button>
        </div>
      </div>

      {/* 文字转矢量 */}
      <div className="mb-4">
        <button
          onClick={convertTextToPath}
          disabled={!isTextObject}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="w-4 h-4" />
          <span className="text-sm">转换为矢量路径</span>
        </button>
        <p className="text-[10px] text-gray-400 mt-1 text-center">
          将文字转换为可编辑的矢量图形
        </p>
      </div>

      {/* 字体设置 */}
      <div className="space-y-3 border-t border-gray-700 pt-4">
        <div>
          <span className="text-xs text-gray-500 block mb-1">字体</span>
          <select
            value={fontFamily}
            onChange={(e) => {
              setFontFamily(e.target.value);
              updateTextProperty("fontFamily", e.target.value);
            }}
            className="w-full text-sm bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
          >
            {fonts.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-xs text-gray-500 block mb-1">字号</span>
            <input
              type="number"
              min="8"
              max="200"
              value={fontSize}
              onChange={(e) => {
                const size = Number(e.target.value);
                setFontSize(size);
                updateTextProperty("fontSize", size);
              }}
              className="w-full text-sm bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
            />
          </div>
          <div>
            <span className="text-xs text-gray-500 block mb-1">行高</span>
            <input
              type="number"
              min="0.5"
              max="3"
              step="0.1"
              value={lineHeight}
              onChange={(e) => {
                const lh = Number(e.target.value);
                setLineHeight(lh);
                updateTextProperty("lineHeight", lh);
              }}
              className="w-full text-sm bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
            />
          </div>
        </div>

        <div>
          <span className="text-xs text-gray-500 block mb-1">字间距</span>
          <input
            type="range"
            min="-50"
            max="200"
            value={charSpacing}
            onChange={(e) => {
              const cs = Number(e.target.value);
              setCharSpacing(cs);
              updateTextProperty("charSpacing", cs * 10);
            }}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>紧凑</span>
            <span>{charSpacing}</span>
            <span>宽松</span>
          </div>
        </div>

        {/* 文字样式 */}
        <div>
          <span className="text-xs text-gray-500 block mb-1">样式</span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const current = (activeObject as any)?.fontWeight === "bold";
                updateTextProperty("fontWeight", current ? "normal" : "bold");
              }}
              disabled={!isTextObject}
              className={`flex-1 p-2 rounded border ${
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (activeObject as any)?.fontWeight === "bold"
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "border-gray-600 bg-gray-700 text-gray-300"
              } disabled:opacity-50`}
            >
              <Bold className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const current = (activeObject as any)?.fontStyle === "italic";
                updateTextProperty("fontStyle", current ? "normal" : "italic");
              }}
              disabled={!isTextObject}
              className={`flex-1 p-2 rounded border ${
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (activeObject as any)?.fontStyle === "italic"
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "border-gray-600 bg-gray-700 text-gray-300"
              } disabled:opacity-50`}
            >
              <Italic className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const current = (activeObject as any)?.underline;
                updateTextProperty("underline", !current);
              }}
              disabled={!isTextObject}
              className={`flex-1 p-2 rounded border ${
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (activeObject as any)?.underline
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "border-gray-600 bg-gray-700 text-gray-300"
              } disabled:opacity-50`}
            >
              <Underline className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </div>

        {/* 对齐 */}
        <div>
          <span className="text-xs text-gray-500 block mb-1">对齐</span>
          <div className="flex gap-1">
            {[
              { align: "left", icon: <AlignLeft className="w-4 h-4" /> },
              { align: "center", icon: <AlignCenter className="w-4 h-4" /> },
              { align: "right", icon: <AlignRight className="w-4 h-4" /> },
              { align: "justify", icon: <AlignJustify className="w-4 h-4" /> },
            ].map(({ align, icon }) => (
              <button
                key={align}
                onClick={() => updateTextProperty("textAlign", align)}
                disabled={!isTextObject}
                className={`flex-1 p-2 rounded border ${
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (activeObject as any)?.textAlign === align
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "border-gray-600 bg-gray-700 text-gray-300"
                } disabled:opacity-50`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextTools;
