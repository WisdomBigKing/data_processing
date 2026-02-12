'use client';

import React, { useState, useCallback } from 'react';
import { useEditorStore } from '@/store/editor-store';
import * as fabric from 'fabric';
import { 
  Plus, Trash2, Copy, Eye, EyeOff, Lock, Unlock,
  ChevronDown, ChevronRight, Layout, Maximize2, Settings,
  Monitor, Smartphone, Tablet, FileImage
} from 'lucide-react';
import { CANVAS_PRESETS } from './types';
import type { Artboard } from './types';

// 画板预设
const ARTBOARD_PRESETS = [
  { name: 'Web 1920×1080', width: 1920, height: 1080, icon: Monitor },
  { name: 'Web 1280×720', width: 1280, height: 720, icon: Monitor },
  { name: 'iPhone 14', width: 390, height: 844, icon: Smartphone },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932, icon: Smartphone },
  { name: 'iPad Pro 12.9"', width: 1024, height: 1366, icon: Tablet },
  { name: 'A4 纵向', width: 595, height: 842, icon: FileImage },
  { name: 'A4 横向', width: 842, height: 595, icon: FileImage },
  { name: '正方形 1080', width: 1080, height: 1080, icon: Layout },
  { name: 'Instagram Story', width: 1080, height: 1920, icon: Smartphone },
  { name: '名片', width: 255, height: 150, icon: FileImage },
];

interface ArtboardItemProps {
  artboard: Artboard;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRename: (name: string) => void;
  onResize: (width: number, height: number) => void;
}

const ArtboardItem: React.FC<ArtboardItemProps> = ({
  artboard,
  isActive,
  onSelect,
  onDelete,
  onDuplicate,
  onRename,
  onResize,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(artboard.name);
  const [expanded, setExpanded] = useState(false);

  const handleRename = () => {
    if (editName.trim()) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className={`border rounded mb-1 ${isActive ? 'border-blue-500 bg-gray-750' : 'border-gray-600 bg-gray-800'}`}>
      <div 
        className="flex items-center gap-1 px-2 py-1.5 cursor-pointer"
        onClick={onSelect}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="p-0.5"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        
        <Layout className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
        
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-white"
            autoFocus
          />
        ) : (
          <span
            className={`flex-1 text-xs truncate ${isActive ? 'text-white' : 'text-gray-300'}`}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              setEditName(artboard.name);
            }}
          >
            {artboard.name}
          </span>
        )}

        <span className="text-[10px] text-gray-500">
          {artboard.width}×{artboard.height}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="p-0.5 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100"
          title="复制"
        >
          <Copy className="w-3 h-3 text-gray-400" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-0.5 hover:bg-red-900 rounded"
          title="删除"
        >
          <Trash2 className="w-3 h-3 text-red-400" />
        </button>
      </div>

      {expanded && (
        <div className="px-2 pb-2 space-y-2 border-t border-gray-600">
          <div className="flex gap-2 pt-2">
            <div className="flex-1">
              <span className="text-[10px] text-gray-500">宽度</span>
              <input
                type="number"
                min="1"
                max="10000"
                value={artboard.width}
                onChange={(e) => onResize(Number(e.target.value), artboard.height)}
                className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
              />
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-gray-500">高度</span>
              <input
                type="number"
                min="1"
                max="10000"
                value={artboard.height}
                onChange={(e) => onResize(artboard.width, Number(e.target.value))}
                className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <span className="text-[10px] text-gray-500">X</span>
              <input
                type="number"
                value={artboard.x}
                className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                readOnly
              />
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-gray-500">Y</span>
              <input
                type="number"
                value={artboard.y}
                className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                readOnly
              />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-gray-500">背景色</span>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={artboard.backgroundColor}
                className="w-8 h-6 rounded cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                value={artboard.backgroundColor}
                className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white font-mono"
                readOnly
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ArtboardPanel: React.FC = () => {
  const { canvas, canvasWidth, canvasHeight, setCanvasSize, addToHistory } = useEditorStore();
  const [artboards, setArtboards] = useState<Artboard[]>([
    {
      id: 'artboard-1',
      name: '画板 1',
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: '#FFFFFF',
      objects: [],
    }
  ]);
  const [activeArtboardId, setActiveArtboardId] = useState('artboard-1');
  const [showPresets, setShowPresets] = useState(false);

  // 创建新画板
  const createArtboard = useCallback((preset?: typeof ARTBOARD_PRESETS[0]) => {
    const newArtboard: Artboard = {
      id: `artboard-${Date.now()}`,
      name: `画板 ${artboards.length + 1}`,
      x: artboards.length * 100,
      y: artboards.length * 50,
      width: preset?.width || canvasWidth,
      height: preset?.height || canvasHeight,
      backgroundColor: '#FFFFFF',
      objects: [],
    };
    
    setArtboards([...artboards, newArtboard]);
    setActiveArtboardId(newArtboard.id);
    
    // 更新画布大小为新画板大小
    if (preset) {
      setCanvasSize(preset.width, preset.height);
    }
  }, [artboards, canvasWidth, canvasHeight, setCanvasSize]);

  // 删除画板
  const deleteArtboard = useCallback((id: string) => {
    if (artboards.length <= 1) {
      alert('至少保留一个画板');
      return;
    }
    
    const newArtboards = artboards.filter(a => a.id !== id);
    setArtboards(newArtboards);
    
    if (activeArtboardId === id) {
      setActiveArtboardId(newArtboards[0].id);
    }
  }, [artboards, activeArtboardId]);

  // 复制画板
  const duplicateArtboard = useCallback((id: string) => {
    const artboard = artboards.find(a => a.id === id);
    if (!artboard) return;

    const newArtboard: Artboard = {
      ...artboard,
      id: `artboard-${Date.now()}`,
      name: `${artboard.name} 副本`,
      x: artboard.x + 50,
      y: artboard.y + 50,
    };

    setArtboards([...artboards, newArtboard]);
  }, [artboards]);

  // 重命名画板
  const renameArtboard = useCallback((id: string, name: string) => {
    setArtboards(artboards.map(a => a.id === id ? { ...a, name } : a));
  }, [artboards]);

  // 调整画板大小
  const resizeArtboard = useCallback((id: string, width: number, height: number) => {
    setArtboards(artboards.map(a => a.id === id ? { ...a, width, height } : a));
    
    // 如果是当前活动画板，更新画布大小
    if (id === activeArtboardId) {
      setCanvasSize(width, height);
    }
  }, [artboards, activeArtboardId, setCanvasSize]);

  // 选择画板
  const selectArtboard = useCallback((id: string) => {
    setActiveArtboardId(id);
    
    const artboard = artboards.find(a => a.id === id);
    if (artboard) {
      setCanvasSize(artboard.width, artboard.height);
    }
  }, [artboards, setCanvasSize]);

  return (
    <div className="p-3 space-y-3">
      {/* 工具栏 */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => createArtboard()}
          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded flex items-center justify-center gap-1"
        >
          <Plus className="w-3 h-3" />
          新建画板
        </button>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
          title="预设"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* 预设面板 */}
      {showPresets && (
        <div className="space-y-1 p-2 bg-gray-750 rounded border border-gray-600">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">快速创建</span>
          <div className="grid grid-cols-2 gap-1">
            {ARTBOARD_PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.name}
                  onClick={() => { createArtboard(preset); setShowPresets(false); }}
                  className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] rounded truncate"
                >
                  <Icon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 画板列表 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">画板 ({artboards.length})</span>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {artboards.map((artboard) => (
            <ArtboardItem
              key={artboard.id}
              artboard={artboard}
              isActive={artboard.id === activeArtboardId}
              onSelect={() => selectArtboard(artboard.id)}
              onDelete={() => deleteArtboard(artboard.id)}
              onDuplicate={() => duplicateArtboard(artboard.id)}
              onRename={(name) => renameArtboard(artboard.id, name)}
              onResize={(width, height) => resizeArtboard(artboard.id, width, height)}
            />
          ))}
        </div>
      </div>

      {/* 当前画板信息 */}
      <div className="pt-2 border-t border-gray-700 space-y-2">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">当前画板</span>
        <div className="flex gap-2">
          <div className="flex-1">
            <span className="text-[10px] text-gray-400">宽度</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="10000"
                value={canvasWidth}
                onChange={(e) => setCanvasSize(Number(e.target.value), canvasHeight)}
                className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
              />
              <span className="text-[10px] text-gray-500">px</span>
            </div>
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-gray-400">高度</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="10000"
                value={canvasHeight}
                onChange={(e) => setCanvasSize(canvasWidth, Number(e.target.value))}
                className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
              />
              <span className="text-[10px] text-gray-500">px</span>
            </div>
          </div>
        </div>

        {/* 常用尺寸快捷按钮 */}
        <div className="flex flex-wrap gap-1">
          {[
            { label: '1920×1080', w: 1920, h: 1080 },
            { label: '1280×720', w: 1280, h: 720 },
            { label: '1080×1080', w: 1080, h: 1080 },
            { label: 'A4', w: 595, h: 842 },
          ].map(({ label, w, h }) => (
            <button
              key={label}
              onClick={() => setCanvasSize(w, h)}
              className={`px-2 py-1 text-[10px] rounded ${
                canvasWidth === w && canvasHeight === h
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 适应画布按钮 */}
      <button
        onClick={() => {
          if (canvas) {
            // 缩放以适应视图
            const zoom = Math.min(
              (canvas.width || 800) / canvasWidth,
              (canvas.height || 600) / canvasHeight
            ) * 0.9;
            canvas.setZoom(zoom);
            canvas.renderAll();
          }
        }}
        className="w-full py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded flex items-center justify-center gap-1"
      >
        <Maximize2 className="w-3 h-3" />
        适应视图
      </button>
    </div>
  );
};

export default ArtboardPanel;
