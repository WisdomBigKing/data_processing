"use client";

import React from "react";
import { useEditorStore } from "@/store/editor-store";
import type { ToolType } from "./types";
import {
  MousePointer2,
  Type,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Pencil,
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  Image,
  Trash2,
  Copy,
  Clipboard,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Group,
  Ungroup,
} from "lucide-react";

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  label,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg transition-all duration-200 flex flex-col items-center justify-center ${
      active
        ? "bg-blue-500 text-white shadow-md"
        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
    }`}
    title={label}
  >
    {icon}
  </button>
);

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
  disabled,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-lg transition-all duration-200 ${
      disabled
        ? "bg-gray-50 text-gray-300 cursor-not-allowed"
        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
    }`}
    title={label}
  >
    {icon}
  </button>
);

interface ToolbarProps {
  onImportSVG: () => void;
  onImportImage: () => void;
  onExport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onImportSVG,
  onImportImage,
  onExport,
}) => {
  const {
    canvas,
    activeTool,
    setActiveTool,
    zoom,
    setZoom,
    undo,
    redo,
    history,
    historyIndex,
    updateLayers,
    addToHistory,
  } = useEditorStore();

  const tools: { type: ToolType; icon: React.ReactNode; label: string }[] = [
    { type: "select", icon: <MousePointer2 size={20} />, label: "选择工具" },
    { type: "text", icon: <Type size={20} />, label: "文本工具" },
    { type: "rectangle", icon: <Square size={20} />, label: "矩形工具" },
    { type: "circle", icon: <Circle size={20} />, label: "圆形工具" },
    { type: "line", icon: <Minus size={20} />, label: "线条工具" },
    { type: "arrow", icon: <ArrowRight size={20} />, label: "箭头工具" },
    { type: "pencil", icon: <Pencil size={20} />, label: "自由绘制" },
    { type: "eraser", icon: <Eraser size={20} />, label: "橡皮擦" },
  ];

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.1, 5);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.1, 0.1);
    setZoom(newZoom);
  };

  const handleCopy = async () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      const cloned = await activeObj.clone();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)._clipboard = cloned;
    }
  };

  const handlePaste = async () => {
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clipboard = (window as any)._clipboard;
    if (clipboard) {
      const cloned = await clipboard.clone();
      canvas.discardActiveObject();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
        evented: true,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
      updateLayers();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  };

  const handleDelete = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (
        activeObj.type === "activeSelection" &&
        (activeObj as any).forEachObject
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (activeObj as any).forEachObject((obj: any) => {
          canvas.remove(obj);
        });
      } else {
        canvas.remove(activeObj);
      }
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      updateLayers();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  };

  const handleRotate = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.rotate((activeObj.angle || 0) + 90);
      canvas.requestRenderAll();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  };

  const handleFlipH = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.set("flipX", !activeObj.flipX);
      canvas.requestRenderAll();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  };

  const handleFlipV = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.set("flipY", !activeObj.flipY);
      canvas.requestRenderAll();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  };

  const handleGroup = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (
      activeObj &&
      activeObj.type === "activeSelection" &&
      (activeObj as any).toGroup
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (activeObj as any).toGroup();
      canvas.requestRenderAll();
      updateLayers();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  };

  const handleUngroup = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (
      activeObj &&
      activeObj.type === "group" &&
      (activeObj as any).toActiveSelection
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (activeObj as any).toActiveSelection();
      canvas.requestRenderAll();
      updateLayers();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-3 flex items-center gap-4 flex-wrap">
      {/* Drawing Tools */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
        {tools.map((tool) => (
          <ToolButton
            key={tool.type}
            tool={tool.type}
            icon={tool.icon}
            label={tool.label}
            active={activeTool === tool.type}
            onClick={() => setActiveTool(tool.type)}
          />
        ))}
      </div>

      {/* History Actions */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
        <ActionButton
          icon={<Undo2 size={20} />}
          label="撤销"
          onClick={undo}
          disabled={historyIndex <= 0}
        />
        <ActionButton
          icon={<Redo2 size={20} />}
          label="重做"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
        />
      </div>

      {/* Edit Actions */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
        <ActionButton
          icon={<Copy size={20} />}
          label="复制"
          onClick={handleCopy}
        />
        <ActionButton
          icon={<Clipboard size={20} />}
          label="粘贴"
          onClick={handlePaste}
        />
        <ActionButton
          icon={<Trash2 size={20} />}
          label="删除"
          onClick={handleDelete}
        />
      </div>

      {/* Transform Actions */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
        <ActionButton
          icon={<RotateCw size={20} />}
          label="旋转90°"
          onClick={handleRotate}
        />
        <ActionButton
          icon={<FlipHorizontal size={20} />}
          label="水平翻转"
          onClick={handleFlipH}
        />
        <ActionButton
          icon={<FlipVertical size={20} />}
          label="垂直翻转"
          onClick={handleFlipV}
        />
        <ActionButton
          icon={<Group size={20} />}
          label="组合"
          onClick={handleGroup}
        />
        <ActionButton
          icon={<Ungroup size={20} />}
          label="取消组合"
          onClick={handleUngroup}
        />
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
        <ActionButton
          icon={<ZoomOut size={20} />}
          label="缩小"
          onClick={handleZoomOut}
        />
        <span className="px-2 text-sm font-medium text-gray-600 min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <ActionButton
          icon={<ZoomIn size={20} />}
          label="放大"
          onClick={handleZoomIn}
        />
      </div>

      {/* Import/Export */}
      <div className="flex items-center gap-1">
        <ActionButton
          icon={<Upload size={20} />}
          label="导入SVG"
          onClick={onImportSVG}
        />
        <ActionButton
          icon={<Image size={20} />}
          label="导入图片"
          onClick={onImportImage}
        />
        <ActionButton
          icon={<Download size={20} />}
          label="导出图片"
          onClick={onExport}
        />
      </div>
    </div>
  );
};
