"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useEditorStore } from "@/store/editor-store";
import * as fabric from "fabric";

// 生成图层预览缩略图
const generateLayerThumbnail = (
  obj: fabric.Object,
  size: number = 32,
): string => {
  try {
    // 创建临时画布
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = size;
    tempCanvas.height = size;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return "";

    // 填充透明背景（棋盘格模式表示透明）
    ctx.fillStyle = "#3a3a3a";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#4a4a4a";
    for (let i = 0; i < size; i += 4) {
      for (let j = 0; j < size; j += 4) {
        if ((i + j) % 8 === 0) {
          ctx.fillRect(i, j, 4, 4);
        }
      }
    }

    // 获取对象边界
    const bounds = obj.getBoundingRect();
    if (!bounds || bounds.width === 0 || bounds.height === 0) return "";

    // 计算缩放比例
    const scale = Math.min(
      (size - 4) / bounds.width,
      (size - 4) / bounds.height,
    );

    // 使用 toCanvasElement 获取对象图像
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objCanvas = obj.toCanvasElement?.({} as any);

    if (objCanvas) {
      const scaledWidth = bounds.width * scale;
      const scaledHeight = bounds.height * scale;
      const offsetX = (size - scaledWidth) / 2;
      const offsetY = (size - scaledHeight) / 2;

      ctx.drawImage(objCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
    }

    return tempCanvas.toDataURL("image/png");
  } catch (e) {
    console.warn("Failed to generate thumbnail:", e);
    return "";
  }
};

import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  MoreHorizontal,
  Layers,
  Image,
  Type,
  Square,
  Circle,
  Triangle,
  Minus,
  PenTool,
} from "lucide-react";
import { BLEND_MODES } from "./types";

interface LayerGroup {
  id: string;
  name: string;
  expanded: boolean;
  children: string[];
  visible: boolean;
  locked: boolean;
  blendMode: string;
  opacity: number;
}

interface ExtendedLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  object: fabric.Object;
  type?: string;
  parentId?: string;
  children?: string[];
  blendMode: string;
  opacity: number;
  hasMask: boolean;
  isClipped: boolean;
}

// 获取图层图标
const getLayerIcon = (type?: string) => {
  switch (type) {
    case "i-text":
    case "text":
    case "textbox":
      return <Type className="w-3 h-3" />;
    case "rect":
      return <Square className="w-3 h-3" />;
    case "circle":
    case "ellipse":
      return <Circle className="w-3 h-3" />;
    case "triangle":
      return <Triangle className="w-3 h-3" />;
    case "line":
      return <Minus className="w-3 h-3" />;
    case "path":
      return <PenTool className="w-3 h-3" />;
    case "image":
      return <Image className="w-3 h-3" />;
    case "group":
      return <Folder className="w-3 h-3" />;
    default:
      return <Layers className="w-3 h-3" />;
  }
};

// 单个图层项组件
const LayerItem: React.FC<{
  layer: ExtendedLayer;
  selected: boolean;
  indentLevel: number;
  isGroup?: boolean;
  isExpanded?: boolean;
  hasChildren?: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRename: (name: string) => void;
  onBlendModeChange: (mode: string) => void;
  onOpacityChange: (opacity: number) => void;
  onCreateMask: () => void;
  onToggleClip: () => void;
  onToggleExpand?: () => void;
}> = ({
  layer,
  selected,
  indentLevel,
  isGroup = false,
  isExpanded = false,
  hasChildren = false,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onDuplicate,
  onRename,
  onBlendModeChange,
  onOpacityChange,
  onCreateMask,
  onToggleClip,
  onToggleExpand,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);
  const [showOptions, setShowOptions] = useState(false);
  const [thumbnail, setThumbnail] = useState<string>("");

  // 生成缩略图
  useEffect(() => {
    if (layer.object) {
      const thumb = generateLayerThumbnail(layer.object, 28);
      setThumbnail(thumb);
    }
  }, [layer.object, layer.visible]);

  const handleRename = () => {
    if (editName.trim()) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`
        group flex flex-col rounded cursor-pointer text-xs
        ${selected ? "bg-blue-600" : "hover:bg-gray-700"}
        ${layer.isClipped ? "border-l-2 border-blue-400" : ""}
      `}
      style={{ marginLeft: indentLevel * 12 }}
    >
      <div className="flex items-center gap-1 px-1.5 py-1" onClick={onSelect}>
        {/* 展开/折叠按钮 (仅 group) */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
            className="p-0.5 hover:bg-gray-600 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-gray-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-400" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* 可见性 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className="p-0.5 hover:bg-gray-600 rounded"
        >
          {layer.visible ? (
            <Eye className="w-3 h-3 text-gray-400" />
          ) : (
            <EyeOff className="w-3 h-3 text-gray-500" />
          )}
        </button>

        {/* 锁定 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          className="p-0.5 hover:bg-gray-600 rounded"
        >
          {layer.locked ? (
            <Lock className="w-3 h-3 text-orange-400" />
          ) : (
            <Unlock className="w-3 h-3 text-gray-500" />
          )}
        </button>

        {/* 预览缩略图 */}
        <div className="w-7 h-7 rounded border border-gray-600 overflow-hidden flex-shrink-0 bg-gray-700">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-contain"
            />
          ) : (
            <span
              className={`flex items-center justify-center w-full h-full ${selected ? "text-white" : "text-gray-400"}`}
            >
              {getLayerIcon(layer.type)}
            </span>
          )}
        </div>

        {/* 名称 */}
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setIsEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-white"
            autoFocus
          />
        ) : (
          <span
            className={`flex-1 truncate ${selected ? "text-white" : "text-gray-300"}`}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              setEditName(layer.name);
            }}
          >
            {layer.name}
          </span>
        )}

        {/* 蒙版指示 */}
        {layer.hasMask && (
          <span className="px-1 py-0.5 text-[9px] bg-purple-600 rounded">
            蒙版
          </span>
        )}

        {/* 更多选项 */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOptions(!showOptions);
            }}
            className="p-0.5 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>
          {showOptions && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-gray-800 border border-gray-600 rounded shadow-lg z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                  setShowOptions(false);
                }}
                className="w-full px-2 py-1 text-left text-xs text-gray-300 hover:bg-gray-700 flex items-center gap-2"
              >
                <Copy className="w-3 h-3" /> 复制图层
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateMask();
                  setShowOptions(false);
                }}
                className="w-full px-2 py-1 text-left text-xs text-gray-300 hover:bg-gray-700 flex items-center gap-2"
              >
                <Square className="w-3 h-3" /> 创建蒙版
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleClip();
                  setShowOptions(false);
                }}
                className="w-full px-2 py-1 text-left text-xs text-gray-300 hover:bg-gray-700 flex items-center gap-2"
              >
                <Layers className="w-3 h-3" />{" "}
                {layer.isClipped ? "释放剪切" : "创建剪切蒙版"}
              </button>
              <div className="border-t border-gray-600" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowOptions(false);
                }}
                className="w-full px-2 py-1 text-left text-xs text-red-400 hover:bg-gray-700 flex items-center gap-2"
              >
                <Trash2 className="w-3 h-3" /> 删除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 展开的选项 - 混合模式和不透明度 */}
      {selected && (
        <div className="px-2 py-1.5 border-t border-gray-600 space-y-1.5 bg-gray-750">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 w-10">混合</span>
            <select
              value={layer.blendMode}
              onChange={(e) => onBlendModeChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-[10px] bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-white"
            >
              {BLEND_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 w-10">透明</span>
            <input
              type="range"
              min="0"
              max="100"
              value={layer.opacity * 100}
              onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 h-1"
            />
            <span className="text-[10px] text-gray-400 w-8 text-right">
              {Math.round(layer.opacity * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// 图层组组件
const LayerGroupItem: React.FC<{
  group: LayerGroup;
  layers: ExtendedLayer[];
  selectedLayerId: string | null;
  onToggleExpand: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onSelectLayer: (id: string) => void;
  onLayerAction: (id: string, action: string, payload?: unknown) => void;
}> = ({
  group,
  layers,
  selectedLayerId,
  onToggleExpand,
  onToggleVisibility,
  onToggleLock,
  onSelectLayer,
  onLayerAction,
}) => {
  const childLayers = layers.filter((l) => group.children.includes(l.id));

  return (
    <div className="border border-gray-600 rounded mb-1">
      <div
        className="flex items-center gap-1 px-1.5 py-1 bg-gray-750 cursor-pointer"
        onClick={onToggleExpand}
      >
        <button className="p-0.5">
          {group.expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className="p-0.5 hover:bg-gray-600 rounded"
        >
          {group.visible ? (
            <Eye className="w-3 h-3 text-gray-400" />
          ) : (
            <EyeOff className="w-3 h-3 text-gray-500" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          className="p-0.5 hover:bg-gray-600 rounded"
        >
          {group.locked ? (
            <Lock className="w-3 h-3 text-orange-400" />
          ) : (
            <Unlock className="w-3 h-3 text-gray-500" />
          )}
        </button>
        {group.expanded ? (
          <FolderOpen className="w-3 h-3 text-yellow-400" />
        ) : (
          <Folder className="w-3 h-3 text-yellow-400" />
        )}
        <span className="flex-1 text-xs text-gray-300 truncate">
          {group.name}
        </span>
        <span className="text-[10px] text-gray-500">{childLayers.length}</span>
      </div>
      {group.expanded && (
        <div className="pl-2 py-1 bg-gray-800">
          {childLayers.map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              selected={selectedLayerId === layer.id}
              indentLevel={0}
              onSelect={() => onSelectLayer(layer.id)}
              onToggleVisibility={() =>
                onLayerAction(layer.id, "toggleVisibility")
              }
              onToggleLock={() => onLayerAction(layer.id, "toggleLock")}
              onDelete={() => onLayerAction(layer.id, "delete")}
              onDuplicate={() => onLayerAction(layer.id, "duplicate")}
              onRename={(name) => onLayerAction(layer.id, "rename", name)}
              onBlendModeChange={(mode) =>
                onLayerAction(layer.id, "blendMode", mode)
              }
              onOpacityChange={(opacity) =>
                onLayerAction(layer.id, "opacity", opacity)
              }
              onCreateMask={() => onLayerAction(layer.id, "createMask")}
              onToggleClip={() => onLayerAction(layer.id, "toggleClip")}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 主图层面板
export const LayersPanelPro: React.FC = () => {
  const {
    canvas,
    layers,
    selectedLayerId,
    setSelectedLayerId,
    toggleLayerVisibility,
    toggleLayerLock,
    deleteLayer,
    duplicateLayer,
    renameLayer,
    updateLayers,
    addToHistory,
    groupSelected,
    ungroupSelected,
  } = useEditorStore();

  const [groups, setGroups] = useState<LayerGroup[]>([]);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());

  // 切换图层展开状态
  const toggleLayerExpand = useCallback((layerId: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  }, []);

  // 转换为扩展图层
  const extendedLayers: ExtendedLayer[] = layers.map((layer) => ({
    ...layer,
    blendMode: layer.blendMode || "normal",
    opacity: layer.opacity || layer.object.opacity || 1,
    hasMask: false,
    isClipped: false,
  }));

  // 获取顶层图层（没有 parentId 的）
  const topLevelLayers = extendedLayers.filter((l) => !l.parentId);

  // 根据 parentId 获取子图层
  const getChildLayers = (parentId: string): ExtendedLayer[] => {
    return extendedLayers.filter((l) => l.parentId === parentId);
  };

  // 处理图层操作
  const handleLayerAction = useCallback(
    (id: string, action: string, payload?: unknown) => {
      const layer = layers.find((l) => l.id === id);
      if (!layer || !canvas) return;

      switch (action) {
        case "toggleVisibility":
          toggleLayerVisibility(id);
          break;
        case "toggleLock":
          toggleLayerLock(id);
          break;
        case "delete":
          deleteLayer(id);
          break;
        case "duplicate":
          duplicateLayer(id);
          break;
        case "rename":
          renameLayer(id, payload as string);
          break;
        case "blendMode":
          // Fabric.js使用globalCompositeOperation实现混合模式
          layer.object.set("globalCompositeOperation", payload as string);
          canvas.renderAll();
          break;
        case "opacity":
          layer.object.set("opacity", payload as number);
          canvas.renderAll();
          addToHistory(JSON.stringify(canvas.toJSON()));
          break;
        case "createMask":
          // 创建蒙版逻辑
          console.log("Create mask for", id);
          break;
        case "toggleClip":
          // 切换剪切蒙版
          console.log("Toggle clip for", id);
          break;
      }
    },
    [
      canvas,
      layers,
      toggleLayerVisibility,
      toggleLayerLock,
      deleteLayer,
      duplicateLayer,
      renameLayer,
      addToHistory,
    ],
  );

  // 创建新图层组
  const createGroup = useCallback(() => {
    if (!canvas) return;
    const selectedObjects = canvas.getActiveObjects();
    if (selectedObjects.length < 2) {
      alert("请选择至少两个对象来创建组");
      return;
    }
    groupSelected();
  }, [canvas, groupSelected]);

  // 递归渲染图层及其子元素
  const renderLayerWithChildren = (
    layer: ExtendedLayer,
    indentLevel: number = 0,
  ): React.ReactNode => {
    const children = layer.children || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedLayers.has(layer.id);
    const childLayers = getChildLayers(layer.id);

    return (
      <React.Fragment key={layer.id}>
        <LayerItem
          layer={layer}
          selected={selectedLayerId === layer.id}
          indentLevel={indentLevel}
          isGroup={layer.type === "group"}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onSelect={() => setSelectedLayerId(layer.id)}
          onToggleVisibility={() => toggleLayerVisibility(layer.id)}
          onToggleLock={() => toggleLayerLock(layer.id)}
          onDelete={() => deleteLayer(layer.id)}
          onDuplicate={() => duplicateLayer(layer.id)}
          onRename={(name) => renameLayer(layer.id, name)}
          onBlendModeChange={(mode) =>
            handleLayerAction(layer.id, "blendMode", mode)
          }
          onOpacityChange={(opacity) =>
            handleLayerAction(layer.id, "opacity", opacity)
          }
          onCreateMask={() => handleLayerAction(layer.id, "createMask")}
          onToggleClip={() => handleLayerAction(layer.id, "toggleClip")}
          onToggleExpand={() => toggleLayerExpand(layer.id)}
        />
        {/* 渲染子元素 */}
        {hasChildren && isExpanded && (
          <div className="border-l border-gray-600 ml-2">
            {childLayers.map((child) =>
              renderLayerWithChildren(child, indentLevel + 1),
            )}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-700">
        <button
          onClick={createGroup}
          className="p-1.5 hover:bg-gray-700 rounded text-gray-400"
          title="创建组"
        >
          <Folder className="w-4 h-4" />
        </button>
        <button
          onClick={() => ungroupSelected()}
          className="p-1.5 hover:bg-gray-700 rounded text-gray-400"
          title="解组"
        >
          <FolderOpen className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => {
            if (selectedLayerId) deleteLayer(selectedLayerId);
          }}
          className="p-1.5 hover:bg-red-900 rounded text-gray-400"
          title="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            if (selectedLayerId) duplicateLayer(selectedLayerId);
          }}
          className="p-1.5 hover:bg-gray-700 rounded text-gray-400"
          title="复制"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            // 添加新图层逻辑
          }}
          className="p-1.5 hover:bg-gray-700 rounded text-gray-400"
          title="新建图层"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* 图层列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {layers.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-4">没有对象</div>
        ) : (
          <div className="space-y-0.5">
            {/* 渲染顶层图层（递归显示子元素） */}
            {topLevelLayers.map((layer) => renderLayerWithChildren(layer, 0))}
          </div>
        )}
      </div>

      {/* 底部混合模式选择 */}
      {selectedLayerId && (
        <div className="p-2 border-t border-gray-700 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">全局混合</span>
            <select
              className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
              defaultValue="normal"
            >
              {BLEND_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayersPanelPro;
