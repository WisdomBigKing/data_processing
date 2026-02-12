"use client";

import React, { useState, useEffect } from "react";
import { useEditorStore } from "@/store/editor-store";
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Move,
  Maximize2,
  RotateCcwIcon,
} from "lucide-react";

export const TransformPanel: React.FC = () => {
  const {
    canvas,
    activeObject,
    flipHorizontal,
    flipVertical,
    rotateSelected,
    addToHistory,
  } = useEditorStore();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState({ x: 1, y: 1 });

  useEffect(() => {
    if (activeObject) {
      setPosition({
        x: Math.round(activeObject.left || 0),
        y: Math.round(activeObject.top || 0),
      });
      setSize({
        width: Math.round(
          (activeObject.width || 0) * (activeObject.scaleX || 1),
        ),
        height: Math.round(
          (activeObject.height || 0) * (activeObject.scaleY || 1),
        ),
      });
      setRotation(Math.round(activeObject.angle || 0));
      setScale({
        x: activeObject.scaleX || 1,
        y: activeObject.scaleY || 1,
      });
    }
  }, [activeObject]);

  const handlePositionChange = (axis: "x" | "y", value: number) => {
    if (!canvas || !activeObject) return;

    const newPos = { ...position, [axis]: value };
    setPosition(newPos);

    activeObject.set(axis === "x" ? "left" : "top", value);
    canvas.renderAll();
  };

  const handleSizeChange = (dim: "width" | "height", value: number) => {
    if (!canvas || !activeObject) return;

    const originalWidth = activeObject.width || 1;
    const originalHeight = activeObject.height || 1;

    if (dim === "width") {
      activeObject.set("scaleX", value / originalWidth);
    } else {
      activeObject.set("scaleY", value / originalHeight);
    }

    setSize({ ...size, [dim]: value });
    canvas.renderAll();
  };

  const handleRotationChange = (value: number) => {
    if (!canvas || !activeObject) return;

    setRotation(value);
    activeObject.rotate(value);
    canvas.renderAll();
  };

  const handleCommit = () => {
    if (canvas) {
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  };

  const quickRotations = [
    { label: "-90°", angle: -90 },
    { label: "-45°", angle: -45 },
    { label: "45°", angle: 45 },
    { label: "90°", angle: 90 },
    { label: "180°", angle: 180 },
  ];

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-sm font-semibold text-white mb-2">变换</h3>

      {!activeObject ? (
        <p className="text-xs text-gray-500">请选择一个对象</p>
      ) : (
        <div className="space-y-3">
          {/* 位置 */}
          <div>
            <span className="text-xs text-gray-500 block mb-2">
              <Move className="w-3 h-3 inline mr-1" />
              位置
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 w-4">X</span>
                <input
                  type="number"
                  value={position.x}
                  onChange={(e) =>
                    handlePositionChange("x", Number(e.target.value))
                  }
                  onBlur={handleCommit}
                  className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 w-4">Y</span>
                <input
                  type="number"
                  value={position.y}
                  onChange={(e) =>
                    handlePositionChange("y", Number(e.target.value))
                  }
                  onBlur={handleCommit}
                  className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                />
              </div>
            </div>
          </div>

          {/* 尺寸 */}
          <div>
            <span className="text-xs text-gray-500 block mb-2">
              <Maximize2 className="w-3 h-3 inline mr-1" />
              尺寸
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 w-4">W</span>
                <input
                  type="number"
                  value={size.width}
                  onChange={(e) =>
                    handleSizeChange("width", Number(e.target.value))
                  }
                  onBlur={handleCommit}
                  className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 w-4">H</span>
                <input
                  type="number"
                  value={size.height}
                  onChange={(e) =>
                    handleSizeChange("height", Number(e.target.value))
                  }
                  onBlur={handleCommit}
                  className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                />
              </div>
            </div>
          </div>

          {/* 旋转 */}
          <div>
            <span className="text-xs text-gray-500 block mb-2">
              <RotateCcwIcon className="w-3 h-3 inline mr-1" />
              旋转
            </span>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="range"
                min="-180"
                max="180"
                value={rotation}
                onChange={(e) => handleRotationChange(Number(e.target.value))}
                onMouseUp={handleCommit}
                className="flex-1"
              />
              <input
                type="number"
                value={rotation}
                onChange={(e) => handleRotationChange(Number(e.target.value))}
                onBlur={handleCommit}
                className="w-16 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-center"
              />
              <span className="text-xs text-gray-400">°</span>
            </div>
            <div className="flex gap-1">
              {quickRotations.map(({ label, angle }) => (
                <button
                  key={label}
                  onClick={() => {
                    rotateSelected(angle);
                    setRotation(rotation + angle);
                  }}
                  className="flex-1 px-1 py-1 text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 翻转 */}
          <div>
            <span className="text-xs text-gray-500 block mb-2">翻转</span>
            <div className="flex gap-2">
              <button
                onClick={flipHorizontal}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
              >
                <FlipHorizontal className="w-4 h-4" />
                水平翻转
              </button>
              <button
                onClick={flipVertical}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
              >
                <FlipVertical className="w-4 h-4" />
                垂直翻转
              </button>
            </div>
          </div>

          {/* 缩放百分比 */}
          <div>
            <span className="text-xs text-gray-500 block mb-2">缩放</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 w-4">X</span>
                <input
                  type="number"
                  step="0.1"
                  value={Math.round(scale.x * 100)}
                  onChange={(e) => {
                    const newScale = Number(e.target.value) / 100;
                    setScale({ ...scale, x: newScale });
                    if (canvas && activeObject) {
                      activeObject.set("scaleX", newScale);
                      canvas.renderAll();
                    }
                  }}
                  onBlur={handleCommit}
                  className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                />
                <span className="text-xs text-gray-400">%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 w-4">Y</span>
                <input
                  type="number"
                  step="0.1"
                  value={Math.round(scale.y * 100)}
                  onChange={(e) => {
                    const newScale = Number(e.target.value) / 100;
                    setScale({ ...scale, y: newScale });
                    if (canvas && activeObject) {
                      activeObject.set("scaleY", newScale);
                      canvas.renderAll();
                    }
                  }}
                  onBlur={handleCommit}
                  className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                />
                <span className="text-xs text-gray-400">%</span>
              </div>
            </div>
          </div>

          {/* 快速缩放按钮 */}
          <div className="flex gap-1">
            {[50, 75, 100, 150, 200].map((percent) => (
              <button
                key={percent}
                onClick={() => {
                  const newScale = percent / 100;
                  setScale({ x: newScale, y: newScale });
                  if (canvas && activeObject) {
                    activeObject.set("scaleX", newScale);
                    activeObject.set("scaleY", newScale);
                    canvas.renderAll();
                    addToHistory(JSON.stringify(canvas.toJSON()));
                  }
                }}
                className="flex-1 px-1 py-1 text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransformPanel;
