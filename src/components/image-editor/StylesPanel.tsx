"use client";

import React, { useState } from "react";
import * as fabric from "fabric";
import { useEditorStore } from "@/store/editor-store";
import { Plus, Trash2, Check, Copy } from "lucide-react";

interface SavedStyle {
  id: string;
  name: string;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  opacity: number;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  } | null;
}

const defaultStyles: SavedStyle[] = [
  {
    id: "1",
    name: "纯黑填充",
    fill: "#000000",
    stroke: null,
    strokeWidth: 0,
    opacity: 1,
  },
  {
    id: "2",
    name: "纯白填充",
    fill: "#FFFFFF",
    stroke: "#000000",
    strokeWidth: 1,
    opacity: 1,
  },
  {
    id: "3",
    name: "蓝色渐变",
    fill: "#3B82F6",
    stroke: null,
    strokeWidth: 0,
    opacity: 1,
  },
  {
    id: "4",
    name: "红色描边",
    fill: "transparent",
    stroke: "#EF4444",
    strokeWidth: 2,
    opacity: 1,
  },
  {
    id: "5",
    name: "柔和阴影",
    fill: "#FFFFFF",
    stroke: "#E5E7EB",
    strokeWidth: 1,
    opacity: 1,
    shadow: { color: "#00000033", blur: 10, offsetX: 0, offsetY: 4 },
  },
  {
    id: "6",
    name: "霓虹效果",
    fill: "transparent",
    stroke: "#00D4FF",
    strokeWidth: 3,
    opacity: 1,
    shadow: { color: "#00D4FF88", blur: 15, offsetX: 0, offsetY: 0 },
  },
];

export const StylesPanel: React.FC = () => {
  const { canvas, activeObject, addToHistory } = useEditorStore();
  const [styles, setStyles] = useState<SavedStyle[]>(defaultStyles);
  const [newStyleName, setNewStyleName] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const applyStyle = (style: SavedStyle) => {
    if (!canvas || !activeObject) return;

    if (style.fill) {
      activeObject.set("fill", style.fill);
    }
    if (style.stroke) {
      activeObject.set("stroke", style.stroke);
    }
    activeObject.set("strokeWidth", style.strokeWidth);
    activeObject.set("opacity", style.opacity);

    if (style.shadow) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activeObject.shadow = new (fabric as any).Shadow({
        color: style.shadow.color,
        blur: style.shadow.blur,
        offsetX: style.shadow.offsetX,
        offsetY: style.shadow.offsetY,
      });
    } else {
      activeObject.shadow = null;
    }

    canvas.renderAll();
    addToHistory(JSON.stringify(canvas.toJSON()));
  };

  const saveCurrentStyle = () => {
    if (!activeObject || !newStyleName.trim()) return;

    const newStyle: SavedStyle = {
      id: `style-${Date.now()}`,
      name: newStyleName.trim(),
      fill: activeObject.fill as string | null,
      stroke: activeObject.stroke as string | null,
      strokeWidth: activeObject.strokeWidth || 0,
      opacity: activeObject.opacity || 1,
      shadow: activeObject.shadow
        ? {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            color: (activeObject.shadow as any).color || "#000000",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            blur: (activeObject.shadow as any).blur || 0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            offsetX: (activeObject.shadow as any).offsetX || 0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            offsetY: (activeObject.shadow as any).offsetY || 0,
          }
        : null,
    };

    setStyles([...styles, newStyle]);
    setNewStyleName("");
    setShowAddDialog(false);
  };

  const deleteStyle = (id: string) => {
    setStyles(styles.filter((s) => s.id !== id));
  };

  const duplicateStyle = (style: SavedStyle) => {
    const newStyle: SavedStyle = {
      ...style,
      id: `style-${Date.now()}`,
      name: `${style.name} 副本`,
    };
    setStyles([...styles, newStyle]);
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">预设样式</span>
        <button
          onClick={() => setShowAddDialog(true)}
          disabled={!activeObject}
          className="p-1 hover:bg-gray-600 rounded disabled:opacity-50 text-gray-400"
          title="保存当前样式"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* 添加样式对话框 */}
      {showAddDialog && (
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <span className="text-xs text-gray-400 block mb-2">
            保存当前对象样式
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={newStyleName}
              onChange={(e) => setNewStyleName(e.target.value)}
              placeholder="样式名称"
              className="flex-1 text-xs bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white"
              autoFocus
            />
            <button
              onClick={saveCurrentStyle}
              disabled={!newStyleName.trim()}
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs disabled:opacity-50"
            >
              保存
            </button>
            <button
              onClick={() => setShowAddDialog(false)}
              className="px-2 py-1 bg-gray-600 rounded text-xs text-gray-300"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 样式列表 */}
      <div className="space-y-1">
        {styles.map((style) => (
          <div
            key={style.id}
            className="flex items-center gap-2 p-2 bg-gray-700 rounded hover:bg-gray-600 group cursor-pointer"
            onClick={() => applyStyle(style)}
          >
            {/* 样式预览 */}
            <div
              className="w-7 h-7 rounded border border-gray-500 flex-shrink-0"
              style={{
                backgroundColor: style.fill || "transparent",
                border: style.stroke
                  ? `${Math.min(3, style.strokeWidth)}px solid ${style.stroke}`
                  : "1px solid #4B5563",
                boxShadow: style.shadow
                  ? `${style.shadow.offsetX}px ${style.shadow.offsetY}px ${style.shadow.blur}px ${style.shadow.color}`
                  : "none",
                opacity: style.opacity,
              }}
            />

            {/* 样式名称 */}
            <span className="flex-1 text-xs text-gray-300 truncate">
              {style.name}
            </span>

            {/* 操作按钮 */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateStyle(style);
                }}
                className="p-1 hover:bg-gray-500 rounded text-gray-400"
                title="复制样式"
              >
                <Copy className="w-3 h-3" />
              </button>
              {!defaultStyles.find((d) => d.id === style.id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteStyle(style.id);
                  }}
                  className="p-1 hover:bg-red-900 rounded text-red-400"
                  title="删除样式"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!activeObject && (
        <p className="text-xs text-gray-500 text-center mt-4">
          选择对象以应用或保存样式
        </p>
      )}

      {/* 快速样式 */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <span className="text-xs text-gray-500 block mb-2">快速应用</span>
        <div className="grid grid-cols-5 gap-2">
          {[
            { fill: "#EF4444", stroke: null },
            { fill: "#F59E0B", stroke: null },
            { fill: "#10B981", stroke: null },
            { fill: "#3B82F6", stroke: null },
            { fill: "#8B5CF6", stroke: null },
            { fill: "transparent", stroke: "#EF4444" },
            { fill: "transparent", stroke: "#F59E0B" },
            { fill: "transparent", stroke: "#10B981" },
            { fill: "transparent", stroke: "#3B82F6" },
            { fill: "transparent", stroke: "#8B5CF6" },
          ].map((s, i) => (
            <button
              key={i}
              onClick={() => {
                if (!canvas || !activeObject) return;
                activeObject.set("fill", s.fill);
                if (s.stroke) {
                  activeObject.set("stroke", s.stroke);
                  activeObject.set("strokeWidth", 2);
                } else {
                  activeObject.set("stroke", null);
                  activeObject.set("strokeWidth", 0);
                }
                canvas.renderAll();
                addToHistory(JSON.stringify(canvas.toJSON()));
              }}
              disabled={!activeObject}
              className="w-8 h-8 rounded border border-gray-200 hover:scale-110 transition-transform disabled:opacity-50"
              style={{
                backgroundColor: s.fill || "transparent",
                border: s.stroke
                  ? `2px solid ${s.stroke}`
                  : "1px solid #E5E7EB",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StylesPanel;
