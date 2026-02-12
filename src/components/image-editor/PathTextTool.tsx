"use client";

import React, { useState, useCallback } from "react";
import { useEditorStore } from "@/store/editor-store";
import * as fabric from "fabric";
import {
  Type,
  ArrowRight,
  RotateCcw,
  FlipHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Settings,
} from "lucide-react";

interface PathTextSettings {
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  pathOffset: number;
  pathAlign: "left" | "center" | "right";
  flipPath: boolean;
  letterSpacing: number;
}

const defaultSettings: PathTextSettings = {
  text: "沿路径排列的文字",
  fontFamily: "Arial",
  fontSize: 24,
  fill: "#000000",
  pathOffset: 0,
  pathAlign: "left",
  flipPath: false,
  letterSpacing: 0,
};

// 预设路径形状
const PATH_PRESETS = [
  {
    name: "波浪线",
    path: "M 0 50 Q 50 0 100 50 T 200 50 T 300 50 T 400 50",
    width: 400,
  },
  {
    name: "圆弧",
    path: "M 0 100 A 100 100 0 0 1 200 100",
    width: 200,
  },
  {
    name: "圆形",
    path: "M 100 0 A 100 100 0 1 1 99.99 0",
    width: 200,
  },
  {
    name: "S曲线",
    path: "M 0 100 C 50 0 100 0 150 50 S 250 100 300 0",
    width: 300,
  },
  {
    name: "螺旋",
    path: "M 100 100 Q 100 0 150 50 T 200 100 T 150 150 T 100 100",
    width: 200,
  },
  {
    name: "心形",
    path: "M 100 30 C 60 0 0 30 0 80 C 0 130 100 180 100 180 C 100 180 200 130 200 80 C 200 30 140 0 100 30",
    width: 200,
  },
];

export const PathTextTool: React.FC = () => {
  const { canvas, activeObject, foregroundColor, addToHistory, updateLayers } =
    useEditorStore();
  const [settings, setSettings] = useState<PathTextSettings>({
    ...defaultSettings,
    fill: foregroundColor,
  });
  const [selectedPath, setSelectedPath] = useState<fabric.Path | null>(null);
  const [isPathSelected, setIsPathSelected] = useState(false);

  // 检测是否选中了路径
  React.useEffect(() => {
    if (activeObject && activeObject.type === "path") {
      setSelectedPath(activeObject as fabric.Path);
      setIsPathSelected(true);
    } else {
      setSelectedPath(null);
      setIsPathSelected(false);
    }
  }, [activeObject]);

  // 创建预设路径
  const createPresetPath = useCallback(
    (preset: (typeof PATH_PRESETS)[0]) => {
      if (!canvas) return;

      const path = new fabric.Path(preset.path, {
        fill: "transparent",
        stroke: "#3B82F6",
        strokeWidth: 2,
        selectable: true,
        left: (canvas.width || 800) / 2 - preset.width / 2,
        top: (canvas.height || 600) / 2 - 50,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (path as any).id = `path-${Date.now()}`;
      canvas.add(path);
      canvas.setActiveObject(path);
      canvas.renderAll();
      updateLayers();
      setSelectedPath(path);
      setIsPathSelected(true);
    },
    [canvas, updateLayers],
  );

  // 创建路径文字
  const createPathText = useCallback(() => {
    if (!canvas || !selectedPath) return;

    // 获取路径数据
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pathData = (selectedPath as any).path;
    if (!pathData) {
      alert("无法获取路径数据");
      return;
    }

    // Fabric.js v6 使用不同的方式处理路径文字
    // 我们需要手动沿路径放置文字
    const text = settings.text;
    const pathLength = selectedPath.width || 200;
    const charWidth = settings.fontSize * 0.6;
    const totalTextWidth = text.length * charWidth;

    // 计算起始位置
    let startOffset = 0;
    if (settings.pathAlign === "center") {
      startOffset = (pathLength - totalTextWidth) / 2;
    } else if (settings.pathAlign === "right") {
      startOffset = pathLength - totalTextWidth;
    }
    startOffset += settings.pathOffset;

    // 创建文字组
    const textGroup = new fabric.Group([], {
      left: selectedPath.left,
      top: selectedPath.top,
      selectable: true,
    });

    // 为每个字符创建单独的文本对象
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charOffset = startOffset + i * (charWidth + settings.letterSpacing);

      // 简化版本：沿直线放置字符
      // 完整实现需要计算路径上的点和切线角度
      const charText = new fabric.IText(char, {
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
        fill: settings.fill,
        left: charOffset,
        top: 0,
        selectable: false,
      });

      textGroup.add(charText);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (textGroup as any).id = `pathtext-${Date.now()}`;
    canvas.add(textGroup);
    canvas.setActiveObject(textGroup);
    canvas.renderAll();

    updateLayers();
    addToHistory(JSON.stringify(canvas.toJSON()));
  }, [canvas, selectedPath, settings, updateLayers, addToHistory]);

  // 简化版：直接创建弯曲文字效果
  const createCurvedText = useCallback(() => {
    if (!canvas) return;

    const text = settings.text;
    const radius = 150;
    const centerX = (canvas.width || 800) / 2;
    const centerY = (canvas.height || 600) / 2;

    const textObjects: fabric.IText[] = [];
    const totalAngle = (text.length * settings.fontSize * 0.8) / radius;
    const startAngle = -Math.PI / 2 - totalAngle / 2;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const angle = startAngle + (i * settings.fontSize * 0.8) / radius;

      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      const rotation = (angle + Math.PI / 2) * (180 / Math.PI);

      const charText = new fabric.IText(char, {
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
        fill: settings.fill,
        left: x,
        top: y,
        angle: settings.flipPath ? rotation + 180 : rotation,
        originX: "center",
        originY: "center",
        selectable: false,
      });

      textObjects.push(charText);
    }

    const group = new fabric.Group(textObjects, {
      left: centerX,
      top: centerY,
      originX: "center",
      originY: "center",
      selectable: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (group as any).id = `curvedtext-${Date.now()}`;
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();

    updateLayers();
    addToHistory(JSON.stringify(canvas.toJSON()));
  }, [canvas, settings, updateLayers, addToHistory]);

  return (
    <div className="p-3 space-y-3">
      {/* 文字输入 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
          文字内容
        </span>
        <textarea
          value={settings.text}
          onChange={(e) => setSettings({ ...settings, text: e.target.value })}
          className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white resize-none"
          rows={2}
          placeholder="输入要沿路径排列的文字..."
        />
      </div>

      {/* 字体设置 */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
            字体
          </span>
          <select
            value={settings.fontFamily}
            onChange={(e) =>
              setSettings({ ...settings, fontFamily: e.target.value })
            }
            className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white"
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Microsoft YaHei">微软雅黑</option>
            <option value="SimHei">黑体</option>
            <option value="SimSun">宋体</option>
          </select>
        </div>
        <div className="w-20 space-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
            字号
          </span>
          <input
            type="number"
            min="8"
            max="200"
            value={settings.fontSize}
            onChange={(e) =>
              setSettings({ ...settings, fontSize: Number(e.target.value) })
            }
            className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white"
          />
        </div>
      </div>

      {/* 颜色 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
          颜色
        </span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={settings.fill}
            onChange={(e) => setSettings({ ...settings, fill: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
          />
          <input
            type="text"
            value={settings.fill}
            onChange={(e) => setSettings({ ...settings, fill: e.target.value })}
            className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white font-mono"
          />
        </div>
      </div>

      {/* 预设路径 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
          预设路径
        </span>
        <div className="grid grid-cols-3 gap-1">
          {PATH_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => createPresetPath(preset)}
              className="px-2 py-1.5 text-[10px] bg-gray-700 text-gray-300 hover:bg-gray-600 rounded truncate"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* 路径对齐 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
          文字对齐
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setSettings({ ...settings, pathAlign: "left" })}
            className={`flex-1 p-1.5 rounded ${settings.pathAlign === "left" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
          >
            <AlignLeft className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={() => setSettings({ ...settings, pathAlign: "center" })}
            className={`flex-1 p-1.5 rounded ${settings.pathAlign === "center" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
          >
            <AlignCenter className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={() => setSettings({ ...settings, pathAlign: "right" })}
            className={`flex-1 p-1.5 rounded ${settings.pathAlign === "right" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
          >
            <AlignRight className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>

      {/* 路径偏移和字距 */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
            路径偏移
          </span>
          <input
            type="number"
            value={settings.pathOffset}
            onChange={(e) =>
              setSettings({ ...settings, pathOffset: Number(e.target.value) })
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
            value={settings.letterSpacing}
            onChange={(e) =>
              setSettings({
                ...settings,
                letterSpacing: Number(e.target.value),
              })
            }
            className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white"
          />
        </div>
      </div>

      {/* 翻转 */}
      <div className="flex items-center justify-between py-2 border-t border-gray-700">
        <span className="text-xs text-gray-400">翻转文字方向</span>
        <button
          onClick={() =>
            setSettings({ ...settings, flipPath: !settings.flipPath })
          }
          className={`p-1.5 rounded ${settings.flipPath ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 操作按钮 */}
      <div className="space-y-2 pt-2 border-t border-gray-700">
        <button
          onClick={createPathText}
          disabled={!isPathSelected}
          className={`w-full py-2 text-xs rounded flex items-center justify-center gap-2 ${
            isPathSelected
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Type className="w-4 h-4" />
          沿选中路径创建文字
        </button>

        <button
          onClick={createCurvedText}
          className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs rounded flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          创建弧形文字
        </button>
      </div>

      {/* 提示 */}
      {!isPathSelected && (
        <div className="text-[10px] text-gray-500 text-center py-2 bg-gray-750 rounded">
          提示：先选择一条路径，或使用预设路径创建
        </div>
      )}
    </div>
  );
};

export default PathTextTool;
