"use client";

import React, { useState, useCallback } from "react";
import { useEditorStore } from "@/store/editor-store";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { DEFAULT_COLORS, MATERIAL_COLORS, type ColorMode } from "./types";

interface ColorSliderProps {
  label: string;
  value: number;
  max: number;
  color?: string;
  onChange: (value: number) => void;
}

const ColorSlider: React.FC<ColorSliderProps> = ({
  label,
  value,
  max,
  color,
  onChange,
}) => (
  <div className="flex items-center gap-2">
    <span className="w-6 text-xs text-gray-400">{label}</span>
    <input
      type="range"
      min="0"
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
      style={{
        background: color || `linear-gradient(to right, #000, #fff)`,
      }}
    />
    <input
      type="number"
      min="0"
      max={max}
      value={value}
      onChange={(e) =>
        onChange(Math.min(max, Math.max(0, Number(e.target.value))))
      }
      className="w-12 text-xs text-center bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-white"
    />
  </div>
);

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
};

const rgbToHsb = (
  r: number,
  g: number,
  b: number,
): { h: number; s: number; b: number } => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    b: Math.round(v * 100),
  };
};

const hsbToRgb = (
  h: number,
  s: number,
  b: number,
): { r: number; g: number; b: number } => {
  h /= 360;
  s /= 100;
  b /= 100;
  let r = 0,
    g = 0,
    bl = 0;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = b * (1 - s);
  const q = b * (1 - f * s);
  const t = b * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = b;
      g = t;
      bl = p;
      break;
    case 1:
      r = q;
      g = b;
      bl = p;
      break;
    case 2:
      r = p;
      g = b;
      bl = t;
      break;
    case 3:
      r = p;
      g = q;
      bl = b;
      break;
    case 4:
      r = t;
      g = p;
      bl = b;
      break;
    case 5:
      r = b;
      g = p;
      bl = q;
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(bl * 255),
  };
};

const rgbToCmyk = (
  r: number,
  g: number,
  b: number,
): { c: number; m: number; y: number; k: number } => {
  r /= 255;
  g /= 255;
  b /= 255;

  const k = 1 - Math.max(r, g, b);
  const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
  const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
  const y = k === 1 ? 0 : (1 - b - k) / (1 - k);

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
};

const cmykToRgb = (
  c: number,
  m: number,
  y: number,
  k: number,
): { r: number; g: number; b: number } => {
  c /= 100;
  m /= 100;
  y /= 100;
  k /= 100;

  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
  };
};

export const ColorPanel: React.FC = () => {
  const {
    canvas,
    activeObject,
    foregroundColor,
    backgroundColor,
    setForegroundColor,
    setBackgroundColor,
    swapColors,
    colorPalettes,
    activeColorPaletteId,
    addColorToPalette,
    addToHistory,
  } = useEditorStore();

  const [colorMode, setColorMode] = useState<ColorMode>("RGB");
  const [editingForeground, setEditingForeground] = useState(true);

  const currentColor = editingForeground ? foregroundColor : backgroundColor;

  // 设置颜色并同时应用到选中对象
  const setColorAndApply = useCallback(
    (color: string) => {
      if (editingForeground) {
        setForegroundColor(color);
        // 如果有选中对象，同时更新其颜色
        if (canvas && activeObject) {
          const objType = activeObject.type;
          if (
            objType === "line" ||
            objType === "path" ||
            objType === "polyline"
          ) {
            activeObject.set("stroke", color);
          } else if (
            objType === "i-text" ||
            objType === "textbox" ||
            objType === "text"
          ) {
            activeObject.set("fill", color);
          } else {
            activeObject.set("fill", color);
            activeObject.set("stroke", color);
          }
          canvas.renderAll();
          addToHistory(JSON.stringify(canvas.toJSON()));
        }
      } else {
        setBackgroundColor(color);
      }
    },
    [
      editingForeground,
      setForegroundColor,
      setBackgroundColor,
      canvas,
      activeObject,
      addToHistory,
    ],
  );

  const setColor = setColorAndApply;

  const rgb = hexToRgb(currentColor);
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

  const handleRgbChange = useCallback(
    (component: "r" | "g" | "b", value: number) => {
      const newRgb = { ...rgb, [component]: value };
      setColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    },
    [rgb, setColor],
  );

  const handleHsbChange = useCallback(
    (component: "h" | "s" | "b", value: number) => {
      const newHsb = { ...hsb, [component]: value };
      const newRgb = hsbToRgb(newHsb.h, newHsb.s, newHsb.b);
      setColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    },
    [hsb, setColor],
  );

  const handleCmykChange = useCallback(
    (component: "c" | "m" | "y" | "k", value: number) => {
      const newCmyk = { ...cmyk, [component]: value };
      const newRgb = cmykToRgb(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
      setColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    },
    [cmyk, setColor],
  );

  const activePalette = colorPalettes.find(
    (p) => p.id === activeColorPaletteId,
  );

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <select
          value={colorMode}
          onChange={(e) => setColorMode(e.target.value as ColorMode)}
          className="text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
        >
          <option value="RGB">RGB</option>
          <option value="HSB">HSB</option>
          <option value="CMYK">CMYK</option>
        </select>
      </div>

      {/* 前景色/背景色选择器 */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-14 h-14">
          <button
            onClick={() => setEditingForeground(false)}
            className={`absolute bottom-0 right-0 w-8 h-8 rounded border-2 ${
              !editingForeground ? "border-blue-500" : "border-gray-600"
            } shadow`}
            style={{ backgroundColor: backgroundColor }}
            title="背景色"
          />
          <button
            onClick={() => setEditingForeground(true)}
            className={`absolute top-0 left-0 w-8 h-8 rounded border-2 ${
              editingForeground ? "border-blue-500" : "border-gray-600"
            } shadow z-10`}
            style={{ backgroundColor: foregroundColor }}
            title="前景色"
          />
          <button
            onClick={swapColors}
            className="absolute top-0 right-0 w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 z-20"
            title="交换颜色"
          >
            <svg
              className="w-2.5 h-2.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18" />
            </svg>
          </button>
        </div>

        <div className="flex-1">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-7 rounded cursor-pointer bg-gray-700 border border-gray-600"
          />
          <input
            type="text"
            value={currentColor.toUpperCase()}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                setColor(val);
              }
            }}
            className="w-full mt-1 text-xs text-center bg-gray-700 border border-gray-600 rounded px-2 py-1 font-mono text-white"
          />
        </div>
      </div>

      {/* 颜色滑块 */}
      <div className="space-y-2 mb-4">
        {colorMode === "RGB" && (
          <>
            <ColorSlider
              label="R"
              value={rgb.r}
              max={255}
              color={`linear-gradient(to right, rgb(0,${rgb.g},${rgb.b}), rgb(255,${rgb.g},${rgb.b}))`}
              onChange={(v) => handleRgbChange("r", v)}
            />
            <ColorSlider
              label="G"
              value={rgb.g}
              max={255}
              color={`linear-gradient(to right, rgb(${rgb.r},0,${rgb.b}), rgb(${rgb.r},255,${rgb.b}))`}
              onChange={(v) => handleRgbChange("g", v)}
            />
            <ColorSlider
              label="B"
              value={rgb.b}
              max={255}
              color={`linear-gradient(to right, rgb(${rgb.r},${rgb.g},0), rgb(${rgb.r},${rgb.g},255))`}
              onChange={(v) => handleRgbChange("b", v)}
            />
          </>
        )}
        {colorMode === "HSB" && (
          <>
            <ColorSlider
              label="H"
              value={hsb.h}
              max={360}
              color="linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)"
              onChange={(v) => handleHsbChange("h", v)}
            />
            <ColorSlider
              label="S"
              value={hsb.s}
              max={100}
              onChange={(v) => handleHsbChange("s", v)}
            />
            <ColorSlider
              label="B"
              value={hsb.b}
              max={100}
              onChange={(v) => handleHsbChange("b", v)}
            />
          </>
        )}
        {colorMode === "CMYK" && (
          <>
            <ColorSlider
              label="C"
              value={cmyk.c}
              max={100}
              color="linear-gradient(to right, #fff, #00ffff)"
              onChange={(v) => handleCmykChange("c", v)}
            />
            <ColorSlider
              label="M"
              value={cmyk.m}
              max={100}
              color="linear-gradient(to right, #fff, #ff00ff)"
              onChange={(v) => handleCmykChange("m", v)}
            />
            <ColorSlider
              label="Y"
              value={cmyk.y}
              max={100}
              color="linear-gradient(to right, #fff, #ffff00)"
              onChange={(v) => handleCmykChange("y", v)}
            />
            <ColorSlider
              label="K"
              value={cmyk.k}
              max={100}
              color="linear-gradient(to right, #fff, #000)"
              onChange={(v) => handleCmykChange("k", v)}
            />
          </>
        )}
      </div>

      {/* 色板 */}
      <div className="border-t border-gray-700 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-400">色板</span>
          <button
            onClick={() => addColorToPalette(currentColor)}
            className="p-1 hover:bg-gray-600 rounded text-gray-400"
            title="添加到色板"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* 默认色板 */}
        <div className="grid grid-cols-8 gap-1 mb-2">
          {DEFAULT_COLORS.slice(0, 24).map((color) => (
            <button
              key={color}
              onClick={() => setColor(color)}
              className={`w-5 h-5 rounded ${currentColor === color ? "ring-2 ring-blue-400" : "border border-gray-600"}`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        {/* 自定义色板 */}
        {activePalette && activePalette.swatches.length > 0 && (
          <div className="mt-2">
            <span className="text-[10px] text-gray-500">自定义</span>
            <div className="grid grid-cols-8 gap-1 mt-1">
              {activePalette.swatches.map((swatch) => (
                <button
                  key={swatch.id}
                  onClick={() => setColor(swatch.color)}
                  className={`w-5 h-5 rounded ${currentColor === swatch.color ? "ring-2 ring-blue-400" : "border border-gray-600"}`}
                  style={{ backgroundColor: swatch.color }}
                  title={swatch.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Material颜色展开 */}
        <details className="mt-3">
          <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-300 flex items-center gap-1">
            <ChevronDown className="w-3 h-3" />
            Material Design 颜色
          </summary>
          <div className="mt-2 space-y-1">
            {Object.entries(MATERIAL_COLORS).map(([name, colors]) => (
              <div key={name} className="flex gap-0.5">
                {colors.map((color, i) => (
                  <button
                    key={`${name}-${i}`}
                    onClick={() => setColor(color)}
                    className="w-4 h-4 rounded-sm hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={`${name} ${(i + 1) * 100}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
};

export default ColorPanel;
