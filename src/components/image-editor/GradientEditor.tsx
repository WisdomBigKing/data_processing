"use client";

import React, { useState, useCallback, useRef } from "react";
import * as fabric from "fabric";
import { useEditorStore } from "@/store/editor-store";
import { Plus, Trash2 } from "lucide-react";
import type { GradientConfig, GradientStop, GradientType } from "./types";

interface GradientEditorProps {
  onApply?: (gradient: GradientConfig) => void;
}

const defaultGradient: GradientConfig = {
  type: "linear",
  angle: 0,
  stops: [
    { offset: 0, color: "#000000", opacity: 1 },
    { offset: 1, color: "#FFFFFF", opacity: 1 },
  ],
};

export const GradientEditor: React.FC<GradientEditorProps> = ({ onApply }) => {
  const { currentGradient, setCurrentGradient, canvas } = useEditorStore();
  const [gradient, setGradient] = useState<GradientConfig>(
    currentGradient || defaultGradient,
  );
  const [selectedStopIndex, setSelectedStopIndex] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  const getGradientCSS = useCallback(() => {
    const colorStops = gradient.stops
      .sort((a, b) => a.offset - b.offset)
      .map((s) => `${s.color} ${s.offset * 100}%`)
      .join(", ");

    switch (gradient.type) {
      case "linear":
        return `linear-gradient(${gradient.angle}deg, ${colorStops})`;
      case "radial":
        return `radial-gradient(circle, ${colorStops})`;
      case "conic":
        return `conic-gradient(from ${gradient.angle}deg, ${colorStops})`;
      default:
        return `linear-gradient(${gradient.angle}deg, ${colorStops})`;
    }
  }, [gradient]);

  const handleStopClick = (index: number) => {
    setSelectedStopIndex(index);
  };

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const offset = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );

    // 在点击位置添加新的色标
    const newStops = [...gradient.stops];

    // 计算该位置的颜色（简单线性插值）
    const sortedStops = [...newStops].sort((a, b) => a.offset - b.offset);
    let color = "#888888";
    for (let i = 0; i < sortedStops.length - 1; i++) {
      if (
        offset >= sortedStops[i].offset &&
        offset <= sortedStops[i + 1].offset
      ) {
        // 简单取中间色
        color = sortedStops[i].color;
        break;
      }
    }

    newStops.push({ offset, color, opacity: 1 });
    const newGradient = { ...gradient, stops: newStops };
    setGradient(newGradient);
    setSelectedStopIndex(newStops.length - 1);
  };

  const handleStopDrag = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    if (!barRef.current) return;

    const rect = barRef.current.getBoundingClientRect();

    const handleMove = (moveEvent: MouseEvent) => {
      const offset = Math.max(
        0,
        Math.min(1, (moveEvent.clientX - rect.left) / rect.width),
      );
      const newStops = [...gradient.stops];
      newStops[index] = { ...newStops[index], offset };
      setGradient({ ...gradient, stops: newStops });
    };

    const handleUp = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const handleColorChange = (color: string) => {
    const newStops = [...gradient.stops];
    newStops[selectedStopIndex] = { ...newStops[selectedStopIndex], color };
    setGradient({ ...gradient, stops: newStops });
  };

  const handleDeleteStop = () => {
    if (gradient.stops.length <= 2) return;
    const newStops = gradient.stops.filter((_, i) => i !== selectedStopIndex);
    setGradient({ ...gradient, stops: newStops });
    setSelectedStopIndex(Math.max(0, selectedStopIndex - 1));
  };

  const handleTypeChange = (type: GradientType) => {
    setGradient({ ...gradient, type });
  };

  const handleAngleChange = (angle: number) => {
    setGradient({ ...gradient, angle });
  };

  const handleApply = () => {
    setCurrentGradient(gradient);

    if (canvas) {
      const activeObj = canvas.getActiveObject();
      if (activeObj) {
        // 创建fabric渐变
        const fabricGradient = new fabric.Gradient({
          type: gradient.type === "radial" ? "radial" : "linear",
          gradientUnits: "percentage",
          coords:
            gradient.type === "radial"
              ? { x1: 0.5, y1: 0.5, x2: 0.5, y2: 0.5, r1: 0, r2: 0.5 }
              : {
                  x1: 0,
                  y1: 0,
                  x2: Math.cos((gradient.angle * Math.PI) / 180),
                  y2: Math.sin((gradient.angle * Math.PI) / 180),
                },
          colorStops: gradient.stops.map((s) => ({
            offset: s.offset,
            color: s.color,
          })),
        });

        activeObj.set("fill", fabricGradient);
        canvas.renderAll();
      }
    }

    onApply?.(gradient);
  };

  const handleReverseStops = () => {
    const newStops = gradient.stops.map((s) => ({
      ...s,
      offset: 1 - s.offset,
    }));
    setGradient({ ...gradient, stops: newStops });
  };

  return (
    <div className="p-3">
      {/* 渐变类型选择 */}
      <div className="flex gap-1 mb-3">
        {(["linear", "radial", "conic"] as GradientType[]).map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`px-2 py-1 text-xs rounded ${
              gradient.type === type
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {type === "linear" ? "线性" : type === "radial" ? "径向" : "角度"}
          </button>
        ))}
      </div>

      {/* 渐变预览 */}
      <div
        className="w-full h-16 rounded border border-gray-600 mb-3"
        style={{ background: getGradientCSS() }}
      />

      {/* 渐变条和色标 */}
      <div className="relative mb-4">
        <div
          ref={barRef}
          className="w-full h-6 rounded cursor-pointer"
          style={{ background: getGradientCSS() }}
          onClick={handleBarClick}
        />
        {/* 色标 */}
        {gradient.stops.map((stop, index) => (
          <div
            key={index}
            className={`absolute top-6 w-4 h-4 -translate-x-1/2 cursor-pointer ${
              selectedStopIndex === index ? "z-10" : ""
            }`}
            style={{ left: `${stop.offset * 100}%` }}
            onClick={(e) => {
              e.stopPropagation();
              handleStopClick(index);
            }}
            onMouseDown={(e) => handleStopDrag(e, index)}
          >
            <div
              className={`w-full h-full rounded-b border-2 ${
                selectedStopIndex === index
                  ? "border-blue-500"
                  : "border-gray-400"
              }`}
              style={{ backgroundColor: stop.color }}
            />
            <div
              className={`absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent ${
                selectedStopIndex === index
                  ? "border-b-blue-500"
                  : "border-b-gray-400"
              }`}
            />
          </div>
        ))}
      </div>

      {/* 选中色标的控制 */}
      <div className="space-y-3 mb-4 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-16">颜色:</span>
          <input
            type="color"
            value={gradient.stops[selectedStopIndex]?.color || "#000000"}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
          <input
            type="text"
            value={
              gradient.stops[selectedStopIndex]?.color?.toUpperCase() || ""
            }
            onChange={(e) => {
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                handleColorChange(e.target.value);
              }
            }}
            className="flex-1 text-xs border rounded px-2 py-1 font-mono"
          />
          <button
            onClick={handleDeleteStop}
            disabled={gradient.stops.length <= 2}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
            title="删除色标"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-16">位置:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={(gradient.stops[selectedStopIndex]?.offset || 0) * 100}
            onChange={(e) => {
              const newStops = [...gradient.stops];
              newStops[selectedStopIndex] = {
                ...newStops[selectedStopIndex],
                offset: Number(e.target.value) / 100,
              };
              setGradient({ ...gradient, stops: newStops });
            }}
            className="flex-1"
          />
          <span className="text-xs w-10 text-right">
            {Math.round((gradient.stops[selectedStopIndex]?.offset || 0) * 100)}
            %
          </span>
        </div>

        {(gradient.type === "linear" || gradient.type === "conic") && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">角度:</span>
            <input
              type="range"
              min="0"
              max="360"
              value={gradient.angle}
              onChange={(e) => handleAngleChange(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs w-10 text-right">{gradient.angle}°</span>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={handleReverseStops}
          className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        >
          反转
        </button>
        <button
          onClick={handleApply}
          className="flex-1 px-3 py-2 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded"
        >
          应用渐变
        </button>
      </div>

      {/* 预设渐变 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <span className="text-xs text-gray-500 block mb-2">预设渐变</span>
        <div className="grid grid-cols-5 gap-2">
          {[
            {
              stops: [
                { offset: 0, color: "#667eea", opacity: 1 },
                { offset: 1, color: "#764ba2", opacity: 1 },
              ],
            },
            {
              stops: [
                { offset: 0, color: "#f093fb", opacity: 1 },
                { offset: 1, color: "#f5576c", opacity: 1 },
              ],
            },
            {
              stops: [
                { offset: 0, color: "#4facfe", opacity: 1 },
                { offset: 1, color: "#00f2fe", opacity: 1 },
              ],
            },
            {
              stops: [
                { offset: 0, color: "#43e97b", opacity: 1 },
                { offset: 1, color: "#38f9d7", opacity: 1 },
              ],
            },
            {
              stops: [
                { offset: 0, color: "#fa709a", opacity: 1 },
                { offset: 1, color: "#fee140", opacity: 1 },
              ],
            },
            {
              stops: [
                { offset: 0, color: "#a8edea", opacity: 1 },
                { offset: 1, color: "#fed6e3", opacity: 1 },
              ],
            },
            {
              stops: [
                { offset: 0, color: "#5ee7df", opacity: 1 },
                { offset: 1, color: "#b490ca", opacity: 1 },
              ],
            },
            {
              stops: [
                { offset: 0, color: "#d299c2", opacity: 1 },
                { offset: 1, color: "#fef9d7", opacity: 1 },
              ],
            },
            {
              stops: [
                { offset: 0, color: "#f5f7fa", opacity: 1 },
                { offset: 1, color: "#c3cfe2", opacity: 1 },
              ],
            },
            {
              stops: [
                { offset: 0, color: "#000000", opacity: 1 },
                { offset: 1, color: "#434343", opacity: 1 },
              ],
            },
          ].map((preset, i) => (
            <button
              key={i}
              onClick={() => setGradient({ ...gradient, stops: preset.stops })}
              className="w-full h-8 rounded border border-gray-200 hover:border-blue-400"
              style={{
                background: `linear-gradient(90deg, ${preset.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(", ")})`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GradientEditor;
