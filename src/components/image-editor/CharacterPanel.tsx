"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useEditorStore } from "@/store/editor-store";
import * as fabric from "fabric";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Superscript,
  Subscript,
  RotateCcw,
} from "lucide-react";
import { DEFAULT_FONTS } from "./types";

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

interface CharacterSettings {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  lineHeight: number;
  charSpacing: number;
  underline: boolean;
  linethrough: boolean;
  overline: boolean;
  textAlign: string;
  // 高级排版
  baselineShift: number;
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
}

const defaultSettings: CharacterSettings = {
  fontFamily: "Arial",
  fontSize: 24,
  fontWeight: "normal",
  fontStyle: "normal",
  fill: "#000000",
  stroke: "",
  strokeWidth: 0,
  lineHeight: 1.2,
  charSpacing: 0,
  underline: false,
  linethrough: false,
  overline: false,
  textAlign: "left",
  baselineShift: 0,
  textTransform: "none",
};

// 字号预设
const FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96, 128,
];

// 字重预设
const FONT_WEIGHTS = [
  { value: "100", label: "Thin" },
  { value: "200", label: "Extra Light" },
  { value: "300", label: "Light" },
  { value: "normal", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semi Bold" },
  { value: "bold", label: "Bold" },
  { value: "800", label: "Extra Bold" },
  { value: "900", label: "Black" },
];

export const CharacterPanel: React.FC = () => {
  const { canvas, activeObject, addToHistory } = useEditorStore();
  const [settings, setSettings] = useState<CharacterSettings>(defaultSettings);
  const [isTextObject, setIsTextObject] = useState(false);

  // 从活动对象读取字符设置
  useEffect(() => {
    if (
      activeObject &&
      (activeObject.type === "i-text" || activeObject.type === "textbox")
    ) {
      const textObj = activeObject as fabric.IText;
      setIsTextObject(true);
      setSettings({
        fontFamily: textObj.fontFamily || "Arial",
        fontSize: textObj.fontSize || 24,
        fontWeight: String(textObj.fontWeight || "normal"),
        fontStyle: textObj.fontStyle || "normal",
        fill: toHexColor(textObj.fill as string),
        stroke: toHexColor(textObj.stroke as string),
        strokeWidth: textObj.strokeWidth || 0,
        lineHeight: textObj.lineHeight || 1.2,
        charSpacing: textObj.charSpacing || 0,
        underline: textObj.underline || false,
        linethrough: textObj.linethrough || false,
        overline: textObj.overline || false,
        textAlign: textObj.textAlign || "left",
        baselineShift: 0,
        textTransform: "none",
      });
    } else {
      setIsTextObject(false);
    }
  }, [activeObject]);

  // 应用字符设置
  const applySettings = useCallback(
    (newSettings: Partial<CharacterSettings>) => {
      if (!canvas || !activeObject || !isTextObject) return;

      const textObj = activeObject as fabric.IText;
      const merged = { ...settings, ...newSettings };
      setSettings(merged);

      // 应用到对象
      Object.entries(newSettings).forEach(([key, value]) => {
        if (key === "textTransform") {
          // 文字转换需要修改实际文本
          const text = textObj.text || "";
          let newText = text;
          switch (value) {
            case "uppercase":
              newText = text.toUpperCase();
              break;
            case "lowercase":
              newText = text.toLowerCase();
              break;
            case "capitalize":
              newText = text.replace(/\b\w/g, (l) => l.toUpperCase());
              break;
          }
          textObj.set("text", newText);
        } else {
          textObj.set(key as keyof fabric.IText, value);
        }
      });

      canvas.renderAll();
      addToHistory(JSON.stringify(canvas.toJSON()));
    },
    [canvas, activeObject, isTextObject, settings, addToHistory],
  );

  // 切换样式
  const toggleStyle = (
    style: "bold" | "italic" | "underline" | "linethrough" | "overline",
  ) => {
    switch (style) {
      case "bold":
        applySettings({
          fontWeight: settings.fontWeight === "bold" ? "normal" : "bold",
        });
        break;
      case "italic":
        applySettings({
          fontStyle: settings.fontStyle === "italic" ? "normal" : "italic",
        });
        break;
      case "underline":
        applySettings({ underline: !settings.underline });
        break;
      case "linethrough":
        applySettings({ linethrough: !settings.linethrough });
        break;
      case "overline":
        applySettings({ overline: !settings.overline });
        break;
    }
  };

  if (!isTextObject) {
    return (
      <div className="p-3 text-xs text-gray-500 text-center">
        选择文字对象以编辑字符属性
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {/* 字体选择 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
          字体
        </span>
        <select
          value={settings.fontFamily}
          onChange={(e) => applySettings({ fontFamily: e.target.value })}
          className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white"
        >
          {DEFAULT_FONTS.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* 字号和字重 */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
            字号
          </span>
          <div className="flex">
            <select
              value={settings.fontSize}
              onChange={(e) =>
                applySettings({ fontSize: Number(e.target.value) })
              }
              className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded-l px-2 py-1.5 text-white"
            >
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              max="500"
              value={settings.fontSize}
              onChange={(e) =>
                applySettings({ fontSize: Number(e.target.value) })
              }
              className="w-14 text-xs bg-gray-700 border border-gray-600 border-l-0 rounded-r px-2 py-1.5 text-white text-center"
            />
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
            字重
          </span>
          <select
            value={settings.fontWeight}
            onChange={(e) => applySettings({ fontWeight: e.target.value })}
            className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white"
          >
            {FONT_WEIGHTS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 样式按钮 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
          样式
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => toggleStyle("bold")}
            className={`p-1.5 rounded ${settings.fontWeight === "bold" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            title="粗体"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleStyle("italic")}
            className={`p-1.5 rounded ${settings.fontStyle === "italic" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            title="斜体"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleStyle("underline")}
            className={`p-1.5 rounded ${settings.underline ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            title="下划线"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleStyle("linethrough")}
            className={`p-1.5 rounded ${settings.linethrough ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            title="删除线"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            onClick={() => applySettings({ baselineShift: 5 })}
            className={`p-1.5 rounded ${settings.baselineShift > 0 ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            title="上标"
          >
            <Superscript className="w-4 h-4" />
          </button>
          <button
            onClick={() => applySettings({ baselineShift: -5 })}
            className={`p-1.5 rounded ${settings.baselineShift < 0 ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            title="下标"
          >
            <Subscript className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 对齐方式 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
          对齐
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => applySettings({ textAlign: "left" })}
            className={`p-1.5 rounded ${settings.textAlign === "left" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            title="左对齐"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => applySettings({ textAlign: "center" })}
            className={`p-1.5 rounded ${settings.textAlign === "center" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            title="居中"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => applySettings({ textAlign: "right" })}
            className={`p-1.5 rounded ${settings.textAlign === "right" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            title="右对齐"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => applySettings({ textAlign: "justify" })}
            className={`p-1.5 rounded ${settings.textAlign === "justify" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            title="两端对齐"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 颜色 */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
            填充
          </span>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={settings.fill}
              onChange={(e) => applySettings({ fill: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            />
            <input
              type="text"
              value={settings.fill}
              onChange={(e) => applySettings({ fill: e.target.value })}
              className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white font-mono"
            />
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
            描边
          </span>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={settings.stroke || "#000000"}
              onChange={(e) => applySettings({ stroke: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            />
            <input
              type="number"
              min="0"
              max="10"
              value={settings.strokeWidth}
              onChange={(e) =>
                applySettings({ strokeWidth: Number(e.target.value) })
              }
              className="w-12 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-center"
            />
          </div>
        </div>
      </div>

      {/* 行距和字距 */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
            行距
          </span>
          <input
            type="number"
            min="0.5"
            max="5"
            step="0.1"
            value={settings.lineHeight}
            onChange={(e) =>
              applySettings({ lineHeight: Number(e.target.value) })
            }
            className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white"
          />
        </div>
        <div className="flex-1 space-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
            字距
          </span>
          <input
            type="number"
            min="-500"
            max="1000"
            value={settings.charSpacing}
            onChange={(e) =>
              applySettings({ charSpacing: Number(e.target.value) })
            }
            className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white"
          />
        </div>
      </div>

      {/* 文字转换 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
          大小写转换
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => applySettings({ textTransform: "none" })}
            className={`flex-1 px-2 py-1 text-xs rounded ${settings.textTransform === "none" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
          >
            正常
          </button>
          <button
            onClick={() => applySettings({ textTransform: "uppercase" })}
            className={`flex-1 px-2 py-1 text-xs rounded ${settings.textTransform === "uppercase" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
          >
            全大写
          </button>
          <button
            onClick={() => applySettings({ textTransform: "lowercase" })}
            className={`flex-1 px-2 py-1 text-xs rounded ${settings.textTransform === "lowercase" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
          >
            全小写
          </button>
          <button
            onClick={() => applySettings({ textTransform: "capitalize" })}
            className={`flex-1 px-2 py-1 text-xs rounded ${settings.textTransform === "capitalize" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
          >
            首字母
          </button>
        </div>
      </div>

      {/* 重置按钮 */}
      <button
        onClick={() => {
          setSettings(defaultSettings);
          applySettings(defaultSettings);
        }}
        className="w-full py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded flex items-center justify-center gap-1"
      >
        <RotateCcw className="w-3 h-3" />
        重置为默认
      </button>
    </div>
  );
};

export default CharacterPanel;
