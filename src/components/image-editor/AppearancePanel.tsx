"use client";

import React, { useState, useCallback } from "react";
import * as fabric from "fabric";
import { useEditorStore } from "@/store/editor-store";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Copy,
  Settings,
} from "lucide-react";
import type {
  AppearanceFill,
  AppearanceStroke,
  AppearanceEffect,
  Appearance,
} from "./types";
import { BLEND_MODES } from "./types";

// 将任意颜色格式转换为 hex 格式
const toHexColor = (color: string | undefined): string => {
  if (!color) return "#000000";
  if (color.startsWith("#")) return color;

  // 处理 rgb/rgba 格式
  const rgbMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  return "#000000";
};

// 默认外观
const defaultAppearance: Appearance = {
  fills: [
    {
      id: "fill-1",
      type: "solid",
      color: "#000000",
      opacity: 1,
      visible: true,
    },
  ],
  strokes: [
    {
      id: "stroke-1",
      color: "#000000",
      width: 1,
      opacity: 1,
      visible: true,
      lineCap: "round",
      lineJoin: "round",
      align: "center",
    },
  ],
  effects: [],
  opacity: 1,
  blendMode: "normal",
};

// 填充项组件
const FillItem: React.FC<{
  fill: AppearanceFill;
  index: number;
  onUpdate: (index: number, fill: Partial<AppearanceFill>) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
}> = ({ fill, index, onUpdate, onDelete, onDuplicate }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-600 rounded mb-1 bg-gray-750">
      <div className="flex items-center gap-1 p-1.5">
        <GripVertical className="w-3 h-3 text-gray-500 cursor-move" />
        <button
          onClick={() => onUpdate(index, { visible: !fill.visible })}
          className="p-0.5 hover:bg-gray-600 rounded"
        >
          {fill.visible ? (
            <Eye className="w-3 h-3 text-gray-400" />
          ) : (
            <EyeOff className="w-3 h-3 text-gray-500" />
          )}
        </button>
        <div
          className="w-5 h-5 rounded border border-gray-500 cursor-pointer"
          style={{ backgroundColor: fill.color || "transparent" }}
          onClick={() => setExpanded(!expanded)}
        />
        <span className="flex-1 text-xs text-gray-300">
          {fill.type === "solid"
            ? "纯色"
            : fill.type === "gradient"
              ? "渐变"
              : "图案"}
        </span>
        <button
          onClick={() => onDuplicate(index)}
          className="p-0.5 hover:bg-gray-600 rounded"
        >
          <Copy className="w-3 h-3 text-gray-400" />
        </button>
        <button
          onClick={() => onDelete(index)}
          className="p-0.5 hover:bg-red-900 rounded"
        >
          <Trash2 className="w-3 h-3 text-red-400" />
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 hover:bg-gray-600 rounded"
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
      </div>
      {expanded && (
        <div className="p-2 pt-0 space-y-2 border-t border-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12">类型</span>
            <select
              value={fill.type}
              onChange={(e) =>
                onUpdate(index, {
                  type: e.target.value as "solid" | "gradient" | "pattern",
                })
              }
              className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
            >
              <option value="solid">纯色</option>
              <option value="gradient">渐变</option>
              <option value="pattern">图案</option>
            </select>
          </div>
          {fill.type === "solid" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-12">颜色</span>
              <input
                type="color"
                value={toHexColor(fill.color)}
                onChange={(e) => onUpdate(index, { color: e.target.value })}
                className="w-8 h-6 rounded cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                value={toHexColor(fill.color)}
                onChange={(e) => onUpdate(index, { color: e.target.value })}
                className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white font-mono"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12">不透明</span>
            <input
              type="range"
              min="0"
              max="100"
              value={fill.opacity * 100}
              onChange={(e) =>
                onUpdate(index, { opacity: Number(e.target.value) / 100 })
              }
              className="flex-1 h-1.5"
            />
            <span className="text-xs text-gray-400 w-10 text-right">
              {Math.round(fill.opacity * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// 描边项组件
const StrokeItem: React.FC<{
  stroke: AppearanceStroke;
  index: number;
  onUpdate: (index: number, stroke: Partial<AppearanceStroke>) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
}> = ({ stroke, index, onUpdate, onDelete, onDuplicate }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-600 rounded mb-1 bg-gray-750">
      <div className="flex items-center gap-1 p-1.5">
        <GripVertical className="w-3 h-3 text-gray-500 cursor-move" />
        <button
          onClick={() => onUpdate(index, { visible: !stroke.visible })}
          className="p-0.5 hover:bg-gray-600 rounded"
        >
          {stroke.visible ? (
            <Eye className="w-3 h-3 text-gray-400" />
          ) : (
            <EyeOff className="w-3 h-3 text-gray-500" />
          )}
        </button>
        <div
          className="w-5 h-5 rounded border-2 cursor-pointer"
          style={{ borderColor: stroke.color }}
          onClick={() => setExpanded(!expanded)}
        />
        <span className="flex-1 text-xs text-gray-300">{stroke.width}px</span>
        <button
          onClick={() => onDuplicate(index)}
          className="p-0.5 hover:bg-gray-600 rounded"
        >
          <Copy className="w-3 h-3 text-gray-400" />
        </button>
        <button
          onClick={() => onDelete(index)}
          className="p-0.5 hover:bg-red-900 rounded"
        >
          <Trash2 className="w-3 h-3 text-red-400" />
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 hover:bg-gray-600 rounded"
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
      </div>
      {expanded && (
        <div className="p-2 pt-0 space-y-2 border-t border-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12">颜色</span>
            <input
              type="color"
              value={toHexColor(stroke.color)}
              onChange={(e) => onUpdate(index, { color: e.target.value })}
              className="w-8 h-6 rounded cursor-pointer bg-transparent border-0"
            />
            <input
              type="text"
              value={toHexColor(stroke.color)}
              onChange={(e) => onUpdate(index, { color: e.target.value })}
              className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12">宽度</span>
            <input
              type="number"
              min="0"
              max="100"
              value={stroke.width}
              onChange={(e) =>
                onUpdate(index, { width: Number(e.target.value) })
              }
              className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
            />
            <span className="text-xs text-gray-400">px</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12">对齐</span>
            <select
              value={stroke.align}
              onChange={(e) =>
                onUpdate(index, {
                  align: e.target.value as "center" | "inside" | "outside",
                })
              }
              className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
            >
              <option value="center">居中</option>
              <option value="inside">内部</option>
              <option value="outside">外部</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12">端点</span>
            <select
              value={stroke.lineCap}
              onChange={(e) =>
                onUpdate(index, {
                  lineCap: e.target.value as "butt" | "round" | "square",
                })
              }
              className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
            >
              <option value="butt">平头</option>
              <option value="round">圆头</option>
              <option value="square">方头</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12">拐角</span>
            <select
              value={stroke.lineJoin}
              onChange={(e) =>
                onUpdate(index, {
                  lineJoin: e.target.value as "miter" | "round" | "bevel",
                })
              }
              className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
            >
              <option value="miter">尖角</option>
              <option value="round">圆角</option>
              <option value="bevel">斜角</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12">不透明</span>
            <input
              type="range"
              min="0"
              max="100"
              value={stroke.opacity * 100}
              onChange={(e) =>
                onUpdate(index, { opacity: Number(e.target.value) / 100 })
              }
              className="flex-1 h-1.5"
            />
            <span className="text-xs text-gray-400 w-10 text-right">
              {Math.round(stroke.opacity * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// 效果项组件
const EffectItem: React.FC<{
  effect: AppearanceEffect;
  index: number;
  onUpdate: (index: number, effect: Partial<AppearanceEffect>) => void;
  onDelete: (index: number) => void;
}> = ({ effect, index, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const effectNames: Record<string, string> = {
    dropShadow: "投影",
    innerShadow: "内阴影",
    outerGlow: "外发光",
    innerGlow: "内发光",
    blur: "模糊",
    gaussianBlur: "高斯模糊",
  };

  return (
    <div className="border border-gray-600 rounded mb-1 bg-gray-750">
      <div className="flex items-center gap-1 p-1.5">
        <GripVertical className="w-3 h-3 text-gray-500 cursor-move" />
        <button
          onClick={() => onUpdate(index, { enabled: !effect.enabled })}
          className="p-0.5 hover:bg-gray-600 rounded"
        >
          {effect.enabled ? (
            <Eye className="w-3 h-3 text-gray-400" />
          ) : (
            <EyeOff className="w-3 h-3 text-gray-500" />
          )}
        </button>
        <Settings className="w-4 h-4 text-gray-400" />
        <span className="flex-1 text-xs text-gray-300">
          {effectNames[effect.type] || effect.type}
        </span>
        <button
          onClick={() => onDelete(index)}
          className="p-0.5 hover:bg-red-900 rounded"
        >
          <Trash2 className="w-3 h-3 text-red-400" />
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 hover:bg-gray-600 rounded"
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
      </div>
      {expanded && (
        <div className="p-2 pt-0 space-y-2 border-t border-gray-600">
          {effect.type === "dropShadow" && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-12">颜色</span>
                <input
                  type="color"
                  value={(effect.settings.color as string) || "#000000"}
                  onChange={(e) =>
                    onUpdate(index, {
                      settings: { ...effect.settings, color: e.target.value },
                    })
                  }
                  className="w-8 h-6 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-12">模糊</span>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={(effect.settings.blur as number) || 10}
                  onChange={(e) =>
                    onUpdate(index, {
                      settings: {
                        ...effect.settings,
                        blur: Number(e.target.value),
                      },
                    })
                  }
                  className="flex-1 h-1.5"
                />
                <span className="text-xs text-gray-400 w-8">
                  {effect.settings.blur || 10}px
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-12">X偏移</span>
                <input
                  type="number"
                  value={(effect.settings.offsetX as number) || 0}
                  onChange={(e) =>
                    onUpdate(index, {
                      settings: {
                        ...effect.settings,
                        offsetX: Number(e.target.value),
                      },
                    })
                  }
                  className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-12">Y偏移</span>
                <input
                  type="number"
                  value={(effect.settings.offsetY as number) || 4}
                  onChange={(e) =>
                    onUpdate(index, {
                      settings: {
                        ...effect.settings,
                        offsetY: Number(e.target.value),
                      },
                    })
                  }
                  className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                />
              </div>
            </>
          )}
          {effect.type === "blur" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-12">半径</span>
              <input
                type="range"
                min="0"
                max="50"
                value={(effect.settings.radius as number) || 5}
                onChange={(e) =>
                  onUpdate(index, {
                    settings: {
                      ...effect.settings,
                      radius: Number(e.target.value),
                    },
                  })
                }
                className="flex-1 h-1.5"
              />
              <span className="text-xs text-gray-400 w-8">
                {effect.settings.radius || 5}px
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 主外观面板组件
export const AppearancePanel: React.FC = () => {
  const { canvas, activeObject, addToHistory } = useEditorStore();
  const [appearance, setAppearance] = useState<Appearance>(defaultAppearance);

  // 从活动对象读取外观
  React.useEffect(() => {
    if (activeObject) {
      const fills: AppearanceFill[] = [];
      const strokes: AppearanceStroke[] = [];

      // 读取填充
      const fill = activeObject.fill;
      if (fill && fill !== "transparent") {
        fills.push({
          id: "fill-1",
          type: "solid",
          color: typeof fill === "string" ? fill : "#000000",
          opacity: 1,
          visible: true,
        });
      }

      // 读取描边
      if (activeObject.stroke) {
        strokes.push({
          id: "stroke-1",
          color: activeObject.stroke as string,
          width: activeObject.strokeWidth || 1,
          opacity: 1,
          visible: true,
          lineCap:
            (activeObject.strokeLineCap as "butt" | "round" | "square") ||
            "round",
          lineJoin:
            (activeObject.strokeLineJoin as "miter" | "round" | "bevel") ||
            "round",
          align: "center",
        });
      }

      setAppearance({
        fills:
          fills.length > 0
            ? fills
            : [
                {
                  id: "fill-1",
                  type: "solid",
                  color: "#000000",
                  opacity: 1,
                  visible: true,
                },
              ],
        strokes: strokes.length > 0 ? strokes : [],
        effects: [],
        opacity: activeObject.opacity || 1,
        blendMode: "normal",
      });
    }
  }, [activeObject]);

  // 应用外观到对象
  const applyAppearance = useCallback(() => {
    if (!canvas || !activeObject) return;

    // 应用第一个可见填充
    const visibleFill = appearance.fills.find((f) => f.visible);
    if (visibleFill) {
      activeObject.set("fill", visibleFill.color || "transparent");
    } else {
      activeObject.set("fill", "transparent");
    }

    // 应用第一个可见描边
    const visibleStroke = appearance.strokes.find((s) => s.visible);
    if (visibleStroke) {
      activeObject.set("stroke", visibleStroke.color);
      activeObject.set("strokeWidth", visibleStroke.width);
      activeObject.set("strokeLineCap", visibleStroke.lineCap);
      activeObject.set("strokeLineJoin", visibleStroke.lineJoin);
    } else {
      activeObject.set("stroke", null);
    }

    // 应用不透明度
    activeObject.set("opacity", appearance.opacity);

    // 应用效果（投影）
    const shadowEffect = appearance.effects.find(
      (e) => e.type === "dropShadow" && e.enabled,
    );
    if (shadowEffect) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activeObject.shadow = new (fabric as any).Shadow({
        color: shadowEffect.settings.color || "#00000066",
        blur: shadowEffect.settings.blur || 10,
        offsetX: shadowEffect.settings.offsetX || 0,
        offsetY: shadowEffect.settings.offsetY || 4,
      });
    } else {
      activeObject.shadow = null;
    }

    canvas.renderAll();
    addToHistory(JSON.stringify(canvas.toJSON()));
  }, [canvas, activeObject, appearance, addToHistory]);

  // 更新填充
  const updateFill = useCallback(
    (index: number, updates: Partial<AppearanceFill>) => {
      const newFills = [...appearance.fills];
      newFills[index] = { ...newFills[index], ...updates };
      setAppearance({ ...appearance, fills: newFills });
    },
    [appearance],
  );

  // 添加填充
  const addFill = useCallback(() => {
    const newFill: AppearanceFill = {
      id: `fill-${Date.now()}`,
      type: "solid",
      color: "#CCCCCC",
      opacity: 1,
      visible: true,
    };
    setAppearance({ ...appearance, fills: [newFill, ...appearance.fills] });
  }, [appearance]);

  // 删除填充
  const deleteFill = useCallback(
    (index: number) => {
      const newFills = appearance.fills.filter((_, i) => i !== index);
      setAppearance({ ...appearance, fills: newFills });
    },
    [appearance],
  );

  // 复制填充
  const duplicateFill = useCallback(
    (index: number) => {
      const newFill = { ...appearance.fills[index], id: `fill-${Date.now()}` };
      const newFills = [...appearance.fills];
      newFills.splice(index, 0, newFill);
      setAppearance({ ...appearance, fills: newFills });
    },
    [appearance],
  );

  // 更新描边
  const updateStroke = useCallback(
    (index: number, updates: Partial<AppearanceStroke>) => {
      const newStrokes = [...appearance.strokes];
      newStrokes[index] = { ...newStrokes[index], ...updates };
      setAppearance({ ...appearance, strokes: newStrokes });
    },
    [appearance],
  );

  // 添加描边
  const addStroke = useCallback(() => {
    const newStroke: AppearanceStroke = {
      id: `stroke-${Date.now()}`,
      color: "#000000",
      width: 1,
      opacity: 1,
      visible: true,
      lineCap: "round",
      lineJoin: "round",
      align: "center",
    };
    setAppearance({
      ...appearance,
      strokes: [newStroke, ...appearance.strokes],
    });
  }, [appearance]);

  // 删除描边
  const deleteStroke = useCallback(
    (index: number) => {
      const newStrokes = appearance.strokes.filter((_, i) => i !== index);
      setAppearance({ ...appearance, strokes: newStrokes });
    },
    [appearance],
  );

  // 复制描边
  const duplicateStroke = useCallback(
    (index: number) => {
      const newStroke = {
        ...appearance.strokes[index],
        id: `stroke-${Date.now()}`,
      };
      const newStrokes = [...appearance.strokes];
      newStrokes.splice(index, 0, newStroke);
      setAppearance({ ...appearance, strokes: newStrokes });
    },
    [appearance],
  );

  // 更新效果
  const updateEffect = useCallback(
    (index: number, updates: Partial<AppearanceEffect>) => {
      const newEffects = [...appearance.effects];
      newEffects[index] = { ...newEffects[index], ...updates };
      setAppearance({ ...appearance, effects: newEffects });
    },
    [appearance],
  );

  // 添加效果
  const addEffect = useCallback(
    (type: string) => {
      const newEffect: AppearanceEffect = {
        id: `effect-${Date.now()}`,
        type: type as AppearanceEffect["type"],
        enabled: true,
        settings:
          type === "dropShadow"
            ? { color: "#00000066", blur: 10, offsetX: 0, offsetY: 4 }
            : { radius: 5 },
      };
      setAppearance({
        ...appearance,
        effects: [...appearance.effects, newEffect],
      });
    },
    [appearance],
  );

  // 删除效果
  const deleteEffect = useCallback(
    (index: number) => {
      const newEffects = appearance.effects.filter((_, i) => i !== index);
      setAppearance({ ...appearance, effects: newEffects });
    },
    [appearance],
  );

  if (!activeObject) {
    return (
      <div className="p-3 text-xs text-gray-500 text-center">
        选择对象以编辑外观
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {/* 混合模式和不透明度 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-16">混合模式</span>
          <select
            value={appearance.blendMode}
            onChange={(e) =>
              setAppearance({ ...appearance, blendMode: e.target.value })
            }
            className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
          >
            {BLEND_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-16">不透明度</span>
          <input
            type="range"
            min="0"
            max="100"
            value={appearance.opacity * 100}
            onChange={(e) =>
              setAppearance({
                ...appearance,
                opacity: Number(e.target.value) / 100,
              })
            }
            className="flex-1 h-1.5"
          />
          <span className="text-xs text-gray-400 w-10 text-right">
            {Math.round(appearance.opacity * 100)}%
          </span>
        </div>
      </div>

      {/* 填充 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">填充</span>
          <button
            onClick={addFill}
            className="p-0.5 hover:bg-gray-600 rounded text-gray-400"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {appearance.fills.map((fill, index) => (
          <FillItem
            key={fill.id}
            fill={fill}
            index={index}
            onUpdate={updateFill}
            onDelete={deleteFill}
            onDuplicate={duplicateFill}
          />
        ))}
      </div>

      {/* 描边 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">描边</span>
          <button
            onClick={addStroke}
            className="p-0.5 hover:bg-gray-600 rounded text-gray-400"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {appearance.strokes.map((stroke, index) => (
          <StrokeItem
            key={stroke.id}
            stroke={stroke}
            index={index}
            onUpdate={updateStroke}
            onDelete={deleteStroke}
            onDuplicate={duplicateStroke}
          />
        ))}
      </div>

      {/* 效果 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">效果</span>
          <div className="flex gap-1">
            <button
              onClick={() => addEffect("dropShadow")}
              className="px-1.5 py-0.5 text-[10px] bg-gray-700 hover:bg-gray-600 rounded text-gray-400"
            >
              投影
            </button>
            <button
              onClick={() => addEffect("blur")}
              className="px-1.5 py-0.5 text-[10px] bg-gray-700 hover:bg-gray-600 rounded text-gray-400"
            >
              模糊
            </button>
          </div>
        </div>
        {appearance.effects.map((effect, index) => (
          <EffectItem
            key={effect.id}
            effect={effect}
            index={index}
            onUpdate={updateEffect}
            onDelete={deleteEffect}
          />
        ))}
      </div>

      {/* 应用按钮 */}
      <button
        onClick={applyAppearance}
        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
      >
        应用外观
      </button>
    </div>
  );
};

export default AppearancePanel;
