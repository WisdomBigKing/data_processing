'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '@/store/editor-store';
import * as fabric from 'fabric';
import { 
  Brush, Pencil, Eraser, Droplet, Sparkles,
  Circle, Square, Triangle, RotateCcw, Save
} from 'lucide-react';
import type { BrushType, BrushSettings } from './types';

// 画笔预设
const BRUSH_PRESETS = [
  { name: '基础画笔', type: 'basic' as BrushType, size: 10, hardness: 1, opacity: 1 },
  { name: '软画笔', type: 'basic' as BrushType, size: 20, hardness: 0.3, opacity: 0.8 },
  { name: '铅笔', type: 'basic' as BrushType, size: 2, hardness: 1, opacity: 1 },
  { name: '水彩', type: 'basic' as BrushType, size: 30, hardness: 0.1, opacity: 0.5 },
  { name: '马克笔', type: 'basic' as BrushType, size: 15, hardness: 0.8, opacity: 0.9 },
  { name: '喷枪', type: 'scatter' as BrushType, size: 40, hardness: 0.2, opacity: 0.3 },
  { name: '书法笔', type: 'calligraphy' as BrushType, size: 8, hardness: 1, opacity: 1 },
  { name: '毛笔', type: 'bristle' as BrushType, size: 12, hardness: 0.6, opacity: 0.9 },
];

// 画笔形状
const BRUSH_SHAPES = [
  { name: '圆形', icon: Circle, value: 'circle' },
  { name: '方形', icon: Square, value: 'square' },
  { name: '三角', icon: Triangle, value: 'triangle' },
];

export const BrushPanelPro: React.FC = () => {
  const { canvas, foregroundColor, brushSettings, setBrushSettings, activeTool, setActiveTool } = useEditorStore();
  
  const [settings, setSettings] = useState<BrushSettings>({
    type: 'basic',
    size: 10,
    opacity: 1,
    hardness: 1,
    spacing: 0.25,
    angle: 0,
    roundness: 1,
    scatter: 0,
    colorDynamics: false,
    pressureSensitivity: false,
  });

  const [brushShape, setBrushShape] = useState('circle');
  const [savedBrushes, setSavedBrushes] = useState<BrushSettings[]>([]);

  // 从store同步设置
  useEffect(() => {
    if (brushSettings) {
      setSettings(brushSettings);
    }
  }, [brushSettings]);

  // 应用画笔设置到画布
  const applyBrushSettings = useCallback((newSettings: Partial<BrushSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    setBrushSettings(merged);

    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = foregroundColor;
      canvas.freeDrawingBrush.width = merged.size;
      
      // 设置透明度（通过颜色的alpha通道）
      if (merged.opacity < 1) {
        const hex = foregroundColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        canvas.freeDrawingBrush.color = `rgba(${r},${g},${b},${merged.opacity})`;
      }

      canvas.renderAll();
    }
  }, [canvas, foregroundColor, settings, setBrushSettings]);

  // 应用预设
  const applyPreset = useCallback((preset: typeof BRUSH_PRESETS[0]) => {
    applyBrushSettings({
      type: preset.type,
      size: preset.size,
      hardness: preset.hardness,
      opacity: preset.opacity,
    });
  }, [applyBrushSettings]);

  // 保存当前画笔
  const saveBrush = useCallback(() => {
    setSavedBrushes([...savedBrushes, { ...settings }]);
  }, [settings, savedBrushes]);

  // 激活画笔工具
  const activateBrush = useCallback(() => {
    setActiveTool('brush');
    if (canvas) {
      canvas.isDrawingMode = true;
      applyBrushSettings(settings);
    }
  }, [canvas, setActiveTool, applyBrushSettings, settings]);

  // 激活铅笔工具
  const activatePencil = useCallback(() => {
    setActiveTool('pencil');
    if (canvas) {
      canvas.isDrawingMode = true;
      applyBrushSettings({ ...settings, size: Math.min(settings.size, 5), hardness: 1 });
    }
  }, [canvas, setActiveTool, applyBrushSettings, settings]);

  // 激活橡皮擦
  const activateEraser = useCallback(() => {
    setActiveTool('eraser');
    if (canvas) {
      canvas.isDrawingMode = true;
      // 橡皮擦使用白色或背景色
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = '#FFFFFF';
        canvas.freeDrawingBrush.width = settings.size;
      }
    }
  }, [canvas, setActiveTool, settings.size]);

  return (
    <div className="p-3 space-y-3">
      {/* 工具选择 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">工具</span>
        <div className="flex gap-1">
          <button
            onClick={activateBrush}
            className={`flex-1 p-2 rounded flex flex-col items-center gap-1 ${
              activeTool === 'brush' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Brush className="w-5 h-5" />
            <span className="text-[10px]">画笔</span>
          </button>
          <button
            onClick={activatePencil}
            className={`flex-1 p-2 rounded flex flex-col items-center gap-1 ${
              activeTool === 'pencil' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Pencil className="w-5 h-5" />
            <span className="text-[10px]">铅笔</span>
          </button>
          <button
            onClick={activateEraser}
            className={`flex-1 p-2 rounded flex flex-col items-center gap-1 ${
              activeTool === 'eraser' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Eraser className="w-5 h-5" />
            <span className="text-[10px]">橡皮</span>
          </button>
        </div>
      </div>

      {/* 预设画笔 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">预设</span>
        <div className="grid grid-cols-4 gap-1">
          {BRUSH_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-center"
              title={preset.name}
            >
              <div 
                className="w-6 h-6 mx-auto rounded-full bg-gray-500"
                style={{
                  width: Math.min(24, preset.size),
                  height: Math.min(24, preset.size),
                  opacity: preset.opacity,
                  filter: `blur(${(1 - preset.hardness) * 2}px)`,
                }}
              />
              <span className="text-[9px] text-gray-400 mt-0.5 block truncate">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 大小 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">大小</span>
          <span className="text-xs text-gray-400">{settings.size}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="200"
          value={settings.size}
          onChange={(e) => applyBrushSettings({ size: Number(e.target.value) })}
          className="w-full h-1.5"
        />
        <div className="flex gap-1">
          {[1, 5, 10, 20, 50, 100].map(size => (
            <button
              key={size}
              onClick={() => applyBrushSettings({ size })}
              className={`flex-1 py-1 text-[10px] rounded ${
                settings.size === size ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* 不透明度 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">不透明度</span>
          <span className="text-xs text-gray-400">{Math.round(settings.opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={settings.opacity * 100}
          onChange={(e) => applyBrushSettings({ opacity: Number(e.target.value) / 100 })}
          className="w-full h-1.5"
        />
      </div>

      {/* 硬度 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">硬度</span>
          <span className="text-xs text-gray-400">{Math.round(settings.hardness * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={settings.hardness * 100}
          onChange={(e) => applyBrushSettings({ hardness: Number(e.target.value) / 100 })}
          className="w-full h-1.5"
        />
      </div>

      {/* 间距 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">间距</span>
          <span className="text-xs text-gray-400">{Math.round(settings.spacing * 100)}%</span>
        </div>
        <input
          type="range"
          min="1"
          max="200"
          value={settings.spacing * 100}
          onChange={(e) => applyBrushSettings({ spacing: Number(e.target.value) / 100 })}
          className="w-full h-1.5"
        />
      </div>

      {/* 角度和圆度 */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">角度</span>
          <input
            type="number"
            min="0"
            max="360"
            value={settings.angle}
            onChange={(e) => applyBrushSettings({ angle: Number(e.target.value) })}
            className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
          />
        </div>
        <div className="flex-1 space-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">圆度</span>
          <input
            type="number"
            min="0"
            max="100"
            value={Math.round(settings.roundness * 100)}
            onChange={(e) => applyBrushSettings({ roundness: Number(e.target.value) / 100 })}
            className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
          />
        </div>
      </div>

      {/* 画笔形状 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">笔尖形状</span>
        <div className="flex gap-1">
          {BRUSH_SHAPES.map(({ name, icon: Icon, value }) => (
            <button
              key={value}
              onClick={() => setBrushShape(value)}
              className={`flex-1 p-2 rounded ${
                brushShape === value ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={name}
            >
              <Icon className="w-4 h-4 mx-auto" />
            </button>
          ))}
        </div>
      </div>

      {/* 高级选项 */}
      <div className="space-y-2 pt-2 border-t border-gray-700">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">高级选项</span>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">颜色动态</span>
          <button
            onClick={() => applyBrushSettings({ colorDynamics: !settings.colorDynamics })}
            className={`w-10 h-5 rounded-full relative transition-colors ${settings.colorDynamics ? 'bg-blue-600' : 'bg-gray-600'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings.colorDynamics ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">压感</span>
          <button
            onClick={() => applyBrushSettings({ pressureSensitivity: !settings.pressureSensitivity })}
            className={`w-10 h-5 rounded-full relative transition-colors ${settings.pressureSensitivity ? 'bg-blue-600' : 'bg-gray-600'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings.pressureSensitivity ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>

        {settings.type === 'scatter' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500">散布</span>
              <span className="text-xs text-gray-400">{Math.round((settings.scatter || 0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={(settings.scatter || 0) * 100}
              onChange={(e) => applyBrushSettings({ scatter: Number(e.target.value) / 100 })}
              className="w-full h-1.5"
            />
          </div>
        )}
      </div>

      {/* 保存和重置 */}
      <div className="flex gap-2 pt-2 border-t border-gray-700">
        <button
          onClick={saveBrush}
          className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded flex items-center justify-center gap-1"
        >
          <Save className="w-3 h-3" />
          保存画笔
        </button>
        <button
          onClick={() => applyBrushSettings(BRUSH_PRESETS[0])}
          className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded flex items-center justify-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          重置
        </button>
      </div>

      {/* 保存的画笔 */}
      {savedBrushes.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">已保存 ({savedBrushes.length})</span>
          <div className="flex flex-wrap gap-1">
            {savedBrushes.map((brush, index) => (
              <button
                key={index}
                onClick={() => applyBrushSettings(brush)}
                className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded"
                title={`自定义画笔 ${index + 1}`}
              >
                <div 
                  className="w-4 h-4 rounded-full bg-gray-400"
                  style={{
                    width: Math.min(16, brush.size / 2),
                    height: Math.min(16, brush.size / 2),
                    opacity: brush.opacity,
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrushPanelPro;
