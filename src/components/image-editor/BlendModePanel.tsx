'use client';

import React, { useCallback } from 'react';
import { useEditorStore } from '@/store/editor-store';
import { BLEND_MODES } from './types';

// 混合模式分类
const BLEND_MODE_CATEGORIES = {
  normal: ['normal'],
  darken: ['darken', 'multiply', 'color-burn'],
  lighten: ['lighten', 'screen', 'color-dodge'],
  contrast: ['overlay', 'soft-light', 'hard-light'],
  inversion: ['difference', 'exclusion'],
  component: ['hue', 'saturation', 'color', 'luminosity'],
};

// 混合模式中文名称
const BLEND_MODE_NAMES: Record<string, string> = {
  'normal': '正常',
  'multiply': '正片叠底',
  'screen': '滤色',
  'overlay': '叠加',
  'darken': '变暗',
  'lighten': '变亮',
  'color-dodge': '颜色减淡',
  'color-burn': '颜色加深',
  'hard-light': '强光',
  'soft-light': '柔光',
  'difference': '差值',
  'exclusion': '排除',
  'hue': '色相',
  'saturation': '饱和度',
  'color': '颜色',
  'luminosity': '明度',
};

// 混合模式预览组件
const BlendModePreview: React.FC<{ mode: string; selected: boolean; onClick: () => void }> = ({ 
  mode, 
  selected, 
  onClick 
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs
        ${selected ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}
      `}
    >
      <div 
        className="w-6 h-6 rounded border border-gray-500 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #3B82F6 50%, #EF4444 50%)' }}
      >
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'linear-gradient(45deg, #10B981 50%, transparent 50%)',
            mixBlendMode: mode as React.CSSProperties['mixBlendMode'],
          }}
        />
      </div>
      <span className="flex-1 text-left">{BLEND_MODE_NAMES[mode] || mode}</span>
    </button>
  );
};

export const BlendModePanel: React.FC = () => {
  const { canvas, activeObject, addToHistory } = useEditorStore();
  const [currentMode, setCurrentMode] = React.useState('normal');
  const [opacity, setOpacity] = React.useState(100);

  // 从活动对象读取混合模式
  React.useEffect(() => {
    if (activeObject) {
      const mode = activeObject.globalCompositeOperation || 'normal';
      setCurrentMode(mode);
      setOpacity((activeObject.opacity || 1) * 100);
    }
  }, [activeObject]);

  // 应用混合模式
  const applyBlendMode = useCallback((mode: string) => {
    if (!canvas || !activeObject) return;
    
    activeObject.set('globalCompositeOperation', mode);
    canvas.renderAll();
    setCurrentMode(mode);
    addToHistory(JSON.stringify(canvas.toJSON()));
  }, [canvas, activeObject, addToHistory]);

  // 应用不透明度
  const applyOpacity = useCallback((value: number) => {
    if (!canvas || !activeObject) return;
    
    activeObject.set('opacity', value / 100);
    canvas.renderAll();
    setOpacity(value);
    addToHistory(JSON.stringify(canvas.toJSON()));
  }, [canvas, activeObject, addToHistory]);

  if (!activeObject) {
    return (
      <div className="p-3 text-xs text-gray-500 text-center">
        选择对象以设置混合模式
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {/* 不透明度 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">不透明度</span>
          <span className="text-xs text-gray-400">{Math.round(opacity)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => applyOpacity(Number(e.target.value))}
          className="w-full h-1.5"
        />
      </div>

      {/* 混合模式分类 */}
      <div className="space-y-2">
        {/* 正常 */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">正常</div>
          {BLEND_MODE_CATEGORIES.normal.map(mode => (
            <BlendModePreview
              key={mode}
              mode={mode}
              selected={currentMode === mode}
              onClick={() => applyBlendMode(mode)}
            />
          ))}
        </div>

        {/* 变暗 */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">变暗</div>
          {BLEND_MODE_CATEGORIES.darken.map(mode => (
            <BlendModePreview
              key={mode}
              mode={mode}
              selected={currentMode === mode}
              onClick={() => applyBlendMode(mode)}
            />
          ))}
        </div>

        {/* 变亮 */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">变亮</div>
          {BLEND_MODE_CATEGORIES.lighten.map(mode => (
            <BlendModePreview
              key={mode}
              mode={mode}
              selected={currentMode === mode}
              onClick={() => applyBlendMode(mode)}
            />
          ))}
        </div>

        {/* 对比 */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">对比</div>
          {BLEND_MODE_CATEGORIES.contrast.map(mode => (
            <BlendModePreview
              key={mode}
              mode={mode}
              selected={currentMode === mode}
              onClick={() => applyBlendMode(mode)}
            />
          ))}
        </div>

        {/* 反相 */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">反相</div>
          {BLEND_MODE_CATEGORIES.inversion.map(mode => (
            <BlendModePreview
              key={mode}
              mode={mode}
              selected={currentMode === mode}
              onClick={() => applyBlendMode(mode)}
            />
          ))}
        </div>

        {/* 组件 */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">组件</div>
          {BLEND_MODE_CATEGORIES.component.map(mode => (
            <BlendModePreview
              key={mode}
              mode={mode}
              selected={currentMode === mode}
              onClick={() => applyBlendMode(mode)}
            />
          ))}
        </div>
      </div>

      {/* 快速选择 */}
      <div className="pt-2 border-t border-gray-700">
        <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">快速选择</div>
        <div className="grid grid-cols-4 gap-1">
          {['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'difference', 'color'].map(mode => (
            <button
              key={mode}
              onClick={() => applyBlendMode(mode)}
              className={`
                px-1 py-1.5 text-[10px] rounded
                ${currentMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
              `}
            >
              {BLEND_MODE_NAMES[mode]?.substring(0, 2) || mode.substring(0, 2)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlendModePanel;
