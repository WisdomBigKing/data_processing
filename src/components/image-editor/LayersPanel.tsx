'use client';

import React from 'react';
import { useEditorStore } from '@/store/editor-store';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Trash2,
  Type,
  Square,
  Circle,
  Minus,
  Image,
  Layers,
  PenTool,
} from 'lucide-react';

const getLayerIcon = (type: string | undefined) => {
  switch (type) {
    case 'i-text':
    case 'text':
    case 'textbox':
      return <Type size={14} />;
    case 'rect':
      return <Square size={14} />;
    case 'circle':
      return <Circle size={14} />;
    case 'line':
      return <Minus size={14} />;
    case 'image':
      return <Image size={14} />;
    case 'group':
      return <Layers size={14} />;
    case 'path':
      return <PenTool size={14} />;
    default:
      return <Square size={14} />;
  }
};

export const LayersPanel: React.FC = () => {
  const {
    layers,
    selectedLayerId,
    setSelectedLayerId,
    toggleLayerVisibility,
    toggleLayerLock,
    moveLayerUp,
    moveLayerDown,
    deleteLayer,
  } = useEditorStore();

  if (layers.length === 0) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Layers size={20} />
          图层
        </h3>
        <p className="text-sm text-gray-500">暂无图层，添加元素后将显示在此处</p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Layers size={20} />
          图层
        </h3>
        <p className="text-xs text-gray-500 mt-1">{layers.length} 个图层</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            onClick={() => setSelectedLayerId(layer.id)}
            className={`flex items-center gap-2 p-2 border-b border-gray-100 cursor-pointer transition-colors ${
              selectedLayerId === layer.id
                ? 'bg-blue-50 border-l-4 border-l-blue-500'
                : 'hover:bg-gray-50'
            }`}
          >
            {/* Layer Icon */}
            <div className="w-6 h-6 flex items-center justify-center text-gray-500">
              {getLayerIcon(layer.object.type)}
            </div>

            {/* Layer Name */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate">{layer.name}</p>
            </div>

            {/* Layer Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
                className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                  layer.visible ? 'text-gray-600' : 'text-gray-300'
                }`}
                title={layer.visible ? '隐藏图层' : '显示图层'}
              >
                {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerLock(layer.id);
                }}
                className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                  layer.locked ? 'text-orange-500' : 'text-gray-600'
                }`}
                title={layer.locked ? '解锁图层' : '锁定图层'}
              >
                {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Layer Controls */}
      {selectedLayerId && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => moveLayerUp(selectedLayerId)}
              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
              title="上移图层"
            >
              <ChevronUp size={16} />
            </button>
            <button
              onClick={() => moveLayerDown(selectedLayerId)}
              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
              title="下移图层"
            >
              <ChevronDown size={16} />
            </button>
            <button
              onClick={() => deleteLayer(selectedLayerId)}
              className="p-2 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 transition-colors"
              title="删除图层"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
