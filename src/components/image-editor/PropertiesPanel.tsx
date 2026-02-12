"use client";

import React, { useState, useEffect } from "react";
import { useEditorStore } from "@/store/editor-store";
import { DEFAULT_FONTS, DEFAULT_COLORS } from "./types";
import * as fabric from "fabric";

// 将任意颜色格式转换为 hex 格式
const toHexColor = (color: string | undefined): string => {
  if (!color) return "#000000";
  if (color.startsWith("#")) return color;

  const rgbMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  return "#000000";
};

export const PropertiesPanel: React.FC = () => {
  const { canvas, activeObject, updateLayers, addToHistory } = useEditorStore();

  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(24);
  const [fontWeight, setFontWeight] = useState("normal");
  const [fontStyle, setFontStyle] = useState("normal");
  const [textAlign, setTextAlign] = useState("left");
  const [fill, setFill] = useState("#000000");
  const [stroke, setStroke] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    if (activeObject) {
      const textObj = activeObject as fabric.IText;
      if (textObj.fontFamily) setFontFamily(textObj.fontFamily);
      if (textObj.fontSize) setFontSize(textObj.fontSize);
      if (textObj.fontWeight) setFontWeight(textObj.fontWeight as string);
      if (textObj.fontStyle) setFontStyle(textObj.fontStyle);
      if (textObj.textAlign) setTextAlign(textObj.textAlign);

      setFill(toHexColor(activeObject.fill as string));
      setStroke(toHexColor(activeObject.stroke as string));
      setStrokeWidth(activeObject.strokeWidth || 1);
      setOpacity(Math.round((activeObject.opacity || 1) * 100));
    }
  }, [activeObject]);

  const updateObject = (updates: Partial<fabric.Object>) => {
    if (!canvas || !activeObject) return;
    activeObject.set(updates);
    canvas.renderAll();
    addToHistory(JSON.stringify(canvas.toJSON()));
  };

  const handleFontFamilyChange = (value: string) => {
    setFontFamily(value);
    updateObject({ fontFamily: value } as Partial<fabric.IText>);
  };

  const handleFontSizeChange = (value: number) => {
    setFontSize(value);
    updateObject({ fontSize: value } as Partial<fabric.IText>);
  };

  const handleFontWeightChange = (value: string) => {
    setFontWeight(value);
    updateObject({ fontWeight: value } as Partial<fabric.IText>);
  };

  const handleFontStyleChange = (value: string) => {
    setFontStyle(value);
    updateObject({ fontStyle: value } as Partial<fabric.IText>);
  };

  const handleTextAlignChange = (value: string) => {
    setTextAlign(value);
    updateObject({ textAlign: value } as Partial<fabric.IText>);
  };

  const handleFillChange = (value: string) => {
    setFill(value);
    updateObject({ fill: value });
  };

  const handleStrokeChange = (value: string) => {
    setStroke(value);
    updateObject({ stroke: value });
  };

  const handleStrokeWidthChange = (value: number) => {
    setStrokeWidth(value);
    updateObject({ strokeWidth: value });
  };

  const handleOpacityChange = (value: number) => {
    setOpacity(value);
    updateObject({ opacity: value / 100 });
  };

  const isTextObject =
    activeObject &&
    (activeObject.type === "i-text" ||
      activeObject.type === "text" ||
      activeObject.type === "textbox");

  if (!activeObject) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">属性</h3>
        <p className="text-sm text-gray-500">选择一个对象以编辑其属性</p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">属性</h3>

      {/* Text Properties */}
      {isTextObject && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">文本属性</h4>

          {/* Font Family */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">字体</label>
            <select
              value={fontFamily}
              onChange={(e) => handleFontFamilyChange(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DEFAULT_FONTS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">字号</label>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => handleFontSizeChange(Number(e.target.value))}
              min="8"
              max="200"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Font Weight & Style */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">粗细</label>
              <select
                value={fontWeight}
                onChange={(e) => handleFontWeightChange(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">正常</option>
                <option value="bold">粗体</option>
                <option value="lighter">细体</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">样式</label>
              <select
                value={fontStyle}
                onChange={(e) => handleFontStyleChange(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">正常</option>
                <option value="italic">斜体</option>
              </select>
            </div>
          </div>

          {/* Text Align */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">对齐</label>
            <div className="flex gap-1">
              {["left", "center", "right", "justify"].map((align) => (
                <button
                  key={align}
                  onClick={() => handleTextAlignChange(align)}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    textAlign === align
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {align === "left"
                    ? "左"
                    : align === "center"
                      ? "中"
                      : align === "right"
                        ? "右"
                        : "齐"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Color Properties */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">颜色</h4>

        {/* Fill Color */}
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">填充颜色</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={fill}
              onChange={(e) => handleFillChange(e.target.value)}
              className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={fill}
              onChange={(e) => handleFillChange(e.target.value)}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Stroke Color */}
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">边框颜色</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={stroke}
              onChange={(e) => handleStrokeChange(e.target.value)}
              className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={stroke}
              onChange={(e) => handleStrokeChange(e.target.value)}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Color Presets */}
        <div className="grid grid-cols-8 gap-1">
          {DEFAULT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleFillChange(color)}
              className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Stroke Properties */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">边框</h4>

        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">边框宽度</label>
          <input
            type="range"
            value={strokeWidth}
            onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
            min="0"
            max="20"
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-center">
            {strokeWidth}px
          </div>
        </div>
      </div>

      {/* Opacity */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">透明度</h4>
        <input
          type="range"
          value={opacity}
          onChange={(e) => handleOpacityChange(Number(e.target.value))}
          min="0"
          max="100"
          className="w-full"
        />
        <div className="text-xs text-gray-500 text-center">{opacity}%</div>
      </div>

      {/* Position & Size */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">位置与尺寸</h4>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">X</label>
            <input
              type="number"
              value={Math.round(activeObject.left || 0)}
              onChange={(e) => updateObject({ left: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Y</label>
            <input
              type="number"
              value={Math.round(activeObject.top || 0)}
              onChange={(e) => updateObject({ top: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">宽度</label>
            <input
              type="number"
              value={Math.round(
                (activeObject.width || 0) * (activeObject.scaleX || 1),
              )}
              onChange={(e) => {
                const newWidth = Number(e.target.value);
                updateObject({ scaleX: newWidth / (activeObject.width || 1) });
              }}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">高度</label>
            <input
              type="number"
              value={Math.round(
                (activeObject.height || 0) * (activeObject.scaleY || 1),
              )}
              onChange={(e) => {
                const newHeight = Number(e.target.value);
                updateObject({
                  scaleY: newHeight / (activeObject.height || 1),
                });
              }}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Angle */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">旋转角度</h4>
        <div className="flex items-center gap-2">
          <input
            type="range"
            value={activeObject.angle || 0}
            onChange={(e) => updateObject({ angle: Number(e.target.value) })}
            min="0"
            max="360"
            className="flex-1"
          />
          <input
            type="number"
            value={Math.round(activeObject.angle || 0)}
            onChange={(e) => updateObject({ angle: Number(e.target.value) })}
            min="0"
            max="360"
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-500">°</span>
        </div>
      </div>
    </div>
  );
};
