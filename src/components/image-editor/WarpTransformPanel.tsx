'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '@/store/editor-store';
import * as fabric from 'fabric';
import { 
  Move, RotateCcw, Maximize2, FlipHorizontal, FlipVertical,
  Grid, Box, Waves, Circle, Square, Disc
} from 'lucide-react';

// 变形预设类型
type WarpPreset = 
  | 'none' 
  | 'arc' 
  | 'arc-lower' 
  | 'arc-upper' 
  | 'arch' 
  | 'bulge' 
  | 'shell-lower'
  | 'shell-upper'
  | 'flag'
  | 'wave'
  | 'fish'
  | 'rise'
  | 'fisheye'
  | 'inflate'
  | 'squeeze'
  | 'twist';

// 变形预设配置
const WARP_PRESETS: { name: string; value: WarpPreset; icon: React.ReactNode }[] = [
  { name: '无', value: 'none', icon: <Square className="w-4 h-4" /> },
  { name: '弧形', value: 'arc', icon: <Disc className="w-4 h-4" /> },
  { name: '下弧', value: 'arc-lower', icon: <Disc className="w-4 h-4" /> },
  { name: '上弧', value: 'arc-upper', icon: <Disc className="w-4 h-4" /> },
  { name: '拱形', value: 'arch', icon: <Disc className="w-4 h-4" /> },
  { name: '凸起', value: 'bulge', icon: <Circle className="w-4 h-4" /> },
  { name: '下壳', value: 'shell-lower', icon: <Disc className="w-4 h-4" /> },
  { name: '上壳', value: 'shell-upper', icon: <Disc className="w-4 h-4" /> },
  { name: '旗帜', value: 'flag', icon: <Waves className="w-4 h-4" /> },
  { name: '波浪', value: 'wave', icon: <Waves className="w-4 h-4" /> },
  { name: '鱼形', value: 'fish', icon: <Disc className="w-4 h-4" /> },
  { name: '上升', value: 'rise', icon: <Disc className="w-4 h-4" /> },
  { name: '鱼眼', value: 'fisheye', icon: <Circle className="w-4 h-4" /> },
  { name: '膨胀', value: 'inflate', icon: <Circle className="w-4 h-4" /> },
  { name: '挤压', value: 'squeeze', icon: <Box className="w-4 h-4" /> },
  { name: '扭转', value: 'twist', icon: <RotateCcw className="w-4 h-4" /> },
];

interface WarpSettings {
  preset: WarpPreset;
  bend: number;
  horizontalDistortion: number;
  verticalDistortion: number;
}

interface PerspectiveSettings {
  enabled: boolean;
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
}

export const WarpTransformPanel: React.FC = () => {
  const { canvas, activeObject, addToHistory, updateLayers } = useEditorStore();
  
  const [activeTab, setActiveTab] = useState<'warp' | 'perspective' | 'envelope'>('warp');
  const [warpSettings, setWarpSettings] = useState<WarpSettings>({
    preset: 'none',
    bend: 0,
    horizontalDistortion: 0,
    verticalDistortion: 0,
  });
  const [perspectiveSettings, setPerspectiveSettings] = useState<PerspectiveSettings>({
    enabled: false,
    topLeft: { x: 0, y: 0 },
    topRight: { x: 100, y: 0 },
    bottomLeft: { x: 0, y: 100 },
    bottomRight: { x: 100, y: 100 },
  });

  // 应用变形
  const applyWarp = useCallback(() => {
    if (!canvas || !activeObject) return;

    // Fabric.js 本身不支持复杂变形，这里模拟一些基本效果
    // 实际生产中可能需要使用 WebGL 或其他库来实现真正的变形效果

    const { preset, bend } = warpSettings;
    
    if (preset === 'none') {
      // 重置变换
      activeObject.set({
        skewX: 0,
        skewY: 0,
        scaleX: 1,
        scaleY: 1,
      });
    } else if (preset === 'arc' || preset === 'arc-lower' || preset === 'arc-upper') {
      // 使用倾斜模拟弧形效果
      activeObject.set({
        skewX: bend * 0.5,
        skewY: 0,
      });
    } else if (preset === 'bulge' || preset === 'inflate') {
      // 使用缩放模拟膨胀效果
      const scale = 1 + bend / 100;
      activeObject.set({
        scaleX: scale,
        scaleY: scale,
      });
    } else if (preset === 'squeeze') {
      // 挤压效果
      activeObject.set({
        scaleX: 1 - bend / 200,
        scaleY: 1 + bend / 200,
      });
    } else if (preset === 'twist') {
      // 扭转效果
      activeObject.set({
        angle: (activeObject.angle || 0) + bend,
      });
    } else if (preset === 'wave' || preset === 'flag') {
      // 波浪效果 - 使用倾斜模拟
      activeObject.set({
        skewX: Math.sin(bend * Math.PI / 180) * 20,
        skewY: Math.cos(bend * Math.PI / 180) * 10,
      });
    } else {
      // 其他效果使用组合变换
      activeObject.set({
        skewX: bend * 0.3,
        skewY: bend * 0.2,
      });
    }

    canvas.renderAll();
    addToHistory(JSON.stringify(canvas.toJSON()));
  }, [canvas, activeObject, warpSettings, addToHistory]);

  // 应用透视变换
  const applyPerspective = useCallback(() => {
    if (!canvas || !activeObject) return;

    // Fabric.js 原生不支持透视变换
    // 这里使用倾斜来模拟简单的透视效果
    const { topLeft, topRight, bottomLeft, bottomRight } = perspectiveSettings;
    
    // 计算透视倾斜值
    const topWidth = topRight.x - topLeft.x;
    const bottomWidth = bottomRight.x - bottomLeft.x;
    const leftHeight = bottomLeft.y - topLeft.y;
    const rightHeight = bottomRight.y - topRight.y;
    
    // 简化的透视模拟
    const skewX = (topWidth - bottomWidth) / 2;
    const skewY = (leftHeight - rightHeight) / 2;
    
    activeObject.set({
      skewX: skewX,
      skewY: skewY,
    });

    canvas.renderAll();
    addToHistory(JSON.stringify(canvas.toJSON()));
  }, [canvas, activeObject, perspectiveSettings, addToHistory]);

  // 重置变换
  const resetTransform = useCallback(() => {
    if (!canvas || !activeObject) return;

    activeObject.set({
      skewX: 0,
      skewY: 0,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
    });

    setWarpSettings({
      preset: 'none',
      bend: 0,
      horizontalDistortion: 0,
      verticalDistortion: 0,
    });

    setPerspectiveSettings({
      enabled: false,
      topLeft: { x: 0, y: 0 },
      topRight: { x: 100, y: 0 },
      bottomLeft: { x: 0, y: 100 },
      bottomRight: { x: 100, y: 100 },
    });

    canvas.renderAll();
    addToHistory(JSON.stringify(canvas.toJSON()));
  }, [canvas, activeObject, addToHistory]);

  // 翻转
  const flipObject = useCallback((direction: 'horizontal' | 'vertical') => {
    if (!canvas || !activeObject) return;

    if (direction === 'horizontal') {
      activeObject.set('flipX', !activeObject.flipX);
    } else {
      activeObject.set('flipY', !activeObject.flipY);
    }

    canvas.renderAll();
    addToHistory(JSON.stringify(canvas.toJSON()));
  }, [canvas, activeObject, addToHistory]);

  if (!activeObject) {
    return (
      <div className="p-3 text-xs text-gray-500 text-center">
        选择对象以应用变换
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {/* 标签切换 */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('warp')}
          className={`flex-1 px-2 py-1.5 text-xs ${
            activeTab === 'warp' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
          }`}
        >
          变形
        </button>
        <button
          onClick={() => setActiveTab('perspective')}
          className={`flex-1 px-2 py-1.5 text-xs ${
            activeTab === 'perspective' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
          }`}
        >
          透视
        </button>
        <button
          onClick={() => setActiveTab('envelope')}
          className={`flex-1 px-2 py-1.5 text-xs ${
            activeTab === 'envelope' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
          }`}
        >
          封套
        </button>
      </div>

      {/* 变形面板 */}
      {activeTab === 'warp' && (
        <div className="space-y-3">
          {/* 预设选择 */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">样式</span>
            <div className="grid grid-cols-4 gap-1">
              {WARP_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setWarpSettings({ ...warpSettings, preset: preset.value })}
                  className={`p-1.5 rounded flex flex-col items-center gap-0.5 ${
                    warpSettings.preset === preset.value 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title={preset.name}
                >
                  {preset.icon}
                  <span className="text-[8px] truncate w-full text-center">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 弯曲度 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">弯曲</span>
              <span className="text-xs text-gray-400">{warpSettings.bend}%</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={warpSettings.bend}
              onChange={(e) => setWarpSettings({ ...warpSettings, bend: Number(e.target.value) })}
              className="w-full h-1.5"
            />
          </div>

          {/* 水平扭曲 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">水平扭曲</span>
              <span className="text-xs text-gray-400">{warpSettings.horizontalDistortion}%</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={warpSettings.horizontalDistortion}
              onChange={(e) => setWarpSettings({ ...warpSettings, horizontalDistortion: Number(e.target.value) })}
              className="w-full h-1.5"
            />
          </div>

          {/* 垂直扭曲 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">垂直扭曲</span>
              <span className="text-xs text-gray-400">{warpSettings.verticalDistortion}%</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={warpSettings.verticalDistortion}
              onChange={(e) => setWarpSettings({ ...warpSettings, verticalDistortion: Number(e.target.value) })}
              className="w-full h-1.5"
            />
          </div>

          <button
            onClick={applyWarp}
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
          >
            应用变形
          </button>
        </div>
      )}

      {/* 透视面板 */}
      {activeTab === 'perspective' && (
        <div className="space-y-3">
          {/* 透视控制点预览 */}
          <div className="relative w-full h-32 bg-gray-750 rounded border border-gray-600">
            <div className="absolute inset-2 border border-dashed border-gray-500">
              {/* 四个角的控制点 */}
              {[
                { key: 'topLeft', pos: 'top-0 left-0', label: '左上' },
                { key: 'topRight', pos: 'top-0 right-0', label: '右上' },
                { key: 'bottomLeft', pos: 'bottom-0 left-0', label: '左下' },
                { key: 'bottomRight', pos: 'bottom-0 right-0', label: '右下' },
              ].map(({ key, pos, label }) => (
                <div
                  key={key}
                  className={`absolute ${pos} w-3 h-3 bg-blue-500 rounded-full cursor-move transform -translate-x-1/2 -translate-y-1/2`}
                  title={label}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500">
              拖拽角点调整透视
            </div>
          </div>

          {/* 透视预设 */}
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => {
                setPerspectiveSettings({
                  ...perspectiveSettings,
                  topLeft: { x: 10, y: 0 },
                  topRight: { x: 90, y: 0 },
                  bottomLeft: { x: 0, y: 100 },
                  bottomRight: { x: 100, y: 100 },
                });
              }}
              className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] rounded"
            >
              向上收缩
            </button>
            <button
              onClick={() => {
                setPerspectiveSettings({
                  ...perspectiveSettings,
                  topLeft: { x: 0, y: 0 },
                  topRight: { x: 100, y: 0 },
                  bottomLeft: { x: 10, y: 100 },
                  bottomRight: { x: 90, y: 100 },
                });
              }}
              className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] rounded"
            >
              向下收缩
            </button>
            <button
              onClick={() => {
                setPerspectiveSettings({
                  ...perspectiveSettings,
                  topLeft: { x: 0, y: 10 },
                  topRight: { x: 100, y: 0 },
                  bottomLeft: { x: 0, y: 90 },
                  bottomRight: { x: 100, y: 100 },
                });
              }}
              className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] rounded"
            >
              向左收缩
            </button>
          </div>

          <button
            onClick={applyPerspective}
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
          >
            应用透视
          </button>
        </div>
      )}

      {/* 封套面板 */}
      {activeTab === 'envelope' && (
        <div className="space-y-3">
          <div className="text-xs text-gray-400 text-center py-4">
            <Grid className="w-8 h-8 mx-auto mb-2 text-gray-500" />
            <p>封套扭曲功能</p>
            <p className="text-[10px] text-gray-500 mt-1">使用网格变形对象</p>
          </div>

          {/* 网格设置 */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <span className="text-[10px] text-gray-500">行数</span>
              <input
                type="number"
                min="2"
                max="10"
                defaultValue={4}
                className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
              />
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-[10px] text-gray-500">列数</span>
              <input
                type="number"
                min="2"
                max="10"
                defaultValue={4}
                className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <button className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] rounded">
              用网格生成
            </button>
            <button className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] rounded">
              用顶层对象生成
            </button>
          </div>

          <button
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
          >
            创建封套
          </button>
        </div>
      )}

      {/* 通用操作 */}
      <div className="pt-2 border-t border-gray-700 space-y-2">
        {/* 翻转按钮 */}
        <div className="flex gap-2">
          <button
            onClick={() => flipObject('horizontal')}
            className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded flex items-center justify-center gap-1"
          >
            <FlipHorizontal className="w-3 h-3" />
            水平翻转
          </button>
          <button
            onClick={() => flipObject('vertical')}
            className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded flex items-center justify-center gap-1"
          >
            <FlipVertical className="w-3 h-3" />
            垂直翻转
          </button>
        </div>

        {/* 重置按钮 */}
        <button
          onClick={resetTransform}
          className="w-full py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded flex items-center justify-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          重置所有变换
        </button>
      </div>
    </div>
  );
};

export default WarpTransformPanel;
